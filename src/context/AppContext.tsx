import { createContext, useContext, useMemo, useState } from 'react'
import type { DayRecord, Expense, Sale } from '../types'
import { saveDay, deleteDay } from '../api/saveToGoogle'
import { getDay, getAllDays } from '../api/getFromGoogle'

type AppState = {
  date: string
  sales: Sale[]
  expenses: Expense[]
  totalKg: number
  totalSales: number
  totalExpenses: number
  profit: number
  earnings15: number
  // period totals across all saved days
  periodTotalKg: number
  periodTotalSales: number
  periodTotalExpenses: number
  periodProfit: number
  periodEarnings15: number
  allDays: DayRecord[]
  setDate: (d: string) => void
  addSale: (s: Omit<Sale, 'id' | 'total'> & { kg: number; price: number }) => void
  updateSale: (id: string, patch: Partial<Pick<Sale, 'kg' | 'price'>>) => void
  deleteSale: (id: string) => void
  addExpense: (e: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void
  loadFromSheet: (date: string) => Promise<void>
  loadAllDays: () => Promise<void>
  saveToSheet: () => Promise<void>
  loading: boolean
}

const Ctx = createContext<AppState | null>(null)

function todayISO() {
  const d = new Date()
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 10)
}

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now()
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<string>(todayISO())
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [allDays, setAllDays] = useState<DayRecord[]>([])

  const totals = useMemo(() => {
    const totalKg = sales.reduce((s, it) => s + (Number(it.kg) || 0), 0)
    const totalSales = sales.reduce((s, it) => s + (Number(it.kg) || 0) * (Number(it.price) || 0), 0)
    const totalExpenses = expenses.reduce((s, it) => s + (Number(it.amount) || 0), 0)
    const profit = totalSales - totalExpenses
    const earnings15 = totalSales * 0.15
    return { totalKg, totalSales, totalExpenses, profit, earnings15 }
  }, [sales, expenses])

  const addSale: AppState['addSale'] = ({ kg, price }) => {
    const kgN = Number(kg) || 0
    const priceN = Number(price) || 0
    const total = kgN * priceN
    setSales((list) => [...list, { id: uid(), kg: kgN, price: priceN, total }])
  }

  const updateSale: AppState['updateSale'] = (id, patch) => {
    setSales((list) =>
      list.map((s) => {
        if (s.id !== id) return s
        const next = { ...s, ...patch }
        next.total = (Number(next.kg) || 0) * (Number(next.price) || 0)
        return next
      }),
    )
  }

  const deleteSale: AppState['deleteSale'] = (id) => {
    setSales((list) => list.filter((s) => s.id !== id))
  }

  const addExpense: AppState['addExpense'] = ({ category, amount }) => {
    const amt = Number(amount) || 0
    setExpenses((list) => [...list, { id: uid(), category: category?.trim() || 'Без категории', amount: amt }])
  }

  const deleteExpense: AppState['deleteExpense'] = (id) => {
    setExpenses((list) => list.filter((e) => e.id !== id))
  }

  const loadFromSheet: AppState['loadFromSheet'] = async (d) => {
    setLoading(true)
    try {
      const rec = await getDay(d)
      if (rec) {
        setDate(rec.date)
        setSales(rec.sales || [])
        setExpenses(rec.expenses || [])
      } else {
        setDate(d)
        setSales([])
        setExpenses([])
      }
    } finally {
      setLoading(false)
    }
  }

  const saveToSheet: AppState['saveToSheet'] = async () => {
    setLoading(true)
    try {
      if ((sales?.length || 0) === 0 && (expenses?.length || 0) === 0) {
        await deleteDay(date)
      } else {
        const record: DayRecord = {
          date,
          sales,
          expenses,
          totalKg: totals.totalKg,
          totalSales: totals.totalSales,
          totalExpenses: totals.totalExpenses,
          profit: totals.profit,
          earnings15: totals.earnings15,
        }
        await saveDay(record)
      }
      // refresh or upsert into allDays
      await loadAllDays()
    } finally {
      setLoading(false)
    }
  }

  const loadAllDays: AppState['loadAllDays'] = async () => {
    setLoading(true)
    try {
      const list = await getAllDays()
      // sort by date desc
      list.sort((a: DayRecord, b: DayRecord) => b.date.localeCompare(a.date))
      setAllDays(list)
    } finally {
      setLoading(false)
    }
  }

  const period = useMemo(() => {
    const pKg = allDays.reduce((s, d) => s + (Number(d.totalKg) || 0), 0)
    const pSales = allDays.reduce((s, d) => s + (Number(d.totalSales) || 0), 0)
    const pExpenses = allDays.reduce((s, d) => s + (Number(d.totalExpenses) || 0), 0)
    const pProfit = pSales - pExpenses
    const pEarn15 = pSales * 0.15
    return { pKg, pSales, pExpenses, pProfit, pEarn15 }
  }, [allDays])

  const value: AppState = {
    date,
    sales,
    expenses,
    totalKg: totals.totalKg,
    totalSales: totals.totalSales,
    totalExpenses: totals.totalExpenses,
    profit: totals.profit,
    earnings15: totals.earnings15,
    periodTotalKg: period.pKg,
    periodTotalSales: period.pSales,
    periodTotalExpenses: period.pExpenses,
    periodProfit: period.pProfit,
    periodEarnings15: period.pEarn15,
    allDays,
    setDate,
    addSale,
    updateSale,
    deleteSale,
    addExpense,
    deleteExpense,
    loadFromSheet,
    loadAllDays,
    saveToSheet,
    loading,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}
