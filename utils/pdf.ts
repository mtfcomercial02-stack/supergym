import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, Client, Staff, StaffAttendance } from '../types';

// Helper to format currency
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const generateReceiptPDF = (payment: Payment, client: Client) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text('GYM MASTER PRO', 20, 20);
  
  doc.setFontSize(16);
  doc.text('RECIBO DE PAGAMENTO', 20, 30);
  
  // Details
  doc.setFontSize(12);
  doc.text(`Recibo #: ${payment.id.slice(0, 8).toUpperCase()}`, 20, 45);
  doc.text(`Data: ${new Date(payment.payment_date).toLocaleDateString('pt-BR')}`, 20, 52);
  doc.text(`Cliente: ${client.full_name}`, 20, 59);
  doc.text(`CPF/ID: ${client.id.slice(0,8)}`, 20, 66);

  // Table
  const tableData = payment.months_covered.map(month => [
    month,
    'Mensalidade',
    formatCurrency(payment.amount / payment.months_covered.length)
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Mês de Referência', 'Descrição', 'Valor']],
    body: tableData,
    foot: [['', 'TOTAL PAGO', formatCurrency(payment.amount)]],
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] }, // Tailwind blue-500
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text('__________________________________', 20, finalY);
  doc.text('Assinatura do Responsável', 20, finalY + 5);

  doc.save(`recibo_${client.full_name}_${payment.payment_date}.pdf`);
  return doc.output('blob'); // Return blob for upload if needed
};

export const generateDailyClosingPDF = (date: string, totalReceived: number, totalOverdue: number, user: string, transactions: any[]) => {
  const doc = new jsPDF();
  doc.text(`Fechamento de Caixa - ${date}`, 20, 20);
  doc.setFontSize(10);
  doc.text(`Gerado por: ${user}`, 20, 28);
  
  doc.setFontSize(12);
  doc.text(`Total Recebido: ${formatCurrency(totalReceived)}`, 20, 40);
  doc.text(`Total Pendente/Atrasado (Estimado): ${formatCurrency(totalOverdue)}`, 20, 48);
  
  const body = transactions.map(t => [
    t.client?.full_name || 'Venda Avulsa',
    t.type,
    t.method,
    formatCurrency(t.amount)
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Cliente/Origem', 'Tipo', 'Método', 'Valor']],
    body: body,
  });

  doc.save(`fechamento_${date}.pdf`);
};

export const generateStaffReportPDF = (date: string, attendance: (StaffAttendance & { staff: Staff })[]) => {
  const doc = new jsPDF();
  doc.text(`Relatório de Ponto - Staff - ${date}`, 20, 20);

  const data = attendance.map(a => [
    a.staff.name,
    a.staff.role,
    a.status === 'present' ? 'Presente' : 'Ausente',
    a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '-'
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Nome', 'Cargo', 'Status', 'Horário Check-in']],
    body: data,
    rowStyles: (rowIndex, data) => {
       // Just basic logic here, styling conditional rows in jspdf-autotable is verbose
       return {};
    }
  });

  doc.save(`staff_report_${date}.pdf`);
}
