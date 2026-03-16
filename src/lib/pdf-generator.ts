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

    // Items Table - use real areas from inspection
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate 800
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Areas Inspecionadas', 14, currentY);

    const statusLabels: Record<string, string> = { ok: 'Conforme', nok: 'Nao Conforme', na: 'N/A' }

    // Build items from areas, items, or fallback
    let itemRows: string[][] = []
    if (inspection.areas && inspection.areas.length > 0) {
        // New format: areas is array of strings or objects
        itemRows = inspection.areas.map((area: any) => {
            if (typeof area === 'string') {
                return [area, inspection.status === 'completed' ? 'Conforme' : 'Pendente']
            }
            return [area.name || area, statusLabels[area.status] || 'Pendente']
        })
    } else if (inspection.items && inspection.items.length > 0) {
        itemRows = inspection.items.map((it: any) => [
            it.description || it.category || it.name || 'Item',
            statusLabels[it.status] || (it.status === 'ok' ? 'Conforme' : it.status === 'nok' ? 'Nao Conforme' : 'Pendente')
        ])
    } else {
        itemRows = [['Nenhuma area registrada', '-']]
    }

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Area / Item de Verificacao', 'Resultado']],
        body: itemRows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [71, 85, 105] }, // Slate 600
        bodyStyles: { textColor: [30, 41, 59] },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 1) {
                const val = data.cell.raw;
                if (val === 'Conforme') data.cell.styles.textColor = [16, 185, 129];
                else if (val === 'Nao Conforme') data.cell.styles.textColor = [239, 68, 68];
                else if (val === 'Pendente') data.cell.styles.textColor = [245, 158, 11];
            }
        },
    });

    // Summary
    const nonConformeCount = itemRows.filter(r => r[1] === 'Nao Conforme').length
    const pendingCount = itemRows.filter(r => r[1] === 'Pendente').length

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de areas: ${itemRows.length}  |  Conformes: ${itemRows.filter(r => r[1] === 'Conforme').length}  |  Nao Conformes: ${nonConformeCount}  |  Pendentes: ${pendingCount}`, 14, finalY + 7);

    if (nonConformeCount > 0) {
        doc.setTextColor(239, 68, 68);
        doc.setFont('helvetica', 'bold');
        doc.text(`ATENCAO: ${nonConformeCount} area(s) com nao conformidade identificada(s).`, 14, finalY + 17);
    }

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
export const generateInspectionsSummaryPDF = (inspections: any[]) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(22)
    doc.setTextColor(79, 70, 229)
    doc.text('Relatorio Geral de Inspecoes', 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Total de registros: ${inspections.length}`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35)

    const tableBody = inspections.map(i => {
        const opened = i.openedAt ? new Date(i.openedAt).toLocaleString('pt-BR') : i.date
        const closed = i.completedAt ? new Date(i.completedAt).toLocaleString('pt-BR') : (i.status === 'completed' ? 'Sim (Sem data)' : 'Pendente')

        // Extract non-conforming area names
        const nokAreas = (i.areas || [])
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
                return obj.name || 'Area';
            })
            .join(', ');

        return [
            i.id,
            i.inspector,
            i.type,
            opened,
            closed,
            `${i.score}%`,
            nokAreas || 'Nenhuma'
        ]
    })

    autoTable(doc, {
        startY: 45,
        head: [['ID', 'Inspetor', 'Tipo', 'Abertura', 'Fechamento', 'Score', 'Pendencias']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
        columnStyles: {
            6: { cellWidth: 40 } // Pendencias column width
        }
    })

    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
}
