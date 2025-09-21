import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!Array.isArray(body.links)) {
    throw createError({ status: 400, message: 'Expected { links: [] }' })
  }

  const kv = event.context.cloudflare.env.KV as KVNamespace
  const now = Math.floor(Date.now() / 1000)

  const results: any[] = []

  for (const { slug, url, comment } of body.links) {
    if (!slug || !url) continue

    const key = `link:${slug}`
    const id = nanoid(10)

    const linkData = {
      id,
      url,
      slug,
      createdAt: now,
      updatedAt: now,
      comment: comment || '',
    }

    await kv.put(key, JSON.stringify(linkData))
    results.push(linkData)
  }

  return { success: true, count: results.length, links: results }
})
