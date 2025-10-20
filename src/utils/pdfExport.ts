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
      accent: [245, 158, 11],       // Amber
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
    yPosition = drawSectionHeader('Student Type Distribution', chart2X, yPosition - 18);
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

    yPosition += chartCardHeight + 15;

    // Campus Distribution and Monthly Trend Charts
    // Campus Distribution Chart (Left)
    yPosition = drawSectionHeader('Campus Distribution', margin, yPosition);
    drawCard(margin, yPosition, chartCardWidth, chartCardHeight);
    
    if (campusDistChart) {
      pdf.addImage(campusDistChart, 'PNG', margin + 5, yPosition + 10, chartCardWidth - 10, 65);
    } else {
      // Create a simple horizontal bar chart
      const barHeight = 6;
      const barSpacing = 3;
      const startY = yPosition + 10;
      const maxValue = Math.max(...stats.campusData.map(c => c.value));
      
      stats.campusData.slice(0, 5).forEach((campus, index) => {
        const y = startY + (index * (barHeight + barSpacing));
        const barWidth = (campus.value / maxValue) * (chartCardWidth - 60);
        const percentage = stats.totalSubmissions > 0 
          ? ((campus.value / stats.totalSubmissions) * 100).toFixed(1)
          : '0';
        
        // Campus name
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        const campusName = campus.name.length > 10 ? campus.name.substring(0, 10) + '...' : campus.name;
        pdf.text(campusName, margin + 5, y + 4);
        
        // Bar background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin + 40, y, chartCardWidth - 60, barHeight, 'F');
        
        // Bar fill
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin + 40, y, barWidth, barHeight, 'F');
        
        // Value and percentage
        pdf.setFontSize(6);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${campus.value} (${percentage}%)`, margin + 40 + barWidth + 2, y + 4);
      });
    }

    // Monthly Submission Trend Chart (Right)
    yPosition = drawSectionHeader('Monthly Submission Trend', chart2X, yPosition - 18);
    drawCard(chart2X, yPosition, chartCardWidth, chartCardHeight);
    
    if (monthlyTrendChart) {
      pdf.addImage(monthlyTrendChart, 'PNG', chart2X + 5, yPosition + 10, chartCardWidth - 10, 65);
    } else {
      // Create a simple line chart
      const chartHeight = 40;
      const chartWidth = chartCardWidth - 30;
      const startX = chart2X + 15;
      const baseY = yPosition + 55;
      const monthsToShow = Math.min(6, stats.monthlyData.length);
      const maxSubmissions = Math.max(...stats.monthlyData.slice(-monthsToShow).map(m => m.submissions));
      
      // Draw axes
      pdf.setDrawColor(...colors.textLight);
      pdf.line(startX, baseY, startX + chartWidth, baseY);
      pdf.line(startX, baseY, startX, baseY - chartHeight);
      
      // Draw data points and lines
      const points: Array<{x: number, y: number}> = [];
      
      stats.monthlyData.slice(-monthsToShow).forEach((month, index) => {
        const x = startX + (index * (chartWidth / (monthsToShow - 1)));
        const y = baseY - ((month.submissions / maxSubmissions) * chartHeight);
        
        points.push({x, y});
        
        // Draw point
        pdf.setFillColor(...colors.primary);
        pdf.circle(x, y, 2, 'F');
        
        // Draw value
        pdf.setFontSize(6);
        pdf.setTextColor(...colors.text);
        pdf.text(month.submissions.toString(), x - 3, y - 5);
        
        // Draw month label
        const monthLabel = month.month.substring(0, 3);
        pdf.text(monthLabel, x - 8, baseY + 8);
      });
      
      // Draw lines between points
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(1);
      for (let i = 0; i < points.length - 1; i++) {
        pdf.line(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
      }
    }

    yPosition += chartCardHeight + 15;

    // Quick Summary Section
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

    // Campus Breakdown and Feedback Summary - side by side
    const detailCardHeight = 70;
    
    // Campus Breakdown (Left)
    yPosition = drawSectionHeader('Campus Breakdown', margin, yPosition);
    drawCard(margin, yPosition, chartCardWidth, detailCardHeight);
    
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

    // Feedback Summary (Right)
    yPosition = drawSectionHeader('Feedback Summary', chart2X, yPosition - 18);
    drawCard(chart2X, yPosition, chartCardWidth, detailCardHeight);
    
    // Average rating visualization
    const ratingY = yPosition + 10;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    pdf.text('Average Rating:', chart2X + 5, ratingY);
    
    // Star rating visualization
    const starSize = 5;
    const starY = ratingY - 3;
    const starStartX = chart2X + 45;
    
    // Draw filled stars
    for (let i = 0; i < Math.floor(stats.feedbackStats.averageRating); i++) {
      pdf.setFillColor(...colors.accent);
      drawStar(pdf, starStartX + (i * (starSize + 1)), starY, starSize);
    }
    
    // Draw half star if needed
    if (stats.feedbackStats.averageRating % 1 >= 0.5) {
      pdf.setFillColor(...colors.accent);
      drawStar(pdf, starStartX + (Math.floor(stats.feedbackStats.averageRating) * (starSize + 1)), starY, starSize, true);
    }
    
    // Draw empty stars
    for (let i = Math.ceil(stats.feedbackStats.averageRating); i < 5; i++) {
      pdf.setDrawColor(...colors.textLight);
      pdf.setLineWidth(0.5);
      drawStar(pdf, starStartX + (i * (starSize + 1)), starY, starSize, false, true);
    }
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(`${stats.feedbackStats.averageRating}/5`, starStartX + 35, ratingY);
    
    // Total responses
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textLight);
    pdf.text(`Total Responses: ${stats.feedbackStats.totalFeedback}`, chart2X + 5, ratingY + 10);
    
    // Rating breakdown
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Rating Breakdown:', chart2X + 5, ratingY + 20);
    
    const sortedRatings = [...stats.feedbackStats.ratingDistribution].sort((a, b) => b.rating - a.rating);
    let ratingBreakdownY = ratingY + 28;
    
    sortedRatings.forEach(rating => {
      if (rating.count > 0) {
        const percentage = stats.feedbackStats.totalFeedback > 0 
          ? ((rating.count / stats.feedbackStats.totalFeedback) * 100).toFixed(1)
          : '0';
        
        // Star rating
        const miniStarSize = 3;
        const miniStarY = ratingBreakdownY - 2;
        const miniStarStartX = chart2X + 8;
        
        for (let i = 0; i < rating.rating; i++) {
          pdf.setFillColor(...colors.accent);
          drawStar(pdf, miniStarStartX + (i * (miniStarSize + 0.5)), miniStarY, miniStarSize);
        }
        
        for (let i = rating.rating; i < 5; i++) {
          pdf.setDrawColor(...colors.textLight);
          pdf.setLineWidth(0.3);
          drawStar(pdf, miniStarStartX + (i * (miniStarSize + 0.5)), miniStarY, miniStarSize, false, true);
        }
        
        // Bar chart for rating distribution
        const barWidth = (rating.count / stats.feedbackStats.totalFeedback) * 50;
        const barY = ratingBreakdownY - 2;
        
        pdf.setFillColor(230, 230, 230);
        pdf.rect(chart2X + 30, barY, 50, 3, 'F');
        
        pdf.setFillColor(...colors.primary);
        pdf.rect(chart2X + 30, barY, barWidth, 3, 'F');
        
        // Count and percentage
        pdf.setFontSize(7);
        pdf.setTextColor(...colors.textLight);
        pdf.text(`${rating.count} (${percentage}%)`, chart2X + 85, ratingBreakdownY);
        
        ratingBreakdownY += 6;
      }
    });

    yPosition += detailCardHeight + 15;

    // Recent User Comments
    const commentsWithText = stats.feedbackStats.recentFeedback.filter(f => f.comments && f.comments.trim() !== '').slice(0, 4);
    if (commentsWithText.length > 0) {
      yPosition = drawSectionHeader('Recent User Comments', margin, yPosition);
      
      const commentsHeight = 15 + (commentsWithText.length * 18);
      drawCard(margin, yPosition, pageWidth - (margin * 2), commentsHeight);
      
      let commentY = yPosition + 10;
      
      commentsWithText.forEach((feedback, index) => {
        // Comment card
        const commentCardHeight = 15;
        const commentCardY = commentY + (index * commentCardHeight);
        
        // Comment header with rating
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin + 5, commentCardY, pageWidth - (margin * 2) - 10, 5, 'F');
        
        const date = new Date(feedback.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${date} - Rating: ${feedback.rating}/5`, margin + 8, commentCardY + 3.5);
        
        // Star rating
        const starSize = 3;
        const starY = commentCardY + 1;
        const starStartX = margin + 70;
        
        for (let i = 0; i < feedback.rating; i++) {
          pdf.setFillColor(255, 255, 255);
          drawStar(pdf, starStartX + (i * (starSize + 0.5)), starY, starSize);
        }
        
        // Comment content
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        const comment = feedback.comments || '';
        const lines = pdf.splitTextToSize(`"${comment}"`, pageWidth - (margin * 2) - 14);
        lines.slice(0, 2).forEach((line: string) => {
          pdf.text(line, margin + 8, commentCardY + 10);
        });
      });
    }

    // Footer on both pages
    const footerHeight = 15;
    
    // Page 1 footer
    pdf.setPage(1);
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 1 of 2', pageWidth - margin - 15, pageHeight - 10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2 - 25, pageHeight - 10);
    
    // Page 2 footer
    pdf.setPage(2);
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thesis Repository Management System', margin, pageHeight - 10);
    pdf.text('Page 2 of 2', pageWidth - margin - 15, pageHeight - 10);
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

