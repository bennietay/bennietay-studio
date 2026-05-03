/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User,
  Mail,
  Briefcase,
  Building,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "",
    business_id: "",
  });
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [terminationStep, setTerminationStep] = useState<
    "initial" | "export" | "confirm"
  >("initial");

  const exportUserData = async () => {
    if (!profile?.businessId) {
      toast.error("No business data to export.");
      return;
    }

    try {
      toast.loading("Preparing your data export...");

      const tables = [
        "businesses",
        "websites",
        "leads",
        "posts",
        "appointments",
        "affiliate_programs",
        "affiliates",
      ];
      const exportData: any = {
        profile,
        exportedAt: new Date().toISOString(),
      };

      for (const table of tables) {
        const query = supabase.from(table).select("*");
        if (table === "businesses") {
          query.eq("id", profile.businessId);
        } else if (table === "affiliate_programs") {
          query.eq("business_id", profile.businessId);
        } else {
          query.eq("business_id", profile.businessId);
        }

        const { data } = await query;
        exportData[table] = data || [];
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bennie_tay_studio_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Data exported successfully!");
      setTerminationStep("confirm");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    }
  };

  const handleTerminateAccount = async () => {
    setTerminating(true);
    try {
      // 1. Delete Business (Cascade will handle websites, leads, etc.)
      if (profile?.businessId) {
        const { error: bizError } = await supabase
          .from("businesses")
          .delete()
          .eq("id", profile.businessId);
        if (bizError) throw bizError;
      }

      // 2. Delete Profile
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);
        if (profileError) throw profileError;
      }

      // 3. Log out
      await supabase.auth.signOut();
      toast.success("Your account and data have been permanently deleted.");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Termination failed:", error);
      toast.error("Termination failed: " + error.message);
      setTerminating(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email || "",
        role: profile.role || "",
        business_id: profile.businessId || "",
      });
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data } = await supabase.from("businesses").select("id, name");
      if (data) setBusinesses(data);
    };
    fetchBusinesses();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          email: formData.email,
          role: formData.role,
          business_id: formData.business_id || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          User Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your account information and business affiliation.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Account Details
                </CardTitle>
                <CardDescription>
                  Update your personal and professional information.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input
                  value={formData.email}
                  disabled
                  className="rounded-xl h-12 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500"
                  placeholder="your@email.com"
                />
                <p className="text-[10px] text-slate-400">
                  Email addresses are managed through authentication and cannot
                  be changed here.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Briefcase className="h-3 w-3" /> User Role
                </Label>
                {profile?.role === "super_admin" ? (
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="business_admin">
                        Business Admin
                      </SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-12 px-4 flex items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-medium">
                    {formData.role
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {profile?.role === "super_admin"
                    ? "Note: Changing your role may affect your access permissions."
                    : "Contact a Super Admin to change your role or permissions."}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Building className="h-3 w-3" /> Business Affiliation
                </Label>
                {profile?.role === "super_admin" ? (
                  <Select
                    value={formData.business_id || "none"}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        business_id: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select a business" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="none">No Affiliation</SelectItem>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-12 px-4 flex items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-medium">
                    {businesses.find((b) => b.id === formData.business_id)
                      ?.name || "No Affiliation"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="max-w-2xl mt-8 rounded-[2.5rem] border-red-100 bg-red-50/10 overflow-hidden shadow-sm">
          <CardHeader className="p-8">
            <CardTitle className="text-xl text-red-900">
              Service Termination
            </CardTitle>
            <CardDescription className="text-red-600">
              Close your account and delete all associated business data
              permanently.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Data Portability
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Download a full JSON archive of your business data.
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl h-10 px-6 border-slate-200 hover:bg-slate-50"
                  onClick={exportUserData}
                >
                  Export Data
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl border border-red-100">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-900">
                      Permanent Deletion
                    </div>
                    <div className="text-[10px] text-red-500">
                      Irreversibly remove all websites, leads, and assets.
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="rounded-xl h-10 px-6 font-bold"
                  onClick={() => setShowTerminateDialog(true)}
                >
                  Terminate Service
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mt-8 rounded-[2.5rem] border-slate-100 bg-slate-50/30 overflow-hidden shadow-sm">
          <CardHeader className="p-8">
            <CardTitle className="text-xl text-slate-900">
              Security & Session
            </CardTitle>
            <CardDescription className="text-slate-500">
              Securely end your current session.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Active Session
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Currently logged in as {profile?.email}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-xl h-10 px-6 font-bold border-slate-200 hover:bg-slate-50"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={showTerminateDialog}
          onOpenChange={setShowTerminateDialog}
        >
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <div className="h-12 w-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold">
                Terminate Service?
              </DialogTitle>
              <DialogDescription className="text-slate-500 pt-2">
                This action is <strong>irreversible</strong>. By continuing, you
                will permanently delete:
                <ul className="list-disc pl-5 mt-3 space-y-1 text-xs">
                  <li>Your business profile and settings</li>
                  <li>All generated websites and custom domains</li>
                  <li>All CRM leads and customer data</li>
                  <li>All scheduled appointments and blog posts</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              {terminationStep === "initial" && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs text-amber-800 flex items-start gap-2">
                    <Download className="h-4 w-4 mt-0.5 shrink-0" />
                    We strongly recommend exporting your data before deleting
                    your account.
                  </p>
                  <Button
                    variant="link"
                    className="text-amber-700 font-bold p-0 mt-2 h-auto text-xs"
                    onClick={() => {
                      exportUserData();
                    }}
                  >
                    Export Data Now
                  </Button>
                </div>
              )}

              {terminationStep === "confirm" && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <Save className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">
                    Export complete. You are ready to proceed with deletion.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setShowTerminateDialog(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleTerminateAccount}
                disabled={terminating}
                className="rounded-xl px-6 font-bold shadow-lg shadow-red-200"
              >
                {terminating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete My Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
