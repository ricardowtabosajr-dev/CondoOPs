import { Inspection, Ticket, Equipment } from "@/src/types"

export const MOCK_INSPECTIONS: (Inspection & { type: string, inspector: string })[] = []

export const MOCK_TICKETS: Ticket[] = []

export const MOCK_EQUIPMENTS: Equipment[] = []

export const CHART_DATA = {
  maintenance: [
    { name: 'Jan', prev: 0, corr: 0 },
    { name: 'Fev', prev: 0, corr: 0 },
    { name: 'Mar', prev: 0, corr: 0 },
    { name: 'Abr', prev: 0, corr: 0 },
    { name: 'Mai', prev: 0, corr: 0 },
    { name: 'Jun', prev: 0, corr: 0 },
  ],
  compliance: [
    { name: 'Sem 1', score: 0 },
    { name: 'Sem 2', score: 0 },
    { name: 'Sem 3', score: 0 },
    { name: 'Sem 4', score: 0 },
  ]
}

