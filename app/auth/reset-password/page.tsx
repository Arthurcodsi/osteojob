'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    // Handle the password recovery flow
    const handlePasswordRecovery = async () => {
      try {
        // Check for error in URL params first
        const errorDescription = searchParams.get('error_description')
        const errorCode = searchParams.get('error_code')

        if (errorDescription || errorCode) {
          setDebugInfo(`Error in URL: ${errorDescription || errorCode}`)
          setError(errorDescription || 'Invalid or expired reset link')
          setTokenValid(false)
          return
        }

        // Check if we have hash fragments (access_token, refresh_token, etc.)
        // Supabase sends these in the URL hash after clicking the email link
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        setDebugInfo(`Hash params - type: ${type}, has access_token: ${!!accessToken}, has refresh_token: ${!!refreshToken}`)

        // If we have an access token and it's a recovery type, set the session
        if (accessToken && type === 'recovery') {
          console.log('Setting session with recovery token...')

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError(`Failed to validate reset token: ${sessionError.message}`)
            setTokenValid(false)
            return
          }

          if (data.session) {
            console.log('Session established successfully')
            setTokenValid(true)
          } else {
            setError('Failed to establish session')
            setTokenValid(false)
          }
          return
        }

        // Check if we already have a valid session (e.g., user refreshed the page)
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()

        if (sessionCheckError) {
          console.error('Session check error:', sessionCheckError)
          setError(`Session validation failed: ${sessionCheckError.message}`)
          setTokenValid(false)
          return
        }

        if (session) {
          console.log('Valid session found')
          setTokenValid(true)
        } else {
          console.log('No valid session or token found')
          setError('No valid reset token found. Please request a new password reset link.')
          setTokenValid(false)
        }
      } catch (err: any) {
        console.error('Unexpected error in handlePasswordRecovery:', err)
        setError(`Unexpected error: ${err.message}`)
        setTokenValid(false)
      }
    }

    handlePasswordRecovery()
  }, [searchParams])

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      // Sign out the user after password reset
      await supabase.auth.signOut()

      // Redirect to login with success message
      router.push('/auth/login?message=password-reset-success')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-blue-600">
              OsteoJob
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Reset Link Invalid
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {error || 'This password reset link is invalid or has expired. Please request a new one.'}
              </p>
              {debugInfo && (
                <p className="text-xs text-gray-500 mt-2 font-mono">{debugInfo}</p>
              )}
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/forgot-password"
                className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            OsteoJob
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              Password must be at least 6 characters long
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
