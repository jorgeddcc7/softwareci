"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return <div className="w-20 h-8" />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/cuenta"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        Mi cuenta
      </Link>
      <button
        onClick={handleLogout}
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        Salir
      </button>
    </div>
  );
}