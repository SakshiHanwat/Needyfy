"use client";
import { useAuth } from "@/lib/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#F8FAFC"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid #F97316",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{
            fontFamily: "var(--font-inter)",
            fontSize: 14, color: "#6B7280"
          }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}