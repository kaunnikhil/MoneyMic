import React from 'react';
import { OperatorStore } from '../../types/simulation';
import { Sliders, ToggleLeft, ToggleRight, Info } from 'lucide-react';

interface ConnectorMockControlsProps {
  delhiveryEnabled: boolean;
  pineLabsMode: OperatorStore['pineLabsMode'];
  onConfigureConnector: (config: { delhiveryEnabled?: boolean; pineLabsMode?: OperatorStore['pineLabsMode'] }) => void;
  isProcessing: boolean;
}

export const ConnectorMockControls: React.FC<ConnectorMockControlsProps> = ({
  delhiveryEnabled,
  pineLabsMode,
  onConfigureConnector,
  isProcessing,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Wizard-of-Oz Connector Controls
            </h2>
            <p className="text-xs text-slate-400">
              Pine Labs WoZ responses • Delhivery gatekeeper (disabled for core scenario)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Pine Labs Mock Controller */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                Pine Labs POS Adapter (Wizard-of-Oz)
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                /v1/orders • /v1/payments
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
              Simulates Pine Labs POS terminal inquiry and payments. Timeout or pending is not failure; original payment must be reconciled before retry.
            </p>

            <div className="space-y-2 mt-2">
              <label className="block text-slate-400 font-mono text-[10px] uppercase">
                Simulated Response Condition:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onConfigureConnector({ pineLabsMode: 'NORMAL' })}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg border text-center font-mono font-medium transition-all ${
                    pineLabsMode === 'NORMAL'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[11px]">NORMAL</div>
                  <div className="text-[9px] text-slate-500">200 Settled</div>
                </button>

                <button
                  type="button"
                  onClick={() => onConfigureConnector({ pineLabsMode: 'SIMULATE_TIMEOUT' })}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg border text-center font-mono font-medium transition-all ${
                    pineLabsMode === 'SIMULATE_TIMEOUT'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[11px]">TIMEOUT</div>
                  <div className="text-[9px] text-slate-500">504 Reconcile</div>
                </button>

                <button
                  type="button"
                  onClick={() => onConfigureConnector({ pineLabsMode: 'SIMULATE_DECLINE' })}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg border text-center font-mono font-medium transition-all ${
                    pineLabsMode === 'SIMULATE_DECLINE'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[11px]">DECLINE</div>
                  <div className="text-[9px] text-slate-500">402 Failed</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delhivery Connector Gatekeeper */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                Delhivery Gatekeeper (Disabled by Default)
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                  delhiveryEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {delhiveryEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Per requirements, Delhivery tools exist but are disabled for the core scenario. No arbitrary shipment behavior is added.
            </p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-white font-medium block">
                  Delhivery Logistics Rail
                </span>
                <span className="text-[11px] text-slate-400">
                  {delhiveryEnabled
                    ? 'Active (for testing edge cases)'
                    : 'Disabled (core dining scenario)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onConfigureConnector({ delhiveryEnabled: !delhiveryEnabled })}
                disabled={isProcessing}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors ${
                  delhiveryEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {delhiveryEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    <span>Disabled</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
