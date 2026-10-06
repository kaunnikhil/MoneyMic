import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { simulationStore } from './server/simulationStore';
import { agentEngine } from './server/agentEngine';
import { Transaction, SimulationStateNum } from './src/types/simulation';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3002;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for audio & CSV uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// --- SIMULATION (AGENT-FACING) ENDPOINTS ---
app.get('/api/simulation/state', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(simulationStore.getSimulationState());
});

// Start Scenario: begins at State 0 Setup
app.post('/api/simulation/start', (_req, res) => {
  const state = simulationStore.startScenario();
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, state });
});

// Reset Scenario: resets completely to clean state
app.post('/api/simulation/reset', (req, res) => {
  const targetState = (req.body.targetState ?? 1) as SimulationStateNum;
  const state = simulationStore.resetScenario(targetState);
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, state });
});

app.post('/api/simulation/step', async (req, res) => {
  const prompt = req.body.prompt || 'Continue autonomous financial processing for Aarav according to MoneyMic L3 state rules.';
  const result = await agentEngine.runAgentLoop(prompt, 5);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    ...result,
    state: simulationStore.getSimulationState(),
  });
});

// --- OPERATOR ENDPOINTS (STRICTLY ISOLATED FROM GEMINI) ---
app.get('/api/operator/ground-truth', (_req, res) => {
  // Returns operator-only data store. NEVER exposed to Gemini agent!
  res.setHeader('Content-Type', 'application/json');
  res.json(simulationStore.getOperatorStore());
});

app.post('/api/operator/configure-connector', (req, res) => {
  const { delhiveryEnabled, pineLabsMode } = req.body;
  if (delhiveryEnabled !== undefined) {
    simulationStore.toggleDelhivery(Boolean(delhiveryEnabled));
  }
  if (pineLabsMode) {
    simulationStore.setPineLabsMode(pineLabsMode);
  }
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    operatorStore: simulationStore.getOperatorStore(),
    state: simulationStore.getSimulationState(),
  });
});

