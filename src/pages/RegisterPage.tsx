import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Vote,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  Mail,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Faculty, Department } from '../types';

interface FormData {
  studentId: string;
  facultyId: string;
  departmentId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    facultyId: '',
    departmentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    loadFaculties();
  }, []);

  useEffect(() => {
    if (formData.facultyId) {
      loadDepartments(formData.facultyId);
    } else {
      setDepartments([]);
    }
  }, [formData.facultyId]);

  async function loadFaculties() {
    try {
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('name');

      if (!error && data) {
        setFaculties(data);
      }
    } finally {
      setIsLoadingData(false);
    }
  }

  async function loadDepartments(facultyId: string) {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('faculty_id', facultyId)
      .order('name');

    if (data) {
      setDepartments(data);
    }
  }

  async function verifyStudent() {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    if (!formData.facultyId) {
      newErrors.facultyId = 'Please select a faculty';
    }
    if (!formData.departmentId) {
      newErrors.departmentId = 'Please select a department';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data: student, error } = await supabase
        .from('student_records')
        .select('id, student_id, full_name, email, faculty_id, department_id, status')
        .eq('student_id', formData.studentId)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !student) {
        setErrors({ studentId: 'Student record not found. Please verify your details.' });
        return;
      }

      if (
        student.faculty_id &&
        student.department_id &&
        (student.faculty_id !== formData.facultyId || student.department_id !== formData.departmentId)
      ) {
        setErrors({ studentId: 'Student record not found. Please verify your details.' });
        return;
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('student_record_id', student.id)
        .maybeSingle();

      if (existingUser) {
        setErrors({ studentId: 'This student ID is already registered. Please log in.' });
        return;
      }

      setStudentName(student.full_name);
      setFormData((prev) => ({ ...prev, email: student.email }));
      setStep(2);
    } catch {
      setErrors({ studentId: 'Verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  function normalizeEmail(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@htu.edu.gh`;
  }

  function validatePassword(password: string): string | null {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include a special character';
    return null;
  }

  async function sendConfirmationEmail() {
    setErrors({});

    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const normalizedEmail = normalizeEmail(formData.email);
    if (!normalizedEmail.startsWith('032') || !normalizedEmail.includes('@')) {
      setErrors({ email: 'Please use your university email (e.g., 032xxxx or 032xxxx@htu.edu.gh)' });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (signUpError) {
        setErrors({ form: signUpError.message || 'Unable to send confirmation email. Please check your Supabase Auth email settings.' });
        return;
      }

      if (!data.user) {
        setErrors({ form: 'Confirmation email was not created. Please check your Supabase Auth email settings.' });
        return;
      }

      setErrors({});
      setStep(3); // show "Check your email" step
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyEmailCode() {
    // With Supabase built-in confirmation we no longer verify codes here.
    // Instead, attempt to sign in to check whether the user has confirmed their email.
    setErrors({});
    setIsLoading(true);

    try {
      const normalizedEmail = normalizeEmail(formData.email);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

      if (signInError) {
        setErrors({ form: 'Email not yet confirmed. Please check your inbox for the confirmation link.' });
        return;
      }

      // Insert profile row now that the user is authenticated
      const { data: studentRecord } = await supabase
        .from('student_records')
        .select('id')
        .eq('student_id', formData.studentId)
        .maybeSingle();

      const profile = {
        id: signInData.user?.id,
        email: normalizedEmail,
        password_hash: '',
        role: 'student',
        full_name: studentName,
        student_record_id: studentRecord?.id || null,
        faculty_id: formData.facultyId,
        department_id: formData.departmentId,
        is_email_verified: true,
        is_face_enrolled: false,
      };

      const { error: insertError } = await supabase.from('users').insert(profile);
      if (insertError) {
        // If profile already exists, try updating is_email_verified
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_email_verified: true })
          .eq('id', signInData.user?.id);

        if (updateError) {
          setErrors({ form: 'Signed in but failed to finalize account. Please try again.' });
          return;
        }
      }

      // Redirect to face enrollment
      navigate('/face-enrollment');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_45%,_#dbeafe_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="max-w-xl rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur">
            <Vote className="h-4 w-4" />
            Student identity verification
          </div>
          <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Create your UEVS account</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Register with your verified student details, confirm your email, and prepare for secure voting.
          </p>
          <div className="mt-8 space-y-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
            {[
              'Verified academic record matching',
              'Protected email confirmation',
              'Optional face enrollment for voting access',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-sm text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-blue-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-6 flex max-w-md justify-center rounded-full border border-slate-200/80 bg-white/80 p-2 shadow-sm backdrop-blur sm:mx-auto lg:mx-0">
            <div className="flex w-full items-center justify-between gap-2">
              {[
                { num: 1, label: 'Academic Info' },
                { num: 2, label: 'Account Setup' },
                { num: 3, label: 'Verify Email' },
              ].map((s) => (
                <div key={s.num} className="flex flex-1 flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${step >= s.num ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`mt-2 hidden text-xs font-medium sm:block ${step >= s.num ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
            {errors.form && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errors.form}</p>
              </div>
            )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Academic Information
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-xl border ${
                      errors.studentId ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                    placeholder="Enter your student ID"
                  />
                  {errors.studentId && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.studentId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty
                  </label>
                  <div className="relative">
                    <select
                      id="faculty"
                      value={formData.facultyId}
                      onChange={(e) => setFormData({ ...formData, facultyId: e.target.value, departmentId: '' })}
                      className={`w-full px-4 py-3.5 rounded-xl border ${
                        errors.facultyId ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none`}
                    >
                      <option value="">Select your faculty</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.facultyId && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.facultyId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      id="department"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      disabled={!formData.facultyId}
                      className={`w-full px-4 py-3.5 rounded-xl border ${
                        errors.departmentId ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">Select your department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.departmentId && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.departmentId}</p>
                  )}
                </div>

                <button
                  onClick={verifyStudent}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors shadow-md mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Student Verified</p>
                  <p className="text-sm text-green-700">{studentName}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6 text-blue-600" />
                Account Setup
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    University Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}


                      placeholder="032xxxx@htu.edu.gh"

                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    Must be your registered university email
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Special character</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={sendConfirmationEmail}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send confirmation email</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                We sent a confirmation link to <span className="font-medium text-gray-900">{formData.email}</span>. Click the link to confirm your email, then return here and click <span className="font-medium">I have confirmed</span>.
              </p>

              <div className="space-y-4 text-left">
                <button
                  onClick={verifyEmailCode}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <span>I have confirmed</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

</div>

              <div className="bg-gray-50 rounded-xl p-4 mt-6">
                <p className="text-sm text-gray-500">
                  After confirming, you'll need to complete facial enrollment to activate your voting access.
                </p>
              </div>
            </div>
          )}

        </div>

            {step < 3 && (
              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                  Sign In
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    
    
  );
}
