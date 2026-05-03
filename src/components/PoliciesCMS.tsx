/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Save,
  Eye,
  Loader2,
  X,
  Scale,
  Shield,
} from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { DEFAULT_POLICIES } from "../constants/defaultPolicies";

interface Policy {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "published" | "draft";
  updatedAt: number;
}

interface PoliciesCMSProps {
  isPlatform?: boolean;
}

export function PoliciesCMS({ isPlatform = false }: PoliciesCMSProps) {
  const { profile } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy> | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);

  const settingsId = isPlatform
    ? "platform_policies"
    : `business_policies_${profile?.businessId}`;

  useEffect(() => {
    if (!isPlatform && !profile?.businessId) {
      setLoading(false);
      return;
    }

    const fetchPolicies = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("content")
          .eq("id", settingsId)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data?.content?.policies) {
          setPolicies(data.content.policies);
        } else {
          // Default policies if none exist
          const defaults: Policy[] = DEFAULT_POLICIES.map((p) => ({
            ...p,
            id: Math.random().toString(36).substring(2, 9),
            status: "published",
            updatedAt: Date.now(),
          }));
          setPolicies(defaults);
        }
      } catch (err) {
        console.error("Error fetching policies:", err);
        toast.error("Failed to load policies");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [settingsId, isPlatform, profile?.businessId]);

  const handleSave = async () => {
    if (!editingPolicy) return;

    let updatedPolicies: Policy[];
    const now = Date.now();

    if (editingPolicy.id) {
      updatedPolicies = policies.map((p) =>
        p.id === editingPolicy.id
          ? ({ ...p, ...editingPolicy, updatedAt: now } as Policy)
          : p,
      );
    } else {
      const newPolicy: Policy = {
        id: Math.random().toString(36).substring(2, 9),
        title: editingPolicy.title || "Untitled Policy",
        slug:
          editingPolicy.slug ||
          editingPolicy.title?.toLowerCase().replace(/\s+/g, "-") ||
          "untitled",
        content: editingPolicy.content || "",
        status: editingPolicy.status || "published",
        updatedAt: now,
      };
      updatedPolicies = [...policies, newPolicy];
    }

    try {
      const { error } = await supabase.from("settings").upsert({
        id: settingsId,
        content: { policies: updatedPolicies },
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setPolicies(updatedPolicies);
      setEditingPolicy(null);
      toast.success("Policies saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save policies");
    }
  };

  const deletePolicy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;

    const updatedPolicies = policies.filter((p) => p.id !== id);

    try {
      const { error } = await supabase.from("settings").upsert({
        id: settingsId,
        content: { policies: updatedPolicies },
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setPolicies(updatedPolicies);
      toast.success("Policy deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete policy");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  if (editingPolicy) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {editingPolicy.id ? "Edit Policy" : "New Policy"}
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditingPolicy(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Save Policy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Policy Title</Label>
                  <Input
                    value={editingPolicy.title || ""}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Refund Policy"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Content (Markdown)
                  </label>
                  <textarea
                    className="flex min-h-[400px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    value={editingPolicy.content || ""}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        content: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Policy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={editingPolicy.status || "published"}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>URL Slug</Label>
                  <Input
                    value={editingPolicy.slug || ""}
                    placeholder="refund-policy"
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-bold">Policy Preview</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none prose-p:text-black prose-li:text-black prose-headings:text-black prose-strong:text-black">
                  <h1>{editingPolicy.title || "Untitled Policy"}</h1>
                  <ReactMarkdown>{editingPolicy.content || ""}</ReactMarkdown>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <Button onClick={() => setShowPreview(false)}>
                    Close Preview
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isPlatform ? "Platform Policies" : "Business Policies"}
          </h1>
          <p className="text-slate-500 mt-1">
            Manage legal documents and compliance pages.
          </p>
        </div>
        <Button onClick={() => setEditingPolicy({})} className="gap-2">
          <Plus className="h-4 w-4" /> Add Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="group overflow-hidden flex flex-col">
            <CardHeader className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <Badge
                  variant={
                    policy.status === "published" ? "success" : "secondary"
                  }
                >
                  {policy.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-500">
                  {formatDate(policy.updatedAt)}
                </span>
              </div>
              <CardTitle className="flex items-center gap-2">
                {policy.slug === "privacy" ? (
                  <Shield className="h-5 w-5 text-indigo-500" />
                ) : policy.slug === "terms" ? (
                  <Scale className="h-5 w-5 text-indigo-500" />
                ) : (
                  <FileText className="h-5 w-5 text-indigo-500" />
                )}
                {policy.title}
              </CardTitle>
              <CardDescription className="mt-2">
                Slug: /{policy.slug}
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t border-slate-100 pt-4 flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPolicy(policy)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {policy.slug !== "privacy" && policy.slug !== "terms" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePolicy(policy.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditingPolicy(policy);
                  setShowPreview(true);
                }}
              >
                <Eye className="h-4 w-4" /> View
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
