import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/src/lib/supabase"

export interface Transaction {
    date: string
    desc: string
    cat: string
    value: string
    type: 'in' | 'out'
}

interface DataContextType {
    inspections: any[]
    addInspection: (insp: any) => void
    removeInspection: (id: string) => void

    tickets: any[]
    addTicket: (ticket: any) => void
    removeTicket: (id: string) => void

    equipments: any[]
    addEquipment: (eq: any) => void
    removeEquipment: (id: string) => void

    transactions: Transaction[]
    addTransaction: (txn: Transaction) => void

    loading: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
    const [inspections, setInspections] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [equipments, setEquipments] = useState<any[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch all data from Supabase on mount
    useEffect(() => {
        async function fetchAll() {
            setLoading(true)
            const [ticketsRes, equipmentsRes, inspectionsRes, transactionsRes] = await Promise.all([
                supabase.from('tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('equipments').select('*').order('created_at', { ascending: false }),
                supabase.from('inspections').select('*').order('created_at', { ascending: false }),
                supabase.from('transactions').select('*').order('created_at', { ascending: false }),
            ])

            if (ticketsRes.data) setTickets(ticketsRes.data.map(t => ({
                id: t.id, title: t.title, description: t.description,
                status: t.status, priority: t.priority,
                createdAt: t.created_at, updatedAt: t.updated_at,
            })))

            if (equipmentsRes.data) setEquipments(equipmentsRes.data.map(e => ({
                id: e.id, name: e.name, category: e.category,
                status: e.status, lastMaintenance: e.last_maintenance, nextMaintenance: e.next_maintenance,
            })))

            if (inspectionsRes.data) setInspections(inspectionsRes.data.map(i => ({
                id: i.id, inspector: i.inspector, type: i.type,
                periodicity: i.periodicity, date: i.date,
                status: i.status, score: i.score, areas: i.areas || [],
            })))

            if (transactionsRes.data) setTransactions(transactionsRes.data.map(t => ({
                date: t.date, desc: t.description, cat: t.category,
                value: t.value, type: t.type as 'in' | 'out',
            })))

            setLoading(false)
        }
        fetchAll()
    }, [])

    // ─── Tickets ───
    const addTicket = async (ticket: any) => {
        const { error } = await supabase.from('tickets').insert({
            id: ticket.id,
            title: ticket.title,
            description: ticket.description || '',
            status: ticket.status,
            priority: ticket.priority,
        })
        if (!error) setTickets(prev => [ticket, ...prev])
        else console.error('Erro ao criar chamado:', error)
    }

    const removeTicket = async (id: string) => {
        const { error } = await supabase.from('tickets').delete().eq('id', id)
        if (!error) setTickets(prev => prev.filter(t => t.id !== id))
    }

    // ─── Equipments ───
    const addEquipment = async (eq: any) => {
        const { error } = await supabase.from('equipments').insert({
            id: eq.id,
            name: eq.name,
            category: eq.category,
            status: eq.status,
            last_maintenance: eq.lastMaintenance,
            next_maintenance: eq.nextMaintenance,
        })
        if (!error) setEquipments(prev => [eq, ...prev])
        else console.error('Erro ao criar equipamento:', error)
    }

    const removeEquipment = async (id: string) => {
        const { error } = await supabase.from('equipments').delete().eq('id', id)
        if (!error) setEquipments(prev => prev.filter(e => e.id !== id))
    }

    // ─── Inspections ───
    const addInspection = async (insp: any) => {
        const { error } = await supabase.from('inspections').insert({
            id: insp.id,
            inspector: insp.inspector,
            type: insp.type,
            periodicity: insp.periodicity,
            date: insp.date,
            status: insp.status,
            score: insp.score,
            areas: insp.areas || [],
        })
        if (!error) setInspections(prev => [insp, ...prev])
        else console.error('Erro ao criar inspeção:', error)
    }

    const removeInspection = async (id: string) => {
        const { error } = await supabase.from('inspections').delete().eq('id', id)
        if (!error) setInspections(prev => prev.filter(i => i.id !== id))
    }

    // ─── Transactions ───
    const addTransaction = async (txn: Transaction) => {
        const { error } = await supabase.from('transactions').insert({
            date: txn.date,
            description: txn.desc,
            category: txn.cat,
            value: txn.value,
            type: txn.type,
        })
        if (!error) setTransactions(prev => [txn, ...prev])
        else console.error('Erro ao criar transação:', error)
    }

    return (
        <DataContext.Provider value={{
            inspections, addInspection, removeInspection,
            tickets, addTicket, removeTicket,
            equipments, addEquipment, removeEquipment,
            transactions, addTransaction, loading,
        }}>
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const ctx = useContext(DataContext)
    if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>')
    return ctx
}
