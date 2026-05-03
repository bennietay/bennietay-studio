/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Search,
  Layout,
  Edit2,
  Trash2,
  Loader2,
  Star,
  Globe,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Eye,
  ImageIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "motion/react";
import { WebsiteRenderer } from "../WebsiteRenderer";
import { generateId } from "../../lib/utils";

interface TemplateManagerProps {
  onEdit: (templateId: string) => void;
}

export const TemplateManager = ({ onEdit }: TemplateManagerProps) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?"))
      return;

    setDeleting(id);
    try {
      const { error } = await supabase.from("templates").delete().eq("id", id);

      if (error) throw error;
      setTemplates(templates.filter((t) => t.id !== id));
      toast.success("Template deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete template");
    } finally {
      setDeleting(null);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            Website Templates
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage global website designs available to customers.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search templates..."
              className="pl-9 rounded-xl w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => onEdit("new")} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="rounded-3xl overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm relative group"
          >
            <div className="aspect-video relative overflow-hidden bg-slate-100">
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Layout className="h-12 w-12" />
                </div>
              )}
              {template.is_premium && (
                <Badge className="absolute top-4 right-4 bg-amber-400 text-amber-950 border-none">
                  PREMIUM
                </Badge>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => onEdit(template.id)}
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Design
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>
              </div>
            </div>
            <CardHeader className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="rounded-md text-[10px] uppercase font-bold tracking-widest bg-slate-50 border-slate-200"
                    >
                      {template.category}
                    </Badge>
                    {template.is_visible === false && (
                      <Badge className="bg-slate-500 text-white border-none text-[10px] uppercase font-bold tracking-widest">
                        HIDDEN
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="rounded-md text-[10px] uppercase font-bold tracking-widest bg-indigo-50 border-indigo-200 text-indigo-600"
                    >
                      Archetype:{" "}
                      {template.config?.theme?.style ||
                        template.config?.theme?.defaultStyle ||
                        "modern"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={(props) => (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        {...props}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    )}
                  />
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem
                      onClick={() => setEditingTemplate(template)}
                      className="gap-2"
                    >
                      <SettingsIcon className="h-4 w-4" /> Template Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit(template.id)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" /> Edit Design & Pages
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2 h-10">
                {template.description || "No description provided."}
              </p>
            </CardHeader>
            <CardFooter className="px-6 py-4 border-t bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Created {new Date(template.created_at).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600 font-bold text-xs p-0 h-auto gap-1"
                onClick={() => setPreviewTemplate(template)}
              >
                Preview <Eye className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="rounded-3xl border-dashed border-2 p-12 text-center text-slate-400">
          <Layout className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No templates found matching your search.</p>
        </Card>
      )}

      <Dialog
        open={!!editingTemplate}
        onOpenChange={() => setEditingTemplate(null)}
      >
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
            <DialogDescription>
              Configure global settings and design archetype for this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Template Name
              </label>
              <Input
                value={editingTemplate?.name || ""}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Luxury Real Estate"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Category
                </label>
                <Select
                  value={editingTemplate?.category || "General"}
                  onValueChange={(v) =>
                    setEditingTemplate({ ...editingTemplate, category: v })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Medical/Legal">Medical/Legal</SelectItem>
                    <SelectItem value="Local Services">
                      Local Services
                    </SelectItem>
                    <SelectItem value="Hospitality">Hospitality</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Template Status
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-xl bg-slate-50/50">
                      <Switch
                        id="visibility-toggle-mgr"
                        checked={editingTemplate?.is_visible !== false}
                        onCheckedChange={(v) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            is_visible: v,
                          })
                        }
                      />
                      <label
                        htmlFor="visibility-toggle-mgr"
                        className="text-sm font-medium"
                      >
                        Visible to Clients
                      </label>
                    </div>
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-xl bg-slate-50/50">
                      <Switch
                        id="premium-toggle-mgr"
                        checked={!!editingTemplate?.is_premium}
                        onCheckedChange={(v) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            is_premium: v,
                          })
                        }
                      />
                      <label
                        htmlFor="premium-toggle-mgr"
                        className="text-sm font-medium"
                      >
                        Premium Template
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Core Design Archetype
              </label>
              <Select
                value={
                  editingTemplate?.config?.theme?.style ||
                  editingTemplate?.config?.theme?.defaultStyle ||
                  "modern"
                }
                onValueChange={(v) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    config: {
                      ...editingTemplate.config,
                      theme: {
                        ...editingTemplate.config.theme,
                        style: v,
                        defaultStyle: v,
                      },
                    },
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="authority">
                    Authority Master (Professional)
                  </SelectItem>
                  <SelectItem value="action">
                    Lead Multiplier (Lead Gen)
                  </SelectItem>
                  <SelectItem value="immersive">
                    Visual Narrative (High-Visual)
                  </SelectItem>
                  <SelectItem value="editorial">
                    Minimalist Clean (Typography)
                  </SelectItem>
                  <SelectItem value="modern">Modern Standard</SelectItem>
                  <SelectItem value="corporate">Corporate Identity</SelectItem>
                  <SelectItem value="glassmorphic">
                    Glassmorphic Trend
                  </SelectItem>
                  <SelectItem value="brutalist">Brutalist Bold</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-500 italic">
                Changing this will update the default layout logic for all users
                of this template.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Description
              </label>
              <textarea
                value={editingTemplate?.description || ""}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value,
                  })
                }
                className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="Describe the target audience or niche..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thumbnail Preview URL
              </label>
              <Input
                value={editingTemplate?.thumbnail || ""}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    thumbnail: e.target.value,
                  })
                }
                placeholder="https://images.unsplash.com/..."
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setEditingTemplate(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 px-8"
              disabled={savingSettings}
              onClick={async () => {
                setSavingSettings(true);
                try {
                  const payload: any = {
                    name: editingTemplate.name,
                    category: editingTemplate.category,
                    description: editingTemplate.description,
                    thumbnail: editingTemplate.thumbnail,
                    is_premium: editingTemplate.is_premium,
                    is_visible: editingTemplate.is_visible !== false,
                    config: editingTemplate.config,
                    updated_at: new Date().toISOString(),
                  };

                  let { error } = await supabase
                    .from("templates")
                    .update(payload)
                    .eq("id", editingTemplate.id);

                  if (
                    error &&
                    (error.code === "42703" ||
                      error.message.includes("updated_at"))
                  ) {
                    const { updated_at, ...fallbackPayload } = payload;
                    const { error: retryError } = await supabase
                      .from("templates")
                      .update(fallbackPayload)
                      .eq("id", editingTemplate.id);
                    error = retryError;
                  }

                  if (error) throw error;
                  setTemplates(
                    templates.map((t) =>
                      t.id === editingTemplate.id ? editingTemplate : t,
                    ),
                  );
                  setEditingTemplate(null);
                  toast.success("Template settings saved successfully");
                } catch (err: any) {
                  toast.error("Failed to save settings: " + err.message);
                } finally {
                  setSavingSettings(false);
                }
              }}
            >
              {savingSettings && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="sm:max-w-[80vw] max-w-[95vw] w-full sm:w-[80vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-6 border-b flex flex-row items-center justify-between shrink-0 bg-white">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold">
                {previewTemplate?.name}
              </DialogTitle>
              <p className="text-sm text-slate-500">
                {previewTemplate?.category} Template Preview
              </p>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-50 relative group">
            {previewTemplate && (
              <div className="h-full w-full pointer-events-auto">
                <WebsiteRenderer
                  initialData={{
                    id: "preview",
                    businessId: "preview",
                    theme: previewTemplate.config.theme,
                    pages: (previewTemplate.config.pages || []).map(
                      (p: any) => ({
                        ...p,
                        id: p.id || generateId(),
                        sections: (p.sections || []).map((s: any) => ({
                          ...s,
                          id: s.id || generateId(),
                        })),
                      }),
                    ),
                    seo: previewTemplate.config.seo,
                    status: "published",
                    updatedAt: Date.now(),
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
