import { useState, useRef, useEffect } from "react"
import { Bell, Search, Menu, Check, CheckCheck, Trash2, X, AlertTriangle, ClipboardCheck, Wrench, FileText, UserPlus, Info } from "lucide-react"
import { useNotifications, type AppNotification } from "@/src/context/NotificationContext"
import { useAuth } from "@/src/context/AuthContext"
import { motion, AnimatePresence } from "motion/react"

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  ticket: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  inspection: { icon: ClipboardCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  maintenance: { icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-100' },
  financial: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  user: { icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50' },
  system: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Administrador'
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    if (showPanel) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPanel])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-2">
        {/* Mobile menu button */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-all lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Search - hidden on very small screens */}
        <div className="hidden sm:flex flex-1 ml-2">
          <div className="relative w-full max-w-md">
            <label htmlFor="search-field" className="sr-only">Buscar</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block h-full w-full border-0 py-2 pl-9 pr-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-sm"
                placeholder="Buscar chamados, inspeções..."
                type="search"
                name="search"
              />
            </div>
          </div>
        </div>

        {/* Mobile: show app name */}
        <div className="flex sm:hidden items-center flex-1">
          <span className="text-lg font-black text-slate-900">Condo<span className="text-indigo-600">Ops</span></span>
        </div>
      </div>

      {/* Notification Bell - only for Admins */}
      {isAdmin && (
        <div className="ml-2 sm:ml-4 flex items-center relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setShowPanel(!showPanel)}
            className="relative rounded-full bg-white p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
          >
            <span className="sr-only">Ver notificações</span>
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Notification Panel */}
          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-0 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[70vh] sm:max-h-[500px] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden z-50"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Notificações</h3>
                    <p className="text-[10px] text-slate-400">{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Marcar tudo como lido">
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Limpar tudo">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setShowPanel(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto max-h-[60vh] sm:max-h-[400px] divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Bell className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-400">Nenhuma notificação</p>
                      <p className="text-[10px] text-slate-300 mt-1">As ações dos operadores aparecerão aqui.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const config = typeConfig[notif.type] || typeConfig.system
                      const IconComponent = config.icon
                      return (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full flex items-start gap-3 p-3 sm:p-4 text-left transition-all hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                        >
                          <div className={`flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center ${config.bg}`}>
                            <IconComponent className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                              <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{timeAgo(notif.createdAt)}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">por <span className="font-semibold">{notif.actionBy}</span> · {notif.actionByRole}</p>
                          </div>
                          {!notif.read && (
                            <div className="flex-shrink-0 h-2 w-2 rounded-full bg-indigo-500 mt-2" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </header>
  )
}
