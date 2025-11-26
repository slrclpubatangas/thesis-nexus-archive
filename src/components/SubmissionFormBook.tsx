import React, { useState, useRef, useEffect } from 'react';
import { FileText, Users, School, BookOpen, ArrowRight, UserPlus, ChevronDown, Plus, Minus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import ThesisTitleSearch from './ThesisTitleSearch';
import FeedbackModal from './FeedbackModal';
import styles from './SubmissionForm.module.css';

// Terms and Conditions Modal Component
const TermsAndConditionsModal = ({ onAgree, onDisagree }: { onAgree: () => void; onDisagree: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-r from-red-500 to-blue-500 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Terms and Conditions</h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="font-semibold text-lg mb-4 text-center">DATA PRIVACY CONSENT</h3>

          <p className="mb-6 text-sm leading-relaxed">
            I hereby declare that by signing:
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <span className="font-semibold text-sm flex-shrink-0">1.</span>
              <p className="text-sm leading-relaxed">
                I attest that the information I have written is true and correct to the best of my personal knowledge;
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-sm flex-shrink-0">2.</span>
              <p className="text-sm leading-relaxed">
                I signify my consent to the collection, use, recording, storing, organizing, consolidation, updating, processing, access to transfer, disclosure or data sharing of my personal and sensitive personal information that I provided to LPU-B including its sister schools/universities, industry partners, affiliates, external providers, local and foreign authorities regardless of their location and/or registration for the purposes for which it was collected and such other lawful purposes I consent to or as required or permitted by law;
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-sm flex-shrink-0">3.</span>
              <p className="text-sm leading-relaxed">
                I understand that upon my written request and subject to designated office hours of the LPU-B, I will be provided with the reasonable access to my personal information provided to LPU-B to verify the accuracy and completeness of my information and request for its amendment, if deemed appropriate, and;
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-sm flex-shrink-0">4.</span>
              <p className="text-sm leading-relaxed">
                I am fully aware that the consent or permission I am giving in favor of LPU-B shall be effective immediately upon signing of this form and shall continue unless I revoke the same in writing. Sixty working days upon receipt of the written revocation, LPU-B shall immediately cease from performing the acts mentioned under paragraph 2 herein concerning my personal and sensitive personal information.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Date: <span className="font-normal text-gray-600">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onDisagree}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Disagree
          </button>
          <button
            onClick={onAgree}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Agree
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SubmissionFormBook = () => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const programsStructure = [
    {
      category: 'UNDERGRADUATE PROGRAMS',
      departments: [
        {
          name: 'Lyceum International Maritime Academy',
          courses: [
            'BS Marine Transportation',
            'BS Marine Engineering'
          ]
        },
        {
          name: 'College of Computing, Arts and Sciences',
          courses: [
            'AB Communication',
            'AB Psychology',
            'BS Psychology',
            'Bachelor of Multimedia Arts',
            'BS Computer Science',
            'BS Cybersecurity',
            'BS Information Technology'
          ]
        },
        {
          name: 'College of Allied Medical Professions',
          courses: [
            'BS Biology Major in Medical Biology',
            'BS Medical Laboratory Science',
            'BS Pharmacy',
            'BS Physical Therapy',
            'BS Radiologic Technology',
            'Diploma in Pharmacy Assisting',
            'Diploma in Phlebotomy'
          ]
        },
        {
          name: 'College of Nursing',
          courses: [
            'BS Nursing'
          ]
        },
        {
          name: 'College of Business Administration',
          courses: [
            'BS Accountancy',
            'BS Business Administration',
            'BS Customs Administration'
          ]
        },
        {
          name: 'College of International Tourism & Hospitality Management',
          courses: [
            'BS International Tourism Management',
            'BS International Hospitality Management',
            'Associate in International Tourism Management'
          ]
        },
        {
          name: 'College of Criminal Justice Education',
          courses: [
            'BS Criminology',
            'Bachelor of Forensic Science',
            'Double Degree for Criminology and Forensic Science',
            'Straight Program BS Criminology to Master of Science in Criminal Justice with specialization in Criminology'
          ]
        },
        {
          name: 'College of Dentistry',
          courses: [
            'Doctor of Dental Medicine'
          ]
        },
        {
          name: 'Expanded Tertiary Education Equivalency and Accreditation Program',
          courses: [
            'Bachelor of Science in Business Administration',
            'Bachelor of Science in Criminology',
            'Bachelor of Science in Information Technology',
            'Bachelor of Science in International Hospitality Management',
            'Bachelor of Science in Nursing'
          ]
        },
        {
          name: 'Center for Technical Education and Lifelong Learning',
          courses: [
            'Certificate in Culinary Arts',
            'Certificate in Pastry Arts'
          ]
        }
      ]
    },
    {
      category: 'GRADUATE SCHOOL PROGRAMS',
      departments: [
        {
          name: 'Business Management',
          courses: [
            'PhD in Management',
            'Master in Business Administration'
          ]
        },
        {
          name: 'Hospitality',
          courses: [
            'PhD in International Hospitality and Tourism Management',
            'Master in International Hospitality and Tourism Management'
          ]
        },
        {
          name: 'Humanities & Social Sciences',
          courses: [
            'Doctor of Public Administration',
            'PhD in Criminal Justice with specialization in Criminology',
            'PhD in English Language Studies',
            'PhD in Management with specialization in Education',
            'PhD in Psychology',
            'Master in Public Administration',
            'Master of Arts in Educational Leadership and Management',
            'Master of Arts in English Language Studies',
            'Master of Arts in Psychology',
            'Master of Science in Criminal Justice with specialization in Criminology',
            'Straight Master to Phd in Criminal Justice with specialization in Criminology'
          ]
        },
        {
          name: 'Maritime',
          courses: [
            'Master in Maritime Education and Training'
          ]
        },
        {
          name: 'Engineering & Technology',
          courses: [
            'Master of Science in Information Technology'
          ]
        },
        {
          name: 'Health Sciences',
          courses: [
            'Master of Arts in Nursing',
            'Master of Science in Medical Laboratory Science'
          ]
        }
      ]
    }
  ];

  /* ---------- cascading dropdown state ---------- */
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProgramDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const toggleDepartment = (deptName: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptName)) {
      newExpanded.delete(deptName);
    } else {
      newExpanded.add(deptName);
    }
    setExpandedDepartments(newExpanded);
  };

  const selectCourse = (course: string) => {
    handleInputChange('program', course);
    setShowProgramDropdown(false);
    setExpandedCategory(null);
    setExpandedDepartments(new Set());
  };

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

    // LPU validation - validate when either name or student number changes
    if (isFlipped && (field === 'fullName' || field === 'studentNumber')) {
      const studentNumber = field === 'studentNumber' ? value.trim() : formData.studentNumber.trim();
      const fullName = field === 'fullName' ? value.trim() : formData.fullName.trim();

      // Only validate if both fields have values
      if (studentNumber && fullName) {
        validateStudentNumber(studentNumber, fullName);
      } else {
        // Reset validation if either field is empty
        setStudentValidation({
          isValidating: false,
          isValid: null,
          message: '',
          nameValid: null,
          nameMessage: '',
          expectedName: null,
        });
      }
    }
  };

  /* ---------- LPU student validation ---------- */
  const validateStudentNumber = async (studentNumber: string, studentName: string) => {
    setStudentValidation((v) => ({ ...v, isValidating: true }));

    try {
      // Use the validate_lpu_student_with_name function to check both name and number
      const { data, error } = await supabase.rpc('validate_lpu_student_with_name', {
        student_num: studentNumber,
        student_name: studentName,
      });

      if (error) {
        console.error('Validation error:', error);
        setStudentValidation({
          isValidating: false,
          isValid: false,
          message: '⚠ Error validating student information',
          nameValid: false,
          nameMessage: '',
          expectedName: null,
        });
        return;
      }

      // The function returns a JSONB object with a 'valid' property
      if (data && data.valid === true) {
        setStudentValidation({
          isValidating: false,
          isValid: true,
          message: '✓ Student name and number verified',
          nameValid: true,
          nameMessage: '',
          expectedName: null,
        });
      } else {
        // Show the error message from the database function or a default message
        const errorMessage = data?.message || 'Name and student number do not match our records';
        const expectedName = data?.expected_name || null;

        setStudentValidation({
          isValidating: false,
          isValid: false,
          message: `⚠ ${errorMessage}`,
          nameValid: false,
          nameMessage: '',
          expectedName: expectedName,
        });
      }
    } catch (err) {
      console.error('Validation error:', err);
      setStudentValidation({
        isValidating: false,
        isValid: false,
        message: '⚠ Error validating student information',
        nameValid: false,
        nameMessage: '',
        expectedName: null,
      });
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
      // Navigate to landing page after feedback submission
      navigate('/');
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

  /* ---------- terms handlers ---------- */
  const handleTermsAgree = () => {
    setTermsAccepted(true);
  };

  const handleTermsDisagree = () => {
    navigate('/');
  };

  /* ========================================================= */
  /* ========================  JSX  ========================= */
  /* ========================================================= */
  return (
    <>
      {!termsAccepted && (
        <TermsAndConditionsModal
          onAgree={handleTermsAgree}
          onDisagree={handleTermsDisagree}
        />
      )}

      {termsAccepted && (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-blue-50 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.5,
              ease: "easeOut",
              when: "beforeChildren",
              staggerChildren: 0.1
            }
          }}
          exit={{
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 }
          }}
        >
          <div className="max-w-6xl mx-auto px-4">
            {/* ---- header ---- */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <BookOpen className="h-8 w-8 text-red-600" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Daily Record of Users of the SLRC Research Collection
                </h2>
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 mx-auto rounded-full" />
            </motion.div>

            {/* ---- book container ---- */}
            <motion.div
              className={styles.bookContainer}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            >
              <div className={styles.bookWrapper}>
                {/*  LEFT  –  Non-LPU  */}
                <div
                  className={`${styles.formPage} ${styles.leftForm} ${!isFlipped ? styles.showFormContent : ''
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
                          placeholder="Enter your full name (e.g., Juan A. Dela Cruz)"
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
                          placeholder="Enter your university name (e.g., Westbridge State University)"
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
                        {isSubmitting ? 'Submitting...' : 'Submit Record'}
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
                        <p>Are you an LPU student?</p>
                        <button
                          onClick={handleFlipToLPU}
                          className={styles.submitButton}
                          disabled={isAnimating}
                        >
                          <Users size={20} />
                          CLICK HERE!
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
                        <p>Are you NON-LPU student?</p>
                        <button
                          onClick={handleFlipToNonLPU}
                          className={styles.submitButton}
                          disabled={isAnimating}
                        >
                          <School size={20} />
                          CLICK HERE!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/*  RIGHT  –  LPU  */}
                <div
                  className={`${styles.formPage} ${styles.rightForm} ${isFlipped ? styles.showFormContent : ''
                    }`}
                >
                  <div className={styles.formContent}>
                    <h2 className="text-xl font-bold mb-4 text-center">LPU Student Submission</h2>

                    <form onSubmit={(e) => handleSubmit(e, 'lpu')} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200"
                          placeholder="Enter your full name (e.g., Juan A. Dela Cruz)"
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
                            className={`text-sm mt-1 ${studentValidation.isValid ? 'text-green-600' : 'text-red-600'
                              }`}
                          >
                            {studentValidation.message}
                          </p>
                        )}
                      </div>

                      <div ref={dropdownRef}>
                        <label className="block text-sm font-medium mb-1">Program/Course *</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowProgramDropdown(!showProgramDropdown)}
                            className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 text-left flex items-center justify-between bg-white"
                          >
                            <span className={formData.program ? 'text-gray-900' : 'text-gray-400'}>
                              {formData.program || 'Select Program/Course'}
                            </span>
                            <ChevronDown className={`h-5 w-5 transition-transform ${showProgramDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {showProgramDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                              {programsStructure.map((categoryData) => (
                                <div key={categoryData.category}>
                                  {/* Category Header */}
                                  <button
                                    type="button"
                                    onClick={() => toggleCategory(categoryData.category)}
                                    className="w-full px-4 py-3 text-left font-semibold bg-red-50 hover:bg-red-100 border-b border-gray-200 flex items-center justify-between"
                                  >
                                    <span className="text-red-700">{categoryData.category}</span>
                                    <ChevronDown className={`h-5 w-5 text-red-700 transition-transform ${expandedCategory === categoryData.category ? 'rotate-180' : ''}`} />
                                  </button>

                                  {/* Departments */}
                                  {expandedCategory === categoryData.category && (
                                    <div>
                                      {categoryData.departments.map((dept) => (
                                        <div key={dept.name}>
                                          {/* Department Header */}
                                          <button
                                            type="button"
                                            onClick={() => toggleDepartment(dept.name)}
                                            className="w-full px-6 py-2.5 text-left text-sm font-medium bg-gray-50 hover:bg-gray-100 border-b border-gray-100 flex items-center justify-between"
                                          >
                                            <span className="text-gray-700">{dept.name}</span>
                                            {expandedDepartments.has(dept.name) ? (
                                              <Minus className="h-4 w-4 text-gray-600" />
                                            ) : (
                                              <Plus className="h-4 w-4 text-gray-600" />
                                            )}
                                          </button>

                                          {/* Courses */}
                                          {expandedDepartments.has(dept.name) && (
                                            <div className="bg-white">
                                              {dept.courses.map((course) => (
                                                <button
                                                  key={course}
                                                  type="button"
                                                  onClick={() => selectCourse(course)}
                                                  className="w-full px-10 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-50 text-gray-600 hover:text-blue-700"
                                                >
                                                  {course}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
                        className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Record'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ---- feedback modal ---- */}
          {showFeedbackModal && (
            <FeedbackModal
              onClose={() => setShowFeedbackModal(false)}
              onSubmit={handleFeedbackSubmit}
            />
          )}
        </motion.div>
      )}
    </>
  );
};

export default SubmissionFormBook;