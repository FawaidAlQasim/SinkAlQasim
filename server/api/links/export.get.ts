export default defineEventHandler(async (event) => {
  const kv = event.context.cloudflare.env.KV as KVNamespace
  const keys = await kv.list({ prefix: 'link:' })
  const rows: any[] = []

  for (const key of keys.keys) {
    const val = await kv.get(key.name)
    if (val) {
      const obj = JSON.parse(val)
      rows.push({
        slug: obj.slug,
        url: obj.url,
        comment: obj.comment || '',
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt
      })
    }
  }

  const header = "slug,url,comment,createdAt,updatedAt\n"
  const csv = header + rows.map(r => 
    `"${r.slug}","${r.url}","${r.comment.replace(/"/g, '""')}","${r.createdAt}","${r.updatedAt}"`
  ).join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=links_export.csv"
    }
  })
})
