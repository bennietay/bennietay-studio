/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PLANS as STATIC_PLANS } from "../constants/plans";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { toast } from "sonner";

const PlanEditor = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const AVAILABLE_FEATURES = [
    { id: "ai_synthesis", label: "AI Growth Engine" },
    { id: "lead_crm", label: "Lead CRM" },
    { id: "booking", label: "Booking System" },
    { id: "automation", label: "Email/SMS Automation" },
    { id: "ecommerce", label: "E-commerce Architecture" },
    { id: "analytics", label: "Advanced Analytics" },
    { id: "custom_domain", label: "Custom Domain" },
    { id: "priority_support", label: "Priority Support" },
    { id: "ai_chatbot", label: "AI Support Chatbot" },
    { id: "review_management", label: "Review Management" },
    { id: "affiliate_system", label: "Affiliate System" },
    { id: "advanced_seo", label: "Advanced SEO (Favicon, OG images)" },
    { id: "local_seo_geo", label: "Local SEO & Geo-Pricing" },
  ];

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();

    const channel = supabase
      .channel(`plan-editor-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: "id=eq.plans",
        },
        (payload) => {
          if (payload.new) setPlans((payload.new as any).content.pricing || []);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async () => {
    const invalidPlans = plans.filter(
      (p) => p.priceId && !p.priceId.startsWith("price_"),
    );
    if (invalidPlans.length > 0) {
      toast.warning(
        `Warning: ${invalidPlans.length} plan(s) have Price IDs that don't start with "price_". These may fail during checkout.`,
      );
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        id: "plans",
        content: { pricing: plans },
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Plans updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update plans");
    } finally {
      setSaving(false);
    }
  };

  const addPlan = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newPlan = {
      id: newId,
      name: "New Plan",
      price: "$0/mo",
      description: "New subscription tier description",
      productId: "",
      priceId: "",
      aiCredits: 10,
      maxPages: 3,
      features: ["Basic feature"],
      enabled_features: ["ai_synthesis"],
      isPopular: false,
    };
    setPlans([...plans, newPlan]);
  };

  const removePlan = (index: number) => {
    if (
      !confirm(
        "Are you sure you want to remove this plan? This will NOT affect existing subscribers but new users won't be able to select it.",
      )
    )
      return;
    const newPlans = plans.filter((_, i) => i !== index);
    setPlans(newPlans);
  };

  const updatePlan = (index: number, field: string, value: any) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPlans(newPlans);
  };

  const toggleFeature = (planIndex: number, featureId: string) => {
    const newPlans = [...plans];
    const enabled = newPlans[planIndex].enabled_features || [];
    if (enabled.includes(featureId)) {
      newPlans[planIndex].enabled_features = enabled.filter(
        (id: string) => id !== featureId,
      );
    } else {
      newPlans[planIndex].enabled_features = [...enabled, featureId];
    }
    setPlans(newPlans);
  };

  const updateFeature = (
    planIndex: number,
    featureIndex: number,
    value: string,
  ) => {
    const newPlans = [...plans];
    const newFeatures = [...newPlans[planIndex].features];
    newFeatures[featureIndex] = value;
    newPlans[planIndex] = { ...newPlans[planIndex], features: newFeatures };
    setPlans(newPlans);
  };

  const addFeature = (planIndex: number) => {
    const newPlans = [...plans];
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      features: [...newPlans[planIndex].features, ""],
    };
    setPlans(newPlans);
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    const newPlans = [...plans];
    newPlans[planIndex].features = newPlans[planIndex].features.filter(
      (_: any, i: number) => i !== featureIndex,
    );
    setPlans(newPlans);
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Subscription Plans
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure global pricing tiers and feature access.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={addPlan}
            className="rounded-xl gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add New Plan
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Plans
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan, planIndex) => (
          <Card
            key={plan.id}
            className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative group"
          >
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white shadow-md border-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 hover:text-red-600"
              onClick={() => removePlan(planIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <CardHeader className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Plan ID (Internal)
                  </Label>
                  <Input
                    value={plan.id}
                    onChange={(e) =>
                      updatePlan(planIndex, "id", e.target.value)
                    }
                    className="rounded-xl h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    Status
                  </Label>
                  <div className="flex items-center gap-2 pt-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Plan Name</Label>
                <Input
                  value={plan.name}
                  onChange={(e) =>
                    updatePlan(planIndex, "name", e.target.value)
                  }
                  className="rounded-xl font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price Display</Label>
                <Input
                  value={plan.price}
                  onChange={(e) =>
                    updatePlan(planIndex, "price", e.target.value)
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={plan.description}
                  onChange={(e) =>
                    updatePlan(planIndex, "description", e.target.value)
                  }
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Stripe Product ID
                  </Label>
                  <Input
                    value={plan.productId || ""}
                    onChange={(e) =>
                      updatePlan(planIndex, "productId", e.target.value)
                    }
                    placeholder="prod_..."
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Stripe Price ID
                  </Label>
                  <Input
                    value={plan.priceId || ""}
                    onChange={(e) =>
                      updatePlan(planIndex, "priceId", e.target.value)
                    }
                    placeholder="price_..."
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>AI Credits (Gens/mo)</Label>
                  <Input
                    type="number"
                    value={plan.aiCredits || 0}
                    onChange={(e) =>
                      updatePlan(
                        planIndex,
                        "aiCredits",
                        parseInt(e.target.value),
                      )
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Pages</Label>
                  <Input
                    type="number"
                    value={plan.maxPages || 1}
                    onChange={(e) =>
                      updatePlan(
                        planIndex,
                        "maxPages",
                        parseInt(e.target.value),
                      )
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Limits for AI tasks and total website pages.
              </p>
              <div className="space-y-1.5 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-indigo-600">
                    Most Popular Plan
                  </Label>
                  <Switch
                    checked={!!plan.isPopular}
                    onCheckedChange={(checked) =>
                      updatePlan(planIndex, "isPopular", checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Enabled Features (System)
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <span className="text-xs font-medium">
                        {feature.label}
                      </span>
                      <Switch
                        checked={(plan.enabled_features || []).includes(
                          feature.id,
                        )}
                        onCheckedChange={() =>
                          toggleFeature(planIndex, feature.id)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Display Features (UI)
                </Label>
                <div className="space-y-2">
                  {plan.features.map(
                    (feature: string, featureIndex: number) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={feature}
                          onChange={(e) =>
                            updateFeature(
                              planIndex,
                              featureIndex,
                              e.target.value,
                            )
                          }
                          className="rounded-xl text-xs h-8"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeFeature(planIndex, featureIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-dashed h-8 text-xs"
                    onClick={() => addFeature(planIndex)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Feature
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanEditor;
