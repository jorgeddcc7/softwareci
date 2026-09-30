"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [esPro, setEsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const cargarTodo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEmail(null);
        setEsPro(false);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_tier")
        .eq("id", user.id)
        .single();

      setEsPro(
        profile?.subscription_status === "active" &&
          profile?.subscription_tier === "pro"
      );

      setLoading(false);
    };

    cargarTodo();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session) {
        setEsPro(false);
      }
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
        className="px-4 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {esPro && (
        <Link
          href="/historial"
          className="nav-link text-sm text-muted hover:text-foreground transition-colors"
        >
          Historial
        </Link>
      )}
      <Link
        href="/cuenta"
        className="nav-link text-sm text-muted hover:text-foreground transition-colors"
      >
        Mi cuenta
      </Link>
      <button
        onClick={handleLogout}
        className="nav-link text-sm text-muted hover:text-foreground transition-colors"
      >
        Salir
      </button>
    </div>
  );
}