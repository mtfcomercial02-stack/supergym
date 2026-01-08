import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Staff } from '../types';
import { generateStaffReportPDF, formatCurrency } from '../utils/pdf';
import { UserCog, ClipboardList, Plus, Trash2, X, IdCard } from 'lucide-react';

const StaffPage = ({ role }: { role: string }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [checkInCode, setCheckInCode] = useState('');
  const [message, setMessage] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Instrutor',
    salary: '',
    schedule: '',
    staff_code: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('name');
    if (data) setStaffList(data);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if code exists
    const { data: existing } = await supabase.from('staff').select('id').eq('staff_code', newStaff.staff_code).single();
    if (existing) {
        alert('Este ID/Código já está em uso por outro funcionário.');
        setLoading(false);
        return;
    }

    const { error } = await supabase.from('staff').insert([{
      name: newStaff.name,
      role: newStaff.role,
      salary: parseFloat(newStaff.salary),
      schedule: newStaff.schedule,
      staff_code: newStaff.staff_code
    }]);

    if (!error) {
      alert('Funcionário cadastrado com sucesso!');
      setShowModal(false);
      setNewStaff({ name: '', role: 'Instrutor', salary: '', schedule: '', staff_code: '' });
      fetchStaff();
    } else {
      alert('Erro ao cadastrar funcionário. Verifique os dados.');
    }
    setLoading(false);
  };

  const handleDeleteStaff = async (id: string, name: string) => {
      if (!confirm(`Tem certeza que deseja apagar o funcionário ${name}? Essa ação é irreversível.`)) return;

      // Optional: Delete attendance history first if foreign key constraint exists without cascade
      // For now, we attempt direct delete assuming standard configuration or user handled constraints
      const { error } = await supabase.from('staff').delete().eq('id', id);

      if (error) {
          alert('Erro ao apagar. Pode haver registros de ponto vinculados a este funcionário.');
          console.error(error);
      } else {
          alert('Funcionário removido.');
          fetchStaff();
      }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.staff_code === checkInCode);
    if (staff) {
      await supabase.from('staff_attendance').insert([{
        staff_id: staff.id,
        status: 'present',
        date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString()
      }]);
      setMessage(`Check-in realizado para ${staff.name}!`);
      setCheckInCode('');
    } else {
      setMessage('Código inválido. Funcionário não encontrado.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const exportReport = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('staff_attendance')
        .select('*, staff(*)')
        .eq('date', today);
      
      if (data) {
          generateStaffReportPDF(today, data);
      }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check-in Box */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gym-200 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gym-900">Ponto Eletrônico</h2>
          <form onSubmit={handleCheckIn} className="max-w-xs mx-auto space-y-4">
            <div className="relative">
                <IdCard className="absolute left-3 top-3 text-gray-400 h-6 w-6" />
                <input 
                type="text" 
                placeholder="Digite seu ID" 
                className="w-full text-center text-2xl tracking-widest border-2 border-gym-300 rounded-md py-2 pl-10 focus:ring-gym-500 focus:border-gym-500 uppercase"
                maxLength={6}
                value={checkInCode}
                onChange={e => setCheckInCode(e.target.value)}
                />
            </div>
            <button className="w-full bg-gym-600 text-white py-3 rounded-md font-bold hover:bg-gym-700 transition">
              REGISTRAR ENTRADA
            </button>
            {message && <p className={`font-medium ${message.includes('inválido') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          </form>
        </div>

        {/* Staff Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center text-gray-800"><UserCog className="mr-2"/> Quadro de Funcionários</h2>
                {role === 'admin' && (
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="text-sm bg-gym-600 text-white px-3 py-2 rounded hover:bg-gym-700 flex items-center transition"
                    >
                        <Plus className="h-4 w-4 mr-1"/> Novo Funcionário
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[400px]">
                {staffList.length === 0 ? (
                    <p className="text-gray-400 text-center py-10">Nenhum funcionário cadastrado.</p>
                ) : (
                    <ul className="space-y-3">
                        {staffList.map(s => (
                            <li key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 hover:shadow-sm transition">
                                <div>
                                    <p className="font-bold text-gray-800">{s.name}</p>
                                    <p className="text-xs text-gray-500">{s.role} | {s.schedule}</p>
                                    {role === 'admin' && (
                                        <p className="text-xs text-green-600 font-medium">{formatCurrency(s.salary)}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right bg-white px-2 py-1 rounded border border-gray-200">
                                        <p className="text-[10px] text-gray-400 uppercase">ID Acesso</p>
                                        <p className="font-mono font-bold text-gym-700">{s.staff_code}</p>
                                    </div>
                                    {role === 'admin' && (
                                        <button 
                                            onClick={() => handleDeleteStaff(s.id, s.name)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                                            title="Excluir Funcionário"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-4 border-t pt-4">
                 <button onClick={exportReport} className="flex items-center text-gym-600 hover:underline text-sm font-medium">
                     <ClipboardList className="mr-2 h-4 w-4"/> Gerar Relatório Diário de Presença (PDF)
                 </button>
            </div>
        </div>
      </div>

      {/* Modal Cadastro de Staff */}
      {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-xl">
                  <div className="px-6 py-4 bg-gym-900 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">Cadastrar Funcionário</h3>
                      <button onClick={() => setShowModal(false)} className="hover:text-gray-300">
                          <X className="h-5 w-5" />
                      </button>
                  </div>
                  <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                          <input 
                              type="text" required 
                              className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                              value={newStaff.name}
                              onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cargo</label>
                            <select 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                                value={newStaff.role}
                                onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                            >
                                <option value="Instrutor">Instrutor</option>
                                <option value="Recepcionista">Recepcionista</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Manutenção">Manutenção</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Turno</label>
                            <input 
                                type="text" required placeholder="Ex: Manhã"
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                                value={newStaff.schedule}
                                onChange={e => setNewStaff({...newStaff, schedule: e.target.value})}
                            />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Salário (Kz)</label>
                            <input 
                                type="number" required min="0"
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                                value={newStaff.salary}
                                onChange={e => setNewStaff({...newStaff, salary: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ID Acesso (Pin)</label>
                            <input 
                                type="text" required maxLength={6} placeholder="Ex: 1020"
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none font-mono"
                                value={newStaff.staff_code}
                                onChange={e => setNewStaff({...newStaff, staff_code: e.target.value})}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Este código será usado para o check-in.</p>
                        </div>
                      </div>

                      <div className="pt-4 flex space-x-3 justify-end">
                          <button 
                              type="button" 
                              onClick={() => setShowModal(false)}
                              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit" 
                              disabled={loading}
                              className="px-4 py-2 bg-gym-600 text-white rounded font-medium hover:bg-gym-700 disabled:opacity-50"
                          >
                              {loading ? 'Salvando...' : 'Cadastrar'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffPage;