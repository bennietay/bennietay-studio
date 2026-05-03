/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | "super_admin"
  | "business_admin"
  | "client"
  | "affiliate"
  | "staff";

export type FeatureId =
  | "ai_synthesis"
  | "lead_crm"
  | "booking"
  | "automation"
  | "ecommerce"
  | "analytics"
  | "custom_domain"
  | "priority_support"
  | "ai_chatbot"
  | "review_management"
  | "advanced_seo"
  | "local_seo_geo"
  | "affiliate_system";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  businessId?: string;
  onboardingCompleted?: boolean;
  status?: "active" | "suspended";
  createdAt: number;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  plan: "starter" | "growth" | "premium";
  status: "active" | "inactive";
  industry?: string;
  businessNature?: string;
  location?: string;
  subdomain?: string;
  customDomain?: string;
  businessType?: string;
  aiCredits: number;
  aiCreditsUsed: number;
  trialEndsAt: number;
  gaMeasurementId?: string;
  metaPixelId?: string;
  trackingScriptsHeader?: string;
  trackingScriptsFooter?: string;
  aiModelConfig?: Record<string, string>;
  marketingStatus?: "none" | "trialing" | "active" | "expired";
  marketingTrialEndsAt?: number;
  marketingPlan?: "none" | "active";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;
  stripeConnectedAccountId?: string;
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled";
  earlySubscriptionDate?: number;
  nextBillingDate?: number;
  createdAt: number;
}

export interface WebsiteSection {
  id: string;
  type:
    | "hero"
    | "services"
    | "testimonials"
    | "pricing"
    | "faq"
    | "contact"
    | "about"
    | "features"
    | "problem"
    | "solution"
    | "benefits"
    | "proof"
    | "cta"
    | "appointment"
    | "blog_list"
    | "blog_post"
    | "text_content"
    | "team"
    | "product_list";
  content: any;
  isVisible?: boolean;
  settings?: {
    backgroundColor?: string;
    bgColor?: string;
    textColor?: string;
    padding?: string;
    verticalPadding?: "none" | "small" | "medium" | "large" | "xlarge";
    horizontalPadding?: "none" | "small" | "medium" | "large";
    useCustomPadding?: boolean;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    backgroundImage?: string;
    isContained?: boolean;
    textAlign?: "left" | "center" | "right";
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    brandVoice?: string;
  };
}

export interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  sections: WebsiteSection[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    favicon?: string;
    canonicalUrl?: string;
    // GEO & Local SEO Overrides
    region?: string;
    placename?: string;
    latitude?: string;
    longitude?: string;
    businessType?: string;
    address?: string;
    phone?: string;
    openingHours?: string[];
    priceRange?: string;
    // GEO (Generative Engine Optimization)
    brandVoice?: string;
    coreValueProposition?: string;
    targetAudience?: string;
  };
}

export interface Website {
  id: string;
  businessId: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoUrl?: string;
    style?:
      | "modern"
      | "neumorphic"
      | "glassmorphic"
      | "brutalist"
      | "editorial"
      | "action"
      | "immersive"
      | "authority"
      | "corporate"
      | "prestige"
      | "luxury_dark";
    customSelectors?: {
      id: string;
      selector: string;
      css?: string;
      content?: string;
      isEnabled: boolean;
    }[];
    footer?: {
      showMenu: boolean;
      showSocials: boolean;
      showContact: boolean;
      customText?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactAddress?: string;
      socialLinks?: {
        platform:
          | "facebook"
          | "twitter"
          | "instagram"
          | "linkedin"
          | "youtube"
          | "tiktok";
        url: string;
        isVisible?: boolean;
      }[];
    };
  };
  pages: WebsitePage[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    favicon?: string;
    ogImage?: string;
    canonicalUrl?: string;
    // GEO & Local SEO
    region?: string;
    placename?: string;
    latitude?: string;
    longitude?: string;
    businessType?: string;
    address?: string;
    phone?: string;
    openingHours?: string[];
    priceRange?: string;
    ratingValue?: number;
    reviewCount?: number;
    // GEO (Generative Engine Optimization)
    brandVoice?: string;
    targetAudience?: string;
    coreValueProposition?: string;
    knowledgeBaseSummary?: string;
  };
  status: "published" | "draft";
  updatedAt: number;
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  status: "new" | "contacted" | "closed";
  createdAt: number;
}

export interface BlogPost {
  id: string;
  businessId: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  status: "published" | "draft";
  createdAt: number;
  updatedAt: number;
  imageUrl?: string;
  slug?: string;
}

export interface AnalyticEvent {
  id: string;
  websiteId: string;
  eventType: "page_view" | "click";
  path: string;
  timestamp: number;
  metadata?: any;
}

export interface Appointment {
  id: string;
  businessId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateProgram {
  id: string;
  businessId: string;
  isEnabled: boolean;
  baseCommissionRate: number;
  payoutMinimum: number;
  cookieDurationDays: number;
  termsAndConditions?: string;
  createdAt: number;
}

export interface CommissionTier {
  id: string;
  programId: string;
  name: string;
  commissionRate: number;
  requirementType: "total_sales" | "referral_count" | "revenue_generated";
  requirementValue: number;
}

export interface Affiliate {
  id: string;
  uid: string;
  businessId: string;
  referralCode: string;
  status: "pending" | "active" | "suspended";
  totalEarnings: number;
  unpaidEarnings: number;
  totalReferrals: number;
  createdAt: number;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  status: "pending" | "converted" | "cancelled";
  commissionAmount: number;
  saleAmount?: number;
  createdAt: number;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  amount: number;
  status: "pending" | "processed" | "failed";
  paymentMethod?: string;
  processedAt?: number;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  businessId: string;
  title: string;
  message: string;
  type: "lead" | "appointment" | "payout" | "system" | "billing";
  isRead: boolean;
  metadata?: any;
  createdAt: number;
}
