'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="bg-white rounded-[25px] shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-semibold">✓ Message sent successfully!</p>
          <p className="text-green-600 text-sm">We'll get back to you within 24 hours.</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">✗ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Your Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
              placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
              placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Subject *</label>
          <select name="subject" required value={formData.subject} onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900">
            <option value="">Select a subject...</option>
            <option value="general">General Inquiry</option>
            <option value="job-posting">Job Posting Question</option>
            <option value="account">Account Support</option>
            <option value="technical">Technical Issue</option>
            <option value="partnership">Partnership Opportunity</option>
            <option value="feedback">Feedback</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Message *</label>
          <textarea name="message" required value={formData.message} onChange={handleChange} rows={6}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4b8ec2] text-gray-900"
            placeholder="Tell us how we can help..." />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full bg-[#32487A] text-white py-3 rounded-full font-semibold hover:bg-[#4b8ec2] transition disabled:opacity-50">
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
