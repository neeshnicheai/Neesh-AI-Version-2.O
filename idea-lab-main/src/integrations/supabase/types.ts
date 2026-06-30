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
      audience_members: {
        Row: {
          created_at: string
          detected_persona:
            | Database["public"]["Enums"]["audience_persona"]
            | null
          email: string
          first_interaction_at: string
          id: string
          last_interaction_at: string
          name: string
          occupation: string | null
          persona_confidence: number | null
          project_id: string
          total_feedback: number | null
          total_questions: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detected_persona?:
            | Database["public"]["Enums"]["audience_persona"]
            | null
          email: string
          first_interaction_at?: string
          id?: string
          last_interaction_at?: string
          name: string
          occupation?: string | null
          persona_confidence?: number | null
          project_id: string
          total_feedback?: number | null
          total_questions?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detected_persona?:
            | Database["public"]["Enums"]["audience_persona"]
            | null
          email?: string
          first_interaction_at?: string
          id?: string
          last_interaction_at?: string
          name?: string
          occupation?: string | null
          persona_confidence?: number | null
          project_id?: string
          total_feedback?: number | null
          total_questions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      audience_questions: {
        Row: {
          asked_at: string
          detected_topic: string | null
          id: string
          is_answered: boolean | null
          member_id: string | null
          project_id: string
          question: string
        }
        Insert: {
          asked_at?: string
          detected_topic?: string | null
          id?: string
          is_answered?: boolean | null
          member_id?: string | null
          project_id: string
          question: string
        }
        Update: {
          asked_at?: string
          detected_topic?: string | null
          id?: string
          is_answered?: boolean | null
          member_id?: string | null
          project_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_questions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "audience_members"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          content: string | null
          cover_image_url: string | null
          created_at: string
          custom_fields: Json | null
          heading: string | null
          id: string
          introduction: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_fields?: Json | null
          heading?: string | null
          id?: string
          introduction?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_fields?: Json | null
          heading?: string | null
          id?: string
          introduction?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_group_id: string
          id: string
          is_active: boolean
          mime_type: string
          original_filename: string
          project_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          created_at?: string
          document_group_id?: string
          id?: string
          is_active?: boolean
          mime_type: string
          original_filename: string
          project_id: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          created_at?: string
          document_group_id?: string
          id?: string
          is_active?: boolean
          mime_type?: string
          original_filename?: string
          project_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_insights: {
        Row: {
          avg_engagement_score: number | null
          common_questions: Json | null
          confusion_points: Json | null
          content_suggestions: Json | null
          created_at: string
          id: string
          last_analyzed_at: string
          persona: Database["public"]["Enums"]["audience_persona"]
          project_id: string
          total_members: number | null
          updated_at: string
        }
        Insert: {
          avg_engagement_score?: number | null
          common_questions?: Json | null
          confusion_points?: Json | null
          content_suggestions?: Json | null
          created_at?: string
          id?: string
          last_analyzed_at?: string
          persona: Database["public"]["Enums"]["audience_persona"]
          project_id: string
          total_members?: number | null
          updated_at?: string
        }
        Update: {
          avg_engagement_score?: number | null
          common_questions?: Json | null
          confusion_points?: Json | null
          content_suggestions?: Json | null
          created_at?: string
          id?: string
          last_analyzed_at?: string
          persona?: Database["public"]["Enums"]["audience_persona"]
          project_id?: string
          total_members?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          deleted: boolean
          description: string | null
          id: string
          introduction: string | null
          one_line_summary: string | null
          owner_id: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          description?: string | null
          id?: string
          introduction?: string | null
          one_line_summary?: string | null
          owner_id: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          description?: string | null
          id?: string
          introduction?: string | null
          one_line_summary?: string | null
          owner_id?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_slug: { Args: { base_slug: string }; Returns: string }
    }
    Enums: {
      audience_persona:
        | "developer"
        | "marketer"
        | "investor"
        | "designer"
        | "entrepreneur"
        | "researcher"
        | "other"
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
    Enums: {
      audience_persona: [
        "developer",
        "marketer",
        "investor",
        "designer",
        "entrepreneur",
        "researcher",
        "other",
      ],
    },
  },
} as const
