import { HelpCircle, ChevronRight } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Registration',
    question: 'How do I register to vote?',
    answer: 'Click the "Register" button on the homepage, enter your student ID and university email address, verify your email, complete facial enrollment, and you\'re ready to vote.',
  },
  {
    category: 'Registration',
    question: 'Who can register to vote?',
    answer: 'Any active student enrolled at the university with a valid student ID and university email address can register. Students must also be listed in the official student records imported by the administrator.',
  },
  {
    category: 'Registration',
    question: 'What if my student ID is not recognized?',
    answer: 'If your student ID is not recognized, please contact the Student Affairs office to verify your enrollment status and ensure your details are correctly recorded in the university system.',
  },
  {
    category: 'Facial Verification',
    question: 'How does facial verification work?',
    answer: 'During registration, our system captures an image of your face and creates a unique biometric template. When voting, you\'ll use your camera to verify your identity, ensuring only you can cast your vote.',
  },
  {
    category: 'Facial Verification',
    question: 'Is my face data secure?',
    answer: 'Yes, your facial data is encrypted and stored securely. We only store a mathematical representation of your facial features, not actual images. This data is never shared with third parties.',
  },
  {
    category: 'Facial Verification',
    question: 'What if facial verification fails?',
    answer: 'If facial verification fails multiple times, please ensure good lighting, remove any face coverings, and try again. If problems persist, contact our help desk during election hours for assistance.',
  },
  {
    category: 'Voting',
    question: 'Can I change my vote after submitting?',
    answer: 'No, once your vote is submitted, it cannot be changed. Please review your selections carefully before confirming your vote.',
  },
  {
    category: 'Voting',
    question: 'Is my vote anonymous?',
    answer: 'Yes. While we verify your identity to prevent fraud, your actual vote is encrypted and separated from your identity. No one can link your vote back to you.',
  },
  {
    category: 'Voting',
    question: 'What devices can I use to vote?',
    answer: 'You can vote from any device with a camera and internet connection - smartphone, tablet, laptop, or desktop. The system is fully responsive and works on all modern browsers.',
  },
  {
    category: 'Security',
    question: 'How secure is the voting system?',
    answer: 'Our system uses bank-grade encryption, secure authentication, and biometric verification to ensure vote integrity. All data is encrypted in transit and at rest.',
  },
  {
    category: 'Security',
    question: 'What happens if there\'s a technical issue during voting?',
    answer: 'Our system automatically saves your progress. If you experience issues, refresh the page or log in again. Contact our help desk if problems persist.',
  },
  {
    category: 'Results',
    question: 'When are election results announced?',
    answer: 'Results are typically announced within 24 hours after voting closes. You can view real-time results on your dashboard once voting has ended.',
  },
  {
    category: 'Results',
    question: 'Can I verify that my vote was counted?',
    answer: 'Yes, you\'ll receive a confirmation after voting. The system also provides a participation receipt that confirms your vote was recorded.',
  },
  {
    category: 'Support',
    question: 'How can I contact support?',
    answer: 'You can reach our support team via email at voting@university.edu, by phone during election periods, or visit the help desk at the main administration building.',
  },
  {
    category: 'Support',
    question: 'What are the help desk hours?',
    answer: 'During election periods, the help desk is open 24/7. Outside of elections, support is available during regular university business hours (8 AM - 5 PM, Monday to Friday).',
  },
];

export function FAQPage() {
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
            FAQ
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            Find answers to common questions about our electronic voting system.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                {category}
              </h2>
              <div className="space-y-4">
                {faqs
                  .filter((faq) => faq.category === category)
                  .map((faq, index) => (
                    <details
                      key={index}
                      className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
                    >
                      <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100 transition-colors">
                        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                      </summary>
                      <div className="px-5 pb-5">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </details>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
