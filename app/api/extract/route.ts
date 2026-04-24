import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTION_PROMPT = `You are an expert data extraction AI for Needyfy — an NGO volunteer coordination platform in India.

Your job is to extract structured information from community needs survey forms. The image/document may be:
- A handwritten survey form
- A printed or typed form
- A scanned PDF page
- A phone photo
- Written in Hindi, English, Hinglish, or other Indian languages

Read the document carefully and extract the best possible values.

Return ONLY valid JSON:
{
  "category": "food",
  "location": "Area Name, City",
  "peopleAffected": 25,
  "urgencyLevel": 9,
  "description": "2-3 sentence clear description of the community need and why help is required",
  "suggestedSkills": ["Skill1", "Skill2", "Skill3"],
  "confidence": "high"
}

Rules:
- category must be exactly one of: food | medical | education | shelter | other
- peopleAffected must be an integer
- urgencyLevel must be an integer: High=9, Medium=6, Low=3
- suggestedSkills must be 2-4 short relevant volunteer skills
- confidence must be one of: high | medium | low
- description must be in English
- If a field is unclear, make the best possible estimate, but keep output valid JSON only`;

function safeParseJSON(text: string): any {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const jsonStart = cleaned.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("No JSON object found in Gemini response");
  }

  const jsonStr = cleaned.slice(jsonStart);

  try {
    return JSON.parse(jsonStr);
  } catch {}

  if (!jsonStr.endsWith("}")) {
    try {
      return JSON.parse(jsonStr + "}");
    } catch {}
  }

  const lastComma = jsonStr.lastIndexOf(",");
  if (lastComma > 0) {
    try {
      return JSON.parse(jsonStr.slice(0, lastComma) + "}");
    } catch {}
  }

  throw new Error("Could not parse Gemini response as JSON");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("deadline exceeded")
  );
}

async function generateWithRetry(
  generator: () => Promise<any>,
  retries = 3
): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await generator();
    } catch (error: any) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === retries) {
        throw error;
      }

      const delay = attempt * 2000;
      console.log(`Gemini retry ${attempt}/${retries} after ${delay}ms...`);
      await wait(delay);
    }
  }

  throw lastError;
}

function normalizeResult(parsed: any) {
  const allowedCategories = ["food", "medical", "education", "shelter", "other"];
  const category = allowedCategories.includes(String(parsed?.category || "").toLowerCase())
    ? String(parsed.category).toLowerCase()
    : "other";

  const peopleAffectedNum = Number(parsed?.peopleAffected);
  const urgencyNum = Number(parsed?.urgencyLevel);

  return {
    category,
    location: String(parsed?.location || "Unknown location").trim(),
    peopleAffected: Number.isFinite(peopleAffectedNum) && peopleAffectedNum > 0 ? Math.round(peopleAffectedNum) : 1,
    urgencyLevel: Number.isFinite(urgencyNum) ? urgencyNum : 5,
    description: String(parsed?.description || "No description available").trim(),
    suggestedSkills:
      Array.isArray(parsed?.suggestedSkills) && parsed.suggestedSkills.length > 0
        ? parsed.suggestedSkills.slice(0, 4)
        : ["General Help"],
    confidence: ["high", "medium", "low"].includes(String(parsed?.confidence || "").toLowerCase())
      ? String(parsed.confidence).toLowerCase()
      : "medium",
  };
}

async function extractWithGemini(base64Data: string, mimeType: string): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  const supportedMimeTypes: Record<string, string> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/webp": "image/webp",
    "image/heic": "image/heic",
    "image/heif": "image/heif",
    "image/svg+xml": "image/png",
    "application/pdf": "application/pdf",
  };

  const finalMimeType = supportedMimeTypes[mimeType] || "image/jpeg";
  console.log("Sending to Gemini Vision, mimeType:", finalMimeType);

  const result = await generateWithRetry(() =>
    model.generateContent([
      {
        inlineData: {
          mimeType: finalMimeType,
          data: base64Data,
        },
      },
      { text: EXTRACTION_PROMPT },
    ])
  );

  const responseText = result.response.text().trim();
  console.log("Gemini raw response:\n", responseText);

  return safeParseJSON(responseText);
}

async function extractFromText(text: string): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  const prompt = `Extract structured information from this field survey note:

"${text}"

Return ONLY valid JSON:
{
  "category": "food",
  "location": "Area Name, City",
  "peopleAffected": 25,
  "urgencyLevel": 9,
  "description": "2-3 sentence clear description of the community need",
  "suggestedSkills": ["Skill1", "Skill2"],
  "confidence": "high"
}

Rules:
- category: food | medical | education | shelter | other
- peopleAffected: integer
- urgencyLevel: High=9, Medium=6, Low=3
- suggestedSkills: 2-4 short relevant volunteer skills
- confidence: high
- return JSON only`;

  const result = await generateWithRetry(() => model.generateContent(prompt));
  const responseText = result.response.text().trim();
  console.log("Gemini text response:\n", responseText);

  return safeParseJSON(responseText);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("=== NEW REQUEST ===");
    console.log("Has image:", !!body.imageBase64);
    console.log("Has text:", !!body.text);
    console.log("MIME type:", body.mimeType);

    let parsed: any;

    if (body.imageBase64) {
      console.log("Image/PDF mode — using Gemini Vision...");
      parsed = await extractWithGemini(body.imageBase64, body.mimeType);
    } else if (body.text) {
      console.log("Text mode — using Gemini...");
      parsed = await extractFromText(body.text);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "No image or text provided.",
        },
        { status: 400 }
      );
    }

    const finalResult = normalizeResult(parsed);

    console.log("=== FINAL RESULT ===");
    console.log(finalResult);

    return NextResponse.json({
      success: true,
      data: finalResult,
    });
  } catch (err: any) {
    console.error("=== ERROR ===", err?.message || err);

    const message = String(err?.message || "");
    const isBusy = isRetryableGeminiError(err);

    return NextResponse.json(
      {
        success: false,
        error: isBusy
          ? "Gemini is temporarily busy. Please try again in a few seconds."
          : "Could not extract survey data. Please retry or fill manually.",
      },
      { status: isBusy ? 503 : 500 }
    );
  }
}