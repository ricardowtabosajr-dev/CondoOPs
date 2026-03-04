export type UserRole = 'admin' | 'manager' | 'janitor' | 'technician';

export type InspectionPeriodicity = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'semiannual';

export type RiskLevel = 'low' | 'medium' | 'high';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface InspectionItem {
  id: string;
  category: string;
  description: string;
  status: 'ok' | 'nok' | 'na';
  observation?: string;
  photoUrl?: string;
  riskLevel?: RiskLevel;
}

export interface Inspection {
  id: string;
  date: string;
  periodicity: InspectionPeriodicity;
  inspectorId: string;
  items: InspectionItem[];
  status: 'draft' | 'completed';
  score: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: RiskLevel;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  inspectionId?: string;
  equipmentId?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'operational' | 'maintenance' | 'offline';
}
