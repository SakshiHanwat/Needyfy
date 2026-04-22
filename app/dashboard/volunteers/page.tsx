"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Toaster, toast } from "react-hot-toast";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  city: string;
  phone?: string;
  skills: string[];
  tasksCompleted: number;
  status: string;
  createdAt?: any;
  role?: string;
}

interface Need {
  id: string;
  description: string;
  category: string;
  status: string;
}

const skillColors: Record<string, { bg: string; text: string }> = {
  Medical:      { bg: "#FEF2F2", text: "#DC2626" },
  Teaching:     { bg: "#FFFBEB", text: "#D97706" },
  Driving:      { bg: "#EFF6FF", text: "#2563EB" },
  Counseling:   { bg: "#F5F3FF", text: "#7C3AED" },
  Cooking:      { bg: "#FFF7ED", text: "#EA580C" },
  Construction: { bg: "#F0FDF4", text: "#16A34A" },
  "IT Support": { bg: "#F0F9FF", text: "#0284C7" },
  "General Help": { bg: "#F8FAFC", text: "#475569" },
};

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [search, setSearch] = useState("");
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedVol, setSelectedVol] = useState<Volunteer | null>(null);
  const [assigningTask, setAssigningTask] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch volunteers (users with role=volunteer)
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        skills: d.data().skills || [],
        tasksCompleted: d.data().tasksCompleted || 0,
        status: d.data().status || "active",
      })) as Volunteer[];

      // Show all users as volunteers if no role field
      const vols = allUsers.filter(u => !u.role || u.role === "volunteer");
      setVolunteers(vols);

      // Fetch open needs for assignment
      const needsSnap = await getDocs(collection(db, "needs"));
      const openNeeds = needsSnap.docs
        .filter(d => d.data().status === "open")
        .map(d => ({ id: d.id, ...d.data() })) as Need[];
      setNeeds(openNeeds);

    } catch (err) {
      console.error("Error fetching:", err);
      toast.error("Could not load volunteers");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (volId: string, volName: string, needId: string) => {
    setAssigningTask(true);
    try {
      await updateDoc(doc(db, "needs", needId), {
        status: "assigned",
        volunteer: volName,
        assignedTo: volId,
      });
      toast.success(`Task assigned to ${volName}!`);
      // Remove from open needs
      setNeeds(prev => prev.filter(n => n.id !== needId));
      setSelectedVol(null);
    } catch {
      toast.error("Could not assign task");
    } finally {
      setAssigningTask(false);
    }
  };

  const allSkills = ["all", "Medical", "Teaching", "Driving", "Counseling", "Cooking", "Construction", "IT Support", "General Help"];

  const filtered = volunteers.filter(v => {
    const matchSearch = (v.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(search.toLowerCase());
    const matchSkill = filterSkill === "all" || (v.skills || []).includes(filterSkill);
    const matchStatus = filterStatus === "all" || v.status === filterStatus;
    return matchSearch && matchSkill && matchStatus;
  });

  const stats = {
    total: volunteers.length,
    active: volunteers.filter(v => v.status === "active").length,
    totalTasks: volunteers.reduce((sum, v) => sum + (v.tasksCompleted || 0), 0),
    cities: [...new Set(volunteers.map(v => v.city).filter(Boolean))].length,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Toaster position="top-right" />
      <Sidebar />

      {/* DETAIL MODAL */}
      {selectedVol && (
        <div
          onClick={() => setSelectedVol(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.6)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center",
            padding: 24
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 24,
              width: "100%", maxWidth: 520,
              maxHeight: "85vh", overflow: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)"
            }}>

            {/* Modal Header */}
            <div style={{
              padding: "24px 28px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h2 style={{
                fontFamily: "var(--font-playfair)", fontSize: 22,
                fontWeight: 700, color: "#0F172A"
              }}>Volunteer Details</h2>
              <button
                onClick={() => setSelectedVol(null)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#F8FAFC", border: "1px solid #E5E7EB",
                  cursor: "pointer", fontSize: 16, color: "#6B7280"
                }}>✕</button>
            </div>

            <div style={{ padding: 28 }}>
              {/* Profile */}
              <div style={{
                display: "flex", alignItems: "center",
                gap: 16, marginBottom: 24
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "#F97316", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 24 }}>
                    {(selectedVol.name || "V")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 20,
                    fontWeight: 700, color: "#0F172A", marginBottom: 4
                  }}>{selectedVol.name || "Volunteer"}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: selectedVol.status === "active" ? "#10B981" : "#9CA3AF"
                    }} />
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: 12,
                      color: selectedVol.status === "active" ? "#16A34A" : "#6B7280",
                      textTransform: "capitalize"
                    }}>{selectedVol.status}</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{
                background: "#F8FAFC", borderRadius: 16,
                padding: 20, marginBottom: 20
              }}>
                {[
                  { label: "📧 Email", value: selectedVol.email || "Not provided" },
                  { label: "📍 City", value: selectedVol.city || "Not provided" },
                  { label: "📱 Phone", value: selectedVol.phone || "Not provided" },
                  { label: "✅ Tasks Done", value: String(selectedVol.tasksCompleted || 0) },
                  { label: "⭐ Impact Points", value: `${(selectedVol.tasksCompleted || 0) * 28} pts` },
                ].map(item => (
                  <div key={item.label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid #F1F5F9"
                  }}>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>
                      {item.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div style={{ marginBottom: 24 }}>
                <p style={{
                  fontFamily: "var(--font-inter)", fontSize: 12,
                  color: "#9CA3AF", marginBottom: 10
                }}>SKILLS</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(selectedVol.skills || []).length === 0 ? (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#9CA3AF" }}>
                      No skills listed
                    </span>
                  ) : (
                    (selectedVol.skills || []).map(skill => {
                      const colors = skillColors[skill] || { bg: "#F8FAFC", text: "#475569" };
                      return (
                        <span key={skill} style={{
                          fontFamily: "var(--font-inter)", fontSize: 12,
                          fontWeight: 500, background: colors.bg,
                          color: colors.text, padding: "6px 14px", borderRadius: 999
                        }}>{skill}</span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Assign Task */}
              {needs.length > 0 && (
                <div>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    color: "#9CA3AF", marginBottom: 10
                  }}>ASSIGN AN OPEN TASK</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {needs.slice(0, 4).map(need => (
                      <div key={need.id} style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px", background: "#F8FAFC",
                        borderRadius: 12, border: "1px solid #F1F5F9"
                      }}>
                        <p style={{
                          fontFamily: "var(--font-inter)", fontSize: 12,
                          color: "#374151", flex: 1, marginRight: 12,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>{need.description}</p>
                        <button
                          onClick={() => handleAssignTask(selectedVol.id, selectedVol.name, need.id)}
                          disabled={assigningTask}
                          style={{
                            fontFamily: "var(--font-inter)", fontSize: 11,
                            fontWeight: 600, background: "#F97316",
                            color: "white", padding: "6px 14px",
                            border: "none", borderRadius: 8,
                            cursor: assigningTask ? "not-allowed" : "pointer",
                            opacity: assigningTask ? 0.6 : 1, flexShrink: 0
                          }}>Assign</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {needs.length === 0 && (
                <div style={{
                  padding: "16px", background: "#F0FDF4",
                  borderRadius: 12, textAlign: "center"
                }}>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#16A34A" }}>
                    ✅ No open tasks to assign right now!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: 240, flex: 1 }}>

        {/* HEADER */}
        <div style={{
          padding: "24px 32px", background: "white",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 28,
              fontWeight: 700, color: "#0F172A", marginBottom: 4
            }}>Volunteers</h1>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>
              {loading ? "Loading..." : `${stats.active} active volunteers across ${stats.cities} cities`}
            </p>
          </div>
        </div>

        <div style={{ padding: 32 }}>

          {/* STATS ROW */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16, marginBottom: 28
          }}>
            {[
              { label: "Total volunteers", value: stats.total, icon: "👥", color: "#F97316", bg: "#FFF7ED" },
              { label: "Active now", value: stats.active, icon: "✓", color: "#10B981", bg: "#F0FDF4" },
              { label: "Tasks completed", value: stats.totalTasks, icon: "★", color: "#8B5CF6", bg: "#F5F3FF" },
              { label: "Cities covered", value: stats.cities, icon: "📍", color: "#3B82F6", bg: "#EFF6FF" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", borderRadius: 16,
                padding: "20px 24px", border: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", gap: 16
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: s.bg, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-playfair)", fontSize: 26,
                    fontWeight: 700, color: "#0F172A"
                  }}>{loading ? "..." : s.value}</div>
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280" }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FILTERS */}
          <div style={{
            background: "white", borderRadius: 16,
            padding: "16px 20px", border: "1px solid #F1F5F9",
            marginBottom: 20, display: "flex", gap: 12,
            alignItems: "center", flexWrap: "wrap"
          }}>
            <input
              type="text"
              placeholder="Search by name, email or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                padding: "9px 16px", borderRadius: 10,
                border: "1.5px solid #E5E7EB", outline: "none",
                width: 240, color: "#0F172A"
              }}
              onFocus={e => e.target.style.borderColor = "#F97316"}
              onBlur={e => e.target.style.borderColor = "#E5E7EB"}
            />
            <select
              value={filterSkill}
              onChange={e => setFilterSkill(e.target.value)}
              style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                padding: "9px 16px", borderRadius: 10,
                border: "1.5px solid #E5E7EB", outline: "none",
                background: "white", color: "#374151", cursor: "pointer"
              }}>
              {allSkills.map(s => (
                <option key={s} value={s}>{s === "all" ? "All skills" : s}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "active", "inactive"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 500,
                  padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                  background: filterStatus === s ? "#F97316" : "#F8FAFC",
                  color: filterStatus === s ? "white" : "#6B7280",
                  border: filterStatus === s ? "none" : "1px solid #E5E7EB",
                  textTransform: "capitalize"
                }}>{s}</button>
              ))}
            </div>
            <span style={{
              fontFamily: "var(--font-inter)", fontSize: 12,
              color: "#9CA3AF", marginLeft: "auto"
            }}>{filtered.length} results</span>
          </div>

          {/* LOADING */}
          {loading ? (
            <div style={{
              background: "white", borderRadius: 20, padding: 60,
              textAlign: "center", border: "1px solid #F1F5F9"
            }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, color: "#9CA3AF" }}>
                Loading volunteers from Firebase...
              </p>
            </div>
          ) : volunteers.length === 0 ? (
            /* NO VOLUNTEERS YET */
            <div style={{
              background: "white", borderRadius: 20, padding: 60,
              textAlign: "center", border: "1px solid #F1F5F9"
            }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>👥</p>
              <p style={{
                fontFamily: "var(--font-playfair)", fontSize: 24,
                color: "#0F172A", marginBottom: 8
              }}>No volunteers yet!</p>
              <p style={{
                fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280"
              }}>Volunteers will appear here once they register on the platform.</p>
            </div>
          ) : (
            /* VOLUNTEER CARDS */
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16
            }}>
              {filtered.map(vol => (
                <div
                  key={vol.id}
                  onClick={() => setSelectedVol(vol)}
                  style={{
                    background: "white", borderRadius: 20,
                    border: "1px solid #F1F5F9", overflow: "hidden",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                  }}
                >
                  <div style={{
                    height: 4,
                    background: vol.status === "active" ? "#10B981" : "#E5E7EB"
                  }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "#F97316", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>
                          {(vol.name || "V")[0].toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h3 style={{
                            fontFamily: "var(--font-inter)", fontSize: 15,
                            fontWeight: 600, color: "#0F172A", marginBottom: 2
                          }}>{vol.name || vol.email?.split("@")[0] || "Volunteer"}</h3>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: vol.status === "active" ? "#F0FDF4" : "#F8FAFC",
                            borderRadius: 999, padding: "3px 10px"
                          }}>
                            <div style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: vol.status === "active" ? "#10B981" : "#9CA3AF"
                            }} />
                            <span style={{
                              fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 600,
                              color: vol.status === "active" ? "#16A34A" : "#6B7280",
                              textTransform: "capitalize"
                            }}>{vol.status}</span>
                          </div>
                        </div>
                        <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF" }}>
                          📍 {vol.city || "Unknown city"}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {(vol.skills || []).length === 0 ? (
                        <span style={{
                          fontFamily: "var(--font-inter)", fontSize: 11,
                          color: "#9CA3AF", fontStyle: "italic"
                        }}>No skills listed</span>
                      ) : (
                        (vol.skills || []).slice(0, 3).map(skill => {
                          const colors = skillColors[skill] || { bg: "#F8FAFC", text: "#475569" };
                          return (
                            <span key={skill} style={{
                              fontFamily: "var(--font-inter)", fontSize: 11,
                              fontWeight: 500, background: colors.bg,
                              color: colors.text, padding: "3px 10px", borderRadius: 999
                            }}>{skill}</span>
                          );
                        })
                      )}
                      {(vol.skills || []).length > 3 && (
                        <span style={{
                          fontFamily: "var(--font-inter)", fontSize: 11,
                          color: "#9CA3AF", padding: "3px 8px"
                        }}>+{vol.skills.length - 3} more</span>
                      )}
                    </div>

                    <div style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderTop: "1px solid #F8FAFC",
                      marginBottom: 14
                    }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "var(--font-playfair)", fontSize: 20,
                          fontWeight: 700, color: "#0F172A"
                        }}>{vol.tasksCompleted || 0}</div>
                        <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>Tasks done</div>
                      </div>
                      <div style={{ width: 1, height: 32, background: "#F1F5F9" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "var(--font-playfair)", fontSize: 20,
                          fontWeight: 700, color: "#F97316"
                        }}>{(vol.tasksCompleted || 0) * 28}pts</div>
                        <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>Impact</div>
                      </div>
                      <div style={{ width: 1, height: 32, background: "#F1F5F9" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600,
                          color: vol.status === "active" ? "#10B981" : "#9CA3AF"
                        }}>{vol.status === "active" ? "Ready" : "Away"}</div>
                        <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#9CA3AF" }}>Status</div>
                      </div>
                    </div>

                    {/* Click hint */}
                    <div style={{
                      padding: "10px", background: "#F8FAFC",
                      borderRadius: 10, textAlign: "center"
                    }}>
                      <span style={{
                        fontFamily: "var(--font-inter)", fontSize: 12,
                        color: "#F97316", fontWeight: 500
                      }}>Click to view details & assign task →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty search state */}
          {!loading && volunteers.length > 0 && filtered.length === 0 && (
            <div style={{
              background: "white", borderRadius: 20, padding: 48,
              textAlign: "center", border: "1px solid #F1F5F9"
            }}>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "#0F172A", marginBottom: 8 }}>
                No volunteers found
              </p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
                Try changing your filters
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}