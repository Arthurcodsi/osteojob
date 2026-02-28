'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditJobPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const [form, setForm] = useState({
    title: '',
    jobType: '',
    category: 'All Specialties',
    country: '',
    city: '',
    salary: '',
    description: '',
    featuredImage: '',
  })

  useEffect(() => {
    loadJob()
  }, [id])

  const loadJob = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push('/auth/login'); return }

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (jobError || !job) { router.push('/dashboard'); return }

      // Make sure this employer owns the job
      if (job.employer_id !== user.id) { router.push('/dashboard'); return }

      setForm({
        title: job.title || '',
        jobType: job.job_type || '',
        category: job.category || 'All Specialties',
        country: job.location_country || '',
        city: job.location_city || '',
        salary: job.salary_range || '',
        description: job.description || '',
        featuredImage: job.featured_image || '',
      })
      if (job.featured_image) setImagePreview(job.featured_image)
    } catch (err) {
      console.error(err)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      let imageUrl = form.featuredImage

      // Upload new image if one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('job-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('job-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          title: form.title,
          description: form.description,
          job_type: form.jobType,
          category: form.category,
          location_country: form.country,
          location_city: form.city,
          salary_range: form.salary,
          featured_image: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('employer_id', user.id)

      if (updateError) throw updateError

      router.push('/dashboard?success=job_updated')
    } catch (err: any) {
      setError(err.message || 'Failed to update job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading job...</p>
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
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Edit Job</h1>
          <p className="text-xl text-gray-800">Update your job listing</p>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Job Title *</label>
              <input
                type="text"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                placeholder="e.g. Associate Osteopath"
              />
            </div>

            {/* Job Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Job Image (Optional)</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                  />
                  <p className="text-sm text-gray-700 mt-1">Upload a new image to replace the current one (JPG, PNG, max 5MB)</p>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Job Type *</label>
              <select
                name="jobType"
                required
                value={form.jobType}
                onChange={handleChange}
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Specialty</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Country *</label>
                <select
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                  placeholder="e.g. London"
                />
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Salary Range</label>
              <input
                type="text"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                placeholder="e.g. £30,000 - £45,000"
              />
              <p className="text-sm text-gray-700 mt-1">Optional — helps attract the right candidates</p>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Job Description *</label>
              <textarea
                name="description"
                required
                rows={12}
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
                placeholder="Describe the role, responsibilities, requirements..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#32487A] text-white py-3 rounded-full font-semibold hover:bg-[#4b8ec2] transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
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
