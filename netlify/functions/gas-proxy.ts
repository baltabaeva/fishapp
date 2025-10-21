import type { Handler } from '@netlify/functions'

const GAS_URL = process.env.GAS_URL as string | undefined

export const handler: Handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' }

  try {
    if (!GAS_URL) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: 'Missing GAS_URL env var' }),
      }
    }

    const queryAction = event.queryStringParameters?.action
    const parsed = (() => { try { return JSON.parse(event.body || '{}') } catch { return {} } })() as any
    const action = queryAction || parsed.action
    const body: any = { ...parsed }
    delete body.action
    if (!action)
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Missing action' }) }

    const res = await fetch(`${GAS_URL}?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = { ok: false, error: 'Invalid JSON from GAS', raw: text } }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: err?.message || 'Server error' }),
    }
  }
}
