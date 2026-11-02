import { useId } from "react";

type TextFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  placeholder?: string;
  error?: string;
  minLength?: number;
  maxLength?: number;
};

export default function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  error,
  minLength,
  maxLength,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block font-mono text-xs font-medium text-[#f4f4f5]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        minLength={minLength}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5 block w-full rounded-md border border-[#27272a] bg-[#09090b] px-3.5 py-2 font-mono text-xs text-[#f4f4f5] placeholder-[#71717a] transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
      />
      {error && (
        <p id={errorId} className="mt-1.5 font-mono text-xs text-[#FF6B6B]">
          {error}
        </p>
      )}
    </div>
  );
}
