import { PeriodTiming, ScheduleConflict, TeacherSchedule } from '../types';

/**
 * Standard school classes commonly taught in Govt Middle / High Schools
 */
export const STANDARD_CLASSES = [
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '5th',
  '4th',
  '3rd',
  '2nd',
  '1st',
];

/**
 * Standard academic and co-curricular subjects
 */
export const STANDARD_SUBJECTS = [
  'Math',
  'Science',
  'English',
  'Urdu',
  'Kashmiri',
  'Social Science',
  'History',
  'Geography',
  'Hindi',
  'Computer',
  'General Knowledge',
  'Art & Craft',
  'Physical Ed / Sports',
];

export const SPECIAL_SLOTS = [
  'Free',
  'Library',
  'Assembly',
  'Roll Call',
  'Remedial / Mentoring',
];

/**
 * Parse a period slot string into class and subject components.
 * Format examples:
 * - "8th - Math" => { className: "8th", subject: "Math", isClassBooking: true }
 * - "Free" => { className: "", subject: "Free", isClassBooking: false }
 * - "Assembly" => { className: "", subject: "Assembly", isClassBooking: false }
 */
export function parsePeriodValue(value: string): {
  className: string;
  subject: string;
  isClassBooking: boolean;
  isFree: boolean;
  isSystem: boolean;
  raw: string;
} {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      className: '',
      subject: '',
      isClassBooking: false,
      isFree: true,
      isSystem: false,
      raw: '',
    };
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'free') {
    return {
      className: '',
      subject: 'Free',
      isClassBooking: false,
      isFree: true,
      isSystem: false,
      raw: trimmed,
    };
  }

  if (['assembly', 'roll call', 'recess'].includes(lower)) {
    return {
      className: '',
      subject: trimmed,
      isClassBooking: false,
      isFree: false,
      isSystem: true,
      raw: trimmed,
    };
  }

  // Check for "<Class> - <Subject>" pattern
  const parts = trimmed.split('-');
  if (parts.length >= 2) {
    const className = parts[0].trim();
    const subject = parts.slice(1).join('-').trim();
    return {
      className,
      subject,
      isClassBooking: Boolean(className),
      isFree: false,
      isSystem: false,
      raw: trimmed,
    };
  }

  return {
    className: '',
    subject: trimmed,
    isClassBooking: false,
    isFree: false,
    isSystem: false,
    raw: trimmed,
  };
}

/**
 * Format a class and subject into standard "Class - Subject" string
 */
export function formatPeriodValue(className: string, subject: string): string {
  if (!className && !subject) return '';
  if (!className) return subject;
  return `${className.trim()} - ${subject.trim()}`;
}

/**
 * Detect all conflicts in the timetable:
 * A conflict occurs when two different teachers are scheduled to teach the same class
 * in the same period! (e.g. Teacher A has "8th - Math" and Teacher B has "8th - Science" in Period I)
 */
