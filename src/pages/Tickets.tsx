import { useState } from "react"
import { Button } from "@/src/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/Table"
import { Badge } from "@/src/components/ui/Badge"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, Search, Filter, AlertTriangle, CheckCircle2, Clock, ExternalLink, Eye, Send, X } from "lucide-react"
import { useData } from "@/src/context/DataContext"
import { useNotifications } from "@/src/context/NotificationContext"
import { useAuth } from "@/src/context/AuthContext"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export function Tickets() {
  const { tickets, addTicket } = useData()
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [newTicket, setNewTicket] = useState({
    title: '',
    priority: 'medium',
    category: 'infra',
    description: ''
  })

  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  const openCount = tickets.filter(t => t.status === 'open').length
  const highPriorityCount = tickets.filter(t => t.priority === 'high').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true
    const matchesPriority = priorityFilter ? ticket.priority === priorityFilter : true
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const id = `CH-${String(1000 + tickets.length + 1)}`
    const entry = {
      id,
      title: newTicket.title,
      description: newTicket.description || 'Sem descrição adicional.',
      status: 'open' as const,
      priority: newTicket.priority as "high" | "medium" | "low",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    toast.promise(new Promise((resolve) => setTimeout(() => {
      addTicket(entry)
      if (user && user.role !== 'Administrador') {
        addNotification({
          title: 'Novo Chamado Aberto',
          message: `"${newTicket.title}" — Prioridade: ${newTicket.priority === 'high' ? 'Alta' : newTicket.priority === 'medium' ? 'Média' : 'Baixa'}`,
          type: 'ticket',
          actionBy: user.name,
          actionByRole: user.role,
        })
      }
      resolve(true)
    }, 1500)), {
      loading: 'Enviando chamado...',
      success: () => {
        setIsModalOpen(false)
        setLoading(false)
        setNewTicket({ title: '', priority: 'medium', category: 'infra', description: '' })
        return 'Chamado aberto com sucesso!'
      },
      error: 'Erro ao enviar chamado.',
    })
  }

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket)
    setIsViewModalOpen(true)
  }

  const kpiStats = [
    { label: "Total Abertos", value: openCount, status: 'open', priority: null, icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Prioridade Alta", value: highPriorityCount, status: null, priority: 'high', icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Em Andamento", value: inProgressCount, status: 'in_progress', priority: null, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Todos os Chamados", value: tickets.length, status: null, priority: null, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Chamados</h1>
          <p className="text-slate-500 mt-1">Controle de ocorrências, manutenções corretivas e pendências.</p>
        </div>
        <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Chamado
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Chamado">
        <form className="space-y-5" onSubmit={handleCreateTicket}>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Título da Ocorrência</label>
            <input required type="text" placeholder="Ex: Vazamento no corredor do 5º andar" value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Prioridade</label>
              <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta / Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Categoria</label>
              <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="infra">Infraestrutura</option>
                <option value="eletrical">Elétrica</option>
                <option value="hydraulic">Hidráulica</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Descrição Detalhada</label>
            <textarea rows={4} placeholder="Descreva o problema com o máximo de detalhes possível..." value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={loading}>
              {loading ? 'Enviando...' : <><Send className="h-4 w-4 mr-2" /> Abrir Chamado</>}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Chamado ${selectedTicket?.id}`}>
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={selectedTicket.status === 'open' ? 'destructive' : selectedTicket.status === 'in_progress' ? 'warning' : selectedTicket.status === 'resolved' ? 'success' : 'secondary'} className="text-xs px-3 py-1">
                {selectedTicket.status === 'open' ? 'Aberto' : selectedTicket.status === 'in_progress' ? 'Em andamento' : selectedTicket.status === 'resolved' ? 'Resolvido' : 'Fechado'}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">Criado em: {new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedTicket.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">{selectedTicket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Prioridade</p>
                <div className="flex justify-start">
                  <Badge className={selectedTicket.priority === 'high' ? 'bg-red-50 text-red-700 border-none px-2' : selectedTicket.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-none px-2' : 'bg-slate-50 text-slate-700 border-none px-2'}>
                    {selectedTicket.priority === 'high' ? 'Urgente' : selectedTicket.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Responsável</p>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">ET</div>
                  <span className="text-xs font-bold text-slate-700">Equipe Técnica</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-900 mb-3 text-left">Histórico de Interações</p>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center"><Clock className="h-3 w-3 text-slate-400" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700 text-left">Chamado aberto no sistema</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 text-left">{new Date(selectedTicket.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="text-slate-600" onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => { setIsViewModalOpen(false); toast.success('Atualizando status do chamado...'); }}>Editar Chamado</Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid gap-4 md:grid-cols-4">
        {kpiStats.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card
              className={`border-none shadow-sm ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50/50 transition-all active:scale-95 group ${(statusFilter === stat.status && priorityFilter === stat.priority && (stat.status !== null || stat.priority !== null)) ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
              onClick={() => { setStatusFilter(stat.status); setPriorityFilter(stat.priority); toast.success(`Filtrando por: ${stat.label}`); }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className={`text-2xl font-bold ${stat.color === 'text-slate-600' ? 'text-slate-900' : stat.color}`}>{stat.value}</h3>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item}>
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full max-sm:w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar por título ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
              {(statusFilter || priorityFilter) && (
                <Button variant="ghost" size="sm" className="text-red-500 h-10 border border-red-100 hover:bg-red-50" onClick={() => { setStatusFilter(null); setPriorityFilter(null); }}>
                  Limpar Filtros <X className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-left">
                  <TableHead className="w-[120px]">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Abertura</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
                  <motion.tr key={ticket.id} variants={item} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 text-left">
                    <TableCell className="font-bold text-indigo-600 py-4">{ticket.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{ticket.title}</span>
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ticket.description}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={ticket.status === 'open' ? 'destructive' : ticket.status === 'in_progress' ? 'warning' : ticket.status === 'resolved' ? 'success' : 'secondary'} className="rounded-md">{ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em andamento' : ticket.status === 'resolved' ? 'Resolvido' : 'Fechado'}</Badge></TableCell>
                    <TableCell><Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'warning' : 'outline'} className="border-none bg-slate-100 text-slate-700 px-2">{ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-600 font-medium text-left">Equipe Técnica</TableCell>
                    <TableCell className="text-right text-sm text-slate-500">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 transition-colors" onClick={() => handleViewTicket(ticket)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 transition-colors" onClick={() => toast.info('Acessando link externo')}><ExternalLink className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                )) : (
                  <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-500">Nenhum chamado encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
