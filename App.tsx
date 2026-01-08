import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Users, Banknote, Package, 
  ClipboardCheck, BarChart3, LogOut, Lock, 
  Menu, X, UserCog
} from 'lucide-react';
import { Profile } from './types';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import StaffPage from './pages/StaffPage';
import AccessControl from './pages/AccessControl';

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

const AppContent = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setUserProfile(data);
    setLoading(false);
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-100 text-gym-600">Carregando Sistema...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {session && userProfile ? (
        <>
          <Sidebar role={userProfile.role} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header user={userProfile} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients role={userProfile.role} />} />
                <Route path="/finance" element={<Finance role={userProfile.role} />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/staff" element={<StaffPage role={userProfile.role} />} />
                <Route path="/access" element={<AccessControl />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </div>
  );
};

const Sidebar = ({ role }: { role: string }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'bg-gym-900 text-white' : 'text-gray-300 hover:bg-gym-800 hover:text-white';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gym-900 border-r border-gym-800">
      <div className="flex items-center justify-center h-16 border-b border-gym-800">
        <span className="text-xl font-bold text-white tracking-wider">GYM MASTER</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link to="/" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/')}`}>
          <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
        </Link>
        <Link to="/clients" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/clients')}`}>
          <Users className="mr-3 h-5 w-5" /> Alunos
        </Link>
        <Link to="/finance" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/finance')}`}>
          <Banknote className="mr-3 h-5 w-5" /> Financeiro
        </Link>
        <Link to="/inventory" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/inventory')}`}>
          <Package className="mr-3 h-5 w-5" /> Produtos & Vendas
        </Link>
        <Link to="/staff" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/staff')}`}>
          <UserCog className="mr-3 h-5 w-5" /> Staff
        </Link>
        <Link to="/access" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/access')}`}>
          <Lock className="mr-3 h-5 w-5" /> Controle de Acesso
        </Link>
      </nav>
      <div className="p-4 border-t border-gym-800">
        <div className="text-xs text-gray-400">Versão 1.0.0</div>
        <div className="text-xs text-gray-500 mt-1 uppercase font-bold">{role === 'admin' ? 'Administrador' : 'Funcionário'}</div>
      </div>
    </aside>
  );
};

const Header = ({ user }: { user: Profile }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white border-b shadow-sm">
      <div className="flex items-center md:hidden">
        <Menu className="h-6 w-6 text-gray-600" />
      </div>
      <div className="flex items-center ml-auto space-x-4">
        <span className="text-sm font-medium text-gray-700">{user.email}</span>
        <button onClick={handleLogout} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800">
          <LogOut className="h-4 w-4 mr-1" /> Sair
        </button>
      </div>
    </header>
  );
};

export default App;
