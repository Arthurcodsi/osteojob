import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, updated_at')
    .eq('status', 'active')

  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://osteojob.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://osteojob.com/jobs', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://osteojob.com/post-job', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://osteojob.com/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://osteojob.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://osteojob.com/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const jobPages: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `https://osteojob.com/jobs/${job.id}`,
    lastModified: new Date(job.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...jobPages]
}
