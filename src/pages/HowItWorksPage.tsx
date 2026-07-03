import { GraduationCap, ScanFace, Vote, CheckCircle2, ArrowRight, Smartphone, Shield, Clock, Eye, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      icon: GraduationCap,
      title: 'Register Your Account',
      description: 'Begin by creating your account using your student ID and university email address. Our system will verify your student record to ensure eligibility.',
      details: [
        'Enter your student ID',
        'Select your faculty and department',
        'Provide your university email',
        'Create a secure password',
      ],
    },
    {
      number: '02',
      icon: Shield,
      title: 'Email Verification',
      description: 'Check your university email for a verification link. Click the link to confirm your email address and activate your account.',
      details: [
        'Check your inbox for verification email',
        'Click the verification link',
        'Account will be activated instantly',
        'Proceed to facial enrollment',
      ],
    },
    {
      number: '03',
      icon: ScanFace,
      title: 'Facial Enrollment',
      description: 'Complete the facial enrollment process by capturing your face using your device\'s camera. This enables secure identity verification when voting.',
      details: [
        'Use your device camera',
        'Ensure good lighting',
        'Remove face coverings',
        'Capture your face clearly',
      ],
    },
    {
      number: '04',
      icon: Vote,
      title: 'Cast Your Vote',
      description: 'When elections are active, log in, verify your identity with a quick face scan, select your preferred candidates, and submit your vote.',
      details: [
        'Log in to your account',
        'Verify identity with face scan',
        'Review candidate options',
        'Submit your vote securely',
      ],
    },
    {
      number: '05',
      icon: CheckCircle2,
      title: 'Confirmation',
      description: 'Receive instant confirmation that your vote was recorded. View real-time election results as voting concludes.',
      details: [
        'Instant vote confirmation',
        'Vote recorded securely',
        'Track election results',
        'Verify your participation',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
            How It Works
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Simple, Secure, Transparent
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            Follow these easy steps to register, verify your identity, and cast your vote in university elections.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 lg:space-y-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                  <div className="flex-shrink-0 flex items-center gap-4 lg:flex-col lg:items-start">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-blue-200">{step.number}</span>
                  </div>

                  <div className="flex-grow bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex justify-center mt-4">
                    <ArrowRight className="w-6 h-6 text-blue-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600">Built with modern technology for a seamless voting experience.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: 'Mobile Friendly', description: 'Vote from any device - phone, tablet, or desktop.' },
              { icon: Clock, title: '24/7 Access', description: 'Vote anytime during the election period.' },
              { icon: Eye, title: 'Real-Time Results', description: 'Watch results unfold as votes are counted.' },
              { icon: Shield, title: 'Secure', description: 'Bank-grade encryption protects your data.' },
              { icon: ScanFace, title: 'Biometric Auth', description: 'Facial verification ensures only you can vote.' },
              { icon: HelpCircle, title: 'Support', description: '24/7 help desk during election periods.' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <feature.icon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">Register now and participate in upcoming elections.</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 rounded-xl font-semibold transition-all"
          >
            <span>Register Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
