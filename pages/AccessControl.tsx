import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Scan, QrCode } from 'lucide-react';

const AccessControl = () => {
  const [lastScan, setLastScan] = useState<any>(null);
  const [simulatedQR, setSimulatedQR] = useState('');

  const simulateScan = async () => {
    // 1. Get random client
    const { data: clients } = await supabase.from('clients').select('id, full_name, status, photo_url').limit(10);
    if (!clients || clients.length === 0) return alert('Sem clientes para simular');

    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    
    // 2. Log Access
    await supabase.from('access_logs').insert({
        client_id: randomClient.id,
        admin_id: (await supabase.auth.getUser()).data.user?.id
    });

    setLastScan({
        ...randomClient,
        timestamp: new Date().toLocaleTimeString()
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-lg shadow text-center border">
            <h1 className="text-2xl font-bold mb-6 flex justify-center items-center">
                <Scan className="mr-3 h-8 w-8 text-gym-600"/> Controle de Acesso
            </h1>
            
            <div className="mb-8 p-10 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400 mb-4"/>
                <button 
                  onClick={simulateScan}
                  className="bg-gym-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gym-700 transition transform hover:scale-105"
                >
                    SIMULAR LEITURA DE QR CODE
                </button>
                <p className="text-xs text-gray-500 mt-2">Em produção, isso usaria a câmera do dispositivo.</p>
            </div>

            {lastScan && (
                <div className={`p-6 rounded-lg border-l-4 text-left animate-fade-in ${lastScan.status === 'active' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    <div className="flex items-center">
                        <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden mr-4">
                            {lastScan.photo_url ? <img src={lastScan.photo_url} /> : <span className="text-2xl font-bold text-gray-500">{lastScan.full_name[0]}</span>}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{lastScan.full_name}</h3>
                            <p className="text-sm text-gray-600">Acesso: {lastScan.timestamp}</p>
                            <p className={`font-bold uppercase text-sm mt-1 ${lastScan.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                                {lastScan.status === 'active' ? 'LIBERADO' : 'BLOQUEADO - ' + lastScan.status}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AccessControl;
