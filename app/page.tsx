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
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-5">
            The Job Board for Osteopaths
          </p>
          <h1 className={`${serif.className} text-5xl md:text-7xl text-gray-900 leading-tight mb-6 max-w-3xl`}>
            Your Osteopathic<br />Career Partner
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl">
            Connect with the best opportunities worldwide. Find your perfect role or discover talented professionals.
          </p>

          <form action="/jobs" method="GET" className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              name="search"
              placeholder="Job title or keyword"
              className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-900"
            />
            <select
              name="location"
              className="px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-600 bg-white"
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
              className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Stats strip */}
        <div className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap gap-8">
            <div>
              <span className="text-2xl font-bold text-gray-900">{jobCount || 0}</span>
              <span className="text-gray-500 ml-2 text-sm">Active Jobs</span>
            </div>
            <div className="text-gray-300 hidden sm:block self-center">|</div>
            <div>
              <span className="text-2xl font-bold text-gray-900">{userCount || 0}</span>
              <span className="text-gray-500 ml-2 text-sm">Professionals</span>
            </div>
            <div className="text-gray-300 hidden sm:block self-center">|</div>
            <div>
              <span className="text-2xl font-bold text-gray-900">150+</span>
              <span className="text-gray-500 ml-2 text-sm">CPD Courses</span>
            </div>
            <div className="text-gray-300 hidden sm:block self-center">|</div>
            <div>
              <span className="text-2xl font-bold text-gray-900">25+</span>
              <span className="text-gray-500 ml-2 text-sm">Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">Opportunities</p>
            <h2 className={`${serif.className} text-4xl text-gray-900`}>Latest Positions</h2>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-gray-900 hover:text-teal-600 transition">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group border border-gray-200 rounded-xl overflow-hidden hover:border-gray-900 hover:shadow-lg transition-all duration-200"
            >
              <div className="h-40 bg-gray-100 overflow-hidden">
                {job.featured_image ? (
                  <img
                    src={job.featured_image}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-300">
                    {job.employer?.company_name?.substring(0, 2).toUpperCase() || 'OJ'}
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="text-xs font-bold tracking-wide text-teal-600 uppercase">
                  {job.job_type}
                </span>
                <h3 className="font-semibold text-gray-900 mt-2 mb-1 group-hover:text-teal-600 transition line-clamp-2">
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
      </section>

      {/* How It Works */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">Process</p>
          <h2 className={`${serif.className} text-4xl text-gray-900 mb-12`}>How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: '01', title: 'Create Your Profile', desc: 'Sign up and build your professional profile with your qualifications and experience.' },
              { num: '02', title: 'Search & Apply', desc: 'Browse opportunities worldwide and apply to positions that match your goals.' },
              { num: '03', title: 'Get Hired', desc: 'Connect with employers, attend interviews, and land your dream osteopathic role.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-5">
                <div className={`${serif.className} text-5xl text-gray-200 leading-none flex-shrink-0`}>{step.num}</div>
                <div className="pt-2">
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20 px-4 text-center">
        <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">Join OsteoJob</p>
        <h2 className={`${serif.className} text-4xl md:text-5xl mb-6`}>
          Ready to Take the Next Step?
        </h2>
        <p className="text-gray-400 mb-10 max-w-xl mx-auto">
          Join thousands of osteopaths finding their perfect career match
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Browse Jobs
          </Link>
          <Link
            href="/auth/signup"
            className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

    </main>
  )
}
