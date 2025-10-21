import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Toast from './Toast'

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)
}

export default function Summary() {
  const {
    totalKg,
    totalSales,
    totalExpenses,
    profit,
    earnings15,
    periodTotalKg,
    periodTotalSales,
    periodTotalExpenses,
    periodProfit,
    periodEarnings15,
    saveToSheet,
  } = useApp()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveToSheet()
      setToast('✅ Сохранено успешно')
    } catch (e) {
      console.error(e)
      setToast('❌ Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card animate-fadeIn ring-1 ring-black/5">
      <h3 className="section-title">Итоги</h3>

      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-2">За выбранный день</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-gray-200 px-3 py-2">Итого кг: <strong>{fmt(totalKg)}</strong></div>
          <div className="rounded-xl border border-gray-200 px-3 py-2">Продажи: <strong>{fmt(totalSales)} ₸</strong></div>
          <div className="rounded-xl border border-gray-200 px-3 py-2">Расходы: <strong>{fmt(totalExpenses)} ₸</strong></div>
          <div className="rounded-xl border border-gray-200 px-3 py-2">Прибыль: <strong>{fmt(profit)} ₸</strong></div>
          <div className="col-span-2 rounded-xl border border-gray-200 px-3 py-2">Заработок (15%): <strong>{fmt(earnings15)} ₸</strong></div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-3 pt-3">
        <div className="text-sm text-gray-600 mb-2">За весь период</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-gray-200 px-3 py-2">Итого кг: <strong>{fmt(periodTotalKg)}</strong></div>
          <div className="rounded-xl border border-gray-200 px-3 py-2">Продажи: <strong>{fmt(periodTotalSales)} ₸</strong></div>
          <div className="rounded-xl border border-gray-200 px-3 py-2">Расходы: <strong>{fmt(periodTotalExpenses)} ₸</strong></div>
          <div className="rounded-xl border border-gray-200 px-3 py-2">Прибыль: <strong>{fmt(periodProfit)} ₸</strong></div>
          <div className="col-span-2 rounded-xl border border-gray-200 px-3 py-2">Заработок (15%): <strong>{fmt(periodEarnings15)} ₸</strong></div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full btn btn-lg disabled:opacity-60"
      >
        {saving ? 'Сохранение…' : '💾 Сохранить день'}
      </button>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
