import { useState, useRef, type Ref } from 'react';
import {
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Smartphone,
  Info,
  CheckCircle,
} from 'lucide-react';
import { PeriodTiming, SchoolProfile, TeacherSchedule } from '../types';
import { parsePeriodValue } from '../utils/timetableLogic';

interface A4PrintExportProps {
  profile: SchoolProfile;
  timings: PeriodTiming[];
  teachers: TeacherSchedule[];
}

export default function A4PrintExport({
  profile,
  timings,
  teachers,
}: A4PrintExportProps) {
  // Mobile zoom scale state (default to fit mobile width ~0.38 - 0.5)
  const [zoomScale, setZoomScale] = useState<number>(0.42);
  const printDocRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Ensure table fills standard height gracefully
  const minRows = 7;
  const emptyRowsCount = Math.max(0, minRows - teachers.length);

  return (
    <div className="space-y-4 pb-24">
      {/* Mobile Top Controls Bar (Hidden during print) */}
      <div className="no-print bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-tight flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-black" /> A4 Landscape Export
            </h2>
            <p className="text-[11px] text-neutral-500">
              Strictly engineered for 1-page A4 landscape print & PDF export.
            </p>
          </div>

          <button
            onClick={handlePrint}
            id="btn-print-action-main"
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

        {/* Mobile Orientation Hint */}
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>Mobile Tip:</strong> Rotate your phone horizontally or tap{' '}
            <strong>Print / Save PDF</strong> to save directly as an official A4 document.
          </span>
        </div>

        {/* Scale Adjuster for Mobile View */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
          <span className="text-neutral-500 text-[11px] font-medium">
            Screen Preview Zoom: {Math.round(zoomScale * 100)}%
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomScale((prev) => Math.max(0.3, prev - 0.05))}
              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomScale(0.42)}
              className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold"
              title="Fit Mobile View"
            >
              Fit
            </button>
            <button
              onClick={() => setZoomScale((prev) => Math.min(1.0, prev + 0.05))}
              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomScale(0.85)}
              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              title="Large View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Screen Preview Container with Zoom Transform */}
      <div className="no-print w-full overflow-x-auto bg-neutral-200/70 p-2 sm:p-4 rounded-2xl border border-neutral-300 flex justify-center items-start shadow-inner">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            marginBottom: `-${(1 - zoomScale) * 210}mm`,
          }}
          className="transition-transform duration-150"
        >
          {/* Render Actual A4 Sheet */}
          <A4SheetContent
            profile={profile}
            timings={timings}
            teachers={teachers}
            emptyRowsCount={emptyRowsCount}
            ref={printDocRef}
          />
        </div>
      </div>

      {/* Hidden Print Wrapper: Visible ONLY in window.print() */}
      <div className="hidden print:block">
        <A4SheetContent
          profile={profile}
          timings={timings}
          teachers={teachers}
          emptyRowsCount={emptyRowsCount}
        />
      </div>
    </div>
  );
}

/**
 * The official high-resolution A4 landscape document
 */
