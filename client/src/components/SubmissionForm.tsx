
import React, { useState } from 'react';
import { FileText, Users, School } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import ThesisTitleSearch from './ThesisTitleSearch';

const SubmissionForm = () => {
  const [userType, setUserType] = useState<'lpu' | 'non-lpu'>('lpu');
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    school: '',
    campus: '',
    program: '',
    thesisTitle: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const campusOptions = [
    'Manila',
    'Batangas',
    'Cavite',
    'Laguna',
    'Makati'
  ];

  const programOptions = [
    'Computer Science',
    'Information Technology',
    'Engineering',
    'Business Administration',
    'Psychology',
    'Education',
    'Nursing',
    'Accountancy'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThesisTitleChange = (value: string) => {
    handleInputChange('thesisTitle', value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        full_name: formData.fullName,
        user_type: userType === 'lpu' ? 'LPU Student' : 'Non-LPU Student',
        student_number: userType === 'lpu' ? formData.studentNumber : null,
        school: userType === 'non-lpu' ? formData.school : null,
        campus: formData.campus,
        program: userType === 'lpu' ? formData.program : null,
        thesis_title: formData.thesisTitle,
        submission_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('thesis_submissions')
        .insert([submissionData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Record Submitted",
        description: "Your thesis record has been successfully submitted.",
      });

      // Reset form
      setFormData({
        fullName: '',
        studentNumber: '',
        school: '',
        campus: '',
        program: '',
        thesisTitle: ''
      });
    } catch (error) {
      console.error('Error submitting record:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card-hover p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FileText className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-gray-800">
                Daily Record of Users
              </h2>
            </div>
            <p className="text-gray-600 text-lg">
              Undergraduate Research Collection
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select User Type:
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="lpu"
                    checked={userType === 'lpu'}
                    onChange={(e) => setUserType(e.target.value as 'lpu' | 'non-lpu')}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <Users className="h-4 w-4 text-red-600" />
                  <span className="text-gray-700">LPU Student</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="non-lpu"
                    checked={userType === 'non-lpu'}
                    onChange={(e) => setUserType(e.target.value as 'lpu' | 'non-lpu')}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <School className="h-4 w-4 text-red-600" />
                  <span className="text-gray-700">Non-LPU Student</span>
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Student Number or School */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === 'lpu' ? 'Student Number' : 'Name of School'}
                </label>
                <input
                  type="text"
                  value={userType === 'lpu' ? formData.studentNumber : formData.school}
                  onChange={(e) => handleInputChange(
                    userType === 'lpu' ? 'studentNumber' : 'school', 
                    e.target.value
                  )}
                  className="input-field"
                  required
                />
              </div>

              {/* Campus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus
                </label>
                <select
                  value={formData.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">Select Campus</option>
                  {campusOptions.map(campus => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>

              {/* Program/Department */}
              {userType === 'lpu' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program/Department
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => handleInputChange('program', e.target.value)}
                    className="select-field"
                    required
                  >
                    <option value="">Select Program/Department</option>
                    {programOptions.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Thesis Title with Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title of Thesis
              </label>
              <ThesisTitleSearch
                value={formData.thesisTitle}
                onChange={handleThesisTitleChange}
                placeholder="Type to search existing thesis titles..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Start typing to search for existing thesis titles or enter a new one.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={20} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Record'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
