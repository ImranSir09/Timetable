import { PeriodTiming, SchoolProfile, TeacherSchedule } from '../types';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  schoolName: 'GOVT. MIDDLE SCHOOL',
  address: 'Zone Anantnag, J&K',
  district: 'Anantnag',
  zone: 'Zone Bidder',
  uDiseCode: '01234567890',
  session: '2026-2027',
  officeTitle: 'OFFICE OF THE HEADMASTER / PRINCIPAL',
  icTimetableTitle: 'I/C Timetable',
  headmasterTitle: 'Headmaster Signature & Seal',
  footerNote: 'Note: Staff members are requested to strictly adhere to the scheduled timings. Short breaks are adjusted as per institutional requirements.',
};

export const DEFAULT_TIMINGS: PeriodTiming[] = [
  { id: 'assembly', label: 'Morning Assembly', time: '10:00 - 10:30', isSystem: true },
  { id: 'rollCall', label: 'Roll Call', time: '10:30 - 10:50', isSystem: true },
  { id: 'p1', label: 'Period I', time: '10:50 - 11:20' },
  { id: 'p2', label: 'Period II', time: '11:20 - 11:50' },
  { id: 'p3', label: 'Period III', time: '11:50 - 12:20' },
  { id: 'recess', label: 'Recess Period', time: '12:30 - 02:00', isSystem: true },
  { id: 'p4', label: 'Period IV', time: '02:00 - 02:30' },
  { id: 'p5', label: 'Period V', time: '02:30 - 03:00' },
  { id: 'p6', label: 'Period VI', time: '03:00 - 03:30' },
  { id: 'p7', label: 'Period VII', time: '03:30 - 04:00' },
];

export const DEFAULT_TEACHERS: TeacherSchedule[] = [
  {
    id: 't-imran',
    name: 'Imran Gani Mugloo',
    designation: 'Teacher / Master',
    assignedSubjects: ['8th - Math', '7th - Science', '6th - English', '8th - Science', '7th - Math'],
    periods: {
      assembly: 'Assembly',
      rollCall: 'Roll Call',
      p1: '8th - Math',
      p2: '7th - Science',
      p3: '6th - English',
      p4: 'Free',
      p5: '8th - Science',
      p6: '7th - Math',
      p7: 'Free',
    },
  },
  {
    id: 't-staff2',
    name: 'Staff Member 2',
    designation: 'Teacher',
    assignedSubjects: ['6th - Urdu', '8th - Geography', '7th - English', '6th - Science', '7th - Urdu'],
    periods: {
      assembly: 'Assembly',
      rollCall: 'Roll Call',
      p1: '6th - Urdu',
      p2: '8th - Geography',
      p3: '7th - English',
      p4: '6th - Science',
      p5: 'Free',
      p6: 'Free',
      p7: '7th - Urdu',
    },
  },
  {
    id: 't-staff3',
    name: 'Staff Member 3',
    designation: 'General Line Teacher',
    assignedSubjects: ['7th - Social Science', '6th - Math', '8th - Urdu', '7th - Kashmiri'],
    periods: {
      assembly: 'Assembly',
      rollCall: 'Roll Call',
      p1: '7th - Social Science',
      p2: '6th - Math',
      p3: '8th - Urdu',
      p4: '7th - Kashmiri',
      p5: '6th - English',
      p6: '8th - Kashmiri',
      p7: 'Free',
    },
  },
];

const STORAGE_KEYS = {
  PROFILE: 'academic_tt_profile_v1',
  TIMINGS: 'academic_tt_timings_v1',
  TEACHERS: 'academic_tt_teachers_v1',
};

export function loadStoredProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return { ...DEFAULT_SCHOOL_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load profile from storage', e);
  }
  return DEFAULT_SCHOOL_PROFILE;
}

export function saveStoredProfile(profile: SchoolProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function loadStoredTimings(): PeriodTiming[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load timings', e);
  }
  return DEFAULT_TIMINGS;
}

export function saveStoredTimings(timings: PeriodTiming[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMINGS, JSON.stringify(timings));
  } catch (e) {
    console.error('Failed to save timings', e);
  }
}

export function loadStoredTeachers(): TeacherSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (raw) {
      const parsed: TeacherSchedule[] = JSON.parse(raw);
      // Ensure assignedSubjects array is present on each teacher
      return parsed.map((t) => ({
        ...t,
        assignedSubjects: t.assignedSubjects || [],
      }));
    }
  } catch (e) {
    console.error('Failed to load teachers', e);
  }
  return DEFAULT_TEACHERS;
}

export function saveStoredTeachers(teachers: TeacherSchedule[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.error('Failed to save teachers', e);
  }
}

export function resetAllToDefaults(): {
  profile: SchoolProfile;
  timings: PeriodTiming[];
  teachers: TeacherSchedule[];
} {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.TIMINGS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
  } catch (e) {
    console.error(e);
  }
  return {
    profile: DEFAULT_SCHOOL_PROFILE,
    timings: DEFAULT_TIMINGS,
    teachers: DEFAULT_TEACHERS,
  };
}
