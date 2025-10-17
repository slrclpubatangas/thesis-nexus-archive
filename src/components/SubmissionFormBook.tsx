import React, { useState } from 'react';
import { FileText, Users, School, BookOpen, ArrowRight, UserPlus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import ThesisTitleSearch from './ThesisTitleSearch';
import FeedbackModal from './FeedbackModal';
import styles from './SubmissionForm.module.css';

const SubmissionFormBook = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    school: '',
    campus: '',
    program: '',
    thesisTitle: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);

  const [studentValidation, setStudentValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
    nameValid: boolean | null;
    nameMessage: string;
    expectedName: string | null;
  }>({
    isValidating: false,
    isValid: null,
    message: '',
    nameValid: null,
    nameMessage: '',
    expectedName: null,
  });

  const { toast } = useToast();

  const campusOptions = ['LIMA Campus', 'Main Campus', 'Riverside Campus'];
  const programOptions = [
    'Computer Science',
    'Information Technology',
    'Engineering',
    'Business Administration',
    'Psychology',
    'Education',
    'Nursing',
    'Accountancy',
  ];

  /* ---------- page-flip helpers ---------- */
  const handleFlipToLPU = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleFlipToNonLPU = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => setIsAnimating(false), 600);
  };

  /* ---------- field handler ---------- */
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // LPU validation
    if (isFlipped && field === 'studentNumber' && value.trim()) {
      validateStudentNumber(value.trim(), formData.fullName.trim());
    }
  };

  /* ---------- LPU student validation ---------- */
  const validateStudentNumber = async (studentNumber: string, studentName = '') => {
    setStudentValidation((v) => ({ ...v, isValidating: true }));

    try {
      const { data } = await supabase.rpc('validate_lpu_student', {
        student_num: studentNumber,
      });

      if (data === true) {
        setStudentValidation({
          isValidating: false,
          isValid: true,
          message: '✓ Student number verified',
          nameValid: null,
          nameMessage: '',
          expectedName: null,
        });
      } else {
        setStudentValidation({
          isValidating: false,
          isValid: false,
          message: '⚠ Student number not found',
          nameValid: null,
          nameMessage: '',
          expectedName: null,
        });
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  /* ---------- form submission ---------- */
  const handleSubmit = async (e: React.FormEvent, type: 'lpu' | 'non-lpu') => {
    e.preventDefault();

    if (type === 'lpu' && studentValidation.isValid !== true) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid student number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        full_name: formData.fullName,
        user_type: type === 'lpu' ? 'LPU Student' : 'Non-LPU Student',
        student_number: type === 'lpu' ? formData.studentNumber : null,
        school: type === 'non-lpu' ? formData.school : null,
        campus: formData.campus,
        program: type === 'lpu' ? formData.program : null,
        thesis_title: formData.thesisTitle,
        submission_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('thesis_submissions')
        .insert([submissionData])
        .select('id')
        .single();

      if (error) throw error;

      if (data) setLastSubmissionId(data.id);
      setShowFeedbackModal(true);
      toast({
        title: 'Record Submitted',
        description: 'Your thesis record has been successfully submitted.',
      });
    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your record.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- feedback ---------- */
  const handleFeedbackSubmit = async (feedback: { rating: number; comments: string }) => {
    if (!lastSubmissionId) return;

    try {
      await supabase.from('feedback').insert({
        submission_id: lastSubmissionId,
        rating: feedback.rating,
        comments: feedback.comments,
      });
      toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback!' });
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setShowFeedbackModal(false);
      resetForm();
    }
  };

  /* ---------- reset ---------- */
  const resetForm = () => {
    setFormData({
      fullName: '',
      studentNumber: '',
      school: '',
      campus: '',
      program: '',
      thesisTitle: '',
    });
    setStudentValidation({
      isValidating: false,
      isValid: null,
      message: '',
      nameValid: null,
      nameMessage: '',
      expectedName: null,
    });
  };

  /* ========================================================= */
  /* ========================  JSX  ========================= */
  /* ========================================================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ---- header ---- */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <BookOpen className="h-8 w-8 text-red-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Daily Record of User of the SLRC Research Collection
            </h2>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 mx-auto rounded-full" />
        </div>

        {/* ---- book container ---- */}
        <div className={styles.bookContainer}>
          <div className={styles.bookWrapper}>
            {/*  LEFT  –  Non-LPU  */}
            <div
              className={`${styles.formPage} ${styles.leftForm} ${
                !isFlipped ? styles.showFormContent : ''
              }`}
            >
              <div className={styles.formContent}>
                <h2 className="text-xl font-bold mb-4 text-center">Non-LPU Student Submission</h2>

                <form onSubmit={(e) => handleSubmit(e, 'non-lpu')} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Name of School *</label>
                    <input
                      type="text"
                      value={formData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      placeholder="Enter your school name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Campus *</label>
                    <select
                      value={formData.campus}
                      onChange={(e) => handleInputChange('campus', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      required
                    >
                      <option value="">Select Campus</option>
                      {campusOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title of Thesis *</label>
                    <ThesisTitleSearch
                      value={formData.thesisTitle}
                      onChange={(v) => handleInputChange('thesisTitle', v)}
                      placeholder="Type to search existing thesis titles..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Non-LPU Record'}
                  </button>
                </form>
              </div>
            </div>

            {/*  CENTRE FLIPPING CARD  */}
            <div className={`${styles.flipPage} ${isFlipped ? styles.flipToRight : ''}`}>
              {/* front – non-LPU greeting */}
              <div className={`${styles.pageContent} ${styles.flipPageFront}`}>
                <div className={styles.content}>
                  <div className={styles.welcomeContent}>
                    <UserPlus size={60} className="mx-auto mb-4 text-white" />
                    <h1>Hello, friend!</h1>
                    <p>Enter your details as NON-LPU student</p>
                    <button
                      onClick={handleFlipToLPU}
                      className={styles.submitButton}
                      disabled={isAnimating}
                    >
                      <Users size={20} />
                      Submit as LPU Student
                    </button>
                  </div>
                </div>
              </div>

              {/* back – LPU greeting */}
              <div className={`${styles.pageContent} ${styles.flipPageBack}`}>
                <div className={styles.content}>
                  <div className={styles.welcomeContent}>
                    <ArrowRight size={60} className="mx-auto mb-4 text-white" />
                    <h1>Welcome Back!</h1>
                    <p>Enter your details as LPU student</p>
                    <button
                      onClick={handleFlipToNonLPU}
                      className={styles.submitButton}
                      disabled={isAnimating}
                    >
                      <School size={20} />
                      Submit as NON-LPU Student
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/*  RIGHT  –  LPU  */}
            <div
              className={`${styles.formPage} ${styles.rightForm} ${
                isFlipped ? styles.showFormContent : ''
              }`}
            >
              <div className={styles.formContent}>
                <h2 className="text-xl font-bold mb-4 text-center">LPU Student Submission</h2>

                {/*  MISSING <form>  ADDED HERE  */}
                <form onSubmit={(e) => handleSubmit(e, 'lpu')} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Student Number *</label>
                    <input
                      type="text"
                      value={formData.studentNumber}
                      onChange={(e) => handleInputChange('studentNumber', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200"
                      placeholder="Enter student number (8-digits)"
                      required
                    />
                    {studentValidation.message && (
                      <p
                        className={`text-sm mt-1 ${
                          studentValidation.isValid ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {studentValidation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Program/Course *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => handleInputChange('program', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200"
                      required
                    >
                      <option value="">Select Program/Course</option>
                      {programOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Campus *</label>
                    <select
                      value={formData.campus}
                      onChange={(e) => handleInputChange('campus', e.target.value)}
                      className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200"
                      required
                    >
                      <option value="">Select Campus</option>
                      {campusOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title of Thesis *</label>
                    <ThesisTitleSearch
                      value={formData.thesisTitle}
                      onChange={(v) => handleInputChange('thesisTitle', v)}
                      placeholder="Type to search existing thesis titles..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit LPU Record'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- feedback modal ---- */}
      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default SubmissionFormBook;