import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import type { AuthResponse } from "../api/types";
import { useAuth } from "./context";

export function formValue(data: FormData, key: string): string {
  return String(data.get(key) ?? "");
}

export type ConflictData = {
  confirmationToken: string;
  activeSession?: {
    deviceInfo?: string;
    ipAddress?: string;
    createdAt?: string;
    lastUsedAt?: string;
  };
};

// Shared submit logic for the sign-in and sign-up forms
export function useAuthSubmit(request: (data: FormData) => Promise<AuthResponse>) {
  const { signIn } = useAuth();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFormError(null);
    setFieldErrors({});
    setConflictData(null);

    try {
      // The form is read before the first await, while the event target is still valid
      const { token } = await request(new FormData(event.currentTarget));
      if (!(await signIn(token))) {
        setFormError("Signed in, but your profile could not be loaded. Please try again.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409 && error.data?.conflict && error.data?.confirmationToken) {
          setConflictData({
            confirmationToken: String(error.data.confirmationToken),
            activeSession: error.data.activeSession as ConflictData["activeSession"],
          });
          return;
        }
        setFieldErrors(error.fieldErrors);
        // Field errors render under their inputs; anything else goes in the alert
        setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message);
      } else {
        setFormError("Could not reach the server. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  const clearConflict = () => setConflictData(null);

  return { submit, pending, formError, fieldErrors, conflictData, clearConflict };
}
