'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PostJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login?redirect=/post-job')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileData?.user_type !== 'employer') {
        router.push('/dashboard')
        return
      }

      setUser(authUser)
      setProfile(profileData)
    } catch (err) {
      console.error('Error:', err)
      router.push('/auth/login')
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
      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          employer_id: user.id,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          job_type: formData.get('jobType') as string,
          category: formData.get('category') as string,
          location_country: formData.get('country') as string,
          location_city: formData.get('city') as string,
          salary_range: formData.get('salary') as string,
          status: 'active',
          posted_date: new Date().toISOString(),
        })

      if (insertError) throw insertError

      // Redirect to dashboard
      router.push('/dashboard?success=job_posted')
      
    } catch (err: any) {
      setError(err.message || 'Failed to post job')
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Post a New Job</h1>
          <p className="text-xl text-gray-600">
            Find the perfect osteopath for your practice
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g. Associate Osteopath"
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                name="jobType"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Select type...</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Locum">Locum</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            {/* Category/Specialty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Specialty
              </label>
              <select
                name="category"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="All Specialties">All Specialties</option>
                <option value="Structural">Structural</option>
                <option value="Cranial">Cranial</option>
                <option value="Visceral">Visceral</option>
                <option value="Pediatric">Pediatric</option>
                <option value="Sports">Sports</option>
                <option value="Functional">Functional</option>
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select country...</option>
                  <option value="Australia">Australia</option>
                  <option value="Barbados">Barbados</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Cambodia">Cambodia</option>
                  <option value="Canada">Canada</option>
                  <option value="Caribbean">Caribbean</option>
                  <option value="China">China</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Gibraltar">Gibraltar</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Iceland">Iceland</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Italy">Italy</option>
                  <option value="Malta">Malta</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Oman">Oman</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Seychelles">Seychelles</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Spain">Spain</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Thailand">Thailand</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g. London"
                />
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                name="salary"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g. £30,000 - £45,000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional - helps attract the right candidates
              </p>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                required
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Describe the role, responsibilities, requirements, and what makes your practice a great place to work..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Be detailed - good descriptions attract better candidates
              </p>
            </div>

            {/* Company Info Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">
                📋 Job will be posted by:
              </p>
              <p className="text-sm text-blue-700">
                {profile?.company_name || 'Your Company'}
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Posting Job...' : 'Post Job'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition text-center"
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