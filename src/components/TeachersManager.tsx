import { useState, type FormEvent } from 'react';
import {
  UserPlus,
  Trash2,
  Bookmark,
  Plus,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { TeacherSchedule } from '../types';
import {
  STANDARD_CLASSES,
  STANDARD_SUBJECTS,
  formatPeriodValue,
  isSubjectAssignedToOtherTeacher,
} from '../utils/timetableLogic';

interface TeachersManagerProps {
  teachers: TeacherSchedule[];
  onAddTeacher: (name: string, designation?: string) => void;
  onUpdateTeacherName: (id: string, name: string, designation?: string) => void;
  onRemoveTeacher: (id: string) => void;
  onAddRememberedSubject: (teacherId: string, subjectStr: string) => void;
  onRemoveRememberedSubject: (teacherId: string, subjectStr: string) => void;
}

export default function TeachersManager({
  teachers,
  onAddTeacher,
  onUpdateTeacherName,
  onRemoveTeacher,
  onAddRememberedSubject,
  onRemoveRememberedSubject,
}: TeachersManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherDesignation, setNewTeacherDesignation] = useState('Teacher');

  // Remembered subject quick adder state for a teacher
  const [activeTeacherForSubject, setActiveTeacherForSubject] = useState<string | null>(null);
  const [subClass, setSubClass] = useState('8th');
  const [subName, setSubName] = useState('Math');

  const handleCreateTeacher = (e: FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    onAddTeacher(newTeacherName.trim(), newTeacherDesignation.trim());
    setNewTeacherName('');
    setShowAddForm(false);
  };

  const handleAddSubjectToTeacher = (teacherId: string) => {
    const formatted = formatPeriodValue(subClass, subName);
    const check = isSubjectAssignedToOtherTeacher(teachers, formatted, teacherId);

    if (check.isAssigned) {
      alert(
        `Duplicate Subject Blocked: "${formatted}" is already assigned to ${check.teacherName}. Timetable rules forbid assigning the same subject to two teachers.`
      );
      return;
    }

    onAddRememberedSubject(teacherId, formatted);
    setActiveTeacherForSubject(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
            Staff & Subject Allocation
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage teachers and their designated subjects.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          id="btn-toggle-add-teacher"
          className="px-3 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <UserPlus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTeacher}
          className="bg-neutral-900 text-white p-4 rounded-2xl shadow-md space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              New Staff Member
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs text-neutral-300 font-medium mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Imran Gani Mugloo"
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-300 font-medium mb-1">
              Designation / Role
            </label>
            <input
              type="text"
              placeholder="e.g. Teacher / Master / General Line"
              value={newTeacherDesignation}
              onChange={(e) => setNewTeacherDesignation(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-400 text-black text-xs font-bold rounded-xl shadow-sm hover:bg-amber-300"
            >
              Save Teacher
            </button>
          </div>
        </form>
      )}

      {/* Teacher List */}
      <div className="space-y-3">
        {teachers.map((teacher) => {
          const isAddingSubject = activeTeacherForSubject === teacher.id;

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-4 space-y-3"
            >
              {/* Teacher Title & Name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={teacher.name}
                    onChange={(e) =>
                      onUpdateTeacherName(teacher.id, e.target.value, teacher.designation)
                    }
                    className="text-sm font-bold text-neutral-900 w-full bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none"
                  />
                  <input
                    type="text"
                    value={teacher.designation || ''}
                    placeholder="Add designation..."
                    onChange={(e) =>
                      onUpdateTeacherName(teacher.id, teacher.name, e.target.value)
                    }
                    className="text-[11px] text-neutral-500 w-full bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none mt-0.5"
                  />
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Remove ${teacher.name} from timetable?`)) {
                      onRemoveTeacher(teacher.id);
                    }
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete teacher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Remembered Subjects Section */}
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 text-neutral-500" />
                    Remembered Subjects ({teacher.assignedSubjects?.length || 0})
                  </span>
                  <button
                    onClick={() => setActiveTeacherForSubject(isAddingSubject ? null : teacher.id)}
                    className="text-[11px] font-bold text-black hover:text-neutral-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingSubject ? 'Close' : 'Add Subject'}
                  </button>
                </div>

                {/* Subject Adder Popout */}
                {isAddingSubject && (
                  <div className="mb-3 p-2.5 bg-white rounded-lg border border-neutral-300 space-y-2 text-xs shadow-xs animate-fadeIn">
                    <span className="font-bold text-neutral-800 block text-[11px]">
                      Add New Subject to {teacher.name.split(' ')[0]}'s Memory:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-neutral-500 block mb-0.5 font-medium">
                          Class:
                        </label>
                        <select
                          value={subClass}
                          onChange={(e) => setSubClass(e.target.value)}
                          className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs"
                        >
                          {STANDARD_CLASSES.map((c) => (
                            <option key={c} value={c}>
                              Class {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 block mb-0.5 font-medium">
                          Subject:
                        </label>
                        <select
                          value={subName}
                          onChange={(e) => setSubName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs"
                        >
                          {STANDARD_SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTeacherForSubject(null)}
                        className="px-2 py-1 text-neutral-500 text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSubjectToTeacher(teacher.id)}
                        className="px-3 py-1 bg-black text-white rounded text-[11px] font-bold"
                      >
                        Add to Memory
                      </button>
                    </div>
                  </div>
                )}

                {/* Subject Tags */}
                {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.assignedSubjects.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 shadow-2xs"
                      >
                        <span>{sub}</span>
                        <button
                          onClick={() => onRemoveRememberedSubject(teacher.id, sub)}
                          className="text-neutral-400 hover:text-red-600 ml-0.5"
                          title="Remove from teacher memory"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-400 italic">
                    No subjects linked to this staff member yet. Subjects assigned in periods will automatically be remembered here.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
