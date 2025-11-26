import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import headerImage from '../components/Final_Header.png';

interface StatsData {
  totalSubmissions: number;
  totalUsers: number;
  recentSubmissions: number;
  lpuStudents: number;
  nonLpuStudents: number;
  campusData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; submissions: number }>;
  popularPrograms: Array<{ name: string; count: number; percentage: number }>; // Contains thesis titles
  programsByDegree: Array<{ name: string; count: number; percentage: number }>; // Contains programs
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

// Helper function to capture a chart as an image
const captureChartAsImage = async (elementId: string): Promise<string | null> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with id ${elementId} not found`);
      return null;
    }

    // Wait a bit to ensure charts are fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Error capturing chart ${elementId}:`, error);
    return null;
  }
};

export const exportStatisticsToPDF = async (
  stats: StatsData,
  selectedYear: string,
  dateRange: { start: string; end: string }
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;

    // Color scheme
    const colors = {
      primary: [59, 130, 246],      // Blue
      secondary: [107, 114, 128],   // Gray
      accent: [245, 158, 11],       // Amber/Yellow
      success: [16, 185, 129],      // Green
      danger: [239, 68, 68],        // Red
      background: [248, 250, 252],  // Light blue-gray
      card: [255, 255, 255],        // White
      text: [31, 41, 55],           // Dark gray
      textLight: [107, 114, 128]    // Light gray
    };

    // Helper function to draw rounded rectangle (card background)
    const drawCard = (x: number, y: number, width: number, height: number, shadow = true) => {
      // Shadow effect
      if (shadow) {
        pdf.setFillColor(220, 220, 220, 0.3);
        pdf.roundedRect(x + 1, y + 1, width, height, 3, 3, 'F');
      }

      // Card background
      pdf.setFillColor(...colors.card);
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, width, height, 3, 3, 'FD');
    };

    // Helper function to draw a section header
    const drawSectionHeader = (title: string, x: number, y: number) => {
      // Draw accent line
      pdf.setFillColor(...colors.primary);
      pdf.rect(x, y, 3, 12, 'F');

      // Title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text(title, x + 8, y + 8);

      return y + 18;
    };

    // Helper function to draw a horizontal divider
    const drawDivider = (x: number, y: number, width: number) => {
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(x, y, x + width, y);
    };

    // Capture all charts before starting PDF generation
    console.log('Capturing charts...');
    const feedbackDistChart = await captureChartAsImage('feedback-distribution-chart');
    const studentTypeChart = await captureChartAsImage('student-type-chart');
    const campusDistChart = await captureChartAsImage('campus-distribution-chart');
    const monthlyTrendChart = await captureChartAsImage('monthly-trend-chart');

    // ===== PAGE 1 =====
    // Set background color to white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add header image
    const headerHeight = 30; // Height for the header image
    const headerHeight2 = 30; // For pages 2-4
    pdf.addImage(headerImage, 'PNG', 0, 0, pageWidth, headerHeight);

    // Reset yPosition after header
    yPosition = headerHeight + 10;

    // Report Period - centered in body above cards
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
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(filterText, pageWidth / 2, yPosition, 'center');

    yPosition += 10;

    // Key Metrics Cards (4 cards in a row with icons)
    const cardWidth = (pageWidth - (margin * 2) - 15) / 4;
    const cardHeight = 32;
    const cardSpacing = 5;

    // Card 1: LPU Students
    drawCard(margin, yPosition, cardWidth, cardHeight);

    // Icon placeholder - top right corner
    pdf.setFillColor(...colors.primary);
    pdf.circle(margin + cardWidth - 5, yPosition + 5, 3, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('LPU Students', margin + 3, yPosition + 8);

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(stats.lpuStudents.toString(), margin + 3, yPosition + 18);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    const lpuPercentage = stats.totalSubmissions > 0
      ? ((stats.lpuStudents / stats.totalSubmissions) * 100).toFixed(1)
      : '0';
    pdf.text(`${lpuPercentage}% of total`, margin + 3, yPosition + 26);

    // Card 2: External Users
    const card2X = margin + cardWidth + cardSpacing;
    drawCard(card2X, yPosition, cardWidth, cardHeight);

    // Icon placeholder - top right corner
    pdf.setFillColor(...colors.accent);
    pdf.circle(card2X + cardWidth - 5, yPosition + 5, 3, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('External Users', card2X + 3, yPosition + 8);

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(stats.nonLpuStudents.toString(), card2X + 3, yPosition + 18);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    const externalPercentage = stats.totalSubmissions > 0
      ? ((stats.nonLpuStudents / stats.totalSubmissions) * 100).toFixed(1)
      : '0';
    pdf.text(`${externalPercentage}% of total`, card2X + 3, yPosition + 26);

    // Card 3: Total Submissions
    const card3X = card2X + cardWidth + cardSpacing;
    drawCard(card3X, yPosition, cardWidth, cardHeight);

    // Icon placeholder - top right corner
    pdf.setFillColor(...colors.success);
    pdf.circle(card3X + cardWidth - 5, yPosition + 5, 3, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Total Submissions', card3X + 3, yPosition + 8);

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(stats.totalSubmissions.toString(), card3X + 3, yPosition + 18);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    // Dynamic subtitle based on filter
    let submissionSubtitle = '';
    if (selectedYear !== 'all') {
      submissionSubtitle = `${stats.recentSubmissions} in ${selectedYear}`;
    } else if (dateRange.start && dateRange.end) {
      submissionSubtitle = `${stats.recentSubmissions} in selected period`;
    } else {
      submissionSubtitle = `${stats.recentSubmissions} in last 30 days`;
    }
    pdf.text(submissionSubtitle, card3X + 3, yPosition + 26);

    // Card 4: User Feedback
    const card4X = card3X + cardWidth + cardSpacing;
    drawCard(card4X, yPosition, cardWidth, cardHeight);

    // Icon placeholder - top right corner
    pdf.setFillColor(...colors.danger);
    pdf.circle(card4X + cardWidth - 5, yPosition + 5, 3, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('User Feedback', card4X + 3, yPosition + 8);

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(`${stats.feedbackStats.averageRating}/5`, card4X + 3, yPosition + 18);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    pdf.text(`${stats.feedbackStats.totalFeedback} responses`, card4X + 3, yPosition + 26);

    yPosition += cardHeight + 15;

    // Popular Researchers by Program Section
    yPosition = drawSectionHeader('Popular Researchers by Program', margin, yPosition);

    const topicsCardHeight = 30;
    drawCard(margin, yPosition, pageWidth - (margin * 2), topicsCardHeight);

    if (stats.programsByDegree.length > 0) {
      // Create a horizontal bar chart for top programs
      const barChartHeight = 8;
      const barY = yPosition + 8;
      const maxCount = Math.max(...stats.programsByDegree.map(p => p.count));

      // Display top 3 programs as horizontal bars
      stats.programsByDegree.slice(0, 3).forEach((program, index) => {
        const maxBarWidth = pageWidth - (margin * 2) - 90; // Increased space for percentage text
        const barWidth = (program.count / maxCount) * maxBarWidth;
        const barX = margin + 50;
        const currentY = barY + (index * 8);

        // Program name
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        pdf.text(program.name, margin + 5, currentY + 2);

        // Bar background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(barX, currentY, maxBarWidth, 4, 'F');

        // Bar fill
        pdf.setFillColor(...colors.primary);
        pdf.rect(barX, currentY, barWidth, 4, 'F');

        // Count and percentage - positioned after the background bar
        pdf.setFontSize(7);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${program.count} (${program.percentage}%)`, barX + maxBarWidth + 3, currentY + 2);
      });
    }

    yPosition += topicsCardHeight + 15;

    // Charts Section - Two columns
    const chartCardWidth = (pageWidth - (margin * 2) - 10) / 2;
    const chartCardHeight = 80;
    const footerHeight = 15;

    // Feedback Distribution Chart (Left)
    const feedbackY = yPosition;
    yPosition = drawSectionHeader('Feedback Distribution', margin, yPosition);
    drawCard(margin, yPosition, chartCardWidth, chartCardHeight);

    if (feedbackDistChart) {
      pdf.addImage(feedbackDistChart, 'PNG', margin + 5, yPosition + 10, chartCardWidth - 10, 65);
    } else {
      // Create a simple bar chart
      const barWidth = 15;
      const barSpacing = 5;
      const startX = margin + 20;
      const maxCount = Math.max(...stats.feedbackStats.ratingDistribution.map(r => r.count));
      const chartHeight = 40;
      const baseY = yPosition + 55;

      pdf.setFontSize(7);
      pdf.setTextColor(...colors.textLight);
      pdf.text('Rating', startX - 10, baseY + 10);
      pdf.text('Count', startX + 60, baseY - chartHeight - 5);

      // Draw axes
      pdf.setDrawColor(...colors.textLight);
      pdf.line(startX - 5, baseY, startX + 80, baseY);
      pdf.line(startX - 5, baseY, startX - 5, baseY - chartHeight);

      // Draw bars
      stats.feedbackStats.ratingDistribution.forEach((rating, index) => {
        if (rating.count > 0) {
          const barHeight = (rating.count / maxCount) * chartHeight;
          const x = startX + (index * (barWidth + barSpacing));

          // Bar
          pdf.setFillColor(...colors.primary);
          pdf.rect(x, baseY - barHeight, barWidth, barHeight, 'F');

          // Label
          pdf.text(`${rating.rating}`, x + barWidth / 2 - 1, baseY + 5);

          // Value
          pdf.text(rating.count.toString(), x + barWidth / 2 - 1, baseY - barHeight - 3);
        }
      });
    }

    // Student Type Distribution Chart (Right)
    const chart2X = margin + chartCardWidth + 10;
    yPosition = feedbackY;
    yPosition = drawSectionHeader('Student Type Distribution', chart2X, yPosition);
    drawCard(chart2X, yPosition, chartCardWidth, chartCardHeight);

    if (studentTypeChart) {
      pdf.addImage(studentTypeChart, 'PNG', chart2X + 5, yPosition + 10, chartCardWidth - 10, 65);
    } else {
      // Fallback: Display text-based data
      const centerX = chart2X + chartCardWidth / 2;
      const centerY = yPosition + 35;

      // Title
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Student Distribution', centerX, centerY - 10, 'center');

      // LPU Students
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setFillColor(220, 38, 38); // Red
      pdf.circle(chart2X + 15, centerY + 5, 3, 'F');
      pdf.setTextColor(...colors.text);
      pdf.text('LPU Students:', chart2X + 22, centerY + 7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${stats.lpuStudents} (${lpuPercentage}%)`, chart2X + 22, centerY + 14);

      // Non-LPU Students
      pdf.setFont('helvetica', 'normal');
      pdf.setFillColor(37, 99, 235); // Blue
      pdf.circle(chart2X + 15, centerY + 25, 3, 'F');
      pdf.setTextColor(...colors.text);
      pdf.text('Non-LPU Students:', chart2X + 22, centerY + 27);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${stats.nonLpuStudents} (${externalPercentage}%)`, chart2X + 22, centerY + 34);

      // Total
      const total = stats.lpuStudents + stats.nonLpuStudents;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textLight);
      pdf.text(`Total: ${total} students`, centerX, centerY + 50, 'center');
    }

    // Page 1 footer
    pdf.setFillColor(161, 39, 44); // rgba(161, 39, 44)
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LyceumVault', margin, pageHeight - 10);
    pdf.text('Page 1 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);

    // ===== PAGE 2 =====
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    yPosition = margin;

    // Add header image
    pdf.addImage(headerImage, 'PNG', 0, 0, pageWidth, headerHeight2);

    yPosition = headerHeight2 + 10;

    // Top Research Thesis Titles
    yPosition = drawSectionHeader('Top Research Thesis Titles', margin, yPosition);

    const maxPrograms = Math.min(stats.popularPrograms.length, 10);
    const programCardHeight = 15 + (maxPrograms * 7);
    drawCard(margin, yPosition, pageWidth - (margin * 2), programCardHeight);

    // Table header
    pdf.setFillColor(...colors.primary);
    pdf.rect(margin + 5, yPosition + 5, pageWidth - (margin * 2) - 10, 8, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Rank', margin + 8, yPosition + 10);
    pdf.text('Thesis Title', margin + 20, yPosition + 10);
    pdf.text('Submissions', pageWidth - margin - 48, yPosition + 10);
    pdf.text('Percentage', pageWidth - margin - 23, yPosition + 10);

    // Table rows
    let programY = yPosition + 15;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    stats.popularPrograms.slice(0, maxPrograms).forEach((program, index) => {
      // Alternate row color
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin + 5, programY - 3, pageWidth - (margin * 2) - 10, 6, 'F');
      }

      pdf.setTextColor(...colors.text);
      pdf.text((index + 1).toString(), margin + 8, programY);

      // Truncate long thesis titles for PDF display
      const thesisTitle = program.name.length > 60 ? program.name.substring(0, 60) + '...' : program.name;
      pdf.text(thesisTitle, margin + 20, programY);

      pdf.text(program.count.toString(), pageWidth - margin - 40, programY);
      pdf.text(`${program.percentage}%`, pageWidth - margin - 15, programY);

      programY += 7;
    });

    yPosition += programCardHeight + 15;

    // Campus Breakdown and Feedback Summary - side by side with reduced height
    // Calculate appropriate heights based on content
    const campusBreakdownHeight = 18 + (stats.campusData.length * (6 + 4)); // Header + bars with spacing
    const feedbackSummaryHeight = 58; // Increased to accommodate all 5 ratings

    // Campus Breakdown (Left)
    const campusDetailY = yPosition;
    yPosition = drawSectionHeader('Campus Breakdown', margin, yPosition);
    drawCard(margin, yPosition, chartCardWidth, campusBreakdownHeight);

    // Create a horizontal bar chart for campus data
    const campusBarHeight = 6;
    const campusBarSpacing = 4;
    const campusStartY = yPosition + 10;
    const campusMaxValue = Math.max(...stats.campusData.map(c => c.value));

    stats.campusData.forEach((campus, index) => {
      const y = campusStartY + (index * (campusBarHeight + campusBarSpacing));
      const barWidth = (campus.value / campusMaxValue) * (chartCardWidth - 65);
      const percentage = stats.totalSubmissions > 0
        ? ((campus.value / stats.totalSubmissions) * 100).toFixed(1)
        : '0';

      // Campus name
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);
      pdf.text(campus.name, margin + 5, y + 4);

      // Bar background
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin + 40, y, chartCardWidth - 65, campusBarHeight, 'F');

      // Bar fill
      pdf.setFillColor(...colors.primary);
      pdf.rect(margin + 40, y, barWidth, campusBarHeight, 'F');

      // Value and percentage - aligned in fixed column position
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.textLight);
      pdf.text(`${campus.value} (${percentage}%)`, margin + 40 + (chartCardWidth - 65) + 3, y + 4);
    });

    // Feedback Summary (Right) - Fixed layout with reduced height
    yPosition = campusDetailY;
    yPosition = drawSectionHeader('Feedback Summary', chart2X, yPosition);
    drawCard(chart2X, yPosition, chartCardWidth, feedbackSummaryHeight);

    // Average rating visualization - Reduced size
    const ratingY = yPosition + 8;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    pdf.text('Average Rating:', chart2X + 5, ratingY);

    // Star rating visualization with yellow stars - Smaller and better positioned
    const starSize = 3;
    const starY = ratingY - 1.5;
    const starStartX = chart2X + 35;
    const starSpacing = 6.5;

    // Draw filled stars
    for (let i = 0; i < Math.floor(stats.feedbackStats.averageRating); i++) {
      pdf.setFillColor(...colors.accent); // Yellow color
      drawStar(pdf, starStartX + (i * starSpacing), starY, starSize);
    }

    // Draw half star if needed
    if (stats.feedbackStats.averageRating % 1 >= 0.5) {
      const halfStarX = starStartX + (Math.floor(stats.feedbackStats.averageRating) * starSpacing);
      // Draw outline of full star first
      pdf.setDrawColor(...colors.textLight);
      pdf.setLineWidth(0.5);
      drawStar(pdf, halfStarX, starY, starSize, false, true);
      // Then draw filled half on top
      pdf.setFillColor(...colors.accent); // Yellow color
      drawStar(pdf, halfStarX, starY, starSize, true);
    }

    // Draw empty stars
    for (let i = Math.ceil(stats.feedbackStats.averageRating); i < 5; i++) {
      pdf.setDrawColor(...colors.textLight);
      pdf.setLineWidth(0.5);
      drawStar(pdf, starStartX + (i * starSpacing), starY, starSize, false, true);
    }

    // Rating value - Smaller font
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(`${stats.feedbackStats.averageRating}/5`, starStartX + 34, ratingY);

    // Total responses - Smaller font and adjusted position
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    pdf.text(`Total: ${stats.feedbackStats.totalFeedback}`, chart2X + 5, ratingY + 8);

    // Rating breakdown - Reduced spacing
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Rating Breakdown:', chart2X + 5, ratingY + 16);

    const sortedRatings = [...stats.feedbackStats.ratingDistribution].sort((a, b) => b.rating - a.rating);
    let ratingBreakdownY = ratingY + 22;

    // Calculate how many ratings can fit - show all available ratings
    const maxRatingsToShow = sortedRatings.length;

    sortedRatings.slice(0, maxRatingsToShow).forEach((rating, index) => {
      if (rating.count > 0 && ratingBreakdownY < yPosition + feedbackSummaryHeight - 2) {
        const percentage = stats.feedbackStats.totalFeedback > 0
          ? ((rating.count / stats.feedbackStats.totalFeedback) * 100).toFixed(1)
          : '0';

        // Star rating with yellow stars - Smaller
        const miniStarSize = 2.5;
        const miniStarY = ratingBreakdownY - 1.5;
        const miniStarStartX = chart2X + 8;
        const miniStarSpacing = 3.8;

        for (let i = 0; i < rating.rating; i++) {
          pdf.setFillColor(...colors.accent); // Yellow color
          drawStar(pdf, miniStarStartX + (i * miniStarSpacing), miniStarY, miniStarSize);
        }

        for (let i = rating.rating; i < 5; i++) {
          pdf.setDrawColor(...colors.textLight);
          pdf.setLineWidth(0.3);
          drawStar(pdf, miniStarStartX + (i * miniStarSpacing), miniStarY, miniStarSize, false, true);
        }

        // Bar chart for rating distribution - Smaller
        const barWidth = (rating.count / stats.feedbackStats.totalFeedback) * 35;
        const barY = ratingBreakdownY - 1.5;

        pdf.setFillColor(230, 230, 230);
        pdf.rect(chart2X + 30, barY, 35, 2, 'F');

        pdf.setFillColor(...colors.primary);
        pdf.rect(chart2X + 30, barY, barWidth, 2, 'F');

        // Count and percentage - Smaller font
        pdf.setFontSize(6);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${rating.count} (${percentage}%)`, chart2X + 67, ratingBreakdownY);

        ratingBreakdownY += 5;
      }
    });

    // Update yPosition to the higher of the two sections
    yPosition = Math.max(campusDetailY + campusBreakdownHeight, campusDetailY + feedbackSummaryHeight) + 15;

    // Page 2 footer
    pdf.setFillColor(161, 39, 44); // #7D0006
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 2 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);

    // ===== PAGE 3 =====
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    yPosition = margin;

    // Add header image
    pdf.addImage(headerImage, 'PNG', 0, 0, pageWidth, headerHeight2);

    yPosition = headerHeight2 + 10;

    // Monthly Submission Trend Chart (Full Width) - Reduced size
    yPosition = drawSectionHeader('Monthly Submission Trend', margin, yPosition);
    const trendChartHeight = 80; // Reduced from 120
    drawCard(margin, yPosition, pageWidth - (margin * 2), trendChartHeight);

    if (monthlyTrendChart) {
      pdf.addImage(monthlyTrendChart, 'PNG', margin + 5, yPosition + 10, pageWidth - (margin * 2) - 10, 60); // Reduced height
    } else {
      // Create a simple line chart
      const chartHeight = 45; // Reduced from 60
      const chartWidth = pageWidth - (margin * 2) - 60;
      const startX = margin + 30;
      const baseY = yPosition + 60; // Adjusted position
      const monthsToShow = Math.min(12, stats.monthlyData.length);
      const maxSubmissions = Math.max(...stats.monthlyData.slice(-monthsToShow).map(m => m.submissions));

      // Draw axes
      pdf.setDrawColor(...colors.textLight);
      pdf.line(startX, baseY, startX + chartWidth, baseY);
      pdf.line(startX, baseY, startX, baseY - chartHeight);

      // Draw grid lines
      pdf.setDrawColor(240, 240, 240);
      pdf.setLineWidth(0.3);
      for (let i = 1; i <= 5; i++) {
        const gridY = baseY - (i * chartHeight / 5);
        pdf.line(startX, gridY, startX + chartWidth, gridY);
      }

      // Draw data points and lines
      const points: Array<{ x: number, y: number }> = [];

      stats.monthlyData.slice(-monthsToShow).forEach((month, index) => {
        const x = startX + (index * (chartWidth / (monthsToShow - 1)));
        const y = baseY - ((month.submissions / maxSubmissions) * chartHeight);

        points.push({ x, y });

        // Draw point
        pdf.setFillColor(...colors.primary);
        pdf.circle(x, y, 3, 'F');

        // Draw value
        pdf.setFontSize(7);
        pdf.setTextColor(...colors.text);
        pdf.text(month.submissions.toString(), x - 5, y - 8);

        // Draw month label
        const monthLabel = month.month.substring(0, 3);
        pdf.text(monthLabel, x - 10, baseY + 10);
      });

      // Draw lines between points
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(1.5);
      for (let i = 0; i < points.length - 1; i++) {
        pdf.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }

      // Y-axis labels
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.textLight);
      for (let i = 0; i <= 5; i++) {
        const value = Math.round((i * maxSubmissions) / 5);
        const gridY = baseY - (i * chartHeight / 5);
        pdf.text(value.toString(), startX - 15, gridY + 2);
      }

      // Chart title
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Monthly Submissions', pageWidth / 2 - 25, yPosition + 5);
    }

    yPosition += trendChartHeight + 15;

    // Recent User Comments - Two-column layout for 10 comments
    const recentComments = stats.feedbackStats.recentFeedback.slice(0, 10);
    if (recentComments.length > 0) {
      yPosition = drawSectionHeader('Recent User Comments', margin, yPosition);

      // Calculate the height needed - based on 5 rows (max in one column)
      const commentSpacing = 18; // Space per comment
      const commentsPerColumn = 5;
      const maxRows = Math.min(commentsPerColumn, recentComments.length);
      const totalCommentsHeight = 8 + (maxRows * commentSpacing);

      drawCard(margin, yPosition, pageWidth - (margin * 2), totalCommentsHeight);

      // Calculate column widths and positions
      const cardWidth = pageWidth - (margin * 2);
      const columnSpacing = 10; // Space between columns
      const columnWidth = (cardWidth - columnSpacing) / 2;
      const leftColumnX = margin + 3;
      const rightColumnX = margin + columnWidth + columnSpacing - 3;

      // Draw vertical divider between columns
      const dividerX = margin + (cardWidth / 2);
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(dividerX, yPosition + 5, dividerX, yPosition + totalCommentsHeight - 5);

      recentComments.forEach((feedback, index) => {
        // Determine which column and row
        const isLeftColumn = index < commentsPerColumn;
        const rowIndex = index % commentsPerColumn;
        const baseX = isLeftColumn ? leftColumnX : rightColumnX;
        const currentY = yPosition + 8 + (rowIndex * commentSpacing);

        // Yellow accent bar on the left (matching web design)
        pdf.setFillColor(...colors.accent); // Yellow color
        pdf.rect(baseX, currentY, 3, 15, 'F');

        // Stars and date on the first line
        const starSize = 2;
        const starStartX = baseX + 7;
        const starY = currentY + 2;
        const starSpacing = 3;

        // Draw stars
        for (let i = 0; i < feedback.rating; i++) {
          pdf.setFillColor(...colors.accent); // Yellow color
          drawStar(pdf, starStartX + (i * starSpacing), starY, starSize);
        }

        for (let i = feedback.rating; i < 5; i++) {
          pdf.setDrawColor(...colors.textLight);
          pdf.setLineWidth(0.3);
          drawStar(pdf, starStartX + (i * starSpacing), starY, starSize, false, true);
        }

        // Date next to stars
        const date = new Date(feedback.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.textLight);
        pdf.text(date, starStartX + 20, currentY + 3);

        // Comment text (if available)
        if (feedback.comments) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...colors.text);
          const comment = feedback.comments;
          const maxCommentWidth = columnWidth - 15;
          const lines = pdf.splitTextToSize(comment, maxCommentWidth);
          pdf.text(lines[0] || '', starStartX, currentY + 8);
        }

        // Thesis title at the bottom - display full title with wrapping
        if (feedback.thesis_title) {
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...colors.textLight);
          const title = `Thesis: ${feedback.thesis_title}`;
          const maxTitleWidth = columnWidth - 15;
          const titleLines = pdf.splitTextToSize(title, maxTitleWidth);
          // Display first line at the standard position
          if (titleLines.length > 0) {
            pdf.text(titleLines[0], starStartX, currentY + 13);
          }
          // Display second line if it exists
          if (titleLines.length > 1) {
            pdf.text(titleLines[1], starStartX, currentY + 16);
          }
        }
      });
    }

    // Page 3 footer
    pdf.setFillColor(161, 39, 44); // #7D0006
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 3 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);

    // ===== PAGE 4 =====
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    yPosition = margin;

    // Add header image
    pdf.addImage(headerImage, 'PNG', 0, 0, pageWidth, headerHeight2);

    yPosition = headerHeight2 + 10;

    // Campus Distribution Chart (Full Width) - moved from Page 3
    yPosition = drawSectionHeader('Campus Distribution', margin, yPosition);
    const campusChartHeight = 100; // Increased height to prevent distortion
    drawCard(margin, yPosition, pageWidth - (margin * 2), campusChartHeight);

    if (campusDistChart) {
      pdf.addImage(campusDistChart, 'PNG', margin + 5, yPosition + 10, pageWidth - (margin * 2) - 10, 85);
    } else {
      // Create a simple horizontal bar chart
      const barHeight = 8;
      const barSpacing = 5;
      const startY = yPosition + 10;
      const maxValue = Math.max(...stats.campusData.map(c => c.value));

      stats.campusData.slice(0, 6).forEach((campus, index) => {
        const y = startY + (index * (barHeight + barSpacing));
        const barWidth = (campus.value / maxValue) * (pageWidth - (margin * 2) - 100);
        const percentage = stats.totalSubmissions > 0
          ? ((campus.value / stats.totalSubmissions) * 100).toFixed(1)
          : '0';

        // Campus name
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        pdf.text(campus.name, margin + 10, y + 5);

        // Bar background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin + 60, y, pageWidth - (margin * 2) - 100, barHeight, 'F');

        // Bar fill
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin + 60, y, barWidth, barHeight, 'F');

        // Value and percentage
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${campus.value} (${percentage}%)`, margin + 60 + barWidth + 5, y + 5);
      });
    }

    yPosition += campusChartHeight + 15;

    // Quick Summary Section (moved from Page 3)
    yPosition = drawSectionHeader('Quick Summary', margin, yPosition);

    const summaryHeight = 40;
    drawCard(margin, yPosition, pageWidth - (margin * 2), summaryHeight);

    // Create a two-column layout for summary
    const columnWidth = (pageWidth - (margin * 2) - 10) / 2;

    // Left column
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);

    const leftColumnX = margin + 5;
    const rightColumnX = leftColumnX + columnWidth + 10;

    // Summary items with icons
    const summaryItems = [
      { icon: '📊', label: 'Total Submissions', value: stats.totalSubmissions.toString() },
      { icon: '👥', label: 'Student Distribution', value: `${stats.lpuStudents} LPU / ${stats.nonLpuStudents} Non-LPU` },
      { icon: '📈', label: 'Recent Activity', value: `${stats.recentSubmissions} submissions in the last 30 days` },
      { icon: '⭐', label: 'User Feedback', value: `${stats.feedbackStats.averageRating}/5 average rating` },
      { icon: '💬', label: 'Total Feedback', value: `${stats.feedbackStats.totalFeedback} responses` },
      { icon: '👤', label: 'Total Users', value: stats.totalUsers.toString() }
    ];

    summaryItems.forEach((item, index) => {
      const isLeftColumn = index < 3;
      const x = isLeftColumn ? leftColumnX : rightColumnX;
      const y = yPosition + 10 + ((index % 3) * 10);

      // Icon placeholder (circle) - vertically centered with text block
      pdf.setFillColor(...colors.primary);
      pdf.circle(x + 3, y + 1.5, 2, 'F');

      // Label
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textLight);
      pdf.text(item.label, x + 8, y);

      // Value
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.text);
      pdf.text(item.value, x + 8, y + 5);
    });

    // Page 4 footer
    pdf.setFillColor(161, 39, 44); // #7D0006
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 4 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);

    // Save the PDF
    const fileName = `thesis-statistics-${selectedYear !== 'all' ? selectedYear : 'all-time'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Helper function to draw a star shape - Fixed version using only valid jsPDF methods
function drawStar(pdf: any, cx: number, cy: number, size: number, half = false, outline = false) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size / 2;
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;

  // Calculate star points
  const points: Array<{ x: number, y: number }> = [];

  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(rot) * radius;
    const y = cy + Math.sin(rot) * radius;

    points.push({ x, y });
    rot += step;
  }

  // Draw the star using lines
  if (points.length > 0) {
    for (let i = 0; i < points.length; i++) {
      const nextIndex = (i + 1) % points.length;

      if (outline) {
        pdf.line(points[i].x, points[i].y, points[nextIndex].x, points[nextIndex].y);
      } else {
        // For filled star, we need to create triangles from the center
        if (!half) {
          pdf.triangle(
            cx, cy,
            points[i].x, points[i].y,
            points[nextIndex].x, points[nextIndex].y,
            'F'
          );
        } else {
          // For half star, only fill if the triangle is on the left side
          const midX = (points[i].x + points[nextIndex].x) / 2;
          if (midX <= cx) {
            pdf.triangle(
              cx, cy,
              points[i].x, points[i].y,
              points[nextIndex].x, points[nextIndex].y,
              'F'
            );
          }
        }
      }
    }
  }
}