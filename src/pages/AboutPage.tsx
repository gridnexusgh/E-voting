import { Building2, Users, Shield, Target, Eye, Heart, Award, CheckCircle2 } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              About HTU E-VOTING SYSTEM
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Building Trust Through Technology
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              The University Electronic Voting System is designed to revolutionize student elections with secure, transparent, and accessible voting powered by modern biometric technology.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We believe that every student's voice deserves to be heard. Our mission is to provide a secure, transparent, and user-friendly electronic voting platform that empowers students to participate actively in university governance.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                By leveraging facial verification technology, we ensure that every vote is legitimate while maintaining the anonymity that is fundamental to a fair democratic process.
              </p>

              <div className="space-y-4">
                {[
                  'Support SRC, Faculty, and Department elections',
                  'Ensure 100% vote integrity with biometric verification',
                  'Provide real-time, transparent results',
                  'Make voting accessible from anywhere',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, label: 'Faculties', value: '10+', color: 'bg-blue-500' },
                { icon: Users, label: 'Students', value: '5000+', color: 'bg-green-500' },
                { icon: Shield, label: 'Security', value: '100%', color: 'bg-purple-500' },
                { icon: Award, label: 'Elections', value: '50+', color: 'bg-orange-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do in building and maintaining the voting system.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Security',
                description: 'Bank-grade encryption and security protocols protect every vote.',
                color: 'text-blue-600',
              },
              {
                icon: Eye,
                title: 'Transparency',
                description: 'Open and auditable processes ensure trust in results.',
                color: 'text-green-600',
              },
              {
                icon: Target,
                title: 'Accuracy',
                description: 'Every vote is counted correctly with zero margin for error.',
                color: 'text-purple-600',
              },
              {
                icon: Heart,
                title: 'Accessibility',
                description: 'Designed to work for everyone, on any device, anywhere.',
                color: 'text-red-600',
              },
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <value.icon className={`w-12 h-12 ${value.color} mx-auto mb-4`} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