app.post('/api/operator/inject-event', async (req, res) => {
  const { transaction, triggerAgent = true } = req.body;

  if (!transaction || !transaction.id || !transaction.amount || !transaction.payee) {
    res.status(400).json({ error: 'Missing required transaction fields (id, amount, payee)' });
    return;
  }

  // Operator delivers RAW external event only.
  // Transaction meaning, category, expected outcome or user intent are NOT accepted.
  const txn: Transaction = {
    id: transaction.id,
    timestamp: transaction.timestamp || new Date().toISOString(),
    amount: Number(transaction.amount),
    currency: transaction.currency || 'INR',
    direction: transaction.direction || 'DEBIT',
    payee: transaction.payee,
    paymentType: transaction.paymentType || 'UPI',
    status: transaction.status || 'PENDING',
    source: transaction.source || 'EXTERNAL_FEED',
    rawMetadata: transaction.rawMetadata || {},
    // Information status discipline: amount is verified from the feed, purpose & category are UNKNOWN until resolved
    amountStatus: 'VERIFIED',
    purposeStatus: 'UNKNOWN',
    categoryStatus: 'UNKNOWN',
  };

  simulationStore.addTransaction(txn);

  // Log raw outside-world event in connector trace
  simulationStore.logConnector({
    connector: txn.paymentType === 'POS' ? 'PINE_LABS' : 'BANK_INGESTION',
    mode: txn.paymentType === 'POS' ? 'WIZARD_OF_OZ' : 'REAL',
    endpoint: `/events/inbound/${txn.source.toLowerCase()}`,
    method: 'POST',
    request: {
      transactionId: txn.id,
      amount: txn.amount,
      currency: txn.currency,
      payee: txn.payee,
      direction: txn.direction,
      source: txn.source,
      rawMetadata: txn.rawMetadata,
    },
    response: { ingested: true, transactionId: txn.id, status: 'QUEUED_FOR_VERIFICATION' },
    status: 200,
    latencyMs: 12,
    notes: `External financial event arrived: ${txn.payee} (₹${txn.amount})`,
  });

  // Transition to State 2 (Ingestion / Event Verification) if currently in Monitoring
  const currentState = simulationStore.getSimulationState().currentState;
  if (currentState === 1) {
    simulationStore.validateAndSetState(
      2,
      `Outside-world event arrived: Ingesting transaction ${txn.id} [${txn.payee} - ₹${txn.amount}]`,
      'EXTERNAL_EVENT'
    );
  }

  let agentResult = null;
  if (triggerAgent) {
    const triggerPrompt = `EXTERNAL RAW FINANCIAL EVENT:
Transaction ID: ${txn.id}
Date/Timestamp: ${txn.timestamp}
Amount: ₹${txn.amount} ${txn.currency}
Direction: ${txn.direction}
Payee: ${txn.payee}
Payment Type: ${txn.paymentType}
Status: ${txn.status}
Source: ${txn.source}
Raw Narration: ${txn.rawMetadata?.narration || 'NONE'}

Amount and transaction status: VERIFIED
Payee: Known only from raw transaction
Purpose: UNKNOWN
Existing verified context: Does not establish the purpose
Monthly Dining Intention: ₹2,000 (October 2026)

Current State: State 2 (Ingestion / Event Verification).
Evaluate transaction metadata and existing verified context against your decision rules.
Independently decide whether the missing purpose is material enough to justify a Gnani clarification request.
If clarification is necessary, transition to State 5 (Context Intervention) via 'record_decision' and dispatch a clarification request to Aarav via 'send_user_notification' with requires_audio=true.
If context is sufficient or uncertainty is low-impact, park uncertainty or stay silent.`;

    agentResult = await agentEngine.runAgentLoop(triggerPrompt, 6);
  }

  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    transaction: txn,
    agentResult,
    state: simulationStore.getSimulationState(),
  });
});

app.post('/api/operator/respond-user', async (req, res) => {
  const { interactionId, responseType, payload, audioAssetId, audioTranscript, triggerAgent = true } = req.body;

  const interaction = simulationStore.resolveUserInteraction(
    interactionId,
    responseType,
    payload,
    audioAssetId,
    audioTranscript
  );

  if (!interaction) {
    res.status(404).json({ error: 'Pending user interaction not found' });
    return;
  }

  // Transition to State 8 (User Response)
  simulationStore.validateAndSetState(
    8,
    `User responded with ${responseType}${audioAssetId ? ` [Voice Asset: ${audioAssetId}]` : ''}`,
    'SERVER_ENFORCED'
  );

  let agentResult = null;
  if (triggerAgent) {
    const triggerPrompt = `USER RESPONSE RECEIVED for interaction [${interactionId}]:
Response Type: ${responseType}
Payload: ${JSON.stringify(payload || {})}
Audio Asset ID: ${audioAssetId || 'NONE'}

You are now in State 8 (User Response).
An audio asset has been supplied. Independently decide your next actions based on your context-confidence rules.
If you call 'gnani_transcribe', the exact STT result will be returned to you without server paraphrasing or alteration.
After receiving the transcript, independently interpret whether the information is sufficient to resolve the transaction.
If sufficient, continue naturally according to the MoneyMic state machine: update transaction context via 'update_transaction_context', evaluate spending pace via 'evaluate_spending_pace' (State 6), record decisions via 'record_decision' (State 7), commit verified memory via 'update_financial_memory' (State 11), and return to monitoring (State 1).
If insufficient, you may ask for one narrower clarification (State 5 retry) or park the transaction as UNRESOLVED (State 1).`;

    agentResult = await agentEngine.runAgentLoop(triggerPrompt, 8);
  }

  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    interaction,
    agentResult,
    state: simulationStore.getSimulationState(),
  });
});

