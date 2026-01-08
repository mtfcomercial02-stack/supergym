import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Client, Payment } from '../types';
import { Plus, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

const Clients = ({ role }: { role: string }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // For timeline view
  
  // New Client Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    monthly_fee: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('full_name');
    if (data) setClients(data);
    setLoading(false);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('clients').insert([{
      ...formData,
      status: 'active',
      monthly_fee: parseFloat(formData.monthly_fee)
    }]);

    if (!error) {
      setShowModal(false);
      fetchClients();
      setFormData({ full_name: '', email: '', phone: '', monthly_fee: '', start_date: new Date().toISOString().split('T')[0] });
    }
  };

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Alunos</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gym-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-gym-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Aluno
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gym-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Mensalidade</th>
                <th className="px-6 py-3">Início</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{client.full_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' : 
                      client.status === 'late' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status === 'active' ? 'Ativo' : client.status === 'late' ? 'Atrasado' : client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">R$ {client.monthly_fee}</td>
                  <td className="px-6 py-4">{new Date(client.start_date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedClient(client)}
                      className="text-gym-600 hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal / Drawer with Timeline */}
      {selectedClient && (
        <ClientDetailModal 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
        />
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Aluno</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <input 
                type="text" placeholder="Nome Completo" required className="w-full border p-2 rounded"
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
              <input 
                type="email" placeholder="Email" className="w-full border p-2 rounded"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="text" placeholder="Telefone" required className="w-full border p-2 rounded"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" placeholder="Data Início" required className="w-full border p-2 rounded"
                  value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                />
                <input 
                  type="number" placeholder="Valor Mensalidade" required className="w-full border p-2 rounded"
                  value={formData.monthly_fee} onChange={e => setFormData({...formData, monthly_fee: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-gym-600 text-white rounded">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ClientDetailModal = ({ client, onClose }: { client: Client; onClose: () => void }) => {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      const { data } = await supabase.from('payments').select('*').eq('client_id', client.id);
      if (data) setPayments(data);
    };
    loadPayments();
  }, [client]);

  // Timeline Logic
  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const getMonthStatus = (monthIndex: number) => {
    const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const startMonthKey = client.start_date.substring(0, 7); // YYYY-MM
    
    // 1. Before Start Date
    if (monthKey < startMonthKey) return 'grey'; // Not applicable

    // 2. Paid?
    const isPaid = payments.some(p => p.months_covered.includes(monthKey));
    if (isPaid) return 'green';

    // 3. Overdue?
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    if (monthKey < currentMonthKey && !isPaid) return 'red';

    // 4. Future
    return 'neutral';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between">
          <h2 className="text-xl font-bold">{client.full_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Fechar</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-sm text-gray-500">Contato</p>
               <p>{client.phone} | {client.email}</p>
             </div>
             <div>
               <p className="text-sm text-gray-500">Mensalidade</p>
               <p className="font-bold">R$ {client.monthly_fee}</p>
             </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Linha do Tempo ({currentYear})</h3>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {months.map((m, idx) => {
                const status = getMonthStatus(idx);
                let colorClass = 'bg-gray-200 text-gray-400';
                if (status === 'green') colorClass = 'bg-green-500 text-white';
                if (status === 'red') colorClass = 'bg-red-500 text-white';
                if (status === 'neutral') colorClass = 'bg-gray-100 text-gray-600 border border-gray-300';

                return (
                  <div key={m} className={`flex flex-col items-center justify-center p-2 rounded ${colorClass}`}>
                    <span className="text-xs font-bold">{m}</span>
                    {status === 'green' && <CheckCircle className="h-4 w-4 mt-1" />}
                    {status === 'red' && <XCircle className="h-4 w-4 mt-1" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
             <h3 className="text-lg font-semibold mb-3">Histórico de Pagamentos</h3>
             {payments.length === 0 ? <p className="text-gray-500">Nenhum pagamento registrado.</p> : (
               <ul className="space-y-2">
                 {payments.map(p => (
                   <li key={p.id} className="flex justify-between border-b pb-2">
                     <div>
                       <span className="font-medium">R$ {p.amount}</span>
                       <span className="text-xs text-gray-500 ml-2">({p.months_covered.join(', ')})</span>
                     </div>
                     <span className="text-sm text-gray-600">{new Date(p.payment_date).toLocaleDateString()}</span>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
