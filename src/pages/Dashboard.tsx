import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/Card"
import { Badge } from "@/src/components/ui/Badge"
import { Button } from "@/src/components/ui/Button"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Activity,
  Wrench, ArrowUpRight, ShieldCheck
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell
} from "recharts"
import { CHART_DATA } from "@/src/lib/mock-data"
import { useNavigate } from "react-router-dom"
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

export function Dashboard() {
  const navigate = useNavigate();
  const { tickets, addTicket, equipments, inspections } = useData()
  const { addNotification } = useNotifications()
  const { user } = useAuth()

  const criticalEquipments = equipments.filter(e => e.status !== 'operational');
  const openTickets = tickets.filter(t => t.status === 'open');

  const kpiCards = [
    { title: "Conformidade", value: "0%", icon: Activity, trend: "0%", color: "text-emerald-500", bg: "bg-emerald-50", trendColor: "text-emerald-600", path: "/inspections" },
    { title: "Chamados Abertos", value: openTickets.length, icon: AlertTriangle, trend: `${tickets.filter(t => t.priority === 'high').length} críticos`, color: "text-amber-500", bg: "bg-amber-50", trendColor: "text-amber-600", path: "/tickets" },
    { title: "Inspeções Pendentes", value: inspections.length, icon: Clock, trend: `${inspections.filter(i => i.status === 'draft').length} rascunhos`, color: "text-indigo-500", bg: "bg-indigo-50", trendColor: "text-slate-500", path: "/inspections" },
    { title: "Manutenções Ativas", value: criticalEquipments.length, icon: Wrench, trend: `${equipments.length} ativos no total`, color: "text-slate-600", bg: "bg-slate-100", trendColor: "text-slate-500", path: "/maintenance" },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
            Painel de Gestão
          </h1>
          <p className="text-slate-500 mt-1">Bem-vindo de volta, Síndico. Aqui está o resumo operacional de hoje.</p>
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <motion.div key={index} variants={item}>
            <Card
              className="hover:shadow-md transition-all duration-300 border-none bg-white shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-95 group"
              onClick={() => navigate(kpi.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{kpi.value}</div>
                <div className={`flex items-center mt-2 text-xs font-medium ${kpi.trendColor}`}>
                  {kpi.trend.includes('+') ? <TrendingUp className="h-3 w-3 mr-1" /> : null}
                  {kpi.trend}
                  <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/30">
              <div>
                <CardTitle>Análise de Custos</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Prevenção vs. Correção (Últimos 6 meses)</p>
              </div>
              <div className="flex space-x-2">
                <div className="flex items-center text-xs"><div className="h-2 w-2 rounded-full bg-emerald-500 mr-1"></div><span>Preventiva</span></div>
                <div className="flex items-center text-xs"><div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div><span>Corretiva</span></div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHART_DATA.maintenance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `R$${val}`} />
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
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <CardTitle>Conformidade Operacional</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Evolução do Score Global semanal</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={CHART_DATA.compliance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={item} className="col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
              <CardTitle>Últimos Chamados</CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-600" onClick={() => navigate('/tickets')}>
                Ver todos<ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {tickets.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => navigate('/tickets')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 h-2 w-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-left">{ticket.title}</p>
                        <p className="text-xs text-slate-500 mt-1 text-left">{ticket.id} • {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Andamento' : 'Resolvido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'warning' : 'secondary'}>
                        {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">Nenhum chamado registrado.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="border-b border-slate-50">
              <CardTitle>Status de Ativos Críticos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {equipments.slice(0, 4).map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => navigate('/maintenance')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${eq.status === 'operational' ? 'bg-emerald-50 group-hover:bg-emerald-100' :
                        eq.status === 'maintenance' ? 'bg-amber-50 group-hover:bg-amber-100' : 'bg-red-50 group-hover:bg-red-100'
                        }`}>
                        <Wrench className={`h-5 w-5 ${eq.status === 'operational' ? 'text-emerald-600' :
                          eq.status === 'maintenance' ? 'text-amber-600' : 'text-red-600'
                          }`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{eq.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-tight">{eq.category}</p>
                      </div>
                    </div>
                    <div>
                      <Badge variant={
                        eq.status === 'operational' ? 'success' :
                          eq.status === 'maintenance' ? 'warning' : 'destructive'
                      } className="text-[10px] py-0 px-2 transition-all group-hover:scale-110">
                        {eq.status === 'operational' ? 'OK' : eq.status === 'maintenance' ? 'Manut.' : 'Falha'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {equipments.length === 0 && (
                  <div className="text-center text-slate-500 text-sm">Nenhum ativo cadastrado.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
