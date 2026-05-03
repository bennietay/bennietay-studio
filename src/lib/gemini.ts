/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { supabase } from "./supabase";
import {
  AIUseCase,
  DEFAULT_MODEL_CONFIG,
  AI_MODELS,
  AIModelOption,
} from "../constants/aiModels";
import axios from "axios";

// Initialize Gemini directly in the frontend
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Calls the local DeepSeek proxy
 */
async function callDeepSeek(
  modelId: string,
  messages: any[],
  responseFormat?: { type: "json_object" | "text" },
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await axios.post(
      "/api/ai/deepseek",
      {
        model: modelId,
        messages,
        response_format: responseFormat,
      },
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      },
    );
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error(
      "DeepSeek call failed:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "AI Synthesis via DeepSeek failed.",
    );
  }
}

// Cache for model configuration to avoid redundant DB calls
let cachedModelConfig: Record<string, string> | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 300000; // 5 minutes

/**
 * Resolves the model option to use for a specific use case.
 */
async function resolveModelOption(
  useCase: AIUseCase,
  businessId?: string,
): Promise<AIModelOption> {
  const now = Date.now();

  // 1. Check Global Platform Default Cache
  if (cachedModelConfig && now - lastCacheTime < CACHE_TTL) {
    const modelId =
      cachedModelConfig?.[useCase] || DEFAULT_MODEL_CONFIG[useCase];
    return (
      AI_MODELS.find((m) => m.id === modelId) ||
      AI_MODELS.find((m) => m.id === DEFAULT_MODEL_CONFIG[useCase])!
    );
  }

  // 2. Fetch Global Platform Default if not cached
  try {
    const { data: platformSettings } = await supabase
      .from("settings")
      .select("content")
      .eq("id", "platform")
      .maybeSingle();

    if (platformSettings?.content?.aiModelConfig) {
      cachedModelConfig = platformSettings.content.aiModelConfig;
      lastCacheTime = now;
    }
  } catch (err) {
    console.warn(`Failed to fetch global platform AI config`, err);
  }

  let modelId = cachedModelConfig?.[useCase] || DEFAULT_MODEL_CONFIG[useCase];

  // 3. Check Business Override (Not cached as it's specific to business)
  if (businessId) {
    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("ai_model_config")
        .eq("id", businessId)
        .single();

      if (business?.ai_model_config && business.ai_model_config[useCase]) {
        modelId = business.ai_model_config[useCase];
      }
    } catch (err) {
      console.warn(
        `Failed to fetch model config for business ${businessId}`,
        err,
      );
    }
  }

  return (
    AI_MODELS.find((m) => m.id === modelId) ||
    AI_MODELS.find((m) => m.id === DEFAULT_MODEL_CONFIG[useCase])!
  );
}

/**
 * Cleans the AI response string to ensure it is valid JSON.
 */
function cleanAIResponse(text: string): string {
  if (!text) return "";

  let cleaned = text.trim();

  // 1. Strip markdown code blocks if they exist
  const jsonMatch =
    cleaned.match(/```json\s?([\s\S]*?)\s?```/) ||
    cleaned.match(/```\s?([\s\S]*?)\s?```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // 2. Remove non-JSON prefix/suffix garbage
  // We look for the first { or [ and the last } or ]
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const endIdx = Math.max(lastBrace, lastBracket);

    if (endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    } else {
      // If we found a start but no end, it might be truncated
      cleaned = cleaned.substring(startIdx);
    }
  }

  return cleaned;
}

/**
 * Attempts to repair common JSON errors like unescaped control characters
 * or truncated responses.
 */
