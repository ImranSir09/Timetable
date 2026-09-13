import { useState } from 'react';
import { Clock, Plus, Trash2, RotateCw, AlertCircle } from 'lucide-react';
import { PeriodTiming } from '../types';

interface TimingsManagerProps {
  timings: PeriodTiming[];
  onUpdateTiming: (id: string, newTime: string) => void;
  onUpdateLabel: (id: string, newLabel: string) => void;
  onAddPeriod: (atIndex: number) => void;
  onRemovePeriod: (id: string) => void;
}

export default function TimingsManager({
  timings,
  onUpdateTiming,
  onUpdateLabel,
  onAddPeriod,
  onRemovePeriod,
}: TimingsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
            Bell Timings & Periods
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure morning assembly, recess, and class bell timings.
          </p>
        </div>
        <button
          onClick={() => onAddPeriod(timings.length)}
          id="btn-add-period-timing"
          className="px-3 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Period
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Smart Cascade Timings:</span> Editing any period's end
          time will automatically adjust the start times of all following periods.
        </div>
      </div>

      {/* Timings List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs divide-y divide-neutral-100 overflow-hidden">
        {timings.map((t, idx) => {
          const isRecess = t.id === 'recess';
          const isSystem = t.isSystem;

          return (
            <div
              key={t.id}
              className={`p-3.5 flex flex-col gap-2 transition-colors ${
                isRecess ? 'bg-neutral-50/90' : 'hover:bg-neutral-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isRecess
                        ? 'bg-neutral-200 text-neutral-700'
                        : isSystem
                        ? 'bg-neutral-100 text-neutral-600'
                        : 'bg-black text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    {isSystem ? (
                      <span className="text-xs font-bold text-neutral-800 block truncate">
                        {t.label}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={t.label}
                        onChange={(e) => onUpdateLabel(t.id, e.target.value)}
                        className="text-xs font-bold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none w-full"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={t.time}
                      onChange={(e) => onUpdateTiming(t.id, e.target.value)}
                      placeholder="HH:MM - HH:MM"
                      className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-300 rounded-lg text-center w-28 focus:outline-none focus:border-black"
                    />
                  </div>

                  {!isSystem && (
                    <button
                      onClick={() => onRemovePeriod(t.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete this period"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
