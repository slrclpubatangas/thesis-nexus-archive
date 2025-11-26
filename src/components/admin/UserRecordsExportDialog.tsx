import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';
import { exportUserRecordsToPDF } from '../../utils/userRecordsPdfExport';

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
  created_at: string;
}

interface Column {
  key: keyof ThesisSubmission;
  label: string;
  enabled: boolean;
}

interface UserRecordsExportDialogProps {
  records: ThesisSubmission[];
  disabled?: boolean;
}

// 1. Parse safely, return a Date or null
const safeDate = (d: string | null | undefined): Date | null => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};

// 2. Format helpers
const formatTimeCreated = (d: string | null | undefined) =>
  safeDate(d)?.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) ?? (d || 'N/A');

const formatSubmissionDate = (d: string | null | undefined) =>
  safeDate(d)?.toLocaleDateString() ?? (d || 'N/A');

const UserRecordsExportDialog: React.FC<UserRecordsExportDialogProps> = ({
  records,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const [columns, setColumns] = useState<Column[]>([
    { key: 'full_name', label: 'Name', enabled: true },
    { key: 'user_type', label: 'User Type', enabled: true },
    { key: 'student_number', label: 'Student Number', enabled: true },
    { key: 'school', label: 'School', enabled: true },
    { key: 'campus', label: 'Campus', enabled: true },
    { key: 'program', label: 'Program', enabled: true },
    { key: 'thesis_title', label: 'Thesis Title', enabled: true },
    { key: 'submission_date', label: 'Submission Date', enabled: true },
    { key: 'created_at', label: 'Time Created', enabled: true },
  ]);

  const handleColumnToggle = (index: number) =>
    setColumns(prev =>
      prev.map((col, i) =>
        i === index ? { ...col, enabled: !col.enabled } : col
      )
    );

  const handleSelectAll = () => {
    const allEnabled = columns.every(col => col.enabled);
    setColumns(prev => prev.map(col => ({ ...col, enabled: !allEnabled })));
  };

  



  const handleExport = async () => {
    if (records.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no records to export.',
        variant: 'destructive',
      });
      return;
    }

    const enabledColumns = columns.filter(col => col.enabled);
    if (enabledColumns.length === 0) {
      toast({
        title: 'No Columns Selected',
        description: 'Please select at least one column to export.',
        variant: 'destructive',
      });
      return;
    }

    // inside handleExport(...)
setIsExporting(true);
try {
  if (exportFormat === 'csv') {
    const processedRecords = records.map(r => ({
      ...r,
      created_at: formatTimeCreated(r.created_at),
      submission_date: formatSubmissionDate(r.submission_date),
    }));
    await exportToCSV(processedRecords, enabledColumns);
  } else {
    // PDF gets raw ISO strings
    await exportUserRecordsToPDF(records, enabledColumns);
  }
  toast({ title: 'Export Successful', description: `Records exported to ${exportFormat.toUpperCase()} successfully.` });
  setIsOpen(false);
} finally {
  setIsExporting(false);
}
  };

  const exportToCSV = async (data: ThesisSubmission[], selectedColumns: Column[]) => {
    const headers = selectedColumns.map(col => col.label);
    const csvContent = [
      headers.join(','),
      ...data.map(record =>
        selectedColumns
          .map(col => {
            const value = record[col.key] as string | null | undefined;
            return `"${value ?? ''}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-records-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const enabledCount = columns.filter(col => col.enabled).length;
  const allEnabled = columns.every(col => col.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || records.length === 0}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Records</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export User Records</span>
          </DialogTitle>
          <DialogDescription>
            Choose your export format and select the columns to include in the export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format-select" className="text-sm font-medium">
              Export Format
            </Label>
            <Select
              value={exportFormat}
              onValueChange={(value: 'csv' | 'pdf') => setExportFormat(value)}
            >
              <SelectTrigger id="format-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>CSV (Comma Separated Values)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF (Portable Document Format)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Select Columns ({enabledCount} of {columns.length})
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {allEnabled ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
              {columns.map((column, index) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.key}`}
                    checked={column.enabled}
                    onCheckedChange={() => handleColumnToggle(index)}
                  />
                  <Label
                    htmlFor={`column-${column.key}`}
                    className="text-sm cursor-pointer"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <FileText className="h-4 w-4" />
              <span>
                Ready to export {records.length} records with {enabledCount} columns to{' '}
                {exportFormat.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || enabledCount === 0}
            className="flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export {exportFormat.toUpperCase()}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserRecordsExportDialog;