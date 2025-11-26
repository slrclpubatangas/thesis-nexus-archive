export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      email_verifications: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          expires_at: string;
          attempts: number;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          expires_at: string;
          attempts?: number;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          expires_at?: string;
          attempts?: number;
          used?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_verifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      feedback: {
        Row: {
          comments: string | null;
          created_at: string;
          id: string;
          ip_address: unknown | null;
          rating: number;
          submission_id: string | null;
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: unknown | null;
          rating: number;
          submission_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: unknown | null;
          rating?: number;
          submission_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: false;
            referencedRelation: 'thesis_submissions';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      system_users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          last_login: string | null;
          name: string;
          role: Database['public']['Enums']['user_role'];
          status: Database['public']['Enums']['user_status'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          last_login?: string | null;
          name: string;
          role: Database['public']['Enums']['user_role'];
          status?: Database['public']['Enums']['user_status'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          last_login?: string | null;
          name?: string;
          role?: Database['public']['Enums']['user_role'];
          status?: Database['public']['Enums']['user_status'];
          user_id?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          student_no: string;
          full_name: string;
          course_section: string;
          email: string;
          school_year: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          student_no: string;
          full_name: string;
          course_section: string;
          email: string;
          school_year: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          student_no?: string;
          full_name?: string;
          course_section?: string;
          email?: string;
          school_year?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      thesis_data: {
        Row: {
          authors: string[];
          barcode: string;
          department: string;
          id: number;
          is_deleted: boolean;
          last_modified: string;
          publication_year: number;
          thesis_title: string;
          upload_date: string;
        };
        Insert: {
          authors: string[];
          barcode: string;
          department: string;
          id?: number;
          is_deleted?: boolean;
          last_modified?: string;
          publication_year: number;
          thesis_title: string;
          upload_date?: string;
        };
        Update: {
          authors?: string[];
          barcode?: string;
          department?: string;
          id?: number;
          is_deleted?: boolean;
          last_modified?: string;
          publication_year?: number;
          thesis_title?: string;
          upload_date?: string;
        };
        Relationships: [];
      };
      thesis_submissions: {
        Row: {
          campus: string;
          created_at: string;
          full_name: string;
          id: string;
          program: string | null;
          school: string | null;
          student_number: string | null;
          submission_date: string;
          thesis_title: string;
          user_type: string;
        };
        Insert: {
          campus: string;
          created_at?: string;
          full_name: string;
          id?: string;
          program?: string | null;
          school?: string | null;
          student_number?: string | null;
          submission_date?: string;
          thesis_title: string;
          user_type: string;
        };
        Update: {
          campus?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          program?: string | null;
          school?: string | null;
          student_number?: string | null;
          submission_date?: string;
          thesis_title?: string;
          user_type?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      validate_lpu_student: {
        Args: {
          student_num: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      thesis_status: 'draft' | 'published' | 'archived';
      user_role: 'Admin' | 'Reader';
      user_status: 'Active' | 'Inactive';
    };
    CompositeTypes: Record<string, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals['public'];

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
      thesis_status: ["draft", "published", "archived"],
      user_role: ["Admin", "Reader"],
      user_status: ["Active", "Inactive"],
    },
  },
} as const
