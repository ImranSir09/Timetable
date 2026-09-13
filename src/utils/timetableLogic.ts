import {
  PeriodTiming,
  ScheduleConflict,
  TeacherSchedule,
  SubjectCategory,
  SubjectCategoryInfo,
} from '../types';

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
 * Converts HH:MM string to absolute minutes from midnight.
 * In school context, hours 1 to 7 are PM (13:00 to 19:00).
 */
export function timeToMinutes(timeStr: string): number | null {
  const match = (timeStr || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h >= 1 && h <= 7) h += 12; // PM adjustment for afternoon school hours
  return h * 60 + m;
}

/**
 * Converts absolute minutes from midnight to 12-hour school display (HH:MM)
 */
export function minutesToTime(mins: number): string {
  const normalized = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Extracts start minutes, end minutes, and duration in minutes from a time range string
 */
export function parseTimeRange(timeStr: string): {
  startMins: number | null;
  endMins: number | null;
  durationMins: number;
} {
  const parts = (timeStr || '').split('-').map((s) => s.trim());
  if (parts.length < 2) return { startMins: null, endMins: null, durationMins: 0 };
  const startMins = timeToMinutes(parts[0]);
  const endMins = timeToMinutes(parts[1]);
  if (startMins === null || endMins === null) {
    return { startMins, endMins, durationMins: 0 };
  }
  const durationMins = Math.max(0, endMins - startMins);
  return { startMins, endMins, durationMins };
}

/**
 * Returns period duration in minutes (e.g. 40)
 */
export function getPeriodDuration(timeStr: string): number {
  return parseTimeRange(timeStr).durationMins;
}

/**
 * Formats start and end minutes into "HH:MM - HH:MM"
 */
export function formatTimeRange(startMins: number, endMins: number): string {
  return `${minutesToTime(startMins)} - ${minutesToTime(endMins)}`;
}

/**
 * Ensures all periods connect seamlessly with zero gaps:
 * Sets each period's start time to match the preceding period's end time,
 * preserving each period's own configured duration.
 */
export function alignContinuousTimings(timings: PeriodTiming[]): PeriodTiming[] {
  if (!timings || timings.length === 0) return [];
  const result: PeriodTiming[] = [];

  let currentStartMins: number = 10 * 60; // default 10:00 AM

  for (let i = 0; i < timings.length; i++) {
    const item = timings[i];
    const { startMins, durationMins } = parseTimeRange(item.time);

    if (i === 0 && startMins !== null) {
      currentStartMins = startMins;
    }

    const effectiveDuration = durationMins > 0 ? durationMins : (item.id === 'recess' ? 40 : 35);
    const currentEndMins = currentStartMins + effectiveDuration;

    result.push({
      ...item,
      time: formatTimeRange(currentStartMins, currentEndMins),
    });

    currentStartMins = currentEndMins;
  }

  return result;
}

/**
 * Adjusts a specific period's duration by deltaMins (e.g. +5 or -5 minutes)
 * and automatically ripples forward so all subsequent periods remain contiguous.
 */
export function adjustPeriodDuration(
  timings: PeriodTiming[],
  periodId: string,
  deltaMins: number
): PeriodTiming[] {
  const index = timings.findIndex((t) => t.id === periodId);
  if (index === -1) return timings;

  const current = timings[index];
  const { startMins, durationMins } = parseTimeRange(current.time);
  if (startMins === null) return timings;

  const newDuration = Math.max(5, (durationMins || 35) + deltaMins);
  const newEndMins = startMins + newDuration;
  const newTime = formatTimeRange(startMins, newEndMins);

  return calculateCascadedTimings(timings, index, newTime);
}

/**
 * Reorders a period from fromIndex to toIndex, and then re-aligns continuous timings
 */
export function reorderTimings(
  timings: PeriodTiming[],
  fromIndex: number,
  toIndex: number
): PeriodTiming[] {
  if (fromIndex < 0 || fromIndex >= timings.length || toIndex < 0 || toIndex >= timings.length) {
    return timings;
  }
  const cloned = [...timings];
  const [removed] = cloned.splice(fromIndex, 1);
  cloned.splice(toIndex, 0, removed);
  return alignContinuousTimings(cloned);
}

/**
 * Standard Presets for Government Academic Schedules
 */
export const TIMING_PRESETS = [
  {
    id: 'standard40',
    title: 'Standard Schedule (40m Periods)',
    description: '10:00 AM to 03:50 PM • 7 Periods (40m each) • Recess (40m after Period III)',
    timings: [
      { id: 'assembly', label: 'Morning Assembly', time: '10:00 - 10:20', isSystem: true },
      { id: 'rollCall', label: 'Roll Call', time: '10:20 - 10:30', isSystem: true },
      { id: 'p1', label: 'Period I', time: '10:30 - 11:10' },
      { id: 'p2', label: 'Period II', time: '11:10 - 11:50' },
      { id: 'p3', label: 'Period III', time: '11:50 - 12:30' },
      { id: 'recess', label: 'Recess Period', time: '12:30 - 01:10', isSystem: true },
      { id: 'p4', label: 'Period IV', time: '01:10 - 01:50' },
      { id: 'p5', label: 'Period V', time: '01:50 - 02:30' },
      { id: 'p6', label: 'Period VI', time: '02:30 - 03:10' },
      { id: 'p7', label: 'Period VII', time: '03:10 - 03:50' },
    ],
  },
  {
    id: 'winter35',
    title: 'Winter / Short Day (35m Periods)',
    description: '10:00 AM to 03:25 PM • 7 Periods (35m each) • Recess (40m after Period III)',
    timings: [
      { id: 'assembly', label: 'Morning Assembly', time: '10:00 - 10:15', isSystem: true },
      { id: 'rollCall', label: 'Roll Call', time: '10:15 - 10:25', isSystem: true },
      { id: 'p1', label: 'Period I', time: '10:25 - 11:00' },
      { id: 'p2', label: 'Period II', time: '11:00 - 11:35' },
      { id: 'p3', label: 'Period III', time: '11:35 - 12:10' },
      { id: 'recess', label: 'Recess Period', time: '12:10 - 12:50', isSystem: true },
      { id: 'p4', label: 'Period IV', time: '12:50 - 01:25' },
      { id: 'p5', label: 'Period V', time: '01:25 - 02:00' },
      { id: 'p6', label: 'Period VI', time: '02:00 - 02:35' },
      { id: 'p7', label: 'Period VII', time: '02:35 - 03:10' },
    ],
  },
  {
    id: 'postPeriod4Recess',
    title: 'Midday Recess (After Period IV)',
    description: '10:00 AM to 04:00 PM • Recess after 4th Period • 7 Periods',
    timings: [
      { id: 'assembly', label: 'Morning Assembly', time: '10:00 - 10:20', isSystem: true },
      { id: 'rollCall', label: 'Roll Call', time: '10:20 - 10:30', isSystem: true },
      { id: 'p1', label: 'Period I', time: '10:30 - 11:10' },
      { id: 'p2', label: 'Period II', time: '11:10 - 11:50' },
      { id: 'p3', label: 'Period III', time: '11:50 - 12:30' },
      { id: 'p4', label: 'Period IV', time: '12:30 - 01:10' },
      { id: 'recess', label: 'Recess Period', time: '01:10 - 01:50', isSystem: true },
      { id: 'p5', label: 'Period V', time: '01:50 - 02:30' },
      { id: 'p6', label: 'Period VI', time: '02:30 - 03:10' },
      { id: 'p7', label: 'Period VII', time: '03:10 - 03:50' },
    ],
  },
];

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

/**
 * Subject Category Registry with complete visual tokens for Tailwind
 */
export const SUBJECT_CATEGORY_REGISTRY: Record<SubjectCategory, SubjectCategoryInfo> = {
  core: {
    id: 'core',
    name: 'Core Academic',
    shortName: 'Core',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-200',
    borderAccent: 'border-l-indigo-600',
    bgLight: 'bg-indigo-50/70',
    dotBg: 'bg-indigo-600',
    iconName: 'BookOpen',
    description: 'STEM & Languages (Math, Science, English, Urdu, Kashmiri, Hindi, Social Science)',
  },
  lab: {
    id: 'lab',
    name: 'Lab & Practical',
    shortName: 'Lab',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    badgeBorder: 'border-teal-200',
    borderAccent: 'border-l-teal-600',
    bgLight: 'bg-teal-50/70',
    dotBg: 'bg-teal-600',
    iconName: 'FlaskConical',
    description: 'Computer lab, Science practicals, ICT, and hands-on experiments',
  },
  sports: {
    id: 'sports',
    name: 'Sports & PE',
    shortName: 'Sports',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-200',
    borderAccent: 'border-l-emerald-600',
    bgLight: 'bg-emerald-50/70',
    dotBg: 'bg-emerald-600',
    iconName: 'Activity',
    description: 'Physical Education, Yoga, Fitness drill, Games, and Outdoor Sports',
  },
  arts: {
    id: 'arts',
    name: 'Arts & Creative',
    shortName: 'Arts',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-200',
    borderAccent: 'border-l-purple-600',
    bgLight: 'bg-purple-50/70',
    dotBg: 'bg-purple-600',
    iconName: 'Palette',
    description: 'Art & Craft, Drawing, Music, Painting, and Co-Curricular Arts',
  },
  advisory: {
    id: 'advisory',
    name: 'Advisory & Library',
    shortName: 'Advisory',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200',
    borderAccent: 'border-l-amber-600',
    bgLight: 'bg-amber-50/70',
    dotBg: 'bg-amber-600',
    iconName: 'Library',
    description: 'Library reading, Remedial mentoring, Morning Assembly, and Roll Call',
  },
  free: {
    id: 'free',
    name: 'Free Period',
    shortName: 'Free',
    badgeBg: 'bg-neutral-100',
    badgeText: 'text-neutral-600',
    badgeBorder: 'border-neutral-200',
    borderAccent: 'border-l-neutral-300',
    bgLight: 'bg-neutral-50/50',
    dotBg: 'bg-neutral-400',
    iconName: 'Coffee',
    description: 'Unassigned planning, grading, or off period',
  },
  other: {
    id: 'other',
    name: 'General / Other',
    shortName: 'Other',
    badgeBg: 'bg-neutral-100',
    badgeText: 'text-neutral-700',
    badgeBorder: 'border-neutral-200',
    borderAccent: 'border-l-neutral-400',
    bgLight: 'bg-neutral-50/60',
    dotBg: 'bg-neutral-500',
    iconName: 'Bookmark',
    description: 'Special duties and miscellaneous assignments',
  },
};

/**
 * Classify any subject or slot string into its respective academic workload category
 */
export function classifySubject(rawSlot: string): SubjectCategoryInfo {
  const parsed = parsePeriodValue(rawSlot);

  if (parsed.isFree || !parsed.raw) {
    return SUBJECT_CATEGORY_REGISTRY.free;
  }

  const textToTest = `${parsed.subject} ${parsed.raw}`.toLowerCase();

  // 1. Lab & Practical / Computer
  if (
    textToTest.includes('lab') ||
    textToTest.includes('computer') ||
    textToTest.includes('ict') ||
    textToTest.includes('it ') ||
    textToTest.includes('practical') ||
    textToTest.includes('robotics') ||
    textToTest.includes('coding') ||
    textToTest.includes('tech')
  ) {
    return SUBJECT_CATEGORY_REGISTRY.lab;
  }

  // 2. Sports & Physical Education
  if (
    textToTest.includes('sport') ||
    textToTest.includes('physical') ||
    textToTest.includes('pe') ||
    textToTest.includes('p.e') ||
    textToTest.includes('yoga') ||
    textToTest.includes('pt') ||
    textToTest.includes('games') ||
    textToTest.includes('fitness') ||
    textToTest.includes('drill') ||
    textToTest.includes('athletics')
  ) {
    return SUBJECT_CATEGORY_REGISTRY.sports;
  }

  // 3. Arts & Creative Activity
  if (
    textToTest.includes('art') ||
    textToTest.includes('craft') ||
    textToTest.includes('drawing') ||
    textToTest.includes('music') ||
    textToTest.includes('painting') ||
    textToTest.includes('dance') ||
    textToTest.includes('drama') ||
    textToTest.includes('supw') ||
    textToTest.includes('activity')
  ) {
    return SUBJECT_CATEGORY_REGISTRY.arts;
  }

  // 4. Advisory, Library, Remedial, Assembly
  if (
    textToTest.includes('library') ||
    textToTest.includes('remedial') ||
    textToTest.includes('mentor') ||
    textToTest.includes('general knowledge') ||
    textToTest.includes('gk') ||
    textToTest.includes('moral') ||
    textToTest.includes('value') ||
    textToTest.includes('assembly') ||
    textToTest.includes('roll call') ||
    textToTest.includes('guidance')
  ) {
    return SUBJECT_CATEGORY_REGISTRY.advisory;
  }

  // 5. Core Academics (STEM & Languages)
  if (
    textToTest.includes('math') ||
    textToTest.includes('science') ||
    textToTest.includes('english') ||
    textToTest.includes('urdu') ||
    textToTest.includes('kashmiri') ||
    textToTest.includes('hindi') ||
    textToTest.includes('social') ||
    textToTest.includes('history') ||
    textToTest.includes('geography') ||
    textToTest.includes('civics') ||
    textToTest.includes('physics') ||
    textToTest.includes('chemistry') ||
    textToTest.includes('biology') ||
    textToTest.includes('evs') ||
    textToTest.includes('arabic') ||
    textToTest.includes('sanskrit')
  ) {
    return SUBJECT_CATEGORY_REGISTRY.core;
  }

  // Default for class bookings (e.g. "8th - Economics") is core academic
  if (parsed.isClassBooking) {
    return SUBJECT_CATEGORY_REGISTRY.core;
  }

  return SUBJECT_CATEGORY_REGISTRY.other;
}

export interface TeacherWorkloadBreakdown {
  totalTeaching: number;
  totalFree: number;
  totalPeriods: number;
  core: number;
  lab: number;
  sports: number;
  arts: number;
  advisory: number;
  other: number;
  categories: Record<SubjectCategory, number>;
}

/**
 * Calculate the workload breakdown for a teacher
 */
export function getTeacherWorkloadBreakdown(
  teacher: TeacherSchedule,
  timings: PeriodTiming[]
): TeacherWorkloadBreakdown {
  const counts: Record<SubjectCategory, number> = {
    core: 0,
    lab: 0,
    sports: 0,
    arts: 0,
    advisory: 0,
    free: 0,
    other: 0,
  };

  let totalTeaching = 0;
  let totalFree = 0;
  let totalPeriods = 0;

  timings.forEach((t) => {
    if (t.id === 'recess') return;
    totalPeriods++;
    const val = teacher.periods[t.id] || 'Free';
    const cat = classifySubject(val);
    counts[cat.id] = (counts[cat.id] || 0) + 1;

    const parsed = parsePeriodValue(val);
    if (parsed.isFree) {
      totalFree++;
    } else {
      totalTeaching++;
    }
  });

  return {
    totalTeaching,
    totalFree,
    totalPeriods,
    core: counts.core,
    lab: counts.lab,
    sports: counts.sports,
    arts: counts.arts,
    advisory: counts.advisory,
    other: counts.other,
    categories: counts,
  };
}

export interface SchoolWorkloadOverview {
  totalTeachingPeriods: number;
  totalFreePeriods: number;
  totalCore: number;
  totalLab: number;
  totalSports: number;
  totalArts: number;
  totalAdvisory: number;
  teacherBreakdowns: {
    teacher: TeacherSchedule;
    breakdown: TeacherWorkloadBreakdown;
  }[];
}

/**
 * Calculate workload across all teachers in the school
 */
export function getSchoolWorkloadOverview(
  teachers: TeacherSchedule[],
  timings: PeriodTiming[]
): SchoolWorkloadOverview {
  let totalTeachingPeriods = 0;
  let totalFreePeriods = 0;
  let totalCore = 0;
  let totalLab = 0;
  let totalSports = 0;
  let totalArts = 0;
  let totalAdvisory = 0;

  const teacherBreakdowns = teachers.map((teacher) => {
    const breakdown = getTeacherWorkloadBreakdown(teacher, timings);
    totalTeachingPeriods += breakdown.totalTeaching;
    totalFreePeriods += breakdown.totalFree;
    totalCore += breakdown.core;
    totalLab += breakdown.lab;
    totalSports += breakdown.sports;
    totalArts += breakdown.arts;
    totalAdvisory += breakdown.advisory;

    return { teacher, breakdown };
  });

  return {
    totalTeachingPeriods,
    totalFreePeriods,
    totalCore,
    totalLab,
    totalSports,
    totalArts,
    totalAdvisory,
    teacherBreakdowns,
  };
}


