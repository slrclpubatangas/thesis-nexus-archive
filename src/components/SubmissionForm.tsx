import React, { useState, useEffect } from 'react';
import { FileText, Users, School, CheckCircle } from 'lucide-react';
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
  const [showSuccess, setShowSuccess] = useState(false);
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
        xSpeed: (Math.random() - 0.5) * (0.1 + size/400), // Larger orbs move slower
        ySpeed: (Math.random() - 0.5) * (0.1 + size/400),
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

      setShowSuccess(true);
      toast({
        title: "Record Submitted",
        description: "Your thesis record has been successfully submitted.",
      });

      // Reset form after success
      setTimeout(() => {
        setFormData({
          fullName: '',
          studentNumber: '',
          school: '',
          campus: '',
          program: '',
          thesisTitle: ''
        });
        setShowSuccess(false);
      }, 2000);
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

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 backdrop-blur-sm bg-opacity-90">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FileText className="h-8 w-8 text-red-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                DAILY RECORD OF USERS OF THE UNDERGRADUATE RESEARCH COLLECTION
              </h2>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select User Type:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg transition-all ${userType === 'lpu' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setUserType('lpu')}
                >
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="lpu"
                      checked={userType === 'lpu'}
                      onChange={(e) => setUserType(e.target.value as 'lpu' | 'non-lpu')}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <Users className="h-5 w-5 text-red-600" />
                    <span className="text-gray-700 font-medium">LPU Student</span>
                  </label>
                </div>
                <div 
                  className={`p-4 border-2 rounded-lg transition-all ${userType === 'non-lpu' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setUserType('non-lpu')}
                >
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="non-lpu"
                      checked={userType === 'non-lpu'}
                      onChange={(e) => setUserType(e.target.value as 'lpu' | 'non-lpu')}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <School className="h-5 w-5 text-red-600" />
                    <span className="text-gray-700 font-medium">Non-LPU Student</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Student Number or School */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {userType === 'lpu' ? 'Student Number' : 'Name of School'}
                </label>
                <input
                  type="text"
                  value={userType === 'lpu' ? formData.studentNumber : formData.school}
                  onChange={(e) => handleInputChange(
                    userType === 'lpu' ? 'studentNumber' : 'school', 
                    e.target.value
                  )}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                  placeholder={userType === 'lpu' ? 'Enter student number' : 'Enter school name'}
                  required
                />
              </div>

              {/* Campus */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Campus
                </label>
                <select
                  value={formData.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Program/Department
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => handleInputChange('program', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Title of Thesis
              </label>
              <ThesisTitleSearch
                value={formData.thesisTitle}
                onChange={(value) => handleInputChange('thesisTitle', value)}
                placeholder="Type to search existing thesis titles..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Start typing to search for existing thesis titles or enter a new one.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 text-white font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                  isSubmitting 
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
                    <span>Submit Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600">Your thesis record has been successfully submitted.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionForm;