"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const router = useRouter();
  
  const [mode, setMode] = useState("email_login"); // 'email_login', 'email_register', 'totp_challenge'
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!mfaError && mfaData.currentLevel === 'aal1' && mfaData.nextLevel === 'aal2') {
          const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
          if (!factorsError && factorsData?.totp?.length > 0) {
            setMfaFactorId(factorsData.totp[0].id);
            setMode("totp_challenge");
            return;
          }
        }
        router.push("/dashboard");
      }
    };
    checkActiveSession();
  }, [router]);

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // Check if MFA is required
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!mfaError && mfaData.currentLevel === 'aal1' && mfaData.nextLevel === 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (!factorsError && factorsData?.totp?.length > 0) {
          setMfaFactorId(factorsData.totp[0].id);
          setMode("totp_challenge");
          setLoading(false);
          return;
        }
      }
      setSuccessMsg("Berhasil login!");
      router.push("/dashboard");
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) setErrorMsg(error.message);
    else {
      setSuccessMsg("Pendaftaran berhasil! Cek email untuk konfirmasi.");
      setMode("email_login");
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      setErrorMsg(`Gagal login dengan ${provider}: ${error.message}`);
      setLoading(false);
    }
  };



  const handleTotpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: otp,
      });
      
      if (verifyError) throw verifyError;
      
      setSuccessMsg("Verifikasi MFA berhasil!");
      router.push("/dashboard");
    } catch (error) {
      setErrorMsg(error.message || "Kode OTP/authenticator salah atau kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Selamat Datang</h2>
        <p className="mt-2 text-sm text-gray-500">
          {mode === "email_login" && "Masuk dengan akun email Anda"}
          {mode === "email_register" && "Daftarkan akun email baru"}
          {mode === "totp_challenge" && "Masukkan kode dari aplikasi Authenticator Anda"}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-100">
          {successMsg}
        </div>
      )}

      {/* Forms */}
      {(mode === "email_login" || mode === "email_register") && (
        <form onSubmit={mode === "email_login" ? handleEmailLogin : handleEmailRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              mode === "email_login" ? "Masuk" : "Daftar"
            )}
          </button>
        </form>
      )}



      {mode === "totp_challenge" && (
        <form onSubmit={handleTotpVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kode Authenticator (TOTP)</label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 block w-full text-center tracking-widest text-2xl px-4 py-3 rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="••••••"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center"
          >
            {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
          </button>
        </form>
      )}

      {mode !== "totp_challenge" ? (
        <>
          {/* Social Logins */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/70 text-gray-500 backdrop-blur-md">Atau lanjutkan dengan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              type="button"
              disabled={loading}
              className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuthLogin('facebook')}
              type="button"
              disabled={loading}
              className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="h-5 w-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center text-sm text-gray-600">
            {mode !== "email_login" && (
              <button onClick={() => setMode("email_login")} className="hover:text-blue-600 font-medium transition-colors">
                Login Email
              </button>
            )}
            {mode !== "email_register" && (
              <button onClick={() => setMode("email_register")} className="hover:text-blue-600 font-medium transition-colors">
                Daftar Akun
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6 flex justify-center text-sm">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setMode("email_login");
              clearMessages();
            }}
            className="text-gray-500 hover:text-blue-600 font-medium transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      )}
    </div>
  );
}
