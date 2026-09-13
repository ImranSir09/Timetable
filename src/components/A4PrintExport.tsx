import { useState, useRef, type Ref } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Sliders,
  ShieldCheck,
  Eye,
  Settings2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { PeriodTiming, SchoolProfile, TeacherSchedule, ScheduleConflict } from '../types';
import { parsePeriodValue } from '../utils/timetableLogic';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface A4PrintExportProps {
  profile: SchoolProfile;
  timings: PeriodTiming[];
  teachers: TeacherSchedule[];
  conflicts?: ScheduleConflict[];
}

export type TableDensity = 'auto' | 'spacious' | 'compact';

export default function A4PrintExport({
  profile,
  timings,
  teachers,
  conflicts = [],
}: A4PrintExportProps) {
  // Mobile zoom scale state
  const [zoomScale, setZoomScale] = useState<number>(0.42);
  const [density, setDensity] = useState<TableDensity>('auto');
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showSchoolRibbon, setShowSchoolRibbon] = useState<boolean>(true);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const printDocRef = useRef<HTMLDivElement>(null);

  // Trigger quick toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Direct PDF Download
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPdf(true);
      // Small tick to allow UI to show active state
      await new Promise((resolve) => setTimeout(resolve, 50));
      exportToPDF(profile, timings, teachers, {
        showSignatures,
        showSchoolRibbon,
      });
      triggerToast('PDF document generated & downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      // If direct jspdf fails for any reason, fallback to browser print dialog
      triggerToast('Opening system print dialog for PDF...');
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Browser Print / Save as PDF dialog
  const handlePrintDialog = () => {
    window.print();
  };

  // Direct Excel (.xlsx) Download
  const handleDownloadExcel = async () => {
    try {
      setIsExportingExcel(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      exportToExcel(profile, timings, teachers);
      triggerToast('Excel spreadsheet (.xlsx) downloaded successfully!');
    } catch (err) {
      console.error('Excel export error:', err);
      triggerToast('Failed to export Excel file. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Determine effective density
  const effectiveDensity =
    density === 'auto'
      ? teachers.length > 8
        ? 'compact'
        : 'spacious'
      : density;

  const minRows = effectiveDensity === 'compact' ? 9 : 7;
  const emptyRowsCount = Math.max(0, minRows - teachers.length);

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-neutral-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STREAMLINED EXPORT CONTROL PANEL (No-Print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        {/* Top Title & Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
                Official Export Center
              </span>
              <span className="text-[10px] font-bold text-neutral-500">
                A4 Landscape (297 × 210 mm)
              </span>
            </div>
            <h2 className="text-base font-black text-neutral-900 uppercase tracking-tight mt-1">
              PDF & Excel Timetable Export
            </h2>
            <p className="text-xs text-neutral-500">
              Download formatted documents ready for official school records and administrative review.
            </p>
          </div>

          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              showExportOptions
                ? 'bg-neutral-100 border-neutral-300 text-black'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-black'
            }`}
            title="Export & Layout Options"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* PRIMARY EXPORT ACTIONS: STRICTLY PDF & EXCEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* PDF EXPORT CARD */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-neutral-900 text-xs uppercase tracking-tight">
                    PDF Document
                  </span>
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                  Official A4
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Vector-crisp landscape PDF with school header, schedule grid, and signatory seals.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              {/* Primary PDF Download */}
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPdf}
                id="btn-download-pdf"
                className="w-full py-2.5 px-3 bg-black hover:bg-neutral-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF Document (.pdf)'}</span>
              </button>

              {/* Print / System Dialog fallback */}
              <button
                onClick={handlePrintDialog}
                id="btn-print-dialog"
                className="w-full py-2 px-3 bg-white hover:bg-neutral-100 active:scale-98 text-neutral-700 font-semibold text-[11px] rounded-xl border border-neutral-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-500" />
                <span>Print / System Dialog</span>
              </button>
            </div>
          </div>

          {/* EXCEL EXPORT CARD */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-neutral-900 text-xs uppercase tracking-tight">
                    Excel Spreadsheet
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  .xlsx Format
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Structured workbook with auto-sized columns, metadata, designations, and period slots.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={handleDownloadExcel}
                disabled={isExportingExcel}
                id="btn-download-excel"
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isExportingExcel ? 'Exporting Excel...' : 'Download Excel File (.xlsx)'}</span>
              </button>

              <div className="mt-2 text-center text-[10px] text-neutral-400 font-medium">
                Compatible with Microsoft Excel, Google Sheets & Numbers
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Flight Quality Bar */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
          <div className="flex items-center gap-1.5">
            {conflicts.length === 0 ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900 text-[11px]">
                  Schedule Verified: 0 Clashes detected
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-900 text-[11px]">
                  {conflicts.length} Clashes present in timetable
                </span>
              </>
            )}
          </div>

          <span className="text-[10px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
            {teachers.length} Staff • {timings.length} Periods
          </span>
        </div>

        {/* Expandable Layout & Density Options */}
        {showExportOptions && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 animate-fadeIn text-xs">
            <div className="font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-neutral-600" /> Document Formatting Options
            </div>

            {/* Density switch */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">Row Density:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-200">
                {(['auto', 'spacious', 'compact'] as TableDensity[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition-all ${
                      density === d
                        ? 'bg-black text-white'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                <span className="text-neutral-700 font-medium text-[11px]">
                  Official Signatures
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSchoolRibbon}
                  onChange={(e) => setShowSchoolRibbon(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                <span className="text-neutral-700 font-medium text-[11px]">
                  Zone & U-DISE Ribbon
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Mobile Zoom / Scale Bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-1 text-neutral-500 text-[11px]">
            <Eye className="w-3.5 h-3.5" />
            <span>Document Preview: {Math.round(zoomScale * 100)}%</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomScale((prev) => Math.max(0.3, prev - 0.05))}
              className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomScale(0.42)}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold"
            >
              Fit Phone
            </button>
            <button
              onClick={() => setZoomScale(0.7)}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold"
            >
              Wide
            </button>
            <button
              onClick={() => setZoomScale((prev) => Math.min(1.0, prev + 0.05))}
              className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Screen Preview Container with Scaled A4 Sheet (No-Print) */}
      <div className="no-print w-full overflow-x-auto bg-neutral-200/80 p-2 sm:p-4 rounded-2xl border border-neutral-300 flex justify-center items-start shadow-inner">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            marginBottom: `-${(1 - zoomScale) * 210}mm`,
          }}
          className="transition-transform duration-150 shrink-0"
        >
          <A4SheetContent
            profile={profile}
            timings={timings}
            teachers={teachers}
            emptyRowsCount={emptyRowsCount}
            density={effectiveDensity}
            showSignatures={showSignatures}
            showSchoolRibbon={showSchoolRibbon}
            ref={printDocRef}
          />
        </div>
      </div>

      {/* Hidden Print Wrapper: Visible ONLY during window.print() */}
      <div className="hidden print:block">
        <A4SheetContent
          profile={profile}
          timings={timings}
          teachers={teachers}
          emptyRowsCount={emptyRowsCount}
          density={effectiveDensity}
          showSignatures={showSignatures}
          showSchoolRibbon={showSchoolRibbon}
        />
      </div>
    </div>
  );
}

/**
 * Strict A4 Landscape Sheet Component
 */
function A4SheetContent({
  profile,
  timings,
  teachers,
  emptyRowsCount,
  density,
  showSignatures,
  showSchoolRibbon,
  ref,
}: {
  profile: SchoolProfile;
  timings: PeriodTiming[];
  teachers: TeacherSchedule[];
  emptyRowsCount: number;
  density: 'compact' | 'spacious';
  showSignatures: boolean;
  showSchoolRibbon: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  const isCompact = density === 'compact';

  // Dynamic row height and font scaling for single-page A4 guarantee
  const rowHeightClass = isCompact ? 'h-7.5' : 'h-9.5';
  const nameFontClass = isCompact ? 'text-[9.5px]' : 'text-[10.5px]';
  const designationFontClass = isCompact ? 'text-[7.5px]' : 'text-[8.5px]';
  const slotClassFont = isCompact ? 'text-[8.5px]' : 'text-[9.5px]';
  const slotSubjectFont = isCompact ? 'text-[8.5px]' : 'text-[9.5px]';

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
        padding: '7mm 9mm',
        boxSizing: 'border-box',
      }}
    >
      <div className="w-full h-full border-2 border-black p-3 flex flex-col justify-between overflow-hidden">
        {/* Document Header */}
        <header className="text-center mb-1 shrink-0">
          <h1 className="text-2xl font-black uppercase tracking-wider text-black leading-tight">
            {profile.schoolName || 'GOVERNMENT MIDDLE SCHOOL'}
          </h1>
          <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-800 mt-0.5">
            {profile.officeTitle || 'OFFICE OF THE HEADMASTER'}
          </h2>
          <div className="text-[11px] font-bold text-black mt-0.5">
            ACADEMIC SESSION: {profile.session}
          </div>

          {/* Attributes Ribbon */}
          {showSchoolRibbon && (
            <div className="flex justify-between items-center mt-1.5 text-[10.5px] font-bold border-t border-b border-black py-0.5 px-2">
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
          )}
        </header>

        {/* Master Timetable Grid */}
        <main className="flex-1 overflow-hidden my-0.5 flex flex-col justify-center">
          <table className="w-full border-collapse border-2 border-black text-[10px] table-fixed">
            <thead className="bg-neutral-200 print:bg-neutral-200">
              <tr>
                <th className="border border-black p-1 w-34 font-black uppercase tracking-wider text-[10px] text-center">
                  STAFF NAME
                </th>
                {timings.map((t) => {
                  const isRecess = t.id === 'recess';
                  return (
                    <th
                      key={t.id}
                      className={`border border-black p-1 text-center font-bold uppercase ${
                        isRecess
                          ? 'w-16 bg-neutral-300 print:bg-neutral-300'
                          : 'w-auto'
                      }`}
                    >
                      <div className="text-[9.5px] font-black leading-tight truncate">
                        {isRecess ? 'RECESS' : t.label}
                      </div>
                      <div className="text-[8px] font-semibold tracking-tight text-neutral-800 print:text-black mt-0.5 whitespace-nowrap">
                        {t.time}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className={`${rowHeightClass} border-b border-black`}>
                  {/* Staff Name & Designation */}
                  <td className="border border-black px-1.5 py-0.5 font-bold text-black">
                    <div className={`truncate font-black ${nameFontClass}`}>{teacher.name}</div>
                    {teacher.designation && (
                      <div className={`font-normal text-neutral-600 print:text-black italic truncate ${designationFontClass}`}>
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
                          className="border border-black p-0.5 text-center font-black text-[9px] bg-neutral-200 print:bg-neutral-200 italic tracking-wider"
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
                          className="border border-black p-0.5 text-center text-[8.5px] text-neutral-400 print:text-neutral-500 italic"
                        >
                          Free
                        </td>
                      );
                    }

                    if (parsed.isClassBooking) {
                      return (
                        <td key={t.id} className="border border-black p-0.5 text-center">
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <span className={`font-black border-b border-black w-full pb-0.5 ${slotClassFont}`}>
                              {parsed.className}
                            </span>
                            <span className={`font-semibold pt-0.5 truncate max-w-full ${slotSubjectFont}`}>
                              {parsed.subject}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={t.id}
                        className={`border border-black p-0.5 text-center font-medium ${slotClassFont}`}
                      >
                        {parsed.raw}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Placeholder rows to maintain balanced grid */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className={`${rowHeightClass} border-b border-black`}>
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
          {showSignatures && (
            <div className="flex justify-between items-end px-4">
              {/* Left Signatory */}
              <div className="text-center">
                <div className="w-34 border-t-2 border-black mb-1 mx-auto"></div>
                <p className="font-black text-[10px] uppercase tracking-wide">
                  {profile.icTimetableTitle || 'I/C Timetable'}
                </p>
              </div>

              {/* Center Instructions */}
              <div className="text-center italic text-[8px] max-w-md px-2 leading-tight">
                <p>{profile.footerNote}</p>
              </div>

              {/* Right Signatory */}
              <div className="text-center">
                <div className="w-40 border-t-2 border-black mb-1 mx-auto"></div>
                <p className="font-black text-[10px] uppercase tracking-wide">
                  {profile.headmasterTitle || 'Headmaster Signature & Seal'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-0.5 text-center text-[7px] font-sans text-neutral-400 print:text-neutral-500 tracking-wider">
            Academic Timetable Pro • Generated for {profile.schoolName}
          </div>
        </footer>
      </div>
    </div>
  );
}
