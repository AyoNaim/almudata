"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, ArrowUpRight, Fingerprint } from "lucide-react";
import Link from "next/link";
import { BiometricAuth } from "capacitor-biometric-auth";

const Login = () => {
  const [debugData, setDebugData] = useState(null);
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Replaced webAuthnSupported with a direct check for Native Biometrics
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const savedSession = localStorage.getItem("user_session");
      const savedToken = localStorage.getItem("userToken");

      if (savedSession && savedToken) {
        router.replace("/dashboard");
      } else {
        setIsChecking(false);
      }
    };

    checkSession();

    // Check if the device natively supports Biometrics
    const checkBiometrics = async () => {
      try {
        const info = await (BiometricAuth as any).checkBiometry();
        setIsBiometricAvailable(info.isAvailable);
      } catch (err) {
        console.error("Biometric check failed:", err);
        setIsBiometricAvailable(false);
      }
    };

    checkBiometrics();
  }, [router]);

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Trigger the Native OS fingerprint/FaceID hardware screen
      await (BiometricAuth as any).authenticate({
        reason: "Please authenticate to access your account",
        allowDeviceCredential: true,
      });

      const credId = localStorage.getItem("bio_credentials");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      const response = await fetch(
        "https://almudatasub.com.ng/app/api/account/login/index.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${today}`,
          },
          body: JSON.stringify({
            credentialId: credId,
            is_biometric: true,
          }),
        }
      );

      const rawText = await response.text();
      const cleanText = rawText.trim().replace(/^\uFEFF/, "");

      let result;
      try {
        result = JSON.parse(cleanText);
        setDebugData(result);
      } catch (jsonErr) {
        console.error("Parsing failed. Raw response was:", rawText);
        setError("Server communication error. Please try again.");
        setLoading(false);
        return;
      }

      if (result.status === "success") {
        if (!result.token || result.token.includes("FIX_DATABASE")) {
          setError(
            "Account Error: Your API Key is missing in the database. Please contact admin."
          );
          setLoading(false);
          return;
        }

        const sessionData = {
          token: result.token,
          user_data: result.user_data || {},
        };

        localStorage.setItem("user_session", JSON.stringify(sessionData));
        localStorage.setItem("userToken", sessionData.token);
        localStorage.setItem("phone", sessionData.user_data.phone);

        router.push("/dashboard");
      } else {
        setError(result.msg || "Invalid biometric credentials or user not found");
      }
    } catch (err) {
      console.error("Biometric Login Error:", err);
      // BiometricAuth throws an error if the user cancels or the scan fails
      setError("Biometric authentication failed or was cancelled.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      const response = await fetch(
        "https://almudatasub.com.ng/app/api/account/login/index.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${today}`,
          },
          body: JSON.stringify({
            phone: formData.phone,
            accesspass: formData.password,
          }),
        }
      );

      const rawText = await response.text();
      const cleanText = rawText.trim().replace(/^\uFEFF/, "");

      let result;
      try {
        result = JSON.parse(cleanText);
      } catch (jsonErr) {
        console.error("Parsing failed. Raw response was:", rawText);
        setError("Server communication error. Please try again.");
        setLoading(false);
        return;
      }

      if (result.status === "success") {
        if (!result.token || result.token.includes("FIX_DATABASE")) {
          setError(
            "Account Error: Your API Key is missing in the database. Please contact admin."
          );
          setLoading(false);
          return;
        }

        const sessionData = {
          token: result.token,
          user_data: result.user_data || {},
        };

        localStorage.setItem("user_session", JSON.stringify(sessionData));
        localStorage.setItem("userToken", sessionData.token);
        // Ensure phone is stored so subsequent biometric checks can rely on it if your backend requires it
        localStorage.setItem("phone", sessionData.user_data.phone || formData.phone);

        router.push("/dashboard");
      } else {
        setError(result.msg || "Invalid login credentials");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Connection failed. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <img
            src="./almu_bg.png"
            alt="logo"
            width={100}
            height={100}
            className="mb-4"
          />
          <p className="text-xs text-gray-400 font-medium">
            Securing session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 font-sans text-black">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10">
          <img src={"./almu_bg.png"} alt="logo" width={130} height={130} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2 text-center w-full">
          Welcome back, User <span className="text-2xl ml-1">😎</span>
        </h1>
        
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="text-xs text-black underline decoration-gray-400 underline-offset-4 mb-10 hover:text-gray-600 transition-colors"
        >
          Don't have an account? Sign up
        </button>

        <form className="w-full space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-500 font-medium ml-1">
              Your phone
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="08012345678"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-md text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-gray-500 font-medium ml-1">
              Your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!loading}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="..............."
                className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-md text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors bg-white tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-100">
              <p className="text-red-600 text-xs font-medium text-center">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center bg-[#bdf522] hover:bg-[#b0eb14] text-black font-semibold py-4 px-4 rounded-md text-sm transition-all relative disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && (
                <ArrowUpRight
                  className="absolute right-4 w-5 h-5"
                  strokeWidth={2.5}
                />
              )}
            </button>

            {/* Render Fingerprint icon ONLY if Capacitor says Biometrics are available */}
            {isBiometricAvailable && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 rounded-md transition-all hover:border-gray-300 disabled:opacity-70"
                title="Sign in with Biometrics"
              >
                <Fingerprint className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-4 h-4 rounded-sm border border-gray-300 flex items-center justify-center group-hover:border-gray-400 transition-colors">
                <input type="checkbox" className="hidden peer" />
                <svg
                  className="w-3 h-3 text-black hidden peer-checked:block"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M2.5 7.5L5.5 10.5L11.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xs text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              className="text-xs text-gray-600 underline decoration-gray-400 underline-offset-4 hover:text-black transition-colors"
            >
              <Link href={"/forgot"}>Forgot your password?</Link>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;