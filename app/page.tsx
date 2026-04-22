import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F3F4F6"
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          {/* Mobile menu button — navbar ke andar add karo */}
<button
  style={{
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8
  }}
  className="mobile-menu-btn"
>
  <div style={{ width: 22, height: 2, background: "#0F172A", marginBottom: 5, borderRadius: 2 }} />
  <div style={{ width: 22, height: 2, background: "#0F172A", marginBottom: 5, borderRadius: 2 }} />
  <div style={{ width: 22, height: 2, background: "#0F172A", borderRadius: 2 }} />
</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: "#F97316",
              borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center"
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>N</span>
            </div>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
              Needyfy
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-links">
            {["How it works", "Impact", "Features"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "")}`}
                style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280", textDecoration: "none" }}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{
              fontFamily: "var(--font-inter)", fontSize: 14,
              color: "#374151", textDecoration: "none"
            }}>Sign in</Link>
            <Link href="/register" style={{
              fontFamily: "var(--font-inter)", fontSize: 14,
              background: "#F97316", color: "white",
              padding: "10px 20px", borderRadius: 999, textDecoration: "none", fontWeight: 500
            }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/images/hero-volunteer.jpg" alt="Hero" fill style={{ objectFit: "cover" }} priority />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)"
          }} />
        </div>
        <div style={{ position: "relative", zIndex: 10, maxWidth: 1280, margin: "0 auto", padding: "0 24px", width: "100%" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)",
              borderRadius: 999, padding: "8px 16px", marginBottom: 24
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FB923C" }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#FDBA74" }}>
                AI-powered community coordination
              </span>
            </div>

            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 72,
              fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: 20
            }}>
              Connect needs<br />
              <span style={{ color: "#FB923C" }}>with action.</span>
            </h1>

            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 18,
              color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 36, maxWidth: 500
            }}>
              Needyfy uses AI to scan community surveys, map urgent needs,
              and instantly match the right volunteers.
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/register?role=ngo" style={{
                fontFamily: "var(--font-inter)", background: "#F97316",
                color: "white", padding: "14px 28px", borderRadius: 999,
                textDecoration: "none", fontSize: 15, fontWeight: 500
              }}>I represent an NGO</Link>
              <Link href="/register?role=volunteer" style={{
                fontFamily: "var(--font-inter)",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white", padding: "14px 28px", borderRadius: 999,
                textDecoration: "none", fontSize: 15
              }}>I want to volunteer</Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#F97316", padding: "48px 24px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center"
        }} className="stats-strip stats-grid">
          {[
            { number: "2,400+", label: "Needs identified" },
            { number: "890+", label: "Volunteers active" },
            { number: "156+", label: "NGOs onboarded" },
            { number: "94%", label: "Match accuracy" },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 42, fontWeight: 700, color: "white" }}>
                {stat.number}
              </div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: "96px 24px", background: "#F9FAFB" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center"
        }} className="grid-2">
          <div style={{ position: "relative", height: 520, borderRadius: 24, overflow: "hidden" }}>
            <Image src="/images/india-street.jpg" alt="India street" fill style={{ objectFit: "cover" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)"
            }} />
            <div style={{
              position: "absolute", bottom: 24, left: 24, right: 24,
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: 16
            }}>
              <p style={{ fontFamily: "var(--font-inter)", color: "white", fontSize: 13, lineHeight: 1.6 }}>
                Millions of needs go unmet daily — not because help doesn't exist, but because data is scattered.
              </p>
            </div>
          </div>

          <div>
            <span style={{
              fontFamily: "var(--font-inter)", fontSize: 12,
              color: "#F97316", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase"
            }}>The Problem</span>
            <h2 style={{
              fontFamily: "var(--font-playfair)", fontSize: 52,
              fontWeight: 700, color: "#0F172A", marginTop: 12, marginBottom: 20, lineHeight: 1.15
            }}>
              Data is scattered.<br />
              <span style={{ color: "#F97316" }}>Help is delayed.</span>
            </h2>
            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 16,
              color: "#6B7280", lineHeight: 1.8, marginBottom: 32
            }}>
              NGOs collect data through paper surveys and field reports — but this information sits in silos.
              Volunteers are available but don't know where to go.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "Paper surveys never get digitized",
                "Urgent needs go unnoticed for days",
                "Volunteers have no visibility into needs",
                "NGOs can't prioritize effectively",
              ].map(point => (
                <div key={point} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 15, color: "#374151" }}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="howitworks" style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              fontFamily: "var(--font-inter)", fontSize: 12,
              color: "#F97316", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase"
            }}>How it works</span>
            <h2 style={{
              fontFamily: "var(--font-playfair)", fontSize: 48,
              fontWeight: 700, color: "#0F172A", marginTop: 12
            }}>Three steps to impact</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }} className="steps-grid">
            {[
              {
                step: "01", title: "Scan & Extract",
                desc: "NGOs photograph paper surveys. Gemini AI instantly reads and extracts structured community need data.",
                img: "/images/rural-help.jpg", accent: "#FFF7ED", border: "#FED7AA"
              },
              {
                step: "02", title: "Map & Prioritize",
                desc: "Needs are plotted on a live heatmap. AI scores urgency based on frequency, severity, and recency.",
                img: "/images/city-aerial.jpg", accent: "#F0FDF4", border: "#BBF7D0"
              },
              {
                step: "03", title: "Match & Deploy",
                desc: "The right volunteers are matched by skill, location, and availability — and notified instantly.",
                img: "/images/volunteer-kids.jpg", accent: "#FFFBEB", border: "#FDE68A"
              },
            ].map(item => (
              <div key={item.step} style={{
                borderRadius: 24, overflow: "hidden",
                border: `1px solid ${item.border}`,
                background: item.accent
              }}>
                <div style={{ position: "relative", height: 220 }}>
                  <Image src={item.img} alt={item.title} fill style={{ objectFit: "cover" }} />
                </div>
                <div style={{ padding: 28 }}>
                  <span style={{
                    fontFamily: "var(--font-playfair)", fontSize: 56,
                    fontWeight: 700, color: "rgba(0,0,0,0.06)", lineHeight: 1
                  }}>{item.step}</span>
                  <h3 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 22,
                    fontWeight: 700, color: "#0F172A", marginTop: 4, marginBottom: 12
                  }}>{item.title}</h3>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 14,
                    color: "#6B7280", lineHeight: 1.7
                  }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT SECTION */}
      <section id="impact" style={{ padding: "96px 24px", background: "#0F172A", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
          <Image src="/images/community-needs.jpg" alt="Community" fill style={{ objectFit: "cover" }} />
        </div>
        <div style={{ position: "relative", zIndex: 10, maxWidth: 1280, margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center"
          }}>
            <div>
              <span style={{
                fontFamily: "var(--font-inter)", fontSize: 12,
                color: "#FB923C", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase"
              }}>Real Impact</span>
              <h2 style={{
                fontFamily: "var(--font-playfair)", fontSize: 52,
                fontWeight: 700, color: "white", marginTop: 12, marginBottom: 20, lineHeight: 1.2
              }}>
                Every need mapped.<br />
                <span style={{ color: "#FB923C" }}>Every volunteer counted.</span>
              </h2>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, color: "#94A3B8", lineHeight: 1.8 }}>
                From Dharavi to Indore — Needyfy gives every community a voice and every volunteer a direction.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="impact-grid">
              {[
                { label: "Food & nutrition", count: 342, dot: "#F97316" },
                { label: "Medical aid", count: 218, dot: "#EF4444" },
                { label: "Education", count: 189, dot: "#F59E0B" },
                { label: "Shelter", count: 134, dot: "#10B981" },
              ].map(need => (
                <div key={need.label} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20, padding: 24,
                  backdropFilter: "blur(8px)"
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: need.dot, marginBottom: 12 }} />
                  <div style={{ fontFamily: "var(--font-playfair)", fontSize: 36, fontWeight: 700, color: "white", marginBottom: 4 }}>
                    {need.count}
                  </div>
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#94A3B8" }}>
                    {need.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "96px 24px", background: "#F97316" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--font-playfair)", fontSize: 56,
            fontWeight: 700, color: "white", marginBottom: 20, lineHeight: 1.2
          }}>Ready to make a difference?</h2>
          <p style={{
            fontFamily: "var(--font-inter)", fontSize: 17,
            color: "rgba(255,255,255,0.85)", marginBottom: 40, lineHeight: 1.7
          }}>
            Join Needyfy — whether you're an NGO with a mission or a volunteer with a heart.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }} className="hero-buttons">
            <Link href="/register?role=ngo" style={{
              fontFamily: "var(--font-inter)", background: "white",
              color: "#F97316", padding: "16px 32px",
              borderRadius: 999, textDecoration: "none", fontSize: 15, fontWeight: 600
            }}>Register your NGO</Link>
            <Link href="/register?role=volunteer" style={{
              fontFamily: "var(--font-inter)", background: "#EA580C",
              color: "white", padding: "16px 32px",
              borderRadius: 999, textDecoration: "none", fontSize: 15,
              border: "1px solid rgba(255,255,255,0.3)"
            }}>Become a volunteer</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0F172A", padding: "48px 24px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: "#F97316",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>N</span>
            </div>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "white" }}>Needyfy</span>
          </div>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#475569" }}>
            © 2025 Needyfy. Built for communities, powered by AI.
          </p>
        </div>
      </footer>

    </main>
  );
}