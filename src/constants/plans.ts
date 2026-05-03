export interface Plan {
  id: "starter" | "growth" | "premium";
  name: string;
  price: string;
  priceId: string; // Stripe Price ID
  productId: string; // Stripe Product ID
  description: string;
  features: string[]; // For UI Display
  enabled_features: string[]; // For system gating
  isPopular?: boolean;
  aiCredits: number;
  maxPages: number;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$59",
    priceId: "price_starter_id",
    productId: "prod_starter_id",
    description: "Perfect for small businesses",
    aiCredits: 25,
    maxPages: 3,
    features: [
      "AI Growth Engine (Legacy Synthesis)",
      "Lead CRM & Sales Hub",
      "Advanced Growth Analytics",
      "Review Management System",
      "Enterprise Edge CDN",
    ],
    enabled_features: [
      "ai_synthesis",
      "analytics",
      "lead_crm",
      "review_management",
      "advanced_seo",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    isPopular: true,
    priceId: "price_growth_id",
    productId: "prod_growth_id",
    description: "Convert visitors into leads",
    aiCredits: 100,
    maxPages: 10,
    features: [
      "Everything in Starter",
      "Appointment Booking System",
      "E-commerce Infrastructure",
      "Multi-page Architecture",
      "Advanced SEO Protocols",
    ],
    enabled_features: [
      "ai_synthesis",
      "analytics",
      "lead_crm",
      "booking",
      "advanced_seo",
      "review_management",
      "ecommerce",
    ],
  },
  {
    id: "premium",
    name: "Pro / Elite",
    price: "$399",
    priceId: "price_premium_id",
    productId: "prod_premium_id",
    description: "Scale your enterprise",
    aiCredits: 500,
    maxPages: 50,
    features: [
      "Everything in Growth",
      "Custom automation chains",
      "AI Support Chatbot",
      "Affiliate Program Engine",
      "Priority Support Node",
      "Custom Domain Orchestration",
    ],
    enabled_features: [
      "ai_synthesis",
      "analytics",
      "lead_crm",
      "booking",
      "advanced_seo",
      "review_management",
      "automation",
      "ecommerce",
      "priority_support",
      "ai_chatbot",
      "affiliate_system",
      "custom_domain",
      "local_seo_geo",
    ],
  },
];
