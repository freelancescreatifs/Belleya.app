import React from 'react'
import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Info } from 'lucide-react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

export function Alert({ type, title, children, onClose }: AlertProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const Icon = icons[type]

  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <div className="flex">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}