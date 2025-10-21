import type { DayRecord } from '../types'

const API_URL = (import.meta as any).env?.VITE_GAS_URL as string | undefined

async function request(action: string, body?: any) {
  if (!API_URL) throw new Error('Не задан VITE_GAS_URL')

  const res = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : '{}',
  })

  const data = await res.json()
  if (!data.ok) throw new Error(data.error || data.message || 'Ошибка запроса')
  return data
}

/** Сохранить день */
export async function saveDay(record: DayRecord): Promise<void> {
  await request('saveDay', { record })
}

/** Удалить день */
export async function deleteDay(date: string): Promise<void> {
  await request('deleteDay', { date })
}

/** Получить день */
export async function getDay(date: string): Promise<DayRecord | null> {
  const data = await request('getDay', { date })
  return data.record ?? null
}

/** Получить все дни */
export async function getAllDays(): Promise<DayRecord[]> {
  const data = await request('getAllDays')
  return data.records ?? []
}
