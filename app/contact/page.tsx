import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact OsteoJob',
  description: "Get in touch with the OsteoJob team. We're here to help with job postings, account questions and anything else.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f0f6ff] text-gray-900">
      <section className="text-white py-20 px-4" style={{ background: 'linear-gradient(135deg, #2d436f 0%, #3a5a9b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-95">We&apos;re here to help. Get in touch with our team.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[25px] shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#dce8f5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:contact@osteojob.com" className="text-[#32487A] hover:underline">contact@osteojob.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#dce8f5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-gray-900">RM 1104, Crawford House<br />Hong Kong</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#dce8f5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">⏰</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-gray-900">Monday - Friday<br />9:00 AM - 6:00 PM (HKT)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#F5F7FC] rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/jobs" className="text-[#32487A] hover:underline">Browse Jobs</Link></li>
                <li><Link href="/post-job" className="text-[#32487A] hover:underline">Post a Job</Link></li>
                <li><Link href="/about" className="text-[#32487A] hover:underline">About Us</Link></li>
                <li><Link href="/terms" className="text-[#32487A] hover:underline">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>

      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">How do I post a job?</h3>
              <p className="text-gray-900">Create an employer account, then click &quot;Post Job&quot; in the header. Fill out the job details and your listing will go live immediately.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">How much does it cost?</h3>
              <p className="text-gray-900">Browsing jobs and creating a candidate account is completely free. Job posting prices vary based on duration and features. Contact us for current pricing.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">How do I apply for jobs?</h3>
              <p className="text-gray-900">Create a candidate account, browse jobs, and click &quot;Apply Now&quot; on any position. Your application goes directly to the employer.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Can I edit my job posting?</h3>
              <p className="text-gray-900">Yes! Log in to your dashboard, find your job listing, and click &quot;Edit&quot; to make changes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
