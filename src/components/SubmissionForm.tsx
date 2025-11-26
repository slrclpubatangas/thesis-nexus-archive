import React, { useState, useEffect } from 'react';
import { FileText, Users, School, BookOpen, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import ThesisTitleSearch from './ThesisTitleSearch';
import FeedbackModal from './FeedbackModal';
import styles from './SubmissionForm.module.css';

const SubmissionForm = () => {
  const [pageState, setPageState] = useState<'initial' | 'flipped'>('initial');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    school: '',
    campus: '',
    program: '',
    thesisTitle: ''
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
  }>({ isValidating: false, isValid: null, message: '', nameValid: null, nameMessage: '', expectedName: null });

  const { toast } = useToast();

  const campusOptions = [
    'LIMA Campus',
    'Main Campus',
    'Riverside Campus'
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

  // Handle page flip animations
  const handleFlipToLPU = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationClass('active');

    setTimeout(() => {
      setPageState('flipped');
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass('');
      }, 50);
    }, 600);
  };

  const handleFlipToNonLPU = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationClass('closing');

    setTimeout(() => {
      setPageState('initial');
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass('');
      }, 50);
    }, 600);
  };

  // Floating orbs animation
  const [orbs, setOrbs] = useState<Array<{
    id: number;
    size: number;
    color: string;
    top: number;
    left: number;
    xSpeed: number;
    ySpeed: number;
    opacity: number;
    zIndex: number;
    blur: number;
  }>>([]);

  useEffect(() => {
    // Initialize orbs with random properties
    const colors = [
      'bg-red-200', 'bg-blue-200', 'bg-pink-200',
      'bg-purple-200', 'bg-amber-200', 'bg-emerald-200'
    ];

    const initialOrbs = Array.from({ length: 15 }, (_, i) => {
      const size = Math.random() * 80 + 10; // 10-90px
      return {
        id: i,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        top: Math.random() * 100,
        left: Math.random() * 100,
        xSpeed: (Math.random() - 0.5) * (0.1 + size / 400), // Larger orbs move slower
        ySpeed: (Math.random() - 0.5) * (0.1 + size / 400),
        opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5 opacity
        zIndex: Math.floor(size / 30), // Larger orbs appear behind
        blur: Math.floor(size / 20) // Larger orbs get more blur
      };
    });
    setOrbs(initialOrbs);

    // Animation loop with smoother movement
    let lastTime = 0;
    const animationFrame = requestAnimationFrame(function animate(time) {
      const deltaTime = time - lastTime;
      lastTime = time;

      setOrbs(prevOrbs =>
        prevOrbs.map(orb => {
          let newLeft = orb.left + orb.xSpeed * (deltaTime / 16);
          let newTop = orb.top + orb.ySpeed * (deltaTime / 16);
          let newXSpeed = orb.xSpeed;
          let newYSpeed = orb.ySpeed;

          // Bounce off edges with slight randomness
          if (newLeft <= 0 || newLeft >= 100) {
            newXSpeed *= -1 * (0.9 + Math.random() * 0.2);
          }
          if (newTop <= 0 || newTop >= 100) {
            newYSpeed *= -1 * (0.9 + Math.random() * 0.2);
          }

          // Occasionally change direction slightly
          if (Math.random() > 0.98) {
            newXSpeed *= (0.9 + Math.random() * 0.2);
            newYSpeed *= (0.9 + Math.random() * 0.2);
          }

          return {
            ...orb,
            left: newLeft,
            top: newTop,
            xSpeed: newXSpeed,
            ySpeed: newYSpeed
          };
        })
      );
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate student number and name in real-time for LPU students
    if (field === 'studentNumber' && userType === 'lpu' && value.trim()) {
      validateStudentNumber(value.trim(), formData.fullName.trim());
    } else if (field === 'studentNumber') {
      // Reset validation when field is cleared
      setStudentValidation({ isValidating: false, isValid: null, message: '', nameValid: null, nameMessage: '', expectedName: null });
    }

    // Re-validate when name changes and student number exists
    if (field === 'fullName' && userType === 'lpu' && formData.studentNumber.trim() && value.trim()) {
      validateStudentNumber(formData.studentNumber.trim(), value.trim());
    }
  };

  const validateStudentNumber = async (studentNumber: string, studentName: string = '') => {
    if (!studentNumber.trim()) {
      setStudentValidation({ isValidating: false, isValid: null, message: '', nameValid: null, nameMessage: '', expectedName: null });
      return;
    }

    console.log('🔍 Starting validation for student number:', studentNumber, 'with name:', studentName);
    setStudentValidation(prev => ({ ...prev, isValidating: true, message: 'Validating student information...' }));

    try {
      // Use the enhanced validation function that checks both number and name
      if (studentName.trim()) {
        console.log('📡 Calling validate_lpu_student_with_name...');
        const { data, error } = await supabase.rpc('validate_lpu_student_with_name', {
          student_num: studentNumber,
          student_name: studentName
        });

        console.log('📥 Enhanced validation response:', data, 'Error:', error);

        if (error) {
          console.error('❌ Enhanced validation error:', error);
          // Fall back to basic validation
          return validateBasicStudentNumber(studentNumber);
        }

        if (data && typeof data === 'object') {
          if (data.valid) {
            console.log('✅ Student validation successful with name match');
            setStudentValidation({
              isValidating: false,
              isValid: true,
              message: '✓ Student number and name verified',
              nameValid: true,
              nameMessage: '✓ Name matches student record',
              expectedName: null
            });
          } else {
            console.log('❌ Student validation failed:', data.error);
            let message = '';
            let nameMessage = '';
            let isValid = false;
            let nameValid = false;

            if (data.error === 'student_not_found') {
              message = '⚠️ Student number not found in database. Please contact the administrator to register your student information.';
              nameMessage = '';
            } else if (data.error === 'name_mismatch') {
              message = '✓ Student number found';
              nameMessage = `❌ Name does not match. Please input the correct name.`;
              isValid = true; // Student number is valid
              nameValid = false;
            }

            setStudentValidation({
              isValidating: false,
              isValid: isValid,
              message: message,
              nameValid: nameValid,
              nameMessage: nameMessage,
              expectedName: data.expected_name || null
            });
          }
        } else {
          // Fallback if data format is unexpected
          return validateBasicStudentNumber(studentNumber);
        }
      } else {
        // Only validate student number if no name provided yet
        return validateBasicStudentNumber(studentNumber);
      }
    } catch (error) {
      console.error('❌ Student validation error:', error);
      return validateBasicStudentNumber(studentNumber);
    }
  };

  const validateBasicStudentNumber = async (studentNumber: string) => {
    console.log('🔄 Using basic validation for student number:', studentNumber);

    try {
      const { data, error } = await supabase.rpc('validate_lpu_student', {
        student_num: studentNumber
      });

      if (error) {
        console.error('❌ Basic validation RPC error:', error);
        // Try direct query as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('students')
          .select('student_no, full_name')
          .eq('student_no', studentNumber)
          .single();

        const isValid = !!fallbackData && !fallbackError;
        setStudentValidation({
          isValidating: false,
          isValid: isValid,
          message: isValid
            ? '✓ Student number verified. Enter your full name to complete validation.'
            : '⚠️ Student number not found in database. Please contact the administrator to register your student information.',
          nameValid: null,
          nameMessage: isValid ? 'Please enter your full name to verify identity.' : '',
          expectedName: fallbackData?.full_name || null
        });
        return;
      }

      if (data === true) {
        console.log('✓ Basic student number validation successful');
        setStudentValidation({
          isValidating: false,
          isValid: true,
          message: '✓ Student number verified. Enter your full name to complete validation.',
          nameValid: null,
          nameMessage: 'Please enter your full name to verify identity.',
          expectedName: null
        });
      } else {
        console.log('❌ Student number not found');
        setStudentValidation({
          isValidating: false,
          isValid: false,
          message: '⚠️ Student number not found in database. Please contact the administrator to register your student information.',
          nameValid: null,
          nameMessage: '',
          expectedName: null
        });
      }
    } catch (error) {
      console.error('❌ Basic validation error:', error);
      setStudentValidation({
        isValidating: false,
        isValid: false,
        message: 'Error validating student number. Please try again.',
        nameValid: null,
        nameMessage: '',
        expectedName: null
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      studentNumber: '',
      school: '',
      campus: '',
      program: '',
      thesisTitle: ''
    });
    setUserType('lpu');
    setStudentValidation({ isValidating: false, isValid: null, message: '', nameValid: null, nameMessage: '', expectedName: null });
  };

  const handleFeedbackSubmit = async (feedback: { rating: number; comments: string }) => {
    if (!lastSubmissionId) {
      toast({
        title: "Error",
        description: "Could not submit feedback, submission ID not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('feedback').insert([
        {
          submission_id: lastSubmissionId,
          rating: feedback.rating,
          comments: feedback.comments,
        },
      ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your valuable feedback!",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Feedback Submission Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowFeedbackModal(false);
      resetForm();
    }
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent, type: 'lpu' | 'non-lpu') => {
    e.preventDefault();

    // Additional validation for LPU students
    if (type === 'lpu') {
      if (!formData.studentNumber.trim()) {
        toast({
          title: "Validation Error",
          description: "Student number is required for LPU students.",
          variant: "destructive",
        });
        return;
      }

      // Check if student validation is still in progress
      if (studentValidation.isValidating) {
        toast({
          title: "Please Wait",
          description: "Student number validation is in progress. Please wait.",
          variant: "destructive",
        });
        return;
      }

      // Check if student number is invalid
      if (studentValidation.isValid === false) {
        toast({
          title: "Invalid Student Number",
          description: "Your student number is not registered in the system. Please contact the administrator to register your information before submitting.",
          variant: "destructive",
        });
        return;
      }

      // Check if student name validation failed
      if (studentValidation.nameValid === false) {
        toast({
          title: "Name Validation Failed",
          description: "Your name does not match the name registered with your student number. Please enter the correct name as registered in the system.",
          variant: "destructive",
        });
        return;
      }

      // Check if both student number and name need to be validated
      if (!formData.fullName.trim()) {
        toast({
          title: "Validation Error",
          description: "Full name is required for LPU students.",
          variant: "destructive",
        });
        return;
      }

      // If validation hasn't been performed yet, do it now
      if (studentValidation.isValid === null || (studentValidation.isValid === true && studentValidation.nameValid === null)) {
        await validateStudentNumber(formData.studentNumber.trim(), formData.fullName.trim());
        // Don't proceed with submission, let user see validation result first
        return;
      }

      // Require both student number and name to be valid
      if (studentValidation.isValid !== true || studentValidation.nameValid !== true) {
        toast({
          title: "Validation Required",
          description: "Please ensure both your student number and name are verified before submitting.",
          variant: "destructive",
        });
        return;
      }
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
        submission_date: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('thesis_submissions')
        .insert([submissionData])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setLastSubmissionId(data.id);
      }

      setShowFeedbackModal(true);
      toast({
        title: "Record Submitted",
        description: "Your thesis record has been successfully submitted.",
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-blue-50 py-8 relative overflow-hidden">
      {/* Enhanced Animated Floating Orbs */}
      {orbs.map(orb => (
        <div
          key={orb.id}
          className={`absolute rounded-full ${orb.color} opacity-[${orb.opacity}] blur-[${orb.blur}px]`}
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            top: `${orb.top}%`,
            left: `${orb.left}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: orb.zIndex,
            filter: `blur(${orb.blur}px)`,
            opacity: orb.opacity,
            transition: 'top 0.5s ease-out, left 0.5s ease-out'
          }}
        />
      ))}

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <BookOpen className="h-8 w-8 text-red-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Daily Record of User of the SLRC Research Collection
            </h2>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Book container */}
        <div className={styles.bookContainer}>
          <div className={`${styles.bookWrapper} ${animationClass}`}>

            {/* Left Static Page */}
            <div className={`${styles.pageSection} ${styles.leftPage}`}>
              {pageState === 'initial' ? (
                // Initial state: Welcome message for LPU
                <div className={styles.content}>
                  <div className={styles.welcomeContent}>
                    <div className={styles.welcomeIcon}>
                      <ArrowRight size={48} strokeWidth={2} />
                    </div>
                    <h1>Welcome Back!</h1>
                    <p>To keep connected with us please login with your personal info</p>
                    <button
                      onClick={handleFlipToLPU}
                      className={styles.submitButton}
                      disabled={isAnimating}
                    >
                      <Users size={20} />
                      <span>Submit as LPU Student</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Flipped state: LPU student form
                <div className={styles.formContent}>
                  <h2>LPU Student Submission</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Student Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className={`w-full p-3 border-2 rounded-lg focus:ring-1 transition-all ${formData.fullName.trim() && studentValidation.nameValid !== null
                              ? studentValidation.nameValid === true
                                ? 'border-green-400 focus:border-green-400 focus:ring-green-200'
                                : studentValidation.nameValid === false
                                  ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                                  : 'border-gray-200 focus:border-red-400 focus:ring-red-200'
                              : 'border-gray-200 focus:border-red-400 focus:ring-red-200'
                            }`}
                          placeholder="Enter your first name and last name"
                          required={userType === 'lpu'}
                        />
                        {studentValidation.nameMessage && (
                          <p className={`text-sm mt-1 ${studentValidation.nameValid === true
                              ? 'text-green-600'
                              : studentValidation.nameValid === false
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}>
                            {studentValidation.nameMessage}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Your name must match the name registered with your student number.
                        </p>
                      </div>

                      {/* Student Number */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Student Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.studentNumber}
                            onChange={(e) => handleInputChange('studentNumber', e.target.value)}
                            className={`w-full p-3 border-2 rounded-lg focus:ring-1 transition-all ${formData.studentNumber.trim()
                                ? studentValidation.isValid === true
                                  ? 'border-green-400 focus:border-green-400 focus:ring-green-200'
                                  : studentValidation.isValid === false
                                    ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                                    : 'border-yellow-400 focus:border-yellow-400 focus:ring-yellow-200'
                                : 'border-gray-200 focus:border-red-400 focus:ring-red-200'
                              }`}
                            placeholder="Enter student number (8-digits)"
                            required={userType === 'lpu'}
                          />
                          {studentValidation.isValidating && (
                            <div className="absolute right-3 top-3">
                              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        {studentValidation.message && (
                          <p className={`text-sm mt-1 ${studentValidation.isValid === true
                              ? 'text-green-600'
                              : studentValidation.isValid === false
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}>
                            {studentValidation.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Your student number must be registered in the system to submit a form.
                        </p>
                      </div>

                      {/* Campus */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Campus <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.campus}
                          onChange={(e) => handleInputChange('campus', e.target.value)}
                          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                          required={userType === 'lpu'}
                        >
                          <option value="">Select Campus</option>
                          {campusOptions.map(campus => (
                            <option key={campus} value={campus}>{campus}</option>
                          ))}
                        </select>
                      </div>

                      {/* Program/Department */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Program/Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.program}
                          onChange={(e) => handleInputChange('program', e.target.value)}
                          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                          required={userType === 'lpu'}
                        >
                          <option value="">Select Program/Department</option>
                          {programOptions.map(program => (
                            <option key={program} value={program}>{program}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Thesis Title with Search */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Title of Thesis <span className="text-red-500">*</span>
                      </label>
                      <ThesisTitleSearch
                        value={formData.thesisTitle}
                        onChange={(value) => handleInputChange('thesisTitle', value)}
                        placeholder="Type to search existing thesis titles..."
                        required={userType === 'lpu'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Start typing to search for existing thesis titles or enter a new one.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || isFlipping}
                        className={`px-6 py-3 text-white font-semibold rounded-lg transition-all flex items-center space-x-2 ${isSubmitting || isFlipping
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg'
                          }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <FileText size={20} />
                            <span>Submit LPU Record</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
            </div>

            {/* Back Page - Non-LPU Student Form */}
            <div className={`${styles.page} ${styles.pageBack}`}>
              <div className={styles.pageContent}>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Non-LPU Student Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Student Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                        placeholder="Enter your first name and last name"
                        required={userType === 'non-lpu'}
                      />
                    </div>

                    {/* School Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Name of School <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.school}
                        onChange={(e) => handleInputChange('school', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                        placeholder="Enter school name"
                        required={userType === 'non-lpu'}
                      />
                    </div>

                    {/* Campus */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Campus <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.campus}
                        onChange={(e) => handleInputChange('campus', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                        required={userType === 'non-lpu'}
                      >
                        <option value="">Select Campus</option>
                        {campusOptions.map(campus => (
                          <option key={campus} value={campus}>{campus}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Thesis Title with Search */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Title of Thesis <span className="text-red-500">*</span>
                    </label>
                    <ThesisTitleSearch
                      value={formData.thesisTitle}
                      onChange={(value) => handleInputChange('thesisTitle', value)}
                      placeholder="Type to search existing thesis titles..."
                      required={userType === 'non-lpu'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Start typing to search for existing thesis titles or enter a new one.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || isFlipping}
                      className={`px-6 py-3 text-white font-semibold rounded-lg transition-all flex items-center space-x-2 ${isSubmitting || isFlipping
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg'
                        }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <FileText size={20} />
                          <span>Submit Non-LPU Record</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>

        {/* Page indicators */}
        <div className={styles.pageIndicator}>
          <div className={`${styles.indicator} ${userType === 'lpu' ? styles.active : ''}`}></div>
          <div className={`${styles.indicator} ${userType === 'non-lpu' ? styles.active : ''}`}></div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          onClose={handleCloseFeedbackModal}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default SubmissionForm;