import { useState, useRef, useEffect } from "react"
import { Button } from "@/src/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/Table"
import { Badge } from "@/src/components/ui/Badge"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, Search, FileText, Trash2, Eye, CheckCircle2, CalendarDays, SlidersHorizontal, MapPin, ClipboardList, Camera, Image, X, ExternalLink } from "lucide-react"
import { generateInspectionPDF, generateInspectionsSummaryPDF } from "@/src/lib/pdf-generator"
import { useData } from "@/src/context/DataContext"
import { useNotifications } from "@/src/context/NotificationContext"
import { useAuth } from "@/src/context/AuthContext"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

interface InspectionArea {
  name: string
  status: 'ok' | 'nok' | 'na' | null
  observation: string
  photos: string[] // base64 data URLs
}

export function Inspections() {
  const {
    inspections,
    addInspection,
    updateInspection,
    removeInspection,
    tickets,
    addTicket
  } = useData()
  const { addNotification } = useNotifications()
  const { user } = useAuth()
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
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    if (isModalOpen && user) {
      setNewInspection(prev => ({ ...prev, inspector: user.name }))
    }
  }, [isModalOpen, user])

  const defaultAreas: InspectionArea[] = []

  const [newInspection, setNewInspection] = useState({
    type: 'daily',
    inspector: '',
    observations: '',
    areas: [...defaultAreas] as InspectionArea[],
    newAreaName: '',
  })

  const predefinedAreas = ['Piscina e Deck', 'Academia', 'Garagem', 'Lixeira', 'Telhado e Caixas d\'Água', 'Áreas Comuns', 'Salão de Festas', 'Jardim', 'Portaria', 'Casa de Máquinas', 'Reservatórios', 'Playground', 'Quadra Esportiva']

  const addArea = (areaName?: string) => {
    const name = areaName || newInspection.newAreaName.trim()
    if (!name) return
    if (newInspection.areas.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Esta área já foi adicionada.')
      return
    }
    setNewInspection(prev => ({
      ...prev,
      areas: [...prev.areas, { name, status: null, observation: '', photos: [] }],
      newAreaName: '',
    }))
  }

  const removeArea = (idx: number) => {
    setNewInspection(prev => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== idx),
    }))
  }

  const updateArea = (idx: number, field: keyof InspectionArea, value: any) => {
    setNewInspection(prev => {
      const areas = [...prev.areas]
      areas[idx] = { ...areas[idx], [field]: value }
      return { ...prev, areas }
    })
  }

  const handlePhotoUpload = (areaIdx: number, files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Arquivo "${file.name}" excede 5MB.`)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setNewInspection(prev => {
          const areas = [...prev.areas]
          areas[areaIdx] = { ...areas[areaIdx], photos: [...areas[areaIdx].photos, reader.result as string] }
          return { ...prev, areas }
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (areaIdx: number, photoIdx: number) => {
    setNewInspection(prev => {
      const areas = [...prev.areas]
      areas[areaIdx] = { ...areas[areaIdx], photos: areas[areaIdx].photos.filter((_, i) => i !== photoIdx) }
      return { ...prev, areas }
    })
  }

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
    if (newInspection.areas.length === 0) { toast.error('Adicione ao menos uma área.'); return }
    setLoading(true)

    const id = `INSP-${new Date().getFullYear()}-${String(inspections.length + 1).padStart(3, '0')}`
    const date = new Date().toISOString().split('T')[0]
    const typeLabels: Record<string, string> = { daily: 'Diária', weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal' }

    const evaluatedAreas = newInspection.areas.filter(a => a.status !== null)
    const conformeAreas = newInspection.areas.filter(a => a.status === 'ok' || a.status === 'na')
    const score = evaluatedAreas.length > 0 ? Math.round((conformeAreas.length / evaluatedAreas.length) * 100) : 0

    const newEntry = {
      id,
      date,
      inspector: newInspection.inspector,
      type: typeLabels[newInspection.type] || 'Diária',
      status: evaluatedAreas.length === newInspection.areas.length && evaluatedAreas.length > 0 ? 'completed' : 'draft',
      score,
      periodicity: typeLabels[newInspection.type] || 'Diária',
      areas: newInspection.areas.map(a => ({ name: a.name, status: a.status, observation: a.observation, photos: a.photos })),
    }

    // Find non-conforming areas to auto-generate tickets
    const nokAreas = newInspection.areas.filter(a => a.status === 'nok')

    toast.promise(new Promise((resolve) => setTimeout(() => {
      addInspection(newEntry)

      // Auto-create tickets for non-conforming areas
      if (nokAreas.length > 0) {
        nokAreas.forEach(area => {
          const ticketId = `CH-${String(1000 + Math.floor(Math.random() * 9000))}`
          addTicket({
            id: ticketId,
            inspectionId: id, // Passando o ID da inspeção para vincular
            title: `Não conformidade: ${area.name}`,
            description: `Identificado na inspeção ${id}. Área "${area.name}" registrada como Não Conforme.${area.observation ? ` Obs: ${area.observation}` : ''}`,
            status: 'open',
            priority: 'high' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        })
      }

      if (user && user.role !== 'Administrador') {
        addNotification({
          title: 'Nova Inspeção Criada',
          message: `${newInspection.areas.length} áreas inspecionadas por ${newInspection.inspector}${nokAreas.length > 0 ? ` — ${nokAreas.length} não conformidade(s)` : ''}`,
          type: 'inspection',
          actionBy: user.name,
          actionByRole: user.role,
        })
      }
      resolve(true)
    }, 1200)), {
      loading: 'Criando nova rotina de inspeção...',
      success: () => {
        setIsModalOpen(false)
        setLoading(false)
        setNewInspection({ type: 'daily', inspector: '', observations: '', areas: [...defaultAreas], newAreaName: '' })
        if (nokAreas.length > 0) {
          return `Inspeção criada! ${nokAreas.length} chamado(s) gerado(s) para áreas não conformes.`
        }
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
        <form className="space-y-5" onSubmit={handleCreateInspection}>
          {/* Inspetor e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Inspetor Responsável</label>
              <input required type="text" placeholder="Nome do inspetor" value={newInspection.inspector} onChange={(e) => setNewInspection({ ...newInspection, inspector: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
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

          {/* Áreas de Inspeção */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700"><MapPin className="h-3.5 w-3.5 inline mr-1 text-indigo-500" /> Áreas de Inspeção ({newInspection.areas.length})</label>
            </div>

            {/* Adicionar área predefinida ou personalizada */}
            <div className="flex gap-2 mb-3">
              <select
                value=""
                onChange={(e) => { if (e.target.value) addArea(e.target.value) }}
                className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-500"
              >
                <option value="" disabled>Selecionar área...</option>
                {predefinedAreas.filter(a => !newInspection.areas.some(existing => existing.name === a)).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ou digite uma área personalizada..."
                value={newInspection.newAreaName}
                onChange={(e) => setNewInspection({ ...newInspection, newAreaName: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea() } }}
                className="flex-1 rounded-xl border border-dashed border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Button type="button" variant="outline" size="sm" className="h-auto px-4 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => addArea()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de áreas com status e fotos */}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {newInspection.areas.map((area, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
                  {/* Nome e ações */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      {area.name}
                    </span>
                    <button type="button" onClick={() => removeArea(idx)} className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Status da área */}
                  <div className="flex gap-2">
                    {(['ok', 'nok', 'na'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateArea(idx, 'status', status)}
                        className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${area.status === status
                          ? status === 'ok' ? 'bg-emerald-500 text-white border-emerald-500'
                            : status === 'nok' ? 'bg-red-500 text-white border-red-500'
                              : 'bg-slate-500 text-white border-slate-500'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                          }`}
                      >
                        {status === 'ok' ? '✓ Conforme' : status === 'nok' ? '✗ Não Conforme' : '— N/A'}
                      </button>
                    ))}
                  </div>

                  {/* Observação da área */}
                  <input
                    type="text"
                    placeholder="Observação desta área..."
                    value={area.observation}
                    onChange={(e) => updateArea(idx, 'observation', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />

                  {/* Upload de fotos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Registro Fotográfico
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Adicionar Foto
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[idx] = el }}
                        onChange={(e) => handlePhotoUpload(idx, e.target.files)}
                      />
                    </div>

                    {area.photos.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {area.photos.map((photo, pIdx) => (
                          <div key={pIdx} className="relative group rounded-xl overflow-hidden aspect-square">
                            <img src={photo} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx, pIdx)}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="flex flex-col items-center justify-center py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-all"
                      >
                        <Image className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-semibold">Toque para tirar foto</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {newInspection.areas.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">Nenhuma área adicionada</p>
                  <p className="text-xs">Selecione ou digite uma área acima.</p>
                </div>
              )}
            </div>
          </div>

          {/* Observações gerais */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Observações Gerais</label>
            <textarea rows={2} placeholder="Algum ponto de atenção geral?" value={newInspection.observations} onChange={(e) => setNewInspection({ ...newInspection, observations: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none" />
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
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Inspetor', val: selectedInspection.inspector }, { label: 'Data', val: selectedInspection.date }, { label: 'Tipo', val: selectedInspection.type }, { label: 'Periodicidade', val: selectedInspection.periodicity || 'N/A' }].map((f, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{f.val}</p>
                </div>
              ))}
            </div>

            {/* Score + Status */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${selectedInspection.status === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedInspection.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>Pontuação (Score)</p>
                <p className={`text-2xl font-bold mt-1 ${selectedInspection.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>{selectedInspection.score}%</p>
              </div>
              <Badge variant={selectedInspection.status === 'completed' ? 'success' : 'warning'}>
                {selectedInspection.status === 'completed' ? 'Concluída' : 'Pendente'}
              </Badge>
            </div>

            {/* Áreas Inspecionadas */}
            <div>
              <p className="text-sm font-bold text-slate-900 mb-3">Áreas Inspecionadas</p>
              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {(() => {
                  const areas = selectedInspection.areas || selectedInspection.items || []
                  if (areas.length === 0) return (
                    <div className="text-center py-6 text-slate-400">
                      <MapPin className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">Nenhuma área registrada nesta inspeção.</p>
                    </div>
                  )
                  return areas.map((area: any, idx: number) => {
                    const name = typeof area === 'string' ? area : (area.name || area.description || area.category || 'Área')
                    const status = typeof area === 'string'
                      ? (selectedInspection.status === 'completed' ? 'ok' : 'pending')
                      : (area.status || 'pending')
                    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                      ok: { label: 'Conforme', color: 'text-emerald-700', bg: 'bg-emerald-100' },
                      nok: { label: 'Não Conforme', color: 'text-red-700', bg: 'bg-red-100' },
                      na: { label: 'N/A', color: 'text-slate-500', bg: 'bg-slate-100' },
                      pending: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-100' },
                    }
                    const cfg = statusConfig[status] || statusConfig.pending
                    return (
                      <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-700">{name}</span>
                          </div>
                          <Badge className={`${cfg.bg} ${cfg.color} border-none text-[10px] font-bold`}>
                            {cfg.label}
                          </Badge>
                        </div>

                        {(typeof area === 'object' && area.observation) && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            "{area.observation}"
                          </p>
                        )}

                        {(typeof area === 'object' && area.photos && area.photos.length > 0) && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {area.photos.map((photo: string, pIdx: number) => (
                              <div key={pIdx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                                <img src={photo} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button onClick={() => window.open(photo)} className="p-1 bg-white rounded-full text-indigo-600 shadow-sm">
                                    <ExternalLink className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {selectedInspection.status !== 'completed' && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                  onClick={() => {
                    const areas = selectedInspection.areas || []
                    // Count conforme: ok and na are both "acceptable"
                    const conformeCount = areas.filter((a: any) => {
                      let obj = a;
                      if (typeof a === 'string' && (a.startsWith('{') || a.startsWith('['))) {
                        try { obj = JSON.parse(a); } catch (e) { }
                      }
                      const s = typeof obj === 'string' ? 'ok' : (obj.status || 'ok');
                      return s === 'ok' || s === 'na';
                    }).length;

                    const evaluatedCount = areas.filter((a: any) => {
                      let obj = a;
                      if (typeof a === 'string' && (a.startsWith('{') || a.startsWith('['))) {
                        try { obj = JSON.parse(a); } catch (e) { }
                      }
                      const s = typeof obj === 'string' ? 'ok' : obj.status;
                      return s !== null && s !== undefined;
                    }).length;

                    const score = evaluatedCount > 0 ? Math.round((conformeCount / evaluatedCount) * 100) : 100;

                    // Check for non-conforming areas to create tickets
                    const nokAreas = areas
                      .filter((a: any) => {
                        let obj = a;
                        if (typeof a === 'string' && (a.startsWith('{') || a.startsWith('['))) {
                          try { obj = JSON.parse(a); } catch (e) { }
                        }
                        return typeof obj === 'object' && obj.status === 'nok';
                      })
                      .map((a: any) => {
                        let obj = a;
                        if (typeof a === 'string' && (a.startsWith('{') || a.startsWith('['))) {
                          try { obj = JSON.parse(a); } catch (e) { }
                        }
                        return obj.name || obj.description || 'Área';
                      });

                    // Update inspection in DB
                    updateInspection(selectedInspection.id, { status: 'completed', score })

                    if (nokAreas.length > 0) {
                      // Create tickets for non-conforming areas
                      nokAreas.forEach((areaName: string) => {
                        const ticketId = `CH-${String(1000 + Math.floor(Math.random() * 9000))}`
                        addTicket({
                          id: ticketId,
                          inspectionId: selectedInspection.id,
                          title: `Não conformidade: ${areaName}`,
                          description: `Identificado na inspeção ${selectedInspection.id}. Área "${areaName}" registrada como Não Conforme.`,
                          status: 'open',
                          priority: 'high' as const,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        })
                      })
                      toast.success(`Inspeção concluída! ${nokAreas.length} chamado(s) gerado(s).`)
                    } else {
                      toast.success('Inspeção concluída com sucesso!')
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Concluir Inspeção
                </Button>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" className="text-indigo-600 border-indigo-100" onClick={() => { generateInspectionPDF(selectedInspection); toast.success(`PDF de ${selectedInspection.id} gerado!`); }}>
                  <FileText className="h-4 w-4 mr-2" /> Exportar PDF
                </Button>
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
              </div>
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
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    generateInspectionsSummaryPDF(filteredInspections);
                    toast.success('Relatório geral gerado com sucesso!');
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" /> Gerar Relatório
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">ID</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Fechamento</TableHead>
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
                    <TableCell className="text-slate-600 text-[11px] leading-tight">
                      {insp.openedAt ? new Date(insp.openedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : insp.date}
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px] leading-tight">
                      {insp.completedAt ? new Date(insp.completedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : (insp.status === 'completed' ? 'Sim' : '-')}
                    </TableCell>
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
