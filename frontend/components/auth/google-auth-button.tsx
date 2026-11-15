import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.4C29.5 34.7 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C41.2 35.7 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  label,
  error,
}: {
  label: string;
  error?: string | null;
}) {
  return (
    <div className="mt-6">
      <a href="/api/auth/google/start" className="btn btn-outline btn-md w-full">
        <GoogleMark className="h-[16px] w-[16px] shrink-0" />
        {label}
      </a>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[0.74rem] leading-relaxed text-coral"
        >
          <WarningCircle size={13} weight="fill" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
