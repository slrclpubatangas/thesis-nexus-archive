import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StudentRecord } from '../StudentData';

interface NewStudentData {
  student_no: string;
  full_name: string;
  course_section: string;
  email: string;
  school_year: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStudent: NewStudentData) => Promise<void>;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<NewStudentData>({
    student_no: '',
    full_name: '',
    course_section: '',
    email: '',
    school_year: `${currentYear}-${currentYear + 1}`,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        student_no: '',
        full_name: '',
        course_section: '',
        email: '',
        school_year: `${currentYear}-${currentYear + 1}`,
      });
    }
  }, [isOpen, currentYear]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.student_no.trim()) {
      alert('Student Number is required.');
      return;
    }

    if (!formData.full_name.trim()) {
      alert('Full Name is required.');
      return;
    }

    if (!formData.course_section.trim()) {
      alert('Course and Section is required.');
      return;
    }

    if (!formData.email.trim()) {
      alert('Email is required.');
      return;
    }

    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!formData.school_year.trim()) {
      alert('School Year is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_no">Student Number *</Label>
            <Input
              id="student_no"
              name="student_no"
              value={formData.student_no}
              onChange={handleInputChange}
              required
              placeholder="Enter student number (e.g., 2021-00001)"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              placeholder="Enter full name"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_section">Course and Section *</Label>
            <Input
              id="course_section"
              name="course_section"
              value={formData.course_section}
              onChange={handleInputChange}
              required
              placeholder="Enter course and section (e.g., BSIT-3A)"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school_year">School Year *</Label>
            <Input
              id="school_year"
              name="school_year"
              value={formData.school_year}
              onChange={handleInputChange}
              required
              placeholder="Enter school year (e.g., 2024-2025)"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Student'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentModal;
