import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/src/lib/supabase'

export interface AppNotification {
    id: string
    title: string
    message: string
    type: 'ticket' | 'inspection' | 'maintenance' | 'financial' | 'user' | 'system'
    createdAt: string
    read: boolean
    actionBy: string
    actionByRole: string
}

interface NotificationContextType {
    notifications: AppNotification[]
    unreadCount: number
    addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function mapDbNotification(row: any): AppNotification {
    return {
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type,
        createdAt: row.created_at,
        read: row.read,
        actionBy: row.action_by,
        actionByRole: row.action_by_role,
    }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([])

    // Load notifications from Supabase
    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)
            if (data) setNotifications(data.map(mapDbNotification))
        }
        fetch()

        // Subscribe to realtime inserts
        const channel = supabase
            .channel('notifications-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
            }, (payload) => {
                const newNotif = mapDbNotification(payload.new)
                setNotifications(prev => [newNotif, ...prev].slice(0, 50))

                // Browser push notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`CondoOps — ${newNotif.title}`, {
                        body: newNotif.message,
                        icon: '/icon-192.png',
                        tag: newNotif.id,
                    })
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const addNotification = useCallback(async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
        const id = `NOTIF-${Date.now()}`
        const { error } = await supabase.from('notifications').insert({
            id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            action_by: notif.actionBy,
            action_by_role: notif.actionByRole,
            read: false,
            target_role: 'Administrador',
        })

        if (error) {
            console.error('Erro ao criar notificação:', error)
            // Fallback: add locally
            setNotifications(prev => [{
                ...notif, id, createdAt: new Date().toISOString(), read: false,
            }, ...prev].slice(0, 50))
        }
        // If no error, the realtime subscription will pick it up
    }, [])

    const markAsRead = useCallback(async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }, [])

    const markAllAsRead = useCallback(async () => {
        const ids = notifications.filter(n => !n.read).map(n => n.id)
        if (ids.length > 0) {
            await supabase.from('notifications').update({ read: true }).in('id', ids)
        }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [notifications])

    const clearAll = useCallback(async () => {
        const ids = notifications.map(n => n.id)
        if (ids.length > 0) {
            await supabase.from('notifications').delete().in('id', ids)
        }
        setNotifications([])
    }, [notifications])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within NotificationProvider')
    return context
}
