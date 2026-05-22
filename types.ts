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
      challenge_claims: {
        Row: {
          challenge_key: string
          claimed_at: string
          day: string
          id: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          challenge_key: string
          claimed_at?: string
          day: string
          id?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          challenge_key?: string
          claimed_at?: string
          day?: string
          id?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      exercise_sets: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          reps: number
          set_number: number
          user_id: string
          weight_kg: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          reps: number
          set_number?: number
          user_id: string
          weight_kg: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          reps?: number
          set_number?: number
          user_id?: string
          weight_kg?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      legend_claims: {
        Row: {
          claimed_at: string
          slot: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          slot: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          slot?: number
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          carbs_g: number
          fat_g: number
          id: string
          logged_at: string
          name: string
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          fat_g?: number
          id?: string
          logged_at?: string
          name: string
          protein_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          fat_g?: number
          id?: string
          logged_at?: string
          name?: string
          protein_g?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_style: string
          character_level: number
          created_at: string
          current_weight_kg: number | null
          daily_calorie_goal: number | null
          daily_protein_goal: number | null
          display_name: string | null
          equipped_outfit: Json
          goal_weight_kg: number | null
          hairstyle: string | null
          id: string
          show_on_leaderboard: boolean
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_style?: string
          character_level?: number
          created_at?: string
          current_weight_kg?: number | null
          daily_calorie_goal?: number | null
          daily_protein_goal?: number | null
          display_name?: string | null
          equipped_outfit?: Json
          goal_weight_kg?: number | null
          hairstyle?: string | null
          id: string
          show_on_leaderboard?: boolean
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_style?: string
          character_level?: number
          created_at?: string
          current_weight_kg?: number | null
          daily_calorie_goal?: number | null
          daily_protein_goal?: number | null
          display_name?: string | null
          equipped_outfit?: Json
          goal_weight_kg?: number | null
          hairstyle?: string | null
          id?: string
          show_on_leaderboard?: boolean
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      rest_days: {
        Row: {
          created_at: string
          day: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_day_xp_log: {
        Row: {
          awarded_at: string
          day: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          day: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          day?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          id: string
          kind: string
          logged_at: string
          user_id: string
        }
        Insert: {
          id?: string
          kind?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          id?: string
          kind?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unlocked_rewards: {
        Row: {
          id: string
          reward_key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reward_key: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reward_key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          id: string
          logged_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          id?: string
          logged_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          id?: string
          logged_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          performed_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          performed_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          performed_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_supplement_day_xp: { Args: never; Returns: Json }
      award_workout_xp: {
        Args: { p_pr_count?: number; p_workout_id: string }
        Returns: Json
      }
      claim_daily_challenge: { Args: { p_key: string }; Returns: Json }
      claim_rewards: { Args: { p_keys: string[] }; Returns: Json }
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_style: string
          display_name: string
          equipped_outfit: Json
          hairstyle: string
          id: string
          xp: number
        }[]
      }
      level_from_xp: { Args: { p_xp: number }; Returns: number }
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
