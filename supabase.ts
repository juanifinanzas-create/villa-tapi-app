import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bojihtcarngbxyqtbbbv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvamlodGNhcm5nYnh5cXRiYmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjkxNDAsImV4cCI6MjA4MDQ0NTE0MH0.tPS-sei6Iurm3_r1P-w1voKOXLZck9EU5YqLlso0S2I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Type definitions for database tables
export type Database = {
  public: {
    Tables: {
      recepcionistas: {
        Row: {
          id: number;
          nome: string;
          email: string;
          password_hash: string | null;
          role: 'admin' | 'staff';
          is_ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          nome: string;
          email: string;
          password_hash?: string | null;
          role?: 'admin' | 'staff';
          is_ativo?: boolean;
        };
        Update: {
          nome?: string;
          email?: string;
          password_hash?: string | null;
          role?: 'admin' | 'staff';
          is_ativo?: boolean;
        };
      };
      agencias: {
        Row: {
          id: number;
          nome: string;
          tipo: 'Parceiro' | 'Interno' | 'Transfer' | 'Passeio' | 'Restaurante' | 'Outro';
          telefone: string | null;
          email: string | null;
          chave_pix: string | null;
          titular_pix: string | null;
          is_ativo: boolean;
          created_at: string;
        };
        Insert: {
          nome: string;
          tipo: 'Parceiro' | 'Interno' | 'Transfer' | 'Passeio' | 'Restaurante' | 'Outro';
          telefone?: string | null;
          email?: string | null;
          chave_pix?: string | null;
          titular_pix?: string | null;
          is_ativo?: boolean;
        };
        Update: {
          nome?: string;
          tipo?: 'Parceiro' | 'Interno' | 'Transfer' | 'Passeio' | 'Restaurante' | 'Outro';
          telefone?: string | null;
          email?: string | null;
          chave_pix?: string | null;
          titular_pix?: string | null;
          is_ativo?: boolean;
        };
      };
    };
  };
};

// Helper functions for common operations
export const db = {
  // Agencias
  async getAgencias() {
    const { data, error } = await supabase
      .from('agencias')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data;
  },

  async getAgencia(id: number) {
    const { data, error } = await supabase
      .from('agencias')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createAgencia(agencia: Database['public']['Tables']['agencias']['Insert']) {
    const { data, error } = await supabase
      .from('agencias')
      .insert(agencia)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAgencia(id: number, updates: Database['public']['Tables']['agencias']['Update']) {
    const { data, error } = await supabase
      .from('agencias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAgencia(id: number) {
    const { error } = await supabase
      .from('agencias')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
};

export default supabase;
