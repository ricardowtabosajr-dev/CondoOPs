import { Link, useLocation } from "react-router-dom"
import { cn } from "@/src/lib/utils"
import { motion } from "motion/react"
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  FileText,
  Settings,
  Building2,
  LogOut,
  ShieldAlert,
  StickyNote,
  X,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { toast } from "sonner"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Inspeções', href: '/inspections', icon: ClipboardCheck, permission: 'inspections' },
  { name: 'Chamados', href: '/tickets', icon: AlertTriangle, permission: 'tickets' },
  { name: 'Manutenção', href: '/maintenance', icon: Wrench, permission: 'maintenance' },
  { name: 'Anotações', href: '/notes', icon: StickyNote, permission: 'notes' },
  { name: 'Financeiro', href: '/financial', icon: FileText, permission: 'financial' },
  { name: 'Configurações', href: '/settings', icon: Settings, permission: 'settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const userPermissions = user?.permissions || []
  const allowedNavigation = navigation.filter(item => userPermissions.includes(item.permission))

  const handleLogout = () => {
    toast.success('Sessão encerrada. Até logo!')
    setTimeout(() => logout(), 500)
  }

  const handleNavigate = () => {
    // Close sidebar on mobile after navigation
    if (onClose) onClose()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex h-20 items-center justify-between px-6 border-b border-slate-50">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-100 mr-2.5">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">Condo<span className="text-indigo-600">Ops</span></span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1.5 focus:outline-none">
          {allowedNavigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavigate}
                className={cn(
                  "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none",
                  isActive
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {allowedNavigation.length < navigation.length && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 px-4 py-2">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-300" />
              <p className="text-[10px] text-slate-400 leading-tight">Acesso restrito. Contate o administrador para mais permissões.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 mt-auto">
        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-center">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-white">
                {user?.initials || 'SA'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Usuário'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.role || 'Operador'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair do Sistema"
              className="ml-2 flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
