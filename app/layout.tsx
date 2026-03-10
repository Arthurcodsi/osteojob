import type { Metadata } from 'next'
import Link from 'next/link'
import HeaderNav from './components/HeaderNav'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://osteojob.com'),
  title: {
    default: 'OsteoJob — Osteopath Jobs Worldwide',
    template: '%s | OsteoJob',
  },
  description: 'The job board for osteopaths. Find osteopathic positions worldwide or post a job at your clinic. Full time, part time, locum and associate roles.',
  keywords: ['osteopath jobs', 'osteopathy careers', 'osteopathic jobs', 'locum osteopath', 'associate osteopath', 'osteopath vacancy'],
  openGraph: {
    siteName: 'OsteoJob',
    type: 'website',
    locale: 'en_GB',
    images: [{ url: '/logo.png', width: 800, height: 200, alt: 'OsteoJob' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <HeaderNav />

        {children}

        <footer className="bg-gray-900 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-4">OsteoJob</h3>
              <p className="text-gray-400">
                Your trusted partner for osteopathic career opportunities worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-blue-400">For Candidates</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white transition">Browse Jobs</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">My Dashboard</Link></li>
                <li><Link href="/profile" className="hover:text-white transition">My Profile</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-blue-400">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/post-job" className="hover:text-white transition">Post a Job</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Employer Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-blue-400">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} OsteoJob Limited. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
