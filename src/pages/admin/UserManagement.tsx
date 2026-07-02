import { useState, useEffect } from 'react';
import { Users, Search, CreditCard as Edit, Trash2, X, CheckCircle2, AlertCircle, Loader2, Save, Shield, Eye, Globe, Building2 } from 'lucide-react';
import { supabase, invokeEdgeFunction } from '../../services/supabase';
import type { User, Faculty, Department } from '../../types';

interface UserFormData {
  email: string;
  full_name: string;
  username: string;
  password: string;
  role: 'election_officer' | 'auditor';
  faculty_id: string;
  department_id: string;
  scope: 'university' | 'faculty' | 'department';
}

interface UserManagementProps {
  onUserCreated: () => void;
}

export function UserManagement({ onUserCreated }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    username: '',
    password: '',
    role: 'election_officer',
    faculty_id: '',
    department_id: '',
    scope: 'university',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.faculty_id) {
      loadDepartments(formData.faculty_id);
    } else {
      setDepartments([]);
    }
  }, [formData.faculty_id]);

  async function loadData() {
    setIsLoading(true);
    const { data: usersData } = await supabase
      .from('users')
      .select('*, faculties(name), departments(name)')
      .in('role', ['election_officer', 'auditor'])
      .order('created_at', { ascending: false });
    if (usersData) setUsers(usersData as unknown as User[]);

    const { data: facultiesData } = await supabase.from('faculties').select('*').order('name');
    if (facultiesData) setFaculties(facultiesData);
    setIsLoading(false);
  }

  async function loadDepartments(facultyId: string) {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('faculty_id', facultyId)
      .order('name');
    if (data) setDepartments(data);
  }

  function openCreateModal(role: 'election_officer' | 'auditor') {
    setEditingUser(null);
    setFormData({
      email: '',
      full_name: '',
      username: '',
      password: '',
      role,
      faculty_id: '',
      department_id: '',
      scope: 'university',
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      username: user.username || '',
      password: '',
      role: user.role as 'election_officer' | 'auditor',
      faculty_id: user.faculty_id || '',
      department_id: user.department_id || '',
      scope: user.scope as 'university' | 'faculty' | 'department',
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const updateData: Record<string, unknown> = {
          email: formData.email,
          full_name: formData.full_name,
          username: formData.username || null,
          scope: formData.scope,
          faculty_id: formData.scope === 'university' ? null : formData.faculty_id || null,
          department_id: formData.scope === 'department' ? formData.department_id || null : null,
        };

        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (updateError) {
          setError('Failed to update user. Please try again.');
          return;
        }
        setSuccess('User updated successfully!');
      } else {
        let data;
        try {
          data = await invokeEdgeFunction('create-admin-user', {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            username: formData.username || null,
            scope: formData.scope,
            faculty_id: formData.scope === 'university' ? null : formData.faculty_id || null,
            department_id: formData.scope === 'department' ? formData.department_id || null : null,
          });
        } catch (functionError) {
          const details = functionError instanceof Error ? functionError.message : 'Failed to create user account';
          const message = typeof details === 'string' ? details : 'Failed to create user account';
          if (message.toLowerCase().includes('rate limit')) {
            setError('Too many account creation attempts. Please wait a few minutes and try again.');
          } else {
            setError(message);
          }
          return;
        }

        if (!data || (data as any).error) {
          const message = (data as any)?.error || 'Failed to create user account';
          setError(message);
          return;
        }

        setSuccess('User created successfully!');
      }

      await loadData();
      onUserCreated();
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete "${user.full_name}"?`)) return;

    await supabase.from('users').delete().eq('id', user.id);
    setUsers(users.filter((u) => u.id !== user.id));
    onUserCreated();
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    if (role === 'election_officer') {
      return { label: 'Election Officer', class: 'bg-purple-100 text-purple-700' };
    }
    return { label: 'Auditor', class: 'bg-green-100 text-green-700' };
  };

  const getScopeBadge = (user: User) => {
    if (!user.scope || user.scope === 'university') {
      return { label: 'University-wide', class: 'bg-blue-100 text-blue-700' };
    }
    if (user.scope === 'faculty') {
      return { label: 'Faculty-level', class: 'bg-orange-100 text-orange-700' };
    }
    return { label: 'Department-level', class: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Create and manage Election Officers and Auditors</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openCreateModal('election_officer')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Add Officer</span>
          </button>
          <button
            onClick={() => openCreateModal('auditor')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Add Auditor</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'election_officer', 'auditor'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRole === role ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role === 'all' ? 'All' : role === 'election_officer' ? 'Officers' : 'Auditors'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Scope</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden md:table-cell">Email</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  const scopeBadge = getScopeBadge(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.role === 'election_officer' ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            {user.role === 'election_officer' ? (
                              <Shield className={`w-5 h-5 text-purple-600`} />
                            ) : (
                              <Eye className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${roleBadge.class}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${scopeBadge.class}`}>
                          {scopeBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{user.email}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : `Create ${formData.role === 'election_officer' ? 'Election Officer' : 'Auditor'}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username (Optional)</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="john@university.edu"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Set initial password"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operational Scope</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'university', icon: Globe, label: 'University-wide' },
                      { value: 'faculty', icon: Building2, label: 'Faculty-level' },
                      { value: 'department', icon: Building2, label: 'Department-level' },
                    ].map((scope) => (
                      <button
                        key={scope.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, scope: scope.value as 'university' | 'faculty' | 'department' })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formData.scope === scope.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <scope.icon className={`w-5 h-5 mx-auto mb-1 ${
                          formData.scope === scope.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-xs font-medium ${
                          formData.scope === scope.value ? 'text-blue-700' : 'text-gray-600'
                        }`}>{scope.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.scope !== 'university' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
                    <select
                      value={formData.faculty_id}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value, department_id: '' })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.scope === 'department' && formData.faculty_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
