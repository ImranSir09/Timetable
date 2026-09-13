import { School, AlertTriangle, CheckCircle2, Printer, RotateCcw } from 'lucide-react';
import { ScheduleConflict, SchoolProfile } from '../types';

interface MobileHeaderProps {
  profile: SchoolProfile;
  conflicts: ScheduleConflict[];
  onOpenPrint: () => void;
  onReset: () => void;
  activeTab: string;
}

export default function MobileHeader({
  profile,
  conflicts,
  onOpenPrint,
  onReset,
}: MobileHeaderProps) {
  const hasConflicts = conflicts.length > 0;

  return (
    <header className="no-print sticky top-0 z-30 bg-neutral-900 text-white shadow-md border-b border-neutral-800">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate uppercase tracking-tight">
              {profile.schoolName || 'Govt. School'}
            </h1>
            <p className="text-[11px] text-neutral-400 truncate">
              {profile.district} • Session {profile.session}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Clash indicator pill */}
          <div
            className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
              hasConflicts
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
            title={
              hasConflicts
                ? `${conflicts.length} schedule conflict(s) detected`
                : 'All periods collision-free'
            }
          >
            {hasConflicts ? (
              <>
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>{conflicts.length} Clash{conflicts.length > 1 ? 'es' : ''}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>No Clashes</span>
              </>
            )}
          </div>

          {/* Quick Print action */}
          <button
            onClick={onOpenPrint}
            id="header-btn-print"
            aria-label="Export A4 Landscape"
            className="p-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 font-bold transition-transform active:scale-95 shadow-sm"
            title="A4 Landscape Print / PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Reset menu/btn */}
          <button
            onClick={() => {
              if (window.confirm('Reset all schedule changes back to original default template?')) {
                onReset();
              }
            }}
            id="header-btn-reset"
            aria-label="Reset timetable"
            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
