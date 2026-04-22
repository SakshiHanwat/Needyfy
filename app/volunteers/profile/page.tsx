"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import AuthGuard from "@/components/AuthGuard";

const skillOptions = [
  "Medical", "Teaching", "Cooking", "Driving",
  "Counseling", "Construction", "IT Support", "Legal Aid", "Fundraising"
];

export default function ProfilePage() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "Volunteer",
    email: "",
    city: "Bhopal",
    phone: "",
    skills: [] as string[],
    tasksCompleted: 0,
    impactScore: 0,
    streak: 0,
    joinedDate: "2025",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(prev => ({
          ...prev,
          name: data.name || user.displayName || user.email?.split("@")[0] || "Volunteer",
          email: data.email || user.email || "",
          city: data.city || prev.city,
          phone: data.phone || prev.phone,
          skills: data.skills || prev.skills,
          tasksCompleted: data.tasksCompleted || 0,
          impactScore: (data.tasksCompleted || 0) * 70,
          streak: Math.min(data.tasksCompleted || 0, 7),
          joinedDate: data.createdAt?.toDate?.()?.getFullYear?.() || "2025",
        }));
      } else {
        setProfile(prev => ({
          ...prev,
          name: user.displayName || user.email?.split("@")[0] || "Volunteer",
          email: user.email || "",
        }));
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          name: profile.name,
          city: profile.city,
          phone: profile.phone,
          skills: profile.skills,
        });
      }
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out!");
      router.push("/login");
    } catch {
      toast.error("Could not sign out.");
    }
  };

  const toggleSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Toaster position="top-right" />

        {/* NAV */}
        <nav style={{
          background: "white", borderBottom: "1px solid #F1F5F9",
          padding: "0 32px", height: 64,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40
        }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center",
            gap: 10, textDecoration: "none"
          }}>
            <div style={{
              width: 36, height: 36, background: "#F97316",
              borderRadius: 10, display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>N</span>
            </div>
            <span style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 20, fontWeight: 700, color: "#0F172A"
            }}>Needyfy</span>
          </Link>

          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Find Tasks", href: "/volunteers" },
              { label: "My Impact", href: "/volunteers" },
              { label: "Leaderboard", href: "/volunteers" },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                color: "#6B7280", textDecoration: "none"
              }}>{item.label}</Link>
            ))}
          </div>

          <Link href="/volunteers" style={{
            fontFamily: "var(--font-inter)", fontSize: 13,
            color: "#F97316", textDecoration: "none", fontWeight: 500
          }}>← Back to Dashboard</Link>
        </nav>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

          {/* HERO CARD */}
          <div style={{
            background: "white", borderRadius: 24,
            border: "1px solid #F1F5F9",
            overflow: "hidden", marginBottom: 24
          }}>
            <div style={{
              height: 120,
              background: "#F97316",
              position: "relative"
            }} />
            <div style={{ padding: "0 32px 32px" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "#0F172A", border: "4px solid white",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                marginTop: -40, marginBottom: 16
              }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 32 }}>
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start"
              }}>
                <div>
                  <h1 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 28,
                    fontWeight: 700, color: "#0F172A", marginBottom: 4
                  }}>{profile.name}</h1>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 14,
                    color: "#6B7280", marginBottom: 4
                  }}>{profile.email}</p>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF"
                  }}>
                    📍 {profile.city} · Joined {profile.joinedDate}
                  </p>
                </div>

                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  disabled={loading}
                  style={{
                    fontFamily: "var(--font-inter)", fontSize: 13,
                    fontWeight: 600,
                    background: editing ? "#F97316" : "white",
                    color: editing ? "white" : "#374151",
                    padding: "10px 20px", borderRadius: 10,
                    border: editing ? "none" : "1.5px solid #E5E7EB",
                    cursor: "pointer"
                  }}>
                  {loading ? "Saving..." : editing ? "Save Changes" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* STATS ROW */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16, marginBottom: 24
          }}>
            {[
              { label: "Tasks Completed", value: profile.tasksCompleted, icon: "✓", color: "#10B981", bg: "#F0FDF4" },
              { label: "Impact Score", value: profile.impactScore, icon: "★", color: "#8B5CF6", bg: "#F5F3FF" },
              { label: "Day Streak", value: `${profile.streak} days`, icon: "🔥", color: "#EF4444", bg: "#FEF2F2" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", borderRadius: 16,
                padding: 24, border: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", gap: 16
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: s.bg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: s.color
                }}>{s.icon}</div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-playfair)", fontSize: 28,
                    fontWeight: 700, color: "#0F172A"
                  }}>{s.value}</div>
                  <div style={{
                    fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280"
                  }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* DETAILS CARD */}
          <div style={{
            background: "white", borderRadius: 24,
            border: "1px solid #F1F5F9",
            padding: 32, marginBottom: 24
          }}>
            <h2 style={{
              fontFamily: "var(--font-playfair)", fontSize: 20,
              fontWeight: 700, color: "#0F172A", marginBottom: 24
            }}>Personal Details</h2>

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 20, marginBottom: 28
            }}>
              {[
                { label: "Full name", key: "name", disabled: false },
                { label: "City", key: "city", disabled: false },
                { label: "Phone", key: "phone", disabled: false },
                { label: "Email", key: "email", disabled: true },
              ].map(field => (
                <div key={field.key}>
                  <label style={{
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    fontWeight: 500, color: "#6B7280",
                    display: "block", marginBottom: 8
                  }}>{field.label}</label>
                  <input
                    type="text"
                    value={(profile as any)[field.key]}
                    disabled={!editing || field.disabled}
                    onChange={e => setProfile(prev => ({
                      ...prev, [field.key]: e.target.value
                    }))}
                    style={{
                      width: "100%", padding: "12px 16px",
                      fontFamily: "var(--font-inter)", fontSize: 14,
                      border: "1.5px solid",
                      borderColor: editing && !field.disabled ? "#F97316" : "#E5E7EB",
                      borderRadius: 12,
                      background: editing && !field.disabled ? "white" : "#F8FAFC",
                      color: "#0F172A", outline: "none",
                      boxSizing: "border-box",
                      cursor: editing && !field.disabled ? "text" : "default"
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <label style={{
                fontFamily: "var(--font-inter)", fontSize: 12,
                fontWeight: 500, color: "#6B7280",
                display: "block", marginBottom: 12
              }}>Your Skills</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillOptions.map(skill => {
                  const selected = profile.skills.includes(skill);
                  return (
                    <button key={skill}
                      onClick={() => editing && toggleSkill(skill)}
                      style={{
                        fontFamily: "var(--font-inter)", fontSize: 13,
                        padding: "8px 16px", borderRadius: 999,
                        border: selected ? "1.5px solid #F97316" : "1.5px solid #E5E7EB",
                        background: selected ? "#FFF7ED" : "white",
                        color: selected ? "#F97316" : "#6B7280",
                        cursor: editing ? "pointer" : "default",
                        transition: "all 0.15s"
                      }}>{skill}</button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIGN OUT */}
          <div style={{ textAlign: "center" }}>
            <button onClick={handleSignOut} style={{
              fontFamily: "var(--font-inter)", fontSize: 14,
              background: "#FEF2F2", color: "#DC2626",
              padding: "12px 32px", borderRadius: 12,
              border: "1px solid #FECACA", cursor: "pointer",
              fontWeight: 500
            }}>Sign Out</button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}