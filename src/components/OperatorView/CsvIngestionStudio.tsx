import React, { useState } from 'react';
import { Transaction } from '../../types/simulation';
import { FileSpreadsheet, Upload, Send, FileText, CheckCircle2 } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

interface CsvIngestionStudioProps {
  onInjectEvent: (txn: Transaction) => void;
  isProcessing: boolean;
}

export const CsvIngestionStudio: React.FC<CsvIngestionStudioProps> = ({
  onInjectEvent,
  isProcessing,
}) => {
  const [parsedRows, setParsedRows] = useState<Transaction[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const sampleCsvContent = `Transaction ID,Timestamp,Amount,Direction,Payee/Merchant,Payment Type,Status,Source
TXN_OCT_001,2026-10-10T11:20:00+05:30,320.00,DEBIT,BLUE_TOKAI_INDIRANAGAR,CARD,PENDING,CARD_AUTH_FEED
TXN_OCT_002,2026-10-10T14:45:00+05:30,450.00,DEBIT,rahul.sharma@upi,UPI,PENDING,NPCI_UPI_STREAM
TXN_OCT_003,2026-10-10T18:15:00+05:30,850.00,DEBIT,TOIT_BREWPUB_BLR,POS,PENDING,PINE_LABS_GATEWAY
TXN_OCT_004,2026-10-10T20:30:00+05:30,120.00,DEBIT,CHAI_POINT_KORAMANGALA,UPI,PENDING,NPCI_UPI_STREAM`;

  const handleLoadSample = async () => {
    await processCsvText(sampleCsvContent);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('Reading and parsing CSV...');

    try {
      const text = await file.text();
      await processCsvText(text);
    } catch (err: any) {
      setStatusMessage(`Error reading CSV: ${err.message}`);
    }
  };

  const processCsvText = async (csvText: string) => {
    const { ok, data, error } = await safeFetchJson('/api/operator/upload-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText }),
    });
    if (ok && data?.success) {
      setParsedRows(data.transactions);
      setStatusMessage(`Parsed ${data.totalRows} raw financial events (metadata preserved).`);
    } else {
      setStatusMessage(`Failed to parse CSV: ${data?.error || error || 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Financial Source CSV Ingestion Studio
            </h2>
            <p className="text-xs text-slate-400">
              Import real or redacted bank statements • Preserves raw source narration
            </p>
          </div>
        </div>

        {/* Load Sample / Upload Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLoadSample}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Sample Bank Feed</span>
          </button>

          <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center space-x-1.5 shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-3 px-3 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Parsed Table */}
      {parsedRows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-3 py-2">Transaction ID</th>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Direction</th>
                <th className="px-3 py-2">Payee / Merchant</th>
                <th className="px-3 py-2">Payment Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {parsedRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-slate-300 text-[11px]">
                    {row.id}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400 text-[10px] whitespace-nowrap">
                    {row.timestamp}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-white whitespace-nowrap">
                    ₹{row.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        row.direction === 'DEBIT'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {row.direction}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-200 max-w-[160px] truncate" title={row.payee}>
                    {row.payee}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">
                    {row.paymentType}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">
                    {row.status}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-500 text-[10px] truncate max-w-[120px]">
                    {row.source}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => onInjectEvent(row)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded text-[11px] font-semibold transition-colors flex items-center space-x-1 ml-auto"
                    >
                      <Send className="w-3 h-3" />
                      <span>Ingest</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
          Load sample statement feed or upload a real/redacted CSV to test raw event ingestion without semantic contamination.
        </div>
      )}
    </div>
  );
};
