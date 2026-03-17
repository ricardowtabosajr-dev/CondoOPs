import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/src/lib/supabase"
import { toast } from 'sonner'

export interface Transaction {
    date: string
    desc: string
    cat: string
    value: string
    type: 'in' | 'out'
}

interface DataContextType {
    tickets: any[]
    addTicket: (ticket: any) => void
    updateTicket: (id: string, updates: any) => Promise<void>
    removeTicket: (id: string) => void

    equipments: any[]
    addEquipment: (eq: any) => void
    updateEquipment: (id: string, updates: any) => Promise<void>
    removeEquipment: (id: string) => void

    inspections: any[]
    addInspection: (insp: any) => void
    updateInspection: (id: string, updates: any) => Promise<void>
    removeInspection: (id: string) => void

    transactions: Transaction[]
    addTransaction: (txn: Transaction) => void

    notes: any[]
    addNote: (note: any) => Promise<void>
    removeNote: (id: string) => Promise<void>

    loading: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
    const [inspections, setInspections] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [equipments, setEquipments] = useState<any[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [notes, setNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch all data from Supabase on mount
    useEffect(() => {
        async function fetchAll() {
            setLoading(true)
            const [ticketsRes, equipmentsRes, inspectionsRes, transactionsRes, notesRes] = await Promise.all([
                supabase.from('tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('equipments').select('*').order('created_at', { ascending: false }),
                supabase.from('inspections').select('*').order('created_at', { ascending: false }),
                supabase.from('transactions').select('*').order('created_at', { ascending: false }),
                supabase.from('notes').select('*').order('created_at', { ascending: false }),
            ])

            if (ticketsRes.data) setTickets(ticketsRes.data.map(t => ({
                id: t.id, title: t.title, description: t.description,
                status: t.status, priority: t.priority,
                inspectionId: t.inspection_id,
                resolution: t.resolution || '',
                createdAt: t.created_at, updatedAt: t.updated_at,
            })))

            if (equipmentsRes.data) setEquipments(equipmentsRes.data.map(e => ({
                id: e.id, name: e.name, category: e.category,
                status: e.status, lastMaintenance: e.last_maintenance, nextMaintenance: e.next_maintenance,
            })))

            if (inspectionsRes.data) setInspections(inspectionsRes.data.map(i => {
                let parsedAreas = []
                try {
                    parsedAreas = i.areas ? i.areas.map((a: any) => {
                        if (typeof a === 'string' && (a.startsWith('{') || a.startsWith('['))) {
                            return JSON.parse(a)
                        }
                        return a
                    }) : []
                } catch (e) {
                    console.error("Erro ao processar áreas da inspeção:", e)
                    parsedAreas = Array.isArray(i.areas) ? i.areas : []
                }

                return {
                    id: i.id, inspector: i.inspector, type: i.type,
                    periodicity: i.periodicity, date: i.date,
                    status: i.status, score: i.score, areas: parsedAreas,
                    openedAt: i.created_at,
                    completedAt: i.completed_at,
                }
            }))

            if (transactionsRes.data) setTransactions(transactionsRes.data.map(t => ({
                date: t.date, desc: t.description, cat: t.category,
                value: t.value, type: t.type as 'in' | 'out',
            })))

            if (notesRes.data) setNotes(notesRes.data.map(n => ({
                id: n.id,
                content: n.content,
                author: n.author,
                createdAt: n.created_at,
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
            inspection_id: ticket.inspectionId,
        })
        if (!error) setTickets(prev => [ticket, ...prev])
        else console.error('Erro ao criar chamado:', error)
    }

    const removeTicket = async (id: string) => {
        const { error } = await supabase.from('tickets').delete().eq('id', id)
        if (!error) setTickets(prev => prev.filter(t => t.id !== id))
    }

    const updateTicket = async (id: string, updates: any) => {
        const dbUpdates: any = { updated_at: new Date().toISOString() }
        if (updates.status) dbUpdates.status = updates.status
        if (updates.priority) dbUpdates.priority = updates.priority
        if (updates.title) dbUpdates.title = updates.title
        if (updates.description) dbUpdates.description = updates.description
        if (updates.resolution) dbUpdates.resolution = updates.resolution

        const { error } = await supabase.from('tickets').update(dbUpdates).eq('id', id)
        if (!error) {
            setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: dbUpdates.updated_at } : t))

            // Lógica de encerramento automático da inspeção
            if (updates.status === 'resolved') {
                // Procurar no estado atual para obter o inspectionId
                const ticket = tickets.find(t => t.id === id);
                const inspId = ticket?.inspectionId || updates.inspectionId;

                if (inspId) {
                    await updateInspection(inspId, { status: 'completed', score: 100 });
                }
            }
        } else {
            console.error('Erro detalhado ao atualizar chamado:', error)
            toast.error(`Falha ao atualizar chamado: ${error.message}`)
        }
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

    const updateEquipment = async (id: string, updates: any) => {
        const dbUpdates: any = {}
        if (updates.name) dbUpdates.name = updates.name
        if (updates.category) dbUpdates.category = updates.category
        if (updates.status) dbUpdates.status = updates.status
        if (updates.lastMaintenance) dbUpdates.last_maintenance = updates.lastMaintenance
        if (updates.nextMaintenance) dbUpdates.next_maintenance = updates.nextMaintenance

        const { error } = await supabase.from('equipments').update(dbUpdates).eq('id', id)
        if (!error) {
            setEquipments(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
        } else {
            console.error('Erro ao atualizar equipamento:', error)
            toast.error(`Falha ao atualizar equipamento: ${error.message}`)
        }
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

    const updateInspection = async (id: string, updates: any) => {
        const dbUpdates = { ...updates }
        if (updates.status === 'completed') {
            dbUpdates.completed_at = new Date().toISOString()
        }
        const { error } = await supabase.from('inspections').update(dbUpdates).eq('id', id)
        if (!error) {
            setInspections(prev => prev.map(i => i.id === id ? { ...i, ...dbUpdates } : i))
            console.log(`Inspeção ${id} atualizada com sucesso.`)
        } else {
            console.error('Erro ao atualizar inspeção:', error)
        }
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

    // ─── Notes ───
    const addNote = async (note: any) => {
        const { error } = await supabase.from('notes').insert({
            id: note.id,
            content: note.content,
            author: note.author,
        })
        if (!error) setNotes(prev => [{ ...note, createdAt: new Date().toISOString() }, ...prev])
        else console.error('Erro ao criar anotação:', error)
    }

    const removeNote = async (id: string) => {
        const { error } = await supabase.from('notes').delete().eq('id', id)
        if (!error) setNotes(prev => prev.filter(n => n.id !== id))
    }

    return (
        <DataContext.Provider value={{
            inspections, addInspection, updateInspection, removeInspection,
            tickets, addTicket, updateTicket, removeTicket,
            equipments, addEquipment, updateEquipment, removeEquipment,
            transactions, addTransaction,
            notes, addNote, removeNote,
            loading,
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
