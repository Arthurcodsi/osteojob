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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [authStatus, setAuthStatus] = useState<'ok' | 'not-logged-in' | 'not-employer'>('ok')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setAuthStatus('not-logged-in')
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileData?.user_type !== 'employer') {
        setAuthStatus('not-employer')
        setLoading(false)
        return
      }

      setUser(authUser)
      setProfile(profileData)
    } catch (err) {
      console.error('Error:', err)
      setAuthStatus('not-logged-in')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchCityImage = async (city: string, country: string): Promise<string | null> => {
    const query = city || country
    if (!query) return null
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      )
      if (!res.ok) return null
      const data = await res.json()
      return data.thumbnail?.source || data.originalimage?.source || null
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('job-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('job-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      } else {
        // Fall back to a Wikipedia city photo
        const city = formData.get('city') as string
        const country = formData.get('country') as string
        imageUrl = await fetchCityImage(city, country)
      }

      // Insert job as pending (will be auto-approved or reviewed by admin)
      const { data: insertData, error: insertError } = await supabase
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
          featured_image: imageUrl,
          status: 'active',
          posted_date: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Notify admin and run auto-moderation (fire-and-forget)
      fetch('/api/notify-job-posted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: insertData?.id || '',
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          jobType: formData.get('jobType') as string,
          city: formData.get('city') as string,
          country: formData.get('country') as string,
          salary: formData.get('salary') as string,
          employerName: profile?.company_name || '',
          employerEmail: user?.email || '',
        }),
      }).catch(() => {/* non-critical, ignore errors */})

      router.push('/dashboard?success=job_pending')
      
    } catch (err: any) {
      setError(err.message || 'Failed to post job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (authStatus === 'not-logged-in') {
    return (
      <div className="min-h-screen bg-[#f0f6ff] flex items-center justify-center px-4">
        <div className="bg-white rounded-[25px] shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in as an employer to post a job.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login?redirect=/post-job"
              className="bg-[#32487A] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4b8ec2] transition"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup?type=employer"
              className="border-2 border-[#32487A] text-[#32487A] px-6 py-3 rounded-lg font-semibold hover:bg-[#F5F7FC] transition"
            >
              Create an employer account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (authStatus === 'not-employer') {
    return (
      <div className="min-h-screen bg-[#f0f6ff] flex items-center justify-center px-4">
        <div className="bg-white rounded-[25px] shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold mb-2">Employer account required</h2>
          <p className="text-gray-600 mb-6">
            You are currently signed in as a candidate. Posting jobs requires an employer account.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signup?type=employer"
              className="bg-[#32487A] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#4b8ec2] transition"
            >
              Create an employer account
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Back to my dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f6ff] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-[#32487A] hover:text-[#4b8ec2] mb-4 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Post a New Job</h1>
          <p className="text-xl text-gray-800">
            Find the perfect osteopath for your practice
          </p>
        </div>

        <div className="bg-white rounded-[25px] shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                placeholder="e.g. Associate Osteopath"
              />
            </div>

            {/* Job Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Image (Optional)
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                  />
                  <p className="text-sm text-gray-700 mt-1">
                    Upload a company logo or photo (JPG, PNG, max 5MB)
                  </p>
                </div>
                {imagePreview && (
                  <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Type *
              </label>
              <select
                name="jobType"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Specialty
              </label>
              <select
                name="category"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                  placeholder="e.g. London"
                />
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                name="salary"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                placeholder="e.g. £30,000 - £45,000"
              />
              <p className="text-sm text-gray-700 mt-1">
                Optional - helps attract the right candidates
              </p>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                required
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                placeholder="Describe the role, responsibilities, requirements, and what makes your practice a great place to work..."
              />
              <p className="text-sm text-gray-700 mt-1">
                Be detailed - good descriptions attract better candidates
              </p>
            </div>

            {/* Company Info Preview */}
            <div className="bg-[#F5F7FC] border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-[#2d436f] font-semibold mb-2">
                📋 Job will be posted by:
              </p>
              <p className="text-sm text-[#32487A]">
                {profile?.company_name || 'Your Company'}
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#32487A] text-white py-3 rounded-full font-semibold hover:bg-[#4b8ec2] transition disabled:opacity-50"
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