import { useState, useMemo } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  Bookmark,
  Trash2,
  Sparkles,
  Ban,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PeriodTiming, TeacherSchedule } from '../types';
import {
  STANDARD_CLASSES,
  STANDARD_SUBJECTS,
  SPECIAL_SLOTS,
  formatPeriodValue,
  parsePeriodValue,
  isClassOccupiedInPeriod,
  isSubjectAssignedToOtherTeacher,
  classifySubject,
} from '../utils/timetableLogic';

interface SlotAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherSchedule | null;
  timing: PeriodTiming | null;
  teachers: TeacherSchedule[];
  onAssign: (
    teacherId: string,
    periodId: string,
    value: string,
    saveToRememberedList?: boolean
  ) => void;
}

export default function SlotAssignModal({
  isOpen,
  onClose,
  teacher,
  timing,
  teachers,
  onAssign,
}: SlotAssignModalProps) {
  if (!isOpen || !teacher || !timing) return null;

  const currentValue = teacher.periods[timing.id] || '';
  const parsedCurrent = parsePeriodValue(currentValue);

  const [selectedClass, setSelectedClass] = useState<string>(parsedCurrent.className || '8th');
  const [selectedSubject, setSelectedSubject] = useState<string>(parsedCurrent.subject || 'Math');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [rememberSubject, setRememberSubject] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'remembered' | 'builder' | 'common'>(
    teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? 'remembered' : 'builder'
  );

  const effectiveSubject = customSubject.trim() || selectedSubject;
  const candidateFormatted = formatPeriodValue(selectedClass, effectiveSubject);

  // Check collision for candidate in builder:
  // 1. Is this class already busy in this period with another teacher?
  const classBusyCheck = useMemo(() => {
    if (!selectedClass || timing.id === 'recess') return { isOccupied: false };
    return isClassOccupiedInPeriod(teachers, timing.id, selectedClass, teacher.id);
  }, [teachers, timing.id, selectedClass, teacher.id]);

  // 2. Is this exact subject already assigned to another teacher?
  const subjectAssignedCheck = useMemo(() => {
    return isSubjectAssignedToOtherTeacher(teachers, candidateFormatted, teacher.id);
  }, [teachers, candidateFormatted, teacher.id]);

  const handleApply = (valueToApply: string, shouldRemember: boolean = false) => {
    onAssign(teacher.id, timing.id, valueToApply, shouldRemember);
    onClose();
  };

  const handleApplyBuilder = () => {
    if (classBusyCheck.isOccupied) {
      alert(
        `Conflict Blocked: Class ${selectedClass} is already taking "${classBusyCheck.subject}" with ${classBusyCheck.teacherName} in ${timing.label} (${timing.time}). A class cannot be double-booked!`
      );
      return;
    }

    if (subjectAssignedCheck.isAssigned) {
      alert(
        `Duplicate Subject Blocked: "${candidateFormatted}" is already designated to ${subjectAssignedCheck.teacherName}. Timetable rules require unique subject allocations across teachers.`
      );
      return;
    }

    handleApply(candidateFormatted, rememberSubject);
  };

  const handleSelectRemembered = (subjectStr: string) => {
    const parsed = parsePeriodValue(subjectStr);
    if (parsed.className) {
      const busy = isClassOccupiedInPeriod(teachers, timing.id, parsed.className, teacher.id);
      if (busy.isOccupied) {
        alert(
          `Conflict Detected: Class ${parsed.className} is already taking "${busy.subject}" with ${busy.teacherName} in ${timing.label} (${timing.time}).`
        );
        return;
      }
    }
    handleApply(subjectStr, false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200"
        >
          {/* Header */}
          <div className="p-4 bg-neutral-900 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Assign Period</span>
                <span>•</span>
                <span className="text-amber-400">{timing.label} ({timing.time})</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">{teacher.name}</h2>
              {currentValue ? (
                <p className="text-xs text-neutral-300 mt-0.5 flex items-center gap-1">
                  Current: <span className="font-semibold text-white bg-neutral-800 px-1.5 py-0.5 rounded">{currentValue}</span>
                </p>
              ) : (
                <p className="text-xs text-neutral-400 mt-0.5">Current: Not Assigned (Free)</p>
              )}
            </div>
            <button
              onClick={onClose}
              id="btn-close-slot-modal"
              aria-label="Close"
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-neutral-200 bg-neutral-50 px-3 pt-2 gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('remembered')}
              className={`pb-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'remembered'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Teacher's Subjects ({teacher.assignedSubjects?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`pb-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'builder'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Assign New Class
            </button>

            <button
              onClick={() => setActiveTab('common')}
              className={`pb-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'common'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Common Slots
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'remembered' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Remembered for {teacher.name.split(' ')[0]}
                  </span>
                  <span className="text-[11px] text-neutral-400">Tap to instantly assign</span>
                </div>

                {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {teacher.assignedSubjects.map((sub) => {
                      const parsed = parsePeriodValue(sub);
                      const busy = parsed.className
                        ? isClassOccupiedInPeriod(teachers, timing.id, parsed.className, teacher.id)
                        : { isOccupied: false };

                      return (
                        <button
                          key={sub}
                          disabled={busy.isOccupied}
                          onClick={() => handleSelectRemembered(sub)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative border-l-4 ${classifySubject(sub).borderAccent} ${
                            busy.isOccupied
                              ? 'bg-red-50/70 border-red-200 opacity-60 cursor-not-allowed'
                              : 'bg-white border-neutral-200 hover:border-black hover:shadow-xs active:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-neutral-900">{parsed.className || 'General'}</span>
                            {busy.isOccupied ? (
                              <span className="text-[10px] text-red-700 bg-red-100 font-semibold px-1 rounded flex items-center gap-0.5">
                                <Ban className="w-2.5 h-2.5" /> Clash
                              </span>
                            ) : (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${classifySubject(sub).badgeBg} ${classifySubject(sub).badgeText}`}>
                                {classifySubject(sub).shortName}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-neutral-800 mt-1 truncate">
                            {parsed.subject || sub}
                          </div>
                          {busy.isOccupied && (
                            <p className="text-[10px] text-red-600 mt-1 leading-tight">
                              Class busy with {busy.teacherName?.split(' ')[0]}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                    <Bookmark className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-neutral-700">No subjects remembered yet</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Switch to "Assign New Class" tab to assign a class and save it to this teacher's memory.
                    </p>
                    <button
                      onClick={() => setActiveTab('builder')}
                      className="mt-3 text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium"
                    >
                      Assign New Subject
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'builder' && (
              <div className="space-y-4">
                {/* Class selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                    1. Select Class
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STANDARD_CLASSES.map((cls) => {
                      const busy = isClassOccupiedInPeriod(teachers, timing.id, cls, teacher.id);
                      const isSelected = selectedClass === cls;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setSelectedClass(cls)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-black text-white border-black shadow-xs'
                              : busy.isOccupied
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          {cls}
                          {busy.isOccupied && ' ⚠️'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                    2. Select Subject
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STANDARD_SUBJECTS.map((sub) => {
                      const isSelected = selectedSubject === sub && !customSubject;
                      const probeFormatted = formatPeriodValue(selectedClass, sub);
                      const isAssignedOther = isSubjectAssignedToOtherTeacher(
                        teachers,
                        probeFormatted,
                        teacher.id
                      ).isAssigned;

                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(sub);
                            setCustomSubject('');
                          }}
                          className={`px-2 py-2 text-xs text-left rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                              : isAssignedOther
                              ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <div className="truncate">{sub}</div>
                          {isAssignedOther && (
                            <div className="text-[9px] text-neutral-400 truncate">Assigned</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Or Custom Subject Input */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      placeholder="Or type custom subject (e.g. Moral Science)..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Validation Warnings */}
                {classBusyCheck.isOccupied && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Period Clash:</span> Class{' '}
                      <strong>{selectedClass}</strong> is already assigned in this period to{' '}
                      <strong>{classBusyCheck.teacherName}</strong> ({classBusyCheck.subject}). A class cannot be in two rooms at once.
                    </div>
                  </div>
                )}

                {subjectAssignedCheck.isAssigned && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Duplicate Subject:</span> "
                      {candidateFormatted}" is already assigned to{' '}
                      <strong>{subjectAssignedCheck.teacherName}</strong>. System maintains unique subject-teacher mapping.
                    </div>
                  </div>
                )}

                {/* Remember Subject Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-remember-subject"
                    checked={rememberSubject}
                    onChange={(e) => setRememberSubject(e.target.checked)}
                    className="w-4 h-4 text-black rounded border-neutral-300 focus:ring-black"
                  />
                  <label htmlFor="chk-remember-subject" className="text-xs text-neutral-700 font-medium cursor-pointer">
                    Remember this subject for {teacher.name.split(' ')[0]} in quick picker
                  </label>
                </div>

                {/* Preview pill */}
                <div className="bg-neutral-100 p-3 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <span>Assignment Preview:</span>
                      {candidateFormatted && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${classifySubject(candidateFormatted).badgeBg} ${classifySubject(candidateFormatted).badgeText}`}>
                          {classifySubject(candidateFormatted).name}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-black mt-0.5">
                      {candidateFormatted || 'None'}
                    </div>
                  </div>
                  <button
                    onClick={handleApplyBuilder}
                    disabled={classBusyCheck.isOccupied || subjectAssignedCheck.isAssigned}
                    className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Apply Slot
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'common' && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-2">
                  Special & Non-Teaching Slots
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIAL_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleApply(slot, false)}
                      className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-left text-xs font-semibold text-neutral-800 transition-colors flex items-center justify-between"
                    >
                      <span>{slot}</span>
                      <Check className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between">
            <button
              onClick={() => handleApply('Free', false)}
              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear / Set Free
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
