import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Zap, Shield, Star, Globe } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { PLANS as STATIC_PLANS, Plan } from "../constants/plans";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PricingProps {
  currentPlan?: string;
  onSelectPlan?: (plan: Plan) => void;
  isDashboard?: boolean;
}

export const Pricing: React.FC<PricingProps> = ({
  currentPlan,
  onSelectPlan,
  isDashboard,
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoDiscount, setGeoDiscount] = useState<{
    percentage: number;
    country: string;
    couponId?: string;
  } | null>(null);

  React.useEffect(() => {
    const fetchGeoPricing = async () => {
      try {
        // 1. Detect location
        const geoRes = await fetch("https://ipapi.co/json/");
        const geoData = await geoRes.json();

        if (geoData.country_code) {
          // 2. Fetch discount for this country
          const { data, error } = await supabase
            .from("geo_pricing")
            .select("discount_percentage, country_name, stripe_coupon_id")
            .eq("country_code", geoData.country_code)
            .eq("is_enabled", true)
            .single();

          if (data && data.discount_percentage > 0) {
            setGeoDiscount({
              percentage: data.discount_percentage,
              country: data.country_name || geoData.country_name,
              couponId: data.stripe_coupon_id,
            });
          }
        }
      } catch (err) {
        console.warn(
          "Geo-pricing detection failed or was blocked by ad-blocker:",
          err,
        );
      }
    };

    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "plans")
          .single();

        if (data?.content?.pricing) {
          setPlans(data.content.pricing);
        } else {
          setPlans(STATIC_PLANS);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setPlans(STATIC_PLANS);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoPricing();
    fetchPlans();

    const channel = supabase
      .channel(`pricing-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: "id=eq.plans",
        },
        (payload) => {
          if (payload.new)
            setPlans((payload.new as any).content.pricing || STATIC_PLANS);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelect = async (plan: Plan) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
      return;
    }

    if (!profile) {
      toast.error("Please sign in to choose a plan");
      return;
    }

    if (!plan.priceId || !plan.priceId.startsWith("price_")) {
      toast.error(
        "This plan is not correctly configured with a Stripe Price ID. Please contact the Support.",
      );
      return;
    }

    try {
      // Test account bypass for plan switching
      if (profile.email === "bennie.tayhh@gmail.com") {
        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            plan: plan.id,
            status: "active",
            subscription_status: "active",
          })
          .eq("id", profile.businessId);

        if (updateError) throw updateError;
        toast.success(`Plan bypassed to ${plan.name} for test account`);
        window.location.reload(); // Refresh to update feature gates
        return;
      }

      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const token = authSession?.access_token;

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          businessId: profile.businessId,
          customerEmail: profile.email,
          couponId: geoDiscount?.couponId, // Pass the localized coupon if it exists
        }),
      });

      const stripeSession = await response.json();

      if (stripeSession.url) {
        window.location.href = stripeSession.url;
      } else {
        throw new Error(
          stripeSession.error || "Failed to create checkout session",
        );
      }
    } catch (error: any) {
      console.error("Stripe error:", error);
      const message = error.message || "";
      if (
        message.includes("STRIPE_SECRET_KEY") ||
        message.includes("STRIPE_CONFIG_MISSING") ||
        message.includes("STRIPE_INVALID_KEY")
      ) {
        toast.error(
          "Payment system not configured or invalid key. Please contact the Support.",
        );
      } else if (message.includes("STRIPE_INVALID_PRICE_ID")) {
        toast.error("Invalid Plan Configuration. Please contact the Support.");
      } else {
        toast.error(message || "Something went wrong with the payment process");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const calculatePrice = (planPrice: string) => {
    if (!geoDiscount) return planPrice;

    // Extract numeric value from $ price string
    const priceNum = parseFloat(planPrice.replace("$", ""));
    if (isNaN(priceNum)) return planPrice;

    const discounted = priceNum * (1 - geoDiscount.percentage / 100);
    return `$${Math.round(discounted)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={plan.isPopular ? "md:-mt-4 md:mb-4" : ""}
          >
            <Card
              className={`relative h-full flex flex-col overflow-hidden border-2 transition-all duration-300 ${
                plan.isPopular
                  ? "border-indigo-600 shadow-2xl shadow-indigo-200 scale-100 md:scale-105 z-10"
                  : "border-slate-100 hover:shadow-xl"
              }`}
            >
              {plan.isPopular && (
                <div className="bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] py-2 text-center">
                  Recommended Choice
                </div>
              )}

              <CardHeader className={`pb-8 ${plan.isPopular ? "pt-6" : ""}`}>
                {plan.isPopular && (
                  <Badge className="w-fit mb-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none rounded-lg px-2 py-0.5 text-[10px] font-bold">
                    MOST POPULAR
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === "starter" && (
                    <Shield className="h-5 w-5 text-slate-400" />
                  )}
                  {plan.id === "growth" && (
                    <Zap className="h-5 w-5 text-indigo-600" />
                  )}
                  {plan.id === "premium" && (
                    <Star className="h-5 w-5 text-amber-500" />
                  )}
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-500 min-h-[40px]">
                  {plan.description}
                </CardDescription>
                <div className="mt-6 flex flex-col">
                  {geoDiscount && (
                    <div className="flex items-center gap-2 mb-[-2px]">
                      <span className="text-sm line-through text-slate-300 font-medium ml-1">
                        {plan.price}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[9px] font-bold px-1.5 py-0">
                        {geoDiscount.percentage}% OFF
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight text-slate-900">
                      {calculatePrice(plan.price)}
                    </span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    AI Credits
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold"
                  >
                    {plan.aiCredits} Generations/mo
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-600"
                    >
                      <div className="mt-1 bg-indigo-50 rounded-full p-0.5">
                        <Check className="h-3 w-3 text-indigo-600" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-8">
                <Button
                  className={`w-full h-12 rounded-xl text-lg font-bold transition-all duration-300 ${
                    plan.isPopular
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      : plan.id === "premium"
                        ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-100"
                        : "bg-slate-900 hover:bg-slate-800"
                  } ${currentPlan === plan.id ? "opacity-50 cursor-default" : ""}`}
                  onClick={() => handleSelect(plan)}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? "Current Plan" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
