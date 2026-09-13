/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import {
  PeriodTiming,
  SchoolProfile,
  TeacherSchedule,
} from './types';
import {
  loadStoredProfile,
  saveStoredProfile,
  loadStoredTimings,
  saveStoredTimings,
  loadStoredTeachers,
  saveStoredTeachers,
  resetAllToDefaults,
} from './utils/storage';
import {
  detectClashes,
  calculateCascadedTimings,
} from './utils/timetableLogic';

import MobileHeader from './components/MobileHeader';
import TabNavigation, { AppTab } from './components/TabNavigation';
import MobileMatrixView from './components/MobileMatrixView';
import TeachersManager from './components/TeachersManager';
import TimingsManager from './components/TimingsManager';
import SchoolInfoManager from './components/SchoolInfoManager';
import A4PrintExport from './components/A4PrintExport';
import SlotAssignModal from './components/SlotAssignModal';

export default function App() {
  const [profile, setProfile] = useState<SchoolProfile>(() => loadStoredProfile());
  const [timings, setTimings] = useState<PeriodTiming[]>(() => loadStoredTimings());
  const [teachers, setTeachers] = useState<TeacherSchedule[]>(() => loadStoredTeachers());

  const [activeTab, setActiveTab] = useState<AppTab>('schedule');

  // Slot Assignment Modal state
  const [slotModalState, setSlotModalState] = useState<{
    isOpen: boolean;
    teacher: TeacherSchedule | null;
    timing: PeriodTiming | null;
  }>({
    isOpen: false,
    teacher: null,
    timing: null,
  });

  // Persistent storage auto-save
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveStoredTimings(timings);
  }, [timings]);

  useEffect(() => {
    saveStoredTeachers(teachers);
  }, [teachers]);

  // Real-time clash detection
  const conflicts = useMemo(() => {
    return detectClashes(teachers, timings);
  }, [teachers, timings]);

  // Handler: Assign period slot to a teacher
  const handleAssignSlot = (
    teacherId: string,
    periodId: string,
    value: string,
    saveToRememberedList?: boolean
  ) => {
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => {
        if (t.id !== teacherId) return t;

        const updatedPeriods = { ...t.periods, [periodId]: value };

        let updatedAssigned = t.assignedSubjects || [];
        if (saveToRememberedList && value && value !== 'Free' && !updatedAssigned.includes(value)) {
          updatedAssigned = [...updatedAssigned, value];
        }

        return {
          ...t,
          periods: updatedPeriods,
          assignedSubjects: updatedAssigned,
        };
      })
    );
  };

  // Handler: Update school profile
  const handleUpdateProfile = (updated: Partial<SchoolProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  // Handler: Update timing with cascade
  const handleUpdateTiming = (id: string, newTime: string) => {
    const idx = timings.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const cascaded = calculateCascadedTimings(timings, idx, newTime);
    setTimings(cascaded);
  };

  const handleUpdateTimingLabel = (id: string, newLabel: string) => {
    setTimings((prev) =>
      prev.map((t) => (t.id === id ? { ...t, label: newLabel } : t))
    );
  };

  const handleAddPeriod = (atIndex: number) => {
    const newId = `p-${Math.random().toString(36).substring(2, 6)}`;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const existingPeriods = timings.filter((t) => /^Period\s+/i.test(t.label));
    const nextIdx = existingPeriods.length;
    const nextLabel = `Period ${romanNumerals[nextIdx] || nextIdx + 1}`;

    const newTiming: PeriodTiming = {
      id: newId,
      label: nextLabel,
      time: '00:00 - 00:00',
    };

    const newTimings = [...timings];
    newTimings.splice(atIndex, 0, newTiming);
    setTimings(newTimings);

    // Initialize period for all teachers
    setTeachers((prev) =>
      prev.map((t) => ({
        ...t,
        periods: { ...t.periods, [newId]: '' },
      }))
    );
  };

  const handleRemovePeriod = (id: string) => {
    setTimings((prev) => prev.filter((t) => t.id !== id));
    setTeachers((prev) =>
      prev.map((t) => {
        const nextPeriods = { ...t.periods };
        delete nextPeriods[id];
        return { ...t, periods: nextPeriods };
      })
    );
  };

  const handleApplyTimings = (newTimings: PeriodTiming[]) => {
    setTimings(newTimings);
    // Ensure all period IDs exist in teachers' periods
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => {
        const updatedPeriods = { ...t.periods };
        newTimings.forEach((timing) => {
          if (updatedPeriods[timing.id] === undefined) {
            if (timing.id === 'assembly') updatedPeriods[timing.id] = 'Assembly';
            else if (timing.id === 'rollCall') updatedPeriods[timing.id] = 'Roll Call';
            else updatedPeriods[timing.id] = 'Free';
          }
        });
        return { ...t, periods: updatedPeriods };
      })
    );
  };

  // Teacher actions
  const handleAddTeacher = (name?: string, designation?: string) => {
    const newId = `t-${Math.random().toString(36).substring(2, 8)}`;
    const initialPeriods: Record<string, string> = {};
    timings.forEach((t) => {
      if (t.id === 'assembly') initialPeriods[t.id] = 'Assembly';
      else if (t.id === 'rollCall') initialPeriods[t.id] = 'Roll Call';
      else initialPeriods[t.id] = 'Free';
    });

    const newTeacher: TeacherSchedule = {
      id: newId,
      name: name || `Staff Member ${teachers.length + 1}`,
      designation: designation || 'Teacher',
      assignedSubjects: [],
      periods: initialPeriods,
    };

    setTeachers((prev) => [...prev, newTeacher]);
  };

  const handleUpdateTeacherName = (id: string, name: string, designation?: string) => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, name, designation: designation ?? t.designation } : t
      )
    );
  };

  const handleRemoveTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddRememberedSubject = (teacherId: string, subjectStr: string) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        if (t.assignedSubjects?.includes(subjectStr)) return t;
        return {
          ...t,
          assignedSubjects: [...(t.assignedSubjects || []), subjectStr],
        };
      })
    );
  };

  const handleRemoveRememberedSubject = (teacherId: string, subjectStr: string) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          assignedSubjects: (t.assignedSubjects || []).filter((s) => s !== subjectStr),
        };
      })
    );
  };

  const handleResetAll = () => {
    const defaults = resetAllToDefaults();
    setProfile(defaults.profile);
    setTimings(defaults.timings);
    setTeachers(defaults.teachers);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans antialiased flex flex-col">
      {/* Mobile App Bar */}
      <MobileHeader
        profile={profile}
        conflicts={conflicts}
        onOpenPrint={() => setActiveTab('export')}
        onReset={handleResetAll}
        activeTab={activeTab}
      />

      {/* Main View Area: Mobile Viewport Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 pt-3 pb-20 no-print">
        {activeTab === 'schedule' && (
          <MobileMatrixView
            teachers={teachers}
            timings={timings}
            conflicts={conflicts}
            onOpenSlotAssign={(teacher, timing) =>
              setSlotModalState({ isOpen: true, teacher, timing })
            }
            onAddTeacher={() => handleAddTeacher()}
            onGoToExport={() => setActiveTab('export')}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersManager
            teachers={teachers}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacherName={handleUpdateTeacherName}
            onRemoveTeacher={handleRemoveTeacher}
            onAddRememberedSubject={handleAddRememberedSubject}
            onRemoveRememberedSubject={handleRemoveRememberedSubject}
          />
        )}

        {activeTab === 'timings' && (
          <TimingsManager
            timings={timings}
            onUpdateTiming={handleUpdateTiming}
            onUpdateLabel={handleUpdateTimingLabel}
            onAddPeriod={handleAddPeriod}
            onRemovePeriod={handleRemovePeriod}
            onApplyTimings={handleApplyTimings}
          />
        )}

        {activeTab === 'school' && (
          <SchoolInfoManager
            profile={profile}
            onChangeProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'export' && (
          <A4PrintExport
            profile={profile}
            timings={timings}
            teachers={teachers}
            conflicts={conflicts}
          />
        )}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <TabNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        conflictCount={conflicts.length}
      />

      {/* Interactive Slot Assignment & Subject Memory Modal */}
      <SlotAssignModal
        isOpen={slotModalState.isOpen}
        onClose={() =>
          setSlotModalState({ isOpen: false, teacher: null, timing: null })
        }
        teacher={slotModalState.teacher}
        timing={slotModalState.timing}
        teachers={teachers}
        onAssign={handleAssignSlot}
      />

      {/* Hidden print container that renders during window.print() regardless of activeTab */}
      <div className="hidden print:block">
        <A4PrintExport
          profile={profile}
          timings={timings}
          teachers={teachers}
          conflicts={conflicts}
        />
      </div>
    </div>
  );
}
