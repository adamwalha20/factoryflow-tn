export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string | null
          designation: string | null
          id: string
          length: number | null
          reference: string | null
          unit: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          designation?: string | null
          id?: string
          length?: number | null
          reference?: string | null
          unit?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          designation?: string | null
          id?: string
          length?: number | null
          reference?: string | null
          unit?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          changed_by: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action?: string | null
          changed_by?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string | null
          changed_by?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      cartons: {
        Row: {
          article_id: string | null
          carton_number: string | null
          created_at: string | null
          id: string
          of_id: string | null
          operator_id: string | null
          qr_payload: Json | null
          quantity: number | null
          status: string | null
        }
        Insert: {
          article_id?: string | null
          carton_number?: string | null
          created_at?: string | null
          id?: string
          of_id?: string | null
          operator_id?: string | null
          qr_payload?: Json | null
          quantity?: number | null
          status?: string | null
        }
        Update: {
          article_id?: string | null
          carton_number?: string | null
          created_at?: string | null
          id?: string
          of_id?: string | null
          operator_id?: string | null
          qr_payload?: Json | null
          quantity?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cartons_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartons_of_id_fkey"
            columns: ["of_id"]
            isOneToOne: false
            referencedRelation: "manufacturing_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartons_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          pin_code: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          pin_code?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          pin_code?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      machine_events: {
        Row: {
          event_time: string | null
          id: string
          machine_id: string | null
          operator_id: string | null
          status: string | null
        }
        Insert: {
          event_time?: string | null
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          status?: string | null
        }
        Update: {
          event_time?: string | null
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_events_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_events_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_stops: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          machine_id: string | null
          reason: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          machine_id?: string | null
          reason: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          machine_id?: string | null
          reason?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_stops_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          assigned_tablet_id: string | null
          code: string | null
          created_at: string | null
          department: string | null
          id: string
          name: string
          oee: number | null
          status: string
        }
        Insert: {
          assigned_tablet_id?: string | null
          code?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          name: string
          oee?: number | null
          status?: string
        }
        Update: {
          assigned_tablet_id?: string | null
          code?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          name?: string
          oee?: number | null
          status?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          created_at: string | null
          id: string
          machine_id: string | null
          scheduled_for: string
          status: string | null
          task: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          machine_id?: string | null
          scheduled_for: string
          status?: string | null
          task: string
        }
        Update: {
          created_at?: string | null
          id?: string
          machine_id?: string | null
          scheduled_for?: string
          status?: string | null
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturing_orders: {
        Row: {
          adhesif_color: string | null
          article_id: string | null
          carton_model: string | null
          colisage: string | null
          created_at: string | null
          customer: string | null
          due_date: string | null
          id: string
          machine_id: string | null
          mandrin_type: string | null
          observation: string | null
          of_number: string | null
          palettisation: number | null
          planned_axes: number | null
          planned_cartons: number | null
          planned_end_date: string | null
          planned_start_date: string | null
          po_number: string | null
          priority: string | null
          quantity_planned: number | null
          status: string | null
        }
        Insert: {
          adhesif_color?: string | null
          article_id?: string | null
          carton_model?: string | null
          colisage?: string | null
          created_at?: string | null
          customer?: string | null
          due_date?: string | null
          id?: string
          machine_id?: string | null
          mandrin_type?: string | null
          observation?: string | null
          of_number?: string | null
          palettisation?: number | null
          planned_axes?: number | null
          planned_cartons?: number | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          po_number?: string | null
          priority?: string | null
          quantity_planned?: number | null
          status?: string | null
        }
        Update: {
          adhesif_color?: string | null
          article_id?: string | null
          carton_model?: string | null
          colisage?: string | null
          created_at?: string | null
          customer?: string | null
          due_date?: string | null
          id?: string
          machine_id?: string | null
          mandrin_type?: string | null
          observation?: string | null
          of_number?: string | null
          palettisation?: number | null
          planned_axes?: number | null
          planned_cartons?: number | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          po_number?: string | null
          priority?: string | null
          quantity_planned?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manufacturing_orders_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturing_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      material_consumptions: {
        Row: {
          consumed_quantity: number | null
          created_at: string | null
          id: string
          production_entry_id: string | null
          raw_material_id: string | null
          remaining_quantity: number | null
          waste_percentage: number | null
          yield_percentage: number | null
        }
        Insert: {
          consumed_quantity?: number | null
          created_at?: string | null
          id?: string
          production_entry_id?: string | null
          raw_material_id?: string | null
          remaining_quantity?: number | null
          waste_percentage?: number | null
          yield_percentage?: number | null
        }
        Update: {
          consumed_quantity?: number | null
          created_at?: string | null
          id?: string
          production_entry_id?: string | null
          raw_material_id?: string | null
          remaining_quantity?: number | null
          waste_percentage?: number | null
          yield_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_consumptions_production_entry_id_fkey"
            columns: ["production_entry_id"]
            isOneToOne: false
            referencedRelation: "production_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumptions_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
        }
        Relationships: []
      }
      production_entries: {
        Row: {
          axes_quantity: number | null
          cartons_quantity: number | null
          comments: string | null
          created_at: string | null
          good_quantity: number | null
          id: string
          is_conforme: boolean | null
          jumbo_roll_quantity: number | null
          machine_id: string | null
          of_id: string | null
          operator_id: string | null
          qc_metrage: number | null
          qc_poids: number | null
          raw_material_id: string | null
          roll_number: string | null
          scrap_quantity: number | null
        }
        Insert: {
          axes_quantity?: number | null
          cartons_quantity?: number | null
          comments?: string | null
          created_at?: string | null
          good_quantity?: number | null
          id?: string
          is_conforme?: boolean | null
          jumbo_roll_quantity?: number | null
          machine_id?: string | null
          of_id?: string | null
          operator_id?: string | null
          qc_metrage?: number | null
          qc_poids?: number | null
          raw_material_id?: string | null
          roll_number?: string | null
          scrap_quantity?: number | null
        }
        Update: {
          axes_quantity?: number | null
          cartons_quantity?: number | null
          comments?: string | null
          created_at?: string | null
          good_quantity?: number | null
          id?: string
          is_conforme?: boolean | null
          jumbo_roll_quantity?: number | null
          machine_id?: string | null
          of_id?: string | null
          operator_id?: string | null
          qc_metrage?: number | null
          qc_poids?: number | null
          raw_material_id?: string | null
          roll_number?: string | null
          scrap_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_entries_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_of_id_fkey"
            columns: ["of_id"]
            isOneToOne: false
            referencedRelation: "manufacturing_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      production_sessions: {
        Row: {
          article_id: string | null
          created_at: string | null
          end_time: string | null
          id: string
          lot_number: string
          machine_id: string | null
          operator_id: string | null
          start_time: string | null
          status: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          lot_number: string
          machine_id?: string | null
          operator_id?: string | null
          start_time?: string | null
          status?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          lot_number?: string
          machine_id?: string | null
          operator_id?: string | null
          start_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_sessions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_sessions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_sessions_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_inspections: {
        Row: {
          article_id: string | null
          created_at: string | null
          defect_description: string | null
          id: string
          lot_number: string
          machine_id: string | null
          result: string
          validated_quantity: number | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          defect_description?: string | null
          id?: string
          lot_number: string
          machine_id?: string | null
          result: string
          validated_quantity?: number | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          defect_description?: string | null
          id?: string
          lot_number?: string
          machine_id?: string | null
          result?: string
          validated_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_inspections_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          category: string | null
          created_at: string | null
          designation: string | null
          id: string
          quantity_in_stock: number | null
          reference: string | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          designation?: string | null
          id?: string
          quantity_in_stock?: number | null
          reference?: string | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          designation?: string | null
          id?: string
          quantity_in_stock?: number | null
          reference?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          password: string | null
          phone: string | null
          role: string
          status: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_login?: string | null
          name: string
          password?: string | null
          phone?: string | null
          role: string
          status?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password?: string | null
          phone?: string | null
          role?: string
          status?: string
        }
        Relationships: []
      }
      warehouse_movements: {
        Row: {
          carton_id: string | null
          created_at: string | null
          from_location: string | null
          id: string
          movement_type: string | null
          operator_id: string | null
          to_location: string | null
        }
        Insert: {
          carton_id?: string | null
          created_at?: string | null
          from_location?: string | null
          id?: string
          movement_type?: string | null
          operator_id?: string | null
          to_location?: string | null
        }
        Update: {
          carton_id?: string | null
          created_at?: string | null
          from_location?: string | null
          id?: string
          movement_type?: string | null
          operator_id?: string | null
          to_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_movements_carton_id_fkey"
            columns: ["carton_id"]
            isOneToOne: false
            referencedRelation: "cartons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_movements_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      revert_audit_log: { Args: { p_log_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
