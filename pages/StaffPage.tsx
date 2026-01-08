import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Staff } from '../types';
import { generateStaffReportPDF } from '../utils/pdf';
import { UserCog, ClipboardList, Plus, Trash2, X, IdCard, Clock, UserCheck } from 'lucide-react';

const StaffPage = ({ role }: { role: string }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [todaysAttendance, setTodaysAttendance] = useState<any[]>([]);
  const [checkInCode, setCheckInCode] = useState('');
  const [message, setMessage] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state (Salary removed, ID removed)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Instrutor',
    schedule: '',
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. CLEANUP RULE: Delete any attendance record that is NOT from today
    // This satisfies the "24h duration" and "goes away from backend" requirement.
    await supabase.from('staff_attendance').delete().neq('date', today);

    // 2. Fetch Data
    fetchStaff();
    fetchTodaysAttendance(today);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('name');
    if (data) setStaffList(data);
  };

  const fetchTodaysAttendance = async (date: string) => {
    const { data } = await supabase
      .from('staff_attendance')
      .select('*, staff(name, role)')
      .eq('date', date)
      .order('check_in_time', { ascending: false });
    
    if (data) setTodaysAttendance(data);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // AUTOMATIC ID GENERATION (6 digits)
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Check uniqueness (just in case)
    const { data: existing } = await supabase.from('staff').select('id').eq('staff_code', generatedCode).single();
    if (existing) {
        alert('Erro na geração de ID. Tente novamente.');
        setLoading(false);
        return;
    }

    const { error } = await supabase.from('staff').insert([{
      name: newStaff.name,
      role: newStaff.role,
      salary: 0, // Set to 0 internally as requested to remove from UI
      schedule: newStaff.schedule,
      staff_code: generatedCode
    }]);

    if (!error) {
      alert(`Funcionário cadastrado!\n\nO ID DE ACESSO GERADO É: ${generatedCode}\nAnote este número.`);
      setShowModal(false);
      setNewStaff({ name: '', role: 'Instrutor', schedule: '' });
      fetchStaff();
    } else {
      alert('Erro ao cadastrar funcionário.');
    }
    setLoading(false);
  };

  const handleDeleteStaff = async (id: string, name: string) => {
      if (!confirm(`Tem certeza que deseja apagar o funcionário ${name}? Essa ação é irreversível.`)) return;

      const { error } = await supabase.from('staff').delete().eq('id', id);

      if (error) {
          alert('Erro ao apagar. Pode haver registros vinculados.');
      } else {
          alert('Funcionário removido.');
          fetchStaff();
      }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in
    const staff = staffList.find(s => s.staff_code === checkInCode);
    
    if (staff) {
      // Check duplicate for today
      const alreadyPresent = todaysAttendance.find(a => a.staff_id === staff.id);
      if (alreadyPresent) {
          setMessage(`Check-in já realizado hoje para ${staff.name}.`);
          setTimeout(() => setMessage(''), 3000);
          return;
      }

      await supabase.from('staff_attendance').insert([{
        staff_id: staff.id,
        status: 'present',
        date: today,
        check_in_time: new Date().toISOString()
      }]);
      
      setMessage(`Bem-vindo(a), ${staff.name}!`);
      setCheckInCode('');
      fetchTodaysAttendance(today);
    } else {
      setMessage('Código inválido. Funcionário não encontrado.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const exportReport = () => {
      const today = new Date().toISOString().split('T')[0];
      if (todaysAttendance.length > 0) {
          generateStaffReportPDF(today, todaysAttendance);
      } else {
          alert('Sem registros de presença hoje.');
      }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
        
        {/* Left Column: Check-in + Daily Log */}
        <div className="flex flex-col space-y-6">
            {/* Check-in Box */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gym-200 text-center">
                <h2 className="text-2xl font-bold mb-4 text-gym-900">Ponto Eletrônico</h2>
                <form onSubmit={handleCheckIn} className="max-w-xs mx-auto space-y-4">
                    <div className="relative">
                        <IdCard className="absolute left-3 top-3 text-gray-400 h-6 w-6" />
                        <input 
                        type="text" 
                        placeholder="DIGITE SEU ID" 
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

            {/* Daily Attendance Log (The "Square" requested) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <UserCheck className="mr-2 h-5 w-5 text-green-600"/> Presenças de Hoje
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Reinicia em 24h</span>
                </div>
                
                <div className="overflow-y-auto flex-1">
                    {todaysAttendance.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Clock className="h-8 w-8 mb-2 opacity-50"/>
                            <p>Nenhum registro hoje.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {todaysAttendance.map((record) => (
                                <li key={record.id} className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100 animate-fade-in">
                                    <span className="font-bold text-gray-800">{record.staff?.name}</span>
                                    <div className="flex items-center text-sm text-green-700 bg-white px-2 py-1 rounded shadow-sm">
                                        <Clock className="h-3 w-3 mr-1"/>
                                        {new Date(record.check_in_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', hour12: false})}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {todaysAttendance.length > 0 && (
                     <div className="mt-4 text-center">
                        <button onClick={exportReport} className="text-xs text-gym-600 hover:underline">
                            Baixar Lista (PDF)
                        </button>
                     </div>
                )}
            </div>
        </div>

        {/* Right Column: Staff Management List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-lg font-bold flex items-center text-gray-800">
                    <UserCog className="mr-2"/> Quadro de Funcionários
                </h2>
                {role === 'admin' && (
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="text-sm bg-gym-600 text-white px-3 py-2 rounded hover:bg-gym-700 flex items-center transition shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-1"/> Novo Funcionário
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {staffList.length === 0 ? (
                    <p className="text-gray-400 text-center py-10">Nenhum funcionário cadastrado.</p>
                ) : (
                    <ul className="space-y-3">
                        {staffList.map(s => (
                            <li key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded border border-gray-100 hover:shadow-sm transition">
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{s.name}</p>
                                    <p className="text-sm text-gray-500">{s.role} | {s.schedule}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right bg-white px-3 py-1 rounded border border-gray-200">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">ID Acesso</p>
                                        <p className="font-mono text-xl font-bold text-gym-700 tracking-widest">{s.staff_code}</p>
                                    </div>
                                    {role === 'admin' && (
                                        <button 
                                            onClick={() => handleDeleteStaff(s.id, s.name)}
                                            className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition"
                                            title="Excluir Funcionário"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
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
                              placeholder="Ex: João da Silva"
                          />
                      </div>
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
                                type="text" required placeholder="Ex: Manhã (06:00 - 14:00)"
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                                value={newStaff.schedule}
                                onChange={e => setNewStaff({...newStaff, schedule: e.target.value})}
                            />
                        </div>

                      <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mt-4">
                          <p><strong>Nota:</strong> O ID de acesso será gerado automaticamente após salvar.</p>
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