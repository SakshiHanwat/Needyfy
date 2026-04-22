"use client";
import { useState } from "react";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const DEMO_NEEDS = [
  { id: "1", title: "Food distribution for 50 families", category: "food", urgencyScore: 85, lat: 23.2156, lng: 77.4304, area: "Arera Colony" },
  { id: "2", title: "Medical camp assistance needed", category: "medical", urgencyScore: 92, lat: 23.2489, lng: 77.4553, area: "Govindpura" },
  { id: "3", title: "Teaching support for 30 children", category: "education", urgencyScore: 65, lat: 23.2320, lng: 77.4120, area: "Slum Area" },
  { id: "4", title: "Shelter for flood victims", category: "shelter", urgencyScore: 95, lat: 23.2599, lng: 77.3712, area: "Old Bhopal" },
];

const categoryColors: Record<string, { color: string; bg: string; text: string; emoji: string }> = {
  food:      { color: "#F97316", bg: "#FFF7ED", text: "#EA580C", emoji: "🍱" },
  medical:   { color: "#EF4444", bg: "#FEF2F2", text: "#DC2626", emoji: "🏥" },
  education: { color: "#F59E0B", bg: "#FFFBEB", text: "#D97706", emoji: "📚" },
  shelter:   { color: "#10B981", bg: "#F0FDF4", text: "#16A34A", emoji: "🏠" },
};

const libraries: ["visualization"] = ["visualization"];

