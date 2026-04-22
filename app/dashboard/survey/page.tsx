"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Toaster, toast } from "react-hot-toast";

interface ExtractedData {
  category: string;
  location: string;
  peopleAffected: number;
  urgencyLevel: number;
  description: string;
  suggestedSkills: string[];
  confidence?: string;
}

export default function SurveyUpload() {
  const [step, setStep] = useState<"upload" | "processing" | "result" | "saved">("upload");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState("");
  const [inputMode, setInputMode] = useState<"image" | "text">("image");
  const fileRef = useRef<HTMLInputElement>(null);

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    food: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    medical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    education: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
    shelter: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
    other: { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
  };

  const confidenceBadge: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "#F0FDF4", text: "#16A34A", label: "✅ High Confidence" },
    medium: { bg: "#FFFBEB", text: "#D97706", label: "⚠️ Medium Confidence" },
    low: { bg: "#FEF2F2", text: "#DC2626", label: "🔴 Low Confidence — Please verify" },
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    if (file.type === "application/pdf") {
      setImagePreview(null);
    } else {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImage(file);
    if (file.type === "application/pdf") {
      setImagePreview(null);
    } else {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processWithGemini = async () => {
    if (inputMode === "image" && !image) {
      toast.error("Please upload an image or PDF first!");
      return;
    }
    if (inputMode === "text" && !manualText.trim()) {
      toast.error("Please enter survey text first!");
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      let requestBody: any = {};

      if (inputMode === "image" && image) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(image);
        });

        requestBody = { imageBase64: base64, mimeType: image.type };
      } else {
        requestBody = { text: manualText };
      }

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setExtracted(data);
      setStep("result");
      toast.success("AI extraction complete!");

    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong — check console");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const saveToFirestore = async () => {
    if (!extracted) return;
    setLoading(true);
    try {
      let imageUrl = "";

      if (image && image.type !== "application/pdf") {
        const storageRef = ref(storage, `surveys/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "needs"), {
        category: extracted.category,
        location: extracted.location,
        city: extracted.location.split(",")[1]?.trim() ||
          extracted.location.split(",")[0]?.trim() || "Unknown",
        peopleAffected: extracted.peopleAffected,
        urgencyScore: extracted.urgencyLevel * 10,
        description: extracted.description,
        suggestedSkills: extracted.suggestedSkills,
        aiConfidence: extracted.confidence || "medium",
        imageUrl,
        status: "open",
        extractedBy: "ai",
        createdAt: serverTimestamp(),
      });

      setStep("saved");
      toast.success("Need saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error saving. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("upload");
    setImage(null);
    setImagePreview(null);
    setExtracted(null);
    setManualText("");
  };

  return (
    <AuthGuard>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
        <Toaster position="top-right" />
        <Sidebar />

        <main style={{ marginLeft: 240, flex: 1, padding: "32px 40px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <Link href="/dashboard" style={{
                fontFamily: "var(--font-inter)", fontSize: 13,
                color: "#6B7280", textDecoration: "none"
              }}>Dashboard</Link>
              <span style={{ color: "#D1D5DB" }}>→</span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#F97316" }}>
                Survey Upload
              </span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 32,
              fontWeight: 700, color: "#0F172A", marginBottom: 4
            }}>AI Survey Scanner</h1>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#6B7280" }}>
              Upload a paper survey, PDF, or type field notes — Gemini AI reads and extracts structured data.
            </p>
          </div>

          {/* Progress Steps */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
            {[
              { key: "upload", label: "Upload" },
              { key: "processing", label: "AI Processing" },
              { key: "result", label: "Review" },
              { key: "saved", label: "Saved" },
            ].map((s, i) => {
              const steps = ["upload", "processing", "result", "saved"];
              const currentIdx = steps.indexOf(step);
              const thisIdx = steps.indexOf(s.key);
              const done = thisIdx < currentIdx;
              const active = thisIdx === currentIdx;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: done ? "#10B981" : active ? "#F97316" : "#E5E7EB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 6
                    }}>
                      <span style={{
                        color: done || active ? "white" : "#9CA3AF",
                        fontSize: done ? 14 : 13, fontWeight: 700
                      }}>{done ? "✓" : i + 1}</span>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: 11,
                      color: active ? "#F97316" : done ? "#10B981" : "#9CA3AF",
                      fontWeight: active ? 600 : 400
                    }}>{s.label}</span>
                  </div>
                  {i < 3 && (
                    <div style={{
                      width: 80, height: 2, marginBottom: 18,
                      background: done ? "#10B981" : "#E5E7EB",
                      transition: "background 0.3s"
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28 }}>

            {/* LEFT */}
            <div>

              {/* UPLOAD STEP */}
              {step === "upload" && (
                <div style={{
                  background: "white", borderRadius: 24,
                  border: "1px solid #F1F5F9", overflow: "hidden"
                }}>
                  {/* Mode Toggle */}
                  <div style={{
                    padding: "20px 28px", borderBottom: "1px solid #F1F5F9",
                    display: "flex", gap: 4, background: "#FAFAFA"
                  }}>
                    {[
                      { key: "image", label: "📷 Upload Image / PDF" },
                      { key: "text", label: "✏️ Type / Paste Text" },
                    ].map(mode => (
                      <button key={mode.key}
                        onClick={() => setInputMode(mode.key as any)}
                        style={{
                          fontFamily: "var(--font-inter)", fontSize: 13,
                          fontWeight: inputMode === mode.key ? 600 : 400,
                          padding: "10px 20px", borderRadius: 10, border: "none",
                          cursor: "pointer",
                          background: inputMode === mode.key ? "#F97316" : "transparent",
                          color: inputMode === mode.key ? "white" : "#6B7280",
                          transition: "all 0.2s"
                        }}>{mode.label}</button>
                    ))}
                  </div>

                  <div style={{ padding: 28 }}>
                    {inputMode === "image" ? (
                      <div
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileRef.current?.click()}
                        style={{
                          border: "2px dashed",
                          borderColor: image ? "#F97316" : "#E5E7EB",
                          borderRadius: 20, padding: "40px 24px",
                          textAlign: "center", cursor: "pointer",
                          background: image ? "#FFF7ED" : "#FAFAFA",
                          transition: "all 0.2s", marginBottom: 20
                        }}>
                        {image ? (
                          <div>
                            {imagePreview ? (
                              <div style={{
                                position: "relative", width: "100%",
                                height: 280, borderRadius: 12,
                                overflow: "hidden", marginBottom: 16
                              }}>
                                <Image src={imagePreview} alt="Survey" fill
                                  style={{ objectFit: "contain" }} />
                              </div>
                            ) : (
                              <div style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: "#FEF2F2", margin: "0 auto 16px",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}>
                                <span style={{ fontSize: 36 }}>📄</span>
                              </div>
                            )}
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 14,
                              fontWeight: 600, color: "#F97316", marginBottom: 4
                            }}>✓ {image.name}</p>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF"
                            }}>Click to change file</p>
                          </div>
                        ) : (
                          <div>
                            <div style={{
                              width: 72, height: 72, borderRadius: 20,
                              background: "#FFF7ED", margin: "0 auto 16px",
                              display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                              <span style={{ fontSize: 32 }}>📋</span>
                            </div>
                            <h3 style={{
                              fontFamily: "var(--font-playfair)", fontSize: 20,
                              fontWeight: 700, color: "#0F172A", marginBottom: 8
                            }}>Drop your survey here</h3>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 13,
                              color: "#6B7280", marginBottom: 8
                            }}>Images, PDFs, scanned documents</p>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 12,
                              color: "#9CA3AF", marginBottom: 16
                            }}>Works with Hindi, English and regional languages</p>
                            <div style={{
                              display: "inline-flex", gap: 8,
                              flexWrap: "wrap", justifyContent: "center"
                            }}>
                              {["JPG", "PNG", "PDF", "HEIC", "WEBP"].map(fmt => (
                                <span key={fmt} style={{
                                  fontFamily: "var(--font-inter)", fontSize: 11,
                                  background: fmt === "PDF" ? "#FFF7ED" : "#F3F4F6",
                                  color: fmt === "PDF" ? "#EA580C" : "#6B7280",
                                  border: fmt === "PDF" ? "1px solid #FED7AA" : "none",
                                  padding: "4px 10px", borderRadius: 999
                                }}>{fmt}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,.pdf,application/pdf"
                          onChange={handleImageSelect}
                          style={{ display: "none" }}
                        />
                      </div>
                    ) : (
                      <div style={{ marginBottom: 20 }}>
                        <label style={{
                          fontFamily: "var(--font-inter)", fontSize: 13,
                          fontWeight: 500, color: "#374151",
                          display: "block", marginBottom: 10
                        }}>Paste or type your field report / survey notes</label>
                        <textarea
                          value={manualText}
                          onChange={e => setManualText(e.target.value)}
                          placeholder="e.g. Visited Arera Colony today. Around 45 families are facing severe food shortage. Children are most affected..."
                          rows={8}
                          style={{
                            width: "100%", padding: "16px",
                            fontFamily: "var(--font-inter)", fontSize: 14,
                            border: "1.5px solid #E5E7EB", borderRadius: 16,
                            background: "#FAFAFA", color: "#0F172A",
                            outline: "none", resize: "vertical",
                            lineHeight: 1.7, boxSizing: "border-box"
                          }}
                          onFocus={e => e.target.style.borderColor = "#F97316"}
                          onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                        />
                        <p style={{
                          fontFamily: "var(--font-inter)", fontSize: 12,
                          color: "#9CA3AF", marginTop: 8
                        }}>💡 Hindi, English ya koi bhi regional language mein likh sakte ho</p>
                      </div>
                    )}

                    <button
                      onClick={processWithGemini}
                      disabled={loading ||
                        (inputMode === "image" && !image) ||
                        (inputMode === "text" && !manualText.trim())
                      }
                      style={{
                        width: "100%", padding: "16px",
                        fontFamily: "var(--font-inter)", fontSize: 15,
                        fontWeight: 600,
                        background: (inputMode === "image" && !image) ||
                          (inputMode === "text" && !manualText.trim())
                          ? "#F3F4F6" : "#F97316",
                        color: (inputMode === "image" && !image) ||
                          (inputMode === "text" && !manualText.trim())
                          ? "#9CA3AF" : "white",
                        border: "none", borderRadius: 14,
                        cursor: (inputMode === "image" && !image) ||
                          (inputMode === "text" && !manualText.trim())
                          ? "not-allowed" : "pointer",
                        transition: "all 0.2s"
                      }}>
                      ✨ Extract with Gemini AI
                    </button>
                  </div>
                </div>
              )}

              {/* PROCESSING STEP */}
              {step === "processing" && (
                <div style={{
                  background: "white", borderRadius: 24,
                  border: "1px solid #F1F5F9", padding: 60,
                  textAlign: "center"
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "#FFF7ED", margin: "0 auto 24px",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: 36 }}>🤖</span>
                  </div>
                  <h2 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 28,
                    fontWeight: 700, color: "#0F172A", marginBottom: 12
                  }}>Gemini AI is reading your survey...</h2>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 14,
                    color: "#6B7280", marginBottom: 32
                  }}>Gemini Vision reading and extracting structured data...</p>

                  <div style={{ maxWidth: 320, margin: "0 auto" }}>
                    {[
                      "Gemini Vision reading document...",
                      "Extracting all text content...",
                      "Analyzing community needs...",
                      "Scoring urgency level...",
                    ].map((s, i) => (
                      <div key={s} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 0",
                        borderBottom: i < 3 ? "1px solid #F8FAFC" : "none"
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "#F97316",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ color: "white", fontSize: 10 }}>✓</span>
                        </div>
                        <span style={{
                          fontFamily: "var(--font-inter)", fontSize: 13, color: "#374151"
                        }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RESULT STEP */}
              {step === "result" && extracted && (
                <div>
                  <div style={{
                    background: "#F0FDF4", border: "1px solid #BBF7D0",
                    borderRadius: 16, padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 12,
                    marginBottom: 20
                  }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: "var(--font-inter)", fontSize: 14,
                        fontWeight: 600, color: "#16A34A", marginBottom: 2
                      }}>Gemini AI Extraction Successful!</p>
                      <p style={{
                        fontFamily: "var(--font-inter)", fontSize: 12, color: "#4ADE80"
                      }}>Review the data below and save to database.</p>
                    </div>
                    {/* Confidence Badge */}
                    {extracted.confidence && (
                      <div style={{
                        background: confidenceBadge[extracted.confidence]?.bg || "#F8FAFC",
                        borderRadius: 999, padding: "6px 14px"
                      }}>
                        <span style={{
                          fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600,
                          color: confidenceBadge[extracted.confidence]?.text || "#475569"
                        }}>{confidenceBadge[extracted.confidence]?.label}</span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: "white", borderRadius: 24,
                    border: "1px solid #F1F5F9", overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "20px 28px", borderBottom: "1px solid #F1F5F9",
                      background: "#FAFAFA", display: "flex",
                      justifyContent: "space-between", alignItems: "center"
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-playfair)", fontSize: 20,
                        fontWeight: 700, color: "#0F172A"
                      }}>Extracted Data</h3>
                      <div style={{
                        background: categoryColors[extracted.category]?.bg || "#F8FAFC",
                        border: `1px solid ${categoryColors[extracted.category]?.border || "#E2E8F0"}`,
                        borderRadius: 999, padding: "6px 14px"
                      }}>
                        <span style={{
                          fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600,
                          color: categoryColors[extracted.category]?.text || "#475569",
                          textTransform: "capitalize"
                        }}>{extracted.category}</span>
                      </div>
                    </div>

                    <div style={{ padding: 28 }}>
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: 16, marginBottom: 24
                      }}>
                        {[
                          { label: "📍 Location", value: extracted.location },
                          { label: "👥 People Affected", value: `${extracted.peopleAffected} people` },
                          { label: "⚡ Urgency Score", value: `${extracted.urgencyLevel * 10}/100` },
                          { label: "🏷️ Category", value: extracted.category },
                        ].map(field => (
                          <div key={field.label} style={{
                            background: "#F8FAFC", borderRadius: 14,
                            padding: "16px 18px", border: "1px solid #F1F5F9"
                          }}>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 11,
                              color: "#9CA3AF", marginBottom: 6
                            }}>{field.label}</p>
                            <p style={{
                              fontFamily: "var(--font-inter)", fontSize: 15,
                              fontWeight: 600, color: "#0F172A",
                              textTransform: "capitalize"
                            }}>{field.value}</p>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        background: "#F8FAFC", borderRadius: 14,
                        padding: "16px 18px", border: "1px solid #F1F5F9",
                        marginBottom: 20
                      }}>
                        <p style={{
                          fontFamily: "var(--font-inter)", fontSize: 11,
                          color: "#9CA3AF", marginBottom: 8
                        }}>📝 Description</p>
                        <p style={{
                          fontFamily: "var(--font-inter)", fontSize: 14,
                          color: "#374151", lineHeight: 1.7
                        }}>{extracted.description}</p>
                      </div>

                      <div style={{ marginBottom: 28 }}>
                        <p style={{
                          fontFamily: "var(--font-inter)", fontSize: 11,
                          color: "#9CA3AF", marginBottom: 10
                        }}>🛠️ Skills Needed</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {extracted.suggestedSkills.map(skill => (
                            <span key={skill} style={{
                              fontFamily: "var(--font-inter)", fontSize: 12,
                              fontWeight: 500, background: "#FFF7ED",
                              color: "#EA580C", padding: "6px 14px",
                              borderRadius: 999, border: "1px solid #FED7AA"
                            }}>{skill}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: 28 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{
                            fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280"
                          }}>Urgency Level</span>
                          <span style={{
                            fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600,
                            color: extracted.urgencyLevel >= 8 ? "#EF4444" :
                              extracted.urgencyLevel >= 6 ? "#F59E0B" : "#10B981"
                          }}>
                            {extracted.urgencyLevel >= 8 ? "🔴 High" :
                              extracted.urgencyLevel >= 6 ? "🟡 Medium" : "🟢 Low"}
                          </span>
                        </div>
                        <div style={{ height: 8, background: "#F1F5F9", borderRadius: 999 }}>
                          <div style={{
                            height: "100%",
                            width: `${extracted.urgencyLevel * 10}%`,
                            borderRadius: 999,
                            background: extracted.urgencyLevel >= 8 ? "#EF4444" :
                              extracted.urgencyLevel >= 6 ? "#F59E0B" : "#10B981",
                            transition: "width 0.5s"
                          }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={saveToFirestore}
                          disabled={loading}
                          style={{
                            flex: 2, padding: "14px",
                            fontFamily: "var(--font-inter)", fontSize: 14,
                            fontWeight: 600,
                            background: loading ? "#FED7AA" : "#F97316",
                            color: "white", border: "none",
                            borderRadius: 12,
                            cursor: loading ? "not-allowed" : "pointer"
                          }}>
                          {loading ? "Saving..." : "💾 Save to Database"}
                        </button>
                        <button
                          onClick={resetForm}
                          style={{
                            flex: 1, padding: "14px",
                            fontFamily: "var(--font-inter)", fontSize: 14,
                            background: "white", color: "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: 12, cursor: "pointer"
                          }}>↺ Scan Another</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SAVED STEP */}
              {step === "saved" && (
                <div style={{
                  background: "white", borderRadius: 24,
                  border: "1px solid #F1F5F9", padding: 60,
                  textAlign: "center"
                }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    background: "#F0FDF4", margin: "0 auto 24px",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: 44 }}>🎉</span>
                  </div>
                  <h2 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 30,
                    fontWeight: 700, color: "#0F172A", marginBottom: 12
                  }}>Need Saved Successfully!</h2>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 15,
                    color: "#6B7280", marginBottom: 32, lineHeight: 1.7
                  }}>
                    Community need added to database.<br />
                    Volunteers will be matched automatically.
                  </p>
                  <div style={{
                    background: "#FFF7ED", border: "1px solid #FED7AA",
                    borderRadius: 16, padding: 20, marginBottom: 32
                  }}>
                    <p style={{
                      fontFamily: "var(--font-inter)", fontSize: 13,
                      color: "#EA580C", marginBottom: 4
                    }}>🤖 AI matching volunteers...</p>
                    <p style={{
                      fontFamily: "var(--font-inter)", fontSize: 12, color: "#9CA3AF"
                    }}>Top 3 matching volunteers will be notified shortly.</p>
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={resetForm} style={{
                      fontFamily: "var(--font-inter)", fontSize: 14,
                      fontWeight: 600, background: "#F97316",
                      color: "white", padding: "14px 28px",
                      border: "none", borderRadius: 12, cursor: "pointer"
                    }}>⊕ Upload Another</button>
                    <Link href="/dashboard" style={{
                      fontFamily: "var(--font-inter)", fontSize: 14,
                      background: "white", color: "#374151",
                      padding: "14px 28px", border: "1px solid #E5E7EB",
                      borderRadius: 12, textDecoration: "none"
                    }}>← Dashboard</Link>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT INFO PANEL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              <div style={{
                borderRadius: 20, overflow: "hidden",
                border: "1px solid #F1F5F9", position: "relative", height: 220
              }}>
                <Image
                  src="/images/survey-upload.jpg"
                  alt="Survey"
                  fill
                  sizes="380px"
                  style={{ objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)" }} />
                <div style={{
                  position: "absolute", inset: 0, padding: 20,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end"
                }}>
                  <p style={{
                    fontFamily: "var(--font-inter)", fontSize: 11,
                    color: "#FB923C", letterSpacing: 2,
                    textTransform: "uppercase", marginBottom: 4
                  }}>AI Feature</p>
                  <h4 style={{
                    fontFamily: "var(--font-playfair)", fontSize: 18,
                    fontWeight: 700, color: "white"
                  }}>Gemini Vision AI</h4>
                </div>
              </div>

              <div style={{
                background: "white", borderRadius: 20,
                border: "1px solid #F1F5F9", padding: 24
              }}>
                <h3 style={{
                  fontFamily: "var(--font-playfair)", fontSize: 18,
                  fontWeight: 700, color: "#0F172A", marginBottom: 16
                }}>How it works</h3>
                {[
                  { step: "1", title: "Upload survey / PDF", desc: "Photo ya PDF upload karo — koi bhi format", color: "#F97316" },
                  { step: "2", title: "Gemini reads it", desc: "Gemini directly image/PDF read karta hai", color: "#8B5CF6" },
                  { step: "3", title: "Gemini parses data", desc: "AI structured JSON banata hai", color: "#10B981" },
                  { step: "4", title: "Auto-match volunteers", desc: "Best volunteers ko notify kiya jaata hai", color: "#EF4444" },
                ].map(item => (
                  <div key={item.step} style={{
                    display: "flex", gap: 14,
                    marginBottom: 16, alignItems: "flex-start"
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: item.color, display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>
                        {item.step}
                      </span>
                    </div>
                    <div>
                      <p style={{
                        fontFamily: "var(--font-inter)", fontSize: 13,
                        fontWeight: 600, color: "#0F172A", marginBottom: 2
                      }}>{item.title}</p>
                      <p style={{
                        fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280"
                      }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                background: "#FFF7ED", borderRadius: 20,
                border: "1px solid #FED7AA", padding: 20
              }}>
                <h4 style={{
                  fontFamily: "var(--font-playfair)", fontSize: 16,
                  fontWeight: 700, color: "#0F172A", marginBottom: 12
                }}>📸 Best results tips</h4>
                {[
                  "Good lighting — avoid shadows",
                  "Hold camera steady, avoid blur",
                  "Include full page in frame",
                  "Works with Hindi & regional languages",
                  "PDF — any scanned document works",
                ].map(tip => (
                  <div key={tip} style={{
                    display: "flex", gap: 8,
                    marginBottom: 8, alignItems: "flex-start"
                  }}>
                    <span style={{ color: "#F97316", fontSize: 12, marginTop: 2 }}>•</span>
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: 12, color: "#6B7280"
                    }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}