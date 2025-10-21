import { useState } from 'react'
import { useApp } from '../context/AppContext'

function num(v: string) {
  const n = Number(v.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

export default function SaleList() {
  const { sales, addSale, updateSale, deleteSale } = useApp()
  const [kg, setKg] = useState('')
  const [price, setPrice] = useState('')

  const handleAdd = () => {
    const kgN = num(kg)
    const priceN = num(price)
    if (kgN <= 0 || priceN <= 0) return
    addSale({ kg: kgN, price: priceN })
    setKg('')
    setPrice('')
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          inputMode="decimal"
          placeholder="Кг"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className="input input-xl"
        />
        <input
          inputMode="decimal"
          placeholder="Цена за кг (₸)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input input-xl"
        />
      </div>
      <button onClick={handleAdd} className="w-full btn btn-lg">
        Добавить продажу
      </button>

      <div className="text-sm text-gray-600">Продажи</div>
      <div className="space-y-2">
        {sales.length === 0 && <div className="text-sm text-gray-500">Пока нет продаж</div>}
        {sales.map((s, idx) => (
          <div key={s.id} className="bg-white rounded-2xl shadow-md p-3 ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
              <div>№ {idx + 1}</div>
              <button onClick={() => deleteSale(s.id)} className="text-red-600 hover:underline">🗑️ Удалить</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Кг</div>
                <input
                  inputMode="decimal"
                  value={String(s.kg)}
                  onChange={(e) => updateSale(s.id, { kg: num(e.target.value) })}
                  className="input input-xl w-full"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Цена/кг</div>
                <input
                  inputMode="decimal"
                  value={String(s.price)}
                  onChange={(e) => updateSale(s.id, { price: num(e.target.value) })}
                  className="input input-xl w-full"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Сумма</div>
                <div className="rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50">{(s.kg * s.price).toLocaleString('ru-RU')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
