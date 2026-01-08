import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Staff } from '../types';
import { generateStaffReportPDF } from '../utils/pdf';
import { UserCog, ClipboardList, CheckCircle } from 'lucide-react';

const StaffPage = ({ role }: { role: string }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [checkInCode, setCheckInCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*');
    if (data) setStaffList(data);
  };

  const handleCreateStaff = async () => {
    // Simplified creation
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const { error } = await supabase.from('staff').insert([{
      name: 'Novo Funcionário',
      role: 'Instrutor',
      salary: 2000,
      staff_code: code,
      schedule: 'Seg-Sex 08-17'
    }]);
    if (!error) fetchStaff();
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.staff_code === checkInCode);
    if (staff) {
      await supabase.from('staff_attendance').insert([{
        staff_id: staff.id,
        status: 'present',
        date: new Date().toISOString().split('T')[0]
      }]);
      setMessage(`Check-in realizado para ${staff.name}!`);
      setCheckInCode('');
    } else {
      setMessage('Código inválido.');
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
            <input 
              type="text" 
              placeholder="Digite seu ID (ex: 1234)" 
              className="w-full text-center text-2xl tracking-widest border-2 border-gym-300 rounded-md py-2 focus:ring-gym-500 focus:border-gym-500"
              maxLength={4}
              value={checkInCode}
              onChange={e => setCheckInCode(e.target.value)}
            />
            <button className="w-full bg-gym-600 text-white py-3 rounded-md font-bold hover:bg-gym-700">
              REGISTRAR ENTRADA
            </button>
            {message && <p className="text-green-600 font-medium">{message}</p>}
          </form>
        </div>

        {/* Staff Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center"><UserCog className="mr-2"/> Equipe</h2>
                {role === 'admin' && (
                    <button onClick={handleCreateStaff} className="text-sm bg-gray-100 px-3 py-1 rounded">
                        + Add Mock Staff
                    </button>
                )}
            </div>
            <ul className="space-y-2">
                {staffList.map(s => (
                    <li key={s.id} className="flex justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.role}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-mono bg-gray-200 px-1 rounded">ID: {s.staff_code}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <div className="mt-4 border-t pt-4">
                 <button onClick={exportReport} className="flex items-center text-gym-600 hover:underline">
                     <ClipboardList className="mr-2 h-4 w-4"/> Gerar Relatório do Dia (PDF)
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
