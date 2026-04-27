/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Printer, Plus, Trash2, Edit2, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeacherSchedule {
  id: string;
  name: string;
  periods: {
    assembly: string;
    rollCall: string;
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    p5: string;
    p6: string;
    p7: string;
  };
}

export default function App() {
  const [schoolName, setSchoolName] = useState('GOVT. MIDDLE SCHOOL');
  const [address, setAddress] = useState('(Enter School Address Here)');
  const [district, setDistrict] = useState('Anantnag');
  const [zone, setZone] = useState('Zone Name');
  const [uDiseCode, setUDiseCode] = useState('01234567890');
  const [session, setSession] = useState('2026-2027');

  const [teachers, setTeachers] = useState<TeacherSchedule[]>([
    {
      id: '1',
      name: 'Imran Gani Mugloo',
      periods: {
        assembly: 'Assembly',
        rollCall: 'Roll Call',
        p1: '8th - Math',
        p2: '7th - Science',
        p3: '6th - English',
        p4: 'Free',
        p5: '8th - Science',
        p6: '7th - Math',
        p7: '8th - History',
      },
    },
    {
      id: '2',
      name: 'Jane Smith',
      periods: {
        assembly: 'Assembly',
        rollCall: 'Roll Call',
        p1: '6th - Urdu',
        p2: '8th - History',
        p3: '7th - Geography',
        p4: '8th - Math',
        p5: 'Free',
        p6: '6th - Science',
        p7: '7th - Urdu',
      },
    },
  ]);

  const [isEditing, setIsEditing] = useState(false);

  const addTeacher = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTeachers([
      ...teachers,
      {
        id: newId,
        name: `New Teacher ${teachers.length + 1}`,
        periods: {
          assembly: 'Assembly',
          rollCall: 'Roll Call',
          p1: '',
          p2: '',
          p3: '',
          p4: '',
          p5: '',
          p6: '',
          p7: '',
        },
      },
    ]);
  };

  const removeTeacher = (id: string) => {
    setTeachers(teachers.filter((t) => t.id !== id));
  };

  const updateTeacherPeriod = (
    teacherId: string,
    period: keyof TeacherSchedule['periods'],
    value: string
  ) => {
    setTeachers(
      teachers.map((t) =>
        t.id === teacherId
          ? { ...t, periods: { ...t.periods, [period]: value } }
          : t
      )
    );
  };

  const updateTeacherName = (id: string, name: string) => {
    setTeachers(teachers.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-serif text-black">
      {/* Configuration UI (Hidden during print) */}
      <div className="mb-8 no-print max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-neutral-200 font-sans">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Academic Timetable Pro</h1>
          <p className="text-sm text-neutral-500">Configure high-resolution academic session schedules optimized for A4 landscape.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors font-medium border border-neutral-300"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? 'Done' : 'Edit Structure'}
          </button>
          <button
            onClick={addTeacher}
            disabled={teachers.length >= 12}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors font-medium border border-neutral-300 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-md transition-colors font-medium shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Timetable
          </button>
        </div>
      </div>

      {/* The Printable Timetable */}
      <div 
        id="timetable-document"
        className="print-container bg-white mx-auto shadow-2xl print:shadow-none p-10 print:p-0 transition-all duration-300 overflow-x-auto print:overflow-visible"
        style={{ width: '297mm', minHeight: '210mm' }}
      >
        <div className="w-full h-full border border-black p-6 flex flex-col">
          {/* Header */}
          <header className="text-center mb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-1 text-black">
              {isEditing ? (
                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="text-center w-full bg-neutral-50 rounded border border-neutral-200 focus:outline-none"
                />
              ) : (
                schoolName
              )}
            </h1>
            <h2 className="text-xl font-medium mb-1 tracking-tight text-black">
              OFFICE OF THE HEADMASTER
            </h2>
            <p className="text-lg font-semibold text-black">
              Academic Session: {isEditing ? (
                <input
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-32 bg-white rounded border border-neutral-300 px-1 focus:outline-none"
                />
              ) : session}
            </p>
            
            <div className="flex justify-between items-center mt-6 mb-4 text-sm font-medium border-b border-black pb-2 px-1">
              <div>District: <span className="font-bold">{isEditing ? (
                <input value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-neutral-50 rounded border border-neutral-300 px-1" />
              ) : district}</span></div>
              <div>Zone: <span className="font-bold">{isEditing ? (
                <input value={zone} onChange={(e) => setZone(e.target.value)} className="bg-neutral-50 rounded border border-neutral-300 px-1" />
              ) : zone}</span></div>
              <div>U-DISE Code: <span className="font-bold">{isEditing ? (
                <input value={uDiseCode} onChange={(e) => setUDiseCode(e.target.value)} className="bg-neutral-50 rounded border border-neutral-300 px-1" />
              ) : uDiseCode}</span></div>
            </div>
          </header>

          {/* Grid Layout */}
          <main className="flex-grow overflow-hidden">
            <table className="w-full border-collapse border border-black text-[11px] table-fixed">
              <thead className="bg-gray-200 print:bg-gray-200">
                <tr>
                  <th className="border border-black p-2 w-48 font-bold uppercase tracking-wider">STAFF NAME</th>
                  <th className="border border-black p-1 text-center w-28 font-bold uppercase">
                    MORNING ASSEMBLY<br />
                    <span className="font-normal text-[9px]">(10:00 - 10:30)</span>
                  </th>
                  <th className="border border-black p-1 text-center w-24 font-bold uppercase">
                    ROLL CALL<br />
                    <span className="font-normal text-[9px]">(10:30 - 10:50)</span>
                  </th>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <th key={p} className="border border-black p-1 text-center font-bold uppercase">
                      PERIOD {p === 1 ? 'I' : p === 2 ? 'II' : p === 3 ? 'III' : p === 4 ? 'IV' : p === 5 ? 'V' : p === 6 ? 'VI' : 'VII'}<br />
                      <span className="font-normal text-[9px]">
                        {p === 1 ? '10:50-11:20' : 
                         p === 2 ? '11:20-11:50' : 
                         p === 3 ? '11:50-12:20' : 
                         p === 4 ? '12:20-12:50' : 
                         p === 5 ? '12:50-01:20' : 
                         p === 6 ? '01:20-01:50' : 
                         '01:50-02:20'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {teachers.map((teacher) => (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-12 group"
                    >
                      <td className="border border-black px-2 font-bold relative">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={teacher.name}
                              onChange={(e) => updateTeacherName(teacher.id, e.target.value)}
                              className="w-full bg-transparent focus:outline-none border-b border-transparent focus:border-neutral-400"
                            />
                            <button
                              onClick={() => removeTeacher(teacher.id)}
                              className="no-print opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-neutral-100 rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          teacher.name
                        )}
                      </td>
                      <td className="border border-black p-1 text-center text-[10px] italic bg-gray-50/50">
                        <PeriodCell
                          value={teacher.periods.assembly}
                          onChange={(val) => updateTeacherPeriod(teacher.id, 'assembly', val)}
                          isEditing={isEditing}
                        />
                      </td>
                      <td className="border border-black p-1 text-center text-[10px] italic bg-gray-50/50">
                        <PeriodCell
                          value={teacher.periods.rollCall}
                          onChange={(val) => updateTeacherPeriod(teacher.id, 'rollCall', val)}
                          isEditing={isEditing}
                        />
                      </td>
                      {(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const).map((p) => (
                        <td key={p} className="border border-black p-1 text-center">
                          <PeriodCell
                            value={teacher.periods[p]}
                            onChange={(val) => updateTeacherPeriod(teacher.id, p, val)}
                            isEditing={isEditing}
                          />
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {Array.from({ length: Math.max(0, 8 - teachers.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-12">
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>

          {/* Footer */}
          <div className="mt-12 flex justify-between items-end px-4">
            <div className="text-center">
              <div className="w-48 border-t border-black mb-2 mx-auto"></div>
              <p className="font-bold text-sm uppercase">I/C Timetable</p>
            </div>
            <div className="text-center italic text-[10px] mb-4 opacity-75 max-w-sm hidden print:block">
              <p>Note: Staff members are requested to strictly adhere to the timings.</p>
              <p>Short breaks are adjusted between 3rd and 4th periods.</p>
            </div>
            {!isEditing && (
              <div className="text-center italic text-[10px] mb-4 opacity-75 max-w-sm print:hidden">
                <p>Note: Staff members are requested to strictly adhere to the timings.</p>
                <p>Short breaks are adjusted between 3rd and 4th periods.</p>
              </div>
            )}
            <div className="text-center">
              <div className="w-56 border-t border-black mb-2 mx-auto"></div>
              <p className="font-bold text-sm uppercase">Headmaster Signature & Seal</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .min-h-screen {
            min-height: 0 !important;
          }
          .print-container {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: scale(1) !important;
          }
          .no-print {
            display: none !important;
          }
          input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
        }
        
        .print-container {
          /* Force landscape aspects ratio in screen view */
          aspect-ratio: 297 / 210;
        }

        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

function PeriodCell({ value, onChange, isEditing }: { value: string; onChange: (v: string) => void; isEditing: boolean }) {
  if (!isEditing) {
    if (!value || value.toLowerCase() === 'free') return <span className="text-neutral-300 italic">Free</span>;
    
    // Check if it's a split entry (e.g., "8th - Math")
    const parts = value.split('-');
    if (parts.length === 2) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="font-bold text-[10px] leading-tight border-b border-black w-full pb-0.5">{parts[0].trim()}</span>
          <span className="font-medium text-[11px] leading-tight pt-0.5">{parts[1].trim()}</span>
        </div>
      );
    }
    
    return <span className="font-medium text-[11px]">{value}</span>;
  }

  return (
    <input
      value={value}
      placeholder="8th - Math"
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-center bg-white border border-neutral-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-black"
    />
  );
}
