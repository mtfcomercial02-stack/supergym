import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    activeClients: 0,
    overdueClients: 0,
    newClientsThisMonth: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // 1. Active Clients
    const { count: active } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active');
    
    // 2. Overdue Clients
    const { count: overdue } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'late');

    // 3. New Clients
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const { count: newClients } = await supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString());

    // 4. Revenue (Simple sum for this month)
    const { data: payments } = await supabase.from('payments').select('amount').gte('payment_date', startOfMonth.toISOString());
    const revenue = payments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    setMetrics({
      activeClients: active || 0,
      overdueClients: overdue || 0,
      newClientsThisMonth: newClients || 0,
      monthlyRevenue: revenue
    });
  };

  const data = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Fev', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Abr', revenue: 2780 },
    { name: 'Mai', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Membros Ativos</p>
            <p className="text-2xl font-bold text-gray-800">{metrics.activeClients}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 rounded-full mr-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Em Atraso</p>
            <p className="text-2xl font-bold text-gray-800">{metrics.overdueClients}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Novos (Mês)</p>
            <p className="text-2xl font-bold text-gray-800">{metrics.newClientsThisMonth}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-emerald-100 rounded-full mr-4">
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Receita Mensal</p>
            <p className="text-2xl font-bold text-gray-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.monthlyRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Receita Anual</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendência de Matrículas</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
