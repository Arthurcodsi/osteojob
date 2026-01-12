import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; location?: string; type?: string }>
}) {
  const params = await searchParams
  
  // Build query
  let query = supabase
    .from('jobs')
    .select('*, employer:profiles!employer_id(*)')
    .eq('status', 'active')

  // Apply filters
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }
  if (params.location) {
    query = query.eq('location_country', params.location)
  }
  if (params.type) {
    query = query.eq('job_type', params.type)
  }

  const { data: jobs } = await query.order('posted_date', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Perfect Job</h1>
          <p className="text-xl text-gray-600">
            {jobs?.length || 0} opportunities available
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search jobs..."
              defaultValue={params.search}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            
            <select
              name="location"
              defaultValue={params.location}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Locations</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
              <option value="USA">USA</option>
              <option value="Canada">Canada</option>
              <option value="Ireland">Ireland</option>
              <option value="France">France</option>
              <option value="Spain">Spain</option>
            </select>

            <select
              name="type"
              defaultValue={params.type}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Locum">Locum</option>
              <option value="Contract">Contract</option>
            </select>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Jobs List */}
        {jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
                      {job.employer?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1 group-hover:text-blue-600 transition">
                        {job.title}
                      </h2>
                      <p className="text-gray-600 mb-3">
                        {job.employer?.company_name || 'Company'}
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                          {job.job_type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                          📍 {job.location_country}
                          {job.location_city && `, ${job.location_city}`}
                        </span>
                        {job.category && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                            💼 {job.category}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full">
                            💰 {job.salary_range}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(job.posted_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {job.view_count} views
                    </div>
                  </div>
                </div>

                {job.excerpt && (
                  <p className="mt-4 text-gray-600 line-clamp-2">
                    {job.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <Link
              href="/jobs"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Clear Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}