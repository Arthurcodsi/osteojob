import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Fetch latest jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, employer:profiles!employer_id(*)')
    .eq('status', 'active')
    .order('posted_date', { ascending: false })
    .limit(6)

  console.log('Query error:', JSON.stringify(error, null, 2))
  console.log('Jobs fetched:', jobs)
  console.log('Jobs count:', jobs?.length)
  // Get stats
  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-400 to-blue-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            Your Osteopathic Career Partner
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Connect with the best opportunities worldwide. Find your perfect role or discover talented professionals.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-xl shadow-2xl p-6 text-gray-900">
            <form action="/jobs" method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="search"
                placeholder="Job title or keyword"
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <select
                name="location"
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
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
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Search Jobs
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 -mt-12 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {jobCount || 0}
            </div>
            <div className="text-gray-600">Active Jobs</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {userCount || 0}
            </div>
            <div className="text-gray-600">Professionals</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
            <div className="text-gray-600">CPD Courses</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">25+</div>
            <div className="text-gray-600">Countries</div>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Latest Opportunities</h2>
          <p className="text-xl text-gray-600">
            Explore the newest positions from top practices worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                  {job.employer?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                  {job.job_type}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition">
                {job.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {job.employer?.company_name || 'Company'}
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-gray-500 pt-4 border-t">
                <span>📍 {job.location_country}</span>
                {job.category && <span>💼 {job.category}</span>}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/jobs"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View All Jobs
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-2">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-600">
                Sign up and build your professional profile with your qualifications and experience
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Search & Apply</h3>
              <p className="text-gray-600">
                Browse thousands of opportunities and apply to positions that match your goals
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Hired</h3>
              <p className="text-gray-600">
                Connect with employers, attend interviews, and land your dream osteopathic role
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Take the Next Step?</h2>
        <p className="text-xl mb-8 opacity-95">
          Join thousands of osteopaths finding their perfect career match
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Browse Jobs
          </Link>
          <Link
            href="/auth/signup"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            Sign Up
          </Link>
        </div>
      </section>
    </main>
  )
}