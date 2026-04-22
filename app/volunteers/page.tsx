"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import AuthGuard from "@/components/AuthGuard";

interface Task {
  id: string;
  description: string;
  category: string;
  city: string;
  urgencyScore: number;
  status: string;
  distance?: string;
}

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  food: { bg: "#FFF7ED", text: "#EA580C", dot: "#F97316" },
  medical: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  education: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  shelter: { bg: "#F0FDF4", text: "#16A34A", dot: "#10B981" },
  other: { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
};

export default function VolunteerDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "my" | "done">("available");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    hoursVolunteered: 0,
    impactScore: 0,
    streak: 0,
  });
  const [userName, setUserName] = useState("Volunteer");

  useEffect(() => {
    fetchTasks();
    const user = auth.currentUser;
    if (user?.displayName) setUserName(user.displayName);
    else if (user?.email) setUserName(user.email.split("@")[0]);
  }, []);

  const fetchTasks = async () => {
    try {
      const snapshot = await getDocs(collection(db, "needs"));
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        status: d.data().status || "open",
      })) as Task[];
      setTasks(data);
      const completed = data.filter(t => t.status === "completed").length;
      setStats({
        tasksCompleted: completed,
        hoursVolunteered: completed * 3,
        impactScore: completed * 70,
        streak: Math.min(completed, 7),
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "needs", taskId), { status: "assigned" });
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: "assigned" } : t
      ));
      toast.success("Task accepted! NGO will contact you soon.");
    } catch {
      toast.error("Could not accept task");
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "needs", taskId), { status: "completed" });
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: "completed" } : t
      ));
      const newCompleted = stats.tasksCompleted + 1;
      setStats({
        tasksCompleted: newCompleted,
        hoursVolunteered: newCompleted * 3,
        impactScore: newCompleted * 70,
        streak: Math.min(newCompleted, 7),
      });
      toast.success("Task marked complete! Great work!");
    } catch {
      toast.error("Could not complete task");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully!");
      router.push("/login");
    } catch {
      toast.error("Could not sign out");
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === "available") return t.status === "open";
    if (activeTab === "my") return t.status === "assigned";
    return t.status === "completed";
  });

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Toaster position="top-right" />

        {/* TOP NAV */}
        <nav style={{
          background: "white", borderBottom: "1px solid #F1F5F9",
          padding: "0 40px", height: 64,
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

          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Find Tasks", "My Impact", "Leaderboard"].map(item => (
              <a key={item} href="#" style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                color: "#6B7280", textDecoration: "none"
              }}>{item}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notification */}
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#FFF7ED", border: "1px solid #FED7AA",
              display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer",
              position: "relative"
            }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              {tasks.filter(t => t.status === "open").length > 0 && (
                <div style={{
                  position: "absolute", top: 6, right: 6,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#EF4444"
                }} />
              )}
            </div>

            {/* Sign Out */}
            <button onClick={handleSignOut} style={{
              fontFamily: "var(--font-inter)", fontSize: 12,
              fontWeight: 600, background: "#FEF2F2",
              color: "#DC2626", padding: "8px 16px",
              borderRadius: 10, border: "1px solid #FECACA",
              cursor: "pointer"
            }}>Sign Out</button>

            {/* Profile Avatar — click pe profile page */}
            <Link href="/volunteers/profile" style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#F97316", display: "flex",
              alignItems: "center", justifyContent: "center",
              textDecoration: "none"
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                {userName[0]?.toUpperCase() || "V"}
              </span>
            </Link>
          </div>
        </nav>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

          {/* HERO */}
          <div style={{
            position: "relative", borderRadius: 24,
            overflow: "hidden", height: 220, marginBottom: 32
          }}>
            <Image
              src="/images/vol-hero.jpg"
              alt="Volunteer"
              fill
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "top" }}
              priority
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.3) 70%, transparent 100%)"
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", padding: "0 40px"
            }}>
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(249,115,22,0.25)",
                  border: "1px solid rgba(249,115,22,0.4)",
                  borderRadius: 999, padding: "5px 14px", marginBottom: 12
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#FB923C"
                  }} />
                  <span style={{
                    fontFamily: "var(--font-inter)", fontSize: 12, color: "#FED7AA"
                  }}>Volunteer Dashboard</span>
                </div>
                <h1 style={{
                  fontFamily: "var(--font-playfair)", fontSize: 36,
                  fontWeight: 700, color: "white", marginBottom: 8
                }}>Welcome back, {userName}! 🦸</h1>
                <p style={{
                  fontFamily: "var(--font-inter)", fontSize: 14,
                  color: "rgba(255,255,255,0.75)"
                }}>
                  {loading ? "Loading tasks..." :
                    `${tasks.filter(t => t.status === "open").length} tasks available near you`}
                </p>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="stats-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16, marginBottom: 32
          }}>
            {[
              { label: "Tasks Done", value: stats.tasksCompleted, icon: "✓", color: "#10B981", bg: "#F0FDF4" },
              { label: "Hours Given", value: `${stats.hoursVolunteered}h`, icon: "◷", color: "#F97316", bg: "#FFF7ED" },
              { label: "Impact Score", value: stats.impactScore, icon: "★", color: "#8B5CF6", bg: "#F5F3FF" },
              { label: "Day Streak", value: `${stats.streak} days`, icon: "🔥", color: "#EF4444", bg: "#FEF2F2" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "white", borderRadius: 16,
                padding: "20px 24px", border: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", gap: 16
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: stat.bg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: 20, color: stat.color }}>{stat.icon}</span>
                </div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-playfair)", fontSize: 24,
                    fontWeight: 700, color: "#0F172A"
                  }}>{loading ? "..." : stat.value}</div>
                  <div style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 12, color: "#6B7280"
                  }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="vol-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 24
          }}>

            {/* LEFT — Tasks */}
            <div>
              {/* Tabs */}
              <div className="tab-scroll" style={{
                display: "flex", gap: 4,
                background: "white", padding: 6,
                borderRadius: 16, border: "1px solid #F1F5F9",
                marginBottom: 20, width: "fit-content"
              }}>
                {[
                  { key: "available", label: "Available Tasks" },
                  { key: "my", label: "My Tasks" },
                  { key: "done", label: "Completed" },
                ].map(tab => (
                  <button key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      fontFamily: "var(--font-inter)", fontSize: 13,
                      fontWeight: activeTab === tab.key ? 600 : 400,
                      padding: "10px 20px", borderRadius: 12,
                      border: "none", cursor: "pointer",
                      background: activeTab === tab.key ? "#F97316" : "transparent",
                      color: activeTab === tab.key ? "white" : "#6B7280",
                      transition: "all 0.2s"
                    }}>{tab.label}</button>
                ))}
              </div>

              {/* Task Cards */}
              {loading ? (
                <div style={{
                  background: "white", borderRadius: 20,
                  padding: 40, textAlign: "center",
                  border: "1px solid #F1F5F9"
                }}>
                  <p style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 14, color: "#9CA3AF"
                  }}>Loading tasks...</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {filteredTasks.length === 0 ? (
                    <div style={{
                      background: "white", borderRadius: 20,
                      padding: 40, textAlign: "center",
                      border: "1px solid #F1F5F9"
                    }}>
                      <p style={{ fontSize: 32, marginBottom: 8 }}>
                        {activeTab === "available" ? "🎉" :
                          activeTab === "my" ? "📋" : "✅"}
                      </p>
                      <p style={{
                        fontFamily: "var(--font-playfair)", fontSize: 20,
                        color: "#0F172A", marginBottom: 8
                      }}>
                        {activeTab === "available" ? "No tasks available!" :
                          activeTab === "my" ? "No tasks accepted yet." :
                            "No completed tasks yet."}
                      </p>
                      <p style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14, color: "#6B7280"
                      }}>
                        {activeTab === "available" ?
                          "Check back soon — NGOs are adding needs." :
                          activeTab === "my" ?
                            "Go to Available Tasks to accept one." :
                            "Complete tasks to see history here."}
                      </p>
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const colors = categoryColors[task.category] || categoryColors.other;
                      return (
                        <div key={task.id} style={{
                          background: "white", borderRadius: 20,
                          border: "1px solid #F1F5F9", overflow: "hidden"
                        }}>
                          <div style={{
                            height: 4,
                            background: task.urgencyScore >= 80 ? "#EF4444" :
                              task.urgencyScore >= 60 ? "#F59E0B" : "#10B981"
                          }} />
                          <div style={{ padding: 24 }}>
                            <div style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "flex-start", marginBottom: 16
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  display: "inline-flex", alignItems: "center",
                                  gap: 6, background: colors.bg,
                                  borderRadius: 999, padding: "4px 12px",
                                  marginBottom: 10
                                }}>
                                  <div style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: colors.dot
                                  }} />
                                  <span style={{
                                    fontFamily: "var(--font-inter)", fontSize: 11,
                                    fontWeight: 600, color: colors.text,
                                    textTransform: "capitalize"
                                  }}>{task.category}</span>
                                </div>
                                <h3 style={{
                                  fontFamily: "var(--font-inter)", fontSize: 15,
                                  fontWeight: 600, color: "#0F172A", lineHeight: 1.5
                                }}>{task.description}</h3>
                              </div>
                              <div style={{
                                width: 52, height: 52, borderRadius: "50%",
                                background: task.urgencyScore >= 80 ? "#FEF2F2" : "#FFFBEB",
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                flexShrink: 0, marginLeft: 16
                              }}>
                                <span style={{
                                  fontFamily: "var(--font-playfair)",
                                  fontSize: 16, fontWeight: 700,
                                  color: task.urgencyScore >= 80 ? "#EF4444" : "#F59E0B"
                                }}>{task.urgencyScore}</span>
                                <span style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 9, color: "#9CA3AF"
                                }}>urgency</span>
                              </div>
                            </div>

                            <div style={{
                              display: "flex", gap: 16, marginBottom: 20
                            }}>
                              <span style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 12, color: "#6B7280"
                              }}>📍 {task.city}</span>
                            </div>

                            {task.status === "open" && (
                              <div style={{ display: "flex", gap: 10 }}>
                                <button
                                  onClick={() => handleAccept(task.id)}
                                  style={{
                                    flex: 1, padding: "12px",
                                    fontFamily: "var(--font-inter)", fontSize: 13,
                                    fontWeight: 600, background: "#F97316",
                                    color: "white", border: "none",
                                    borderRadius: 12, cursor: "pointer"
                                  }}>Accept Task</button>
                                <button style={{
                                  padding: "12px 20px",
                                  fontFamily: "var(--font-inter)", fontSize: 13,
                                  background: "white", color: "#6B7280",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: 12, cursor: "pointer"
                                }}>Skip</button>
                              </div>
                            )}

                            {task.status === "assigned" && (
                              <button
                                onClick={() => handleComplete(task.id)}
                                style={{
                                  width: "100%", padding: "12px",
                                  fontFamily: "var(--font-inter)", fontSize: 13,
                                  fontWeight: 600, background: "#10B981",
                                  color: "white", border: "none",
                                  borderRadius: 12, cursor: "pointer"
                                }}>Mark Complete ✓</button>
                            )}

                            {task.status === "completed" && (
                              <div style={{
                                padding: "12px 16px", background: "#F0FDF4",
                                borderRadius: 12, display: "flex",
                                alignItems: "center", gap: 8
                              }}>
                                <span>✅</span>
                                <span style={{
                                  fontFamily: "var(--font-inter)", fontSize: 13,
                                  fontWeight: 600, color: "#16A34A"
                                }}>Completed — Great work!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Profile Card */}
              <div style={{
                background: "white", borderRadius: 20,
                border: "1px solid #F1F5F9", overflow: "hidden"
              }}>
                <div style={{ position: "relative", height: 80 }}>
                  <Image
                    src="/images/auth-bg.jpg"
                    alt="bg"
                    fill
                    sizes="340px"
                    style={{ objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(249,115,22,0.7)"
                  }} />
                </div>
                <div style={{ padding: "0 20px 20px", marginTop: -24 }}>
                  <Link href="/volunteers/profile" style={{ textDecoration: "none" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "#0F172A", border: "3px solid white",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", marginBottom: 12,
                      cursor: "pointer"
                    }}>
                      <span style={{
                        color: "white", fontWeight: 700, fontSize: 18
                      }}>
                        {userName[0]?.toUpperCase() || "V"}
                      </span>
                    </div>
                  </Link>
                  <h3 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 18,
                    fontWeight: 700, color: "#0F172A", marginBottom: 2
                  }}>{userName}</h3>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    color: "#6B7280", marginBottom: 12
                  }}>Volunteer</p>
                  <Link href="/volunteers/profile" style={{
                    display: "block", textAlign: "center",
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    fontWeight: 500, background: "#FFF7ED",
                    color: "#F97316", padding: "8px",
                    borderRadius: 8, textDecoration: "none",
                    border: "1px solid #FED7AA", marginBottom: 8
                  }}>View Profile →</Link>
                  <button onClick={handleSignOut} style={{
                    width: "100%", padding: "10px",
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    fontWeight: 600, background: "#FEF2F2",
                    color: "#DC2626", border: "1px solid #FECACA",
                    borderRadius: 10, cursor: "pointer"
                  }}>Sign Out</button>
                </div>
              </div>

              {/* Impact Card */}
              <div style={{
                background: "#0F172A", borderRadius: 20, padding: 24
              }}>
                <p style={{
                  fontFamily: "var(--font-inter)", fontSize: 11,
                  color: "#F97316", letterSpacing: 2,
                  textTransform: "uppercase", marginBottom: 8
                }}>Your Impact</p>
                <div style={{
                  fontFamily: "var(--font-playfair)", fontSize: 42,
                  fontWeight: 700, color: "white", marginBottom: 4
                }}>{loading ? "..." : stats.impactScore}</div>
                <p style={{
                  fontFamily: "var(--font-inter)", fontSize: 13,
                  color: "#64748B", marginBottom: 16
                }}>Impact points earned</p>
                <p style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 12, color: "#94A3B8"
                }}>
                  {stats.tasksCompleted === 0
                    ? "Accept and complete tasks to earn impact points!"
                    : `${stats.tasksCompleted} tasks completed · ${stats.hoursVolunteered} hours given`}
                </p>
              </div>

              {/* Nearby Map */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                position: "relative", height: 180
              }}>
                <Image
                  src="/images/india-community.jpg"
                  alt="map"
                  fill
                  sizes="340px"
                  style={{ objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(15,23,42,0.65)"
                }} />
                <div style={{
                  position: "absolute", inset: 0, padding: 20,
                  display: "flex", flexDirection: "column",
                  justifyContent: "flex-end"
                }}>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 11,
                    color: "#FB923C", letterSpacing: 2,
                    textTransform: "uppercase", marginBottom: 4
                  }}>Available</p>
                  <h4 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 18,
                    fontWeight: 700, color: "white", marginBottom: 10
                  }}>
                    {loading ? "..." :
                      `${tasks.filter(t => t.status === "open").length} needs open`}
                  </h4>
                  <Link href="/volunteers/needs" style={{
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    fontWeight: 600, background: "#F97316",
                    color: "white", padding: "8px 16px",
                    borderRadius: 999, textDecoration: "none",
                    display: "inline-block", width: "fit-content"
                  }}>View on map →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}