function A4SheetContent({
  profile,
  timings,
  teachers,
  emptyRowsCount,
  ref,
}: {
  profile: SchoolProfile;
  timings: PeriodTiming[];
  teachers: TeacherSchedule[];
  emptyRowsCount: number;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      id="a4-landscape-document"
      className="a4-landscape-page bg-white font-serif text-black shadow-2xl print:shadow-none border border-neutral-400 print:border-none select-none flex flex-col justify-between overflow-hidden"
      style={{
        width: '297mm',
        height: '210mm',
        maxWidth: '297mm',
        maxHeight: '210mm',
        padding: '8mm 10mm',
        boxSizing: 'border-box',
      }}
    >
      <div className="w-full h-full border-2 border-black p-3.5 flex flex-col justify-between overflow-hidden">
        {/* Document Header */}
        <header className="text-center mb-2 shrink-0">
          <h1 className="text-2xl font-black uppercase tracking-wider text-black leading-tight">
            {profile.schoolName || 'GOVERNMENT MIDDLE SCHOOL'}
          </h1>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800 mt-0.5">
            {profile.officeTitle || 'OFFICE OF THE HEADMASTER'}
          </h2>
          <div className="text-xs font-bold text-black mt-0.5">
            ACADEMIC SESSION: {profile.session}
          </div>

          {/* School Attributes Ribbon */}
          <div className="flex justify-between items-center mt-2 text-[11px] font-bold border-t border-b border-black py-1 px-2">
            <div>
              District: <span className="font-black underline">{profile.district || 'Anantnag'}</span>
            </div>
            <div>
              Zone: <span className="font-black underline">{profile.zone || 'Bidder'}</span>
            </div>
            <div>
              U-DISE Code: <span className="font-black font-mono">{profile.uDiseCode || '01234567890'}</span>
            </div>
          </div>
        </header>

        {/* Master Timetable Grid */}
        <main className="flex-1 overflow-hidden my-1 flex flex-col justify-center">
          <table className="w-full border-collapse border-2 border-black text-[10px] table-fixed">
            <thead className="bg-neutral-200 print:bg-neutral-200">
              <tr>
                <th className="border border-black p-1 w-36 font-black uppercase tracking-wider text-[10.5px] text-center">
                  STAFF NAME
                </th>
                {timings.map((t) => (
                  <th
                    key={t.id}
                    className={`border border-black p-1 text-center font-bold uppercase ${
                      t.id === 'recess'
                        ? 'w-14 bg-neutral-300 print:bg-neutral-300'
                        : 'w-auto'
                    }`}
                  >
                    <div className="text-[10px] font-black leading-tight truncate">
                      {t.label}
                    </div>
                    <div className="text-[8.5px] font-normal tracking-tight text-neutral-700 print:text-black mt-0.5">
                      {t.time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, idx) => (
                <tr key={teacher.id} className="h-10 border-b border-black">
                  {/* Staff Name & Designation */}
                  <td className="border border-black px-1.5 py-0.5 font-bold text-[10.5px] text-black">
                    <div className="truncate font-black">{teacher.name}</div>
                    {teacher.designation && (
                      <div className="text-[8px] font-normal text-neutral-600 print:text-black italic truncate">
                        {teacher.designation}
                      </div>
                    )}
                  </td>

                  {/* Period Columns */}
                  {timings.map((t) => {
                    if (t.id === 'recess') {
                      return (
                        <td
                          key={t.id}
                          className="border border-black p-0.5 text-center font-black text-[9.5px] bg-neutral-200 print:bg-neutral-200 italic tracking-widest"
                        >
                          RECESS
                        </td>
                      );
                    }

                    const val = teacher.periods[t.id] || '';
                    const parsed = parsePeriodValue(val);

                    if (parsed.isFree) {
                      return (
                        <td
                          key={t.id}
                          className="border border-black p-0.5 text-center text-[9px] text-neutral-400 print:text-neutral-500 italic"
                        >
                          Free
                        </td>
                      );
                    }

                    if (parsed.isClassBooking) {
                      return (
                        <td key={t.id} className="border border-black p-0.5 text-center">
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <span className="font-black text-[9.5px] border-b border-black w-full pb-0.5">
                              {parsed.className}
                            </span>
                            <span className="font-semibold text-[9.5px] pt-0.5 truncate max-w-full">
                              {parsed.subject}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={t.id}
                        className="border border-black p-0.5 text-center text-[9.5px] font-medium"
                      >
                        {parsed.raw}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Empty placeholder rows for clean grid aesthetics if fewer teachers */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-9 border-b border-black">
                  <td className="border border-black"></td>
                  {timings.map((t) => (
                    <td
                      key={t.id}
                      className={`border border-black ${
                        t.id === 'recess' ? 'bg-neutral-200 print:bg-neutral-200' : ''
                      }`}
                    ></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        {/* Footer & Signatures Block */}
        <footer className="mt-1 pt-1 shrink-0">
          <div className="flex justify-between items-end px-4">
            {/* Left Signatory */}
            <div className="text-center">
              <div className="w-36 border-t-2 border-black mb-1 mx-auto"></div>
              <p className="font-black text-[10.5px] uppercase tracking-wide">
                {profile.icTimetableTitle || 'I/C Timetable'}
              </p>
            </div>

            {/* Center Instructions */}
            <div className="text-center italic text-[8.5px] max-w-md px-2 leading-tight">
              <p>{profile.footerNote}</p>
            </div>

            {/* Right Signatory */}
            <div className="text-center">
              <div className="w-44 border-t-2 border-black mb-1 mx-auto"></div>
              <p className="font-black text-[10.5px] uppercase tracking-wide">
                {profile.headmasterTitle || 'Headmaster Signature & Seal'}
              </p>
            </div>
          </div>

          <div className="mt-1 text-center text-[7.5px] font-sans text-neutral-400 print:text-neutral-500 tracking-wider">
            Academic Timetable Pro • Generated for {profile.schoolName}
          </div>
        </footer>
      </div>
    </div>
  );
}
