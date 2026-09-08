"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkLogin = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/");
      }
    };

    checkLogin();
  }, [router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
  
    setLoading(true);
    setError("");
  
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) {
        console.error("LOGIN ERROR:", error);
        setError(error.message);
        return;
      }
  
      router.replace("/");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Terjadi kesalahan saat menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7fa] px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-3xl shadow-sm">
            🦢
          </div>

          <h1 className="text-3xl font-bold text-pink-500">
            muviee.idd
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            welcome back, admin ♡
          </p>
        </div>

        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-[0_10px_40px_rgba(244,114,182,0.12)] sm:p-8">
          <h2 className="text-xl font-bold text-gray-800">
            Admin Login
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Masuk untuk mengelola toko kamu.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-pink-500 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Login ♡"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          muviee.idd admin dashboard
        </p>
      </div>
    </main>
  );
}