import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Business } from "../types";

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

export function useFeatures() {
  const { profile, user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [planSettings, setPlanSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.businessId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch business to get current plan
        const { data: bData } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", profile.businessId)
          .single();

        if (bData) {
          setBusiness({
            id: bData.id,
            name: bData.name,
            ownerId: bData.owner_id,
            plan: bData.plan,
            status: bData.status,
            industry: bData.industry,
            businessNature: bData.business_nature,
            location: bData.location,
            subdomain: bData.subdomain,
            customDomain: bData.custom_domain,
            trialEndsAt: bData.trial_ends_at
              ? new Date(bData.trial_ends_at).getTime()
              : undefined,
            stripeCustomerId: bData.stripe_customer_id,
            stripeSubscriptionId: bData.stripe_subscription_id,
            subscriptionStatus: bData.subscription_status,
            aiCredits: bData.ai_credits || 0,
            aiCreditsUsed: bData.ai_credits_used || 0,
            createdAt: new Date(bData.created_at).getTime(),
          });
        }

        // Fetch plan settings
        const { data: sData } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "plans")
          .single();

        if (sData) {
          setPlanSettings(sData.content.pricing || []);
        }
      } catch (error) {
        console.error("Error fetching feature data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile?.businessId]);

  const isFeatureEnabled = (featureId: FeatureId): boolean => {
    if (
      profile?.role === "super_admin" ||
      profile?.email === "bennie.tayhh@gmail.com"
    )
      return true;
    if (!business || !planSettings.length) return false;

    const currentPlan = planSettings.find((p) => p.id === business.plan);
    if (!currentPlan) return false;

    return (currentPlan.enabled_features || []).includes(featureId);
  };

  return { isFeatureEnabled, loading, business, planSettings };
}
