'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SaveJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkSaved()
  }, [jobId])

  const checkSaved = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('candidate_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    setSaved(!!data)
    setLoading(false)
  }

  const toggle = async () => {
    if (!userId) {
      router.push('/auth/login')
      return
    }

    if (saved) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('candidate_id', userId)
        .eq('job_id', jobId)
      setSaved(false)
    } else {
      await supabase
        .from('saved_jobs')
        .insert({ candidate_id: userId, job_id: jobId })
      setSaved(true)
    }
  }

  if (loading) {
    return (
      <button disabled className="ml-4 px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-400">
        Save Job
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`ml-4 px-6 py-3 border-2 rounded-lg font-semibold transition ${
        saved
          ? 'border-[#32487A] bg-[#dce8f5] text-[#32487A]'
          : 'border-gray-300 text-gray-700 hover:border-[#4b8ec2] hover:text-[#32487A]'
      }`}
    >
      {saved ? '★ Saved' : '☆ Save Job'}
    </button>
  )
}
