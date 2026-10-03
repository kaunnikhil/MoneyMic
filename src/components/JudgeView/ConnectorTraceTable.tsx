import React, { useState } from 'react';
import { ConnectorLogEntry } from '../../types/simulation';
import {
  Network,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Code2,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ConnectorTraceTableProps {
  connectorLog: ConnectorLogEntry[];
}

export const ConnectorTraceTable: React.FC<ConnectorTraceTableProps> = ({ connectorLog }) => {
  const [selectedEntry, setSelectedEntry] = useState<ConnectorLogEntry | null>(null);

  const getConnectorBadge = (connector: ConnectorLogEntry['connector']) => {
    switch (connector) {
      case 'GNANI_STT':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'PINE_LABS':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'DELHIVERY':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'BANK_INGESTION':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'SYSTEM':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getModeBadge = (mode: ConnectorLogEntry['mode']) => {
    if (mode === 'REAL') {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
          <Zap className="w-2.5 h-2.5 text-teal-400" />
          <span>REAL</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
        <span>WIZARD_OF_OZ</span>
      </span>
    );
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="w-2.5 h-2.5" />
          <span>{status} OK</span>
        </span>
      );
    }
    if (status === 403) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>{status} GATED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <XCircle className="w-2.5 h-2.5" />
        <span>{status} ERR</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                Connector Trace (REAL vs WIZARD_OF_OZ)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {connectorLog.length} Traces
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real Gnani REST STT • Pine Labs WoZ Adapter • Bank Feeds • Clearly labeled interaction modes
            </p>
          </div>
        </div>
      </div>

      {/* Table view */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[380px] rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">Time</th>
              <th className="px-3.5 py-2.5">Connector</th>
              <th className="px-3.5 py-2.5">Mode</th>
              <th className="px-3.5 py-2.5">Endpoint / Tool</th>
              <th className="px-3.5 py-2.5">Payloads</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {connectorLog.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 font-mono">
                  No connector events recorded. Awaiting live triggers.
                </td>
              </tr>
            ) : (
              connectorLog.map((entry) => {
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-3.5 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                      {timeStr}
                    </td>

                    {/* Connector */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getConnectorBadge(
                          entry.connector
                        )}`}
                      >
                        {entry.connector}
                      </span>
                    </td>

                    {/* Mode (REAL vs WIZARD_OF_OZ) */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      {getModeBadge(entry.mode)}
                    </td>

                    {/* Endpoint */}
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                          {entry.method}
                        </span>
                        <span className="font-mono text-slate-200 truncate max-w-[180px]" title={entry.endpoint}>
                          {entry.endpoint}
                        </span>
                      </div>
                      {entry.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-[220px]">
                          {entry.notes}
                        </div>
                      )}
                    </td>

                    {/* Payloads preview */}
                    <td className="px-3.5 py-2.5">
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[160px]">
                        Req: {JSON.stringify(entry.request)}
                      </div>
                      <div className="font-mono text-[10px] text-slate-300 truncate max-w-[160px]">
                        Res: {JSON.stringify(entry.response)}
                      </div>
                    </td>

                    {/* Status & Latency */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {getStatusBadge(entry.status)}
                        <span className="text-[10px] font-mono text-slate-500">{entry.latencyMs}ms</span>
                      </div>
                    </td>

                    {/* Inspect button */}
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getConnectorBadge(
                    selectedEntry.connector
                  )}`}
                >
                  {selectedEntry.connector}
                </span>
                {getModeBadge(selectedEntry.mode)}
                <span className="font-mono text-xs text-white">
                  {selectedEntry.method} {selectedEntry.endpoint}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                <span>Timestamp: {selectedEntry.timestamp}</span>
                <span>Mode: {selectedEntry.mode}</span>
                <span>Latency: {selectedEntry.latencyMs}ms</span>
                <span>Status: {selectedEntry.status}</span>
              </div>

              {selectedEntry.notes && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">
                    Connector Note
                  </span>
                  {selectedEntry.notes}
                </div>
              )}

              {/* Request JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Request Payload
                  </span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(selectedEntry.request, null, 2)}
                </pre>
              </div>

              {/* Response JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Response Payload
                  </span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(selectedEntry.response, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
