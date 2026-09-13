export interface TeacherSchedule {
  id: string;
  name: string;
  designation?: string;
  assignedSubjects: string[]; // Remembered subjects for this teacher, e.g. ["8th - Math", "7th - Science"]
  periods: Record<string, string>; // periodId -> cellValue (e.g. "8th - Math", "Free", "Assembly")
}

export interface PeriodTiming {
  id: string;
  label: string;
  time: string;
  isSystem?: boolean;
}

export interface SchoolProfile {
  schoolName: string;
  address: string;
  district: string;
  zone: string;
  uDiseCode: string;
  session: string;
  officeTitle: string;
  icTimetableTitle: string;
  headmasterTitle: string;
  footerNote: string;
}

export interface ScheduleConflict {
  id: string;
  periodId: string;
  periodLabel: string;
  periodTime: string;
  className: string;
  teacher1Name: string;
  teacher2Name: string;
  subject1: string;
  subject2: string;
}
