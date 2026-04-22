"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Needs Map", href: "/dashboard/needs", icon: "◉" },
  { label: "Survey Upload", href: "/dashboard/survey", icon: "⊕" },
  { label: "Volunteers", href: "/dashboard/volunteers", icon: "♟" },
  { label: "Tasks", href: "/dashboard/tasks", icon: "✓" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "▲" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 240, minHeight: "100vh",
      background: "#0F172A",
      display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, zIndex: 40
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
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
            fontSize: 20, fontWeight: 700, color: "white"
          }}>Needyfy</span>
        </Link>
      </div>

      {/* NGO Badge */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{
          background: "rgba(249,115,22,0.15)",
          border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: 10, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#F97316", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>NG</span>
          </div>
          <div>
            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 12,
              fontWeight: 600, color: "white", margin: 0
            }}>Helping Hands</p>
            <p style={{
              fontFamily: "var(--font-inter)", fontSize: 11,
              color: "#F97316", margin: 0
            }}>NGO Account</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        <p style={{
          fontFamily: "var(--font-inter)", fontSize: 10,
          color: "#475569", letterSpacing: 2,
          textTransform: "uppercase", padding: "0 8px",
          marginBottom: 8
        }}>Main Menu</p>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 12px", borderRadius: 10,
              marginBottom: 4, textDecoration: "none",
              background: active ? "rgba(249,115,22,0.15)" : "transparent",
              border: active ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
              transition: "all 0.2s"
            }}>
              <span style={{
                fontSize: 16,
                color: active ? "#F97316" : "#64748B"
              }}>{item.icon}</span>
              <span style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "#F97316" : "#94A3B8"
              }}>{item.label}</span>
              {active && (
                <div style={{
                  marginLeft: "auto", width: 6, height: 6,
                  borderRadius: "50%", background: "#F97316"
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: "16px 12px",
        borderTop: "1px solid rgba(255,255,255,0.08)"
      }}>
        <Link href="/login" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "11px 12px", borderRadius: 10,
          textDecoration: "none",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)"
        }}>
          <span style={{ fontSize: 16, color: "#EF4444" }}>⎋</span>
          <span style={{
            fontFamily: "var(--font-inter)",
            fontSize: 13, color: "#EF4444"
          }}>Sign out</span>
        </Link>
      </div>
    </aside>
  );
}