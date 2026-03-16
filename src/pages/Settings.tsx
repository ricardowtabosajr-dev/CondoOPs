import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/Card"
import { Button } from "@/src/components/ui/Button"
import { Badge } from "@/src/components/ui/Badge"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { User, Bell, Shield, Mail, Save, Camera, Plus, Trash2, Edit3, Eye, Users, Lock, KeyRound, UserPlus, ChevronDown, ChevronUp, X } from "lucide-react"
import { useAuth, type AppUser } from "@/src/context/AuthContext"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

const ALL_MODULES = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Visualizar painel de gestão e indicadores.' },
  { id: 'tickets', label: 'Chamados', desc: 'Abrir, visualizar e gerenciar chamados.' },
  { id: 'inspections', label: 'Inspeções', desc: 'Criar e gerenciar inspeções técnicas.' },
  { id: 'maintenance', label: 'Manutenção', desc: 'Gerenciar ativos e plano de manutenção.' },
  { id: 'notes', label: 'Anotações', desc: 'Registrar ocorrências e anotações do dia a dia.' },
  { id: 'financial', label: 'Financeiro', desc: 'Visualizar e lançar despesas e receitas.' },
  { id: 'settings', label: 'Configurações', desc: 'Gerenciar usuários e configurações do sistema.' },
]

