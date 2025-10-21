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

// Helper function to capture a chart as an image
const captureChartAsImage = async (elementId: string): Promise<string | null> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with id ${elementId} not found`);
      return null;
    }

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
    // Set background color
    pdf.setFillColor(...colors.background);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header Section with gradient effect
    const headerHeight = 35;
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Add subtle gradient effect
    for (let i = 0; i < 10; i++) {
      pdf.setFillColor(59 + i * 2, 130 + i * 2, 246 + i * 2, 0.1);
      pdf.rect(0, headerHeight - (i * 3.5), pageWidth, 3.5, 'F');
    }
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Analytics', margin, yPosition + 8);
    
    yPosition += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 220, 220);
    pdf.text('Comprehensive overview of thesis submissions and system analytics', margin, yPosition);
    yPosition += 15;

    // Date filter info in a pill-shaped container
    const pillWidth = 120;
    const pillHeight = 8;
    const pillX = pageWidth - margin - pillWidth;
    const pillY = 8;
    
    pdf.setFillColor(255, 255, 255, 0.2);
    pdf.roundedRect(pillX, pillY, pillWidth, pillHeight, 4, 4, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
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
    pdf.text(filterText, pillX + 5, pillY + 5);
    
    // Reset yPosition after header
    yPosition = headerHeight + 15;

    // Key Metrics Cards (4 cards in a row with icons)
    const cardWidth = (pageWidth - (margin * 2) - 15) / 4;
    const cardHeight = 32;
    const cardSpacing = 5;

    // Card 1: LPU Students
    drawCard(margin, yPosition, cardWidth, cardHeight);
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('LPU Students', margin + 3, yPosition + 8);
    
    // Icon placeholder
    pdf.setFillColor(...colors.primary);
    pdf.circle(margin + cardWidth - 10, yPosition + 8, 3, 'F');
    
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
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('External Users', card2X + 3, yPosition + 8);
    
    // Icon placeholder
    pdf.setFillColor(...colors.accent);
    pdf.circle(card2X + cardWidth - 10, yPosition + 8, 3, 'F');
    
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
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Total Submissions', card3X + 3, yPosition + 8);
    
    // Icon placeholder
    pdf.setFillColor(...colors.success);
    pdf.circle(card3X + cardWidth - 10, yPosition + 8, 3, 'F');
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(stats.totalSubmissions.toString(), card3X + 3, yPosition + 18);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    pdf.text(`${stats.recentSubmissions} in last 30 days`, card3X + 3, yPosition + 26);

    // Card 4: User Feedback
    const card4X = card3X + cardWidth + cardSpacing;
    drawCard(card4X, yPosition, cardWidth, cardHeight);
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('User Feedback', card4X + 3, yPosition + 8);
    
    // Icon placeholder
    pdf.setFillColor(...colors.danger);
    pdf.circle(card4X + cardWidth - 10, yPosition + 8, 3, 'F');
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(`${stats.feedbackStats.averageRating}/5`, card4X + 3, yPosition + 18);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    pdf.text(`${stats.feedbackStats.totalFeedback} responses`, card4X + 3, yPosition + 26);

    yPosition += cardHeight + 15;

    // Popular Research Topics Section
    yPosition = drawSectionHeader('Popular Research Topics', margin, yPosition);
    
    const topicsCardHeight = 30;
    drawCard(margin, yPosition, pageWidth - (margin * 2), topicsCardHeight);
    
    if (stats.popularPrograms.length > 0) {
      // Create a horizontal bar chart for top programs
      const barChartHeight = 8;
      const barY = yPosition + 8;
      const maxCount = Math.max(...stats.popularPrograms.map(p => p.count));
      
      // Display top 3 programs as horizontal bars
      stats.popularPrograms.slice(0, 3).forEach((program, index) => {
        const barWidth = (program.count / maxCount) * (pageWidth - (margin * 2) - 60);
        const barX = margin + 50;
        const currentY = barY + (index * 8);
        
        // Program name
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        pdf.text(program.name, margin + 5, currentY + 2);
        
        // Bar background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(barX, currentY, pageWidth - (margin * 2) - 55, 4, 'F');
        
        // Bar fill
        pdf.setFillColor(...colors.primary);
        pdf.rect(barX, currentY, barWidth, 4, 'F');
        
        // Count and percentage
        pdf.setFontSize(7);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${program.count} (${program.percentage}%)`, barX + barWidth + 2, currentY + 2);
      });
    }
    
    yPosition += topicsCardHeight + 15;

    // Charts Section - Two columns
    const chartCardWidth = (pageWidth - (margin * 2) - 10) / 2;
    const chartCardHeight = 80;

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
          pdf.text(`${rating.rating}`, x + barWidth/2 - 1, baseY + 5);
          
          // Value
          pdf.text(rating.count.toString(), x + barWidth/2 - 1, baseY - barHeight - 3);
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
      // Create a simple pie chart
      const centerX = chart2X + chartCardWidth / 2;
      const centerY = yPosition + 40;
      const radius = 25;
      
      // Calculate angles
      const total = stats.lpuStudents + stats.nonLpuStudents;
      const lpuAngle = (stats.lpuStudents / total) * 360;
      
      // Draw LPU segment
      pdf.setFillColor(...colors.primary);
      pdf.circle(centerX, centerY, radius, 'FD');
      
      // Draw non-LPU segment
      pdf.setFillColor(...colors.accent);
      pdf.circle(centerX, centerY, radius, 'FD');
      
      // Draw dividing line
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(2);
      const endX = centerX + radius * Math.cos((lpuAngle * Math.PI) / 180);
      const endY = centerY - radius * Math.sin((lpuAngle * Math.PI) / 180);
      pdf.line(centerX, centerY, endX, endY);
      
      // Labels
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.text('LPU', centerX - 10, centerY - 5);
      pdf.text(`${stats.lpuStudents} (${lpuPercentage}%)`, centerX - 20, centerY + 5);
      
      pdf.text('Non-LPU', centerX + 5, centerY - 5);
      pdf.text(`${stats.nonLpuStudents} (${externalPercentage}%)`, centerX - 5, centerY + 15);
    }

    // ===== PAGE 2 =====
    pdf.addPage();
    pdf.setFillColor(...colors.background);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    yPosition = margin;

    // Page 2 Header
    const headerHeight2 = 30;
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, headerHeight2, 'F');
    
    // Add subtle gradient effect
    for (let i = 0; i < 10; i++) {
      pdf.setFillColor(59 + i * 2, 130 + i * 2, 246 + i * 2, 0.1);
      pdf.rect(0, headerHeight2 - (i * 3), pageWidth, 3, 'F');
    }
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Detailed Statistics', margin, yPosition + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 220, 220);
    pdf.text('In-depth analysis of thesis repository data', margin, yPosition + 20);
    
    yPosition = headerHeight2 + 15;

    // Top Research Programs
    yPosition = drawSectionHeader('Top Research Programs', margin, yPosition);
    
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
    pdf.text('Program', margin + 20, yPosition + 10);
    pdf.text('Submissions', pageWidth - margin - 40, yPosition + 10);
    pdf.text('Percentage', pageWidth - margin - 15, yPosition + 10);
    
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
      
      // Truncate long program names
      const programName = program.name.length > 40 ? program.name.substring(0, 40) + '...' : program.name;
      pdf.text(programName, margin + 20, programY);
      
      pdf.text(program.count.toString(), pageWidth - margin - 40, programY);
      pdf.text(`${program.percentage}%`, pageWidth - margin - 15, programY);
      
      programY += 7;
    });

    yPosition += programCardHeight + 15;

    // Campus Breakdown and Feedback Summary - side by side with reduced height
    // Calculate appropriate heights based on content
    const campusBreakdownHeight = 18 + (stats.campusData.length * (6 + 4)); // Header + bars with spacing
    const feedbackSummaryHeight = 45; // Reduced from 70 to 45
    
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
      const barWidth = (campus.value / campusMaxValue) * (chartCardWidth - 60);
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
      pdf.rect(margin + 40, y, chartCardWidth - 60, campusBarHeight, 'F');
      
      // Bar fill
      pdf.setFillColor(...colors.primary);
      pdf.rect(margin + 40, y, barWidth, campusBarHeight, 'F');
      
      // Value and percentage
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.textLight);
      pdf.text(`${campus.value} (${percentage}%)`, margin + 40 + barWidth + 2, y + 4);
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
    const starSize = 4;
    const starY = ratingY - 2;
    const starStartX = chart2X + 40;
    const starSpacing = 4.5;
    
    // Draw filled stars
    for (let i = 0; i < Math.floor(stats.feedbackStats.averageRating); i++) {
      pdf.setFillColor(...colors.accent); // Yellow color
      drawStar(pdf, starStartX + (i * (starSize + starSpacing)), starY, starSize);
    }
    
    // Draw half star if needed
    if (stats.feedbackStats.averageRating % 1 >= 0.5) {
      pdf.setFillColor(...colors.accent); // Yellow color
      drawStar(pdf, starStartX + (Math.floor(stats.feedbackStats.averageRating) * (starSize + starSpacing)), starY, starSize, true);
    }
    
    // Draw empty stars
    for (let i = Math.ceil(stats.feedbackStats.averageRating); i < 5; i++) {
      pdf.setDrawColor(...colors.textLight);
      pdf.setLineWidth(0.5);
      drawStar(pdf, starStartX + (i * (starSize + starSpacing)), starY, starSize, false, true);
    }
    
    // Rating value - Smaller font
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(`${stats.feedbackStats.averageRating}/5`, starStartX + 30, ratingY);
    
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
    
    // Calculate how many ratings can fit
    const maxRatingsToShow = Math.min(sortedRatings.length, 4);
    
    sortedRatings.slice(0, maxRatingsToShow).forEach((rating, index) => {
      if (rating.count > 0 && ratingBreakdownY < yPosition + feedbackSummaryHeight - 5) {
        const percentage = stats.feedbackStats.totalFeedback > 0 
          ? ((rating.count / stats.feedbackStats.totalFeedback) * 100).toFixed(1)
          : '0';
        
        // Star rating with yellow stars - Smaller
        const miniStarSize = 2.5;
        const miniStarY = ratingBreakdownY - 1.5;
        const miniStarStartX = chart2X + 8;
        const miniStarSpacing = 3;
        
        for (let i = 0; i < rating.rating; i++) {
          pdf.setFillColor(...colors.accent); // Yellow color
          drawStar(pdf, miniStarStartX + (i * (miniStarSize + miniStarSpacing)), miniStarY, miniStarSize);
        }
        
        for (let i = rating.rating; i < 5; i++) {
          pdf.setDrawColor(...colors.textLight);
          pdf.setLineWidth(0.3);
          drawStar(pdf, miniStarStartX + (i * (miniStarSize + miniStarSpacing)), miniStarY, miniStarSize, false, true);
        }
        
        // Bar chart for rating distribution - Smaller
        const barWidth = (rating.count / stats.feedbackStats.totalFeedback) * 35;
        const barY = ratingBreakdownY - 1.5;
        
        pdf.setFillColor(230, 230, 230);
        pdf.rect(chart2X + 25, barY, 35, 2, 'F');
        
        pdf.setFillColor(...colors.primary);
        pdf.rect(chart2X + 25, barY, barWidth, 2, 'F');
        
        // Count and percentage - Smaller font
        pdf.setFontSize(6);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${rating.count} (${percentage}%)`, chart2X + 62, ratingBreakdownY);
        
        ratingBreakdownY += 5;
      }
    });

    // Update yPosition to the higher of the two sections
    yPosition = Math.max(campusDetailY + campusBreakdownHeight, campusDetailY + feedbackSummaryHeight) + 15;

    // ===== PAGE 3 =====
    pdf.addPage();
    pdf.setFillColor(...colors.background);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    yPosition = margin;

    // Page 3 Header
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, headerHeight2, 'F');
    
    // Add subtle gradient effect
    for (let i = 0; i < 10; i++) {
      pdf.setFillColor(59 + i * 2, 130 + i * 2, 246 + i * 2, 0.1);
      pdf.rect(0, headerHeight2 - (i * 3), pageWidth, 3, 'F');
    }
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Submission Trends & Feedback', margin, yPosition + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 220, 220);
    pdf.text('Monthly submission patterns and user comments', margin, yPosition + 20);
    
    yPosition = headerHeight2 + 15;

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
      const points: Array<{x: number, y: number}> = [];
      
      stats.monthlyData.slice(-monthsToShow).forEach((month, index) => {
        const x = startX + (index * (chartWidth / (monthsToShow - 1)));
        const y = baseY - ((month.submissions / maxSubmissions) * chartHeight);
        
        points.push({x, y});
        
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
        pdf.line(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
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

    // Recent User Comments (moved from Page 2) - Updated layout to match image
    const commentsWithText = stats.feedbackStats.recentFeedback.filter(f => f.comments && f.comments.trim() !== '').slice(0, 4);
    if (commentsWithText.length > 0) {
      yPosition = drawSectionHeader('Recent User Comments', margin, yPosition);
      
      // Calculate the maximum height for comments to fit on the page
      const availableHeight = pageHeight - yPosition - margin - 15; // 15 for footer
      const maxCommentsHeight = Math.min(availableHeight, 15 + (commentsWithText.length * 25));
      
      drawCard(margin, yPosition, pageWidth - (margin * 2), maxCommentsHeight);
      
      let commentY = yPosition + 10;
      
      commentsWithText.forEach((feedback, index) => {
        // Individual comment card with spacing
        const commentCardHeight = 22;
        const commentCardY = commentY + (index * commentCardHeight);
        
        // Blue header bar spanning full width
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin + 5, commentCardY, pageWidth - (margin * 2) - 10, 6, 'F');
        
        const date = new Date(feedback.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        
        // Date and rating on the left side of header
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${date} - Rating: ${feedback.rating}/5`, margin + 8, commentCardY + 4);
        
        // Stars on the right side of header
        const starSize = 3;
        const starY = commentCardY + 1.5;
        const starStartX = pageWidth - margin - 25; // Position stars on the right
        const starSpacing = 3.5;
        
        for (let i = 0; i < feedback.rating; i++) {
          pdf.setFillColor(...colors.accent); // Yellow color
          drawStar(pdf, starStartX + (i * (starSize + starSpacing)), starY, starSize);
        }
        
        for (let i = feedback.rating; i < 5; i++) {
          pdf.setDrawColor(...colors.textLight);
          pdf.setLineWidth(0.3);
          drawStar(pdf, starStartX + (i * (starSize + starSpacing)), starY, starSize, false, true);
        }
        
        // Comment content below header
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        const comment = feedback.comments || '';
        
        // Add thesis title if available
        let commentText = `"${comment}"`;
        if (feedback.thesis_title) {
          const title = feedback.thesis_title.length > 50 
            ? feedback.thesis_title.substring(0, 50) + '...' 
            : feedback.thesis_title;
          commentText = `Thesis: ${title}\n${commentText}`;
        }
        
        const lines = pdf.splitTextToSize(commentText, pageWidth - (margin * 2) - 14);
        lines.slice(0, 2).forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + 8, commentCardY + 11 + (lineIndex * 5));
        });
      });
    }

    // ===== PAGE 4 =====
    pdf.addPage();
    pdf.setFillColor(...colors.background);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    yPosition = margin;

    // Page 4 Header
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, headerHeight2, 'F');
    
    // Add subtle gradient effect
    for (let i = 0; i < 10; i++) {
      pdf.setFillColor(59 + i * 2, 130 + i * 2, 246 + i * 2, 0.1);
      pdf.rect(0, headerHeight2 - (i * 3), pageWidth, 3, 'F');
    }
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Campus Distribution & Summary', margin, yPosition + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 220, 220);
    pdf.text('Campus distribution data and key metrics summary', margin, yPosition + 20);
    
    yPosition = headerHeight2 + 15;

    // Campus Distribution Chart (Full Width) - moved from Page 3
    yPosition = drawSectionHeader('Campus Distribution', margin, yPosition);
    drawCard(margin, yPosition, pageWidth - (margin * 2), chartCardHeight);
    
    if (campusDistChart) {
      pdf.addImage(campusDistChart, 'PNG', margin + 5, yPosition + 10, pageWidth - (margin * 2) - 10, 65);
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

    yPosition += chartCardHeight + 15;

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
      
      // Icon placeholder (circle)
      pdf.setFillColor(...colors.primary);
      pdf.circle(x + 3, y - 2, 2, 'F');
      
      // Label
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textLight);
      pdf.text(item.label, x + 8, y);
      
      // Value
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.text);
      pdf.text(item.value, x + 8, y + 5);
    });

    // Footer on all pages
    const footerHeight = 15;
    
    // Page 1 footer
    pdf.setPage(1);
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 1 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);
    
    // Page 2 footer
    pdf.setPage(2);
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 2 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);
    
    // Page 3 footer
    pdf.setPage(3);
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 3 of 4', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);
    
    // Page 4 footer
    pdf.setPage(4);
    pdf.setFillColor(...colors.primary);
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
  const points: Array<{x: number, y: number}> = [];
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(rot) * radius;
    const y = cy + Math.sin(rot) * radius;
    
    // For half star, only draw the right half
    if (half && x < cx) {
      rot += step;
      continue;
    }
    
    points.push({x, y});
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
          // For half star, only fill if the triangle is on the right side
          const midX = (points[i].x + points[nextIndex].x) / 2;
          if (midX >= cx) {
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