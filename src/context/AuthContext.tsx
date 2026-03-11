import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/src/lib/supabase'

export interface AppUser {
    id: string
    name: string
    email: string
    password: string
    role: string
    status: 'active' | 'inactive'
    permissions: string[]
    initials: string
}

interface AuthUser {
    id: string
    name: string
    email: string
    role: string
    initials: string
    permissions: string[]
}

interface AuthContextType {
    user: AuthUser | null
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    systemUsers: AppUser[]
    addSystemUser: (user: Omit<AppUser, 'initials'>) => void
    updateSystemUser: (user: AppUser) => void
    deleteSystemUser: (userId: string) => void
    refreshUsers: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function mapDbUser(row: any): AppUser {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        status: row.status,
        permissions: row.permissions || ['dashboard'],
        initials: row.initials || getInitials(row.name),
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const saved = localStorage.getItem('condoops_user')
        return saved ? JSON.parse(saved) : null
    })
    const [systemUsers, setSystemUsers] = useState<AppUser[]>([])

    // Load users from Supabase on mount
    const refreshUsers = async () => {
        const { data, error } = await supabase
            .from('system_users')
            .select('*')
            .order('created_at', { ascending: true })

        if (!error && data) {
            setSystemUsers(data.map(mapDbUser))
        } else {
            console.error('Erro ao carregar usuários:', error)
        }
    }

    useEffect(() => {
        refreshUsers()
    }, [])

    const login = async (email: string, password: string): Promise<boolean> => {
        // Query Supabase directly for user validation
        const { data, error } = await supabase
            .from('system_users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('password', password)
            .eq('status', 'active')
            .single()

        if (error || !data) return false

        const dbUser = mapDbUser(data)
        const authUser: AuthUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            initials: dbUser.initials,
            permissions: dbUser.permissions,
        }
        setUser(authUser)
        localStorage.setItem('condoops_user', JSON.stringify(authUser))
        await refreshUsers()
        return true
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('condoops_user')
    }

    const addSystemUser = async (newUser: Omit<AppUser, 'initials'>) => {
        const initials = getInitials(newUser.name)
        const { error } = await supabase.from('system_users').insert({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
            status: newUser.status,
            permissions: newUser.permissions,
            initials,
        })
        if (!error) await refreshUsers()
        else console.error('Erro ao criar usuário:', error)
    }

    const updateSystemUser = async (updatedUser: AppUser) => {
        const initials = getInitials(updatedUser.name)
        const { error } = await supabase
            .from('system_users')
            .update({
                name: updatedUser.name,
                email: updatedUser.email,
                password: updatedUser.password,
                role: updatedUser.role,
                status: updatedUser.status,
                permissions: updatedUser.permissions,
                initials,
                updated_at: new Date().toISOString(),
            })
            .eq('id', updatedUser.id)

        if (!error) {
            await refreshUsers()
            // If currently logged in user was updated, refresh their session
            if (user && user.id === updatedUser.id) {
                const refreshed: AuthUser = {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    initials,
                    permissions: updatedUser.permissions,
                }
                setUser(refreshed)
                localStorage.setItem('condoops_user', JSON.stringify(refreshed))
            }
        } else {
            console.error('Erro ao atualizar usuário:', error)
        }
    }

    const deleteSystemUser = async (userId: string) => {
        const { error } = await supabase.from('system_users').delete().eq('id', userId)
        if (!error) await refreshUsers()
        else console.error('Erro ao excluir usuário:', error)
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, systemUsers, addSystemUser, updateSystemUser, deleteSystemUser, refreshUsers }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
