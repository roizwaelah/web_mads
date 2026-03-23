import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { isLoginLocked } from "../../utils/auth";
import { sanitizePlainText, validateUsername } from "../../utils/security";

const Login = ({ onLoginRequest, showToast, themeSettings }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [trapField, setTrapField] = useState("");
  const [formStartedAt] = useState(Date.now());
  const [lockState, setLockState] = useState({ locked: false, lockedUntil: 0 });

  useEffect(() => {
    if (themeSettings?.logoUrl || themeSettings?.schoolName) {
      setLocalSettings(themeSettings);
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings.php?ts=${Date.now()}`, {
          cache: "no-store",
        });
        const result = await res.json();
        if (result.status === "success") {
          setLocalSettings(result.data || {});
        }
      } catch {
        // silent fallback
      }
    };

    fetchSettings();
  }, [themeSettings]);

  const logoUrl = "/dp.png";
  const schoolName =
    localSettings?.schoolName ||
    themeSettings?.schoolName ||
    "DP-Panel";

  useEffect(() => {
    setLockState(isLoginLocked());
    const timer = setInterval(() => setLockState(isLoginLocked()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lockMessage = useMemo(() => {
    if (!lockState.locked) return "";
    const sec = Math.max(0, Math.ceil((lockState.lockedUntil - Date.now()) / 1000));
    return `Terlalu banyak percobaan login. Coba lagi dalam ${sec} detik.`;
  }, [lockState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (trapField) return;
    if (Date.now() - formStartedAt < 1200) {
      showToast?.("Permintaan terdeteksi tidak valid.", "error");
      return;
    }
    if (lockState.locked) {
      showToast?.(lockMessage || "Akun sementara dikunci.", "error");
      return;
    }
    const cleanedUsername = sanitizePlainText(username);
    if (!validateUsername(cleanedUsername)) {
      showToast?.("Format username/email tidak valid.", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await onLoginRequest?.({
        username: cleanedUsername,
        password,
        rememberMe,
      });
      if (!result?.ok) {
        showToast?.(result?.message || "Login gagal.", "error");
        setLockState(isLoginLocked());
        return;
      }
      showToast?.("Login berhasil.");
      setTimeout(() => {
        navigate("/admin");
      }, 250);
    } catch {
      showToast?.("Gagal memproses login.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex flex-col items-center pt-20 font-sans">
      <div className="mb-6 flex flex-col items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={schoolName}
            className="w-62 h-24 object-contain"
          />
        ) : (
          <div className="text-center font-serif italic text-[80px] text-[#3c434a]">W</div>
        )}
        <div className="text-sm font-semibold text-[#3c434a]">{schoolName}</div>
      </div>
      <div className="bg-white p-6 rounded shadow-sm border border-[#2271b1] w-full max-w-[320px]">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trapField}
            onChange={(e) => setTrapField(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
          <div className="mb-4">
            <label className="block text-[#3c434a] text-[14px] mb-1">Nama Pengguna</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded text-[20px] focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-inner"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#3c434a] text-[14px] mb-1">Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 pr-11 rounded text-[20px] focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2271b1] p-1"
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-[13px] text-[#3c434a]">
              <input
                type="checkbox"
                className="rounded border-gray-400 text-[#2271b1] focus:ring-[#2271b1]"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />{" "}
              Ingat Saya
            </label>
            <button
              type="submit"
              disabled={loading || lockState.locked}
              className="bg-[#2271b1] text-white px-5 py-1.5 rounded font-medium hover:bg-[#135e96] shadow-sm text-[14px] disabled:opacity-70"
            >
              {loading ? 'Memuat...' : 'Log Masuk'}
            </button>
          </div>
          {lockMessage && (
            <p className="text-xs text-red-600 mt-2 text-center">{lockMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;

