
import jsPDF from 'jspdf';

interface ThesisSubmission {
  id: string;
  full_name: string;
  user_type: string;
  student_number: string | null;
  school: string | null;
  campus: string;
  program: string | null;
  thesis_title: string;
  submission_date: string;
}

interface Column {
  key: keyof ThesisSubmission;
  label: string;
  enabled: boolean;
}

export const exportUserRecordsToPDF = async (
  records: ThesisSubmission[],
  selectedColumns: Column[]
) => {
  try {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table fit
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageSpace = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('User Records Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Generation info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    pdf.text(`Total Records: ${records.length}`, pageWidth / 2, yPosition + 5, { align: 'center' });
    yPosition += 20;

    // Table setup
    const columnWidths: { [key: string]: number } = {
      'full_name': 40,
      'user_type': 25,
      'student_number': 30,
      'school': 35,
      'campus': 30,
      'program': 35,
      'thesis_title': 60,
      'submission_date': 25,
    };

    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const totalWidth = enabledColumns.reduce((sum, col) => sum + (columnWidths[col.key] || 30), 0);
    const scaleFactor = Math.min(1, (pageWidth - 2 * margin) / totalWidth);

    // Adjust column widths based on scale factor
    const adjustedWidths = enabledColumns.map(col => (columnWidths[col.key] || 30) * scaleFactor);

    // Table headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    let xPosition = margin;
    const headerY = yPosition;
    
    // Draw header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, headerY - 5, pageWidth - 2 * margin, 10, 'F');

    // Draw header text
    enabledColumns.forEach((col, index) => {
      pdf.text(col.label, xPosition + adjustedWidths[index] / 2, headerY, { align: 'center' });
      xPosition += adjustedWidths[index];
    });

    yPosition += 12;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    let rowCount = 0;
    for (const record of records) {
      checkPageSpace(8);

      // Alternate row colors
      if (rowCount % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, 'F');
      }

      xPosition = margin;
      enabledColumns.forEach((col, index) => {
        let value = record[col.key];

// Format specific fields
if (col.key === 'submission_date') {
  value = new Date(value as string).toLocaleDateString();
} else if (col.key === 'created_at') {
  value = new Date(value as string).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
} else if (col.key === 'user_type') {
  value = value === 'LPU Student' ? 'LPU' : 'Non-LPU';
}

        // Truncate long text
        let displayValue = (value || '').toString();
        if (displayValue.length > 30) {
          displayValue = displayValue.substring(0, 27) + '...';
        }

        pdf.text(displayValue, xPosition + adjustedWidths[index] / 2, yPosition, { 
          align: 'center',
          maxWidth: adjustedWidths[index] - 2
        });
        xPosition += adjustedWidths[index];
      });

      yPosition += 8;
      rowCount++;
    }

    // Summary section
    yPosition += 10;
    checkPageSpace(20);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Calculate statistics
    const lpuCount = records.filter(r => r.user_type === 'LPU Student').length;
    const nonLpuCount = records.length - lpuCount;
    const campuses = [...new Set(records.map(r => r.campus))];
    
    const summaryStats = [
      `Total Records: ${records.length}`,
      `LPU Students: ${lpuCount} (${((lpuCount / records.length) * 100).toFixed(1)}%)`,
      `Non-LPU Students: ${nonLpuCount} (${((nonLpuCount / records.length) * 100).toFixed(1)}%)`,
      `Campuses Represented: ${campuses.length}`,
      `Date Range: ${records.length > 0 ? 
        `${new Date(Math.min(...records.map(r => new Date(r.submission_date).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...records.map(r => new Date(r.submission_date).getTime()))).toLocaleDateString()}` 
        : 'N/A'}`
    ];

    summaryStats.forEach(stat => {
      pdf.text(stat, margin, yPosition);
      yPosition += 5;
    });

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `user-records-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};
