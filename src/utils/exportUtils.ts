import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PeriodTiming, SchoolProfile, TeacherSchedule } from '../types';
import { parsePeriodValue } from './timetableLogic';

/**
 * Generate a clean, filesystem-safe filename base
 */
function getSafeFileBase(profile: SchoolProfile): string {
  return (profile.schoolName || 'Academic_Timetable')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Exports master timetable to a formatted Microsoft Excel (.xlsx) file
 */
export function exportToExcel(
  profile: SchoolProfile,
  timings: PeriodTiming[],
  teachers: TeacherSchedule[]
): void {
  const wb = XLSX.utils.book_new();

  // Construct table headers
  const headerRow = [
    'Staff Name',
    'Designation',
    ...timings.map((t) => (t.id === 'recess' ? `RECESS (${t.time})` : `${t.label} (${t.time})`)),
  ];

  // Construct teacher rows
  const dataRows = teachers.map((teacher) => {
    const periodCells = timings.map((t) => {
      if (t.id === 'recess') return 'RECESS';
      const rawVal = teacher.periods[t.id] || 'Free';
      const parsed = parsePeriodValue(rawVal);
      if (parsed.isFree) return 'Free';
      if (parsed.isClassBooking) {
        return `${parsed.className} - ${parsed.subject}`;
      }
      return parsed.raw;
    });

    return [teacher.name, teacher.designation || 'Teacher', ...periodCells];
  });

  // Compose worksheet content with institutional header metadata
  const sheetData: (string | number)[][] = [
    [(profile.schoolName || 'GOVERNMENT MIDDLE SCHOOL').toUpperCase()],
    [(profile.officeTitle || 'OFFICE OF THE HEADMASTER').toUpperCase()],
    [
      `Academic Session: ${profile.session || 'Current'}`,
      `District: ${profile.district || 'Anantnag'}`,
      `Zone: ${profile.zone || 'Bidder'}`,
      `U-DISE Code: ${profile.uDiseCode || '01234567890'}`,
    ],
    [], // Blank separator row
    headerRow,
    ...dataRows,
    [], // Blank separator row
    [
      profile.icTimetableTitle || 'I/C Timetable',
      '',
      profile.footerNote || 'Note: All staff members must adhere to this official academic schedule.',
      '',
      profile.headmasterTitle || 'Headmaster Signature & Seal',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set intelligent column widths (wch)
  const colWidths = [
    { wch: 22 }, // Staff Name
    { wch: 18 }, // Designation
    ...timings.map((t) => ({ wch: Math.max(14, t.label.length + 8) })),
  ];
  ws['!cols'] = colWidths;

  // Append sheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Timetable');

  // Trigger download of real .xlsx file
  const safeBase = getSafeFileBase(profile);
  const fileName = `${safeBase}_timetable_${profile.session || 'session'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads an official A4 Landscape vector PDF file
 */
export function exportToPDF(
  profile: SchoolProfile,
  timings: PeriodTiming[],
  teachers: TeacherSchedule[],
  options?: {
    showSignatures?: boolean;
    showSchoolRibbon?: boolean;
  }
): void {
  const showSignatures = options?.showSignatures ?? true;
  const showSchoolRibbon = options?.showSchoolRibbon ?? true;

  // A4 Landscape: 297mm width, 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  // Draw outer double decorative border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  doc.setLineWidth(0.2);
  doc.rect(margin + 1.2, margin + 1.2, pageWidth - (margin + 1.2) * 2, pageHeight - (margin + 1.2) * 2);

  // Header Title
  let currentY = margin + 7;
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text((profile.schoolName || 'GOVERNMENT MIDDLE SCHOOL').toUpperCase(), pageWidth / 2, currentY, {
    align: 'center',
  });

  currentY += 4.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text((profile.officeTitle || 'OFFICE OF THE HEADMASTER').toUpperCase(), pageWidth / 2, currentY, {
    align: 'center',
  });

  currentY += 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(`ACADEMIC SESSION: ${profile.session || 'Current'}`, pageWidth / 2, currentY, {
    align: 'center',
  });

  // School Metadata Ribbon
  if (showSchoolRibbon) {
    currentY += 2;
    doc.setLineWidth(0.3);
    doc.line(margin + 4, currentY, pageWidth - margin - 4, currentY);
    currentY += 3.5;

    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    const districtText = `District: ${profile.district || 'Anantnag'}`;
    const zoneText = `Zone: ${profile.zone || 'Bidder'}`;
    const udiseText = `U-DISE Code: ${profile.uDiseCode || '01234567890'}`;

    doc.text(districtText, margin + 6, currentY);
    doc.text(zoneText, pageWidth / 2, currentY, { align: 'center' });
    doc.text(udiseText, pageWidth - margin - 6, currentY, { align: 'right' });

    currentY += 1.5;
    doc.line(margin + 4, currentY, pageWidth - margin - 4, currentY);
    currentY += 2;
  } else {
    currentY += 3;
  }

  // Construct Table Columns
  const tableHeaders = [
    'STAFF NAME',
    ...timings.map((t) => (t.id === 'recess' ? `RECESS\n${t.time}` : `${t.label}\n${t.time}`)),
  ];

  // Construct Table Body
  const tableBody = teachers.map((teacher) => {
    const staffLabel = teacher.designation
      ? `${teacher.name}\n(${teacher.designation})`
      : teacher.name;

    const periodCells = timings.map((t) => {
      if (t.id === 'recess') return 'RECESS';
      const rawVal = teacher.periods[t.id] || 'Free';
      const parsed = parsePeriodValue(rawVal);
      if (parsed.isFree) return 'Free';
      if (parsed.isClassBooking) {
        return `${parsed.className}\n${parsed.subject}`;
      }
      return parsed.raw;
    });

    return [staffLabel, ...periodCells];
  });

  // Dynamic row height calculation based on staff count so it fits on 1 single page
  const staffCount = teachers.length;
  const bodyFontSize = staffCount > 10 ? 6.5 : staffCount > 7 ? 7.5 : 8;
  const cellPadding = staffCount > 10 ? 1 : 1.6;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin + 3, right: margin + 3 },
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: bodyFontSize,
      cellPadding: cellPadding,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: bodyFontSize,
      halign: 'center',
    },
    columnStyles: {
      0: {
        halign: 'left',
        fontStyle: 'bold',
        cellWidth: 36,
      },
    },
    didParseCell: (data) => {
      // Recess column styling
      const colIndex = data.column.index;
      if (colIndex > 0 && timings[colIndex - 1]?.id === 'recess') {
        if (data.section === 'body') {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bolditalic';
          data.cell.styles.fontSize = 7;
        } else if (data.section === 'head') {
          data.cell.styles.fillColor = [220, 220, 220];
        }
      }
      // Free slot text styling
      if (data.section === 'body' && data.cell.raw === 'Free') {
        data.cell.styles.textColor = [130, 130, 130];
        data.cell.styles.fontStyle = 'italic';
      }
    },
  });

  // Calculate final Y position from autoTable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 100;

  // Official Signatures Block
  if (showSignatures) {
    const sigY = Math.max(finalY + 7, pageHeight - margin - 15);

    doc.setFont('times', 'bold');
    doc.setFontSize(8);

    // Left signatory (I/C Timetable)
    doc.line(margin + 12, sigY, margin + 55, sigY);
    doc.text(
      (profile.icTimetableTitle || 'I/C Timetable').toUpperCase(),
      margin + 33.5,
      sigY + 3.5,
      { align: 'center' }
    );

    // Center instruction/footer note
    if (profile.footerNote) {
      doc.setFont('times', 'italic');
      doc.setFontSize(6.5);
      doc.text(profile.footerNote, pageWidth / 2, sigY + 2, {
        align: 'center',
        maxWidth: 100,
      });
    }

    // Right signatory (Headmaster)
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.line(pageWidth - margin - 58, sigY, pageWidth - margin - 15, sigY);
    doc.text(
      (profile.headmasterTitle || 'Headmaster Signature & Seal').toUpperCase(),
      pageWidth - margin - 36.5,
      sigY + 3.5,
      { align: 'center' }
    );
  }

  // Very bottom footer attribution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Official Academic Timetable • Generated for ${profile.schoolName || 'School'}`,
    pageWidth / 2,
    pageHeight - margin - 2,
    { align: 'center' }
  );

  // Trigger download of genuine .pdf file
  const safeBase = getSafeFileBase(profile);
  const fileName = `${safeBase}_timetable_${profile.session || 'session'}.pdf`;
  doc.save(fileName);
}
