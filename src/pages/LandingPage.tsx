import { Link } from 'react-router-dom';
import {
  Shield,
  ScanFace,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Building2,
  GraduationCap,
  Vote,
  Smartphone,
  Sparkles,
  Play,
  ChevronRight,
} from 'lucide-react';

export function LandingPage() {
  const stats = [
    { label: 'Secure elections', value: '100%', icon: Shield },
    { label: 'Verified students', value: '5k+', icon: Users },
    { label: 'Active elections', value: '50+', icon: Vote },
  ];

  const features = [
    {
      icon: ScanFace,
      title: 'Biometric verification',
      description: 'Protect every vote with secure identity checks that reduce fraud and strengthen voter confidence.',
    },
    {
      icon: Shield,
      title: 'Trusted infrastructure',
      description: 'A modern, encrypted platform designed to keep election data safe and transparent.',
    },
    {
      icon: BarChart3,
      title: 'Live insights',
      description: 'Monitor turnout and results in real time with a clear, auditable experience.',
    },
    {
      icon: Smartphone,
      title: 'Built for every device',
      description: 'Access the platform smoothly on mobile, tablet, or desktop without compromising usability.',
    },
  ];

  const steps = [
    { step: '01', title: 'Register', description: 'Create your student account with your verified university details.', icon: GraduationCap },
    { step: '02', title: 'Enroll your face', description: 'Confirm your identity with a fast and secure biometric check.', icon: ScanFace },
    { step: '03', title: 'Cast your vote', description: 'Choose your preferred candidates and submit with confidence.', icon: Vote },
    { step: '04', title: 'Receive confirmation', description: 'Get instant confirmation that your vote has been successfully recorded.', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#1d4ed8_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.06))]" />
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-14 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-wrap items-center gap-3 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            <span>Secure, transparent, and student-first voting</span>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl text-center lg:text-left">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Modern elections for a
                <span className="mt-3 block bg-gradient-to-r from-blue-200 via-white to-cyan-200 bg-clip-text text-transparent">
                  smarter university community.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
                HTU E-VOTING SYSTEM brings secure student voting, biometric verification, and clear results into one polished experience built for trust and participation.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-slate-900 shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-50">
                  Register to vote
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20">
                  <Play className="h-5 w-5" />
                  See how it works
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur">
                    <stat.icon className="mb-3 h-5 w-5 text-blue-200" />
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-400/40 to-cyan-300/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/60 p-7 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Live status</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">Election readiness</h2>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      Secure
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      ['Identity verification', 'Active'],
                      ['Vote encryption', 'Enabled'],
                      ['Result transparency', 'Audited'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <span className="text-sm text-slate-300">{label}</span>
                        <span className="text-sm font-medium text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                    <div className="flex items-center gap-3 text-blue-100">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm font-medium">Biometric checks are ready for the next election cycle.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">Our democratic manifesto</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A calm, credible foundation for campus democracy.</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                 HTU E-VOTING SYSTEM is designed to make every election feel clear, inclusive, and trustworthy, whether the vote is cast from a phone or a desktop.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Transparency', 'Every voter touchpoint is guided by a clear and auditable experience.'],
                  ['Accessibility', 'The platform is responsive and welcoming across devices and skill levels.'],
                  ['Integrity', 'Identity checks and secure systems reduce the chance of manipulation.'],
                  ['Community', 'Built around student participation, fair representation, and confidence.'],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-2xl text-center">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">Why students trust HTU E-VOTING SYSTEM</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A polished platform for fair and reliable elections.</h2>
            <p className="mt-4 text-lg text-slate-600">Every experience is designed to feel secure, simple, and confidently modern.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A simple process from registration to results.</h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{item.step}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-slate-50 py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">About HTU E-VOTING SYSTEM</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Built to modernize student governance.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">HTU E-VOTING SYSTEM provides a secure digital home for student elections, helping universities run fair, transparent, and inclusive voting experiences.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Building2, label: 'Faculties', value: '10+' },
                { icon: Users, label: 'Departments', value: '40+' },
                { icon: GraduationCap, label: 'Students', value: '5k+' },
                { icon: Vote, label: 'Elections', value: '50+' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                { title: 'SRC Elections', subtitle: 'Student Representative Council', Icon: Vote, color: 'blue' },
                { title: 'Faculty elections', subtitle: 'Academic leadership', Icon: Building2, color: 'emerald' },
                { title: 'Department elections', subtitle: 'Departmental leadership', Icon: Users, color: 'violet' },
                { title: 'Secure platform', subtitle: 'Built for trust', Icon: Shield, color: 'amber' },
              ] as const).map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color === 'blue' ? 'bg-blue-600' : item.color === 'emerald' ? 'bg-emerald-600' : item.color === 'violet' ? 'bg-violet-600' : 'bg-amber-600'} text-white`}>
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">Frequently asked questions</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Everything you need to know before you vote.</h2>
          </div>

          <div className="mt-10 space-y-4">
            {[
              {
                question: 'How does facial verification work?',
                answer: 'During registration, you capture a photo of your face. The system creates a secure facial profile used only to confirm your identity during voting.',
              },
              {
                question: 'Is my vote anonymous?',
                answer: 'Yes. Identity checks are kept separate from ballot data, so your vote remains private and protected.',
              },
              {
                question: 'Can I vote on mobile?',
                answer: 'Absolutely. The platform is responsive and works smoothly on smartphones, tablets, and desktop devices.',
              },
              {
                question: 'How do I get started?',
                answer: 'Register with your student ID and university email, complete your identity check, and you will be ready for the next election.',
              },
            ].map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 py-2 text-left font-semibold text-slate-900">
                  <span>{faq.question}</span>
                  <ChevronRight className="h-5 w-5 transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 px-2 pb-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white lg:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to make your voice heard?</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">Create your account and join the next secure election with confidence.</p>
          <Link to="/register" className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500">
            Register now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
