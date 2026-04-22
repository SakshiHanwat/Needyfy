"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Firestore se role fetch karo
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      const role = userDoc.data()?.role;

      // Cookie set karo middleware ke liye
      document.cookie = `needyfy_role=${role}; path=/; max-age=86400`;

      // Role ke hisaab se redirect
      if (role === "ngo") {
        router.push("/dashboard");
      } else if (role === "volunteer") {
        router.push("/volunteers");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }} className="auth-grid">
      <div style={{ position: "relative", overflow: "hidden" }} className="auth-image">
        <Image src="/images/auth-bg.jpg" alt="Community" fill style={{ objectFit: "cover" }} priority />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(249,115,22,0.85) 0%, rgba(15,23,42,0.7) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: "white", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#F97316", fontWeight: 700, fontSize: 18 }}>N</span>
            </div>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "white" }}>Needyfy</span>
          </Link>
          <div>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 36, fontWeight: 700, color: "white", lineHeight: 1.3, marginBottom: 16 }}>
              "Every small act of kindness creates a ripple of change."
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 64px", background: "#FAFAFA" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Welcome back</h1>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 15, color: "#6B7280" }}>Sign in to your Needyfy account</p>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 24 }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#DC2626" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 8 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width: "100%", padding: "13px 16px", fontFamily: "var(--font-inter)", fontSize: 14, border: "1.5px solid #E5E7EB", borderRadius: 12, background: "white", color: "#0F172A", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#F97316"}
                onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 8 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width: "100%", padding: "13px 16px", fontFamily: "var(--font-inter)", fontSize: 14, border: "1.5px solid #E5E7EB", borderRadius: 12, background: "white", color: "#0F172A", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#F97316"}
                onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 600, background: loading ? "#FED7AA" : "#F97316", color: "white", border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 24 }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "#F97316", fontWeight: 600, textDecoration: "none" }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}