"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Need {
  id: string;
  category: string;
  urgencyScore: number;
  status: string;
  peopleAffected: number;
  createdAt: any;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  skills: string[];
  tasksCompleted: number;
  city: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [needsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "needs")),
        getDocs(collection(db, "users")),
      ]);

      const needsData = needsSnap.docs.map(d => ({
        id: d.id, ...d.data()
      })) as Need[];

      const volsData = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => !u.role || u.role === "volunteer") as Volunteer[];

      setNeeds(needsData);
      setVolunteers(volsData);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real computed stats
  const totalNeeds = needs.length;
  const resolved = needs.filter(n => n.status === "completed").length;
  const totalVolunteers = volunteers.length;
  const totalPeople = needs.reduce((sum, n) => sum + (n.peopleAffected || 0), 0);
  const resolutionRate = totalNeeds > 0 ? Math.round((resolved / totalNeeds) * 100) : 0;

  // Category breakdown from real data
  const categories = ["food", "medical", "education", "shelter", "other"];
  const categoryConfig: Record<string, { label: string; color: string; emoji: string }> = {
    food:      { label: "Food & Nutrition", color: "#F97316", emoji: "🍱" },
    medical:   { label: "Medical Aid",      color: "#EF4444", emoji: "🏥" },
    education: { label: "Education",        color: "#F59E0B", emoji: "📚" },
    shelter:   { label: "Shelter",          color: "#10B981", emoji: "🏠" },
    other:     { label: "Other",            color: "#6B7280", emoji: "📌" },
  };

  const categoryData = categories.map(cat => {
    const count = needs.filter(n => n.category === cat).length;
    const pct = totalNeeds > 0 ? Math.round((count / totalNeeds) * 100) : 0;
    return { ...categoryConfig[cat], key: cat, count, pct };
  }).filter(c => c.count > 0);

  // Weekly data from real createdAt timestamps
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const weeklyData = days.map((day, i) => {
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() - (today.getDay() - i + 7) % 7);
    const dayNeeds = needs.filter(n => {
      if (!n.createdAt) return false;
      try {
        const d = n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
        return d.toDateString() === targetDay.toDateString();
      } catch { return false; }
    });
    return {
      day,
      needs: dayNeeds.length,
      resolved: dayNeeds.filter(n => n.status === "completed").length,
    };
  });

  const maxNeeds = Math.max(...weeklyData.map(d => d.needs), 1);

  // Top volunteers from real data
  const topVolunteers = [...volunteers]
    .sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
        <Sidebar />
        <main style={{ marginLeft: 240, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📊</p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, color: "#9CA3AF" }}>
              Loading analytics from Firebase...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1 }}>

        {/* HEADER */}
        <div style={{
          padding: "24px 32px", background: "white",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 28,
              fontWeight: 700, color: "#0F172A", marginBottom: 4
            }}>Analytics</h1>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>
              Real-time impact overview from Firebase
            </p>
          </div>
          <button
            onClick={fetchData}
            style={{
              fontFamily: "var(--font-inter)", fontSize: 12,
              fontWeight: 600, background: "#F8FAFC",
              color: "#6B7280", padding: "8px 16px",
              borderRadius: 10, border: "1px solid #E5E7EB",
              cursor: "pointer"
            }}>🔄 Refresh</button>
        </div>

        <div style={{ padding: 32 }}>

          {/* TOP STATS */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16, marginBottom: 28
          }}>
            {[
              { label: "Total needs", value: totalNeeds, icon: "📍", color: "#F97316", bg: "#FFF7ED", sub: "from Firebase" },
              { label: "Resolved", value: resolved, icon: "✓", color: "#10B981", bg: "#F0FDF4", sub: `${resolutionRate}% resolution rate` },
              { label: "Volunteers", value: totalVolunteers, icon: "👥", color: "#8B5CF6", bg: "#F5F3FF", sub: "registered users" },
              { label: "People impacted", value: totalPeople, icon: "❤️", color: "#EF4444", bg: "#FEF2F2", sub: "total affected" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", borderRadius: 16,
                padding: "20px 24px", border: "1px solid #F1F5F9"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: s.bg, display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 18
                  }}>{s.icon}</div>
                </div>
                <div style={{
                  fontFamily: "var(--font-playfair)", fontSize: 32,
                  fontWeight: 700, color: "#0F172A", marginBottom: 4
                }}>{s.value}</div>
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: s.color, fontWeight: 500 }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* No data state */}
          {totalNeeds === 0 ? (
            <div style={{
              background: "white", borderRadius: 20, padding: 60,
              textAlign: "center", border: "1px solid #F1F5F9", marginBottom: 20
            }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>📊</p>
              <p style={{
                fontFamily: "var(--font-playfair)", fontSize: 24,
                color: "#0F172A", marginBottom: 8
              }}>No data yet!</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
                Upload surveys to see analytics here.
              </p>
            </div>
          ) : (
            <>
              {/* MIDDLE ROW */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 340px",
                gap: 20, marginBottom: 20
              }}>

                {/* BAR CHART */}
                <div style={{
                  background: "white", borderRadius: 20,
                  border: "1px solid #F1F5F9", padding: 28
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 24
                  }}>
                    <div>
                      <h2 style={{
                        fontFamily: "var(--font-playfair)", fontSize: 18,
                        fontWeight: 700, color: "#0F172A", marginBottom: 2
                      }}>Weekly activity</h2>
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF" }}>
                        Needs reported vs resolved this week
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[{ label: "Needs", color: "#F97316" }, { label: "Resolved", color: "#10B981" }].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#6B7280" }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
                    {weeklyData.map(d => (
                      <div key={d.day} style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end"
                      }}>
                        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%" }}>
                          <div style={{
                            flex: 1, borderRadius: "4px 4px 0 0",
                            background: d.needs > 0 ? "#F97316" : "#F3F4F6",
                            height: `${Math.max((d.needs / maxNeeds) * 140, d.needs > 0 ? 8 : 4)}px`,
                          }} />
                          <div style={{
                            flex: 1, borderRadius: "4px 4px 0 0",
                            background: d.resolved > 0 ? "#10B981" : "#F3F4F6",
                            height: `${Math.max((d.resolved / maxNeeds) * 140, d.resolved > 0 ? 8 : 4)}px`,
                          }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>{d.day}</span>
                      </div>
                    ))}
                  </div>
                  {weeklyData.every(d => d.needs === 0) && (
                    <p style={{
                      fontFamily: "var(--font-inter)", fontSize: 12,
                      color: "#9CA3AF", textAlign: "center", marginTop: 8
                    }}>No activity this week — older data may exist</p>
                  )}
                </div>

                {/* CATEGORY BREAKDOWN */}
                <div style={{
                  background: "white", borderRadius: 20,
                  border: "1px solid #F1F5F9", padding: 28
                }}>
                  <h2 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 18,
                    fontWeight: 700, color: "#0F172A", marginBottom: 4
                  }}>By category</h2>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF", marginBottom: 24 }}>
                    Real need distribution
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {categoryData.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                        No category data yet
                      </p>
                    ) : (
                      categoryData.map(cat => (
                        <div key={cat.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{
                              fontFamily: "var(--font-inter)", fontSize: 13,
                              color: "#374151", fontWeight: 500
                            }}>{cat.emoji} {cat.label}</span>
                            <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                              {cat.count} needs ({cat.pct}%)
                            </span>
                          </div>
                          <div style={{ height: 8, background: "#F1F5F9", borderRadius: 999 }}>
                            <div style={{
                              height: "100%", width: `${cat.pct}%`,
                              background: cat.color, borderRadius: 999,
                            }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Resolution rate */}
                  <div style={{
                    marginTop: 28, padding: 16,
                    background: "#F0FDF4", borderRadius: 14
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 8
                    }}>
                      <span style={{
                        fontFamily: "var(--font-inter)", fontSize: 13,
                        color: "#16A34A", fontWeight: 600
                      }}>Resolution rate</span>
                      <span style={{
                        fontFamily: "var(--font-playfair)", fontSize: 22,
                        fontWeight: 700, color: "#16A34A"
                      }}>{resolutionRate}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(16,185,129,0.2)", borderRadius: 999 }}>
                      <div style={{
                        height: "100%", width: `${resolutionRate}%`,
                        background: "#10B981", borderRadius: 999
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP VOLUNTEERS */}
              <div style={{
                background: "white", borderRadius: 20,
                border: "1px solid #F1F5F9", padding: 28
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 24
                }}>
                  <div>
                    <h2 style={{
                      fontFamily: "var(--font-playfair)", fontSize: 18,
                      fontWeight: 700, color: "#0F172A", marginBottom: 2
                    }}>Top volunteers</h2>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF" }}>
                      Ranked by tasks completed — real Firebase data
                    </p>
                  </div>
                </div>

                {topVolunteers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                      No volunteers registered yet
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {topVolunteers.map((vol, i) => (
                      <div key={vol.id} style={{
                        display: "flex", alignItems: "center", gap: 16,
                        padding: "14px 16px", borderRadius: 14,
                        background: i === 0 ? "#FFFBEB" : "transparent",
                        border: i === 0 ? "1px solid #FDE68A" : "1px solid transparent",
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7C2F" : "#F1F5F9",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{
                            fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 700,
                            color: i < 3 ? "white" : "#6B7280"
                          }}>#{i + 1}</span>
                        </div>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                          background: "#F97316", display: "flex",
                          alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                            {(vol.name || vol.email || "V")[0].toUpperCase()}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontFamily: "var(--font-inter)", fontSize: 14,
                            fontWeight: 600, color: "#0F172A", marginBottom: 4
                          }}>{vol.name || vol.email?.split("@")[0] || "Volunteer"}</p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {(vol.skills || []).slice(0, 3).map(s => (
                              <span key={s} style={{
                                fontFamily: "var(--font-inter)", fontSize: 10,
                                background: "#F8FAFC", color: "#6B7280",
                                padding: "2px 8px", borderRadius: 999,
                                border: "1px solid #E5E7EB"
                              }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "center", minWidth: 60 }}>
                          <div style={{
                            fontFamily: "var(--font-playfair)", fontSize: 20,
                            fontWeight: 700, color: "#0F172A"
                          }}>{vol.tasksCompleted || 0}</div>
                          <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>tasks</div>
                        </div>
                        <div style={{
                          textAlign: "center", minWidth: 70,
                          background: "#FFF7ED", borderRadius: 10, padding: "8px 12px"
                        }}>
                          <div style={{
                            fontFamily: "var(--font-playfair)", fontSize: 18,
                            fontWeight: 700, color: "#F97316"
                          }}>{(vol.tasksCompleted || 0) * 28}</div>
                          <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#EA580C" }}>points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}