import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { StudentRecord } from '../StudentData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  onSave: (updated: StudentRecord) => void;
}

const EditStudentModal: React.FC<Props> = ({ isOpen, onClose, student, onSave }) => {
  const [form, setForm] = useState<StudentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(student);
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        {form ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Student#</label>
              <input className="input-field" value={form.student_no} name="student_no" disabled />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input className="input-field" value={form.full_name} name="full_name" onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Course and Section</label>
              <input className="input-field" value={form.course_section} name="course_section" onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" value={form.email} name="email" onChange={handleChange} required />
            </div>
            <div>
              <label className="label">School Year</label>
              <input className="input-field" value={form.school_year} name="school_year" onChange={handleChange} required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div className="text-gray-500">No student selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentModal;
