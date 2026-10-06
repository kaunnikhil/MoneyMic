import React from 'react';
import {
  SpendingPaceCalculation,
  UserProfile,
  FinancialIntent,
  PaceClassification,
} from '../../types/simulation';
import {
  Utensils,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  ShieldCheck,
} from 'lucide-react';

interface FinancialStateHeaderProps {
  userProfile: UserProfile;
  financialIntent: FinancialIntent;
  calculations: SpendingPaceCalculation;
}

export const FinancialStateHeader: React.FC<FinancialStateHeaderProps> = ({
  userProfile,
  financialIntent,
  calculations,
}) => {
  const {
    monthlyLimit,
    verifiedSpend,
    remainingLimit,
    elapsedDays,
    totalDays,
    expectedSpendToDate,
    actualPace,
    intendedPace,
    paceRatio,
    paceClassification,
    explanation,
  } = calculations;

  const spendPercentage = Math.min(100, Math.round((verifiedSpend / monthlyLimit) * 100));
  const elapsedPercentage = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const getPaceBadge = (classification: PaceClassification) => {
    switch (classification) {
      case 'ALIGNED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'ALIGNED',
          icon: CheckCircle,
        };
      case 'DRIFT':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          label: 'SPENDING DRIFT',
          icon: AlertTriangle,
        };
      case 'MATERIAL_DRIFT':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse',
          dot: 'bg-rose-400',
          label: 'MATERIAL DRIFT',
          icon: AlertTriangle,
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          dot: 'bg-slate-400',
          label: 'INSUFFICIENT DATA',
          icon: ShieldCheck,
        };
    }
  };

  const badgeInfo = getPaceBadge(paceClassification);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                Deterministic Financial State • Dining Intention
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Server-Authoritative Arithmetic
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                L3 Bounded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              User: <span className="text-slate-200 font-medium">{userProfile.name}</span> • Period: <span className="text-slate-200 font-medium">October 2026</span> • Target Ceiling: <span className="text-slate-200 font-medium">₹{monthlyLimit.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* Pace Classification Badge */}
        <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono tracking-wide ${badgeInfo.bg}`}>
          <span className={`w-2 h-2 rounded-full ${badgeInfo.dot}`} />
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badgeInfo.label}</span>
          <span className="text-[11px] opacity-80 font-normal">({paceRatio}x baseline)</span>
        </div>
      </div>

      {/* Grid of Key Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        {/* Metric 1: Verified Spend & Remaining Limit */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Verified Dining Spend</span>
            <Wallet className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              ₹{verifiedSpend.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Remaining: ₹{remainingLimit.toLocaleString('en-IN')}</span>
              <span className="font-mono text-teal-400">{spendPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-500 ${
                  spendPercentage > 85 ? 'bg-rose-500' : spendPercentage > 65 ? 'bg-amber-500' : 'bg-teal-500'
                }`}
                style={{ width: `${spendPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Elapsed Period */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">October 2026</span>
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              Day {elapsedDays} <span className="text-sm font-normal text-slate-400">/ {totalDays}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Remaining: {totalDays - elapsedDays} days</span>
              <span className="font-mono text-cyan-400">{elapsedPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${elapsedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Pro-Rata Expected Spend vs Actual */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Pro-Rata Expected</span>
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              ₹{expectedSpendToDate.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {verifiedSpend > expectedSpendToDate ? (
                <span className="text-rose-400 font-medium">
                  +₹{(verifiedSpend - expectedSpendToDate).toLocaleString('en-IN')} over pro-rata
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
                  ₹{(expectedSpendToDate - verifiedSpend).toLocaleString('en-IN')} under pro-rata
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Pace Ratio: {paceRatio}x
            </div>
          </div>
        </div>

        {/* Metric 4: Actual Pace vs Intended Pace */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Daily Pace Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              ₹{actualPace.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/day</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Target: ₹{intendedPace.toLocaleString('en-IN')}/day</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Delta: {actualPace > intendedPace ? `+₹${actualPace - intendedPace}/d` : `-₹${intendedPace - actualPace}/d`}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Banner & Bounded Autonomy Guardrail */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-teal-400 font-bold uppercase tracking-wider font-mono">
            Pace Diagnosis:
          </span>
          <span className="text-slate-300">{explanation}</span>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0 font-medium">
          Delegated Authority: <span className="text-slate-200 font-mono font-bold">≤ ₹500 autonomous (Dining only)</span>
        </div>
      </div>
    </div>
  );
};
