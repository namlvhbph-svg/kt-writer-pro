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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
    kt_doc_types: {
      Row: {
        id: string;
        code: string;
        name: string;
        doc_group: string;
        sort_order: number;
        is_active: boolean;
        created_at: string;
      };
      Insert: {
        id?: string;
        code: string;
        name: string;
        doc_group?: string;
        sort_order?: number;
        is_active?: boolean;
        created_at?: string;
      };
      Update: {
        id?: string;
        code?: string;
        name?: string;
        doc_group?: string;
        sort_order?: number;
        is_active?: boolean;
        created_at?: string;
      };
      Relationships: [

      ];
    };
    kt_topic_groups: {
      Row: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        sort_order: number;
        created_at: string;
      };
      Insert: {
        id?: string;
        code: string;
        name: string;
        description?: string | null;
        sort_order?: number;
        created_at?: string;
      };
      Update: {
        id?: string;
        code?: string;
        name?: string;
        description?: string | null;
        sort_order?: number;
        created_at?: string;
      };
      Relationships: [

      ];
    };
    kt_sources: {
      Row: {
        id: string;
        name: string;
        base_url: string | null;
        index_url: string | null;
        link_filter: string | null;
        doc_group: string;
        is_active: boolean;
        last_crawled_at: string | null;
        last_crawl_status: string | null;
        last_crawl_new_count: number;
        last_crawl_error: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        base_url?: string | null;
        index_url?: string | null;
        link_filter?: string | null;
        doc_group?: string;
        is_active?: boolean;
        last_crawled_at?: string | null;
        last_crawl_status?: string | null;
        last_crawl_new_count?: number;
        last_crawl_error?: string | null;
        notes?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        base_url?: string | null;
        index_url?: string | null;
        link_filter?: string | null;
        doc_group?: string;
        is_active?: boolean;
        last_crawled_at?: string | null;
        last_crawl_status?: string | null;
        last_crawl_new_count?: number;
        last_crawl_error?: string | null;
        notes?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [

      ];
    };
    kt_keywords: {
      Row: {
        id: string;
        term: string;
        topic_group_id: string | null;
        keyword_type: string;
        trend_flag: string;
        priority: number;
        monthly_searches: number | null;
        status: string;
        notes: string | null;
        origin: string;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        term: string;
        topic_group_id?: string | null;
        keyword_type?: string;
        trend_flag?: string;
        priority?: number;
        monthly_searches?: number | null;
        status?: string;
        notes?: string | null;
        origin?: string;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        term?: string;
        topic_group_id?: string | null;
        keyword_type?: string;
        trend_flag?: string;
        priority?: number;
        monthly_searches?: number | null;
        status?: string;
        notes?: string | null;
        origin?: string;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [
        { foreignKeyName: "kt_keywords_topic_group_id_fkey"; columns: ["topic_group_id"]; isOneToOne: false; referencedRelation: "kt_topic_groups"; referencedColumns: ["id"] }
      ];
    };
    kt_documents: {
      Row: {
        id: string;
        title: string;
        doc_number: string | null;
        doc_type_id: string | null;
        topic_group_id: string | null;
        source_id: string | null;
        issuing_body: string | null;
        issued_date: string | null;
        effective_date: string | null;
        expiry_date: string | null;
        legal_status: string;
        review_status: string;
        original_url: string | null;
        raw_text: string;
        char_count: number;
        file_path: string | null;
        file_name: string | null;
        file_size: number | null;
        mime_type: string | null;
        fingerprint: string;
        origin: string;
        notes: string | null;
        created_by: string | null;
        discovered_at: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        title: string;
        doc_number?: string | null;
        doc_type_id?: string | null;
        topic_group_id?: string | null;
        source_id?: string | null;
        issuing_body?: string | null;
        issued_date?: string | null;
        effective_date?: string | null;
        expiry_date?: string | null;
        legal_status?: string;
        review_status?: string;
        original_url?: string | null;
        raw_text?: string;
        char_count?: number;
        file_path?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        mime_type?: string | null;
        fingerprint: string;
        origin?: string;
        notes?: string | null;
        created_by?: string | null;
        discovered_at?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        title?: string;
        doc_number?: string | null;
        doc_type_id?: string | null;
        topic_group_id?: string | null;
        source_id?: string | null;
        issuing_body?: string | null;
        issued_date?: string | null;
        effective_date?: string | null;
        expiry_date?: string | null;
        legal_status?: string;
        review_status?: string;
        original_url?: string | null;
        raw_text?: string;
        char_count?: number;
        file_path?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        mime_type?: string | null;
        fingerprint?: string;
        origin?: string;
        notes?: string | null;
        created_by?: string | null;
        discovered_at?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [
        { foreignKeyName: "kt_documents_doc_type_id_fkey"; columns: ["doc_type_id"]; isOneToOne: false; referencedRelation: "kt_doc_types"; referencedColumns: ["id"] },
        { foreignKeyName: "kt_documents_topic_group_id_fkey"; columns: ["topic_group_id"]; isOneToOne: false; referencedRelation: "kt_topic_groups"; referencedColumns: ["id"] },
        { foreignKeyName: "kt_documents_source_id_fkey"; columns: ["source_id"]; isOneToOne: false; referencedRelation: "kt_sources"; referencedColumns: ["id"] }
      ];
    };
    kt_document_keywords: {
      Row: {
        document_id: string;
        keyword_id: string;
        created_at: string;
      };
      Insert: {
        document_id: string;
        keyword_id: string;
        created_at?: string;
      };
      Update: {
        document_id?: string;
        keyword_id?: string;
        created_at?: string;
      };
      Relationships: [
        { foreignKeyName: "kt_document_keywords_document_id_fkey"; columns: ["document_id"]; isOneToOne: false; referencedRelation: "kt_documents"; referencedColumns: ["id"] },
        { foreignKeyName: "kt_document_keywords_keyword_id_fkey"; columns: ["keyword_id"]; isOneToOne: false; referencedRelation: "kt_keywords"; referencedColumns: ["id"] }
      ];
    };
    kt_articles: {
      Row: {
        id: string;
        document_id: string | null;
        title: string;
        slug: string;
        meta_description: string | null;
        content_md: string;
        article_type: string;
        word_count: number;
        status: string;
        validation_note: string | null;
        origin: string;
        published_file: boolean;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        document_id?: string | null;
        title: string;
        slug: string;
        meta_description?: string | null;
        content_md?: string;
        article_type?: string;
        word_count?: number;
        status?: string;
        validation_note?: string | null;
        origin?: string;
        published_file?: boolean;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        document_id?: string | null;
        title?: string;
        slug?: string;
        meta_description?: string | null;
        content_md?: string;
        article_type?: string;
        word_count?: number;
        status?: string;
        validation_note?: string | null;
        origin?: string;
        published_file?: boolean;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [
        { foreignKeyName: "kt_articles_document_id_fkey"; columns: ["document_id"]; isOneToOne: false; referencedRelation: "kt_documents"; referencedColumns: ["id"] }
      ];
    };
    kt_article_keywords: {
      Row: {
        article_id: string;
        keyword_id: string;
        created_at: string;
      };
      Insert: {
        article_id: string;
        keyword_id: string;
        created_at?: string;
      };
      Update: {
        article_id?: string;
        keyword_id?: string;
        created_at?: string;
      };
      Relationships: [
        { foreignKeyName: "kt_article_keywords_article_id_fkey"; columns: ["article_id"]; isOneToOne: false; referencedRelation: "kt_articles"; referencedColumns: ["id"] },
        { foreignKeyName: "kt_article_keywords_keyword_id_fkey"; columns: ["keyword_id"]; isOneToOne: false; referencedRelation: "kt_keywords"; referencedColumns: ["id"] }
      ];
    };
    profiles: {
      Row: {
        id: string;
        email: string | null;
        full_name: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id: string;
        email?: string | null;
        full_name?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        email?: string | null;
        full_name?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [

      ];
    };
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
