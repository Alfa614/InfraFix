import React, { useEffect, useState } from 'react';
import { api, setToken } from './api';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import Admin from './pages/Admin';
import Contractor from './pages/Contractor'; 

function Nav({ user, onLogout, onNavigate, route }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md text-white">
      <div className="container py-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">InfraFix</h1>

        
        <button className="btn-nav" onClick={() => onNavigate('home')}>Home</button>
        {user && <button className="btn-nav" onClick={() => onNavigate('new')}>Report Issue</button>}
        {user?.role === 'ADMIN' && <button className="btn-nav" onClick={() => onNavigate('admin')}>Admin</button>}
        {/*  show Contractor dashboard link */}
        {user?.role === 'CONTRACTOR' && <button className="btn-nav" onClick={() => onNavigate('contractor')}>Contractor</button>}

        <div className="ml-auto flex items-center gap-2">
          {!user && (
            <>
              <button 
                className={`btn-nav ${route==='login' ? 'bg-white/20' : ''}`} 
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
              <button 
                className={`btn-nav ${route==='register' ? 'bg-white/20' : ''}`} 
                onClick={() => onNavigate('register')}
              >
                Register
              </button>
            </>
          )}
          {user && (
            <>
              <span className="text-sm">Hello, {user.name}</span>
              <button className="btn-danger" onClick={onLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);

  const navigate = (r) => setRoute(r);

  async function fetchMe() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {}
  }

  useEffect(() => { fetchMe(); }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
    setRoute('home');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav user={user} onLogout={logout} onNavigate={navigate} route={route} />
      <div className="container py-6 space-y-6">
        {route === 'home' && <Home onOpen={(id)=>{ window.scrollTo(0,0); setRoute(`report:${id}`); }} />}
        {route === 'login' && <Login onSuccess={()=>{ fetchMe(); setRoute('home'); }} />}
        {route === 'register' && <Register onSuccess={()=>{ setRoute('login'); }} />}
        {route === 'new' && <NewReport onCreated={(id)=> setRoute(`report:${id}`)} />}
        {/*  Pass user down to ReportDetail */}
        {route.startsWith('report:') && <ReportDetail id={Number(route.split(':')[1])} onBack={()=> setRoute('home')} user={user} />}
        {route === 'admin' && user?.role === 'ADMIN' && <Admin />}
        {/*  Contractor dashboard route */}
        {route === 'contractor' && user?.role === 'CONTRACTOR' && <Contractor />}
      </div>
      <footer className="mt-auto py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} InfraFix
      </footer>
    </div>
  );
}
