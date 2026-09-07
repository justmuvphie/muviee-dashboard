"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const menus = [
  { name: "Dashboard", href: "/", icon: "⌂" },
  { name: "Penjualan", href: "/penjualan", icon: "🛍️" },
  { name: "Garansi", href: "/garansi", icon: "🛡️" },
  { name: "Produk", href: "/produk", icon: "📦" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-pink-100 bg-white px-5 lg:hidden">
        <div className="font-bold text-pink-500">
          🦢 muviee.idd
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl bg-pink-50 px-3 py-2 text-xl"
        >
          ☰
        </button>
      </div>

      {/* Overlay Mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-pink-100 bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="border-b border-pink-100 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
              🦢
            </div>

            <div>
              <h1 className="font-bold text-pink-500">
                muviee.idd
              </h1>

              <p className="text-xs text-gray-400">
                admin dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          {menus.map((menu) => {
            const active =
              pathname === menu.href ||
              (menu.href !== "/" && pathname.startsWith(menu.href));

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                    : "text-gray-600 hover:bg-pink-50 hover:text-pink-500"
                }`}
              >
                <span className="text-lg">{menu.icon}</span>
                {menu.name}
              </Link>
            );
          })}
        </nav>

        {/* Account */}
        <div className="border-t border-pink-100 p-4">
          <div className="mb-3 rounded-2xl bg-pink-50 p-3">
            <p className="text-xs text-gray-400">
              logged in as
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-700">
              {email || "Admin"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-2xl border border-red-100 px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}