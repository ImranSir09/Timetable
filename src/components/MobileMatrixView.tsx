import { useState } from 'react';
import {
  Users,
  Clock,
  LayoutGrid,
  AlertTriangle,
  Plus,
  ArrowRight,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { PeriodTiming, ScheduleConflict, TeacherSchedule } from '../types';
import { parsePeriodValue } from '../utils/timetableLogic';

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

  return (
    <div className="space-y-4 pb-20">
      {/* Conflicts Alert Banner */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-lg text-red-600 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <h3 className="font-bold text-red-900 flex items-center gap-1">
                {conflicts.length} Schedule Collision{conflicts.length > 1 ? 's' : ''} Detected
              </h3>
              <p className="text-red-700 mt-0.5 leading-snug">
                The same class is assigned to multiple teachers during the same period:
              </p>
              <div className="mt-2 space-y-1">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white/90 border border-red-200 rounded-lg p-2 text-[11px] text-red-800"
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
            </div>
          </div>
        </div>
      )}

      {/* Top Controls & View Mode Selector */}
      <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Timetable View
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">
            {teachers.length} Staff • {timings.filter((t) => !t.isSystem).length} Periods
          </span>
        </div>

        {/* Segmented Control */}
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
      </div>

      {/* VIEW 1: BY TEACHER (MOBILE CARDS) */}
      {viewMode === 'teacher' && (
        <div className="space-y-3.5">
          {teachers.map((teacher, tIdx) => {
            // Count teaching periods vs free
            const teachingCount = timings.filter((t) => {
              if (t.id === 'recess' || t.id === 'assembly' || t.id === 'rollCall') return false;
              const val = teacher.periods[t.id];
              const p = parsePeriodValue(val);
              return !p.isFree && !p.isSystem;
            }).length;

            return (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden transition-all hover:border-neutral-300"
              >
                {/* Teacher Card Header */}
                <div className="p-3.5 bg-neutral-50/80 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {teacher.name.charAt(0) || `${tIdx + 1}`}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 truncate">
                        {teacher.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {teacher.designation || 'Staff Member'} •{' '}
                        <span className="font-semibold text-neutral-800">
                          {teachingCount} teaching periods
                        </span>
                      </p>
                    </div>
                  </div>

                  {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 && (
                    <span className="text-[10px] bg-neutral-200/70 text-neutral-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                      {teacher.assignedSubjects.length} subjects
                    </span>
                  )}
                </div>

                {/* Periods Horizontal Scroller / Grid */}
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {timings.map((timing) => {
                      const isRecess = timing.id === 'recess';
                      const cellVal = teacher.periods[timing.id] || '';
                      const parsed = parsePeriodValue(cellVal);

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
                        return (
                          <div
                            key={timing.id}
                            className="col-span-2 py-1.5 px-3 bg-neutral-100 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center gap-1.5 text-[11px] text-neutral-600 font-bold tracking-wide"
                          >
                            <Coffee className="w-3.5 h-3.5 text-neutral-500" />
                            <span>RECESS ({timing.time})</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={timing.id}
                          type="button"
                          onClick={() => onOpenSlotAssign(teacher, timing)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-98 ${
                            hasClash
                              ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
                              : parsed.isFree
                              ? 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-400'
                              : 'bg-white border-neutral-200 hover:border-black shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">
                              {timing.label}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-medium">
                              {timing.time}
                            </span>
                          </div>

                          <div className="mt-1.5 min-h-[32px] flex flex-col justify-center">
                            {parsed.isFree ? (
                              <span className="text-xs text-neutral-400 italic">Free Slot</span>
                            ) : parsed.isClassBooking ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-black text-white text-[11px] font-black rounded-md shrink-0">
                                  {parsed.className}
                                </span>
                                <span className="text-xs font-semibold text-neutral-900 truncate">
                                  {parsed.subject}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-neutral-800">
                                {parsed.raw}
                              </span>
                            )}
                          </div>

                          {hasClash && (
                            <div className="mt-1 text-[9px] font-bold text-red-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Duplicate Class Booking
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

          <button
            onClick={onAddTeacher}
            id="btn-add-teacher-matrix"
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-black bg-white/70 hover:bg-white text-xs font-bold text-neutral-700 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Another Staff Member
          </button>
        </div>
      )}

      {/* VIEW 2: BY PERIOD (TIME SLOT SLICE) */}
      {viewMode === 'period' && (
        <div className="space-y-3.5">
          {/* Period Selector Carousel */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {timings.map((t) => {
              const isSelected = selectedPeriodId === t.id;
              const isRecess = t.id === 'recess';
              const hasPeriodClash = conflicts.some((c) => c.periodId === t.id);

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedPeriodId(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-xs'
                      : isRecess
                      ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      : hasPeriodClash
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div>{t.label}</div>
                  <div className="text-[10px] font-normal opacity-80">{t.time}</div>
                </button>
              );
            })}
          </div>

          {/* Active Period Card */}
          {(() => {
            const activeTiming = timings.find((t) => t.id === selectedPeriodId);
            if (!activeTiming) return null;

            if (activeTiming.id === 'recess') {
              return (
                <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center shadow-xs">
                  <Coffee className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                  <h4 className="text-base font-bold text-neutral-800">Recess Period</h4>
                  <p className="text-xs text-neutral-500 mt-1">{activeTiming.time}</p>
                  <p className="text-xs text-neutral-600 mt-3 max-w-xs mx-auto">
                    Scheduled lunch break for all classes and staff members. No period assignments needed.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">{activeTiming.label}</h4>
                    <p className="text-xs text-neutral-500 font-medium">{activeTiming.time}</p>
                  </div>
                  <span className="text-xs font-semibold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-lg">
                    {teachers.length} Staff
                  </span>
                </div>

                <div className="divide-y divide-neutral-100">
                  {teachers.map((teacher) => {
                    const cellVal = teacher.periods[activeTiming.id] || '';
                    const parsed = parsePeriodValue(cellVal);
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
                        className={`p-3 flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors ${
                          hasClash ? 'bg-red-50/50' : ''
                        }`}
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
                            <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-lg">
                              <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-black rounded">
                                {parsed.className}
                              </span>
                              <span className="text-xs font-bold text-neutral-900">
                                {parsed.subject}
                              </span>
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
            <span className="text-xs font-bold text-neutral-800">Complete Master Grid</span>
            <span className="text-[10px] text-neutral-500 italic">Scroll horizontally & tap to edit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead className="bg-neutral-100 text-neutral-700 text-[11px] uppercase font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-2 border-r border-neutral-200 sticky left-0 bg-neutral-100 z-10 w-36 shadow-xs">
                    Staff Name
                  </th>
                  {timings.map((t) => (
                    <th
                      key={t.id}
                      className={`p-2 border-r border-neutral-200 text-center ${
                        t.id === 'recess' ? 'bg-neutral-200 w-16' : 'w-24'
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
                            className="p-1 border-r border-neutral-200 text-center font-bold text-[10px] bg-neutral-100 text-neutral-500 italic"
                          >
                            RECESS
                          </td>
                        );
                      }

                      const cellVal = teacher.periods[t.id] || '';
                      const parsed = parsePeriodValue(cellVal);
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
                          className={`p-1 border-r border-neutral-200 text-center cursor-pointer hover:bg-neutral-100 transition-colors ${
                            hasClash ? 'bg-red-50' : ''
                          }`}
                        >
                          {parsed.isFree ? (
                            <span className="text-neutral-300 text-[10px] italic">Free</span>
                          ) : parsed.isClassBooking ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-[10px] text-neutral-900 bg-neutral-100 px-1 rounded">
                                {parsed.className}
                              </span>
                              <span className="text-[10px] font-medium text-neutral-700 truncate max-w-[80px]">
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

      {/* Quick Jump to A4 Export banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Ready for Print
          </div>
          <h4 className="text-sm font-bold text-white mt-0.5">A4 Landscape Output</h4>
          <p className="text-[11px] text-neutral-300">
            Strictly formatted for 1-page high-resolution print or PDF.
          </p>
        </div>
        <button
          onClick={onGoToExport}
          className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95 shrink-0"
        >
          View A4
        </button>
      </div>
    </div>
  );
}
