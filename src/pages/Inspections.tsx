import { useState } from "react"
import { Button } from "@/src/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/Table"
import { Badge } from "@/src/components/ui/Badge"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, Search, FileText, Trash2, Eye, CheckCircle2, CalendarDays, SlidersHorizontal, MapPin, ClipboardList } from "lucide-react"
import { generateInspectionPDF } from "@/src/lib/pdf-generator"
import { useData } from "@/src/context/DataContext"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export function Inspections() {
  const { inspections, addInspection, removeInspection } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')

  const [newInspection, setNewInspection] = useState({
    area: 'pool',
    type: 'daily',
    inspector: '',
    observations: '',
    routines: ['Limpeza Geral', 'Verificar Equipamentos']
  })

  const filteredInspections = inspections.filter(insp => {
    const matchesSearch = insp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insp.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insp.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'completed' ? insp.status === 'completed' : insp.status === 'draft');
    const matchesType = filterType === 'all' || insp.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  })

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const id = `INSP-${new Date().getFullYear()}-${String(inspections.length + 1).padStart(3, '0')}`
    const date = new Date().toISOString().split('T')[0]
    const areaLabels: Record<string, string> = { pool: 'Piscina e Deck', gym: 'Academia', garage: 'Garagens', roof: 'Telhado/Caixas d\'Água', common: 'Áreas Comuns' }

    const newEntry = {
      id,
      date,
      inspector: newInspection.inspector,
      inspectorId: 'U0',
      type: newInspection.type === 'daily' ? 'Diária' : newInspection.type === 'weekly' ? 'Semanal' : newInspection.type === 'biweekly' ? 'Quinzenal' : 'Mensal',
      status: 'draft' as const,
      score: 0,
      periodicity: newInspection.type as any,
      items: newInspection.routines.map(r => ({ id: crypto.randomUUID(), category: areaLabels[newInspection.area] || 'Geral', description: r, status: 'na' as const })),
    }

    toast.promise(new Promise((resolve) => setTimeout(() => {
      addInspection(newEntry)
      resolve(true)
    }, 1200)), {
      loading: 'Criando nova rotina de inspeção...',
      success: () => {
        setIsModalOpen(false)
        setLoading(false)
        setNewInspection({ area: 'pool', type: 'daily', inspector: '', observations: '', routines: ['Limpeza Geral', 'Verificar Equipamentos'] })
        return 'Inspeção agendada com sucesso!'
      },
      error: 'Erro ao criar inspeção.',
    })
  }

  const handleDelete = (id: string) => {
    toast.error(`Excluir inspeção ${id}?`, {
      description: 'Esta ação não pode ser desfeita.',
      action: {
        label: 'Confirmar',
        onClick: () => {
          removeInspection(id)
          toast.success(`Inspeção ${id} excluída com sucesso!`)
        }
      },
    });
  }

  const handleView = (insp: any) => {
    setSelectedInspection(insp)
    setIsViewModalOpen(true)
  }

  const addRoutine = () => {
    setNewInspection(prev => ({ ...prev, routines: [...prev.routines, ''] }))
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inspeções Periódicas</h1>
          <p className="text-slate-500 mt-1">Gerencie e acompanhe as rotinas de inspeção do condomínio.</p>
        </div>
        <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Inspeção
        </Button>
      </div>

      {/* Modal de Criação */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Nova Inspeção">
        <form className="space-y-4" onSubmit={handleCreateInspection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block"><MapPin className="h-3 w-3 inline mr-1 text-indigo-500" /> Área Principal</label>
              <select value={newInspection.area} onChange={(e) => setNewInspection({ ...newInspection, area: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="pool">Piscina e Deck</option>
                <option value="gym">Academia</option>
                <option value="garage">Garagens (G1/G2)</option>
                <option value="roof">Telhado e Caixas d'Água</option>
                <option value="common">Áreas Comuns (Hall/Elevadores)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Tipo de Ciclo</label>
              <select value={newInspection.type} onChange={(e) => setNewInspection({ ...newInspection, type: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Inspetor Responsável</label>
            <input required type="text" placeholder="Nome do inspetor" value={newInspection.inspector} onChange={(e) => setNewInspection({ ...newInspection, inspector: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700 block"><ClipboardList className="h-3 w-3 inline mr-1 text-indigo-500" /> Rotinas / Lugares Específicos</label>
              <Button type="button" variant="ghost" size="sm" className="text-indigo-600 text-xs h-6" onClick={addRoutine}>+ Adicionar</Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {newInspection.routines.map((routine, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={routine} onChange={(e) => { const updated = [...newInspection.routines]; updated[idx] = e.target.value; setNewInspection({ ...newInspection, routines: updated }); }} className="flex-1 rounded-lg border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                  {newInspection.routines.length > 1 && (
                    <Button type="button" variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-red-500" onClick={() => { setNewInspection({ ...newInspection, routines: newInspection.routines.filter((_, i) => i !== idx) }); }}>×</Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Observações Iniciais</label>
            <textarea rows={2} placeholder="Algum ponto de atenção específico?" value={newInspection.observations} onChange={(e) => setNewInspection({ ...newInspection, observations: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={loading}>
              {loading ? 'Processando...' : <><CheckCircle2 className="h-4 w-4 mr-2" /> Agendar Inspeção</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filtros de Inspeção">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['all', 'completed', 'draft'].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`p-2 text-xs font-bold rounded-xl border transition-all ${filterStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500'}`}>
                  {s === 'all' ? 'Todos' : s === 'completed' ? 'Concluída' : 'Rascunho'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Periodicidade</label>
            <div className="grid grid-cols-2 gap-2">
              {['all', 'Diária', 'Semanal', 'Quinzenal', 'Mensal'].map((t) => (
                <button key={t} onClick={() => setFilterType(t)} className={`p-2 text-xs font-bold rounded-xl border transition-all ${filterType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500'}`}>
                  {t === 'all' ? 'Todas' : t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => { setFilterStatus('all'); setFilterType('all'); toast.success('Filtros limpos'); }}>Limpar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsFilterModalOpen(false); toast.success('Filtros aplicados'); }}>Aplicar</Button>
          </div>
        </div>
      </Modal>

      {/* Period Modal */}
      <Modal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} title="Selecionar Período">
        <div className="space-y-4">
          <div className="grid gap-2">
            {[{ id: 'all', label: 'Todo o período', desc: 'Exibir histórico completo' }, { id: 'today', label: 'Hoje', desc: 'Inspeções do dia' }, { id: 'week', label: 'Últimos 7 dias', desc: 'Resumo semanal' }, { id: 'month', label: 'Último mês', desc: 'Relatório mensal' }].map((p) => (
              <button key={p.id} onClick={() => setFilterPeriod(p.id)} className={`flex flex-col p-4 rounded-xl border text-left transition-all ${filterPeriod === p.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-500'}`}>
                <span className="text-sm font-bold text-slate-900">{p.label}</span>
                <span className="text-xs text-slate-500">{p.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsPeriodModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsPeriodModalOpen(false); toast.success(`Período selecionado`); }}>Confirmar</Button>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalhes da Inspeção ${selectedInspection?.id}`}>
        {selectedInspection && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Inspetor', val: selectedInspection.inspector }, { label: 'Data', val: selectedInspection.date }, { label: 'Tipo', val: selectedInspection.type }, { label: 'Periodicidade', val: selectedInspection.periodicity || 'N/A' }].map((f, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{f.val}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pontuação (Score)</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{selectedInspection.score}%</p>
              </div>
              <Badge variant={selectedInspection.status === 'completed' ? 'success' : 'warning'}>{selectedInspection.status === 'completed' ? 'Concluída' : 'Rascunho'}</Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-3">Itens Verificados</p>
              <div className="space-y-2">
                {(selectedInspection.items?.length > 0 ? selectedInspection.items : [{ description: 'Estrutura Geral' }, { description: 'Limpeza' }, { description: 'Segurança' }]).map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <span className="text-xs text-slate-600">{it.description || it.name || it}</span>
                    <Badge className={selectedInspection.status === 'completed' ? "bg-emerald-100 text-emerald-700 border-none text-[10px]" : "bg-slate-100 text-slate-500 border-none text-[10px]"}>
                      {selectedInspection.status === 'completed' ? 'Conforme' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="text-indigo-600 border-indigo-100" onClick={() => { generateInspectionPDF(selectedInspection); toast.success(`PDF de ${selectedInspection.id} gerado!`); }}>
                <FileText className="h-4 w-4 mr-2" /> Exportar PDF
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Tabela */}
      <motion.div variants={item}>
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar por ID, inspetor ou tipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className={`rounded-xl ${(filterStatus !== 'all' || filterType !== 'all') ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`} onClick={() => setIsFilterModalOpen(true)}>
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
                </Button>
                <Button variant="outline" size="sm" className={`rounded-xl ${filterPeriod !== 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`} onClick={() => setIsPeriodModalOpen(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" /> Período
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px]">ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Inspetor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.length > 0 ? filteredInspections.map((insp) => (
                  <motion.tr key={insp.id} variants={item} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell className="font-bold text-indigo-600 py-4">{insp.id}</TableCell>
                    <TableCell className="text-slate-600">{insp.date}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-medium">{insp.type}</Badge></TableCell>
                    <TableCell className="text-slate-700 font-medium">{insp.inspector}</TableCell>
                    <TableCell><Badge variant={insp.status === 'completed' ? 'success' : 'warning'} className="rounded-md px-2">{insp.status === 'completed' ? 'Concluída' : 'Rascunho'}</Badge></TableCell>
                    <TableCell className="text-center">
                      {insp.status === 'completed' ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-bold ${insp.score >= 90 ? 'text-emerald-600' : insp.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{insp.score}%</span>
                          <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className={`h-full rounded-full ${insp.score >= 90 ? 'bg-emerald-500' : insp.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${insp.score}%` }} /></div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleView(insp)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(insp.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                )) : (
                  <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-500">Nenhuma inspeção encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
