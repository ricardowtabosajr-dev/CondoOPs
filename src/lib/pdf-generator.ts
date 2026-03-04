import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInspectionPDF = (inspection: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text('Relatorio de Inspecao', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`ID: ${inspection.id}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    // Divider
    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(14, 40, 196, 40);

    // Basic Info Table
    autoTable(doc, {
        startY: 45,
        head: [['Campo', 'Informacao']],
        body: [
            ['Inspetor', inspection.inspector],
            ['Data da Inspecao', inspection.date],
            ['Tipo', inspection.type],
            ['Periodicidade', inspection.periodicity || 'N/A'],
            ['Status', inspection.status === 'completed' ? 'Concluida' : 'Rascunho'],
            ['Pontuacao Final', `${inspection.score}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
    });

    // Items Table
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate 800
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Itens Verificados', 14, currentY);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Item de Verificacao', 'Resultado']],
        body: [
            ['Estrutura Geral', 'Conforme'],
            ['Limpeza Profunda', 'Conforme'],
            ['Equipamentos de Seguranca', 'Conforme'],
            ['Sinalizacao', 'Conforme'],
        ].map(item => [item[0], item[1]]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [71, 85, 105] }, // Slate 600
    });

    // Footer or Notes
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text('Observacoes:', 14, finalY);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhuma irregularidade critica encontrada durante esta vistoria.', 14, finalY + 7);

    // Open for Printing
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

export const generateFinancialPDF = (data: any) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('Relatorio Financeiro', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Periodo: ${data.period || 'Geral'}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    autoTable(doc, {
        startY: 45,
        head: [['Descricao', 'Categoria', 'Data', 'Valor']],
        body: data.items.map((item: any) => [
            item.desc,
            item.cat,
            item.date + ' 2023',
            item.value
        ]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
    });

    // Open for Printing
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

export const generateOperationalPDF = (data: { tickets: any[], equipments: any[], inspections: any[] }) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('Relatorio Operacional de Gestao', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Condominio: CondoOps Center`, 14, 30);
    doc.text(`Data de Emissao: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    // Summary Cards
    const stats = [
        { label: 'Chamados Abertos', value: data.tickets.filter(t => t.status === 'open').length.toString() },
        { label: 'Ativos Criticos', value: data.equipments.filter(e => e.status !== 'operational').length.toString() },
        { label: 'Inspecoes Realizadas', value: data.inspections.length.toString() },
    ];

    autoTable(doc, {
        startY: 45,
        head: [['Indicador', 'Valor Atual']],
        body: stats.map(s => [s.label, s.value]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
    });

    // Recent Tickets
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    let currentY2 = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Ultimos Chamados Registrados', 14, currentY2);

    autoTable(doc, {
        startY: currentY2 + 5,
        head: [['ID', 'Titulo', 'Status', 'Prioridade']],
        body: data.tickets.slice(0, 10).map(t => [
            t.id,
            t.title,
            t.status === 'open' ? 'Aberto' : 'Em Andamento',
            t.priority === 'high' ? 'Alta' : 'Media'
        ]),
        headStyles: { fillColor: [71, 85, 105] },
    });

    // Asset Status
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    let currentY3 = (doc as any).lastAutoTable.finalY + 15;
    if (currentY3 > 250) { doc.addPage(); currentY3 = 20; }
    doc.text('Status de Ativos e Equipamentos', 14, currentY3);

    autoTable(doc, {
        startY: currentY3 + 5,
        head: [['Equipamento', 'Categoria', 'Status']],
        body: data.equipments.map(e => [
            e.name,
            e.category,
            e.status === 'operational' ? 'Operacional' : 'Manut./Falha'
        ]),
        headStyles: { fillColor: [71, 85, 105] },
    });

    // Open for Printing
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};
