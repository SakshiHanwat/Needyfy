"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import Sidebar from "../../components/Sidebar";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Toaster } from "react-hot-toast";

interface Need {
  id: string;
  category: string;
  description: string;
  urgencyScore: number;
  status: string;
  city: string;
  createdAt: any;
}

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  food: { bg: "#FFF7ED", text: "#EA580C", dot: "#F97316" },
  medical: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  education: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  shelter: { bg: "#F0FDF4", text: "#16A34A", dot: "#10B981" },
  other: { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
};

export default function Dashboard() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNeeds: 0,
    activeVolunteers: 0,
    tasksDone: 0,
    urgentNeeds: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const q = query(
        collection(db, "needs"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Need[];
      setNeeds(data);

      const allNeeds = await getDocs(collection(db, "needs"));
      const allVolunteers = await getDocs(collection(db, "users"));
      const urgent = allNeeds.docs.filter(d => (d.data().urgencyScore || 0) >= 70).length;
      const done = allNeeds.docs.filter(d => d.data().status === "completed").length;

      setStats({
        totalNeeds: allNeeds.size,
        activeVolunteers: allVolunteers.size,
        tasksDone: done,
        urgentNeeds: urgent,
      });
    } catch (err) {
      console.error("Firebase error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total Needs", value: stats.totalNeeds, change: "from Firebase", color: "#F97316", bg: "#FFF7ED", icon: "◉" },
    { label: "Active Volunteers", value: stats.activeVolunteers, change: "registered users", color: "#10B981", bg: "#F0FDF4", icon: "♟" },
    { label: "Tasks Completed", value: stats.tasksDone, change: "marked done", color: "#8B5CF6", bg: "#F5F3FF", icon: "✓" },
    { label: "Urgent Needs", value: stats.urgentNeeds, change: "score ≥ 70", color: "#EF4444", bg: "#FEF2F2", icon: "!" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Toaster position="top-right" />
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, padding: "32px 40px" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 32
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 32,
              fontWeight: 700, color: "#0F172A", marginBottom: 4
            }}>Good morning, NGO! 👋</h1>
            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280"
            }}>Here's what's happening in your community today.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/dashboard/survey" style={{
              fontFamily: "var(--font-inter)", fontSize: 13,
              fontWeight: 600, background: "#F97316",
              color: "white", padding: "12px 20px",
              borderRadius: 12, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span>⊕</span> Upload Survey
            </Link>
            <Link href="/dashboard/needs" style={{
              fontFamily: "var(--font-inter)", fontSize: 13,
              background: "white", color: "#374151",
              padding: "12px 20px", borderRadius: 12,
              textDecoration: "none", border: "1px solid #E5E7EB",
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span>◉</span> View Heatmap
            </Link>
          </div>
        </div>

        {/* Hero Banner */}
        <div style={{
          position: "relative", borderRadius: 24,
          overflow: "hidden", height: 180, marginBottom: 32
        }}>
          <Image src="/images/dashboard-hero.jpg" alt="Dashboard" fill style={{ objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)"
          }} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", padding: "0 36px"
          }}>
            <div>
              <p style={{
                fontFamily: "var(--font-inter)", fontSize: 12,
                color: "#FB923C", letterSpacing: 2,
                textTransform: "uppercase", marginBottom: 8
              }}>AI-Powered Coordination</p>
              <h2 style={{
                fontFamily: "var(--font-playfair)", fontSize: 28,
                fontWeight: 700, color: "white", marginBottom: 12
              }}>Your community needs you today</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  background: "rgba(249,115,22,0.3)",
                  border: "1px solid rgba(249,115,22,0.5)",
                  borderRadius: 999, padding: "6px 14px"
                }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#FED7AA" }}>
                    {loading ? "..." : `${stats.urgentNeeds} urgent needs pending`}
                  </span>
                </div>
                <div style={{
                  background: "rgba(16,185,129,0.2)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  borderRadius: 999, padding: "6px 14px"
                }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6EE7B7" }}>
                    {loading ? "..." : `${stats.activeVolunteers} volunteers available`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20, marginBottom: 32
        }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              background: "white", borderRadius: 20,
              padding: 24, border: "1px solid #F1F5F9",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: card.bg, display: "flex",
                alignItems: "center", justifyContent: "center", marginBottom: 16
              }}>
                <span style={{ color: card.color, fontSize: 18, fontWeight: 700 }}>{card.icon}</span>
              </div>
              <div style={{
                fontFamily: "var(--font-playfair)", fontSize: 36,
                fontWeight: 700, color: "#0F172A", marginBottom: 4
              }}>
                {loading ? "..." : card.value}
              </div>
              <div style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                color: "#6B7280", marginBottom: 8
              }}>{card.label}</div>
              <div style={{
                fontFamily: "var(--font-inter)", fontSize: 11,
                color: card.color, fontWeight: 500
              }}>{card.change}</div>
            </div>
          ))}
        </div>

        {/* Bottom Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Recent Needs */}
          <div style={{
            background: "white", borderRadius: 20,
            border: "1px solid #F1F5F9", overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #F1F5F9",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h3 style={{
                fontFamily: "var(--font-playfair)", fontSize: 18,
                fontWeight: 700, color: "#0F172A"
              }}>Recent Needs</h3>
              <Link href="/dashboard/needs" style={{
                fontFamily: "var(--font-inter)", fontSize: 12,
                color: "#F97316", textDecoration: "none", fontWeight: 500
              }}>View all →</Link>
            </div>
            <div style={{ padding: "8px 0" }}>
              {loading ? (
                <p style={{
                  fontFamily: "var(--font-inter)", fontSize: 14,
                  color: "#9CA3AF", padding: "24px", textAlign: "center"
                }}>Loading...</p>
              ) : needs.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF"
                  }}>No needs added yet. Upload a survey!</p>
                </div>
              ) : (
                needs.map(need => <NeedRow key={need.id} need={need} />)
              )}
            </div>
          </div>

          {/* Quick Actions + Map */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{
              background: "white", borderRadius: 20,
              border: "1px solid #F1F5F9", padding: 24
            }}>
              <h3 style={{
                fontFamily: "var(--font-playfair)", fontSize: 18,
                fontWeight: 700, color: "#0F172A", marginBottom: 16
              }}>Quick Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Upload paper survey", href: "/dashboard/survey", color: "#F97316", bg: "#FFF7ED", icon: "⊕" },
                  { label: "Add new need manually", href: "/dashboard/needs/add", color: "#8B5CF6", bg: "#F5F3FF", icon: "+" },
                  { label: "Find volunteers nearby", href: "/dashboard/volunteers", color: "#10B981", bg: "#F0FDF4", icon: "◎" },
                  { label: "View urgency heatmap", href: "/dashboard/needs", color: "#EF4444", bg: "#FEF2F2", icon: "◉" },
                ].map(action => (
                  <Link key={action.label} href={action.href} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 12,
                    background: action.bg, textDecoration: "none",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "white", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                    }}>
                      <span style={{ color: action.color, fontSize: 16 }}>{action.icon}</span>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: 13,
                      fontWeight: 500, color: "#374151"
                    }}>{action.label}</span>
                    <span style={{ marginLeft: "auto", color: "#9CA3AF", fontSize: 12 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={{
              borderRadius: 20, overflow: "hidden",
              border: "1px solid #F1F5F9", position: "relative", height: 200
            }}>
              <Image src="/images/india-community.jpg" alt="India community" fill style={{ objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)" }} />
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                justifyContent: "flex-end", padding: 20
              }}>
                <p style={{
                  fontFamily: "var(--font-inter)", fontSize: 11,
                  color: "#FB923C", letterSpacing: 2,
                  textTransform: "uppercase", marginBottom: 4
                }}>Live Heatmap</p>
                <h4 style={{
                  fontFamily: "var(--font-playfair)", fontSize: 20,
                  fontWeight: 700, color: "white", marginBottom: 12
                }}>View needs across India</h4>
                <Link href="/dashboard/needs" style={{
                  fontFamily: "var(--font-inter)", fontSize: 12,
                  fontWeight: 600, background: "#F97316",
                  color: "white", padding: "8px 16px",
                  borderRadius: 999, textDecoration: "none",
                  display: "inline-block", width: "fit-content"
                }}>Open Heatmap →</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NeedRow({ need }: { need: any }) {
  const colors = categoryColors[need.category] || categoryColors.other;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 24px", borderBottom: "1px solid #F8FAFC"
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: colors.dot, flexShrink: 0
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "var(--font-inter)", fontSize: 13,
          color: "#0F172A", fontWeight: 500,
          whiteSpace: "nowrap", overflow: "hidden",
          textOverflow: "ellipsis", marginBottom: 2
        }}>{need.description}</p>
        <p style={{
          fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF"
        }}>{need.city || "Unknown"}</p>
      </div>
      <div style={{
        background: colors.bg, color: colors.text,
        fontFamily: "var(--font-inter)", fontSize: 11,
        fontWeight: 600, padding: "4px 10px",
        borderRadius: 999, whiteSpace: "nowrap"
      }}>
        {(need.urgencyScore || 0) >= 80 ? "🔴 Urgent" :
          (need.urgencyScore || 0) >= 60 ? "🟡 Medium" : "🟢 Low"}
      </div>
    </div>
  );
}