/**
 * AI Model Constants and Configuration
 * Provides centralized management for Gemini model versions and use-case optimization.
 */

export type AIUseCase = "synthesis" | "seo" | "chatbot" | "blog" | "marketing";
export type AIProvider = "gemini" | "deepseek";

export interface AIModelOption {
  id: string;
  provider: AIProvider;
  name: string;
  description: string;
  tier: "lite" | "flash" | "pro" | "expert";
  costLevel: number; // 1 to 5
  recommendedFor: AIUseCase[];
  thinkingLevel?: "HIGH" | "LOW" | "MINIMAL";
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: "gemini-3.1-flash-lite-preview",
    provider: "gemini",
    name: "Gemini 3.1 Flash Lite",
    description: "Ultra-fast, lowest cost model for small, routine tasks.",
    tier: "lite",
    costLevel: 1,
    recommendedFor: ["chatbot"],
    thinkingLevel: "MINIMAL",
  },
  {
    id: "gemini-3-flash-preview",
    provider: "gemini",
    name: "Gemini 3 Flash",
    description: "Quick previews and simple updates.",
    tier: "flash",
    costLevel: 2,
    recommendedFor: ["synthesis", "marketing", "chatbot"],
    thinkingLevel: "LOW",
  },
  {
    id: "gemini-3.1-pro-preview",
    provider: "gemini",
    name: "Gemini 3.1 Pro",
    description: "Most powerful Gemini model for complex reasoning.",
    tier: "pro",
    costLevel: 5,
    recommendedFor: ["seo", "synthesis"],
    thinkingLevel: "HIGH",
  },
  {
    id: "deepseek-chat",
    provider: "deepseek",
    name: "DeepSeek V3 Pro",
    description: "Bulk SEO and high-quality blog content.",
    tier: "pro",
    costLevel: 3,
    recommendedFor: ["blog", "marketing", "chatbot"],
    thinkingLevel: "HIGH",
  },
  {
    id: "deepseek-reasoner",
    provider: "deepseek",
    name: "DeepSeek R1 Expert",
    description: "Deep reasoning for complex strategy.",
    tier: "expert",
    costLevel: 4,
    recommendedFor: ["seo", "synthesis"],
    thinkingLevel: "HIGH",
  },
];

export const DEFAULT_MODEL_CONFIG: Record<AIUseCase, string> = {
  synthesis: "gemini-3-flash-preview",
  seo: "gemini-3.1-pro-preview",
  chatbot: "gemini-3.1-flash-lite-preview",
  blog: "gemini-3-flash-preview",
  marketing: "gemini-3-flash-preview",
};

export const USE_CASE_LABELS: Record<AIUseCase, string> = {
  synthesis: "Website Synthesis",
  seo: "SEO & GEO Strategy",
  chatbot: "AI Customer Assistant",
  blog: "Content & Blogging",
  marketing: "Marketing & Ad Copy",
};
