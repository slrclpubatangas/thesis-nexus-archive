import React, { useMemo, useState } from 'react';
import { Plus, Search, Upload, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import StudentCSVUploadSection from './student/CSVUploadSection';
import StudentDataTable from './student/StudentDataTable';
import EditStudentModal from './student/EditStudentModal';
import DeleteStudentModal from './student/DeleteStudentModal';

export interface StudentRecord {
  student_no: string; // Primary Key
  full_name: string;
  course_section: string; // e.g., BSIT-3A
  email: string;
  school_year: string; // e.g., 2024-2025
  created_at?: string;
  updated_at?: string;
}

const StudentData: React.FC = () => {
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof StudentRecord>('student_no');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { queryWithAuth, mutateWithAuth, supabase } = useSupabaseAuth();

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['student-data'],
    queryFn: async () => {
      const data = await queryWithAuth(
        supabase.from('students').select('*').order('updated_at', { ascending: false }),
        { showErrorToast: false }
      );
      return data || [];
    },
    refetchOnWindowFocus: true,
    retry: (failureCount, err: any) => {
      if (err?.message?.includes('JWT') || err?.status === 401) return false;
      return failureCount < 3;
    },
    throwOnError: false,
  });

  if (error && !isLoading) {
    console.error('Error fetching student data:', error);
    toast({ title: 'Error', description: 'Failed to fetch student data. Please refresh the page.', variant: 'destructive' });
  }

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let rows = students as StudentRecord[];
    if (term) {
      rows = rows.filter((r) =>
        r.student_no.toLowerCase().includes(term) ||
        r.full_name.toLowerCase().includes(term) ||
        r.course_section.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.school_year.toLowerCase().includes(term)
      );
    }
    if (courseFilter) rows = rows.filter((r) => r.course_section === courseFilter);
    if (yearFilter) rows = rows.filter((r) => r.school_year === yearFilter);

    return rows
      .slice()
      .sort((a, b) => {
        const av = (a[sortKey] ?? '') as any;
        const bv = (b[sortKey] ?? '') as any;
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [students, searchTerm, courseFilter, yearFilter, sortKey, sortDir]);

  const handleUploadSuccess = (recordCount: number) => {
    toast({ title: 'Upload Successful', description: `Successfully uploaded ${recordCount} student records.` });
    queryClient.invalidateQueries({ queryKey: ['student-data'] });
    setActiveView('manage');
  };

  const handleUploadError = (message: string) => {
    toast({ title: 'Upload Failed', description: message, variant: 'destructive' });
  };

  const distinctCourses = useMemo(
    () => Array.from(new Set((students as StudentRecord[]).map((s) => s.course_section))).sort(),
    [students]
  );
  const distinctYears = useMemo(
    () => Array.from(new Set((students as StudentRecord[]).map((s) => s.school_year))).sort(),
    [students]
  );

  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<StudentRecord | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const onEdit = (student: StudentRecord) => {
    setEditing(student);
    setIsEditOpen(true);
  };

  const onDelete = (student: StudentRecord) => {
    setDeleting(student);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async (updated: StudentRecord) => {
    try {
      await mutateWithAuth(
        supabase
          .from('students')
          .update({
            full_name: updated.full_name,
            course_section: updated.course_section,
            email: updated.email,
            school_year: updated.school_year,
          })
          .eq('student_no', updated.student_no),
        {
          onError: (err) => {
            console.error('Error updating student:', err);
            toast({ title: 'Error', description: 'Failed to update student record.', variant: 'destructive' });
          },
        }
      );
      toast({ title: 'Success', description: 'Student record updated successfully.' });
      setIsEditOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['student-data'] });
    } catch (e) {
      console.error('Update student operation failed:', e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await mutateWithAuth(
        supabase.from('students').delete().eq('student_no', deleting.student_no),
        {
          onError: (err) => {
            console.error('Error deleting student:', err);
            toast({ title: 'Error', description: 'Failed to delete student record.', variant: 'destructive' });
          },
        }
      );
      toast({ title: 'Success', description: 'Student record deleted successfully.' });
      setIsDeleteOpen(false);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['student-data'] });
    } catch (e) {
      console.error('Delete student operation failed:', e);
    }
  };

  const toggleSort = (key: keyof StudentRecord) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Student Data Management</h2>
          <p className="text-gray-600">Upload and manage student records</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'upload' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'manage' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manage Data
          </button>
        </div>
      </div>

      {activeView === 'upload' ? (
        <StudentCSVUploadSection onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Student#, Name, Course, Email, School Year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  className="input-field"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {distinctCourses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select className="input-field" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  <option value="">All Years</option>
                  {distinctYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <StudentDataTable
            students={filtered}
            isLoading={isLoading}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          <EditStudentModal
            isOpen={isEditOpen}
            onClose={() => { setIsEditOpen(false); setEditing(null); }}
            student={editing}
            onSave={handleSaveEdit}
          />

          <DeleteStudentModal
            isOpen={isDeleteOpen}
            onClose={() => { setIsDeleteOpen(false); setDeleting(null); }}
            student={deleting}
            onConfirm={handleConfirmDelete}
          />
        </div>
      )}
    </div>
  );
};

export default StudentData;
