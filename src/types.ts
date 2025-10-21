export type Sale = {
  id: string
  kg: number
  price: number
  total: number
}

export type Expense = {
  id: string
  category: string
  amount: number
}

export type DayRecord = {
  date: string // YYYY-MM-DD
  sales: Sale[]
  expenses: Expense[]
  totalKg: number
  totalSales: number
  totalExpenses: number
  profit: number
  earnings15: number
}
