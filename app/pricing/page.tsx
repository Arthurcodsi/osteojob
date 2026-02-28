import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f0f6ff] text-gray-900">
      {/* Hero */}
      <section className="text-white py-20 px-4" style={{ background: 'linear-gradient(135deg, #2d436f 0%, #3a5a9b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-xl opacity-95">
            Transparent pricing for employers. Always free for candidates.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Candidate — always free */}
        <div className="bg-white rounded-[25px] shadow-sm p-8 mb-8 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <h2 className="text-2xl font-bold mb-2">For Candidates</h2>
          <p className="text-5xl font-bold text-[#32487A] mb-2">Free</p>
          <p className="text-gray-500 mb-6">Always and forever</p>
          <ul className="text-left max-w-xs mx-auto space-y-3 mb-8">
            {[
              'Browse all job listings',
              'Apply to unlimited jobs',
              'Save jobs for later',
              'Candidate profile page',
              'Application tracking dashboard',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/signup"
            className="inline-block bg-[#32487A] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#4b8ec2] transition"
          >
            Create Free Account
          </Link>
        </div>

        {/* Employer plans */}
        <h2 className="text-3xl font-bold text-center mb-8">For Employers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              name: 'Single Listing',
              price: '£49',
              period: 'per post',
              features: [
                '30-day listing',
                'Unlimited applications',
                'Applicant dashboard',
                'Email notifications',
              ],
              cta: 'Post a Job',
              href: '/post-job',
              highlight: false,
            },
            {
              name: 'Bundle',
              price: '£129',
              period: '5 listings',
              features: [
                '30-day listings',
                'Unlimited applications',
                'Applicant dashboard',
                'Email notifications',
                'Save 47%',
              ],
              cta: 'Contact Us',
              href: '/contact',
              highlight: true,
            },
            {
              name: 'Unlimited',
              price: 'Custom',
              period: 'per month',
              features: [
                'Unlimited listings',
                'Priority support',
                'Featured placements',
                'Dedicated account manager',
              ],
              cta: 'Contact Us',
              href: '/contact',
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[25px] p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-[#32487A] text-white shadow-xl'
                  : 'bg-white shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-bold tracking-widest uppercase text-blue-200 mb-2">Most Popular</div>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <div className={`text-4xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-[#32487A]'}`}>
                {plan.price}
              </div>
              <div className={`text-sm mb-6 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>
                {plan.period}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-700'}`}>
                    <span className={plan.highlight ? 'text-blue-200 font-bold' : 'text-green-500 font-bold'}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center px-6 py-3 rounded-full font-semibold transition ${
                  plan.highlight
                    ? 'bg-white text-[#32487A] hover:bg-blue-50'
                    : 'bg-[#32487A] text-white hover:bg-[#4b8ec2]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-[25px] shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Pricing FAQ</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {[
              {
                q: 'How long does a listing stay live?',
                a: 'Each job listing is active for 30 days. You can renew or repost at any time.',
              },
              {
                q: 'Is there a limit on applications?',
                a: 'No — all plans include unlimited applications per listing.',
              },
              {
                q: 'Can I edit my listing after posting?',
                a: 'Yes, you can edit your listing at any time from your dashboard.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Please contact us within 48 hours of purchase if you have an issue and we\'ll sort it out.',
              },
            ].map((item) => (
              <div key={item.q} className="border-b pb-6 last:border-0 last:pb-0">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-700">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-600 mb-4">Have a question about pricing?</p>
          <Link
            href="/contact"
            className="inline-block border-2 border-[#32487A] text-[#32487A] px-8 py-3 rounded-full font-semibold hover:bg-[#dce8f5] transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
