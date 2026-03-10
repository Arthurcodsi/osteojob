'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HeaderNav() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="OsteoJob" className="h-14" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/jobs" className="text-gray-700 hover:text-[#4b8ec2] font-semibold text-lg transition">
            Jobs
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-[#4b8ec2] font-semibold text-lg transition">
            About
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-[#4b8ec2] font-semibold text-lg transition">
            Contact
          </Link>
          <Link href="/post-job" className="bg-[#32487A] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#4b8ec2] transition text-base">
            Post a Job
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-700 hover:text-[#4b8ec2]"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-[#32487A] text-white rounded-full flex items-center justify-center font-semibold">
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-gray-700 hidden sm:block">
                  {profile?.full_name || user.email}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-[#4b8ec2] mt-1 capitalize">{profile?.user_type} Account</p>
                    </div>

                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>
                      📊 Dashboard
                    </Link>

                    {profile?.user_type === 'employer' && (
                      <Link href="/post-job" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>
                        ➕ Post Job
                      </Link>
                    )}

                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>
                      ⚙️ Settings
                    </Link>

                    <Link href="/account/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>
                      🔒 Change Password
                    </Link>

                    <hr className="my-2" />

                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-700 hover:text-[#4b8ec2] font-medium transition">
                Login
              </Link>
              <Link href="/auth/signup" className="bg-[#32487A] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#4b8ec2] transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-4 space-y-3">
            <Link href="/jobs" className="block text-gray-700 hover:text-[#4b8ec2] font-semibold text-lg transition py-2" onClick={() => setShowMobileMenu(false)}>
              Jobs
            </Link>
            <Link href="/about" className="block text-gray-700 hover:text-[#4b8ec2] font-semibold text-lg transition py-2" onClick={() => setShowMobileMenu(false)}>
              About
            </Link>
            <Link href="/contact" className="block text-gray-700 hover:text-[#4b8ec2] font-semibold text-lg transition py-2" onClick={() => setShowMobileMenu(false)}>
              Contact
            </Link>
            <Link href="/post-job" className="block bg-[#32487A] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#4b8ec2] transition text-center" onClick={() => setShowMobileMenu(false)}>
              Post a Job
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
