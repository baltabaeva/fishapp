import { useApp } from '../context/AppContext'

function toCSV(rows: string[][]) {
  return rows
    .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(','))
    .join('\n')
}

export default function HistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { allDays } = useApp()

  const handleDownload = () => {
    const header = ['Date', 'Sales(JSON)', 'Expenses(JSON)', 'TotalKg', 'TotalSales', 'TotalExpenses', 'Profit', 'Earnings15']
    const rows = allDays.map((d) => [
      d.date,
      JSON.stringify(d.sales ?? []),
      JSON.stringify(d.expenses ?? []),
      String(d.totalKg ?? 0),
      String(d.totalSales ?? 0),
      String(d.totalExpenses ?? 0),
      String(d.profit ?? 0),
      String(d.earnings15 ?? 0),
    ])
    const csv = toCSV([header, ...rows])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'history.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="w-full sm:w-[640px] max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold">История</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm hover:bg-gray-50 transition">Скачать таблицу</button>
            <button onClick={onClose} className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm hover:bg-gray-50 transition">Закрыть</button>
          </div>
        </div>
        <div className="px-4 py-3 overflow-auto" style={{ maxHeight: '70vh' }}>
          {allDays.length === 0 && (
            <div className="text-sm text-gray-500">Нет сохранённых дней</div>
          )}
          <div className="divide-y divide-gray-200">
            {allDays.map((d) => (
              <div key={d.date} className="py-3">
                <div className="font-semibold mb-2">{d.date}</div>
                <div className="text-sm text-gray-700 mb-2">Продажи:</div>
                <div className="text-sm rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 text-gray-600">
                    <div>№</div><div>Кг</div><div>Цена/кг</div><div>Сумма</div>
                  </div>
                  {(d.sales ?? []).map((s, idx) => (
                    <div key={idx} className="grid grid-cols-4 px-3 py-2 border-t border-gray-200">
                      <div>{idx + 1}</div><div>{s.kg}</div><div>{s.price}</div><div>{s.total}</div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-700 mt-3 mb-2">Расходы:</div>
                <div className="text-sm rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-50 px-3 py-2 text-gray-600">
                    <div>Категория</div><div>Сумма</div>
                  </div>
                  {(d.expenses ?? []).map((e, idx) => (
                    <div key={idx} className="grid grid-cols-2 px-3 py-2 border-t border-gray-200">
                      <div>{e.category}</div><div>{e.amount}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-gray-200 px-3 py-2">Итого кг: <strong>{d.totalKg}</strong></div>
                  <div className="rounded-xl border border-gray-200 px-3 py-2">Продажи: <strong>{d.totalSales} ₸</strong></div>
                  <div className="rounded-xl border border-gray-200 px-3 py-2">Расходы: <strong>{d.totalExpenses} ₸</strong></div>
                  <div className="rounded-xl border border-gray-200 px-3 py-2">Прибыль: <strong>{d.profit} ₸</strong></div>
                  <div className="col-span-2 rounded-xl border border-gray-200 px-3 py-2">Заработок (15%): <strong>{d.earnings15} ₸</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
