"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setPending(false);
      router.refresh();
      router.push("/");
    }
  }

  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={signOut}
      disabled={pending}
      aria-label={label}
      title={label}
    >
      <SignOut size={16} weight="regular" />
      {!compact && <span>{pending ? "..." : label}</span>}
    </Button>
  );
}
