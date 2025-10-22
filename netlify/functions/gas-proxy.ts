import type { Handler } from '@netlify/functions'

const GAS_URL = process.env.GAS_URL as string | undefined

export const handler: Handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // --- CORS preflight ---
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  try {
    if (!GAS_URL) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: 'Missing GAS_URL environment variable' }),
      }
    }

    // --- Получаем action ---
    const queryAction = event.queryStringParameters?.action
    let parsed: Record<string, any> = {}
    try {
      parsed = JSON.parse(event.body || '{}')
    } catch {
      parsed = {}
    }

    const action = queryAction || parsed.action
    const body: Record<string, any> = { ...parsed }
    delete body.action

    if (!action) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: 'Missing "action" parameter' }),
      }
    }

    // --- Пробрасываем запрос в GAS ---
    const gasResponse = await fetch(`${GAS_URL}?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const rawText = await gasResponse.text()
    let json: any

    try {
      json = JSON.parse(rawText)
    } catch {
      // Если GAS отдал HTML (например, 403 или Exception), оборачиваем безопасно
      json = {
        ok: false,
        error: 'Invalid JSON from GAS',
        rawSnippet: rawText.slice(0, 200), // обрезаем, чтобы не ломать JSON
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(json),
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: false,
        error: err?.message || 'Unhandled server error',
      }),
    }
  }
}
