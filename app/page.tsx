import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DM_Serif_Display } from 'next/font/google'

const serif = DM_Serif_Display({ weight: '400', subsets: ['latin'] })

export default async function Home() {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, employer:profiles!employer_id(*)')
    .eq('status', 'active')
    .order('posted_date', { ascending: false })
    .limit(6)

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen" style={{ background: '#f0f6ff' }}>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-500 to-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-4">
            The Job Board for Osteopaths
          </p>
          <h1 className={`${serif.className} text-5xl md:text-6xl leading-tight mb-5`}>
            Your Osteopathic<br />Career Partner
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Connect with the best opportunities worldwide. Find your perfect role or discover talented professionals.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-xl p-5 text-gray-900 max-w-2xl mx-auto">
            <form action="/jobs" method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                name="search"
                placeholder="Job title or keyword"
                className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50"
              />
              <select
                name="location"
                className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50 text-gray-600"
              >
                <option value="">All Locations</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Search Jobs
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 mb-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: jobCount || 0, label: 'Active Jobs' },
            { value: userCount || 0, label: 'Professionals' },
            { value: '150+', label: 'CPD Courses' },
            { value: '25+', label: 'Countries' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-md p-5 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">Fresh Opportunities</p>
            <h2 className={`${serif.className} text-4xl text-gray-900`}>Latest Positions</h2>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="h-40 bg-blue-50 overflow-hidden">
                {job.featured_image ? (
                  <img
                    src={job.featured_image}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-200">
                    {job.employer?.company_name?.substring(0, 2).toUpperCase() || 'OJ'}
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full mb-3">
                  {job.job_type}
                </span>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {job.employer?.company_name || 'Company'}
                </p>
                <p className="text-xs text-gray-400">
                  📍 {job.location_city ? `${job.location_city}, ` : ''}{job.location_country}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/jobs"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
          >
            Browse All Jobs
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-2">Simple Process</p>
            <h2 className={`${serif.className} text-4xl text-gray-900`}>How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: '1', title: 'Create Your Profile', desc: 'Sign up and build your professional profile with your qualifications and experience.' },
              { num: '2', title: 'Search & Apply', desc: 'Browse opportunities worldwide and apply to positions that match your goals.' },
              { num: '3', title: 'Get Hired', desc: 'Connect with employers, attend interviews, and land your dream osteopathic role.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-md">
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4 text-center">
        <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-4">Join OsteoJob</p>
        <h2 className={`${serif.className} text-4xl md:text-5xl mb-6`}>
          Ready to Take the Next Step?
        </h2>
        <p className="text-blue-100 mb-10 max-w-xl mx-auto">
          Join thousands of osteopaths finding their perfect career match
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition shadow"
          >
            Browse Jobs
          </Link>
          <Link
            href="/auth/signup"
            className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-700 transition"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

    </main>
  )
}