export default function VolunteerNeedsMap() {
  const [selectedNeed, setSelectedNeed] = useState<typeof DEMO_NEEDS[0] | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries,
  });

  const handleAccept = (needId: string, needTitle: string) => {
    setAcceptedIds(prev => [...prev, needId]);
    setSelectedNeed(null);
    toast.success(`Task accepted! Check My Tasks section.`);
  };

  const mapCenter = { lat: 23.2399, lng: 77.4126 };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <Toaster position="top-right" />

      {/* TOP BAR */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #F1F5F9",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/volunteers" style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-inter)", fontSize: 14,
            color: "#6B7280", textDecoration: "none"
          }}>
            <span>←</span> Back
          </Link>
          <div style={{ width: 1, height: 20, background: "#E5E7EB" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: "#F97316",
              borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>N</span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 20,
              fontWeight: 700, color: "#0F172A"
            }}>Needs Near You</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Active needs badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#FFF7ED", border: "1px solid #FED7AA",
            borderRadius: 999, padding: "6px 16px"
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#F97316"
            }} />
            <span style={{
              fontFamily: "var(--font-inter)", fontSize: 13,
              color: "#EA580C", fontWeight: 500
            }}>
              {DEMO_NEEDS.length - acceptedIds.length} active needs
            </span>
          </div>

          {/* Accepted badge */}
          {acceptedIds.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 999, padding: "6px 16px"
            }}>
              <span style={{ fontSize: 12 }}>✅</span>
              <span style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                color: "#16A34A", fontWeight: 500
              }}>
                {acceptedIds.length} accepted
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        height: "calc(100vh - 65px)"
      }}>

        {/* MAP */}
        <div style={{ position: "relative" }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={12}
              options={{
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d6e3" }] },
                  { featureType: "poi", stylers: [{ visibility: "off" }] },
                ],
                streetViewControl: false,
                mapTypeControl: false,
                zoomControl: true,
              }}
            >
              {DEMO_NEEDS.map(need => {
                const config = categoryColors[need.category];
                const isAccepted = acceptedIds.includes(need.id);
                const size = need.urgencyScore >= 80 ? 44 : 36;
                return (
                  <Marker
                    key={need.id}
                    position={{ lat: need.lat, lng: need.lng }}
                    onClick={() => !isAccepted && setSelectedNeed(need)}
                    icon={{
                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="22" cy="22" r="20" fill="${isAccepted ? "#10B981" : config.color}" opacity="0.9"/>
                          <circle cx="22" cy="22" r="16" fill="white" opacity="0.25"/>
                          <text x="22" y="28" text-anchor="middle" font-size="18">${isAccepted ? "✓" : config.emoji}</text>
                        </svg>
                      `)}`,
                      scaledSize: new google.maps.Size(size, size),
                    }}
                  />
                );
              })}

              {selectedNeed && (
                <InfoWindow
                  position={{ lat: selectedNeed.lat, lng: selectedNeed.lng }}
                  onCloseClick={() => setSelectedNeed(null)}
                >
                  <div style={{ maxWidth: 220, padding: 4 }}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: 8, marginBottom: 8
                    }}>
                      <span style={{ fontSize: 18 }}>
                        {categoryColors[selectedNeed.category].emoji}
                      </span>
                      <span style={{
                        fontFamily: "sans-serif", fontSize: 13,
                        fontWeight: 700, color: "#0F172A",
                        textTransform: "capitalize"
                      }}>
                        {selectedNeed.category}
                      </span>
                      <span style={{
                        marginLeft: "auto", fontSize: 11, fontWeight: 700,
                        color: selectedNeed.urgencyScore >= 80 ? "#EF4444" : "#F59E0B",
                        background: selectedNeed.urgencyScore >= 80 ? "#FEF2F2" : "#FFFBEB",
                        padding: "2px 8px", borderRadius: 999
                      }}>{selectedNeed.urgencyScore}</span>
                    </div>

                    <p style={{
                      fontFamily: "sans-serif", fontSize: 12,
                      color: "#374151", marginBottom: 6, lineHeight: 1.5
                    }}>
                      {selectedNeed.title}
                    </p>

                    <p style={{
                      fontFamily: "sans-serif", fontSize: 11,
                      color: "#9CA3AF", marginBottom: 12
                    }}>
                      📍 {selectedNeed.area}, Bhopal
                    </p>

                    <button
                      onClick={() => handleAccept(selectedNeed.id, selectedNeed.title)}
                      style={{
                        display: "block", width: "100%",
                        textAlign: "center", background: "#F97316",
                        color: "white", padding: "10px",
                        borderRadius: 8, fontFamily: "sans-serif",
                        fontSize: 13, fontWeight: 600,
                        border: "none", cursor: "pointer"
                      }}>
                      Accept Task →
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center",
              justifyContent: "center", background: "#F8FAFC"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <p style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 14, color: "#6B7280"
                }}>Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{
          background: "white",
          borderLeft: "1px solid #F1F5F9",
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>

          {/* Legend */}
          <div style={{
            background: "#F8FAFC", borderRadius: 12,
            padding: 16, border: "1px solid #F1F5F9"
          }}>
            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 10,
              color: "#9CA3AF", letterSpacing: 2,
              textTransform: "uppercase", marginBottom: 12
            }}>Legend</p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr", gap: 8
            }}>
              {Object.entries(categoryColors).map(([cat, conf]) => (
                <div key={cat} style={{
                  display: "flex", alignItems: "center",
                  gap: 6
                }}>
                  <span style={{ fontSize: 14 }}>{conf.emoji}</span>
                  <span style={{
                    fontFamily: "var(--font-inter)", fontSize: 12,
                    color: "#374151", textTransform: "capitalize"
                  }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs List Header */}
          <p style={{
            fontFamily: "var(--font-inter)", fontSize: 10,
            color: "#9CA3AF", letterSpacing: 2,
            textTransform: "uppercase", margin: "4px 0 0"
          }}>All Needs — sorted by urgency</p>

          {/* Need Cards */}
          {[...DEMO_NEEDS]
            .sort((a, b) => b.urgencyScore - a.urgencyScore)
            .map(need => {
              const config = categoryColors[need.category];
              const isAccepted = acceptedIds.includes(need.id);
              return (
                <div
                  key={need.id}
                  onClick={() => !isAccepted && setSelectedNeed(need)}
                  style={{
                    background: isAccepted ? "#F0FDF4" :
                      selectedNeed?.id === need.id ? "#FFF7ED" : "white",
                    border: `1.5px solid ${
                      isAccepted ? "#BBF7D0" :
                      selectedNeed?.id === need.id ? "#FED7AA" : "#F1F5F9"
                    }`,
                    borderRadius: 16, padding: 16,
                    cursor: isAccepted ? "default" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 8
                  }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: config.bg, borderRadius: 999,
                      padding: "3px 10px"
                    }}>
                      <span style={{ fontSize: 11 }}>{config.emoji}</span>
                      <span style={{
                        fontFamily: "var(--font-inter)", fontSize: 10,
                        fontWeight: 600, color: config.text,
                        textTransform: "capitalize"
                      }}>{need.category}</span>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: 13,
                      fontWeight: 700,
                      color: need.urgencyScore >= 80 ? "#EF4444" : "#F59E0B"
                    }}>{need.urgencyScore}</span>
                  </div>

                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 13,
                    fontWeight: 500, color: "#0F172A",
                    lineHeight: 1.5, marginBottom: 6
                  }}>{need.title}</p>

                  <p style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 11, color: "#9CA3AF",
                    marginBottom: isAccepted ? 8 : 0
                  }}>
                    📍 {need.area}, Bhopal
                  </p>

                  {/* Accepted state */}
                  {isAccepted && (
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: 6, marginTop: 8,
                      background: "#DCFCE7", borderRadius: 8,
                      padding: "6px 10px"
                    }}>
                      <span style={{ fontSize: 12 }}>✅</span>
                      <span style={{
                        fontFamily: "var(--font-inter)", fontSize: 12,
                        fontWeight: 600, color: "#16A34A"
                      }}>Task Accepted!</span>
                    </div>
                  )}

                  {/* Accept button — show on select */}
                  {!isAccepted && selectedNeed?.id === need.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(need.id, need.title);
                      }}
                      style={{
                        display: "block", width: "100%",
                        marginTop: 10, textAlign: "center",
                        fontFamily: "var(--font-inter)", fontSize: 13,
                        fontWeight: 600, background: "#F97316",
                        color: "white", padding: "10px",
                        borderRadius: 10, border: "none",
                        cursor: "pointer"
                      }}>
                      Accept Task →
                    </button>
                  )}
                </div>
              );
            })}

          {/* Back button */}
          <Link href="/volunteers" style={{
            display: "block", textAlign: "center",
            fontFamily: "var(--font-inter)", fontSize: 13,
            fontWeight: 500, color: "#6B7280",
            padding: "12px", borderRadius: 12,
            border: "1px solid #E5E7EB",
            textDecoration: "none", marginTop: 4
          }}>← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}