import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/Card"
import { Badge } from "@/src/components/ui/Badge"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, FileText, Filter, Download, Calendar, Plus, Receipt, X } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CHART_DATA } from "@/src/lib/mock-data"
import { Button } from "@/src/components/ui/Button"
import { generateFinancialPDF } from "@/src/lib/pdf-generator"
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

const categoryData = [
  { name: 'Preventiva', value: 45, color: '#10b981' },
  { name: 'Corretiva', value: 35, color: '#ef4444' },
  { name: 'Inspeções', value: 10, color: '#6366f1' },
  { name: 'Outros', value: 10, color: '#94a3b8' },
]

export function Financial() {
  const { transactions, addTransaction } = useData()
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedStat, setSelectedStat] = useState<any>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const [newExpense, setNewExpense] = useState({ desc: '', value: '', date: '', category: 'corr', type: 'out' })

  const handleExport = () => {
    generateFinancialPDF({ period: selectedPeriod, items: transactions });
    toast.success('Exportação financeira concluída!');
  };

  const handleNewExpense = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const d = newExpense.date ? new Date(newExpense.date) : new Date()
    const dateStr = `${d.getDate()} ${months[d.getMonth()]}`
    const catLabels: Record<string, string> = { prev: 'Preventiva', corr: 'Corretiva', fixed: 'Fixo', supplies: 'Insumo' }
    const isIncome = newExpense.type === 'in'
    const val = parseFloat(newExpense.value) || 0

    const entry = {
      date: dateStr,
      desc: newExpense.desc,
      cat: catLabels[newExpense.category] || newExpense.category,
      value: `${isIncome ? '+' : '-'} R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      type: newExpense.type as 'in' | 'out'
    }

    toast.promise(new Promise((resolve) => setTimeout(() => {
      addTransaction(entry)
      if (user && user.role !== 'Administrador') {
        addNotification({
          title: isIncome ? 'Nova Receita Lançada' : 'Nova Despesa Lançada',
          message: `"${newExpense.desc}" — ${entry.value}`,
          type: 'financial',
          actionBy: user.name,
          actionByRole: user.role,
        })
      }
      resolve(true)
    }, 1500)), {
      loading: 'Registrando lançamento financeiro...',
      success: () => {
        setIsModalOpen(false)
        setLoading(false)
        setNewExpense({ desc: '', value: '', date: '', category: 'corr', type: 'out' })
        return 'Lançamento efetuado com sucesso!'
      },
      error: 'Erro ao registrar despesa.',
    })
  }

  const handleViewStat = (stat: any) => { setSelectedStat(stat); setIsDetailModalOpen(true); }
  const handleViewTransaction = (item: any) => { setSelectedTransaction(item); }

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = selectedFilter === 'all' || t.cat.toLowerCase() === selectedFilter.toLowerCase();
    const matchesType = typeFilter ? t.type === typeFilter : true;
    return matchesFilter && matchesType;
  });

  const kpis = [
    { label: "Orçamento Mensal", value: "R$ 15.000", trend: "+5%", icon: Wallet, color: "text-indigo-600", bg: "bg-indigo-50", type: null },
    { label: "Total Gasto", value: "R$ 12.450", trend: "-2%", icon: ArrowDownRight, color: "text-red-600", bg: "bg-red-50", type: 'out' },
    { label: "Receitas", value: "R$ 14.200", trend: "+8%", icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50", type: 'in' },
    { label: "Reserva Emergência", value: "R$ 45.000", trend: "Meta: 100%", icon: DollarSign, color: "text-slate-600", bg: "bg-slate-100", type: null },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-left">Gestão Financeira</h1>
          <p className="text-slate-500 mt-1 text-left">Gestão de custos operacionais e orçamentos de manutenção.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white border-slate-200" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 text-xs font-bold sm:text-sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1 sm:mr-2" /> Nova Despesa
          </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento">
        <form className="space-y-4" onSubmit={handleNewExpense}>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Descrição</label>
            <input required type="text" placeholder="Ex: Manutenção Bomba P01" value={newExpense.desc} onChange={(e) => setNewExpense({ ...newExpense, desc: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Valor (R$)</label>
              <input required type="number" step="0.01" placeholder="0,00" value={newExpense.value} onChange={(e) => setNewExpense({ ...newExpense, value: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Data</label>
              <input required type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Categoria</label>
              <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="prev">Manutenção Preventiva</option>
                <option value="corr">Manutenção Corretiva</option>
                <option value="fixed">Custo Fixo</option>
                <option value="supplies">Insumos e Materiais</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block text-left">Tipo</label>
              <select value={newExpense.type} onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="out">Despesa (Saída)</option>
                <option value="in">Receita (Entrada)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={loading}>
              {loading ? 'Salvando...' : <><Receipt className="h-4 w-4 mr-2" /> Confirmar Lançamento</>}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} title="Período de Análise">
        <div className="grid grid-cols-1 gap-2">
          {[{ id: '3months', label: 'Últimos 3 Meses' }, { id: '6months', label: 'Últimos 6 Meses' }, { id: '1year', label: 'Último Ano' }].map((p) => (
            <button key={p.id} onClick={() => { setSelectedPeriod(p.id); setIsPeriodModalOpen(false); toast.success(`Período: ${p.label}`); }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedPeriod === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-500'}`}>
              <span className="text-sm font-bold text-slate-900">{p.label}</span>
              {selectedPeriod === p.id && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filtros Financeiros">
        <div className="space-y-4 text-left">
          <label className="text-sm font-bold text-slate-700 mb-2 block">Categoria de Lançamento</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'all', label: 'Todos' }, { id: 'corretiva', label: 'Corretiva' }, { id: 'fixo', label: 'Custo Fixo' }, { id: 'fundo', label: 'Fundo Reserva' }, { id: 'insumo', label: 'Insumos' }, { id: 'receita', label: 'Receitas' }].map((f) => (
              <button key={f.id} onClick={() => { setSelectedFilter(f.id); setIsFilterModalOpen(false); toast.success(`Filtrando: ${f.label}`); }}
                className={`p-3 text-xs font-bold rounded-xl border transition-all ${selectedFilter === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Detalhamento: ${selectedStat?.label}`}>
        {selectedStat && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col items-center text-center">
              <div className={`h-16 w-16 rounded-2xl ${selectedStat.bg} flex items-center justify-center mb-4`}><selectedStat.icon className={`h-8 w-8 ${selectedStat.color}`} /></div>
              <h3 className="text-3xl font-bold text-slate-900">{selectedStat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{selectedStat.label}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900 text-left">Composição do Valor</p>
              {[{ item: 'Contratos Fixos', val: 'R$ 8.500', p: '56%' }, { item: 'Manutenções Avulsas', val: 'R$ 3.950', p: '26%' }, { item: 'Insumos / Outros', val: 'R$ 2.550', p: '18%' }].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs text-slate-600 text-left">{row.item}</span>
                  <div className="text-right"><p className="text-xs font-bold text-slate-900">{row.val}</p><p className="text-[10px] text-slate-400">{row.p}</p></div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsDetailModalOpen(false); handleExport(); }}>Exportar PDF</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Comprovante de Lançamento">
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento</p><p className="text-xs font-bold text-slate-900">REC-2023-10-88</p></div>
              </div>
              <Badge variant={selectedTransaction.type === 'in' ? 'success' : 'destructive'} className="rounded-md">{selectedTransaction.type === 'in' ? 'Receita' : 'Despesa'}</Badge>
            </div>
            <div className="text-left"><h3 className="text-lg font-bold text-slate-900">{selectedTransaction.desc}</h3><p className="text-2xl font-bold text-slate-900 mt-1">{selectedTransaction.value}</p></div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-3 rounded-xl bg-white border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">Data</p><p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTransaction.date}</p></div>
              <div className="p-3 rounded-xl bg-white border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p><p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTransaction.cat}</p></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedTransaction(null)}>Fechar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedTransaction(null); toast.success('Editando lançamento...'); }}>Editar</Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card
              className={`border-none shadow-sm ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50/50 transition-all active:scale-95 group ${typeFilter === stat.type && stat.type !== null ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
              onClick={() => {
                if (stat.type) {
                  setTypeFilter(typeFilter === stat.type ? null : stat.type);
                  toast.success(`Filtrando ${stat.label}`);
                } else {
                  handleViewStat(stat);
                }
              }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1 text-left">{stat.value}</h3>
                  <p className={`text-xs mt-1 font-medium text-left ${stat.trend.startsWith('+') && stat.type === 'out' ? 'text-red-500' : 'text-emerald-600'}`}>{stat.trend}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}><stat.icon className={`h-6 w-6 ${stat.color}`} /></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="flex flex-row items-center justify-between text-left">
              <div><CardTitle>Histórico de Despesas</CardTitle><CardDescription>Comparativo entre preventiva e corretiva</CardDescription></div>
              <Button variant="outline" size="sm" className="border-slate-200 bg-white" onClick={() => setIsPeriodModalOpen(true)}>
                <Calendar className="h-3 w-3 mr-2" /> {selectedPeriod === '3months' ? '3 Meses' : selectedPeriod === '6months' ? '6 Meses' : '1 Ano'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHART_DATA.maintenance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="prev" name="Preventiva" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="corr" name="Corretiva" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-3">
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="text-left"><CardTitle>Distribuição por Categoria</CardTitle><CardDescription>Gasto proporcional do mês atual</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center"><span className="text-2xl font-bold">100%</span><span className="text-[10px] text-slate-500 uppercase">Total</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center space-x-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-xs text-slate-600">{cat.name}: <strong>{cat.value}%</strong></span></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Lançamentos Recentes</CardTitle>
                {(selectedFilter !== 'all' || typeFilter) && (
                  <Badge className="bg-red-50 text-red-600 border-none flex items-center gap-1 cursor-pointer hover:bg-red-100" onClick={() => { setSelectedFilter('all'); setTypeFilter(null); }}>
                    Limpar <X className="h-2 w-2" />
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className={`text-indigo-600 ${selectedFilter !== 'all' ? 'bg-indigo-50' : ''}`} onClick={() => setIsFilterModalOpen(true)}>
                  <Filter className="h-3 w-3 mr-2" /> Categorias
                </Button>
                <Button variant="ghost" size="sm" className="text-indigo-600 hidden sm:flex" onClick={() => toast.info('Gerando extrato consolidado...')}>Ver extrato completo</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? filteredTransactions.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => handleViewTransaction(item)}>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-50 group-hover:bg-white text-slate-500 border border-slate-100 transition-colors">
                      <span className="text-[10px] font-bold uppercase">{item.date.split(' ')[1]}</span>
                      <span className="text-lg font-bold leading-none">{item.date.split(' ')[0]}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">{item.desc}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{item.cat}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-mono font-bold ${item.type === 'in' ? 'text-emerald-600' : 'text-slate-900'}`}>{item.value}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-500 text-sm">Nenhum lançamento encontrado.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
