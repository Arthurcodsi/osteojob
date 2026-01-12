import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Fetch job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      employer:profiles(*)
    `)
    .eq('id', id)
    .single()

  console.log('Job detail error:', error)
  console.log('Job data:', job)

  if (!job || error) {
    notFound()
  }

  // Increment view count (fire and forget)
  supabase.rpc('increment_job_views', { job_uuid: id })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/jobs"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          ← Back to jobs
        </Link>

        {/* Job Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-blue-600 text-2xl flex-shrink-0">
              {job.employer?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <p className="text-xl text-gray-600 mb-4">
                {job.employer?.company_name || 'Company'}
              </p>

              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-semibold">
                  {job.job_type}
                </span>
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                  📍 {job.location_country}
                  {job.location_city && `, ${job.location_city}`}
                </span>
                {job.category && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                    💼 {job.category}
                  </span>
                )}
                {job.salary_range && (
                  <span className="px-4 py-2 bg-green-50 text-green-600 rounded-full font-semibold">
                    💰 {job.salary_range}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="border-t pt-6">
            <Link
              href={`/jobs/${job.id}/apply`}
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center w-full sm:w-auto"
            >
              Apply Now
            </Link>
            <button className="ml-4 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition">
              Save Job
            </button>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">Job Description</h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Job Details Sidebar */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-4">Job Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="font-semibold text-gray-700">Posted</span>
              <span className="text-gray-600">
                {new Date(job.posted_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="font-semibold text-gray-700">Job Type</span>
              <span className="text-gray-600">{job.job_type}</span>
            </div>

            {job.category && (
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold text-gray-700">Specialty</span>
                <span className="text-gray-600">{job.category}</span>
              </div>
            )}

            <div className="flex justify-between py-3 border-b">
              <span className="font-semibold text-gray-700">Location</span>
              <span className="text-gray-600">
                {job.location_country}
                {job.location_city && `, ${job.location_city}`}
              </span>
            </div>

            {job.salary_range && (
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold text-gray-700">Salary</span>
                <span className="text-gray-600">{job.salary_range}</span>
              </div>
            )}

            <div className="flex justify-between py-3">
              <span className="font-semibold text-gray-700">Views</span>
              <span className="text-gray-600">{job.view_count} views</span>
            </div>
          </div>
        </div>

        {/* Company Info */}
        {job.employer && (
          <div className="bg-white rounded-xl shadow-sm p-8 mt-6">
            <h2 className="text-2xl font-bold mb-4">About the Company</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-blue-600 text-xl flex-shrink-0">
                {job.employer.company_name?.substring(0, 2).toUpperCase() || 'CO'}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {job.employer.company_name || 'Company'}
                </h3>
                {job.employer.company_description && (
                  <p className="text-gray-600">{job.employer.company_description}</p>
                )}
                {job.employer.location && (
                  <p className="text-gray-500 mt-2">📍 {job.employer.location}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Similar Jobs */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Similar Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* We'll fetch similar jobs later */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              More jobs coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}