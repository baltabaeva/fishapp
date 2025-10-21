import { useEffect } from 'react'

type Props = {
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({ message, onClose, duration = 2500 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slateDark text-white px-4 py-2 rounded-2xl shadow-md">
      {message}
    </div>
  )
}
