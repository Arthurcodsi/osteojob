export const revalidate = 0

import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { League_Spartan, Jost } from 'next/font/google'

const spartan = League_Spartan({ weight: ['400', '600', '700'], subsets: ['latin'] })
const jost = Jost({ weight: ['400', '500'], subsets: ['latin'] })

export default async function Home() {
  const [
    { data: jobs },
    { count: jobCount },
    { count: userCount },
    { data: countryRows },
  ] = await Promise.all([
    supabase.from('jobs').select('*, employer:profiles!employer_id(*)').eq('status', 'active').order('posted_date', { ascending: false }).limit(6),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('location_country').eq('status', 'active'),
  ])

  const countries = [...new Set(
    (countryRows || []).map(r => r.location_country).filter(Boolean)
  )].sort()

  return (
    <main className={`min-h-screen ${jost.className}`} style={{ background: '#f0f6ff' }}>

      {/* Hero */}
      <section className="text-white py-20 px-4" style={{ background: 'linear-gradient(135deg, #2d436f 0%, #3a5a9b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`${spartan.className} text-4xl md:text-5xl font-semibold leading-snug mb-5`}>
            Your Osteopathic Career Partner
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Connect with the best opportunities worldwide. Find your perfect role or discover talented professionals.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-[35px] shadow-xl p-5 text-gray-900 max-w-2xl mx-auto">
            <form action="/jobs" method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                name="search"
                placeholder="Job title or keyword"
                className="px-5 py-3 border-2 border-gray-100 rounded-full focus:outline-none focus:border-[#4b8ec2] text-gray-700"
                style={{ background: '#F5F7FC' }}
              />
              <select
                name="location"
                className="px-5 py-3 border-2 border-gray-100 rounded-full focus:outline-none focus:border-[#4b8ec2] text-gray-600"
                style={{ background: '#F5F7FC' }}
              >
                <option value="">All Locations</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                className={`${spartan.className} text-white px-6 py-3 rounded-full font-semibold bg-[#32487A] hover:bg-[#4b8ec2] transition`}
              >
                Search Jobs
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 mb-16 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: jobCount || 0, label: 'Active Jobs' },
            { value: userCount || 0, label: 'Professionals' },
            { value: '25+', label: 'Countries' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-[25px] shadow-md p-5 text-center">
              <div className={`${spartan.className} text-3xl font-bold mb-1`} style={{ color: '#2d436f' }}>
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#4b8ec2' }}>Fresh Opportunities</p>
            <h2 className={`${spartan.className} text-4xl font-semibold`} style={{ color: '#2d436f' }}>Latest Positions</h2>
          </div>
          <Link href="/jobs" className="text-sm font-semibold transition hover:opacity-70" style={{ color: '#32487A' }}>
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group bg-white rounded-[35px] shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="h-40 overflow-hidden" style={{ background: '#F5F7FC' }}>
                {job.featured_image ? (
                  <img
                    src={job.featured_image}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`${spartan.className} w-full h-full flex items-center justify-center text-3xl font-bold`} style={{ color: '#c7d4e8' }}>
                    {job.employer?.company_name?.substring(0, 2).toUpperCase() || 'OJ'}
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="inline-block px-4 py-1 text-xs font-semibold rounded-full mb-3" style={{ background: '#F5F7FC', color: '#32487A' }}>
                  {job.job_type}
                </span>
                <h3 className={`${spartan.className} font-semibold mb-1 transition line-clamp-2 text-[#2d436f]`}>
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
            className={`${spartan.className} inline-block text-white px-8 py-3 rounded-full font-semibold bg-[#32487A] hover:bg-[#4b8ec2] transition shadow-md`}
          >
            Browse All Jobs
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#4b8ec2' }}>Simple Process</p>
            <h2 className={`${spartan.className} text-4xl font-semibold`} style={{ color: '#2d436f' }}>How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: '1', title: 'Create Your Profile', desc: 'Sign up and build your professional profile with your qualifications and experience.' },
              { num: '2', title: 'Search & Apply', desc: 'Browse opportunities worldwide and apply to positions that match your goals.' },
              { num: '3', title: 'Get Hired', desc: 'Connect with employers, attend interviews, and land your dream osteopathic role.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div
                  className={`${spartan.className} w-16 h-16 text-white rounded-[18px] flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-md`}
                  style={{ background: '#2d436f' }}
                >
                  {step.num}
                </div>
                <h3 className={`${spartan.className} font-semibold mb-2 text-lg`} style={{ color: '#2d436f' }}>{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-white py-20 px-4 text-center" style={{ background: 'linear-gradient(135deg, #2d436f 0%, #3a5a9b 100%)' }}>
        <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-4">Join OsteoJob</p>
        <h2 className={`${spartan.className} text-4xl md:text-5xl font-semibold mb-6`}>
          Ready to Take the Next Step?
        </h2>
        <p className="text-blue-100 mb-10 max-w-xl mx-auto">
          Join thousands of osteopaths finding their perfect career match
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className={`${spartan.className} bg-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition shadow`}
            style={{ color: '#2d436f' }}
          >
            Browse Jobs
          </Link>
          <Link
            href="/auth/signup"
            className={`${spartan.className} border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white transition`}
            style={{}}
          >
            Sign Up Free
          </Link>
        </div>
      </section>

    </main>
  )
}
