import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Client, Payment } from '../types';
import { generateReceiptPDF, generateDailyClosingPDF } from '../utils/pdf';
import { DollarSign, FileText, Download } from 'lucide-react';

const Finance = ({ role }: { role: string }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayTransactions, setTodayTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: c } = await supabase.from('clients').select('*');
      if (c) setClients(c);
      fetchTodayTransactions();
    };
    fetch();
  }, []);

  const fetchTodayTransactions = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: payments } = await supabase
      .from('payments')
      .select('*, client:clients(full_name)')
      .gte('payment_date', today);
    
    // Flatten for simple view
    const transactions = (payments || []).map(p => ({
      ...p,
      type: 'Mensalidade',
      method: p.payment_method
    }));
    setTodayTransactions(transactions);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !amount) return;
    setLoading(true);

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    // 1. Insert Payment
    const paymentData = {
      client_id: selectedClient,
      amount: parseFloat(amount),
      months_covered: selectedMonths,
      payment_method: 'cash', // Simplified for demo
      created_by: (await supabase.auth.getUser()).data.user?.id
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (!error && payment) {
      // 2. Generate PDF
      const pdfBlob = generateReceiptPDF(payment, client);
      
      // 3. Ask WhatsApp (Mock)
      if (confirm('Pagamento registrado! Deseja enviar o recibo por WhatsApp?')) {
        console.log('Open WhatsApp Web with link to PDF...');
      }

      // Refresh
      fetchTodayTransactions();
      setAmount('');
      setSelectedMonths([]);
    }
    setLoading(false);
  };

  const handleDailyClosing = async () => {
    const totalReceived = todayTransactions.reduce((acc, t) => acc + t.amount, 0);
    // Mock overdue calculation for simplicity
    const totalOverdue = 1500; 
    const user = (await supabase.auth.getUser()).data.user?.email || 'Admin';
    
    generateDailyClosingPDF(new Date().toLocaleDateString(), totalReceived, totalOverdue, user, todayTransactions);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Register Payment */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-bold mb-4 flex items-center">
          <DollarSign className="mr-2" /> Registrar Pagamento
        </h2>
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Aluno</label>
            <select 
              className="w-full border p-2 rounded"
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Meses Referência (ex: 2023-10)</label>
            <input 
              type="month" 
              className="w-full border p-2 rounded"
              onChange={e => {
                if(e.target.value && !selectedMonths.includes(e.target.value)) {
                  setSelectedMonths([...selectedMonths, e.target.value]);
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMonths.map(m => (
                <span key={m} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                  {m} <button type="button" onClick={() => setSelectedMonths(selectedMonths.filter(x => x !== m))} className="ml-1 font-bold">x</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Valor Total (R$)</label>
            <input 
              type="number" 
              className="w-full border p-2 rounded"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </form>
      </div>

      {/* Daily Closing */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center">
            <FileText className="mr-2" /> Caixa do Dia
          </h2>
          <button 
            onClick={handleDailyClosing}
            className="bg-gray-800 text-white text-xs px-3 py-1 rounded flex items-center hover:bg-gray-700"
          >
            <Download className="h-3 w-3 mr-1" /> PDF Fechamento
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded text-center">
            <p className="text-sm text-gray-500">Total Recebido Hoje</p>
            <p className="text-3xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                todayTransactions.reduce((acc, t) => acc + t.amount, 0)
              )}
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="text-left text-gray-500">
                   <th className="pb-2">Cliente</th>
                   <th className="pb-2">Valor</th>
                 </tr>
               </thead>
               <tbody>
                 {todayTransactions.map((t, idx) => (
                   <tr key={idx} className="border-b">
                     <td className="py-2">{t.client?.full_name || 'Venda Produto'}</td>
                     <td className="py-2 font-medium">R$ {t.amount}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