export function detectClashes(
  teachers: TeacherSchedule[],
  timings: PeriodTiming[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (const timing of timings) {
    if (timing.id === 'recess') continue;

    // Track class reservations in this period: className -> { teacherName, subject }
    const classBookings: Record<string, { teacherName: string; subject: string; teacherId: string }> = {};

    for (const teacher of teachers) {
      const cellVal = teacher.periods[timing.id] || '';
      const parsed = parsePeriodValue(cellVal);

      if (parsed.isClassBooking && parsed.className) {
        const classKey = parsed.className.toUpperCase();
        if (classBookings[classKey]) {
          // Clash detected!
          conflicts.push({
            id: `${timing.id}-${classKey}-${teacher.id}`,
            periodId: timing.id,
            periodLabel: timing.label,
            periodTime: timing.time,
            className: parsed.className,
            teacher1Name: classBookings[classKey].teacherName,
            teacher2Name: teacher.name,
            subject1: classBookings[classKey].subject,
            subject2: parsed.subject,
          });
        } else {
          classBookings[classKey] = {
            teacherName: teacher.name,
            subject: parsed.subject,
            teacherId: teacher.id,
          };
        }
      }
    }
  }

  return conflicts;
}

/**
 * Check if a specific class is already scheduled in a given period by another teacher
 */
export function isClassOccupiedInPeriod(
  teachers: TeacherSchedule[],
  periodId: string,
  className: string,
  excludeTeacherId?: string
): { isOccupied: boolean; teacherName?: string; subject?: string } {
  if (!className) return { isOccupied: false };
  const targetClass = className.trim().toUpperCase();

  for (const teacher of teachers) {
    if (excludeTeacherId && teacher.id === excludeTeacherId) continue;
    const cellVal = teacher.periods[periodId] || '';
    const parsed = parsePeriodValue(cellVal);
    if (parsed.isClassBooking && parsed.className.toUpperCase() === targetClass) {
      return {
        isOccupied: true,
        teacherName: teacher.name,
        subject: parsed.subject,
      };
    }
  }

  return { isOccupied: false };
}

/**
 * Check if a subject (e.g. "8th - Math") is already assigned to a different teacher.
 * This satisfies the requirement:
 * "remember what subject has been assigned to what teacher and donot duplicate or repeat in another cell for another teacher"
 */
export function isSubjectAssignedToOtherTeacher(
  teachers: TeacherSchedule[],
  formattedSubject: string,
  currentTeacherId: string
): { isAssigned: boolean; teacherName?: string } {
  const target = formattedSubject.trim().toLowerCase();
  if (!target || target === 'free' || target === 'assembly' || target === 'roll call') {
    return { isAssigned: false };
  }

  for (const teacher of teachers) {
    if (teacher.id === currentTeacherId) continue;

    // Check remembered subjects list
    const hasInMemory = (teacher.assignedSubjects || []).some(
      (s) => s.trim().toLowerCase() === target
    );
    if (hasInMemory) {
      return { isAssigned: true, teacherName: teacher.name };
    }

    // Also check current active timetable assignments
    const teachesInTimetable = Object.values(teacher.periods).some(
      (val) => val.trim().toLowerCase() === target
    );
    if (teachesInTimetable) {
      return { isAssigned: true, teacherName: teacher.name };
    }
  }

  return { isAssigned: false };
}

/**
 * Calculates cascading timings for successive periods
 */
export function calculateCascadedTimings(
  timings: PeriodTiming[],
  updatedIndex: number,
  newTime: string
): PeriodTiming[] {
  const newTimings = [...timings];
  newTimings[updatedIndex] = { ...newTimings[updatedIndex], time: newTime };

  const timeToMinutes = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h >= 1 && h <= 7) h += 12; // PM adjustment in school context
    return h * 60 + m;
  };

  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  for (let i = updatedIndex; i < newTimings.length - 1; i++) {
    const current = newTimings[i].time;
    const next = newTimings[i + 1].time;

    const currentParts = current.split('-').map((s) => s.trim());
    if (currentParts.length < 2) break;

    const currentEndMins = timeToMinutes(currentParts[1]);
    if (currentEndMins === null) break;

    const nextParts = next.split('-').map((s) => s.trim());
    if (nextParts.length < 2) {
      newTimings[i + 1] = {
        ...newTimings[i + 1],
        time: `${minutesToTime(currentEndMins)} - `,
      };
      break;
    }

    const nextStartMins = timeToMinutes(nextParts[0]);
    const nextEndMins = timeToMinutes(nextParts[1]);

    if (nextStartMins !== null && nextEndMins !== null) {
      const duration = nextEndMins - nextStartMins;
      const newNextStart = currentEndMins;
      const newNextEnd = newNextStart + duration;
      newTimings[i + 1] = {
        ...newTimings[i + 1],
        time: `${minutesToTime(newNextStart)} - ${minutesToTime(newNextEnd)}`,
      };
    } else {
      newTimings[i + 1] = {
        ...newTimings[i + 1],
        time: `${minutesToTime(currentEndMins)} - ${nextParts[1]}`,
      };
    }
  }

  return newTimings;
}
