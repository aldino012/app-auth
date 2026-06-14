"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.replace("/login");
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Selamat datang di panel kontrol Anda.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Akun</h2>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-500 w-32">ID Pengguna</span>
              <span className="text-sm text-gray-900 font-mono bg-gray-200 px-2 py-1 rounded">{user.id}</span>
            </div>
            {user.email && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-gray-500 w-32">Email</span>
                <span className="text-sm text-gray-900">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-gray-500 w-32">Telepon/WA</span>
                <span className="text-sm text-gray-900">{user.phone}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Provider</span>
              <span className="text-sm text-gray-900 capitalize">{user.app_metadata?.provider || 'Unknown'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Terakhir Login</span>
              <span className="text-sm text-gray-900">
                {new Date(user.last_sign_in_at).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
