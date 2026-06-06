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
      profiles: {
        Row: {
          course: string
          created_at: string
          exam_date: string | null
          exam_name: string | null
          id: string
          onboarded_at: string | null
          selected_subject_ids: string[]
          settings_json: Json | null
          student_name: string | null
          updated_at: string
          year_of_study: string | null
        }
        Insert: {
          course?: string
          created_at?: string
          exam_date?: string | null
          exam_name?: string | null
          id: string
          onboarded_at?: string | null
          selected_subject_ids?: string[]
          settings_json?: Json | null
          student_name?: string | null
          updated_at?: string
          year_of_study?: string | null
        }
        Update: {
          course?: string
          created_at?: string
          exam_date?: string | null
          exam_name?: string | null
          id?: string
          onboarded_at?: string | null
          selected_subject_ids?: string[]
          settings_json?: Json | null
          student_name?: string | null
          updated_at?: string
          year_of_study?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          date: string
          flashcards: boolean | null
          id: string
          quiz: boolean | null
          recap: boolean | null
          user_id: string
        }
        Insert: {
          date: string
          flashcards?: boolean | null
          id?: string
          quiz?: boolean | null
          recap?: boolean | null
          user_id: string
        }
        Update: {
          date?: string
          flashcards?: boolean | null
          id?: string
          quiz?: boolean | null
          recap?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          book_reference: string | null
          correct_index: number | null
          explanation: string | null
          id: string
          options: Json | null
          question: string
          saved_at: string
          subject_id: string | null
          user_answer: number | null
          user_id: string
        }
        Insert: {
          book_reference?: string | null
          correct_index?: number | null
          explanation?: string | null
          id?: string
          options?: Json | null
          question: string
          saved_at?: string
          subject_id?: string | null
          user_answer?: number | null
          user_id: string
        }
        Update: {
          book_reference?: string | null
          correct_index?: number | null
          explanation?: string | null
          id?: string
          options?: Json | null
          question?: string
          saved_at?: string
          subject_id?: string | null
          user_answer?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_diagrams: {
        Row: {
          created_at: string
          custom_prompt: string | null
          explanation: string | null
          id: string
          source: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_prompt?: string | null
          explanation?: string | null
          id?: string
          source?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_prompt?: string | null
          explanation?: string | null
          id?: string
          source?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_flashcards: {
        Row: {
          created_at: string
          definition: string
          ease_factor: number | null
          id: string
          interval: number | null
          next_review: string | null
          repetitions: number | null
          subject_id: string | null
          term: string
          user_id: string
        }
        Insert: {
          created_at?: string
          definition: string
          ease_factor?: number | null
          id?: string
          interval?: number | null
          next_review?: string | null
          repetitions?: number | null
          subject_id?: string | null
          term: string
          user_id: string
        }
        Update: {
          created_at?: string
          definition?: string
          ease_factor?: number | null
          id?: string
          interval?: number | null
          next_review?: string | null
          repetitions?: number | null
          subject_id?: string | null
          term?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          daily_xp: number | null
          daily_xp_date: string | null
          daily_xp_goal: number | null
          history: Json | null
          id: string
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_xp?: number | null
          daily_xp_date?: string | null
          daily_xp_goal?: number | null
          history?: Json | null
          id?: string
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_xp?: number | null
          daily_xp_date?: string | null
          daily_xp_goal?: number | null
          history?: Json | null
          id?: string
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mistakes: {
        Row: {
          correct_index: number | null
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          question: string
          source: string | null
          subject_id: string | null
          times_correct_after: number | null
          times_wrong: number | null
          user_answer: number | null
          user_id: string
        }
        Insert: {
          correct_index?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          question: string
          source?: string | null
          subject_id?: string | null
          times_correct_after?: number | null
          times_wrong?: number | null
          user_answer?: number | null
          user_id: string
        }
        Update: {
          correct_index?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          question?: string
          source?: string | null
          subject_id?: string | null
          times_correct_after?: number | null
          times_wrong?: number | null
          user_answer?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pomodoro_sessions: {
        Row: {
          completed_at: string
          date: string
          duration_minutes: number | null
          id: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          questions_attempted: number | null
          questions_correct: number | null
          subject_id: string
          topics_reviewed: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          subject_id: string
          topics_reviewed?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          subject_id?: string
          topics_reviewed?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_history: {
        Row: {
          created_at: string
          id: string
          quiz_date: string
          score: number | null
          subject_id: string | null
          total: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_date: string
          score?: number | null
          subject_id?: string | null
          total?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quiz_date?: string
          score?: number | null
          subject_id?: string | null
          total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_study_hours: {
        Row: {
          date: string
          hours_studied: number | null
          id: string
          user_id: string
        }
        Insert: {
          date: string
          hours_studied?: number | null
          id?: string
          user_id: string
        }
        Update: {
          date?: string
          hours_studied?: number | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_study_plans: {
        Row: {
          created_at: string
          days: Json | null
          exam_date: string | null
          exam_name: string | null
          id: string
          subjects: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: Json | null
          exam_date?: string | null
          exam_name?: string | null
          id?: string
          subjects?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          days?: Json | null
          exam_date?: string | null
          exam_name?: string | null
          id?: string
          subjects?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_test_marks: {
        Row: {
          created_at: string
          date: string | null
          faculty_name: string | null
          id: string
          marks_obtained: number | null
          remarks: string | null
          subject_id: string | null
          test_name: string | null
          test_type: string | null
          total_marks: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          faculty_name?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          subject_id?: string | null
          test_name?: string | null
          test_type?: string | null
          total_marks?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          faculty_name?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          subject_id?: string | null
          test_name?: string | null
          test_type?: string | null
          total_marks?: number | null
          user_id?: string
        }
        Relationships: []
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
