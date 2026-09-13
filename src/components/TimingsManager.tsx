import { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Coffee,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Wand2,
  Check,
  ChevronRight,
  Sun,
  Sunset,
} from 'lucide-react';
import { PeriodTiming } from '../types';
import {
  getPeriodDuration,
  adjustPeriodDuration,
  alignContinuousTimings,
  reorderTimings,
  TIMING_PRESETS,
} from '../utils/timetableLogic';

interface TimingsManagerProps {
  timings: PeriodTiming[];
  onUpdateTiming: (id: string, newTime: string) => void;
  onUpdateLabel: (id: string, newLabel: string) => void;
  onAddPeriod: (atIndex: number) => void;
  onRemovePeriod: (id: string) => void;
  onApplyTimings: (timings: PeriodTiming[]) => void;
}

export default function TimingsManager({
  timings,
  onUpdateTiming,
  onUpdateLabel,
  onAddPeriod,
  onRemovePeriod,
  onApplyTimings,
}: TimingsManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState<boolean>(false);

  // Find recess info
  const recessIndex = timings.findIndex((t) => t.id === 'recess');
  const recessTiming = recessIndex !== -1 ? timings[recessIndex] : null;
  const recessDuration = recessTiming ? getPeriodDuration(recessTiming.time) : 40;

  // Pre-recess teaching periods count
  const preRecessCount = timings
    .slice(0, recessIndex !== -1 ? recessIndex : 0)
    .filter((t) => !t.isSystem).length;

  // Quick 1-tap presets
  const handleApplyPreset = (presetId: string) => {
    const preset = TIMING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    onApplyTimings(preset.timings);
  };

  // Quick duration delta (+5m or -5m)
  const handleDurationDelta = (periodId: string, deltaMins: number) => {
    const updated = adjustPeriodDuration(timings, periodId, deltaMins);
    onApplyTimings(updated);
  };

  // Quick recess duration set
  const handleSetRecessDuration = (targetDuration: number) => {
    if (!recessTiming) return;
    const currentDuration = getPeriodDuration(recessTiming.time);
    const delta = targetDuration - (currentDuration || 40);
    if (delta === 0) return;
    const updated = adjustPeriodDuration(timings, recessTiming.id, delta);
    onApplyTimings(updated);
  };

  // Move Recess position (e.g. after Period 2, 3, 4, 5)
  const handleMoveRecessAfterPeriod = (targetPeriodNumber: number) => {
    if (recessIndex === -1) return;

    // Find the timing index corresponding to that period number
    let periodCount = 0;
    let targetTimingIndex = -1;

    for (let i = 0; i < timings.length; i++) {
      if (!timings[i].isSystem) {
        periodCount++;
        if (periodCount === targetPeriodNumber) {
          targetTimingIndex = i;
          break;
        }
      }
    }

    if (targetTimingIndex === -1) return;

    // If moving after targetTimingIndex:
    const newRecessIndex =
      recessIndex < targetTimingIndex ? targetTimingIndex : targetTimingIndex + 1;

    const reordered = reorderTimings(timings, recessIndex, newRecessIndex);
    onApplyTimings(reordered);
  };

  // Reorder single period
  const handleMovePeriod = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= timings.length) return;
    const reordered = reorderTimings(timings, currentIndex, targetIndex);
    onApplyTimings(reordered);
  };

  // Align continuous (fix gaps)
  const handleAlignContinuous = () => {
    const aligned = alignContinuousTimings(timings);
    onApplyTimings(aligned);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-tight flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-black" /> Streamline Bell Timings
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Automatic gapless cascade, recess break controls, and official presets.
          </p>
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          id="btn-toggle-presets"
          className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-300" />
          <span>Presets</span>
        </button>
      </div>

      {/* Presets Tray */}
      {showPresets && (
        <div className="bg-neutral-900 text-white p-3.5 rounded-2xl shadow-md space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Standard Schedule Presets
            </span>
            <button
              onClick={() => setShowPresets(false)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {TIMING_PRESETS.map((preset) => {
              const isCurrent = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-white/15 border-white text-white'
                      : 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold">{preset.title}</div>
                    <div className="text-[11px] text-neutral-400 leading-snug mt-0.5 truncate">
                      {preset.description}
                    </div>
                  </div>
                  {isCurrent ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DEDICATED RECESS STREAMLINER CARD */}
      {recessTiming && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-tight flex items-center gap-1.5">
                  Recess & Lunch Break Streamliner
                </h3>
                <p className="text-[11px] text-amber-800 font-medium">
                  {recessTiming.time} •{' '}
                  <span className="font-bold underline">{recessDuration} Minutes</span>
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full">
              After Period {preRecessCount || 'III'}
            </span>
          </div>

          {/* 1-Tap Recess Duration Chips */}
          <div className="pt-1">
            <div className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center justify-between">
              <span>Recess Duration:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDurationDelta(recessTiming.id, -5)}
                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-bold text-xs"
                  title="Reduce recess by 5 mins"
                >
                  -5m
                </button>
                <button
                  onClick={() => handleDurationDelta(recessTiming.id, 5)}
                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-bold text-xs"
                  title="Increase recess by 5 mins"
                >
                  +5m
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[30, 35, 40, 45, 60].map((mins) => {
                const isActive = recessDuration === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => handleSetRecessDuration(mins)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-xs scale-102'
                        : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recess Placement: Shift Position */}
          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-900">Placement:</span>
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5].map((periodNum) => {
                const isCurrent = preRecessCount === periodNum;
                return (
                  <button
                    key={periodNum}
                    onClick={() => handleMoveRecessAfterPeriod(periodNum)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white/80 border border-amber-300 text-amber-900 hover:bg-white'
                    }`}
                  >
                    After P{periodNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Continuous Alignment Tool & Info */}
      <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-600 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span>Need to reconnect periods without gaps?</span>
        </div>
        <button
          onClick={handleAlignContinuous}
          className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-lg text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
        >
          ⚡ Fix Gaps & Align
        </button>
      </div>

      {/* TIMINGS LIST */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            All Periods ({timings.length})
          </span>
          <button
            onClick={() => onAddPeriod(timings.length)}
            className="text-xs font-bold text-black hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Period
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs divide-y divide-neutral-100 overflow-hidden">
          {timings.map((t, idx) => {
            const isRecess = t.id === 'recess';
            const isSystem = t.isSystem;
            const duration = getPeriodDuration(t.time);
            const isPreRecess = recessIndex !== -1 ? idx < recessIndex : true;

            return (
              <div
                key={t.id}
                className={`p-3 transition-colors ${
                  isRecess
                    ? 'bg-amber-50/70 border-l-4 border-l-amber-500'
                    : 'hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Reorder & Number & Label */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Reorder Arrows */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMovePeriod(idx, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 text-neutral-400 hover:text-black disabled:opacity-20 rounded"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMovePeriod(idx, 'down')}
                        disabled={idx === timings.length - 1}
                        className="p-0.5 text-neutral-400 hover:text-black disabled:opacity-20 rounded"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isRecess
                          ? 'bg-amber-500 text-white'
                          : isSystem
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-black text-white'
                      }`}
                    >
                      {isRecess ? <Coffee className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    {/* Label */}
                    <div className="min-w-0 flex-1">
                      {isSystem ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-900 truncate">
                            {t.label}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={t.label}
                          onChange={(e) => onUpdateLabel(t.id, e.target.value)}
                          className="text-xs font-bold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none w-full"
                        />
                      )}

                      {/* Session Tag */}
                      <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        {isRecess ? (
                          <span className="text-amber-700 font-semibold">
                            Official Recess Break
                          </span>
                        ) : isPreRecess ? (
                          <span className="flex items-center gap-0.5 text-neutral-500">
                            <Sun className="w-2.5 h-2.5 text-amber-500" /> Morning Session
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-neutral-500">
                            <Sunset className="w-2.5 h-2.5 text-orange-500" /> Afternoon Session
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Duration Pill, Quick +/- 5m, Time Input & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Duration badge with quick adjust */}
                    <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
                      <button
                        onClick={() => handleDurationDelta(t.id, -5)}
                        className="px-1.5 py-0.5 text-neutral-600 hover:text-black font-bold text-[10px] rounded hover:bg-neutral-200"
                        title="Decrease by 5 mins"
                      >
                        -5m
                      </button>
                      <span className="px-1.5 text-[10px] font-bold text-neutral-800">
                        {duration}m
                      </span>
                      <button
                        onClick={() => handleDurationDelta(t.id, 5)}
                        className="px-1.5 py-0.5 text-neutral-600 hover:text-black font-bold text-[10px] rounded hover:bg-neutral-200"
                        title="Increase by 5 mins"
                      >
                        +5m
                      </button>
                    </div>

                    {/* Time Input */}
                    <input
                      type="text"
                      value={t.time}
                      onChange={(e) => onUpdateTiming(t.id, e.target.value)}
                      placeholder="HH:MM - HH:MM"
                      className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-50 border border-neutral-300 rounded-lg text-center w-26 focus:outline-none focus:border-black"
                    />

                    {/* Delete for non-system */}
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
    </div>
  );
}
