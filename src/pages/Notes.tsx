import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card"
import { Button } from "@/src/components/ui/Button"
import { Badge } from "@/src/components/ui/Badge"
import { Modal } from "@/src/components/ui/Modal"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, Search, StickyNote, Trash2, User, Clock, Send, FileText } from "lucide-react"
import { useData } from "@/src/context/DataContext"
import { useAuth } from "@/src/context/AuthContext"
import { generateNotesPDF } from "@/src/lib/pdf-generator"

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

export function Notes() {
    const { notes, addNote, removeNote } = useData()
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedNote, setSelectedNote] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [newNote, setNewNote] = useState({ content: '' })

    const filteredNotes = notes.filter(n =>
        n.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.author?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newNote.content.trim()) {
            toast.error('Por favor, preencha o campo de anotação.')
            return
        }
        setLoading(true)

        const now = new Date().toISOString()
        const noteId = `NOTA-${Date.now()}`
        const entry = {
            id: noteId,
            content: newNote.content.trim(),
            author: user?.name || 'Operador',
            createdAt: now,
        }

        try {
            await addNote(entry)
            toast.success('Anotação registrada com sucesso!')
            setIsModalOpen(false)
            setNewNote({ content: '' })
        } catch (err) {
            toast.error('Erro ao registrar anotação.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        await removeNote(id)
        toast.success('Anotação removida.')
        setSelectedNote(null)
    }

    const formatDateTime = (isoStr: string) => {
        if (!isoStr) return '-'
        return new Date(isoStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    const handleGenerateReport = () => {
        if (filteredNotes.length === 0) {
            toast.error('Nenhuma anotação para gerar relatório.')
            return
        }

        toast.promise(new Promise((resolve) => setTimeout(() => {
            generateNotesPDF(filteredNotes)
            resolve(true)
        }, 1200)), {
            loading: 'Gerando relatório de anotações...',
            success: 'Relatório aberto em nova aba!',
            error: 'Erro ao gerar relatório.',
        })
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
                        Anotações
                    </h1>
                    <p className="text-slate-500 mt-1">Registre ocorrências e observações do dia a dia.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="bg-white border-slate-200"
                        onClick={handleGenerateReport}
                    >
                        <FileText className="h-4 w-4 mr-2" /> Gerar Relatório
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Nova Anotação
                    </Button>
                </div>
            </div>

            {/* Modal: Nova Anotação */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Anotação">
                <form className="space-y-4" onSubmit={handleCreateNote}>
                    {/* Operador e Data Automáticos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Operador</label>
                            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-500" />
                                {user?.name || 'Operador'}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Data/Hora</label>
                            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                {new Date().toLocaleString('pt-BR', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Campo para relato */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Relato da Ocorrência</label>
                        <textarea
                            required
                            rows={5}
                            placeholder="Descreva detalhadamente a ocorrência, observação ou anotação..."
                            value={newNote.content}
                            onChange={(e) => setNewNote({ content: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                            {loading ? 'Salvando...' : <><Send className="h-4 w-4 mr-2" /> Registrar Anotação</>}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Detalhes da Anotação */}
            <Modal
                isOpen={!!selectedNote}
                onClose={() => setSelectedNote(null)}
                title="Detalhes da Anotação"
            >
                {selectedNote && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Operador</p>
                                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <User className="h-4 w-4 text-indigo-500" /> {selectedNote.author}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Data/Hora</p>
                                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-indigo-500" /> {formatDateTime(selectedNote.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Relato</p>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {selectedNote.content}
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
                            <Button
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDelete(selectedNote.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedNote(null)}>Fechar</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Lista de Anotações */}
            <motion.div variants={item}>
                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar anotação por conteúdo ou autor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredNotes.length > 0 ? filteredNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    variants={item}
                                    className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
                                    onClick={() => setSelectedNote(note)}
                                >
                                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <StickyNote className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                            {note.content}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant="secondary" className="font-medium text-xs">
                                                <User className="h-3 w-3 mr-1" /> {note.author}
                                            </Badge>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {formatDateTime(note.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="flex-shrink-0 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            )) : (
                                <div className="text-center py-12 text-slate-400">
                                    <StickyNote className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                                    <p className="text-sm">Nenhuma anotação encontrada.</p>
                                    <p className="text-xs mt-1">Clique em "Nova Anotação" para começar.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
