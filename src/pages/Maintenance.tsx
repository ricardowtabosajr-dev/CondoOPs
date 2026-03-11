import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/Table"
import { Badge } from "@/src/components/ui/Badge"
import { Button } from "@/src/components/ui/Button"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, Search, Filter, History, Eye, Box, Settings, Activity, Clock, AlertTriangle, X } from "lucide-react"
import { useData } from "@/src/context/DataContext"
import { useNotifications } from "@/src/context/NotificationContext"
import { useAuth } from "@/src/context/AuthContext"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export function Maintenance() {
  const { equipments, addEquipment } = useData()
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const [newAsset, setNewAsset] = useState({ name: '', category: 'hydraulic', code: '', model: '' })

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const id = newAsset.code || `EQ-${String(equipments.length + 1).padStart(3, '0')}`
    const entry = {
      id,
      name: newAsset.name,
      category: newAsset.category === 'hydraulic' ? 'Hidráulica' : newAsset.category === 'eletrical' ? 'Elétrica' : newAsset.category === 'structural' ? 'Estrutura' : 'Elevadores',
      status: 'operational' as const,
      lastMaintenance: new Date().toISOString().split('T')[0],
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    toast.promise(new Promise((resolve) => setTimeout(() => {
      addEquipment(entry)
      if (user && user.role !== 'Administrador') {
        addNotification({
          title: 'Novo Ativo Cadastrado',
          message: `"${newAsset.name}" adicionado na categoria ${entry.category}.`,
          type: 'maintenance',
          actionBy: user.name,
          actionByRole: user.role,
        })
      }
      resolve(true)
    }, 1200)), {
      loading: 'Cadastrando novo ativo no inventário...',
      success: () => {
        setIsModalOpen(false)
        setLoading(false)
        setNewAsset({ name: '', category: 'hydraulic', code: '', model: '' })
        return 'Ativo cadastrado com sucesso!'
      },
      error: 'Erro ao cadastrar ativo.',
    })
  }

  const filteredEquipments = equipments.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || e.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = statusFilter ? e.status === statusFilter : true;
    const matchesCritical = statusFilter === 'critical' ? e.status !== 'operational' : true;

    if (statusFilter === 'critical') return matchesSearch && matchesCategory && matchesCritical;
    return matchesSearch && matchesCategory && matchesStatus;
  })

  const operationalCount = equipments.filter(e => e.status === 'operational').length
  const maintenanceCount = equipments.filter(e => e.status === 'maintenance').length
  const criticalCount = equipments.filter(e => e.status !== 'operational').length

  const handleViewDetail = (eq: any) => { setSelectedEquipment(eq); setIsDetailModalOpen(true); }

  const kpiStats = [
    { label: "Ativos em Campo", value: operationalCount, status: 'operational', icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Próximas Manutenções", value: maintenanceCount, status: 'maintenance', icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Status Crítico", value: criticalCount, status: 'critical', icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Manutenção</h1>
          <p className="text-slate-500 mt-1 text-left">Controle de manutenções preventivas e corretivas de equipamentos.</p>
        </div>
        <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Cadastrar Ativo
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastro de Ativo">
        <form className="space-y-4" onSubmit={handleCreateAsset}>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Nome do Equipamento</label>
            <input required type="text" placeholder="Ex: Bomba Recalque P01" value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Categoria</label>
              <select value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="eletrical">Elétrica</option>
                <option value="hydraulic">Hidráulica</option>
                <option value="structural">Estrutura</option>
                <option value="elevators">Elevadores</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Cód. Patrimônio</label>
              <input type="text" placeholder="EQP-000" value={newAsset.code} onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Fabricante / Modelo</label>
            <input type="text" placeholder="Marca e Modelo" value={newAsset.model} onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={loading}>
              {loading ? 'Salvando...' : <><Box className="h-4 w-4 mr-2" /> Salvar Ativo</>}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filtrar por Categoria">
        <div className="grid grid-cols-2 gap-3">
          {['all', 'Hidráulica', 'Elétrica', 'Estrutura', 'Elevadores'].map((cat) => (
            <button key={cat} onClick={() => { setFilterCategory(cat); setIsFilterModalOpen(false); toast.success(`Filtrando por: ${cat === 'all' ? 'Todas' : cat}`); }}
              className={`p-4 rounded-xl border text-sm font-bold transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500'}`}>
              {cat === 'all' ? 'Todas as Categorias' : cat}
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Histórico de Manutenções">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {[
            // Dados de histórico serão carregados dinamicamente via banco de dados
          ].map((h, i) => (
            <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">{h.date}</span>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 border-none">Sucesso</Badge>
              </div>
              <p className="text-sm font-bold text-slate-900 text-left">{h.eq} - {h.type}</p>
              <p className="text-xs text-slate-500 mt-1 text-left">Técnico: {h.tech}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => setIsHistoryModalOpen(false)}>Fechar</Button>
        </div>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Detalhes: ${selectedEquipment?.name}`}>
        {selectedEquipment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={selectedEquipment.status === 'operational' ? 'success' : selectedEquipment.status === 'maintenance' ? 'warning' : 'destructive'}>
                {selectedEquipment.status === 'operational' ? 'Operacional' : selectedEquipment.status === 'maintenance' ? 'Em Manutenção' : 'Offline'}
              </Badge>
              <span className="text-xs text-slate-400 font-bold">{selectedEquipment.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Última Manut.</p>
                <p className="text-sm font-bold text-slate-900 mt-1 text-left">{selectedEquipment.lastMaintenance}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Próxima Manut.</p>
                <p className="text-sm font-bold text-indigo-600 mt-1 text-left">{selectedEquipment.nextMaintenance}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="text-slate-600" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => { setIsDetailModalOpen(false); toast.success('Abrindo ordem de serviço...'); }}>Criar OS</Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid gap-4 md:grid-cols-3">
        {kpiStats.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card
              className={`border-none shadow-sm ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50 transition-all active:scale-95 group ${statusFilter === stat.status ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
              onClick={() => { setStatusFilter(statusFilter === stat.status ? null : stat.status); toast.success(`Filtrando por: ${stat.label}`); }}
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
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar equipamento..." className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2">
                {(filterCategory !== 'all' || statusFilter) && (
                  <Button variant="ghost" size="sm" className="text-red-500 h-10 border border-red-100 hover:bg-red-50" onClick={() => { setFilterCategory('all'); setStatusFilter(null); }}>
                    Limpar <X className="h-3 w-3 ml-2" />
                  </Button>
                )}
                <Button variant="outline" size="sm" className={`rounded-xl ${filterCategory !== 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`} onClick={() => setIsFilterModalOpen(true)}>
                  <Filter className="h-4 w-4 mr-2" /> Categoria
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200" onClick={() => setIsHistoryModalOpen(true)}>
                  <History className="h-4 w-4 mr-2" /> Histórico
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-left">
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Manut.</TableHead>
                  <TableHead>Próxima Manut.</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.length > 0 ? filteredEquipments.map((eq) => (
                  <TableRow key={eq.id} className="group hover:bg-slate-50/50 transition-colors text-left">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{eq.name}</span>
                        <span className="text-xs text-slate-500">{eq.id}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium text-left">{eq.category}</Badge></TableCell>
                    <TableCell><Badge variant={eq.status === 'operational' ? 'success' : eq.status === 'maintenance' ? 'warning' : 'destructive'}>{eq.status === 'operational' ? 'Operacional' : eq.status === 'maintenance' ? 'Em Manutenção' : 'Offline'}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-600 text-left">{eq.lastMaintenance}</TableCell>
                    <TableCell className="text-sm text-slate-600 text-left">{eq.nextMaintenance}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleViewDetail(eq)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => toast.success(`Configurações para ${eq.id}`)}><Settings className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-500">Nenhum equipamento encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
