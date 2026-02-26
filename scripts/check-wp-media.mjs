import https from 'https'

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

const ids = [15277, 14898, 14830, 14788, 14746, 14528, 14523]

for (const id of ids) {
  const job = await get(`https://osteojob.com/wp-json/wp/v2/job_listing/${id}?_fields=id,title,featured_media`)
  const title = job.title?.rendered || job.title
  const mediaId = job.featured_media

  if (mediaId && mediaId !== 0) {
    const media = await get(`https://osteojob.com/wp-json/wp/v2/media/${mediaId}?_fields=id,source_url`)
    console.log(`${id} | ${title} | MEDIA: ${media.source_url}`)
  } else {
    console.log(`${id} | ${title} | no featured media`)
  }
}
