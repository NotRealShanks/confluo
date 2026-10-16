import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import type { AuthResponse } from "../api/types";
import { useAuth } from "./context";

export function formValue(data: FormData, key: string): string {
  return String(data.get(key) ?? "");
}

// Shared submit logic for the sign-in and sign-up forms
export function useAuthSubmit(request: (data: FormData) => Promise<AuthResponse>) {
  const { signIn } = useAuth();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      // The form is read before the first await, while the event target is still valid
      const { token } = await request(new FormData(event.currentTarget));
      if (!(await signIn(token))) {
        setFormError("Signed in, but your profile could not be loaded. Please try again.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
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

  return { submit, pending, formError, fieldErrors };
}
