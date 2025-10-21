import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import SaleList from './components/SaleList'
import ExpenseList from './components/ExpenseList'
import Summary from './components/Summary'
import HistoryPage from './pages/HistoryPage'

function todayISO() {
  const d = new Date()
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 10)
}

export default function App() {
  const { date, loadFromSheet, loadAllDays, loading } = useApp()
  const [localDate, setLocalDate] = useState<string>(date || todayISO())
  const [view, setView] = useState<'home' | 'history'>('home')

  const handleLoad = () => {
    if (!localDate) return
    loadFromSheet(localDate)
  }

  useEffect(() => {
    loadAllDays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Поддерживаем синхронизацию отображаемой даты с текущей датой в состоянии приложения
  useEffect(() => {
    if (date && date !== localDate) setLocalDate(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  return (
    <div className="min-h-screen">
      <div className="app-container">
        <header className="mb-5 text-center">
          <h1 className="text-2xl font-semibold text-center mb-6">Финансовый отчет</h1>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-center">
            <div className={"w-full grid grid-cols-1 gap-2 sm:gap-3 items-center"}>
              <input
                type="date"
                value={localDate}
                onChange={(e) => {
                  const v = e.target.value
                  setLocalDate(v)
                  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                    loadFromSheet(v)
                  }
                }}
                className="input input-xl w-full rounded-xl"
              />
              {view === 'home' && (
                <button
                  onClick={handleLoad}
                  className="btn btn-lg btn-primary rounded-xl w-full truncate"
                >
                  Загрузить день
                </button>
              )}
              <button
                onClick={() => setView(view === 'home' ? 'history' : 'home')}
                className="btn btn-lg btn-primary rounded-xl w-full truncate"
              >
                {view === 'home' ? 'История (редактирование)' : '← На главную'}
              </button>
            </div>
          </div>
        </header>

        {view === 'home' ? (
          <>
            <section className="mb-6">
              <h2 className="section-title">🎣 Продажи</h2>
              <div className="card animate-fadeIn">
                <SaleList />
              </div>
            </section>

            <section className="mb-6">
              <h2 className="section-title">🧾 Расходы</h2>
              <div className="card animate-fadeIn">
                <ExpenseList />
              </div>
            </section>

            <section className="mb-12">
              <h2 className="section-title">💸 Сводка</h2>
              <Summary />
            </section>
          </>
        ) : (
          <section className="mb-12">
            <HistoryPage />
          </section>
        )}

        {loading && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slateDark text-white px-4 py-2 rounded-2xl shadow-md text-sm">
            Загрузка…
          </div>
        )}
      </div>
    </div>
  )
}