// Helper function to draw a star shape
function drawStar(pdf: any, x: number, y: number, size: number, half = false, outline = false) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size / 2;
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  
  let path = [];
  path.push({x: x, y: y - outerRadius});
  
  for (let i = 0; i < spikes; i++) {
    let xOuter = x + Math.cos(rot) * outerRadius;
    let yOuter = y + Math.sin(rot) * outerRadius;
    
    if (half && i === 0) {
      // For half star, adjust the first point
      xOuter = x;
      yOuter = y - outerRadius;
    }
    
    path.push({x: xOuter, y: yOuter});
    rot += step;
    
    let xInner = x + Math.cos(rot) * innerRadius;
    let yInner = y + Math.sin(rot) * innerRadius;
    
    path.push({x: xInner, y: yInner});
    rot += step;
  }
  
  path.push({x: x, y: y - outerRadius});
  
  if (outline) {
    pdf.setDrawColor(...[107, 114, 128]);
    pdf.setLineWidth(0.5);
    for (let i = 0; i < path.length - 1; i++) {
      pdf.line(path[i].x, path[i].y, path[i+1].x, path[i+1].y);
    }
  } else {
    // Draw filled star
    for (let i = 0; i < path.length - 1; i++) {
      pdf.triangle(
        path[i].x, path[i].y,
        path[i+1].x, path[i+1].y,
        x, y, 'F'
      );
    }
  }
}