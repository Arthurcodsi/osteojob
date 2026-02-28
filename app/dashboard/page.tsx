'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Job, Application } from '@/lib/supabase'

function SuccessBanner() {
  const searchParams = useSearchParams()
  const successParam = searchParams.get('success')
  if (!successParam) return null
  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-[15px] text-green-700 font-semibold">
      {successParam === 'job_posted' && '✓ Your job has been posted successfully!'}
      {successParam === 'job_updated' && '✓ Your job has been updated successfully!'}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
const [employerApplications, setEmployerApplications] = useState<Application[]>([])
  const [showApplications, setShowApplications] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

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

          // Fetch all applications for this employer's jobs
          if (jobsData && jobsData.length > 0) {
            const jobIds = jobsData.map((j) => j.id)
            const { data: empApps } = await supabase
              .from('applications')
              .select('*, job:jobs(*)')
              .in('job_id', jobIds)
              .order('applied_at', { ascending: false })
            setEmployerApplications(empApps || [])
          }
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
      <div className="min-h-screen bg-[#f0f6ff] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-800">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f0f6ff] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[25px] shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile.full_name}! 👋
              </h1>
              <p className="text-gray-800 mt-1">
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
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:border-[#4b8ec2] transition"
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

        {/* Success banner */}
        <Suspense fallback={null}>
          <SuccessBanner />
        </Suspense>

        {/* Employer Dashboard */}
        {profile.user_type === 'employer' && (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link
                href="/post-job"
                className="bg-[#32487A] text-white p-6 rounded-[25px] shadow-sm hover:bg-[#4b8ec2] transition text-center"
              >
                <div className="text-3xl mb-2">➕</div>
                <div className="font-semibold">Post New Job</div>
              </Link>

              <div className="bg-white p-6 rounded-[25px] shadow-sm text-center">
                <div className="text-3xl font-bold text-[#32487A] mb-2">
                  {jobs.length}
                </div>
                <div className="text-gray-800">Active Jobs</div>
              </div>

              <button
                onClick={() => setShowApplications((v) => !v)}
                className="bg-white p-6 rounded-[25px] shadow-sm text-center border-2 border-transparent hover:border-[#4b8ec2] hover:shadow-md active:scale-95 transition-all cursor-pointer w-full group"
              >
                <div className="text-3xl font-bold text-[#32487A] mb-2">
                  {jobs.reduce((sum, job) => sum + job.application_count, 0)}
                </div>
                <div className="text-gray-800 flex items-center justify-center gap-1">
                  Total Applications
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dce8f5] text-[#32487A] text-xs font-bold group-hover:bg-[#4b8ec2] group-hover:text-white transition-colors">
                    {showApplications ? '▲' : '▼'}
                  </span>
                </div>
              </button>
            </div>

            {/* Your Jobs */}
            <div className="bg-white rounded-[25px] shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Your Job Listings</h2>

              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#4b8ec2] transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-gray-800">
                            {job.location_country} • {job.job_type}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-700">
                            <span>{job.view_count} views</span>
                            <span>{job.application_count} applications</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold hover:border-[#4b8ec2]"
                          >
                            View
                          </Link>
                          <Link
                            href={`/jobs/${job.id}/edit`}
                            className="px-4 py-2 border-2 border-[#4b8ec2] text-[#32487A] rounded-lg text-sm font-semibold hover:bg-[#dce8f5] transition"
                          >
                            Edit
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
                <div className="text-center py-12 text-gray-700">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="mb-4">You haven't posted any jobs yet</p>
                  <Link
                    href="/post-job"
                    className="inline-block bg-[#32487A] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4b8ec2]"
                  >
                    Post Your First Job
                  </Link>
                </div>
              )}
            </div>

            {/* All Applications Panel */}
            {showApplications && (
              <div className="bg-white rounded-[25px] shadow-sm p-6 mt-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">All Applications</h2>

                {employerApplications.length > 0 ? (
                  <div className="space-y-4">
                    {employerApplications.map((app) => (
                      <div key={app.id} className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{app.applicant_name}</div>
                            <div className="text-sm text-gray-700 mt-0.5">
                              <a href={`mailto:${app.applicant_email}`} className="hover:underline text-[#32487A]">
                                {app.applicant_email}
                              </a>
                              {app.applicant_phone && (
                                <span className="ml-3 text-gray-600">{app.applicant_phone}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              For: <span className="font-medium text-gray-700">{app.job?.title}</span>
                            </div>
                            {app.cover_letter && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-2">{app.cover_letter}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              Applied {new Date(app.applied_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                app.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : app.status === 'shortlisted'
                                  ? 'bg-green-100 text-green-700'
                                  : app.status === 'reviewed'
                                  ? 'bg-[#dce8f5] text-[#32487A]'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {app.status}
                            </span>
                            {app.cv_url && (
                              <a
                                href={app.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-[#32487A] border-2 border-[#32487A] px-3 py-1 rounded-lg hover:bg-[#dce8f5] transition"
                              >
                                View CV
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No applications yet.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Candidate Dashboard */}
        {profile.user_type === 'candidate' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link
                href="/jobs"
                className="bg-[#32487A] text-white p-6 rounded-[25px] shadow-sm hover:bg-[#4b8ec2] transition text-center"
              >
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-semibold">Browse Jobs</div>
              </Link>

              <div className="bg-white p-6 rounded-[25px] shadow-sm text-center">
                <div className="text-3xl font-bold text-[#32487A] mb-2">
                  {applications.length}
                </div>
                <div className="text-gray-800">Applications Sent</div>
              </div>

              <div className="bg-white p-6 rounded-[25px] shadow-sm text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {applications.filter(a => a.status === 'shortlisted').length}
                </div>
                <div className="text-gray-800">Shortlisted</div>
              </div>
            </div>

            {/* Your Applications */}
            <div className="bg-white rounded-[25px] shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Your Applications</h2>

              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="border-2 border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.job?.title}
                          </h3>
                          <p className="text-gray-800">
                            {app.job?.location_country}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">
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
                              ? 'bg-[#dce8f5] text-[#32487A]'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-700">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="mb-4">You haven't applied to any jobs yet</p>
                  <Link
                    href="/jobs"
                    className="inline-block bg-[#32487A] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4b8ec2]"
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