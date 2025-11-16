export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      business_settings: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          business_number: string | null
          business_owner: string | null
          business_address: string | null
          city: string | null
          state: string | null
          zip: string | null
          business_email: string | null
          business_phone: string | null
          business_mobile: string | null
          business_website: string | null
          tax_id: string | null
          logo_url: string | null
          default_invoice_note: string | null
          default_payment_terms: string | null
          default_tax_rate: number | null
          default_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          business_number?: string | null
          business_owner?: string | null
          business_address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_mobile?: string | null
          business_website?: string | null
          tax_id?: string | null
          logo_url?: string | null
          default_invoice_note?: string | null
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          default_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          business_number?: string | null
          business_owner?: string | null
          business_address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_mobile?: string | null
          business_website?: string | null
          tax_id?: string | null
          logo_url?: string | null
          default_invoice_note?: string | null
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          default_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          mobile: string | null
          fax: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          contact_person: string | null
          tax_id: string | null
          notes: string | null
          status: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          mobile?: string | null
          fax?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          contact_person?: string | null
          tax_id?: string | null
          notes?: string | null
          status?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          mobile?: string | null
          fax?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          contact_person?: string | null
          tax_id?: string | null
          notes?: string | null
          status?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      line_item_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          rate: number
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          rate?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          rate?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          invoice_name: string | null
          invoice_number: string
          date: string
          due_date: string | null
          terms: string | null
          status: string | null
          from_name: string | null
          from_email: string | null
          from_address: string | null
          from_phone: string | null
          from_business_number: string | null
          from_website: string | null
          from_owner: string | null
          bill_to_name: string | null
          bill_to_email: string | null
          bill_to_address: string | null
          bill_to_phone: string | null
          bill_to_mobile: string | null
          bill_to_fax: string | null
          line_items: Json
          subtotal: number | null
          discount: number | null
          tax: number | null
          total: number | null
          balance_due: number | null
          notes: string | null
          payment_instructions: string | null
          share_token: string | null
          payment_method: string | null
          payment_date: string | null
          payment_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          invoice_name?: string | null
          invoice_number: string
          date: string
          due_date?: string | null
          terms?: string | null
          status?: string | null
          from_name?: string | null
          from_email?: string | null
          from_address?: string | null
          from_phone?: string | null
          from_business_number?: string | null
          from_website?: string | null
          from_owner?: string | null
          bill_to_name?: string | null
          bill_to_email?: string | null
          bill_to_address?: string | null
          bill_to_phone?: string | null
          bill_to_mobile?: string | null
          bill_to_fax?: string | null
          line_items?: Json
          subtotal?: number | null
          discount?: number | null
          tax?: number | null
          total?: number | null
          balance_due?: number | null
          notes?: string | null
          payment_instructions?: string | null
          share_token?: string | null
          payment_method?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          invoice_name?: string | null
          invoice_number?: string
          date?: string
          due_date?: string | null
          terms?: string | null
          status?: string | null
          from_name?: string | null
          from_email?: string | null
          from_address?: string | null
          from_phone?: string | null
          from_business_number?: string | null
          from_website?: string | null
          from_owner?: string | null
          bill_to_name?: string | null
          bill_to_email?: string | null
          bill_to_address?: string | null
          bill_to_phone?: string | null
          bill_to_mobile?: string | null
          bill_to_fax?: string | null
          line_items?: Json
          subtotal?: number | null
          discount?: number | null
          tax?: number | null
          total?: number | null
          balance_due?: number | null
          notes?: string | null
          payment_instructions?: string | null
          share_token?: string | null
          payment_method?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          estimate_name: string | null
          estimate_number: string
          date: string
          expiry_date: string | null
          status: string | null
          from_name: string | null
          from_email: string | null
          from_address: string | null
          from_phone: string | null
          bill_to_name: string | null
          bill_to_email: string | null
          bill_to_address: string | null
          bill_to_phone: string | null
          line_items: Json
          subtotal: number | null
          discount: number | null
          tax: number | null
          total: number | null
          notes: string | null
          converted_to_invoice_id: string | null
          share_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          estimate_name?: string | null
          estimate_number: string
          date: string
          expiry_date?: string | null
          status?: string | null
          from_name?: string | null
          from_email?: string | null
          from_address?: string | null
          from_phone?: string | null
          bill_to_name?: string | null
          bill_to_email?: string | null
          bill_to_address?: string | null
          bill_to_phone?: string | null
          line_items?: Json
          subtotal?: number | null
          discount?: number | null
          tax?: number | null
          total?: number | null
          notes?: string | null
          converted_to_invoice_id?: string | null
          share_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          estimate_name?: string | null
          estimate_number?: string
          date?: string
          expiry_date?: string | null
          status?: string | null
          from_name?: string | null
          from_email?: string | null
          from_address?: string | null
          from_phone?: string | null
          bill_to_name?: string | null
          bill_to_email?: string | null
          bill_to_address?: string | null
          bill_to_phone?: string | null
          line_items?: Json
          subtotal?: number | null
          discount?: number | null
          tax?: number | null
          total?: number | null
          notes?: string | null
          converted_to_invoice_id?: string | null
          share_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          merchant: string
          category: string | null
          date: string
          total: number
          tax: number | null
          description: string | null
          receipt_url: string | null
          is_tax_deductible: boolean | null
          business_use_percentage: number | null
          tax_category: string | null
          deductible_amount: number | null
          is_return: boolean | null
          original_expense_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant: string
          category?: string | null
          date: string
          total: number
          tax?: number | null
          description?: string | null
          receipt_url?: string | null
          is_tax_deductible?: boolean | null
          business_use_percentage?: number | null
          tax_category?: string | null
          deductible_amount?: number | null
          is_return?: boolean | null
          original_expense_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant?: string
          category?: string | null
          date?: string
          total?: number
          tax?: number | null
          description?: string | null
          receipt_url?: string | null
          is_tax_deductible?: boolean | null
          business_use_percentage?: number | null
          tax_category?: string | null
          deductible_amount?: number | null
          is_return?: boolean | null
          original_expense_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          invoice_id: string | null
          client_id: string | null
          amount: number
          date: string
          payment_method: string | null
          reference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          invoice_id?: string | null
          client_id?: string | null
          amount: number
          date: string
          payment_method?: string | null
          reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_id?: string | null
          client_id?: string | null
          amount?: number
          date?: string
          payment_method?: string | null
          reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mileage: {
        Row: {
          id: string
          user_id: string
          date: string
          start_location: string
          end_location: string
          miles: number
          purpose: string
          notes: string | null
          is_business: boolean | null
          rate_per_mile: number | null
          total_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          start_location: string
          end_location: string
          miles: number
          purpose: string
          notes?: string | null
          is_business?: boolean | null
          rate_per_mile?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          start_location?: string
          end_location?: string
          miles?: number
          purpose?: string
          notes?: string | null
          is_business?: boolean | null
          rate_per_mile?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific type exports for convenience
export type Profile = Tables<'profiles'>
export type BusinessSettings = Tables<'business_settings'>
export type Client = Tables<'clients'>
export type LineItemTemplate = Tables<'line_item_templates'>
export type Invoice = Tables<'invoices'>
export type Estimate = Tables<'estimates'>
export type Expense = Tables<'expenses'>
export type Payment = Tables<'payments'>
export type Mileage = Tables<'mileage'>

// Line item structure
export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}
