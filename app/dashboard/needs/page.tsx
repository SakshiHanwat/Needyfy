"use client";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from "@react-google-maps/api";
import { Toaster, toast } from "react-hot-toast";
import Link from "next/link";

interface Need {
  id: string;
  description: string;
  category: string;
  urgencyScore: number;
  city: string;
  location: string;
  status: string;
  peopleAffected: number;
  lat?: number;
  lng?: number;
}

const libraries: ["visualization"] = ["visualization"];

const categoryConfig: Record<string, { color: string; bg: string; text: string; emoji: string }> = {
  food:      { color: "#F97316", bg: "#FFF7ED", text: "#EA580C", emoji: "🍱" },
  medical:   { color: "#EF4444", bg: "#FEF2F2", text: "#DC2626", emoji: "🏥" },
  education: { color: "#F59E0B", bg: "#FFFBEB", text: "#D97706", emoji: "📚" },
  shelter:   { color: "#10B981", bg: "#F0FDF4", text: "#16A34A", emoji: "🏠" },
  other:     { color: "#6B7280", bg: "#F8FAFC", text: "#475569", emoji: "📌" },
};

// City coordinates for geocoding
const cityCoords: Record<string, { lat: number; lng: number }> = {
  "bhopal":   { lat: 23.2156, lng: 77.4304 },
  "indore":   { lat: 22.7196, lng: 75.8577 },
  "jabalpur": { lat: 23.1815, lng: 79.9864 },
  "gwalior":  { lat: 26.2183, lng: 78.1828 },
  "ujjain":   { lat: 23.1765, lng: 75.7885 },
  "default":  { lat: 23.2156, lng: 77.4304 },
};

function getCoordsForNeed(need: Need): { lat: number; lng: number } {
  if (need.lat && need.lng) return { lat: need.lat, lng: need.lng };
  const cityKey = (need.city || "").toLowerCase().trim();
  const base = cityCoords[cityKey] || cityCoords["default"];
  // Spread pins slightly so they don't overlap
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.08,
    lng: base.lng + (Math.random() - 0.5) * 0.08,
  };
}

