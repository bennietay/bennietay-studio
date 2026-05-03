import { WebsitePage, WebsiteSection } from "../types";
import { SECTION_TEMPLATES } from "./sectionTemplates";

export interface NicheSection extends Omit<WebsiteSection, "id"> {}

export interface NichePage extends Omit<WebsitePage, "id" | "sections"> {
  sections: NicheSection[];
}

export interface NicheTemplate {
  id: string; // Must be a valid UUID for database sync
  name: string;
  description: string;
  thumbnail?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    style: string;
    defaultStyle?: string;
  };
  category?: string;
  pages: NichePage[];
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    businessType?: string;
  };
}

const createSection = (type: string, overrides: any = {}): NicheSection => {
  const template = SECTION_TEMPLATES[type];
  if (!template) throw new Error(`Template not found for type: ${type}`);
  return {
    ...template,
    content: {
      ...template.content,
      ...overrides,
    },
  };
};

export const NICHE_TEMPLATES: Record<string, NicheTemplate> = {
  "Editorial Clean": {
    id: "802d8471-15fe-4f80-9993-8472504620f3",
    name: "Editorial Clean",
    description:
      "Premium, high-trust design for Medical, Legal, and Wellness professionals.",
    thumbnail:
      "https://images.unsplash.com/photo-1505751172107-59ec9c6adfd7?auto=format&fit=crop&q=80&w=800",
    theme: {
      primaryColor: "#0f172a",
      secondaryColor: "#fcfaf7",
      fontFamily: "'Playfair Display', serif",
      style: "editorial",
      defaultStyle: "editorial",
    },
    category: "Professional",
    seo: {
      title: "Executive Counsel | Precision & Heritage",
      description:
        "Bespoke professional services for high-stakes environments.",
      keywords: ["consulting", "legal", "executive", "premium"],
      businessType: "ProfessionalService",
    },
    pages: [
      {
        title: "Home",
        slug: "",
        sections: [
          createSection("hero", {
            headline: "Precision. Heritage. Discretion.",
            subheadline:
              "Defining the standard of professional excellence through rigorous strategy and personal dedication.",
            ctaText: "Request Confidential Briefing",
            imageUrl:
              "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920",
          }),
          createSection("benefits", {
            title: "The Pillars of Our Practice",
            items: [
              {
                title: "Rigorous Standards",
                description:
                  "Uncompromising attention to detail in every engagement.",
              },
              {
                title: "Global Perspective",
                description:
                  "Strategic insights derived from a world-class network.",
              },
              {
                title: "Personal Legacy",
                description: "We build partnerships that span generations.",
              },
            ],
          }),
          createSection("proof", {
            title: "Proven Excellence",
            stats: [
              { label: "Assets Under Strategy", value: "$4.2B" },
              { label: "Client Retention", value: "98%" },
              { label: "Experience", value: "25+ Yrs" },
            ],
          }),
          createSection("testimonials", {
            items: [
              {
                name: "Sir Richard Helms",
                role: "Global Chairman",
                text: "The only firm that truly understands the intersection of strategy and discretion.",
              },
            ],
          }),
          createSection("cta", {
            title: "Establish Your Legacy",
            description:
              "Partner with the elite architects of professional success.",
            buttonText: "Inquire Now",
          }),
        ],
      },
    ],
  },
  "Silicon Vanguard": {
    id: "3e2d8471-15fe-4f80-9993-847250462abc",
    name: "Silicon Vanguard",
    description:
      "Ultra-modern, high-performance design for Tech, SaaS, and AI startups.",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    theme: {
      primaryColor: "#6366f1",
      secondaryColor: "#ffffff",
      fontFamily: "'Space Grotesk', sans-serif",
      style: "modern",
      defaultStyle: "modern",
    },
    category: "Tech",
    seo: {
      title: "The Future of Execution | Next-Gen AI Platform",
      description: "Scale faster with autonomous growth infrastructure.",
      keywords: ["ai", "saas", "tech", "automation"],
      businessType: "SoftwareApplication",
    },
    pages: [
      {
        title: "Home",
        slug: "",
        sections: [
          createSection("hero", {
            headline: "Execute at the Speed of Thought",
            subheadline:
              "The world's most advanced infrastructure for high-growth tech enterprises. Fully autonomous. Zero friction.",
            ctaText: "Deploy Now",
            imageUrl:
              "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920",
          }),
          createSection("solution", {
            title: "Autonomous Intelligence",
            description:
              "We've removed the bottlenecks between vision and deployment.",
            features: ["Cloud Native", "Edge Optimized", "AI Powered"],
          }),
          createSection("benefits", {
            title: "Engineered for Velocity",
            items: [
              {
                title: "Zero Latency",
                description: "Instant response times across global markets.",
              },
              {
                title: "Infinite Scale",
                description:
                  "Our infrastructure grows as fast as your ambition.",
              },
              {
                title: "Military Grade",
                description: "Hardened security protocols at every node.",
              },
            ],
          }),
        ],
      },
    ],
  },
  "Wellness Reserve": {
    id: "9f3d8471-15fe-4f80-9993-847250462def",
    name: "Wellness Reserve",
    description:
      "Serene, sophisticated design for Luxury Spas, Wellness Retreats, and Boutiques.",
    thumbnail:
      "https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=80&w=800",
    theme: {
      primaryColor: "#78350f",
      secondaryColor: "#fffbeb",
      fontFamily: "'Fraunces', serif",
      style: "immersive",
      defaultStyle: "immersive",
    },
    category: "Wellness",
    seo: {
      title: "An Oasis of Calm | Luxury Wellness & Spa",
      description: "Reconnect with your essence in our sanctuary of serenity.",
      keywords: ["spa", "wellness", "luxury", "retreat"],
      businessType: "HealthAndBeautyBusiness",
    },
    pages: [
      {
        title: "Home",
        slug: "",
        sections: [
          createSection("hero", {
            headline: "Reconnect with Quietude",
            subheadline:
              "A sanctuary of stillness designed to restore your balance and elevate your well-being.",
            ctaText: "Begin Your Journey",
            imageUrl:
              "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1920",
          }),
          createSection("about", {
            title: "Our Philosophy",
            text: "We believe that true wellness is found in the moments between the noise. Our reserve offers a curated experience of tranquility, utilizing ancient wisdom and modern comforts.",
          }),
          createSection("services", {
            title: "Rituals of Restoration",
            items: [
              {
                title: "The Signature Journey",
                description: "A three-hour immersion into deep relaxation.",
              },
              {
                title: "Elemental Therapy",
                description:
                  "Harnessing the power of nature to restore balance.",
              },
              {
                title: "Mindful Escapes",
                description:
                  "Private retreats tailored to your internal state.",
              },
            ],
          }),
        ],
      },
    ],
  },
  "High-Contrast Action": {
    id: "5df47be5-46fd-4a27-be08-34863f6e9c9c",
    name: "High-Contrast Action",
    description:
      "Urgent Action design for Emergency Services and High-Velocity business.",
    thumbnail:
      "https://images.unsplash.com/photo-1581092921461-eab62e92c731?auto=format&fit=crop&q=80&w=800",
    theme: {
      primaryColor: "#ef4444",
      secondaryColor: "#0f172a",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      style: "action",
      defaultStyle: "action",
    },
    category: "Services",
    seo: {
      title: "Rapid Response Engineering | 24/7 Priority Support",
      description: "Critical infrastructure support. When every second counts.",
      keywords: ["emergency", "repair", "services", "urgent"],
      businessType: "HomeAndConstructionBusiness",
    },
    pages: [
      {
        title: "Home",
        slug: "",
        sections: [
          createSection("hero", {
            headline: "URGENT RESPONSE ACTIVE",
            subheadline: "ZERO DOWNTIME. ZERO FRICTION. WE ARE ON THE WAY.",
            ctaText: "CALL DISPATCH",
            imageUrl:
              "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1920",
          }),
          createSection("proof", {
            title: "Operational Status",
            stats: [
              { label: "Dispatch Speed", value: "12m" },
              { label: "Success Rate", value: "100%" },
              { label: "Active Nodes", value: "45" },
            ],
          }),
        ],
      },
    ],
  },
  "Elite Asset Reserve": {
    id: "a12d8471-15fe-4f80-9993-847250462fff",
    name: "Elite Asset Reserve",
    description:
      "Ultra-premium, multi-billion dollar feel for Wealth Management and Private Equity.",
    thumbnail:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#C5A059",
      fontFamily: "'Playfair Display', serif",
      style: "prestige",
      defaultStyle: "prestige",
    },
    category: "Finance",
    seo: {
      title: "The Reserve | Private Wealth Architecture",
      description:
        "Managing the world's most significant legacies with precision and absolute discretion.",
      keywords: [
        "wealth management",
        "private equity",
        "luxury finance",
        "family office",
      ],
      businessType: "FinancialService",
    },
    pages: [
      {
        title: "Home",
        slug: "",
        sections: [
          createSection("hero", {
            headline: "The Architecture of Sovereign Wealth",
            subheadline:
              "Where precision meets legacy. We curate and protect the capital of the world's most distinguished families.",
            ctaText: "Inquire for Access",
            imageUrl:
              "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920",
          }),
          createSection("proof", {
            title: "Managed Excellence",
            stats: [
              { label: "Assets Curated", value: "$12.5B" },
              { label: "Client Capacity", value: "Limited" },
              { label: "Global Offices", value: "08" },
            ],
          }),
          createSection("benefits", {
            title: "The Prestige Standard",
            items: [
              {
                title: "Absolute Discretion",
                description:
                  "Your legacy is protected by the highest standards of confidentiality.",
              },
              {
                title: "Bespoke Portfolios",
                description:
                  "Individually engineered strategies that transcend market volatility.",
              },
              {
                title: "Multigenerational Vision",
                description:
                  "Building wealth that endures beyond the current century.",
              },
            ],
          }),
        ],
      },
    ],
  },
};
