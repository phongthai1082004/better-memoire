import type { ReactNode } from "react";

export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-[0.72rem] leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[0.75rem] leading-relaxed text-coral"
        >
          {error}
        </p>
      )}
    </div>
  );
}