export default function NeedsHeatmap() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [mappedNeeds, setMappedNeeds] = useState<(Need & { lat: number; lng: number })[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries,
  });

  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      const snapshot = await getDocs(collection(db, "needs"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Need[];

      setNeeds(data);

      // Add coordinates to each need
      const withCoords = data.map(need => ({
        ...need,
        ...getCoordsForNeed(need),
      }));
      setMappedNeeds(withCoords);
    } catch (err) {
      console.error("Error fetching needs:", err);
      toast.error("Could not load needs");
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters + search
  const filteredNeeds = mappedNeeds.filter(n => {
    const matchCat = filter === "all" || n.category === filter;
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    const matchSearch = search === "" ||
      (n.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.location || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const mapCenter = { lat: 23.2156, lng: 77.4304 };

  const getMarkerIcon = (need: Need) => {
    const config = categoryConfig[need.category] || categoryConfig.other;
    const size = need.urgencyScore >= 80 ? 44 : need.urgencyScore >= 60 ? 36 : 28;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="20" fill="${config.color}" opacity="0.9"/>
          <circle cx="22" cy="22" r="16" fill="white" opacity="0.3"/>
          <text x="22" y="28" text-anchor="middle" font-size="18">${config.emoji}</text>
        </svg>
      `)}`,
      scaledSize: { width: size, height: size } as google.maps.Size,
    };
  };

  const heatmapData = isLoaded
    ? filteredNeeds.map(n => ({
        location: new google.maps.LatLng(n.lat, n.lng),
        weight: n.urgencyScore || 50,
      }))
    : [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Toaster position="top-right" />
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{
          padding: "24px 32px", background: "white",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 28,
              fontWeight: 700, color: "#0F172A", marginBottom: 4
            }}>Needs Heatmap</h1>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#6B7280" }}>
              {loading ? "Loading..." : `${filteredNeeds.length} of ${needs.length} needs shown`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{
              display: "flex", background: "#F3F4F6",
              borderRadius: 10, padding: 4, gap: 4
            }}>
              {[{ key: "map", label: "🗺️ Map" }, { key: "list", label: "📋 List" }].map(v => (
                <button key={v.key} onClick={() => setViewMode(v.key as any)} style={{
                  fontFamily: "var(--font-inter)", fontSize: 12,
                  fontWeight: viewMode === v.key ? 600 : 400,
                  padding: "8px 16px", border: "none", borderRadius: 8,
                  cursor: "pointer",
                  background: viewMode === v.key ? "white" : "transparent",
                  color: viewMode === v.key ? "#F97316" : "#6B7280",
                  boxShadow: viewMode === v.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
                }}>{v.label}</button>
              ))}
            </div>
            <Link href="/dashboard/survey" style={{
              fontFamily: "var(--font-inter)", fontSize: 13,
              fontWeight: 600, background: "#F97316",
              color: "white", padding: "10px 18px",
              borderRadius: 10, textDecoration: "none"
            }}>+ Add Need</Link>
          </div>
        </div>

        {/* Filter + Search Bar */}
        <div style={{
          padding: "14px 32px", background: "white",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search by description or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              fontFamily: "var(--font-inter)", fontSize: 13,
              padding: "8px 16px", borderRadius: 10,
              border: "1.5px solid #E5E7EB", outline: "none",
              width: 220, color: "#0F172A", background: "white"
            }}
            onFocus={e => e.target.style.borderColor = "#F97316"}
            onBlur={e => e.target.style.borderColor = "#E5E7EB"}
          />

          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All", emoji: "📍" },
              { key: "food", label: "Food", emoji: "🍱" },
              { key: "medical", label: "Medical", emoji: "🏥" },
              { key: "education", label: "Education", emoji: "📚" },
              { key: "shelter", label: "Shelter", emoji: "🏠" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                fontFamily: "var(--font-inter)", fontSize: 12,
                fontWeight: filter === f.key ? 600 : 400,
                padding: "7px 12px", borderRadius: 999, cursor: "pointer",
                background: filter === f.key ? "#F97316" : "#F8FAFC",
                color: filter === f.key ? "white" : "#6B7280",
                border: filter === f.key ? "none" : "1px solid #E5E7EB",
              }}>{f.emoji} {f.label}</button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "open", "assigned", "completed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                fontFamily: "var(--font-inter)", fontSize: 11,
                fontWeight: statusFilter === s ? 600 : 400,
                padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                background: statusFilter === s ? "#0F172A" : "#F8FAFC",
                color: statusFilter === s ? "white" : "#6B7280",
                border: statusFilter === s ? "none" : "1px solid #E5E7EB",
                textTransform: "capitalize"
              }}>{s}</button>
            ))}
          </div>

          {/* Urgency pills */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {[
              { label: "Urgent", count: needs.filter(n => (n.urgencyScore || 0) >= 80).length, color: "#EF4444", bg: "#FEF2F2" },
              { label: "Medium", count: needs.filter(n => (n.urgencyScore || 0) >= 60 && (n.urgencyScore || 0) < 80).length, color: "#F59E0B", bg: "#FFFBEB" },
              { label: "Low", count: needs.filter(n => (n.urgencyScore || 0) < 60).length, color: "#10B981", bg: "#F0FDF4" },
            ].map(s => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: s.bg, borderRadius: 999, padding: "5px 12px"
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: s.color, fontWeight: 600 }}>
                  {s.count} {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>🗺️</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, color: "#9CA3AF" }}>
                Loading needs from Firebase...
              </p>
            </div>
          </div>
        ) : needs.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>📋</p>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "#0F172A", marginBottom: 8 }}>
                No needs added yet!
              </p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
                Upload surveys to see needs on the map.
              </p>
              <Link href="/dashboard/survey" style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                fontWeight: 600, background: "#F97316",
                color: "white", padding: "12px 24px",
                borderRadius: 12, textDecoration: "none"
              }}>Upload Survey →</Link>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex" }}>

            {/* MAP VIEW */}
            {viewMode === "map" && (
              <div style={{ flex: 1, display: "flex" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={mapCenter}
                      zoom={12}
                      options={{
                        styles: [
                          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                          { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                          { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                          { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
                          { featureType: "poi", stylers: [{ visibility: "off" }] },
                        ],
                        streetViewControl: false,
                        mapTypeControl: false,
                      }}
                    >
                      <HeatmapLayer
                        data={heatmapData}
                        options={{
                          radius: 40, opacity: 0.6,
                          gradient: ["rgba(0,255,0,0)", "rgba(255,255,0,1)", "rgba(255,165,0,1)", "rgba(255,0,0,1)"],
                        }}
                      />
                      {filteredNeeds.map(need => (
                        <Marker
                          key={need.id}
                          position={{ lat: need.lat, lng: need.lng }}
                          icon={getMarkerIcon(need)}
                          onClick={() => setSelectedNeed(need)}
                        />
                      ))}
                      {selectedNeed && (
                        <InfoWindow
                          position={{ lat: (selectedNeed as any).lat, lng: (selectedNeed as any).lng }}
                          onCloseClick={() => setSelectedNeed(null)}
                        >
                          <div style={{ maxWidth: 240, padding: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 20 }}>{categoryConfig[selectedNeed.category]?.emoji || "📌"}</span>
                              <span style={{
                                fontFamily: "var(--font-inter)", fontSize: 13,
                                fontWeight: 700, color: "#0F172A", textTransform: "capitalize"
                              }}>{selectedNeed.category}</span>
                              <span style={{
                                marginLeft: "auto",
                                background: (selectedNeed.urgencyScore || 0) >= 80 ? "#FEF2F2" : "#FFFBEB",
                                color: (selectedNeed.urgencyScore || 0) >= 80 ? "#EF4444" : "#F59E0B",
                                fontSize: 10, fontWeight: 700,
                                padding: "2px 8px", borderRadius: 999
                              }}>{selectedNeed.urgencyScore}</span>
                            </div>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 12,
                              color: "#374151", lineHeight: 1.5, marginBottom: 8
                            }}>{selectedNeed.description}</p>
                            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>
                              📍 {selectedNeed.city || selectedNeed.location || "Unknown"}
                            </p>
                            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
                              👥 {selectedNeed.peopleAffected || 0} people affected
                            </p>
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              background: selectedNeed.status === "open" ? "#F0FDF4" : "#FFF7ED",
                              borderRadius: 999, padding: "4px 10px", marginBottom: 8
                            }}>
                              <span style={{
                                fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 600,
                                color: selectedNeed.status === "open" ? "#16A34A" : "#EA580C",
                                textTransform: "capitalize"
                              }}>● {selectedNeed.status}</span>
                            </div>
                            <Link href="/dashboard/volunteers" style={{
                              display: "block", width: "100%", marginTop: 8,
                              padding: "8px", textAlign: "center",
                              fontFamily: "var(--font-inter)", fontSize: 12,
                              fontWeight: 600, background: "#F97316",
                              color: "white", border: "none",
                              borderRadius: 8, textDecoration: "none"
                            }}>Find Volunteers →</Link>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#F8FAFC"
                    }}>
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
                        Loading map...
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Panel */}
                <div style={{
                  width: 320, background: "white",
                  borderLeft: "1px solid #F1F5F9", overflowY: "auto"
                }}>
                  <div style={{ padding: "20px 20px 12px" }}>
                    <h3 style={{
                      fontFamily: "var(--font-playfair)", fontSize: 18,
                      fontWeight: 700, color: "#0F172A", marginBottom: 4
                    }}>Active Needs</h3>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF" }}>
                      {filteredNeeds.length} results — click to see on map
                    </p>
                  </div>
                  {filteredNeeds.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#9CA3AF" }}>
                        No needs match your filters
                      </p>
                    </div>
                  ) : (
                    filteredNeeds.map(need => {
                      const config = categoryConfig[need.category] || categoryConfig.other;
                      return (
                        <div
                          key={need.id}
                          onClick={() => setSelectedNeed(need)}
                          style={{
                            padding: "14px 20px",
                            borderBottom: "1px solid #F8FAFC",
                            cursor: "pointer",
                            background: selectedNeed?.id === need.id ? "#FFF7ED" : "white",
                            borderLeft: selectedNeed?.id === need.id
                              ? "3px solid #F97316" : "3px solid transparent"
                          }}
                        >
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: config.bg, display: "flex",
                              alignItems: "center", justifyContent: "center", flexShrink: 0
                            }}>
                              <span style={{ fontSize: 18 }}>{config.emoji}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontFamily: "var(--font-inter)", fontSize: 12,
                                fontWeight: 600, color: "#0F172A",
                                whiteSpace: "nowrap", overflow: "hidden",
                                textOverflow: "ellipsis", marginBottom: 4
                              }}>{need.description}</p>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
                                  📍 {need.city || need.location || "Unknown"}
                                </p>
                                <span style={{
                                  fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 600,
                                  color: need.status === "open" ? "#16A34A" : "#EA580C",
                                  textTransform: "capitalize"
                                }}>• {need.status}</span>
                              </div>
                            </div>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: (need.urgencyScore || 0) >= 80 ? "#FEF2F2" :
                                (need.urgencyScore || 0) >= 60 ? "#FFFBEB" : "#F0FDF4",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                            }}>
                              <span style={{
                                fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 700,
                                color: (need.urgencyScore || 0) >= 80 ? "#EF4444" :
                                  (need.urgencyScore || 0) >= 60 ? "#F59E0B" : "#10B981"
                              }}>{need.urgencyScore || 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
                {filteredNeeds.length === 0 ? (
                  <div style={{
                    background: "white", borderRadius: 20, padding: 48,
                    textAlign: "center", border: "1px solid #F1F5F9"
                  }}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, color: "#9CA3AF" }}>
                      No needs match your search/filters
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                    {filteredNeeds.map(need => {
                      const config = categoryConfig[need.category] || categoryConfig.other;
                      return (
                        <div key={need.id} style={{
                          background: "white", borderRadius: 20,
                          border: "1px solid #F1F5F9", overflow: "hidden"
                        }}>
                          <div style={{
                            height: 4,
                            background: (need.urgencyScore || 0) >= 80 ? "#EF4444" :
                              (need.urgencyScore || 0) >= 60 ? "#F59E0B" : "#10B981"
                          }} />
                          <div style={{ padding: 20 }}>
                            <div style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center", marginBottom: 12
                            }}>
                              <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: config.bg, borderRadius: 999, padding: "4px 10px"
                              }}>
                                <span style={{ fontSize: 12 }}>{config.emoji}</span>
                                <span style={{
                                  fontFamily: "var(--font-inter)", fontSize: 11,
                                  fontWeight: 600, color: config.text, textTransform: "capitalize"
                                }}>{need.category}</span>
                              </div>
                              <span style={{
                                fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700,
                                color: (need.urgencyScore || 0) >= 80 ? "#EF4444" :
                                  (need.urgencyScore || 0) >= 60 ? "#F59E0B" : "#10B981"
                              }}>{need.urgencyScore || 0}</span>
                            </div>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 13,
                              fontWeight: 600, color: "#0F172A",
                              lineHeight: 1.5, marginBottom: 10
                            }}>{need.description}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
                                📍 {need.city || need.location || "Unknown"}
                              </span>
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#9CA3AF" }}>
                                👥 {need.peopleAffected || 0} people affected
                              </span>
                              <span style={{
                                fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600,
                                color: need.status === "open" ? "#16A34A" :
                                  need.status === "completed" ? "#6B7280" : "#EA580C",
                                textTransform: "capitalize"
                              }}>● {need.status || "open"}</span>
                            </div>
                            <Link href="/dashboard/volunteers" style={{
                              display: "block", width: "100%", padding: "10px",
                              fontFamily: "var(--font-inter)", fontSize: 12,
                              fontWeight: 600, background: "#FFF7ED",
                              color: "#F97316", border: "1px solid #FED7AA",
                              borderRadius: 10, cursor: "pointer", textDecoration: "none",
                              textAlign: "center"
                            }}>Find Volunteers →</Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}