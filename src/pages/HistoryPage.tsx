import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { DayRecord } from '../types'
import { saveDay, deleteDay as apiDeleteDay } from '../api/saveToGoogle'

function num(v: string) {
  const n = Number((v || '').toString().replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

function formatDateRU(dateStr: string): string {
  // Пытаемся красиво вывести дату в формате DD.MM.YYYY
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('ru-RU')
  } catch {}
  return dateStr
}

function recalcTotals(r: DayRecord): DayRecord {
  const totalKg = (r.sales || []).reduce((s, it) => s + (Number(it.kg) || 0), 0)
  const totalSales = (r.sales || []).reduce((s, it) => s + (Number(it.kg) || 0) * (Number(it.price) || 0), 0)
  const totalExpenses = (r.expenses || []).reduce((s, it) => s + (Number(it.amount) || 0), 0)
  const profit = totalSales - totalExpenses
  const earnings15 = totalSales * 0.15
  return { ...r, totalKg, totalSales, totalExpenses, profit, earnings15 }
}

export default function HistoryPage() {
  const { allDays, loadAllDays } = useApp()
  const [editable, setEditable] = useState<Record<string, DayRecord>>({})
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // локальная редактируемая копия
  useEffect(() => {
    const map: Record<string, DayRecord> = {}
    const seen: Record<string, number> = {}
    for (const d of allDays) {
      const base = d.date
      const n = (seen[base] = (seen[base] || 0) + 1)
      const key = n === 1 ? base : `${base}#${n}`
      map[key] = JSON.parse(JSON.stringify(d))
    }
    setEditable(map)
    setExpanded({})
  }, [allDays])

  const dates = useMemo(() => Object.keys(editable).sort((a, b) => {
    const [da] = a.split('#')
    const [db] = b.split('#')
    if (da !== db) return db.localeCompare(da)
    // preserve order of appearance by numeric suffix
    const ia = Number(a.split('#')[1] || 1)
    const ib = Number(b.split('#')[1] || 1)
    return ia - ib
  }), [editable])

  const setRec = (key: string, patch: Partial<DayRecord>) => {
    setEditable((m) => ({ ...m, [key]: recalcTotals({ ...(m[key] || { date: key.split('#')[0], sales: [], expenses: [], totalKg: 0, totalSales: 0, totalExpenses: 0, profit: 0, earnings15: 0 }), ...patch }) }))
  }


  const addSaleRow = (key: string) => {
    const r = editable[key]
    setRec(key, { sales: [...(r.sales || []), { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), kg: 0, price: 0, total: 0 }] })
  }
  const updateSaleRow = (key: string, idx: number, field: 'kg' | 'price', value: number) => {
    const r = editable[key]
    const next = [...(r.sales || [])]
    const item = { ...next[idx], [field]: value }
    item.total = (Number(item.kg) || 0) * (Number(item.price) || 0)
    next[idx] = item
    setRec(key, { sales: next })
  }
  const deleteSaleRow = (key: string, idx: number) => {
    const r = editable[key]
    const next = [...(r.sales || [])]
    next.splice(idx, 1)
    setRec(key, { sales: next })
  }

  const addExpenseRow = (key: string) => {
    const r = editable[key]
    setRec(key, { expenses: [...(r.expenses || []), { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), category: 'Без категории', amount: 0 }] })
  }
  const updateExpenseRow = (key: string, idx: number, field: 'category' | 'amount', value: string | number) => {
    const r = editable[key]
    const next = [...(r.expenses || [])]
    const item: any = { ...next[idx] }
    item[field] = field === 'amount' ? Number(value) || 0 : String(value)
    next[idx] = item
    setRec(key, { expenses: next })
  }
  const deleteExpenseRow = (key: string, idx: number) => {
    const r = editable[key]
    const next = [...(r.expenses || [])]
    next.splice(idx, 1)
    setRec(key, { expenses: next })
  }

  const handleSaveDay = async (key: string) => {
    const rec = recalcTotals(editable[key])
    const date = key.split('#')[0]
    setSavingMap((m) => ({ ...m, [key]: true }))
    try {
      // если и продажи, и расходы пустые — удалить строку
      if ((rec.sales?.length || 0) === 0 && (rec.expenses?.length || 0) === 0) {
        await apiDeleteDay(date)
      } else {
        await saveDay({ ...rec, date })
      }
      await loadAllDays()
    } finally {
      setSavingMap((m) => ({ ...m, [key]: false }))
    }
  }

  const toggleExpand = (key: string) => setExpanded((m) => ({ ...m, [key]: !m[key] }))
  const handleDeleteDay = async (key: string) => {
    const date = key.split('#')[0]
    setSavingMap((m) => ({ ...m, [key]: true }))
    try {
      await apiDeleteDay(date)
      await loadAllDays()
    } finally {
      setSavingMap((m) => ({ ...m, [key]: false }))
    }
  }

  if (dates.length === 0) {
    return <div className="text-sm text-gray-500">Нет сохранённых дней</div>
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const d = editable[date]
        return (
          <div key={date} className="card animate-fadeIn ring-1 ring-black/5" data-date={date}>
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="text-lg font-semibold flex items-center justify-between">
                <span>{formatDateRU(d.date)}</span>
                <button onClick={() => handleDeleteDay(date)} className="text-red-500 hover:text-red-600 text-sm">🗑️ Удалить день</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-gray-200 px-3 py-2">Кг: <strong>{(d.totalKg || 0).toLocaleString('ru-RU')}</strong></div>
                <div className="rounded-xl border border-gray-200 px-3 py-2">Продажи: <strong>{(d.totalSales || 0).toLocaleString('ru-RU')} ₸</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-gray-200 px-3 py-2">Расходы: <strong>{(d.totalExpenses || 0).toLocaleString('ru-RU')} ₸</strong></div>
                <div className="rounded-xl border border-gray-200 px-3 py-2">Прибыль: <strong>{(d.profit || 0).toLocaleString('ru-RU')} ₸</strong></div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => toggleExpand(date)} className="btn btn-lg w-full">{expanded[date] ? 'Скрыть' : '✏️ Редактировать'}</button>
                <button onClick={() => handleSaveDay(date)} disabled={!!savingMap[date]} className="btn btn-lg w-full disabled:opacity-60">{savingMap[date] ? 'Сохранение…' : '💾 Сохранить день'}</button>
              </div>
            </div>

            {expanded[date] && <>
            <div className="section-title text-sm">Продажи</div>
            <div className="space-y-2">
              {(d.sales || []).map((s, idx) => (
                <div key={s.id || idx} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Кг</div>
                      <input
                        inputMode="decimal"
                        value={String(s.kg)}
                        onChange={(e) => updateSaleRow(date, idx, 'kg', num(e.target.value))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Цена/кг</div>
                      <input
                        inputMode="decimal"
                        value={String(s.price)}
                        onChange={(e) => updateSaleRow(date, idx, 'price', num(e.target.value))}
                        className="input w-full"
                      />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs text-gray-500 mb-1">Сумма</div>
                      <div className="rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50">{(s.kg * s.price).toLocaleString('ru-RU')}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <button onClick={() => deleteSaleRow(date, idx)} className="text-red-600 hover:underline text-sm">🗑️ Удалить</button>
                  </div>
                </div>
              ))}
              <button onClick={() => addSaleRow(date)} className="w-full btn btn-lg">+ Добавить продажу</button>
            </div>

            <div className="mt-4 section-title text-sm">Расходы</div>
            <div className="space-y-2">
              {(d.expenses || []).map((e, idx) => (
                <div key={e.id || idx} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Категория</div>
                      <input
                        value={String(e.category)}
                        onChange={(ev) => updateExpenseRow(date, idx, 'category', ev.target.value)}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Сумма</div>
                      <input
                        inputMode="decimal"
                        value={String(e.amount)}
                        onChange={(ev) => updateExpenseRow(date, idx, 'amount', num(ev.target.value))}
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <button onClick={() => deleteExpenseRow(date, idx)} className="text-red-600 hover:underline text-sm">🗑️ Удалить</button>
                  </div>
                </div>
              ))}
              <button onClick={() => addExpenseRow(date)} className="w-full btn btn-lg">+ Добавить расход</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-gray-200 px-3 py-2">Итого кг: <strong>{(d.totalKg || 0).toLocaleString('ru-RU')}</strong></div>
              <div className="rounded-xl border border-gray-200 px-3 py-2">Продажи: <strong>{(d.totalSales || 0).toLocaleString('ru-RU')} ₸</strong></div>
              <div className="rounded-xl border border-gray-200 px-3 py-2">Расходы: <strong>{(d.totalExpenses || 0).toLocaleString('ru-RU')} ₸</strong></div>
              <div className="rounded-xl border border-gray-200 px-3 py-2">Прибыль: <strong>{(d.profit || 0).toLocaleString('ru-RU')} ₸</strong></div>
              <div className="col-span-2 rounded-xl border border-gray-200 px-3 py-2">Заработок (15%): <strong>{(d.earnings15 || 0).toLocaleString('ru-RU')} ₸</strong></div>
            </div>
            </>}
          </div>
        )
      })}
    </div>
  )
}