// CSV Upload & Parsing
app.post('/api/operator/upload-csv', upload.single('csvFile'), (req, res) => {
  let csvText = '';
  if (req.file) {
    csvText = req.file.buffer.toString('utf-8');
  } else if (req.body.csvText) {
    csvText = req.body.csvText;
  } else {
    res.status(400).json({ error: 'No CSV file or text provided' });
    return;
  }

  try {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      res.status(400).json({ error: 'CSV must contain a header row and at least 1 data row.' });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const parsedTransactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
      if (row.length < 3) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = row[idx] || '';
      });

      const id = rowObj['transaction id'] || rowObj['transaction_id'] || rowObj['id'] || `txn_csv_${Date.now()}_${i}`;
      const timestamp = rowObj['timestamp'] || rowObj['date'] || new Date().toISOString();
      const amount = parseFloat(rowObj['amount']?.replace(/[^0-9.]/g, '') || '0');
      const direction = (rowObj['direction']?.toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT') as Transaction['direction'];
      const payee = rowObj['payee/merchant'] || rowObj['payee'] || rowObj['merchant'] || rowObj['narration'] || 'UNKNOWN_PAYEE';
      const paymentType = (rowObj['payment type'] || rowObj['payment_type'] || rowObj['type'] || 'UPI').toUpperCase() as Transaction['paymentType'];
      const status = (rowObj['status'] || 'PENDING').toUpperCase() as Transaction['status'];
      const source = rowObj['source'] || 'CSV_STATEMENT_FEED';

      parsedTransactions.push({
        id,
        timestamp,
        amount,
        currency: 'INR',
        direction,
        payee,
        paymentType: ['UPI', 'CARD', 'NET_BANKING', 'POS', 'AUTOPAY'].includes(paymentType) ? paymentType : 'UPI',
        status: ['PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_CLARIFICATION', 'SETTLED', 'UNRESOLVED'].includes(status) ? status : 'PENDING',
        source,
        rawMetadata: { originalCsvRow: rowObj },
        amountStatus: 'VERIFIED',
        purposeStatus: 'UNKNOWN',
        categoryStatus: 'UNKNOWN',
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      totalRows: parsedTransactions.length,
      transactions: parsedTransactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to parse CSV', details: err.message });
  }
});

// Audio Upload & Storage
app.post('/api/operator/upload-audio', upload.single('audioFile'), (req, res) => {
  const file = req.file;
  const { assetId, fileName, languageCode = 'en-IN', storedTranscript = '' } = req.body;

  const id = assetId || `audio_${Date.now()}`;
  const name = fileName || file?.originalname || 'voice_clarification.mp3';
  const mime = file?.mimetype || 'audio/mp3';

  let buffer: Buffer;
  if (file) {
    buffer = file.buffer;
  } else if (req.body.dataBase64) {
    buffer = Buffer.from(req.body.dataBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
  } else {
    buffer = Buffer.from('RIFF....WAVEfmt ....data....');
  }

  const asset = {
    id,
    fileName: name,
    mimeType: mime,
    durationSeconds: 5.0,
    uploadedAt: new Date().toISOString(),
    languageCode,
    storedTranscript: storedTranscript || '',
    url: `/api/audio/${id}`,
  };

  simulationStore.registerAudioAsset(asset, buffer);

  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    asset,
  });
});

// Stream Audio file
app.get('/api/audio/:id', (req, res) => {
  const audioInfo = simulationStore.getAudioBuffer(req.params.id);
  if (!audioInfo) {
    res.setHeader('Content-Type', 'audio/wav');
    res.send(Buffer.alloc(100));
    return;
  }
  res.setHeader('Content-Type', audioInfo.mimeType);
  res.send(audioInfo.buffer);
});

// Unmatched API route catch-all: always return JSON 404, never fallback to HTML
app.all('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Vite Middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MoneyMic Agent Simulator listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