function repairJSON(text: string): string {
  let cleaned = cleanAIResponse(text);

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    console.warn(
      "Advanced JSON repair needed for:",
      e instanceof Error ? e.message : String(e),
    );

    // 1. Attempt to fix unescaped newlines and control characters inside quotes
    // Using a more robust regex that handles escaped quotes correctly: /"(?:[^"\\]|\\.)*"/
    cleaned = cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (match, p1) => {
      return `"${p1
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/[\x00-\x1F]/g, "")}"`; // Strip other illegal control characters
    });

    // 2. Fix missing commas between properties/elements
    // Case: value followed by start of a new property or object (e.g. "val" "key": or } {)
    cleaned = cleaned.replace(/("|\d|true|false|null|}|\])\s*\n?\s*("(?=[^"]*":)|{|\[)/g, '$1,\n$2');
    
    // Case: missing commas between items in an array or simple values (e.g. "val1" "val2")
    cleaned = cleaned.replace(/(")\s*\n?\s*(")/g, '$1,\n$2');
    cleaned = cleaned.replace(/(true|false|null|\d+)\s*\n?\s*(true|false|null|\d+|"|{|\[)/g, '$1,\n$2');
    
    // 3. Strip JSON comments (// or /* */) safely (preserving strings)
    cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"|\/\/.*$|\/\*[\s\S]*?\*\//gm, (match) => {
      if (match.startsWith("//") || match.startsWith("/*")) return "";
      return match;
    });

    // 4. Fix trailing commas (very common in AI JSON)
    cleaned = cleaned.replace(/,\s*([\]\}])/g, "$1");

    // 5. Handle truncated JSON (missing closing braces/brackets)
    let stack = [];
    let inString = false;
    let escaped = false;
    let lastUnclosedQuote = -1;

    let result = "";

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        result += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        lastUnclosedQuote = inString ? i : -1;
        result += char;
        continue;
      }

      if (!inString) {
        if (char === "{" || char === "[") {
          stack.push(char === "{" ? "}" : "]");
          result += char;
        } else if (char === "}" || char === "]") {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
            result += char;
          }
        } else {
          result += char;
        }
      } else {
        // We are inside a string - escape control characters
        const code = char.charCodeAt(0);
        if (char === "\n") result += "\\n";
        else if (char === "\r") result += "\\r";
        else if (char === "\t") result += "\\t";
        else if (char === "\b") result += "\\b";
        else if (char === "\f") result += "\\f";
        else if (code < 32 || char === "\u2028" || char === "\u2029") {
          // Escape other control characters and Unicode line/paragraph separators
          result += "\\u" + code.toString(16).padStart(4, "0");
        } else {
          result += char;
        }
      }
    }

    // If we are still in a string, close it
    if (inString) {
      result += '"';
    }

    // Check if we ended on a comma, which is invalid JSON if followed by nothing
    result = result.trim();
    if (result.endsWith(",")) {
      result = result.substring(0, result.length - 1);
    }

    // Close all remaining tags in reverse order
    while (stack.length > 0) {
      const needed = stack.pop();

      // Before closing an object, check if we're in a middle of a key/value pair
      if (needed === "}") {
        const trimmed = result.trim();
        if (trimmed.endsWith(":")) {
          result += " null";
        } else if (trimmed.endsWith(",")) {
          result = trimmed.substring(0, trimmed.length - 1);
        } else {
          // If the last character is alphanumeric (likely a truncated key)
          // we might need to close the quote if we weren't in a string,
          // or if we were, it was already closed above.
          // This is tricky, but the current logic handles most common cases.
        }
      }
      result += needed;
    }

    try {
      JSON.parse(result);
      return result;
    } catch (finalError) {
      // Last-ditch: if it's really broken, just return what we have and hope for the best
      // or the caller will catch the second parse failure
      console.error("JSON Repair still failed:", finalError);
      throw finalError;
    }
  }
}

/**
 * Internal helper to call Gemini
 */
