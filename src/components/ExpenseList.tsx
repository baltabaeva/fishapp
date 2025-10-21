import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function ExpenseList() {
  const { expenses, addExpense, deleteExpense, totalExpenses } = useApp()
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')

  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9.]/g, ''))
    return isNaN(n) ? 0 : n
  }

  const handleAdd = () => {
    const amt = num(amount)
    if (!category.trim() || amt <= 0) return
    addExpense({ category, amount: amt })
    setCategory('')
    setAmount('')
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:col-span-2 input input-xl"
        />
        <input
          inputMode="decimal"
          placeholder="Сумма (₸)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input input-xl"
        />
      </div>
      <button onClick={handleAdd} className="w-full btn btn-lg">
        Добавить расход
      </button>

      <div className="text-sm text-gray-600">Расходы</div>
      <div className="space-y-2">
        {expenses.length === 0 && <div className="text-sm text-gray-500">Пока нет расходов</div>}
        {expenses.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl shadow-md p-3 ring-1 ring-black/5 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold">{e.category}</div>
              <div className="text-gray-600">{e.amount.toLocaleString('ru-RU')} ₸</div>
            </div>
            <button onClick={() => deleteExpense(e.id)} className="text-red-600 hover:underline">🗑️</button>
          </div>
        ))}
      </div>

      <div className="text-right text-sm">
        <span className="text-gray-600">Итого расходы:</span>{' '}
        <span className="font-semibold">{totalExpenses.toLocaleString('ru-RU')} ₸</span>
      </div>
    </div>
  )
}
