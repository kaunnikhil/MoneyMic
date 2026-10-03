import React, { useState } from 'react';
import { DecisionLogEntry } from '../../types/simulation';
import { Scale, Filter, Tag, CheckCircle2, AlertOctagon, ArrowUpRight, Search } from 'lucide-react';

interface DecisionLogTableProps {
  decisionLog: DecisionLogEntry[];
}

export const DecisionLogTable: React.FC<DecisionLogTableProps> = ({ decisionLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredLog = decisionLog.filter((entry) => {
    const matchesSearch =
      entry.decision.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.decisionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || entry.decisionType === selectedType;

    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(decisionLog.map((d) => d.decisionType)));

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVE') || action.includes('SUCCESS') || action.includes('COMMIT')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('REJECT') || action.includes('DENY') || action.includes('BLOCK')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (action.includes('VOICE') || action.includes('INTERVENE') || action.includes('CLARIF')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      {/* Table Header & Search Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                Autonomous Decision Log
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {decisionLog.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Concise policy labels & rule IDs • Chain-of-thought strictly suppressed
            </p>
          </div>
        </div>

        {/* Search bar & Type Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search decisions or rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950/80 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950/80 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Decision Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Decisions Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[380px] rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">Time</th>
              <th className="px-3.5 py-2.5">State</th>
              <th className="px-3.5 py-2.5">Type & Source</th>
              <th className="px-3.5 py-2.5">Decision Summary</th>
              <th className="px-3.5 py-2.5">Rule ID</th>
              <th className="px-3.5 py-2.5">Resulting Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredLog.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  No decisions match filter criteria.
                </td>
              </tr>
            ) : (
              filteredLog.map((entry) => {
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

                    {/* State */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                        S{entry.state} {entry.stateName}
                      </span>
                    </td>

                    {/* Type & Source */}
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-200">
                        {entry.decisionType}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {entry.source}
                      </div>
                    </td>

                    {/* Decision */}
                    <td className="px-3.5 py-2.5 text-slate-200 max-w-xs font-medium">
                      {entry.decision}
                    </td>

                    {/* Rule ID */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        {entry.ruleId}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadgeColor(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
