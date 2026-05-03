/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "./ui/card";
import {
  Gift,
  Users,
  CreditCard,
  ExternalLink,
  Settings,
  Plus,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Copy,
  Share2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AffiliateProgram, Affiliate, CommissionTier } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "./ui/select";

export function AffiliateProgramManager() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState<string | null>(
    null,
  );
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] =
    useState<Partial<CommissionTier> | null>(null);
  const [savingTier, setSavingTier] = useState(false);

  useEffect(() => {
    if (profile?.businessId) {
      fetchProgramData();
    }
  }, [profile?.businessId]);

  const fetchProgramData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Program
      const { data: progData } = await supabase
        .from("affiliate_programs")
        .select("*")
        .eq("business_id", profile?.businessId)
        .single();

      if (progData) {
        setProgram({
          id: progData.id,
          businessId: progData.business_id,
          isEnabled: progData.is_enabled,
          baseCommissionRate: progData.base_commission_rate,
          payoutMinimum: progData.payout_minimum,
          cookieDurationDays: progData.cookie_duration_days,
          termsAndConditions: progData.terms_and_conditions,
          createdAt: new Date(progData.created_at).getTime(),
        });

        // 2. Fetch Tiers
        const { data: tiersData } = await supabase
          .from("commission_tiers")
          .select("*")
          .eq("program_id", progData.id)
          .order("requirement_value", { ascending: true });

        if (tiersData)
          setTiers(
            tiersData.map((t) => ({
              id: t.id,
              programId: t.program_id,
              name: t.name,
              commissionRate: t.commission_rate,
              requirementType: t.requirement_type,
              requirementValue: t.requirement_value,
            })),
          );
      }

      // 3. Fetch Affiliates
      const { data: affsData } = await supabase
        .from("affiliates")
        .select("*")
        .eq("business_id", profile?.businessId);

      if (affsData)
        setAffiliates(
          affsData.map((a) => ({
            id: a.id,
            uid: a.uid,
            businessId: a.business_id,
            referralCode: a.referral_code,
            status: a.status,
            totalEarnings: Number(a.total_earnings),
            unpaidEarnings: Number(a.unpaid_earnings),
            totalReferrals: a.total_referrals,
            createdAt: new Date(a.created_at).getTime(),
          })),
        );

      // 4. Fetch Payouts
      const { data: paysData } = await supabase
        .from("affiliate_payouts")
        .select("*, affiliates(referral_code)")
        .eq("affiliates.business_id", profile?.businessId)
        .order("created_at", { ascending: false });

      if (paysData) setPayouts(paysData);
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProgram = async () => {
    if (!profile?.businessId) return;
    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .insert({
          business_id: profile.businessId,
          is_enabled: true,
          base_commission_rate: 10,
          payout_minimum: 50,
          cookie_duration_days: 30,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Affiliate program initialized!");
      fetchProgramData();
    } catch (error: any) {
      toast.error("Failed to initialize program: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateProgram = async (updates: Partial<AffiliateProgram>) => {
    if (!program) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("affiliate_programs")
        .update({
          is_enabled: updates.isEnabled ?? program.isEnabled,
          base_commission_rate:
            updates.baseCommissionRate ?? program.baseCommissionRate,
          payout_minimum: updates.payoutMinimum ?? program.payoutMinimum,
          cookie_duration_days:
            updates.cookieDurationDays ?? program.cookieDurationDays,
          terms_and_conditions:
            updates.termsAndConditions ?? program.termsAndConditions,
        })
        .eq("id", program.id);

      if (error) throw error;
      toast.success("Program settings updated");
      setProgram({ ...program, ...updates });
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    setIsProcessingPayout(payoutId);
    try {
      const { error } = await supabase.rpc("process_payout", {
        p_payout_id: payoutId,
      });
      if (error) throw error;
      toast.success("Payout marked as processed");
      fetchProgramData();
    } catch (error: any) {
      toast.error("Processing failed: " + error.message);
    } finally {
      setIsProcessingPayout(null);
    }
  };

  const handleSaveTier = async () => {
    if (
      !program ||
      !editingTier ||
      !editingTier.name ||
      !editingTier.commissionRate ||
      !editingTier.requirementValue
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSavingTier(true);
    try {
      const tierData = {
        program_id: program.id,
        name: editingTier.name,
        commission_rate: editingTier.commissionRate,
        requirement_type: editingTier.requirementType || "referral_count",
        requirement_value: editingTier.requirementValue,
      };

      if (editingTier.id) {
        const { error } = await supabase
          .from("commission_tiers")
          .update(tierData)
          .eq("id", editingTier.id);
        if (error) throw error;
        toast.success("Tier updated successfully");
      } else {
        const { error } = await supabase
          .from("commission_tiers")
          .insert(tierData);
        if (error) throw error;
        toast.success("New tier added");
      }

      setIsTierDialogOpen(false);
      setEditingTier(null);
      fetchProgramData();
    } catch (error: any) {
      toast.error("Failed to save tier: " + error.message);
    } finally {
      setSavingTier(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    try {
      const { error } = await supabase
        .from("commission_tiers")
        .delete()
        .eq("id", tierId);

      if (error) throw error;
      toast.success("Tier removed");
      fetchProgramData();
    } catch (error: any) {
      toast.error("Failed to remove tier: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gift className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Enable Affiliate Program
        </h2>
        <p className="text-slate-500 mb-8">
          Turn your customers into brand ambassadors. Incentivize referrals and
          grow your business through word-of-mouth.
        </p>
        <Button
          onClick={initializeProgram}
          disabled={isUpdating}
          className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Setup Affiliate Program
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Affiliate Management
          </h1>
          <p className="text-slate-500 mt-1">
            Configure your referral rules and track partner performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={program.isEnabled ? "default" : "outline"}
            className={program.isEnabled ? "bg-emerald-500" : "text-slate-400"}
          >
            {program.isEnabled ? "Program Active" : "Program Paused"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => updateProgram({ isEnabled: !program.isEnabled })}
            disabled={isUpdating}
            className="rounded-xl"
          >
            {program.isEnabled ? "Pause Program" : "Resume Program"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> Total Partners
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {affiliates.length}
            </CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-slate-50 mt-4 group-hover:bg-indigo-600 transition-colors" />
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Lifetime Sales
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              $
              {affiliates
                .reduce((acc, a) => acc + a.totalEarnings * 10, 0)
                .toFixed(0)}
            </CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-slate-50 mt-4 group-hover:bg-emerald-500 transition-colors" />
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" /> Pending Payouts
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              $
              {affiliates
                .reduce((acc, a) => acc + a.unpaidEarnings, 0)
                .toFixed(2)}
            </CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-slate-50 mt-4 group-hover:bg-amber-500 transition-colors" />
        </Card>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger
            value="settings"
            className="rounded-lg px-6 data-[state=active]:bg-white"
          >
            <Settings className="h-4 w-4 mr-2" /> Settings
          </TabsTrigger>
          <TabsTrigger
            value="partners"
            className="rounded-lg px-6 data-[state=active]:bg-white"
          >
            <Users className="h-4 w-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger
            value="tiers"
            className="rounded-lg px-6 data-[state=active]:bg-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" /> Commissions
          </TabsTrigger>
          <TabsTrigger
            value="payouts"
            className="rounded-lg px-6 data-[state=active]:bg-white"
          >
            <CreditCard className="h-4 w-4 mr-2" /> Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Program Configuration</CardTitle>
              <CardDescription>
                Adjust the basic rules for your affiliate program.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label>Base Commission Rate (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={program.baseCommissionRate}
                      onChange={(e) =>
                        setProgram({
                          ...program,
                          baseCommissionRate: Number(e.target.value),
                        })
                      }
                      className="rounded-xl h-12 pr-12 focus:ring-indigo-500"
                    />
                    <div className="absolute right-4 top-3 text-slate-400 font-bold">
                      %
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    The percentage paid to affiliates for each conversion.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Minimum Payout ($)</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-3 text-slate-400 font-bold">
                      $
                    </div>
                    <Input
                      type="number"
                      value={program.payoutMinimum}
                      onChange={(e) =>
                        setProgram({
                          ...program,
                          payoutMinimum: Number(e.target.value),
                        })
                      }
                      className="rounded-xl h-12 pl-8 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    The minimum balance required for an affiliate to request a
                    payout.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Cookie Duration (Days)</Label>
                  <Input
                    type="number"
                    value={program.cookieDurationDays}
                    onChange={(e) =>
                      setProgram({
                        ...program,
                        cookieDurationDays: Number(e.target.value),
                      })
                    }
                    className="rounded-xl h-12 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    How long a referral remains valid after a user clicks the
                    link.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Terms & Conditions</Label>
                <textarea
                  className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="Outline the rules for your partners..."
                  value={program.termsAndConditions || ""}
                  onChange={(e) =>
                    setProgram({
                      ...program,
                      termsAndConditions: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 flex justify-end py-4">
              <Button
                onClick={() => updateProgram(program)}
                disabled={isUpdating}
                className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700"
              >
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <Card className="rounded-2xl border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Partner Code</th>
                    <th className="px-6 py-4">Join Date</th>
                    <th className="px-6 py-4 text-center">Referrals</th>
                    <th className="px-6 py-4 text-right">Total Earned</th>
                    <th className="px-6 py-4 text-right">Pending</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {affiliates.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-slate-400 italic"
                      >
                        No partners joined yet.
                      </td>
                    </tr>
                  ) : (
                    affiliates.map((aff) => (
                      <tr
                        key={aff.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <code className="bg-slate-100 px-2 py-1 rounded text-indigo-600 font-bold">
                            {aff.referralCode}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(aff.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {aff.totalReferrals}
                        </td>
                        <td className="px-6 py-4 text-right font-black">
                          ${aff.totalEarnings.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-600">
                          ${aff.unpaidEarnings.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant={
                              aff.status === "active" ? "default" : "outline"
                            }
                            className={
                              aff.status === "active" ? "bg-emerald-500" : ""
                            }
                          >
                            {aff.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl border-slate-200">
                <CardHeader>
                  <CardTitle>Commission Tiers</CardTitle>
                  <CardDescription>
                    Reward your best performing partners with higher rates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tiers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl">
                      No tiers defined. Everyone receives the base{" "}
                      {program.baseCommissionRate}% rate.
                    </div>
                  ) : (
                    tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                            {tier.commissionRate}%
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">
                              {tier.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Requires {tier.requirementValue}{" "}
                              {tier.requirementType.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-600"
                            onClick={() => {
                              setEditingTier(tier);
                              setIsTierDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteTier(tier.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-dashed"
                    onClick={() => {
                      setEditingTier({
                        requirementType: "referral_count",
                        commissionRate: program.baseCommissionRate + 5,
                        requirementValue: 10,
                      });
                      setIsTierDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Achievement Tier
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
              <DialogContent className="rounded-3xl max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTier?.id ? "Edit Tier" : "Add Commission Tier"}
                  </DialogTitle>
                  <DialogDescription>
                    Define a performance milestone for your partners.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tier Name</Label>
                    <Input
                      placeholder="e.g. Platinum Partner"
                      value={editingTier?.name || ""}
                      onChange={(e) =>
                        setEditingTier({
                          ...(editingTier as any),
                          name: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        value={editingTier?.commissionRate || ""}
                        onChange={(e) =>
                          setEditingTier({
                            ...(editingTier as any),
                            commissionRate: Number(e.target.value),
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Requirement Type</Label>
                      <Select
                        value={editingTier?.requirementType || "referral_count"}
                        onValueChange={(val: any) =>
                          setEditingTier({
                            ...(editingTier as any),
                            requirementType: val,
                          })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="referral_count">
                            Referral Count
                          </SelectItem>
                          <SelectItem value="total_sales">
                            Total Sales (Count)
                          </SelectItem>
                          <SelectItem value="revenue_generated">
                            Revenue Generated ($)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={editingTier?.requirementValue || ""}
                      onChange={(e) =>
                        setEditingTier({
                          ...(editingTier as any),
                          requirementValue: Number(e.target.value),
                        })
                      }
                      className="rounded-xl"
                    />
                    <p className="text-[10px] text-slate-500 italic">
                      Partner must reach this value in{" "}
                      {editingTier?.requirementType?.replace("_", " ")} to
                      qualify.
                    </p>
                  </div>
                </div>
                <DialogFooter className="bg-slate-50 p-6 -mx-6 -mb-6 rounded-b-3xl">
                  <Button
                    variant="ghost"
                    onClick={() => setIsTierDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTier}
                    disabled={savingTier}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-8"
                  >
                    {savingTier ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {editingTier?.id ? "Update Tier" : "Add Achievement Tier"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="space-y-6">
              <Card className="rounded-2xl bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200 dark:shadow-none">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Quick Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-indigo-100 text-sm space-y-4 leading-relaxed">
                  <p>
                    <strong>Tier 1: Professional (15%)</strong>
                    <br />
                    Set this for partners with &gt; 50 referals. It keeps them
                    motivated.
                  </p>
                  <p>
                    <strong>Tier 2: Power User (20%)</strong>
                    <br />
                    Reserved for high-performance partners bringing in &gt;
                    $10,000 revenue.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <Card className="rounded-2xl border-slate-200 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>
                Review and process pending payout requests from your partners.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Partner</th>
                      <th className="px-6 py-4 text-left">Date Requested</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-slate-400 italic"
                        >
                          No payout requests found.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium">
                            {p.affiliates?.referral_code || "Unknown Partner"}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right font-black">
                            ${Number(p.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              variant={
                                p.status === "processed"
                                  ? "default"
                                  : p.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {p.status === "pending" && (
                              <Button
                                size="sm"
                                className="rounded-lg h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => handleProcessPayout(p.id)}
                                disabled={isProcessingPayout === p.id}
                              >
                                {isProcessingPayout === p.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                ) : (
                                  <CreditCard className="h-3 w-3 mr-2" />
                                )}
                                Mark Processed
                              </Button>
                            )}
                            {p.status === "processed" && (
                              <span className="text-xs text-emerald-600 font-medium flex items-center justify-end">
                                <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                                Processed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
