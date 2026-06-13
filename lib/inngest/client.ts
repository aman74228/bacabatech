import { EventSchemas, Inngest } from "inngest";

/**
 * Inngest event payloads used across the transcription pipeline.
 */
export type Events = {
  "transcript/requested": {
    data: {
      transcriptId: string;
      userId: string;
      videoUrl: string;
      platform: string | null;
    };
  };
  // Emitted by the worker callback route once the worker has finished (or
  // failed). The heavy result is written to the DB by the callback; this event
  // only carries enough to wake the waiting function.
  "transcript/worker.completed": {
    data: {
      transcriptId: string;
      ok: boolean;
    };
  };
};

export const inngest = new Inngest({
  id: "bacaba",
  schemas: new EventSchemas().fromRecord<Events>(),
});
