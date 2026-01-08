import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '../utils/pdf';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    activeClients: 0,
    overdueClients: 0,
    newClientsThisMonth: 0,
    monthlyRevenue: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-11
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31).toISOString();

      // --- 1. CARDS METRICS ---

      // 1. Active Clients
      const { count: active } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active');
      
      // 2. Overdue Clients
      const { count: overdue } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'late');

      // 3. New Clients (This Month) based on start_date
      const { count: newClients } = await supabase.from('clients').select('*', { count: 'exact', head: true }).gte('start_date', startOfMonth);

      // 4. Revenue (This Month)
      const { data: paymentsThisMonth } = await supabase.from('payments').select('amount').gte('payment_date', startOfMonth);
      const revenue = paymentsThisMonth?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      setMetrics({
        activeClients: active || 0,
        overdueClients: overdue || 0,
        newClientsThisMonth: newClients || 0,
        monthlyRevenue: revenue
      });

      // --- 2. CHARTS DATA (YEARLY) ---

      // Initialize months array for the charts
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData = months.map(m => ({ name: m, revenue: 0, enrollments: 0 }));

      // Fetch all payments for current year
      const { data: yearPayments } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', startOfYear)
        .lte('payment_date', endOfYear);

      // Fetch all clients starting in current year
      const { data: yearClients } = await supabase
        .from('clients')
        .select('start_date')
        .gte('start_date', startOfYear)
        .lte('start_date', endOfYear);

      // Process Revenue per Month
      yearPayments?.forEach(payment => {
        const date = new Date(payment.payment_date);
        const monthIndex = date.getMonth(); 
        if (monthlyData[monthIndex]) {
          monthlyData[monthIndex].revenue += payment.amount;
        }
      });

      // Process Enrollments per Month
      yearClients?.forEach(client => {
        const date = new Date(client.start_date);
        const monthIndex = date.getMonth();
        if (monthlyData[monthIndex]) {
          monthlyData[monthIndex].enrollments += 1;
        }
      });

      setChartData(monthlyData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Carregando dados do painel...</div>;
  }

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
              {formatCurrency(metrics.monthlyRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Receita Anual ({new Date().getFullYear()})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} Kz`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendência de Matrículas ({new Date().getFullYear()})</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Novos Alunos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;