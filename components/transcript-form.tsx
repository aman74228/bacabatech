"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTranscriptAction,
  type CreateTranscriptResult,
} from "@/app/actions/transcripts";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Transcribe
    </Button>
  );
}

export function TranscriptForm() {
  const [state, formAction] = useFormState<CreateTranscriptResult | null, FormData>(
    createTranscriptAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // On success, clear the input and refresh the list.
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-2">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <Input
          name="url"
          type="url"
          required
          placeholder="https://youtube.com/watch?v=..."
          className="h-11 flex-1"
          aria-label="Video URL"
        />
        <SubmitButton />
      </form>
      {state && !state.ok && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}
    </div>
  );
}
