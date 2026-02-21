'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Job } from '@/lib/supabase'

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [jobId, setJobId] = useState<string>('')
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)

  useEffect(() => {
    const init = async () => {
      const { id } = await params
      setJobId(id)
      await checkUserAndFetchJob(id)
    }
    init()
  }, [])

  const checkUserAndFetchJob = async (id: string) => {
    try {
      // Check if user is logged in
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push(`/auth/login?redirect=/jobs/${id}/apply`)
        return
      }

      setUser(authUser)

      // Fetch job details
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, employer:profiles(*)')
        .eq('id', id)
        .single()

      setJob(jobData)
    } catch (err) {
      console.error('Error:', err)
      setError('Could not load job details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      let cvUrl: string | null = null

      // Upload CV if provided
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, cvFile)

        if (uploadError) throw new Error(`CV upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName)

        cvUrl = publicUrl
      }

      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          candidate_id: user.id,
          applicant_name: formData.get('name') as string,
          applicant_email: formData.get('email') as string,
          applicant_phone: formData.get('phone') as string,
          cover_letter: formData.get('coverLetter') as string,
          cv_url: cvUrl,
          status: 'pending'
        })

      if (insertError) throw insertError

      setSuccess(true)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (err: any) {
      setError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            Back to jobs
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your application for <strong>{job.title}</strong> has been sent to the employer.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You'll receive updates via email. Redirecting to your dashboard...
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          ← Back to job
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Apply for this position</h1>
          <p className="text-xl text-gray-600 mb-4">{job.title}</p>
          <p className="text-gray-600">
            {job.employer?.company_name} • {job.location_country}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                defaultValue={user?.email}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="+44 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CV / Resume *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                required
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 file:font-semibold hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                PDF, DOC or DOCX — max 5MB
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cover Letter *
              </label>
              <textarea
                name="coverLetter"
                required
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Tell the employer why you're interested in this position..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Explain your relevant experience and why you'd be a great fit
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📧 Your application will be sent directly to the employer's email.
                They will contact you if you're a good fit for the role.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link
                href={`/jobs/${jobId}`}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}