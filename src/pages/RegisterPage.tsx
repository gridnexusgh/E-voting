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
import { supabase, invokeEdgeFunction } from '../services/supabase';
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

  async function registerStudent() {
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

    if (!studentName) {
      setErrors({ form: 'Student verification is required before creating an account.' });
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfileError) {
        setErrors({ form: 'Unable to verify whether this email is already registered. Please try again.' });
        return;
      }

      if (existingProfile) {
        setErrors({ email: 'This email is already registered. Please sign in instead.' });
        return;
      }

      const functionData = await invokeEdgeFunction('create-admin-user', {
        email: normalizedEmail,
        password: formData.password,
        full_name: studentName,
        role: 'student',
        username: null,
        scope: 'department',
        faculty_id: formData.facultyId,
        department_id: formData.departmentId,
      });

      if (!functionData?.success) {
        if (functionData?.recovered) {
          setErrors({ form: 'An account already exists for this email. Please sign in or reset your password.' });
          return;
        }

        setErrors({ form: functionData?.error || 'Unable to create account. Please try again.' });
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

      if (signInError) {
        setErrors({ form: signInError.message || 'Account created but sign-in failed. Please log in manually.' });
        return;
      }

      setErrors({});
      navigate('/face-enrollment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete registration. Please try again.';
      setErrors({ form: message });
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#1d4ed8_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl text-white lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur">
            <Vote className="h-4 w-4" />
            Secure access for student elections
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
            Join HTU E-VOTING SYSTEM for secure campus voting.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Register with your verified student record and continue to face enrollment for secure election access.
          </p>
          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
                <Vote className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Everything you need, in one place</p>
                <p className="text-sm text-slate-300">Verify your identity, enroll your face, and protect your vote.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <Vote className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">HTU E-VOTING SYSTEM Sign Up</p>
              <p className="text-sm text-slate-500">Create your secure voting account</p>
            </div>
          </div>

          {errors.form && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{errors.form}</p>
            </div>
          )}

          <div className="mb-6 flex max-w-md justify-center rounded-full border border-slate-200/80 bg-slate-50 p-2 shadow-sm backdrop-blur sm:mx-auto lg:mx-0">
            <div className="flex w-full items-center justify-between gap-2">
              {[
                { num: 1, label: 'Academic Info' },
                { num: 2, label: 'Account Setup' },
              ].map((s) => (
                <div key={s.num} className="flex flex-1 flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${step >= s.num ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`mt-2 hidden text-xs font-medium sm:block ${step >= s.num ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

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
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={registerStudent}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create account</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
