import React, { useState } from 'react';
import { Transaction } from '../../types/simulation';
import { PlusCircle, Send, Info } from 'lucide-react';

interface RawEventInjectorProps {
  onInjectEvent: (txn: Transaction) => void;
  isProcessing: boolean;
}

export const RawEventInjector: React.FC<RawEventInjectorProps> = ({
  onInjectEvent,
  isProcessing,
}) => {
  const [payee, setPayee] = useState('rahul.sharma@upi');
  const [amount, setAmount] = useState('450');
  const [paymentType, setPaymentType] = useState<Transaction['paymentType']>('UPI');
  const [source, setSource] = useState('NPCI_UPI_FEED');
  const [rawNarration, setRawNarration] = useState('UPI-P2P-RAHUL-SHARMA-REF771829');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee || !amount) return;

    const txn: Transaction = {
      id: `txn_raw_${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: parseFloat(amount),
      currency: 'INR',
      direction: 'DEBIT',
      payee,
      paymentType,
      status: 'PENDING',
      source,
      rawMetadata: {
        rawNarration,
        operatorInjectedAt: new Date().toISOString(),
      },
      amountStatus: 'VERIFIED',
      purposeStatus: 'UNKNOWN',
      categoryStatus: 'UNKNOWN',
    };

    onInjectEvent(txn);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Raw Event Ingestion (Outside World)
            </h2>
            <p className="text-xs text-slate-400">
              Deliver raw external event only • Category and semantic meaning cannot be provided by operator
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          <span>Operator restricted to raw feed</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Payee / Merchant */}
          <div>
            <label className="block text-slate-400 font-medium mb-1 font-mono uppercase text-[10px]">
              Payee / Merchant VPA
            </label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              required
              placeholder="e.g. rahul.sharma@upi or BLUE_TOKAI"
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 font-mono text-xs"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-slate-400 font-medium mb-1 font-mono uppercase text-[10px]">
              Amount (INR ₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="any"
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 font-mono text-xs"
            />
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-slate-400 font-medium mb-1 font-mono uppercase text-[10px]">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 font-mono text-xs"
            >
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="POS">POS Terminal</option>
              <option value="NET_BANKING">Net Banking</option>
              <option value="AUTOPAY">Autopay / Mandate</option>
            </select>
          </div>

          {/* Source Channel */}
          <div>
            <label className="block text-slate-400 font-medium mb-1 font-mono uppercase text-[10px]">
              Source Feed
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 font-mono text-xs"
            >
              <option value="NPCI_UPI_FEED">NPCI_UPI_FEED</option>
              <option value="BANK_STATEMENT_FEED">BANK_STATEMENT_FEED</option>
              <option value="PINE_LABS_POS_GATEWAY">PINE_LABS_POS_GATEWAY</option>
              <option value="SMS_PARSER_FEED">SMS_PARSER_FEED</option>
            </select>
          </div>
        </div>

        {/* Raw Narration */}
        <div>
          <label className="block text-slate-400 font-medium mb-1 font-mono uppercase text-[10px]">
            Raw Bank Narration / Metadata
          </label>
          <input
            type="text"
            value={rawNarration}
            onChange={(e) => setRawNarration(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 font-mono text-xs"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isProcessing}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Feed Raw Event to MoneyMic</span>
          </button>
        </div>
      </form>
    </div>
  );
};
