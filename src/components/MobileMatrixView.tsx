import { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  LayoutGrid,
  AlertTriangle,
  ArrowRight,
  Coffee,
  Sparkles,
  BookOpen,
  FlaskConical,
  Activity,
  Palette,
  Library,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  X,
  Check,
  Flame,
  Bookmark,
  UserPlus,
} from 'lucide-react';
import {
  PeriodTiming,
  ScheduleConflict,
  TeacherSchedule,
  SubjectCategory,
  SubjectCategoryInfo,
} from '../types';
import {
  parsePeriodValue,
  getPeriodDuration,
  classifySubject,
  getTeacherWorkloadBreakdown,
  getSchoolWorkloadOverview,
  SUBJECT_CATEGORY_REGISTRY,
} from '../utils/timetableLogic';

interface MobileMatrixViewProps {
  teachers: TeacherSchedule[];
  timings: PeriodTiming[];
  conflicts: ScheduleConflict[];
  onOpenSlotAssign: (teacher: TeacherSchedule, timing: PeriodTiming) => void;
  onAddTeacher: () => void;
  onGoToExport: () => void;
}

export default function MobileMatrixView({
  teachers,
  timings,
  conflicts,
  onOpenSlotAssign,
  onAddTeacher,
  onGoToExport,
}: MobileMatrixViewProps) {
  const [viewMode, setViewMode] = useState<'teacher' | 'period' | 'grid'>('teacher');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    timings.find((t) => !t.isSystem)?.id || timings[2]?.id || 'p1'
  );
  // Teacher dropdown selection state (defaults to first teacher for non-scrolling single view)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ''
  );
  // Collapsible conflict details to preserve vertical screen space
  const [showConflictDetails, setShowConflictDetails] = useState<boolean>(false);

  // Category filter state ('all' or specific SubjectCategory)
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory | 'all'>('all');

  // Workload Analytics drawer toggle
  const [showWorkloadAnalytics, setShowWorkloadAnalytics] = useState<boolean>(false);

  // Calculate school-wide workload overview
  const schoolWorkload = useMemo(
    () => getSchoolWorkloadOverview(teachers, timings),
    [teachers, timings]
  );

  // Ensure selectedTeacherId stays valid if teachers are added/deleted
  const effectiveTeacherId = useMemo(() => {
    if (selectedTeacherId === 'all') return 'all';
    if (teachers.some((t) => t.id === selectedTeacherId)) {
      return selectedTeacherId;
    }
    return teachers[0]?.id || '';
  }, [selectedTeacherId, teachers]);

  const activeTeacherIndex = useMemo(() => {
    return teachers.findIndex((t) => t.id === effectiveTeacherId);
  }, [teachers, effectiveTeacherId]);

  const activeTeacher = useMemo(() => {
    if (activeTeacherIndex >= 0) return teachers[activeTeacherIndex];
    return teachers[0] || null;
  }, [teachers, activeTeacherIndex]);

  const handlePrevTeacher = () => {
    if (teachers.length <= 1) return;
    const currIdx = activeTeacherIndex >= 0 ? activeTeacherIndex : 0;
    const prevIdx = (currIdx - 1 + teachers.length) % teachers.length;
    setSelectedTeacherId(teachers[prevIdx].id);
  };

  const handleNextTeacher = () => {
    if (teachers.length <= 1) return;
    const currIdx = activeTeacherIndex >= 0 ? activeTeacherIndex : 0;
    const nextIdx = (currIdx + 1) % teachers.length;
    setSelectedTeacherId(teachers[nextIdx].id);
  };

  // Determine which teachers to display: 1 selected teacher (default non-scrolling) or all
  const teachersToDisplay = useMemo(() => {
    if (effectiveTeacherId === 'all') return teachers;
    if (activeTeacher) return [activeTeacher];
    return teachers.slice(0, 1);
  }, [effectiveTeacherId, teachers, activeTeacher]);

  // Count total matching slots if category filter is active
  const filterMatchCount = useMemo(() => {
    if (selectedCategory === 'all') return 0;
    let count = 0;
    teachers.forEach((t) => {
      timings.forEach((timing) => {
        if (timing.id === 'recess') return;
        const val = t.periods[timing.id] || 'Free';
        const cat = classifySubject(val);
        if (cat.id === selectedCategory) count++;
      });
    });
    return count;
  }, [selectedCategory, teachers, timings]);

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Conflicts Alert Banner (Streamlined & Collapsible) */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 bg-red-100 rounded-lg text-red-600 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-red-900 text-xs truncate">
                {conflicts.length} Schedule Collision{conflicts.length > 1 ? 's' : ''} Detected
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowConflictDetails(!showConflictDetails)}
              className="text-[11px] font-bold text-red-700 hover:text-red-900 px-2 py-0.5 rounded bg-red-100/70 shrink-0 transition-colors"
            >
              {showConflictDetails ? 'Hide' : 'Review'}
            </button>
          </div>

          {showConflictDetails && (
            <div className="mt-2 pt-2 border-t border-red-200/70 space-y-1.5 animate-fadeIn">
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white/95 border border-red-200 rounded-lg p-2 text-[11px] text-red-800"
                >
                  <span className="font-bold uppercase text-red-900 bg-red-100 px-1.5 py-0.5 rounded mr-1">
                    {c.periodLabel}
                  </span>
                  Class <strong className="underline">{c.className}</strong> is double-booked by{' '}
                  <strong>{c.teacher1Name}</strong> ({c.subject1}) and{' '}
                  <strong>{c.teacher2Name}</strong> ({c.subject2}).
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Controls & View Mode Selector */}
      <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
              Timetable Matrix
            </span>
            <p className="text-[11px] text-neutral-500">
              {teachers.length} Staff • {timings.filter((t) => !t.isSystem).length} Periods
            </p>
          </div>

          <button
            onClick={() => setShowWorkloadAnalytics(!showWorkloadAnalytics)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showWorkloadAnalytics
                ? 'bg-black text-white border-black shadow-xs'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Workload Stats</span>
            {showWorkloadAnalytics ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Segmented View Control */}
        <div className="grid grid-cols-3 bg-neutral-100 p-1 rounded-xl gap-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode('teacher')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'teacher'
                ? 'bg-white text-black shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            By Staff
          </button>
          <button
            onClick={() => setViewMode('period')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'period'
                ? 'bg-white text-black shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            By Period
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-black shadow-xs font-bold'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Full Table
          </button>
        </div>

        {/* SUBJECT TYPE LEGEND & FILTER PILL BAR */}
        <div className="pt-2 border-t border-neutral-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-neutral-600 uppercase tracking-tight flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
              Subject Category Legend & Filter:
            </span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-[10px] font-bold text-neutral-500 hover:text-black flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {/* All Category Pill */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Types
            </button>

            {/* Core Academic Pill */}
            <button
              onClick={() => setSelectedCategory('core')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === 'core'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Core Academic</span>
              <span className="text-[10px] opacity-75 font-mono">({schoolWorkload.totalCore})</span>
            </button>

            {/* Lab & Practical Pill */}
            <button
              onClick={() => setSelectedCategory('lab')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === 'lab'
                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                  : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
              }`}
            >
              <FlaskConical className="w-3 h-3" />
              <span>Lab & Practical</span>
              <span className="text-[10px] opacity-75 font-mono">({schoolWorkload.totalLab})</span>
            </button>

            {/* Sports & PE Pill */}
            <button
              onClick={() => setSelectedCategory('sports')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === 'sports'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Sports & PE</span>
              <span className="text-[10px] opacity-75 font-mono">({schoolWorkload.totalSports})</span>
            </button>

            {/* Arts & Creative Pill */}
            <button
              onClick={() => setSelectedCategory('arts')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === 'arts'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Arts & Activity</span>
              <span className="text-[10px] opacity-75 font-mono">({schoolWorkload.totalArts})</span>
            </button>

            {/* Advisory & Library Pill */}
            <button
              onClick={() => setSelectedCategory('advisory')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === 'advisory'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Library className="w-3 h-3" />
              <span>Advisory & Library</span>
              <span className="text-[10px] opacity-75 font-mono">({schoolWorkload.totalAdvisory})</span>
            </button>

            {/* Free Period Pill */}
            <button
              onClick={() => setSelectedCategory('free')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === 'free'
                  ? 'bg-neutral-700 text-white border-neutral-800 shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              <Coffee className="w-3 h-3" />
              <span>Free Periods</span>
              <span className="text-[10px] opacity-75 font-mono">({schoolWorkload.totalFreePeriods})</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER SPOTLIGHT NOTICE */}
      {selectedCategory !== 'all' && (
        <div className="bg-neutral-900 text-white p-2.5 px-3 rounded-xl flex items-center justify-between text-xs animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Spotlighting: <strong>{SUBJECT_CATEGORY_REGISTRY[selectedCategory].name}</strong> ({filterMatchCount} active periods)
            </span>
          </div>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[11px] font-bold text-white transition-colors"
          >
            Show All
          </button>
        </div>
      )}

      {/* EXPANDABLE WEEKLY WORKLOAD ANALYTICS ACCORDION */}
      {showWorkloadAnalytics && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Weekly Workload Distribution
            </h3>
            <span className="text-[11px] font-bold text-neutral-500">
              {schoolWorkload.totalTeachingPeriods} Total Teaching Periods
            </span>
          </div>

          {/* School-Wide Segmented Proportional Bar */}
          <div className="space-y-1">
            <div className="h-3 w-full bg-neutral-100 rounded-full flex overflow-hidden shadow-inner">
              {schoolWorkload.totalTeachingPeriods > 0 && (
                <>
                  <div
                    style={{
                      width: `${(schoolWorkload.totalCore / schoolWorkload.totalTeachingPeriods) * 100}%`,
                    }}
                    className="bg-indigo-600 h-full transition-all"
                    title={`Core Academic: ${schoolWorkload.totalCore}`}
                  />
                  <div
                    style={{
                      width: `${(schoolWorkload.totalLab / schoolWorkload.totalTeachingPeriods) * 100}%`,
                    }}
                    className="bg-teal-500 h-full transition-all"
                    title={`Lab & Practical: ${schoolWorkload.totalLab}`}
                  />
                  <div
                    style={{
                      width: `${(schoolWorkload.totalSports / schoolWorkload.totalTeachingPeriods) * 100}%`,
                    }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Sports & PE: ${schoolWorkload.totalSports}`}
                  />
                  <div
                    style={{
                      width: `${(schoolWorkload.totalArts / schoolWorkload.totalTeachingPeriods) * 100}%`,
                    }}
                    className="bg-purple-500 h-full transition-all"
                    title={`Arts & Activity: ${schoolWorkload.totalArts}`}
                  />
                  <div
                    style={{
                      width: `${(schoolWorkload.totalAdvisory / schoolWorkload.totalTeachingPeriods) * 100}%`,
                    }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Advisory & Library: ${schoolWorkload.totalAdvisory}`}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[9.5px] text-neutral-400 font-medium px-0.5">
              <span>0%</span>
              <span>Overall Curriculum Balance</span>
              <span>100%</span>
            </div>
          </div>

          {/* Category Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* Core */}
            <div className="p-2 bg-indigo-50/80 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-1 text-indigo-900 font-bold text-[11px]">
                <BookOpen className="w-3 h-3 text-indigo-600" />
                <span>Core STEM / Lang</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-black text-indigo-950">
                  {schoolWorkload.totalCore}
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold">
                  {schoolWorkload.totalTeachingPeriods > 0
                    ? `${Math.round((schoolWorkload.totalCore / schoolWorkload.totalTeachingPeriods) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Labs */}
            <div className="p-2 bg-teal-50/80 border border-teal-200 rounded-xl">
              <div className="flex items-center gap-1 text-teal-900 font-bold text-[11px]">
                <FlaskConical className="w-3 h-3 text-teal-600" />
                <span>Labs & Practicals</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-black text-teal-950">
                  {schoolWorkload.totalLab}
                </span>
                <span className="text-[10px] text-teal-700 font-semibold">
                  {schoolWorkload.totalTeachingPeriods > 0
                    ? `${Math.round((schoolWorkload.totalLab / schoolWorkload.totalTeachingPeriods) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Sports */}
            <div className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-1 text-emerald-900 font-bold text-[11px]">
                <Activity className="w-3 h-3 text-emerald-600" />
                <span>Sports & PE</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-black text-emerald-950">
                  {schoolWorkload.totalSports}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {schoolWorkload.totalTeachingPeriods > 0
                    ? `${Math.round((schoolWorkload.totalSports / schoolWorkload.totalTeachingPeriods) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Arts */}
            <div className="p-2 bg-purple-50/80 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-1 text-purple-900 font-bold text-[11px]">
                <Palette className="w-3 h-3 text-purple-600" />
                <span>Arts & Craft</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-black text-purple-950">
                  {schoolWorkload.totalArts}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold">
                  {schoolWorkload.totalTeachingPeriods > 0
                    ? `${Math.round((schoolWorkload.totalArts / schoolWorkload.totalTeachingPeriods) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Advisory */}
            <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-amber-900 font-bold text-[11px]">
                <Library className="w-3 h-3 text-amber-600" />
                <span>Library / Mentoring</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-black text-amber-950">
                  {schoolWorkload.totalAdvisory}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">
                  {schoolWorkload.totalTeachingPeriods > 0
                    ? `${Math.round((schoolWorkload.totalAdvisory / schoolWorkload.totalTeachingPeriods) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: BY TEACHER (STREAMLINED NON-SCROLLING DROPDOWN VIEW) */}
      {viewMode === 'teacher' && (
        <div className="space-y-3">
          {teachers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">No Staff Members Added Yet</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Add teachers to start assigning periods and building your timetable.
              </p>
              <button
                type="button"
                onClick={onAddTeacher}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-xs hover:bg-neutral-800 active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4" /> Add First Teacher
              </button>
            </div>
          ) : (
            <>
              {/* TEACHER DROPDOWN NAVIGATION BAR */}
              <div className="bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  {/* Previous Teacher Button */}
                  <button
                    type="button"
                    onClick={handlePrevTeacher}
                    disabled={teachers.length <= 1 || effectiveTeacherId === 'all'}
                    aria-label="Previous Staff Member"
                    title="Previous Staff Member"
                    className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-neutral-800 shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dropdown Selector */}
                  <div className="flex-1 min-w-0 relative">
                    <label htmlFor="teacher-dropdown-select" className="sr-only">
                      Select Teacher
                    </label>
                    <div className="relative">
                      <select
                        id="teacher-dropdown-select"
                        value={effectiveTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full appearance-none bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-300 font-bold text-neutral-900 text-xs py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all truncate"
                      >
                        <optgroup label="Select Staff Member">
                          {teachers.map((t, idx) => {
                            const b = getTeacherWorkloadBreakdown(t, timings);
                            return (
                              <option key={t.id} value={t.id}>
                                {idx + 1}. {t.name} {t.designation ? `(${t.designation})` : ''} — {b.totalTeaching} Periods
                              </option>
                            );
                          })}
                        </optgroup>
                        <optgroup label="View Modes">
                          <option value="all">👥 Show All Staff (Full List)</option>
                        </optgroup>
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Next Teacher Button */}
                  <button
                    type="button"
                    onClick={handleNextTeacher}
                    disabled={teachers.length <= 1 || effectiveTeacherId === 'all'}
                    aria-label="Next Staff Member"
                    title="Next Staff Member"
                    className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-neutral-800 shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-strip indicator for active teacher */}
                {effectiveTeacherId !== 'all' && activeTeacher && (
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 px-1">
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      <span className="font-bold text-black shrink-0">
                        Staff {activeTeacherIndex + 1} of {teachers.length}
                      </span>
                      <span>•</span>
                      <span className="truncate">{activeTeacher.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 shrink-0 ml-2">
                      Tap ‹ › to switch
                    </span>
                  </div>
                )}
              </div>

              {/* Reminder banner if All Staff is selected */}
              {effectiveTeacherId === 'all' && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-medium">
                    Viewing all {teachers.length} staff members.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTeacherId(teachers[0]?.id || '')}
                    className="text-[11px] font-bold text-amber-950 underline"
                  >
                    Switch to 1-Page View
                  </button>
                </div>
              )}

              {/* RENDER TEACHER CARD(S) */}
              {teachersToDisplay.map((teacher) => {
                const tIdx = teachers.findIndex((t) => t.id === teacher.id);
                const breakdown = getTeacherWorkloadBreakdown(teacher, timings);

            return (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden transition-all hover:border-neutral-300"
              >
                {/* Teacher Card Header */}
                <div className="p-3.5 bg-neutral-50/90 border-b border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {teacher.name.charAt(0) || `${tIdx + 1}`}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 truncate">
                          {teacher.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {teacher.designation || 'Staff Member'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-neutral-900">
                        {breakdown.totalTeaching} Periods
                      </span>
                      <p className="text-[10px] text-neutral-500">
                        {breakdown.totalFree} Free Slots
                      </p>
                    </div>
                  </div>

                  {/* Teacher's Workload Distribution Mini-Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-neutral-200/80 rounded-full flex overflow-hidden">
                      {breakdown.totalTeaching > 0 ? (
                        <>
                          {breakdown.core > 0 && (
                            <div
                              style={{ width: `${(breakdown.core / breakdown.totalTeaching) * 100}%` }}
                              className="bg-indigo-600 h-full"
                              title={`Core: ${breakdown.core}`}
                            />
                          )}
                          {breakdown.lab > 0 && (
                            <div
                              style={{ width: `${(breakdown.lab / breakdown.totalTeaching) * 100}%` }}
                              className="bg-teal-500 h-full"
                              title={`Lab: ${breakdown.lab}`}
                            />
                          )}
                          {breakdown.sports > 0 && (
                            <div
                              style={{ width: `${(breakdown.sports / breakdown.totalTeaching) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Sports: ${breakdown.sports}`}
                            />
                          )}
                          {breakdown.arts > 0 && (
                            <div
                              style={{ width: `${(breakdown.arts / breakdown.totalTeaching) * 100}%` }}
                              className="bg-purple-500 h-full"
                              title={`Arts: ${breakdown.arts}`}
                            />
                          )}
                          {breakdown.advisory > 0 && (
                            <div
                              style={{ width: `${(breakdown.advisory / breakdown.totalTeaching) * 100}%` }}
                              className="bg-amber-500 h-full"
                              title={`Advisory: ${breakdown.advisory}`}
                            />
                          )}
                        </>
                      ) : (
                        <div className="bg-neutral-300 w-full h-full" />
                      )}
                    </div>

                    {/* Subject Category Indicator Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {breakdown.core > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-0.5">
                          <BookOpen className="w-2.5 h-2.5 text-indigo-600" />
                          {breakdown.core} Core
                        </span>
                      )}
                      {breakdown.lab > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-0.5">
                          <FlaskConical className="w-2.5 h-2.5 text-teal-600" />
                          {breakdown.lab} Lab
                        </span>
                      )}
                      {breakdown.sports > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-0.5">
                          <Activity className="w-2.5 h-2.5 text-emerald-600" />
                          {breakdown.sports} Sports
                        </span>
                      )}
                      {breakdown.arts > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-0.5">
                          <Palette className="w-2.5 h-2.5 text-purple-600" />
                          {breakdown.arts} Arts
                        </span>
                      )}
                      {breakdown.advisory > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                          <Library className="w-2.5 h-2.5 text-amber-600" />
                          {breakdown.advisory} Library
                        </span>
                      )}
                      {breakdown.totalFree > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {breakdown.totalFree} Free
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Periods Horizontal Scroller / Grid */}
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {timings.map((timing) => {
                      const isRecess = timing.id === 'recess';
                      const cellVal = teacher.periods[timing.id] || '';
                      const parsed = parsePeriodValue(cellVal);
                      const cat = classifySubject(cellVal);

                      // Check if category matches filter
                      const isFilterMatch =
                        selectedCategory === 'all' || cat.id === selectedCategory;

                      // Check if this cell is involved in a conflict
                      const hasClash =
                        !isRecess &&
                        parsed.isClassBooking &&
                        conflicts.some(
                          (c) =>
                            c.periodId === timing.id &&
                            c.className.toUpperCase() === parsed.className.toUpperCase() &&
                            (c.teacher1Name === teacher.name || c.teacher2Name === teacher.name)
                        );

                      if (isRecess) {
                        const duration = getPeriodDuration(timing.time);
                        return (
                          <div
                            key={timing.id}
                            className="col-span-2 my-1 py-2 px-3 bg-amber-50/90 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                                <Coffee className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-amber-950 uppercase tracking-tight text-[11px]">
                                Recess & Lunch Break
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                                {duration || 40}m
                              </span>
                              <span className="text-[10px] font-semibold text-amber-800">
                                {timing.time}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={timing.id}
                          type="button"
                          onClick={() => onOpenSlotAssign(teacher, timing)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-98 border-l-4 ${cat.borderAccent} ${
                            hasClash
                              ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
                              : parsed.isFree
                              ? 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-400'
                              : `${cat.bgLight} border-neutral-200 hover:border-black shadow-2xs`
                          } ${
                            !isFilterMatch
                              ? 'opacity-35 grayscale-[0.2]'
                              : selectedCategory !== 'all'
                              ? 'ring-2 ring-black shadow-xs'
                              : ''
                          }`}
                        >
                          {/* Period Label and Subject Category Tag */}
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">
                              {timing.label}
                            </span>
                            {!parsed.isFree && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 ${cat.badgeBg} ${cat.badgeText}`}
                              >
                                {cat.id === 'lab' && <FlaskConical className="w-2.5 h-2.5 shrink-0" />}
                                {cat.id === 'core' && <BookOpen className="w-2.5 h-2.5 shrink-0" />}
                                {cat.id === 'sports' && <Activity className="w-2.5 h-2.5 shrink-0" />}
                                {cat.id === 'arts' && <Palette className="w-2.5 h-2.5 shrink-0" />}
                                {cat.id === 'advisory' && <Library className="w-2.5 h-2.5 shrink-0" />}
                                <span>{cat.shortName}</span>
                              </span>
                            )}
                          </div>

                          {/* Class and Subject Name */}
                          <div className="mt-1.5 min-h-[32px] flex flex-col justify-center">
                            {parsed.isFree ? (
                              <span className="text-xs text-neutral-400 italic">Free Slot</span>
                            ) : parsed.isClassBooking ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-black text-white text-[11px] font-black rounded-md shrink-0">
                                  {parsed.className}
                                </span>
                                <span className="text-xs font-bold text-neutral-900 truncate">
                                  {parsed.subject}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-neutral-800">
                                {parsed.raw}
                              </span>
                            )}
                          </div>

                          {/* Conflict Alert or Timing text */}
                          {hasClash ? (
                            <div className="mt-1 text-[9px] font-bold text-red-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Duplicate Booking
                            </div>
                          ) : (
                            <div className="mt-1 text-[9px] text-neutral-400 font-medium">
                              {timing.time}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
            </>
          )}
        </div>
      )}

      {/* VIEW 2: BY PERIOD (SLICE VIEW) */}
      {viewMode === 'period' && (
        <div className="space-y-3.5">
          {/* Period Selector Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {timings.map((t) => {
              const isSelected = selectedPeriodId === t.id;
              const isRecess = t.id === 'recess';
              const hasPeriodClash = conflicts.some((c) => c.periodId === t.id);
              const duration = getPeriodDuration(t.time);

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedPeriodId(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 text-left ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-xs'
                      : isRecess
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : hasPeriodClash
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.label}</span>
                    <span className="text-[9px] font-bold opacity-75 px-1 py-0.2 rounded bg-black/10">
                      {duration}m
                    </span>
                  </div>
                  <div className="text-[10px] font-normal opacity-80">{t.time}</div>
                </button>
              );
            })}
          </div>

          {/* Period Details Card */}
          {(() => {
            const activeTiming = timings.find((t) => t.id === selectedPeriodId);
            if (!activeTiming) return null;

            if (activeTiming.id === 'recess') {
              const recessDur = getPeriodDuration(activeTiming.time);
              return (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 text-center shadow-xs space-y-2">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-amber-950">Recess & Lunch Break</h4>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-xs font-bold">
                    <span>{activeTiming.time}</span>
                    <span>•</span>
                    <span>{recessDur || 40} Minutes</span>
                  </div>
                  <p className="text-xs text-amber-800 max-w-xs mx-auto leading-relaxed pt-1">
                    Designated institutional lunch & prayer break for all staff and students. No classes or teacher duties are assigned during this period.
                  </p>
                </div>
              );
            }

            // Calculate active period stats
            let periodCores = 0;
            let periodLabs = 0;
            let periodSports = 0;
            let periodArts = 0;
            let periodFrees = 0;

            teachers.forEach((teacher) => {
              const cellVal = teacher.periods[activeTiming.id] || '';
              const cat = classifySubject(cellVal);
              if (cat.id === 'core') periodCores++;
              else if (cat.id === 'lab') periodLabs++;
              else if (cat.id === 'sports') periodSports++;
              else if (cat.id === 'arts') periodArts++;
              else if (cat.id === 'free') periodFrees++;
            });

            return (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-neutral-900">{activeTiming.label}</h4>
                      <p className="text-xs text-neutral-500 font-medium">{activeTiming.time}</p>
                    </div>
                    <span className="text-xs font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-lg">
                      {teachers.length} Staff Members
                    </span>
                  </div>

                  {/* Period Subject Breakdown Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold pt-1">
                    {periodCores > 0 && (
                      <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5 text-indigo-600" /> {periodCores} Core
                      </span>
                    )}
                    {periodLabs > 0 && (
                      <span className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded flex items-center gap-1">
                        <FlaskConical className="w-2.5 h-2.5 text-teal-600" /> {periodLabs} Lab
                      </span>
                    )}
                    {periodSports > 0 && (
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5 text-emerald-600" /> {periodSports} PE
                      </span>
                    )}
                    {periodArts > 0 && (
                      <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded flex items-center gap-1">
                        <Palette className="w-2.5 h-2.5 text-purple-600" /> {periodArts} Arts
                      </span>
                    )}
                    {periodFrees > 0 && (
                      <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                        {periodFrees} Free
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-neutral-100">
                  {teachers.map((teacher) => {
                    const cellVal = teacher.periods[activeTiming.id] || '';
                    const parsed = parsePeriodValue(cellVal);
                    const cat = classifySubject(cellVal);
                    const isFilterMatch =
                      selectedCategory === 'all' || cat.id === selectedCategory;

                    const hasClash =
                      parsed.isClassBooking &&
                      conflicts.some(
                        (c) =>
                          c.periodId === activeTiming.id &&
                          c.className.toUpperCase() === parsed.className.toUpperCase() &&
                          (c.teacher1Name === teacher.name || c.teacher2Name === teacher.name)
                      );

                    return (
                      <div
                        key={teacher.id}
                        onClick={() => onOpenSlotAssign(teacher, activeTiming)}
                        className={`p-3 flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors border-l-4 ${cat.borderAccent} ${
                          hasClash ? 'bg-red-50/60' : ''
                        } ${!isFilterMatch ? 'opacity-35 grayscale-[0.2]' : ''}`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {teacher.name}
                          </p>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {teacher.designation || 'Staff'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {parsed.isFree ? (
                            <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-lg">
                              Free
                            </span>
                          ) : parsed.isClassBooking ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cat.badgeBg} ${cat.badgeText} flex items-center gap-0.5`}
                              >
                                {cat.id === 'lab' && <FlaskConical className="w-2.5 h-2.5" />}
                                {cat.id === 'core' && <BookOpen className="w-2.5 h-2.5" />}
                                {cat.id === 'sports' && <Activity className="w-2.5 h-2.5" />}
                                {cat.id === 'arts' && <Palette className="w-2.5 h-2.5" />}
                                {cat.id === 'advisory' && <Library className="w-2.5 h-2.5" />}
                                {cat.shortName}
                              </span>

                              <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-lg">
                                <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-black rounded">
                                  {parsed.className}
                                </span>
                                <span className="text-xs font-bold text-neutral-900">
                                  {parsed.subject}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-lg">
                              {parsed.raw}
                            </span>
                          )}

                          {hasClash && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Clash
                            </span>
                          )}

                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 3: FULL HORIZONTAL TABLE */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">Master Schedule Matrix</span>
            <span className="text-[10px] text-neutral-500 italic">Color indicators active • Tap to edit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[720px]">
              <thead className="bg-neutral-100 text-neutral-700 text-[11px] uppercase font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-2 border-r border-neutral-200 sticky left-0 bg-neutral-100 z-10 w-36 shadow-xs">
                    Staff Name
                  </th>
                  {timings.map((t) => (
                    <th
                      key={t.id}
                      className={`p-2 border-r border-neutral-200 text-center ${
                        t.id === 'recess' ? 'bg-amber-100/70 text-amber-950 w-16' : 'w-24'
                      }`}
                    >
                      <div className="truncate">{t.label}</div>
                      <div className="text-[9px] font-normal text-neutral-500">{t.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-neutral-50/80">
                    <td className="p-2 border-r border-neutral-200 font-bold sticky left-0 bg-white z-10 shadow-xs text-neutral-900 truncate">
                      {teacher.name}
                    </td>
                    {timings.map((t) => {
                      if (t.id === 'recess') {
                        return (
                          <td
                            key={t.id}
                            className="p-1 border-r border-neutral-200 text-center font-bold text-[10px] bg-amber-50 text-amber-900 italic"
                          >
                            RECESS
                          </td>
                        );
                      }

                      const cellVal = teacher.periods[t.id] || '';
                      const parsed = parsePeriodValue(cellVal);
                      const cat = classifySubject(cellVal);
                      const isFilterMatch =
                        selectedCategory === 'all' || cat.id === selectedCategory;

                      const hasClash =
                        parsed.isClassBooking &&
                        conflicts.some(
                          (c) =>
                            c.periodId === t.id &&
                            c.className.toUpperCase() === parsed.className.toUpperCase() &&
                            (c.teacher1Name === teacher.name || c.teacher2Name === teacher.name)
                        );

                      return (
                        <td
                          key={t.id}
                          onClick={() => onOpenSlotAssign(teacher, t)}
                          className={`p-1 border-r border-neutral-200 text-center cursor-pointer transition-colors ${
                            hasClash ? 'bg-red-50 ring-1 ring-red-400' : ''
                          } ${!isFilterMatch ? 'opacity-30' : ''}`}
                        >
                          {parsed.isFree ? (
                            <span className="text-neutral-300 text-[10px] italic">Free</span>
                          ) : parsed.isClassBooking ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${cat.dotBg}`}></span>
                                <span className="font-bold text-[10px] text-neutral-900 bg-neutral-100 px-1 rounded">
                                  {parsed.className}
                                </span>
                              </div>
                              <span className="text-[9.5px] font-semibold text-neutral-800 truncate max-w-[84px] mt-0.5">
                                {parsed.subject}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-medium text-neutral-700">
                              {parsed.raw}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Jump to PDF & Excel Export banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> PDF & Excel Ready
          </div>
          <h4 className="text-sm font-bold text-white mt-0.5">Official Export Center</h4>
          <p className="text-[11px] text-neutral-300">
            Generate vector A4 landscape PDF or Microsoft Excel (.xlsx) files with one tap.
          </p>
        </div>
        <button
          onClick={onGoToExport}
          className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95 shrink-0"
        >
          Export
        </button>
      </div>
    </div>
  );
}
