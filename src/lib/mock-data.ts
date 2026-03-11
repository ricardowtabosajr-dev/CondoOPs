import { Inspection, Ticket, Equipment } from "@/src/types"

export const MOCK_INSPECTIONS: (Inspection & { type: string, inspector: string })[] = [
  { 
    id: 'INSP-2023-001', 
    date: '2023-10-25', 
    periodicity: 'daily',
    type: 'Diária', 
    status: 'completed', 
    score: 98, 
    inspectorId: 'U1',
    inspector: 'João Silva',
    items: [] 
  },
  { 
    id: 'INSP-2023-002', 
    date: '2023-10-24', 
    periodicity: 'weekly',
    type: 'Semanal', 
    status: 'completed', 
    score: 85, 
    inspectorId: 'U2',
    inspector: 'Carlos Mendes',
    items: [] 
  },
  { 
    id: 'INSP-2023-003', 
    date: '2023-10-20', 
    periodicity: 'biweekly',
    type: 'Quinzenal', 
    status: 'completed', 
    score: 75, 
    inspectorId: 'U3',
    inspector: 'Ana Souza',
    items: [] 
  },
  { 
    id: 'INSP-2023-004', 
    date: '2023-10-01', 
    periodicity: 'monthly',
    type: 'Mensal', 
    status: 'completed', 
    score: 92, 
    inspectorId: 'U4',
    inspector: 'Marcos Paulo',
    items: [] 
  },
  { 
    id: 'INSP-2023-005', 
    date: '2023-06-15', 
    periodicity: 'semiannual',
    type: 'Semestral', 
    status: 'completed', 
    score: 100, 
    inspectorId: 'U5',
    inspector: 'Eng. Roberto',
    items: [] 
  },
]

export const MOCK_TICKETS: Ticket[] = [
  { 
    id: 'CH-1024', 
    title: 'Vazamento no barrilete', 
    description: 'Vazamento identificado na junta de dilatação do barrilete principal.',
    status: 'open', 
    priority: 'high', 
    createdAt: '2023-10-25T14:30:00Z',
    updatedAt: '2023-10-25T14:30:00Z'
  },
  { 
    id: 'CH-1023', 
    title: 'Lâmpada queimada G2', 
    description: 'Três lâmpadas de LED queimadas no setor C da garagem 2.',
    status: 'in_progress', 
    priority: 'low', 
    createdAt: '2023-10-25T11:20:00Z',
    updatedAt: '2023-10-25T13:45:00Z'
  },
  { 
    id: 'CH-1022', 
    title: 'Portão da garagem lento', 
    description: 'O portão principal de entrada está demorando mais que o normal para abrir.',
    status: 'open', 
    priority: 'medium', 
    createdAt: '2023-10-24T08:15:00Z',
    updatedAt: '2023-10-24T09:00:00Z'
  },
]

export const MOCK_EQUIPMENTS: Equipment[] = [
  { 
    id: 'EQ-001', 
    name: 'Bomba Recalque 02', 
    category: 'Hidráulica', 
    lastMaintenance: '2023-09-15', 
    nextMaintenance: '2023-12-15', 
    status: 'maintenance' 
  },
  { 
    id: 'EQ-002', 
    name: 'Elevador Social A', 
    category: 'Transporte', 
    lastMaintenance: '2023-10-01', 
    nextMaintenance: '2023-11-01', 
    status: 'maintenance' 
  },
  { 
    id: 'EQ-003', 
    name: 'Gerador Principal', 
    category: 'Elétrica', 
    lastMaintenance: '2023-08-20', 
    nextMaintenance: '2024-02-20', 
    status: 'operational' 
  },
  { 
    id: 'EQ-004', 
    name: 'Sistema de CFTV', 
    category: 'Segurança', 
    lastMaintenance: '2023-10-10', 
    nextMaintenance: '2024-04-10', 
    status: 'operational' 
  },
]

export const CHART_DATA = {
  maintenance: [
    { name: 'Jan', prev: 4000, corr: 2400 },
    { name: 'Fev', prev: 3000, corr: 1398 },
    { name: 'Mar', prev: 2000, corr: 9800 },
    { name: 'Abr', prev: 2780, corr: 3908 },
    { name: 'Mai', prev: 1890, corr: 4800 },
    { name: 'Jun', prev: 2390, corr: 3800 },
  ],
  compliance: [
    { name: 'Sem 1', score: 85 },
    { name: 'Sem 2', score: 88 },
    { name: 'Sem 3', score: 92 },
    { name: 'Sem 4', score: 95 },
  ]
}
