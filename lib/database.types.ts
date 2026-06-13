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
          created_at?: string;
        };
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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transcript_status: TranscriptStatus;
    };
  };
}
