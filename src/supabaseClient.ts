import { createClient } from '@supabase/supabase-js';
import { CommissionEntry } from './types';

const supabaseUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (import.meta as any).env?.SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : '') || 
  '';

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (import.meta as any).env?.SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : '') || 
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Lazy initialization of Supabase client to prevent crash if keys are missing
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEY = 're_sys_commission_entries_v5';

export const db = {
  /**
   * Fetches all commission entries from either Supabase or LocalStorage.
   */
  async fetchEntries(): Promise<{ data: CommissionEntry[] | null; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('commission_entries')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw new Error(error.message);
        }
        // Map database fields to our type structure
        const mappedData: CommissionEntry[] = (data || []).map((item: any) => ({
          id: item.id,
          project_name: item.project_name,
          person_name: item.person_name,
          role: item.role,
          sale_value: Number(item.sale_value),
          calc_type: item.calc_type,
          rate_or_amount: Number(item.rate_or_amount),
          has_gst: item.has_gst !== undefined ? Boolean(item.has_gst) : false,
          gst_percentage: item.gst_percentage !== undefined ? Number(item.gst_percentage) : 18,
          tds_percentage: item.tds_percentage !== undefined ? Number(item.tds_percentage) : (item.deduction_percentage !== undefined ? Number(item.deduction_percentage) : 5),
          payment_status: item.payment_status,
          payment_date: item.payment_date || undefined,
          created_at: item.created_at
        }));

        // Cache in LocalStorage on success so it is available offline
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedData));
        } catch (_) {}

        return { data: mappedData, error: null };
      } catch (err: any) {
        console.error('Supabase fetch error, loading from local fallback:', err);
        // LocalStorage fallback on Supabase failure
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const entries = saved ? JSON.parse(saved) : [];
          const mappedData: CommissionEntry[] = entries.map((item: any) => ({
            ...item,
            has_gst: item.has_gst !== undefined ? Boolean(item.has_gst) : false,
            gst_percentage: item.gst_percentage !== undefined ? Number(item.gst_percentage) : 18,
            tds_percentage: item.tds_percentage !== undefined ? Number(item.tds_percentage) : (item.deduction_percentage !== undefined ? Number(item.deduction_percentage) : 5),
          }));
          return { data: mappedData, error: err.message || 'Supabase fetch error', isFallback: true };
        } catch (_) {
          return { data: null, error: err.message || 'Failed to fetch from Supabase' };
        }
      }
    } else {
      // LocalStorage fallback
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const entries = saved ? JSON.parse(saved) : [];
        const mappedData: CommissionEntry[] = entries.map((item: any) => ({
          ...item,
          has_gst: item.has_gst !== undefined ? Boolean(item.has_gst) : false,
          gst_percentage: item.gst_percentage !== undefined ? Number(item.gst_percentage) : 18,
          tds_percentage: item.tds_percentage !== undefined ? Number(item.tds_percentage) : (item.deduction_percentage !== undefined ? Number(item.deduction_percentage) : 5),
        }));
        return { data: mappedData, error: null };
      } catch (err: any) {
        return { data: null, error: 'Failed to fetch from LocalStorage' };
      }
    }
  },

  /**
   * Saves or updates a commission entry. Always ensures LocalStorage has the latest copy.
   */
  async saveEntry(entry: CommissionEntry, isNew: boolean = false): Promise<{ error: string | null; isFallback?: boolean }> {
    // 1. Always write to LocalStorage first to guarantee local resilience
    let localError: string | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let entries: CommissionEntry[] = saved ? JSON.parse(saved) : [];
      const index = entries.findIndex(e => e.id === entry.id);
      if (index >= 0) {
        entries[index] = { ...entry, created_at: entries[index].created_at || new Date().toISOString() };
      } else {
        entries.unshift({ ...entry, created_at: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err: any) {
      localError = 'Failed to save to LocalStorage';
    }

    // 2. Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: entry.id,
          project_name: entry.project_name,
          person_name: entry.person_name,
          role: entry.role,
          sale_value: entry.sale_value,
          calc_type: entry.calc_type,
          rate_or_amount: entry.rate_or_amount,
          has_gst: entry.has_gst,
          gst_percentage: entry.gst_percentage,
          tds_percentage: entry.tds_percentage,
          payment_status: entry.payment_status,
          payment_date: entry.payment_status === 'Paid' ? entry.payment_date || new Date().toISOString().split('T')[0] : null
        };

        const query = isNew
          ? supabase.from('commission_entries').insert([payload])
          : supabase.from('commission_entries').upsert([payload]);

        const { error } = await query;
        if (error) {
          throw new Error(error.message);
        }
        return { error: null };
      } catch (err: any) {
        console.error('Supabase save error, saved locally instead:', err);
        // Supabase failed, but we successfully saved locally. Return with isFallback: true.
        return { error: null, isFallback: true };
      }
    }

    return { error: localError };
  },

  /**
   * Deletes a commission entry. Always removes from LocalStorage.
   */
  async deleteEntry(id: string): Promise<{ error: string | null; isFallback?: boolean }> {
    // 1. Always delete from LocalStorage
    let localError: string | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let entries: CommissionEntry[] = saved ? JSON.parse(saved) : [];
      entries = entries.filter(e => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err: any) {
      localError = 'Failed to delete from LocalStorage';
    }

    // 2. Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('commission_entries')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw new Error(error.message);
        }
        return { error: null };
      } catch (err: any) {
        console.error('Supabase delete error, deleted locally instead:', err);
        return { error: null, isFallback: true };
      }
    }

    return { error: localError };
  }
};
