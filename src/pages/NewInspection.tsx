import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/src/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/src/components/ui/Card"
import { Select } from "@/src/components/ui/Select"
import { Input } from "@/src/components/ui/Input"
import { ArrowLeft, Camera, AlertCircle, CheckCircle } from "lucide-react"

const checklists = {
  daily: [
    { id: 'd1', category: 'Áreas Comuns', desc: 'Limpeza e organização do hall de entrada' },
    { id: 'd2', category: 'Elevadores', desc: 'Funcionamento básico (chamadas, portas, luzes)' },
    { id: 'd3', category: 'Portaria', desc: 'Sistemas de CFTV e interfones operacionais' },
    { id: 'd4', category: 'Lazer', desc: 'Condições da piscina e jardins' },
  ],
  weekly: [
    { id: 'w1', category: 'Hidráulica', desc: 'Nível dos reservatórios e bombas de recalque' },
    { id: 'w2', category: 'Elétrica', desc: 'Centro de medição e quadros gerais' },
    { id: 'w3', category: 'Gerador', desc: 'Nível de combustível e bateria' },
    { id: 'w4', category: 'Elevadores', desc: 'Casa de máquinas (ruídos, limpeza)' },
  ]
}

export function NewInspection() {
  const navigate = useNavigate()
  const [type, setType] = useState('daily')
  const [items, setItems] = useState<Record<string, 'ok' | 'nok' | 'na' | null>>({})

  const currentChecklist = checklists[type as keyof typeof checklists] || checklists.daily

  const handleStatusChange = (id: string, status: 'ok' | 'nok' | 'na') => {
    setItems(prev => ({ ...prev, [id]: status }))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nova Inspeção</h1>
          <p className="text-sm text-slate-500">Preencha o checklist técnico.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração Inicial</CardTitle>
          <CardDescription>Selecione a periodicidade e o inspetor responsável.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Periodicidade</label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quinzenal</option>
              <option value="monthly">Mensal</option>
              <option value="semiannual">Semestral</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Inspetor</label>
            <Input value="João Silva (Zelador)" disabled />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Checklist de Execução</h2>
        {currentChecklist.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
              <div className="flex-1">
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-2">
                  {item.category}
                </span>
                <p className="text-sm font-medium text-slate-900">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={items[item.id] === 'ok' ? 'default' : 'outline'} 
                  size="sm"
                  className={items[item.id] === 'ok' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  onClick={() => handleStatusChange(item.id, 'ok')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Conforme
                </Button>
                <Button 
                  variant={items[item.id] === 'nok' ? 'destructive' : 'outline'} 
                  size="sm"
                  onClick={() => handleStatusChange(item.id, 'nok')}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Não Conforme
                </Button>
                <Button variant="ghost" size="icon" title="Adicionar Foto">
                  <Camera className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            </div>
            {items[item.id] === 'nok' && (
              <div className="bg-red-50 p-4 border-t border-red-100 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-red-900">Observação Técnica (Obrigatório)</label>
                  <Input placeholder="Descreva o problema encontrado..." className="border-red-200 focus-visible:ring-red-500" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-medium text-red-900">Nível de Risco</label>
                    <Select className="border-red-200">
                      <option value="low">Baixo (Monitorar)</option>
                      <option value="medium">Médio (Agendar Manutenção)</option>
                      <option value="high">Alto (Ação Imediata)</option>
                    </Select>
                  </div>
                  <div className="flex items-center mt-5">
                    <input type="checkbox" id={`ticket-${item.id}`} className="rounded border-red-300 text-red-600 focus:ring-red-600 mr-2" defaultChecked />
                    <label htmlFor={`ticket-${item.id}`} className="text-sm text-red-900">Gerar chamado automático</label>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button onClick={() => navigate('/inspections')}>Finalizar Inspeção</Button>
      </div>
    </div>
  )
}
