"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"ngo" | "volunteer">("ngo");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    organization: "", city: "", phone: "",
    skills: [] as string[],
  });

  const skillOptions = [
    "Medical", "Teaching", "Cooking",
    "Driving", "Counseling", "Construction",
    "IT Support", "Legal Aid", "Fundraising"
  ];

  const handleSkillToggle = (skill: string) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill]
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: form.name,
        email: form.email,
        role,
        organization: form.organization,
        city: form.city,
        phone: form.phone,
        skills: form.skills,
        createdAt: serverTimestamp(),
        tasksCompleted: 0,
        status: "active"
      });
      document.cookie = `needyfy_role=${role}; path=/; max-age=86400`;
      router.push(role === "ngo" ? "/dashboard" : "/volunteers");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    fontFamily: "var(--font-inter)", fontSize: 14,
    border: "1.5px solid #E5E7EB", borderRadius: 12,
    background: "white", outline: "none",
    boxSizing: "border-box" as const,
    color: "#0F172A",
  };

  const labelStyle = {
    fontFamily: "var(--font-inter)", fontSize: 13,
    fontWeight: 500 as const, color: "#374151",
    display: "block" as const, marginBottom: 8
  };

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .register-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }
        .register-left {
          display: flex;
        }
        .register-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 64px;
          background: #FAFAFA;
          overflow-y: auto;
        }
        .register-form-wrap {
          width: 100%;
          max-width: 440px;
        }
        @media (max-width: 768px) {
          .register-grid {
            grid-template-columns: 1fr;
          }
          .register-left {
            display: none;
          }
          .register-right {
            padding: 32px 24px;
            min-height: 100vh;
            align-items: flex-start;
          }
          .register-form-wrap {
            max-width: 100%;
            padding-top: 16px;
          }
        }
      `}</style>

      <div className="register-grid">

        {/* LEFT — hidden on mobile */}
        <div className="register-left" style={{ position: "relative", overflow: "hidden" }}>
          <Image
            src="/images/auth-bg.jpg"
            alt="Community"
            fill
            style={{ objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(249,115,22,0.85) 0%, rgba(15,23,42,0.7) 100%)"
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            display: "flex", flexDirection: "column",
            justifyContent: "space-between", padding: 48
          }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 40, height: 40, background: "white",
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ color: "#F97316", fontWeight: 700, fontSize: 18 }}>N</span>
              </div>
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "white" }}>
                Needyfy
              </span>
            </Link>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Communities served", value: "48+" },
                { label: "Tasks completed", value: "1,200+" },
                { label: "Avg. response time", value: "< 2 hrs" },
              ].map(item => (
                <div key={item.label} style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 16, padding: "16px 20px",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                    {item.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "white" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="register-right">
          <div className="register-form-wrap">

            {/* Mobile logo */}
            <div style={{ display: "none" }} className="mobile-logo">
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
                <div style={{
                  width: 36, height: 36, background: "#F97316",
                  borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>N</span>
                </div>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                  Needyfy
                </span>
              </Link>
            </div>

            <style>{`
              @media (max-width: 768px) {
                .mobile-logo { display: flex !important; }
              }
            `}</style>

            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: "var(--font-playfair)", fontSize: 30,
                fontWeight: 700, color: "#0F172A", marginBottom: 8
              }}>Create your account</h1>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
                Join Needyfy and start making impact
              </p>
            </div>

            {/* Role Toggle */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              background: "#F3F4F6", borderRadius: 12,
              padding: 4, marginBottom: 28
            }}>
              {(["ngo", "volunteer"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)} style={{
                  fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500,
                  padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer",
                  background: role === r ? "white" : "transparent",
                  color: role === r ? "#F97316" : "#6B7280",
                  boxShadow: role === r ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s", textTransform: "capitalize"
                }}>{r === "ngo" ? "NGO" : "Volunteer"}</button>
              ))}
            </div>

            {/* Progress */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  flex: 1, height: 4, borderRadius: 999,
                  background: step >= s ? "#F97316" : "#E5E7EB",
                  transition: "background 0.3s"
                }} />
              ))}
            </div>

            {error && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20
              }}>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#DC2626" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister}>
              {step === 1 && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Full name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Rahul Sharma"
                      required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#F97316"}
                      onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Email address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#F97316"}
                      onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#F97316"}
                      onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!form.name || !form.email || !form.password) {
                        setError("Please fill all fields");
                        return;
                      }
                      setError("");
                      setStep(2);
                    }}
                    style={{
                      width: "100%", padding: "14px",
                      fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 600,
                      background: "#F97316", color: "white",
                      border: "none", borderRadius: 12, cursor: "pointer"
                    }}>Continue →</button>
                </div>
              )}

              {step === 2 && (
                <div>
                  {role === "ngo" && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Organization name</label>
                      <input
                        type="text"
                        value={form.organization}
                        onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                        placeholder="Helping Hands Foundation"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#F97316"}
                        onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Indore"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#F97316"}
                      onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Phone number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#F97316"}
                      onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>

                  {role === "volunteer" && (
                    <div style={{ marginBottom: 24 }}>
                      <label style={labelStyle}>Your skills (select all that apply)</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {skillOptions.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillToggle(skill)}
                            style={{
                              fontFamily: "var(--font-inter)", fontSize: 13,
                              padding: "8px 16px", borderRadius: 999,
                              border: form.skills.includes(skill)
                                ? "1.5px solid #F97316"
                                : "1.5px solid #E5E7EB",
                              background: form.skills.includes(skill) ? "#FFF7ED" : "white",
                              color: form.skills.includes(skill) ? "#F97316" : "#6B7280",
                              cursor: "pointer", transition: "all 0.15s"
                            }}>{skill}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12 }}>
                    <button type="button" onClick={() => setStep(1)} style={{
                      flex: 1, padding: "14px",
                      fontFamily: "var(--font-inter)", fontSize: 15,
                      background: "white", color: "#6B7280",
                      border: "1.5px solid #E5E7EB", borderRadius: 12, cursor: "pointer"
                    }}>← Back</button>
                    <button type="submit" disabled={loading} style={{
                      flex: 2, padding: "14px",
                      fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 600,
                      background: loading ? "#FED7AA" : "#F97316",
                      color: "white", border: "none", borderRadius: 12,
                      cursor: loading ? "not-allowed" : "pointer"
                    }}>{loading ? "Creating account..." : "Create account"}</button>
                  </div>
                </div>
              )}
            </form>

            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 14,
              color: "#6B7280", textAlign: "center", marginTop: 24
            }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#F97316", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}