async function this_call_gemini(
  model: AIModelOption,
  systemMessage: string,
  prompt: string,
  options: any,
  attempt: number,
  maxRetries: number,
) {
  const response = await ai.models.generateContent({
    model: model.id,
    contents: systemMessage
      ? [
          { role: "user", parts: [{ text: systemMessage }] },
          {
            role: "model",
            parts: [
              {
                text: "Understood. I will strictly follow the output format requirements.",
              },
            ],
          },
          { role: "user", parts: [{ text: prompt }] },
        ]
      : prompt,
    config: {
      maxOutputTokens: 8192,
      responseMimeType: options.isJson ? "application/json" : "text/plain",
      responseSchema: options.responseSchema,
      temperature: 0.2, // Lower temperature for more deterministic/stable JSON
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI returned an empty response");

  let cleaned = options.isJson ? repairJSON(text) : text;

  try {
    return options.isJson ? JSON.parse(cleaned) : cleaned;
  } catch (parseError) {
    // Final fallback: try raw text trimmed
    if (options.isJson) {
      try {
        return JSON.parse(text.trim());
      } catch (e) {
        console.error("JSON Repair/Fallback failed:", parseError);
      }
    }
    throw parseError;
  }
}

/**
 * Shared AI generation router with retry logic
 */
export async function askAI(
  useCase: AIUseCase,
  prompt: string,
  options: {
    businessId?: string;
    systemMessage?: string;
    responseSchema?: any;
    isJson?: boolean;
    maxRetries?: number;
  } = {},
) {
  const model = await resolveModelOption(useCase, options.businessId);
  const maxRetries = options.maxRetries ?? 2;
  let lastError: any = null;

  const systemPrefix = options.isJson
    ? "IMPORTANT: You MUST return a valid JSON object. DO NOT include any explanatory text, markdown notes, or prefix/suffix content. Ensure all strings are properly escaped. Specifically, ensure that all newlines, tabs, and carriage returns within JSON strings are escaped as \\n, \\t, and \\r. DO NOT include literal newlines inside string values. Double-quote all property names and string values. If a string contains double quotes, escape them with a backslash (e.g. \\\" ). Do NOT include trailing commas. Ensure every property pair is separated by a comma."
    : "";

  const systemMessage = options.systemMessage
    ? `${systemPrefix}${options.systemMessage}`
    : systemPrefix;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (model.provider === "deepseek") {
        const messages = [];
        if (systemMessage)
          messages.push({ role: "system", content: systemMessage });
        messages.push({ role: "user", content: prompt });

        try {
          const responseText = await callDeepSeek(
            model.id,
            messages,
            options.isJson ? { type: "json_object" } : undefined,
          );
          if (!responseText && attempt < maxRetries) continue;
          if (!responseText) throw new Error("AI returned an empty response");

          const cleaned = options.isJson
            ? repairJSON(responseText)
            : responseText;
          try {
            return options.isJson ? JSON.parse(cleaned) : cleaned;
          } catch (e) {
            // One final fallback: try original if cleanup somehow broke it
            try {
              return options.isJson ? JSON.parse(responseText.trim()) : responseText;
            } catch (e2) {
               throw e; // throw the repair error
            }
          }
        } catch (deepSeekError: any) {
          // If DeepSeek is not configured, fall back to Gemini automatically
          if (deepSeekError.message.includes("DEEPSEEK_CONFIG_ERROR") || 
              deepSeekError.message.includes("not configured") ||
              deepSeekError.message.includes("API Key is missing")) {
            console.warn("DeepSeek not configured, falling back to Gemini for this request.");
            // Force gemini for the rest of this function call
            const geminiModelId = DEFAULT_MODEL_CONFIG[useCase].includes("gemini") 
              ? DEFAULT_MODEL_CONFIG[useCase] 
              : "gemini-3-flash-preview";
            const geminiModel = AI_MODELS.find(m => m.id === geminiModelId)!;
            
            // Continue with Gemini logic (next block)
            return await this_call_gemini(geminiModel, systemMessage, prompt, options, attempt, maxRetries);
          }
          throw deepSeekError;
        }
      }

      // Gemini logic
      return await this_call_gemini(model, systemMessage, prompt, options, attempt, maxRetries);
    } catch (error: any) {
      lastError = error;
      console.warn(`AI attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 * (attempt + 1)),
        );
        continue;
      }
    }
  }

  throw lastError || new Error("AI Synthesis failed after multiple attempts");
}

export async function generateWebsiteContent(
  businessName: string,
  industry: string,
  location: string,
  tone: string,
  template: string = "modern",
  businessNature: string = "",
  businessId?: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const model = await resolveModelOption("synthesis", businessId);

  // Credit check & usage tracking
  try {
    if (businessId) {
      const baseCost = 5;
      const totalCost = baseCost * model.costLevel;

      const { error: creditError } = await supabase.rpc("increment_ai_usage", {
        biz_id: businessId,
        amount: totalCost,
        use_case_name: "synthesis",
        model_name: model.id,
      });
      if (creditError) {
        console.warn("Credit check/tracking failed:", creditError);
        // If columns don't exist yet (42703), we allow the operation to continue
        if (creditError.code !== "42703") {
          // If it's a different error (e.g. out of credits), we might want to know
          // but for synthesis, we often want to prioritize the user experience
        }
      }
    }
  } catch (err: any) {
    console.warn("Credit check/tracking failed (exception):", err);
  }

  const prompt = `You are an elite Digital Synthesis Engine and Lead Generation Architect. Generate a high-converting, professional business website for "${businessName}" in the "${industry}" industry located in "${location}". 
    
    BUSINESS CONTEXT:
    "${businessNature}"
    
    TONE: "${tone}"
    DESIGN STYLE: "${template}"

    DESIGN ARCHETYPES (Use these as inspiration for copy and structure):
    - editorial: Editorial Clean. Wide margins, elegant serif headlines (Playfair Display), soft cream/deep sapphire palette. Perfect for Medical, Legal, Wellness.
    - action: High-Contrast Action/Urgency. Bold, blocky headlines, highly dynamic colors (safety yellow on navy), mobile-first with massive buttons. Perfect for HVAC, Plumber, Locksmith.
    - immersive: Narrative Immersive. Full-bleed background imagery, minimalist text, romantic typography, deep amber/charcoal palette. Perfect for Restaurants, Hotels, Wineries.
    - authority: Asymmetrical Authority. Balanced asymmetrical layout, modern serif headers, large social proof, face-forward portraiture. Perfect for Coaches, Speakers, Consultants.
    - prestige: Elite Prestige. Timeless, high-luxury aesthetic. Uses pure black, warm off-white, and gold accents. Very thin borders, oversized serif numbers, and oval-masked imagery. Minimalist but powerful. Perfect for Luxury Brands, Private Equity, Elite Real Estate.
    
    - luxury_dark: Midnight Luxury. Ultra-dark palette (obsidian, deep charcoal, gold), heavy use of glassmorphism, glowing accents, and high-end cinematic imagery. Extreme premium feel. Perfect for Tech Elitists, Nightclubs, Luxury Automotives.
    
    CONTENT REQUIREMENTS:
    1. Multi-Page Architecture:
       - "home": Conversion-focused. Sections: hero, problem, solution, benefits, features, proof (stats), testimonials, cta.
       - "services": Deep dive into offerings. Sections: services (list), cta.
       - "about": Story, mission, team. Sections: about (text content), team, cta.
       - "contact": Lead acquisition. Sections: contact (form placeholder), faq.
    2. UNIQUE HEADLINES: Every page MUST have a distinct, high-impact headline.
    3. Copywriting: Use "High-Intent" copy. Avoid generic "Welcome to our site". Use hooks like "Stop [Problem], Start [Benefit]".
    4. ZERO PLACEHOLDERS: You are strictly FORBIDDEN from using placeholders like "[Your Name]", "[Company]", or "[City]". If the business is in "New York", use "New York" in the copy. If the business name is "Acme", use "Acme" in the copy.
    5. PREMIUM FEEL: The copy must feel like a $10,000+ custom agency project. Use sophisticated vocabulary and focus on high ROI.
    6. NUMBERING: When generating statistics or prices, use standard International thousand separators (e.g., 5,000 NOT 5,00,0 or 50,00). Prices should be formatted with currency symbols where appropriate.
    7. SEO INJECTION: Optimized Title, Description, and Keywords for EVERY page. Description should be 150-160 chars.
    7. IMAGE STRATEGY: Use Unsplash URLs (https://images.unsplash.com/photo-...) relevant to the industry.
    
    JSON STRUCTURE REQUIREMENTS:
    - theme: { primaryColor, secondaryColor, fontFamily, style }
    - seo: { title, description, keywords[], coreValueProposition, businessType, region, placename }
    - pages: Array<{ 
        title, 
        slug, 
        seo: { title, description, keywords[] }, 
        sections: Array<{ 
          type, 
          content: {
            // Hero
            headline, subheadline, ctaText, imageUrl,
            // Generic/About/Solution
            title, description, text, body,
            // Lists (Services, Benefits, Features, Testimonials, FAQ, Pricing, Proof, Problem, Solution)
            items: Array<{ title, description, price, name, role, text, question, answer, label, value }>,
            services: Array<{ title, description, price }>,
            features: Array<string>,
            painPoints: Array<string>,
            stats: Array<{ label, value }>,
            plans: Array<{ name, price, isPopular, features: Array<string> }>,
            testimonials: Array<{ name, role, content, avatar }>,
            faq: Array<{ question, answer }>,
            // CTA
            buttonText, secondaryButtonText
          }
        }> 
      }>
    
    Supported Section Types: [hero, features, services, solution, pricing, testimonials, cta, faq, about, contact, team, proof, problem, benefits, blog_list]`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      theme: {
        type: Type.OBJECT,
        properties: {
          primaryColor: { type: Type.STRING },
          secondaryColor: { type: Type.STRING },
          fontFamily: { type: Type.STRING },
          style: {
            type: Type.STRING,
            enum: [
              "modern",
              "neumorphic",
              "glassmorphic",
              "brutalist",
              "editorial",
              "action",
              "immersive",
              "authority",
              "corporate",
              "prestige",
              "luxury_dark",
            ],
          },
        },
        required: ["primaryColor", "secondaryColor", "fontFamily", "style"],
      },
      seo: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          coreValueProposition: { type: Type.STRING },
          businessType: { type: Type.STRING },
          region: { type: Type.STRING },
          placename: { type: Type.STRING },
        },
        required: [
          "title",
          "description",
          "coreValueProposition",
          "businessType",
          "region",
          "placename",
        ],
      },
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            slug: { type: Type.STRING },
            seo: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["title", "description", "keywords"],
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: [
                      "hero",
                      "features",
                      "services",
                      "solution",
                      "pricing",
                      "testimonials",
                      "cta",
                      "faq",
                      "about",
                      "contact",
                      "team",
                      "proof",
                      "problem",
                      "benefits",
                      "blog_list",
                    ],
                  },
                  content: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      subheadline: { type: Type.STRING },
                      ctaText: { type: Type.STRING },
                      ctaLink: { type: Type.STRING },
                      imageUrl: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      text: { type: Type.STRING },
                      body: { type: Type.STRING },
                      buttonText: { type: Type.STRING },
                      secondaryButtonText: { type: Type.STRING },
                      services: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            price: { type: Type.STRING },
                          },
                        },
                      },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            label: { type: Type.STRING },
                            value: { type: Type.STRING },
                          },
                        },
                      },
                      features: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      painPoints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      stats: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            value: { type: Type.STRING },
                          },
                        },
                      },
                      plans: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            price: { type: Type.STRING },
                            isPopular: { type: Type.BOOLEAN },
                            features: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING },
                            },
                          },
                        },
                      },
                      faq: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING },
                          },
                        },
                      },
                      testimonials: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            role: { type: Type.STRING },
                            content: { type: Type.STRING },
                            avatar: { type: Type.STRING },
                          },
                        },
                      },
                      members: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            role: { type: Type.STRING },
                            bio: { type: Type.STRING },
                            imageUrl: { type: Type.STRING },
                          },
                        },
                      },
                    },
                  },
                },
                required: ["type", "content"],
              },
            },
          },
          required: ["title", "slug", "sections", "seo"],
        },
      },
    },
    required: ["theme", "seo", "pages"],
  };

  return await askAI("synthesis", prompt, {
    businessId,
    systemMessage:
      "You are a master business strategist and world-class conversion copywriter. Your goal is to generate architectural, sophisticated, and commercially potent website structures. Return only JSON. Ensure EVERY field in the content object is fully populated for the given section type with high-fidelity, industry-specific copy. You MUST NEVER use placeholders like '[Your name]', '[City]', or generic 'X'. Provide deep, research-backed copy for services, professional bios for teams, and realistic market-aligned pricing. Every word should add high value.",
    isJson: true,
    responseSchema,
  });
}

export async function generatePageContent(
  pageTitle: string,
  businessName: string,
  industry: string,
  location: string,
  tone: string,
  businessNature: string = "",
  businessId?: string,
) {
  const model = await resolveModelOption("synthesis", businessId);

  const prompt = `Generate a high-converting, elite website page titled "${pageTitle}" for "${businessName}" in the "${industry}" industry located in "${location}". 

    BUSINESS CONTEXT:
    "${businessNature}"
    
    TONE: "${tone}"

    INSTRUCTIONS:
    - Write copy that sounds expensive and authoritative.
    - Focus on outcomes and transformations rather than just features.
    - Each section must have deep, specific industry relevance.
    - Generate 4-6 relevant sections from the supported list below.
    
    Supported Section Types: [hero, features, services, solution, pricing, testimonials, cta, faq, about, contact, team, proof, problem, benefits, blog_list]`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      slug: { type: Type.STRING },
      seo: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "description", "keywords"],
      },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
            },
            content: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                subheadline: { type: Type.STRING },
                ctaText: { type: Type.STRING },
                ctaLink: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                text: { type: Type.STRING },
                body: { type: Type.STRING },
                buttonText: { type: Type.STRING },
                secondaryButtonText: { type: Type.STRING },
                services: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      price: { type: Type.STRING },
                    },
                  },
                },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                  },
                },
                features: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                painPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                stats: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                  },
                },
                plans: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      price: { type: Type.STRING },
                      isPopular: { type: Type.BOOLEAN },
                      features: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                  },
                },
                faq: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                    },
                  },
                },
                testimonials: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      role: { type: Type.STRING },
                      content: { type: Type.STRING },
                      avatar: { type: Type.STRING },
                    },
                  },
                },
                members: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      role: { type: Type.STRING },
                      bio: { type: Type.STRING },
                      imageUrl: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
          required: ["type", "content"],
        },
      },
    },
    required: ["title", "slug", "sections", "seo"],
  };

  return await askAI("synthesis", prompt, {
    businessId,
    systemMessage:
      "You are a professional website copywriter. Return only JSON. Ensure all section content fields are fully populated with premium, industry-specific copy that avoids all placeholders. Every string should be ready for a live high-end production site.",
    isJson: true,
    responseSchema,
  });
}

export async function generateSectionContent(
  type: string,
  businessName: string,
  industry: string,
  location: string,
  tone: string,
  businessNature: string = "",
  businessId?: string,
  customPrompt?: string,
) {
  const model = await resolveModelOption("synthesis", businessId);

  const prompt = `Generate a high-converting, professional website section of type "${type}" for "${businessName}" in the "${industry}" industry located in "${location}". 
    
    BUSINESS CONTEXT:
    "${businessNature}"
    
    TONE: "${tone}"

    ${customPrompt ? `CUSTOM USER REQUIREMENTS: "${customPrompt}"` : ""}

    Generate full content for this section.
    
    Supported Section Types: [hero, features, services, solution, pricing, testimonials, cta, faq, about, contact, team, proof, problem, benefits, blog_list]`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING },
      content: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          ctaText: { type: Type.STRING },
          ctaLink: { type: Type.STRING },
          imageUrl: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          text: { type: Type.STRING },
          body: { type: Type.STRING },
          buttonText: { type: Type.STRING },
          secondaryButtonText: { type: Type.STRING },
          services: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.STRING },
              },
            },
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                label: { type: Type.STRING },
                value: { type: Type.STRING },
              },
            },
          },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          painPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          stats: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
              },
            },
          },
          plans: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.STRING },
                isPopular: { type: Type.BOOLEAN },
                features: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
          },
          faq: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
              },
            },
          },
          testimonials: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                content: { type: Type.STRING },
                avatar: { type: Type.STRING },
              },
            },
          },
          members: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                bio: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
    required: ["type", "content"],
  };

  return await askAI("synthesis", prompt, {
    businessId,
    systemMessage:
      "You are a master business strategist and world-class conversion copywriter. Return only JSON. Your mission is to provide high-fidelity, industry-specific copy that is 100% production-ready. You must NEVER use placeholders like '[City]', 'Your Name', or 'X years experience'. Research the provided business industry deeply and generate sophisticated, benefit-driven content. For pricing, use realistic market values. For testimonials, create credible personas. Ensure every single string is unique, persuasive, and adds commercial value.",
    isJson: true,
    responseSchema,
  });
}

export async function generateGeoContent(
  businessName: string,
  industry: string,
  location: string,
  businessNature: string,
  businessId?: string,
) {
  const model = await resolveModelOption("seo", businessId);

  // Credit usage
  try {
    if (businessId) {
      const baseCost = 2; // Base for SEO
      const { error: creditError } = await supabase.rpc("increment_ai_usage", {
        biz_id: businessId,
        amount: baseCost * model.costLevel,
        use_case_name: "seo",
        model_name: model.id,
      });
      if (creditError && creditError.code !== "42703") {
        console.warn("Credit tracking failed:", creditError);
      }
    }
  } catch (err) {
    console.warn("Credit tracking failed (exception):", err);
  }

  const prompt = `Generate Generative Engine Optimization (GEO) content for a business.
    Business Name: "${businessName}"
    Industry: "${industry}"
    Location: "${location}"
    Business Nature: "${businessNature}"

    Generate:
    1. coreValueProposition: A single sentence that summarizes the unique value of the business for AI search engines.
    2. knowledgeBaseSummary: A 2-3 paragraph summary focusing on business history, milestones, and core expertise providing deep context for LLMs.
    3. targetAudience: A specific profile of the ideal customer.
    4. keywords: A list of 10-12 highly relevant SEO keywords.
    5. businessType: The most accurate Schema.org business type (e.g., LocalBusiness, Dentist, Lawyer).

    Provide the response in JSON format.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      coreValueProposition: { type: Type.STRING },
      knowledgeBaseSummary: { type: Type.STRING },
      targetAudience: { type: Type.STRING },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      businessType: { type: Type.STRING },
    },
    required: [
      "coreValueProposition",
      "knowledgeBaseSummary",
      "targetAudience",
      "keywords",
      "businessType",
    ],
  };

  return await askAI("seo", prompt, {
    businessId,
    systemMessage:
      "You are an SEO and GEO optimization expert. Return only JSON.",
    isJson: true,
    responseSchema,
  });
}

export async function generateBlogPost(topic: string, businessName: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  let businessId: string | undefined;

  // Simple credit usage
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();
    businessId = profile?.business_id;
    if (businessId) {
      const model = await resolveModelOption("blog", businessId);
      const baseCost = 1; // Base for Blog
      const { error: creditError } = await supabase.rpc("increment_ai_usage", {
        biz_id: businessId,
        amount: baseCost * model.costLevel,
        use_case_name: "blog",
        model_name: model.id,
      });
      if (creditError && creditError.code !== "42703") {
        console.warn("Credit tracking failed:", creditError);
      }
    }
  } catch (err) {
    console.warn("Credit tracking failed (exception):", err);
  }

  const prompt = `Write a professional blog post about "${topic}" for a business named "${businessName}". 
    Include a title, an excerpt, and the full content in Markdown format. 
    The content should be SEO optimized and engaging.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      excerpt: { type: Type.STRING },
      content: { type: Type.STRING },
    },
    required: ["title", "excerpt", "content"],
  };

  return await askAI("blog", prompt, {
    businessId,
    systemMessage: "You are a professional blog writer. Return only JSON.",
    isJson: true,
    responseSchema,
  });
}

export async function generateMarketingContent(
  type: "ad_copy" | "seo_audit",
  businessInfo: any,
) {
  const model = await resolveModelOption("marketing", businessInfo.id);

  // Credit usage
  try {
    if (businessInfo.id) {
      const baseCost = 2; // Base for marketing
      const { error: creditError } = await supabase.rpc("increment_ai_usage", {
        biz_id: businessInfo.id,
        amount: baseCost * model.costLevel,
        use_case_name: "marketing",
        model_name: model.id,
      });
      if (creditError && creditError.code !== "42703") {
        console.warn("Credit tracking failed:", creditError);
      }
    }
  } catch (err) {
    console.warn("Credit tracking failed (exception):", err);
  }

  const prompt =
    type === "ad_copy"
      ? `Generate 3 variations of Facebook and Google Ad copy for the following business:
       Name: "${businessInfo.name}"
       Industry: "${businessInfo.industry}"
       Description: "${businessInfo.description}"
       Location: "${businessInfo.location}"
       
       Include headlines and primary text for each variation.`
      : `Perform a DECISIVE and COMPREHENSIVE SEO Audit for the following business website:
       
       BUSINESS PROFILE:
       Name: "${businessInfo.name}"
       Industry: "${businessInfo.industry}"
       Description: "${businessInfo.description}"
       Location: "${businessInfo.location}"
       Target Audience: "${businessInfo.targetAudience}"
       
       CURRENT WEBSITE SEO SETTINGS:
       Title: "${businessInfo.currentSeo?.title || "Not Set"}"
       Description: "${businessInfo.currentSeo?.description || "Not Set"}"
       Keywords: "${(businessInfo.currentSeo?.keywords || []).join(", ") || "None"}"
       
       AUDIT REQUIREMENTS:
       1. SEO Score (0-100): Be honest but critical. 100 means perfect alignment with "Best [Industry] in [Location]" patterns.
       2. Critical Issues: Identify exactly 5 specific failures. If the Title doesn't include both the Brand and the Location, it's a failure. If the Description is under 120 chars, it's a failure.
       3. Fixable Solutions: For each issue, provide a "solution" which is the EXACT optimized string to replace the current faulty setting.
          - Mark "isFixable: true" ONLY for Meta Title, Meta Description, or Keywords.
          - "fixType" must be "title", "description", or "keywords".
       4. Goal: After applying these 5 fixes, the resulting SEO should be near-perfect. Do not hold back improvements for future rounds.
       5. Optimization Opportunities: 5 high-level strategic suggestions.
       6. Recommended Keywords: 10 high-intent long-tail keywords.
       7. Performance Summary: A concise explanation of the current standing versus potential.`;

  const responseSchema =
    type === "ad_copy"
      ? {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  primaryText: { type: Type.STRING },
                },
              },
            },
          },
        }
      : {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            criticalIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  issue: { type: Type.STRING },
                  solution: { type: Type.STRING },
                  isFixable: { type: Type.BOOLEAN },
                  fixType: {
                    type: Type.STRING,
                    enum: ["title", "description", "keywords", "other"],
                  },
                },
                required: ["issue", "solution", "isFixable"],
              },
            },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: { type: Type.STRING },
          },
        };

  return await askAI("marketing", prompt, {
    businessId: businessInfo.id,
    systemMessage: "You are a marketing and SEO expert. Return only JSON.",
    isJson: true,
    responseSchema,
  });
}

export async function generateChatResponse(
  messages: { role: "user" | "ai"; content: string }[],
  context: string,
  businessId?: string,
) {
  const model = await resolveModelOption("chatbot", businessId);

  // Credit usage
  try {
    if (businessId) {
      const baseCost = 0.5; // Base for Chat
      // Using Math.max(1, ...) since we don't support fractional credits in the DB usually
      const totalCost = Math.max(1, Math.round(baseCost * model.costLevel));
      const { error: creditError } = await supabase.rpc("increment_ai_usage", {
        biz_id: businessId,
        amount: totalCost,
        use_case_name: "chatbot",
        model_name: model.id,
      });
      if (creditError && creditError.code !== "42703") {
        console.warn("Credit tracking failed:", creditError);
      }
    }
  } catch (err) {
    console.warn("Credit tracking failed (exception):", err);
  }

  if (model.provider === "deepseek") {
    const deepseekMessages = [
      { role: "system", content: context },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];
    return await callDeepSeek(model.id, deepseekMessages);
  }

  const contents = [
    { role: "user", parts: [{ text: context }] },
    {
      role: "model",
      parts: [
        {
          text: "Understood. I am ready to assist as an AI agent for this business.",
        },
      ],
    },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const result = await ai.models.generateContent({
      model: model.id,
      contents,
    });
    return result.text || "";
  } catch (error) {
    console.error("Chat response generation error:", error);
    throw error;
  }
}
