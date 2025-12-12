import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/react-app/contexts/AuthContext';
import Layout from "@/react-app/components/Layout";
import Login from "@/react-app/pages/Login";
import Dashboard from "@/react-app/pages/Dashboard";
import NovoAgendamento from "@/react-app/pages/NovoAgendamento";
import Agendamentos from "@/react-app/pages/Agendamentos";
import Catalogo from "@/react-app/pages/Catalogo";
import CatalogoEditor from "@/react-app/pages/CatalogoEditor";
import FechamentoCaixa from "@/react-app/pages/FechamentoCaixa";
import Servicos from "@/react-app/pages/Servicos";
import EditServico from "@/react-app/pages/EditServico";
import Agencias from "@/react-app/pages/Agencias";
import Recepcionistas from "@/react-app/pages/Recepcionistas";
import OfertaPublica from "@/react-app/pages/OfertaPublica";
import CatalogoGeral from "@/react-app/pages/CatalogoGeral";
import Auditoria from "@/react-app/pages/Auditoria";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { recepcionista, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }
  
  if (!recepcionista) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { recepcionista, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }
  
  if (!recepcionista) {
    return <Navigate to="/login" replace />;
  }
  
  if (recepcionista.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '1rem',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/oferta/:slug" element={<OfertaPublica />} />
            <Route path="/catalogo-geral" element={<CatalogoGeral />} />
            <Route path="/login" element={<Login />} />
            
            {/* Private routes - with layout */}
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/novo-agendamento" element={<NovoAgendamento />} />
                    <Route path="/agendamentos" element={<Agendamentos />} />
                    <Route path="/catalogo" element={<Catalogo />} />
                    <Route path="/catalogo/novo" element={<CatalogoEditor />} />
                    <Route path="/catalogo/editar/:id" element={<CatalogoEditor />} />
                    <Route path="/fechamento-caixa" element={<FechamentoCaixa />} />
                    <Route path="/servicos" element={<Servicos />} />
                    <Route path="/servicos/edit/:id" element={<EditServico />} />
                    <Route path="/agencias" element={<Agencias />} />
                    <Route path="/recepcionistas" element={<AdminRoute><Recepcionistas /></AdminRoute>} />
                    <Route path="/auditoria" element={<AdminRoute><Auditoria /></AdminRoute>} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
