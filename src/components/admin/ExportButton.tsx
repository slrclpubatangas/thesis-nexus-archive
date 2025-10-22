
import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { exportStatisticsToPDF } from '../../utils/pdfExport';

interface StatsData {
  totalSubmissions: number;
  totalUsers: number;
  recentSubmissions: number;
  lpuStudents: number;
  nonLpuStudents: number;
  campusData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; submissions: number }>;
  popularPrograms: Array<{ name: string; count: number; percentage: number }>;
  programsByDegree: Array<{ name: string; count: number; percentage: number }>;
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

interface ExportButtonProps {
  stats: StatsData;
  selectedYear: string;
  dateRange: { start: string; end: string };
  disabled?: boolean;
  onRefresh?: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  stats, 
  selectedYear, 
  dateRange, 
  disabled = false, 
  onRefresh
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (disabled || stats.totalSubmissions === 0) {
      toast({
        title: "Export Not Available",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const result = await exportStatisticsToPDF(stats, selectedYear, dateRange);
      
      toast({
        title: "Export Successful",
        description: `Statistics exported to ${result.fileName}`,
      });
      //refresh statistics immediately
      onRefresh?.();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || stats.totalSubmissions === 0}
      variant="outline"
      className="flex items-center space-x-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <FileText className="h-4 w-4" />
      <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
    </Button>
  );
};

export default ExportButton;


