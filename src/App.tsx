/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Dashboard } from "./pages/Dashboard"
import { Inspections } from "./pages/Inspections"
import { NewInspection } from "./pages/NewInspection"
import { Tickets } from "./pages/Tickets"
import { Maintenance } from "./pages/Maintenance"
import { Financial } from "./pages/Financial"
import { Settings } from "./pages/Settings"
import { Notes } from "./pages/Notes"
import { LoginPage } from "./pages/LoginPage"
import { Toaster } from "sonner"
import { DataProvider } from "./context/DataContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { NotificationProvider } from "./context/NotificationContext"
import { ReactNode } from "react"

function ProtectedRoute({ permission, children }: { permission: string; children: ReactNode }) {
  const { user } = useAuth()
  const hasPermission = user?.permissions?.includes(permission)

  if (!hasPermission) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="h-20 w-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
          <p className="text-sm text-slate-500 max-w-sm">Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <NotificationProvider>
      <DataProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="inspections" element={<ProtectedRoute permission="inspections"><Inspections /></ProtectedRoute>} />
            <Route path="inspections/new" element={<ProtectedRoute permission="inspections"><NewInspection /></ProtectedRoute>} />
            <Route path="tickets" element={<ProtectedRoute permission="tickets"><Tickets /></ProtectedRoute>} />
            <Route path="maintenance" element={<ProtectedRoute permission="maintenance"><Maintenance /></ProtectedRoute>} />
            <Route path="notes" element={<ProtectedRoute permission="notes"><Notes /></ProtectedRoute>} />
            <Route path="financial" element={<ProtectedRoute permission="financial"><Financial /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DataProvider>
    </NotificationProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors closeButton />
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}
