'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Job, Application } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)

        // Fetch user-specific data based on type
        if (profileData.user_type === 'employer') {
          // Fetch employer's jobs
          const { data: jobsData } = await supabase
            .from('jobs')
            .select('*')
            .eq('employer_id', user.id)
            .order('posted_date', { ascending: false })

          setJobs(jobsData || [])
        } else {
          // Fetch candidate's applications
          const { data: appsData } = await supabase
            .from('applications')
            .select('*, job:jobs(*)')
            .eq('candidate_id', user.id)
            .order('applied_at', { ascending: false })

          setApplications(appsData || [])
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) return

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== jobId))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile.full_name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {profile.user_type === 'employer' ? (
                  <>Managing jobs for {profile.company_name}</>
                ) : (
                  <>Your candidate dashboard</>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:border-blue-500 transition"
              >
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Employer Dashboard */}
        {profile.user_type === 'employer' && (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link
                href="/post-job"
                className="bg-blue-600 text-white p-6 rounded-xl shadow-sm hover:bg-blue-700 transition text-center"
              >
                <div className="text-3xl mb-2">➕</div>
                <div className="font-semibold">Post New Job</div>
              </Link>

              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {jobs.length}
                </div>
                <div className="text-gray-600">Active Jobs</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {jobs.reduce((sum, job) => sum + job.application_count, 0)}
                </div>
                <div className="text-gray-600">Total Applications</div>
              </div>
            </div>

            {/* Your Jobs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Your Job Listings</h2>

              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-gray-600">
                            {job.location_country} • {job.job_type}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>{job.view_count} views</span>
                            <span>{job.application_count} applications</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold hover:border-blue-500"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="mb-4">You haven't posted any jobs yet</p>
                  <Link
                    href="/post-job"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Post Your First Job
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* Candidate Dashboard */}
        {profile.user_type === 'candidate' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link
                href="/jobs"
                className="bg-blue-600 text-white p-6 rounded-xl shadow-sm hover:bg-blue-700 transition text-center"
              >
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-semibold">Browse Jobs</div>
              </Link>

              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {applications.length}
                </div>
                <div className="text-gray-600">Applications Sent</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {applications.filter(a => a.status === 'shortlisted').length}
                </div>
                <div className="text-gray-600">Shortlisted</div>
              </div>
            </div>

            {/* Your Applications */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Your Applications</h2>

              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="border-2 border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {app.job?.title}
                          </h3>
                          <p className="text-gray-600">
                            {app.job?.location_country}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            app.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : app.status === 'shortlisted'
                              ? 'bg-green-100 text-green-700'
                              : app.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="mb-4">You haven't applied to any jobs yet</p>
                  <Link
                    href="/jobs"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}