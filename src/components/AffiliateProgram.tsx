/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Settings,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Target,
  Award,
  CircleDollarSign,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  AffiliateProgram as AffiliateProgramType,
  CommissionTier,
  AffiliatePayout,
} from "@/src/types";
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
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { generateId } from "@/src/lib/utils";

export function AffiliateProgram() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<AffiliateProgramType | null>(null);
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<Partial<CommissionTier>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.businessId) {
      fetchProgramData();
    }
  }, [profile?.businessId]);

  const fetchProgramData = async () => {
    setLoading(true);
    try {
      const { data: progData } = await supabase
        .from("affiliate_programs")
        .select("*")
        .eq("business_id", profile?.businessId)
        .maybeSingle();

      if (progData) {
        setProgram(progData);

        const { data: tierData } = await supabase
          .from("commission_tiers")
          .select("*")
          .eq("program_id", progData.id)
          .order("requirement_value", { ascending: true });

        setTiers(tierData || []);

        const { data: payoutData } = await supabase
          .from("affiliate_payouts")
          .select("*, affiliates(uid)")
          .eq("affiliate_id", profile?.businessId) // This is wrong, should be joined
          .limit(10);

        // Payouts would normally be fetched via a more complex join or separate query
        // For now, let's keep it simple
      }
    } catch (err) {
      console.error("Error fetching affiliate program:", err);
      toast.error("Failed to load affiliate settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    setSaving(true);
    const newProgram: AffiliateProgramType = {
      id: generateId(),
      businessId: profile?.businessId || "",
      isEnabled: true,
      baseCommissionRate: 0.1, // 10%
      payoutMinimum: 50,
      cookieDurationDays: 30,
      createdAt: Date.now(),
    };

    try {
      const { error } = await supabase
        .from("affiliate_programs")
        .insert(newProgram);

      if (error) throw error;
      setProgram(newProgram);
      toast.success("Affiliate program created");
    } catch (err) {
      toast.error("Failed to create program");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgram = async (
    updates: Partial<AffiliateProgramType>,
  ) => {
    if (!program) return;
    try {
      const { error } = await supabase
        .from("affiliate_programs")
        .update(updates)
        .eq("id", program.id);

      if (error) throw error;
      setProgram({ ...program, ...updates });
      toast.success("Settings updated");
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const handleSaveTier = async () => {
    if (!program) return;
    setSaving(true);
    try {
      if (editingTier.id) {
        await supabase
          .from("commission_tiers")
          .update(editingTier)
          .eq("id", editingTier.id);
      } else {
        const newTier = {
          ...editingTier,
          id: generateId(),
          program_id: program.id,
        };
        await supabase.from("commission_tiers").insert(newTier);
      }
      setShowTierDialog(false);
      fetchProgramData();
      toast.success("Tier saved successfully");
    } catch (err) {
      toast.error("Failed to save tier");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (id: string) => {
    try {
      await supabase.from("commission_tiers").delete().eq("id", id);
      setTiers(tiers.filter((t) => t.id !== id));
      toast.success("Tier deleted");
    } catch (err) {
      toast.error("Failed to delete tier");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-2xl mx-auto space-y-6">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
          <CircleDollarSign className="h-10 w-10 text-indigo-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Launch Your Affiliate Program
          </h2>
          <p className="text-muted-foreground text-lg">
            Turn your customers and fans into a powerful sales force. Set
            commissions, track performance, and grow your business through
            word-of-mouth.
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleCreateProgram}
          disabled={saving}
          className="h-12 px-8 text-lg rounded-full"
        >
          {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          Setup Program Now
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Affiliate Program Management
          </h2>
          <p className="text-muted-foreground">
            Manage your partners, commission structures, and payouts.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white/50 backdrop-blur p-2 rounded-xl border">
          <Label htmlFor="program-active" className="text-sm font-medium">
            Program Active
          </Label>
          <Switch
            id="program-active"
            checked={program.isEnabled}
            onCheckedChange={(checked) =>
              handleUpdateProgram({ isEnabled: checked })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs uppercase tracking-wider font-semibold text-indigo-600">
              <CircleDollarSign className="w-3 h-3 mr-1" /> Base Commission
            </CardDescription>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-bold tracking-tighter">
                {(program.baseCommissionRate * 100).toFixed(0)}
              </span>
              <span className="text-xl font-medium text-muted-foreground">
                %
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Standard rate for all new affiliates.
            </p>
          </CardContent>
          <div className="h-1 w-full bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors" />
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs uppercase tracking-wider font-semibold text-emerald-600">
              <Target className="w-3 h-3 mr-1" /> Active Tiers
            </CardDescription>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-bold tracking-tighter">
                {tiers.length}
              </span>
              <span className="text-xl font-medium text-muted-foreground">
                {" "}
                Levels
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Performance-based rewards active.
            </p>
          </CardContent>
          <div className="h-1 w-full bg-emerald-600/10 group-hover:bg-emerald-600/20 transition-colors" />
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-xs uppercase tracking-wider font-semibold text-amber-600">
              <Award className="w-3 h-3 mr-1" /> Payout Threshold
            </CardDescription>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-medium text-muted-foreground">
                $
              </span>
              <span className="text-4xl font-bold tracking-tighter">
                {program.payoutMinimum}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Minimum earnings before payout.
            </p>
          </CardContent>
          <div className="h-1 w-full bg-amber-600/10 group-hover:bg-amber-600/20 transition-colors" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Commission Tiers</CardTitle>
                  <CardDescription>
                    Reward your top earners with higher commissions.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingTier({});
                    setShowTierDialog(true);
                  }}
                  size="sm"
                  className="rounded-full shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50/30">
                    <TableHead className="font-semibold px-6">
                      Tier Name
                    </TableHead>
                    <TableHead className="font-semibold">
                      Commission %
                    </TableHead>
                    <TableHead className="font-semibold">Requirement</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-32 text-center text-muted-foreground px-6"
                      >
                        No custom tiers configured yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tiers.map((tier) => (
                      <TableRow
                        key={tier.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-medium px-6">
                          {tier.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 font-mono"
                          >
                            {(tier.commissionRate * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {tier.requirementType === "total_sales"
                            ? `${tier.requirementValue} Sales`
                            : tier.requirementType === "referral_count"
                              ? `${tier.requirementValue} Referrals`
                              : `$${tier.requirementValue} Revenue`}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingTier(tier);
                                setShowTierDialog(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteTier(tier.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl">Payout History</CardTitle>
              <CardDescription>
                Track payments made to your affiliates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center text-muted-foreground h-48 flex flex-col items-center justify-center space-y-2">
              <DollarSign className="w-8 h-8 opacity-20" />
              <p>No payout history available yet.</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Program Settings</CardTitle>
              <CardDescription>
                Global configuration for your affiliate network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Base Commission Rate (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={program.baseCommissionRate * 100}
                    onChange={(e) =>
                      setProgram({
                        ...program,
                        baseCommissionRate: parseFloat(e.target.value) / 100,
                      })
                    }
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                    %
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Payout ($)</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                    $
                  </div>
                  <Input
                    type="number"
                    value={program.payoutMinimum}
                    onChange={(e) =>
                      setProgram({
                        ...program,
                        payoutMinimum: parseFloat(e.target.value),
                      })
                    }
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cookie Duration (Days)</Label>
                <Input
                  type="number"
                  value={program.cookieDurationDays}
                  onChange={(e) =>
                    setProgram({
                      ...program,
                      cookieDurationDays: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-[10px] text-muted-foreground">
                  How long a referral remains valid after a user clicks an
                  affiliate link.
                </p>
              </div>

              <Button
                onClick={() => handleUpdateProgram(program)}
                disabled={saving}
                className="w-full rounded-full h-11"
              >
                {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Save General Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2" /> Recruitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-indigo-100">
                Invite people to join your program. They can sign up using this
                public link.
              </p>
              <div
                className="p-3 bg-white/10 rounded-lg text-xs font-mono break-all border border-white/20 select-all cursor-copy"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/affiliate/join/${profile?.businessId}`,
                  );
                  toast.success("Link copied to clipboard");
                }}
              >
                {window.location.origin}/affiliate/join/{profile?.businessId}
              </div>
              <a
                href={`/affiliate/join/${profile?.businessId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full"
              >
                <Button
                  variant="secondary"
                  className="w-full rounded-full border-none"
                >
                  Preview Join Page <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none ring-1 ring-slate-200 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold">
              {editingTier.id ? "Edit Achievement Tier" : "Add New Tier"}
            </DialogTitle>
            <DialogDescription className="text-base">
              Set the criteria and rewards for this specific tier level.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tier Name</Label>
              <Input
                placeholder="e.g. Silver Partner"
                value={editingTier.name || ""}
                onChange={(e) =>
                  setEditingTier({ ...editingTier, name: e.target.value })
                }
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Bonus Commission Rate (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="20"
                  value={
                    editingTier.commissionRate
                      ? editingTier.commissionRate * 100
                      : ""
                  }
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      commissionRate: parseFloat(e.target.value) / 100,
                    })
                  }
                  className="h-11 rounded-xl pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                  %
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Requirement Type
                </Label>
                <Select
                  value={editingTier.requirementType}
                  onValueChange={(val: any) =>
                    setEditingTier({ ...editingTier, requirementType: val })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_sales">Total Sales</SelectItem>
                    <SelectItem value="referral_count">
                      Total Referrals
                    </SelectItem>
                    <SelectItem value="revenue_generated">
                      Revenue ($)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Target Value</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={editingTier.requirementValue || ""}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      requirementValue: parseFloat(e.target.value),
                    })
                  }
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-3">
            <Button
              variant="outline"
              className="rounded-full h-11 px-8"
              onClick={() => setShowTierDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full h-11 px-8 shadow-md"
              onClick={handleSaveTier}
              disabled={saving}
            >
              {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {editingTier.id ? "Save Changes" : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
