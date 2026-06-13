// Types matching the Supabase schema in supabase/schema.sql.
// Regenerate with the Supabase CLI once your project is linked:
//   npx supabase gen types typescript --linked > lib/database.types.ts

export type TranscriptStatus = "pending" | "processing" | "completed" | "failed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      transcripts: {
        Row: {
          id: string;
          user_id: string;
          platform: string | null;
          video_url: string;
          status: TranscriptStatus;
          transcript_text: string | null;
          format: string | null;
          language: string | null;
          duration_seconds: number | null;
          segments: unknown | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform?: string | null;
          video_url: string;
          status?: TranscriptStatus;
          transcript_text?: string | null;
          format?: string | null;
          language?: string | null;
          duration_seconds?: number | null;
          segments?: unknown | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: string | null;
          video_url?: string;
          status?: TranscriptStatus;
          transcript_text?: string | null;
          format?: string | null;
          language?: string | null;
          duration_seconds?: number | null;
          segments?: unknown | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          transcript_count: number;
          is_subscribed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transcript_count?: number;
          is_subscribed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transcript_count?: number;
          is_subscribed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_transcript_count: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      transcript_status: TranscriptStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
