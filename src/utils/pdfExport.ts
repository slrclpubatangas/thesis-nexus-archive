
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StatsData {
  totalSubmissions: number;
  totalUsers: number;
  recentSubmissions: number;
  lpuStudents: number;
  nonLpuStudents: number;
  campusData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; submissions: number }>;
  popularPrograms: Array<{ name: string; count: number; percentage: number }>;
  feedbackStats: {
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
    recentFeedback: Array<{
      id: string;
      rating: number;
      comments: string | null;
      created_at: string;
      thesis_title?: string;
    }>;
  };
}

export const exportStatisticsToPDF = async (
  stats: StatsData,
  selectedYear: string,
  dateRange: { start: string; end: string }
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Helper function to add new page if needed
    const checkPageSpace = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Thesis Submission Statistics Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date filter info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let filterText = 'Report Period: ';
    if (selectedYear !== 'all') {
      filterText += `Year ${selectedYear}`;
    } else if (dateRange.start && dateRange.end) {
      filterText += `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
    } else if (dateRange.start) {
      filterText += `From ${new Date(dateRange.start).toLocaleDateString()}`;
    } else if (dateRange.end) {
      filterText += `Until ${new Date(dateRange.end).toLocaleDateString()}`;
    } else {
      filterText += 'All Time';
    }
    pdf.text(filterText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Generation timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Key Metrics Section
    checkPageSpace(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Metrics', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const metrics = [
      `Total Submissions: ${stats.totalSubmissions}`,
      `LPU Students: ${stats.lpuStudents}`,
      `External Users: ${stats.nonLpuStudents}`,
      `Recent Activity (30 days): ${stats.recentSubmissions}`,
      `User Satisfaction: ${stats.feedbackStats.averageRating}/5 (${stats.feedbackStats.totalFeedback} responses)`
    ];

    metrics.forEach(metric => {
      pdf.text(metric, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 10;

    // Campus Distribution Section
    checkPageSpace(30 + stats.campusData.length * 5);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Campus Distribution', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    stats.campusData.forEach(campus => {
      const percentage = ((campus.value / stats.totalSubmissions) * 100).toFixed(1);
      pdf.text(`${campus.name}: ${campus.value} submissions (${percentage}%)`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 10;

    // Popular Programs Section
    checkPageSpace(30 + Math.min(stats.popularPrograms.length, 10) * 5);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Top Research Programs', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    stats.popularPrograms.slice(0, 10).forEach((program, index) => {
      pdf.text(`${index + 1}. ${program.name}: ${program.count} submissions (${program.percentage}%)`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 10;

    // Monthly Trend Section
    checkPageSpace(30 + stats.monthlyData.length * 5);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monthly Submission Trend', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    stats.monthlyData.forEach(month => {
      pdf.text(`${month.month}: ${month.submissions} submissions`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 10;

    // Feedback Analysis Section
    checkPageSpace(50);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('User Feedback Analysis', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Average Rating: ${stats.feedbackStats.averageRating}/5`, 25, yPosition);
    yPosition += 7;
    pdf.text(`Total Feedback Responses: ${stats.feedbackStats.totalFeedback}`, 25, yPosition);
    yPosition += 10;

    // Rating Distribution
    pdf.text('Rating Distribution:', 25, yPosition);
    yPosition += 7;
    stats.feedbackStats.ratingDistribution.forEach(rating => {
      if (rating.count > 0) {
        const percentage = ((rating.count / stats.feedbackStats.totalFeedback) * 100).toFixed(1);
        pdf.text(`${rating.rating} Stars: ${rating.count} responses (${percentage}%)`, 30, yPosition);
        yPosition += 5;
      }
    });
    yPosition += 10;

    // Recent Comments (if any)
    const commentsWithText = stats.feedbackStats.recentFeedback.filter(f => f.comments);
    if (commentsWithText.length > 0) {
      checkPageSpace(30 + commentsWithText.length * 15);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recent Feedback Comments', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      commentsWithText.slice(0, 5).forEach(feedback => {
        const date = new Date(feedback.created_at).toLocaleDateString();
        pdf.text(`${feedback.rating}/5 - ${date}`, 25, yPosition);
        yPosition += 5;
        
        // Wrap long comments
        const comment = feedback.comments || '';
        const lines = pdf.splitTextToSize(`"${comment}"`, pageWidth - 50);
        lines.forEach((line: string) => {
          checkPageSpace(5);
          pdf.text(line, 30, yPosition);
          yPosition += 4;
        });
        yPosition += 3;
      });
    }

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Thesis Repository Management System', 20, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `thesis-statistics-${selectedYear !== 'all' ? selectedYear : 'all-time'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};