export function Settings() {
  const { systemUsers, addSystemUser, updateSystemUser, deleteSystemUser } = useAuth()

  const [notifications, setNotifications] = useState({
    maintenance: true,
    tickets: true,
    security: false
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '123456',
    role: 'Operador',
    permissions: ['dashboard'] as string[]
  })

  const handleSave = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Salvando configurações...',
      success: 'Alterações salvas com sucesso!',
      error: 'Erro ao salvar alterações.',
    });
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      toast.success(`${newState[key] ? 'Ativado' : 'Desativado'}: ${key === 'maintenance' ? 'Alertas de Manutenção' : key === 'tickets' ? 'Novos Chamados' : 'Segurança'}`);
      return newState;
    });
  };

  const togglePermission = (moduleId: string) => {
    if (editingUser) {
      setEditingUser(prev => {
        if (!prev) return prev
        const perms = prev.permissions.includes(moduleId)
          ? prev.permissions.filter(p => p !== moduleId)
          : [...prev.permissions, moduleId]
        return { ...prev, permissions: perms }
      })
    } else {
      setNewUser(prev => {
        const perms = prev.permissions.includes(moduleId)
          ? prev.permissions.filter(p => p !== moduleId)
          : [...prev.permissions, moduleId]
        return { ...prev, permissions: perms }
      })
    }
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `USR-${String(systemUsers.length + 1).padStart(3, '0')}`
    const entry: Omit<AppUser, 'initials'> = {
      id,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      status: 'active',
      permissions: newUser.permissions
    }
    addSystemUser(entry)
    setIsUserModalOpen(false)
    setNewUser({ name: '', email: '', password: '123456', role: 'Operador', permissions: ['dashboard'] })
    toast.success(`Usuário ${entry.name} criado com sucesso! Senha padrão: ${newUser.password}`)
  }

  const handleEditUser = (user: AppUser) => {
    setEditingUser({ ...user })
    setIsUserModalOpen(true)
  }

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    updateSystemUser(editingUser)
    setIsUserModalOpen(false)
    setEditingUser(null)
    toast.success(`Usuário ${editingUser.name} atualizado com sucesso!`)
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return
    deleteSystemUser(selectedUser.id)
    setIsDeleteConfirmOpen(false)
    setSelectedUser(null)
    toast.success('Usuário removido com sucesso.')
  }

  const handleViewUser = (user: AppUser) => {
    setSelectedUser(user)
    setIsViewUserModalOpen(true)
  }

  const handleToggleUserStatus = (userId: string) => {
    const usr = systemUsers.find(u => u.id === userId)
    if (!usr) return
    const updated = { ...usr, status: (usr.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
    updateSystemUser(updated)
    toast.success(`Usuário ${usr.name} ${updated.status === 'active' ? 'ativado' : 'desativado'}.`)
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(updated)
    }
  }

  const currentPermissions = editingUser ? editingUser.permissions : newUser.permissions
  const currentRole = editingUser ? editingUser.role : newUser.role

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1 text-left">Gerencie usuários, perfis e configurações do condomínio.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ───── Perfil de Administrador ───── */}
        <motion.div variants={item} className="md:col-span-1">
          <div className="space-y-1 text-left">
            <h2 className="text-lg font-semibold text-slate-900">Perfil de Administrador</h2>
            <p className="text-sm text-slate-500">Informações básicas do responsável pelo sistema.</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="md:col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden cursor-pointer group-hover:opacity-80 transition-opacity">SA</div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 rounded-xl text-white shadow-lg border-2 border-white hover:bg-indigo-700 transition-colors" onClick={() => toast.info('Abrir seletor de imagens')}>
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900">Foto de Perfil</h3>
                  <p className="text-xs text-slate-500">JPG ou PNG, máx 2MB.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2 text-left">
                  <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                  <input type="text" defaultValue="Síndico Admin" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-bold text-slate-700">E-mail Corporativo</label>
                  <input type="email" defaultValue="admin@condoops.com.br" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ───── Notificações ───── */}
        <motion.div variants={item} className="md:col-span-1">
          <div className="space-y-1 text-left">
            <h2 className="text-lg font-semibold text-slate-900">Notificações</h2>
            <p className="text-sm text-slate-500">Controle como você recebe alertas do sistema.</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="md:col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {[
                  { id: 'maintenance' as keyof typeof notifications, title: "Alertas de Manutenção", desc: "Receber notificações de manutenções vencidas ou próximas.", icon: Bell },
                  { id: 'tickets' as keyof typeof notifications, title: "Novos Chamados", desc: "Ser alertado quando um morador abrir um novo chamado.", icon: Mail },
                  { id: 'security' as keyof typeof notifications, title: "Segurança", desc: "Alertas de tentativas de login e alterações de permissões.", icon: Shield },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 group">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 p-2 bg-slate-50 group-hover:bg-indigo-50 rounded-xl transition-colors">
                        <notif.icon className="h-4 w-4 text-slate-600 group-hover:text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-500">{notif.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleNotification(notif.id)}
                      className={`h-6 w-11 rounded-full relative transition-colors duration-200 ${notifications[notif.id] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200 ${notifications[notif.id] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ───── Gerenciamento de Usuários ───── */}
        <motion.div variants={item} className="md:col-span-1">
          <div className="space-y-1 text-left">
            <h2 className="text-lg font-semibold text-slate-900">Gerenciamento de Usuários</h2>
            <p className="text-sm text-slate-500">Cadastre usuários e defina as permissões de acesso ao sistema.</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="md:col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl"><Users className="h-5 w-5 text-indigo-600" /></div>
                <div className="text-left">
                  <CardTitle className="text-base">Usuários do Sistema</CardTitle>
                  <CardDescription className="text-xs">{systemUsers.length} usuários cadastrados</CardDescription>
                </div>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all" onClick={() => { setEditingUser(null); setNewUser({ name: '', email: '', password: '123456', role: 'Operador', permissions: ['dashboard'] }); setIsUserModalOpen(true); }}>
                <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {systemUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 group hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${user.status === 'active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {user.initials}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] px-2 py-0.5 border-none font-bold ${user.role === 'Administrador' ? 'bg-indigo-100 text-indigo-700' : user.role === 'Financeiro' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role}
                      </Badge>
                      <Badge className={`text-[10px] px-2 py-0.5 border-none ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleViewUser(user)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleEditUser(user)}><Edit3 className="h-4 w-4" /></Button>
                        {user.role !== 'Administrador' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => { setSelectedUser(user); setIsDeleteConfirmOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Modal: Criar / Editar Usuário ─── */}
      <Modal isOpen={isUserModalOpen} onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }} title={editingUser ? `Editar: ${editingUser.name}` : 'Novo Usuário'}>
        <form className="space-y-5" onSubmit={editingUser ? handleSaveEditUser : handleCreateUser}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <label className="text-sm font-bold text-slate-700 mb-2 block">Nome Completo</label>
              <input required type="text" placeholder="Ex: João da Silva" value={editingUser ? editingUser.name : newUser.name} onChange={(e) => editingUser ? setEditingUser({ ...editingUser, name: e.target.value }) : setNewUser({ ...newUser, name: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="text-left">
              <label className="text-sm font-bold text-slate-700 mb-2 block">E-mail</label>
              <input required type="email" placeholder="usuario@condo.com" value={editingUser ? editingUser.email : newUser.email} onChange={(e) => editingUser ? setEditingUser({ ...editingUser, email: e.target.value }) : setNewUser({ ...newUser, email: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
              <label className="text-sm font-bold text-slate-700 mb-2 block">Cargo / Função</label>
              <select value={currentRole} onChange={(e) => {
                const role = e.target.value
                if (editingUser) {
                  setEditingUser({ ...editingUser, role, permissions: role === 'Administrador' ? ALL_MODULES.map(m => m.id) : editingUser.permissions })
                } else {
                  setNewUser({ ...newUser, role, permissions: role === 'Administrador' ? ALL_MODULES.map(m => m.id) : newUser.permissions })
                }
              }} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                <option value="Administrador">Administrador (Acesso Total)</option>
                <option value="Síndico">Síndico</option>
                <option value="Zelador">Zelador</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Porteiro">Porteiro</option>
                <option value="Operador">Operador</option>
              </select>
            </div>
            <div className="text-left">
              <label className="text-sm font-bold text-slate-700 mb-2 block">Senha</label>
              <input type="text" placeholder="Senha do usuário" value={editingUser ? editingUser.password : newUser.password} onChange={(e) => editingUser ? setEditingUser({ ...editingUser, password: e.target.value }) : setNewUser({ ...newUser, password: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="text-left">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-indigo-600" />
              <label className="text-sm font-bold text-slate-700">Permissões de Acesso</label>
              {currentRole === 'Administrador' && <Badge className="bg-indigo-100 text-indigo-700 border-none text-[10px]">Acesso Total</Badge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_MODULES.map((mod) => {
                const isActive = currentPermissions.includes(mod.id)
                const isAdmin = currentRole === 'Administrador'
                return (
                  <button
                    key={mod.id}
                    type="button"
                    disabled={isAdmin}
                    onClick={() => togglePermission(mod.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${isActive ? 'border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200' : 'border-slate-200 bg-white hover:border-indigo-300'} ${isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
                  >
                    <div className={`h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-300'}`}>
                      {isActive && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{mod.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{mod.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold">
              {editingUser ? <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</> : <><UserPlus className="h-4 w-4 mr-2" /> Criar Usuário</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Visualizar Usuário ─── */}
      <Modal isOpen={isViewUserModalOpen} onClose={() => setIsViewUserModalOpen(false)} title={`Detalhes: ${selectedUser?.name}`}>
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                {selectedUser.initials}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-[10px] px-2 py-0.5 border-none font-bold ${selectedUser.role === 'Administrador' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{selectedUser.role}</Badge>
                  <Badge className={`text-[10px] px-2 py-0.5 border-none ${selectedUser.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{selectedUser.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              </div>
            </div>

            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Módulos com Acesso</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MODULES.map((mod) => {
                  const hasAccess = selectedUser.permissions.includes(mod.id)
                  return (
                    <div key={mod.id} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${hasAccess ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50 opacity-50'}`}>
                      <div className={`h-4 w-4 rounded-md flex-shrink-0 flex items-center justify-center ${hasAccess ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                        {hasAccess && <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{mod.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="ghost" size="sm" className={`text-xs ${selectedUser.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => handleToggleUserStatus(selectedUser.id)}>
                {selectedUser.status === 'active' ? 'Desativar Usuário' : 'Reativar Usuário'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewUserModalOpen(false)}>Fechar</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsViewUserModalOpen(false); handleEditUser(selectedUser); }}>
                  <Edit3 className="h-4 w-4 mr-2" /> Editar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modal: Confirmar Exclusão ─── */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirmar Exclusão">
        <div className="space-y-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Tem certeza que deseja remover?</p>
            <p className="text-xs text-slate-500 mt-1">O usuário <strong>{selectedUser?.name}</strong> perderá todo o acesso ao sistema. Esta ação não pode ser desfeita.</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir Usuário
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
