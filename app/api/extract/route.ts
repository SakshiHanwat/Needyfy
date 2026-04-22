import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTION_PROMPT = `You are an expert data extraction AI for Needyfy — an NGO volunteer coordination platform in India.

Your job is to extract structured information from community needs survey forms. The image/document may be:
- A handwritten survey form (neat or messy)
- A printed/typed form
- A scanned PDF page
- A photo taken by a volunteer on phone (may be blurry, angled, or low-light)
- Written in Hindi, English, Hinglish, or any regional Indian language

EXTRACTION RULES:
1. Read EVERY visible word carefully, even if partially blurry
2. If a field is unclear, make your BEST GUESS based on context
3. Never return null or empty — always provide a reasonable value
4. For numbers, estimate if exact value not visible (e.g. "around 20 families" = 100 people)
5. For location, extract any area name, street, colony, city, district visible
6. Urgency: Look for words like "urgent/turant/jaldi" = High, "soon/jald" = Medium, else = Low

Return ONLY this JSON (no markdown, no backticks, no explanation):
{
  "category": "food",
  "location": "Area Name, City",
  "peopleAffected": 25,
  "urgencyLevel": 9,
  "description": "2-3 sentence clear description of the community need and why help is required",
  "suggestedSkills": ["Skill1", "Skill2", "Skill3"],
  "confidence": "high"
}

STRICT RULES:
- category must be EXACTLY one of: food | medical | education | shelter | other
- peopleAffected: integer only (estimate if needed, never 0 unless truly stated)
- urgencyLevel: High=9, Medium=6, Low=3 (integer 1-10 only)
- suggestedSkills: 2-4 relevant volunteer skills (e.g. "Food Distribution", "Medical Aid", "Teaching", "Construction")
- confidence: "high" if image clear, "medium" if partially readable, "low" if very blurry but guessed
- description: Write in English, summarize the need clearly for volunteer matching`;

function safeParseJSON(text: string): any {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Extract JSON object from text
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart === -1) throw new Error("No JSON object found in response");

  const jsonStr = cleaned.slice(jsonStart);

  // Try as-is
  try {
    return JSON.parse(jsonStr);
  } catch {}

  // Try adding closing brace if truncated
  if (!jsonStr.endsWith("}")) {
    try {
      return JSON.parse(jsonStr + "}");
    } catch {}
  }

  // Try removing incomplete last field
  const lastComma = jsonStr.lastIndexOf(",");
  if (lastComma > 0) {
    try {
      return JSON.parse(jsonStr.slice(0, lastComma) + "}");
    } catch {}
  }

  throw new Error("Could not parse Gemini response as JSON");
}

async function extractWithGemini(
  base64Data: string,
  mimeType: string
): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  // All supported MIME types including SVG
  const supportedMimeTypes: Record<string, string> = {
    "image/jpeg":    "image/jpeg",
    "image/jpg":     "image/jpeg",
    "image/png":     "image/png",
    "image/webp":    "image/webp",
    "image/heic":    "image/heic",
    "image/heif":    "image/heif",
    "image/svg+xml": "image/png",   // SVG treated as PNG
    "application/pdf": "application/pdf",
  };

  const finalMimeType = supportedMimeTypes[mimeType] || "image/jpeg";
  console.log("Sending to Gemini Vision, mimeType:", finalMimeType);

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: finalMimeType,
        data: base64Data,
      },
    },
    { text: EXTRACTION_PROMPT },
  ]);

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

  const prompt = `You are an expert data extraction AI for Needyfy — an NGO volunteer coordination platform in India.

Extract structured information from this field survey note/text:

"${text}"

Return ONLY this JSON (no markdown, no backticks, no explanation):
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
- category: food | medical | education | shelter | other (pick best match)
- peopleAffected: integer (estimate if vague, e.g. "few families" = 20)
- urgencyLevel: High=9, Medium=6, Low=3
- suggestedSkills: 2-4 relevant volunteer skills
- confidence: always "high" for text input`;

  const result = await model.generateContent(prompt);
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
      throw new Error("No image or text provided");
    }

    const finalResult = {
      category: parsed.category || "other",
      location: parsed.location || "Unknown location",
      peopleAffected: Number(parsed.peopleAffected) || 0,
      urgencyLevel: Number(parsed.urgencyLevel) || 5,
      description: parsed.description || "No description available",
      suggestedSkills: Array.isArray(parsed.suggestedSkills)
        ? parsed.suggestedSkills
        : ["General Help"],
      confidence: parsed.confidence || "medium",
    };

    console.log("=== FINAL RESULT ===");
    console.log(finalResult);

    return NextResponse.json(finalResult);

  } catch (err: any) {
    console.error("=== ERROR ===", err.message);
    return NextResponse.json(
      {
        category: "other",
        location: "Unknown location",
        peopleAffected: 0,
        urgencyLevel: 5,
        description: err.message || "Could not extract data. Please fill manually.",
        suggestedSkills: ["General Help"],
        confidence: "low",
      },
      { status: 200 }
    );
  }
}