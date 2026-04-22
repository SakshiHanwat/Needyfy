"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { Toaster, toast } from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";

interface Task {
  id: string;
  description: string;
  category: string;
  city: string;
  urgencyScore: number;
  status: "open" | "assigned" | "inprogress" | "completed";
  volunteer?: string;
  createdAt: any;
}

const categoryColors: Record<string, { bg: string; text: string; dot: string; emoji: string }> = {
  food: { bg: "#FFF7ED", text: "#EA580C", dot: "#F97316", emoji: "🍱" },
  medical: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444", emoji: "🏥" },
  education: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B", emoji: "📚" },
  shelter: { bg: "#F0FDF4", text: "#16A34A", dot: "#10B981", emoji: "🏠" },
  other: { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8", emoji: "📌" },
};

const columns = [
  { key: "open", label: "Open", color: "#6B7280", bg: "#F8FAFC" },
  { key: "assigned", label: "Assigned", color: "#F97316", bg: "#FFF7ED" },
  { key: "inprogress", label: "In Progress", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "completed", label: "Completed", color: "#10B981", bg: "#F0FDF4" },
];

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const q = query(collection(db, "needs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "open",
      })) as Task[];
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (taskId: string, newStatus: Task["status"]) => {
    try {
      await updateDoc(doc(db, "needs", taskId), { status: newStatus });
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
      toast.success(`Task moved to ${newStatus}!`);
    } catch (err) {
      toast.error("Could not update task");
    }
  };

  const getTasksByStatus = (status: string) =>
    tasks.filter(t => t.status === status &&
      (filter === "all" || t.category === filter)
    );

  const columnsWithCount = columns.map(col => ({
    ...col,
    count: tasks.filter(t => t.status === col.key).length
  }));

  const formatDate = (ts: any) => {
    if (!ts) return "";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
      if (diff < 60) return `${diff} min ago`;
      if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
      return `${Math.floor(diff / 1440)} days ago`;
    } catch { return ""; }
  };

  return (
    <AuthGuard>
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
              }}>Task Management</h1>
              <p style={{
                fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280"
              }}>
                {loading ? "Loading..." : `${tasks.length} total tasks from Firebase`}
              </p>
            </div>
            <Link href="/dashboard/survey" style={{
              fontFamily: "var(--font-inter)", fontSize: 13,
              fontWeight: 600, background: "#F97316",
              color: "white", padding: "12px 20px",
              borderRadius: 12, textDecoration: "none"
            }}>+ Add New Need</Link>
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", height: 300
            }}>
              <p style={{
                fontFamily: "var(--font-inter)", fontSize: 16, color: "#9CA3AF"
              }}>Loading tasks from Firebase...</p>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16, marginBottom: 28
              }}>
                {columnsWithCount.map(col => (
                  <div key={col.key} style={{
                    background: "white", borderRadius: 16,
                    padding: "16px 20px", border: "1px solid #F1F5F9",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <p style={{
                        fontFamily: "var(--font-inter)", fontSize: 12,
                        color: "#6B7280", marginBottom: 4
                      }}>{col.label}</p>
                      <p style={{
                        fontFamily: "var(--font-playfair)", fontSize: 28,
                        fontWeight: 700, color: "#0F172A"
                      }}>{col.count}</p>
                    </div>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: col.bg, display: "flex",
                      alignItems: "center", justifyContent: "center"
                    }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: col.color
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* No data state */}
              {tasks.length === 0 ? (
                <div style={{
                  background: "white", borderRadius: 20,
                  padding: 60, textAlign: "center",
                  border: "1px solid #F1F5F9"
                }}>
                  <p style={{ fontSize: 40, marginBottom: 16 }}>📋</p>
                  <p style={{
                    fontFamily: "var(--font-playfair)", fontSize: 24,
                    color: "#0F172A", marginBottom: 8
                  }}>No tasks yet!</p>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280",
                    marginBottom: 24
                  }}>Upload a survey to add community needs.</p>
                  <Link href="/dashboard/survey" style={{
                    fontFamily: "var(--font-inter)", fontSize: 13,
                    fontWeight: 600, background: "#F97316",
                    color: "white", padding: "12px 24px",
                    borderRadius: 12, textDecoration: "none"
                  }}>Upload Survey →</Link>
                </div>
              ) : (
                <>
                  {/* Filter */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: 12,
                      color: "#9CA3AF", alignSelf: "center", marginRight: 4
                    }}>Filter:</span>
                    {["all", "food", "medical", "education", "shelter"].map(f => (
                      <button key={f} onClick={() => setFilter(f)} style={{
                        fontFamily: "var(--font-inter)", fontSize: 12,
                        fontWeight: filter === f ? 600 : 400,
                        padding: "6px 14px", border: "none",
                        borderRadius: 999, cursor: "pointer",
                        background: filter === f ? "#F97316" : "#F3F4F6",
                        color: filter === f ? "white" : "#6B7280",
                        textTransform: "capitalize"
                      }}>{f === "all" ? "All" : `${categoryColors[f]?.emoji} ${f}`}</button>
                    ))}
                  </div>

                  {/* Kanban Board */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 20, alignItems: "start"
                  }}>
                    {columnsWithCount.map(col => (
                      <div
                        key={col.key}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          if (dragging) {
                            moveTask(dragging, col.key as Task["status"]);
                            setDragging(null);
                          }
                        }}
                        style={{
                          background: col.bg, borderRadius: 20,
                          border: `1px solid ${col.color}25`,
                          minHeight: 400, padding: 16
                        }}
                      >
                        {/* Column Header */}
                        <div style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 16
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 10, height: 10, borderRadius: "50%",
                              background: col.color
                            }} />
                            <span style={{
                              fontFamily: "var(--font-inter)", fontSize: 13,
                              fontWeight: 600, color: "#0F172A"
                            }}>{col.label}</span>
                          </div>
                          <div style={{
                            background: col.color, color: "white",
                            borderRadius: 999, width: 22, height: 22,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700
                          }}>{col.count}</div>
                        </div>

                        {/* Task Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {getTasksByStatus(col.key).length === 0 ? (
                            <div style={{
                              padding: "24px 16px", textAlign: "center",
                              border: `2px dashed ${col.color}40`, borderRadius: 12
                            }}>
                              <p style={{
                                fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF"
                              }}>No tasks here</p>
                            </div>
                          ) : (
                            getTasksByStatus(col.key).map(task => {
                              const colors = categoryColors[task.category] || categoryColors.other;
                              return (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={() => setDragging(task.id)}
                                  onDragEnd={() => setDragging(null)}
                                  style={{
                                    background: "white", borderRadius: 16,
                                    border: "1px solid #F1F5F9", padding: 16,
                                    cursor: "grab",
                                    opacity: dragging === task.id ? 0.5 : 1,
                                    transition: "all 0.2s",
                                  }}
                                >
                                  <div style={{
                                    height: 3, borderRadius: 999, marginBottom: 12,
                                    background: task.urgencyScore >= 80 ? "#EF4444" :
                                      task.urgencyScore >= 60 ? "#F59E0B" : "#10B981"
                                  }} />
                                  <div style={{
                                    display: "inline-flex", alignItems: "center",
                                    gap: 5, background: colors.bg,
                                    borderRadius: 999, padding: "3px 10px", marginBottom: 10
                                  }}>
                                    <span style={{ fontSize: 10 }}>{colors.emoji}</span>
                                    <span style={{
                                      fontFamily: "var(--font-inter)", fontSize: 10,
                                      fontWeight: 600, color: colors.text,
                                      textTransform: "capitalize"
                                    }}>{task.category}</span>
                                  </div>
                                  <p style={{
                                    fontFamily: "var(--font-inter)", fontSize: 13,
                                    fontWeight: 500, color: "#0F172A",
                                    lineHeight: 1.5, marginBottom: 12
                                  }}>{task.description}</p>
                                  <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    alignItems: "center", marginBottom: task.volunteer ? 10 : 0
                                  }}>
                                    <span style={{
                                      fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF"
                                    }}>📍 {task.city}</span>
                                    <span style={{
                                      fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700,
                                      color: task.urgencyScore >= 80 ? "#EF4444" :
                                        task.urgencyScore >= 60 ? "#F59E0B" : "#10B981"
                                    }}>{task.urgencyScore}</span>
                                  </div>
                                  {task.volunteer && (
                                    <div style={{
                                      display: "flex", alignItems: "center", gap: 8,
                                      padding: "8px 10px", background: "#F8FAFC", borderRadius: 10
                                    }}>
                                      <div style={{
                                        width: 24, height: 24, borderRadius: "50%",
                                        background: "#F97316", display: "flex",
                                        alignItems: "center", justifyContent: "center"
                                      }}>
                                        <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>
                                          {task.volunteer[0]}
                                        </span>
                                      </div>
                                      <span style={{
                                        fontFamily: "var(--font-inter)", fontSize: 11,
                                        color: "#374151", fontWeight: 500
                                      }}>{task.volunteer}</span>
                                    </div>
                                  )}
                                  <p style={{
                                    fontFamily: "var(--font-inter)", fontSize: 10,
                                    color: "#D1D5DB", marginTop: 10
                                  }}>🕐 {formatDate(task.createdAt)}</p>
                                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                                    {col.key !== "open" && (
                                      <button onClick={() => moveTask(task.id, "open")} style={{
                                        flex: 1, padding: "6px",
                                        fontFamily: "var(--font-inter)", fontSize: 10,
                                        background: "#F8FAFC", color: "#6B7280",
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 8, cursor: "pointer"
                                      }}>← Back</button>
                                    )}
                                    {col.key !== "completed" && (
                                      <button
                                        onClick={() => moveTask(task.id,
                                          col.key === "open" ? "assigned" :
                                            col.key === "assigned" ? "inprogress" : "completed"
                                        )}
                                        style={{
                                          flex: 2, padding: "6px",
                                          fontFamily: "var(--font-inter)", fontSize: 10,
                                          fontWeight: 600,
                                          background: col.key === "inprogress" ? "#10B981" : "#F97316",
                                          color: "white", border: "none",
                                          borderRadius: 8, cursor: "pointer"
                                        }}>
                                        {col.key === "open" ? "Assign →" :
                                          col.key === "assigned" ? "Start →" : "Complete ✓"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}