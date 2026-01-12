'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'candidate' | 'employer'>('candidate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const companyName = formData.get('companyName') as string

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            user_type: userType,
            company_name: userType === 'employer' ? companyName : null,
          })

        if (profileError) throw profileError

        setSuccess(true)
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            OsteoJob
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Join thousands of osteopaths worldwide
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Account Created!
              </h3>
              <p className="text-gray-600 mb-4">
                Check your email to verify your account.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* User Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('candidate')}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      userType === 'candidate'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    👤 Candidate
                    <div className="text-xs font-normal mt-1 text-gray-600">
                      Looking for jobs
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('employer')}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      userType === 'employer'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    🏢 Employer
                    <div className="text-xs font-normal mt-1 text-gray-600">
                      Hiring osteopaths
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                {userType === 'employer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Your Practice Name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    At least 6 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link href="/auth/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}