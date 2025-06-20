'use client'

import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

export default function Notifications() {
  const { notifications, actions } = useAppStore()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => actions.removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const icons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
  }

  const colors = {
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border bg-background p-4 shadow-lg",
        "min-w-[300px] max-w-[400px]",
        colors[notification.type]
      )}
    >
      <div className="shrink-0">{icons[notification.type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{notification.title}</h4>
        {notification.message && (
          <p className="mt-1 text-xs opacity-90">{notification.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded p-1 hover:bg-foreground/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}