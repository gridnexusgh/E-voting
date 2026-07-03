import { ShieldCheck, Users, Building2, GraduationCap, FilePlus, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const baseStats = [
  {
    key: 'students',
    title: 'Total Students',
    value: '—',
    description: 'Imported student records',
    icon: GraduationCap,
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    key: 'faculties',
    title: 'Total Faculties',
    value: '—',
    description: 'Active faculties',
    icon: Building2,
    accent: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'departments',
    title: 'Total Departments',
    value: '—',
    description: 'All departments',
    icon: ShieldCheck,
    accent: 'bg-slate-50 text-slate-700',
  },
  {
    key: 'officers',
    title: 'Election Officers',
    value: '—',
    description: 'Officer accounts',
    icon: Users,
    accent: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'auditors',
    title: 'Auditors',
    value: '—',
    description: 'Auditor accounts',
    icon: Users,
    accent: 'bg-slate-50 text-slate-700',
  },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const profileName = user?.full_name || 'Administrator';
  const [stats, setStats] = useState(baseStats);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [{ count: studentsCount }, { count: facultiesCount }, { count: departmentsCount }] = await Promise.all([
          supabase.from('student_records').select('id', { count: 'exact' }),
          supabase.from('faculties').select('id', { count: 'exact' }),
          supabase.from('departments').select('id', { count: 'exact' }),
        ]);

        const { count: officersCount } = await supabase.from('users').select('id', { count: 'exact' }).in('role', ['election_officer']);
        const { count: auditorsCount } = await supabase.from('users').select('id', { count: 'exact' }).in('role', ['auditor']);

        setStats((s) =>
          s.map((st) => {
            if (st.key === 'students') return { ...st, value: String(studentsCount ?? 0) };
            if (st.key === 'faculties') return { ...st, value: String(facultiesCount ?? 0) };
            if (st.key === 'departments') return { ...st, value: String(departmentsCount ?? 0) };
            if (st.key === 'officers') return { ...st, value: String(officersCount ?? 0) };
            if (st.key === 'auditors') return { ...st, value: String(auditorsCount ?? 0) };
            return st;
          }),
        );
      } catch (e) {
        // ignore silently for now
      }
    }

    loadCounts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin Portal</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back, {profileName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Manage faculties, departments, student records, and administrative accounts from one place.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <div className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                System running smoothly
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${stat.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-600">{stat.description}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Manage Faculties',
              description: 'Create, update, and delete faculties',
              path: '/admin/faculties',
              icon: Building2,
            },
            {
              title: 'Manage Departments',
              description: 'Organize departments across faculties',
              path: '/admin/departments',
              icon: ShieldCheck,
            },
            {
              title: 'Import Students',
              description: 'Upload student records via CSV',
              path: '/admin/students/import',
              icon: FilePlus,
            },
            {
              title: 'Manage Users',
              description: 'Create officers and auditors',
              path: '/admin/users',
              icon: UsersIcon,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                className="group block rounded-[24px] border border-slate-200 bg-white p-6 transition hover:border-blue-500 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-5 text-sm font-semibold text-blue-600">Open section →</p>
              </a>
            );
          })}
        </section>
      </div>
    </div>
  );
}
