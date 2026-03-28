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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appeals: {
        Row: {
          created_at: string
          evidence_url: string | null
          explanation: string
          id: string
          resolved_at: string | null
          status: string
          submission_id: string
          ticket_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence_url?: string | null
          explanation: string
          id?: string
          resolved_at?: string | null
          status?: string
          submission_id: string
          ticket_number?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence_url?: string | null
          explanation?: string
          id?: string
          resolved_at?: string | null
          status?: string
          submission_id?: string
          ticket_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          habit_id: string | null
          id: string
          joined_at: string | null
          payment_status: string
          result: string | null
          stake_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          habit_id?: string | null
          id?: string
          joined_at?: string | null
          payment_status?: string
          result?: string | null
          stake_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          habit_id?: string | null
          id?: string
          joined_at?: string | null
          payment_status?: string
          result?: string | null
          stake_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_stake_id_fkey"
            columns: ["stake_id"]
            isOneToOne: false
            referencedRelation: "stakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          charity_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          habit_category: string
          id: string
          is_group_challenge: boolean
          stake_amount: number
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          charity_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          habit_category?: string
          id?: string
          is_group_challenge?: boolean
          stake_amount?: number
          start_date?: string | null
          status?: string
          title: string
        }
        Update: {
          charity_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          habit_category?: string
          id?: string
          is_group_challenge?: boolean
          stake_amount?: number
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      charities: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          name: string
          sdg_alignment: string | null
          total_received: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name: string
          sdg_alignment?: string | null
          total_received?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          sdg_alignment?: string | null
          total_received?: number
        }
        Relationships: []
      }
      fraud_reports: {
        Row: {
          challenge_id: string
          created_at: string
          evidence_notes: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          status: string
          submission_id: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          evidence_notes?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
          submission_id?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          evidence_notes?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_reports_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          charity_id: string | null
          created_at: string
          daily_deadline: string | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          start_date: string
          status: string
          title: string
          user_id: string
          verification_type: string
        }
        Insert: {
          category?: string | null
          charity_id?: string | null
          created_at?: string
          daily_deadline?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          start_date?: string
          status?: string
          title: string
          user_id: string
          verification_type?: string
        }
        Update: {
          category?: string | null
          charity_id?: string | null
          created_at?: string
          daily_deadline?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          start_date?: string
          status?: string
          title?: string
          user_id?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          challenge_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          challenge_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          challenge_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_registered: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notifications_enabled: boolean | null
          notify_opponent_activity: boolean
          notify_reminders: boolean
          notify_verifications: boolean
          onboarding_completed: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          spending_limit: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_registered?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          notifications_enabled?: boolean | null
          notify_opponent_activity?: boolean
          notify_reminders?: boolean
          notify_verifications?: boolean
          onboarding_completed?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          spending_limit?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_registered?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notifications_enabled?: boolean | null
          notify_opponent_activity?: boolean
          notify_reminders?: boolean
          notify_verifications?: boolean
          onboarding_completed?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          spending_limit?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      stakes: {
        Row: {
          amount: number
          charity_id: string
          currency: string
          date_created: string
          date_resolved: string | null
          habit_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          charity_id: string
          currency?: string
          date_created?: string
          date_resolved?: string | null
          habit_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          charity_id?: string
          currency?: string
          date_created?: string
          date_resolved?: string | null
          habit_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakes_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakes_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          created_at: string
          first_name: string
          habit_type: string
          id: string
          quote: string
        }
        Insert: {
          created_at?: string
          first_name: string
          habit_type: string
          id?: string
          quote: string
        }
        Update: {
          created_at?: string
          first_name?: string
          habit_type?: string
          id?: string
          quote?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          id: string
          payment_reference: string | null
          stake_id: string | null
          status: string
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          payment_reference?: string | null
          stake_id?: string | null
          status?: string
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          payment_reference?: string | null
          stake_id?: string | null
          status?: string
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_stake_id_fkey"
            columns: ["stake_id"]
            isOneToOne: false
            referencedRelation: "stakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_examples: {
        Row: {
          created_at: string
          explanation: string
          habit_category: string
          id: string
          image_url: string
          is_good: boolean
        }
        Insert: {
          created_at?: string
          explanation: string
          habit_category: string
          id?: string
          image_url: string
          is_good?: boolean
        }
        Update: {
          created_at?: string
          explanation?: string
          habit_category?: string
          id?: string
          image_url?: string
          is_good?: boolean
        }
        Relationships: []
      }
      verification_submissions: {
        Row: {
          evidence_type: string
          file_url: string | null
          habit_id: string
          id: string
          notes: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          evidence_type?: string
          file_url?: string | null
          habit_id: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          evidence_type?: string
          file_url?: string | null
          habit_id?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_challenge_if_ready: {
        Args: { _challenge_id: string }
        Returns: boolean
      }
      get_challenge_participants: {
        Args: { _challenge_id: string }
        Returns: {
          display_name: string
          status: string
          user_id: string
          username: string
        }[]
      }
      search_profiles: {
        Args: { _exclude_user_id?: string; _query: string }
        Returns: {
          avatar_url: string
          first_name: string
          id: string
          username: string
        }[]
      }
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
