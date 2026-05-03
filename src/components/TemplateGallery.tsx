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
import { Badge } from "./ui/badge";
import {
  Search,
  Layout,
  Eye,
  CheckCircle2,
  Star,
  Zap,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { generateId } from "../lib/utils";
import { toast } from "sonner";
import { WebsiteRenderer } from "./WebsiteRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export function TemplateGallery() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

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
      setTemplates((data || []).filter((t: any) => t.is_visible !== false));
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: any) => {
    if (!user || !profile?.businessId) {
      toast.error("Please complete your business setup first");
      navigate("/dashboard/website");
      return;
    }

    setApplying(template.id);
    try {
      const config = template.config;
      if (!config || !config.pages) {
        throw new Error("Invalid template configuration");
      }

      // Map pages and sections to have new IDs
      const formattedPages = config.pages.map((page: any) => ({
        ...page,
        id: generateId(),
        sections: page.sections.map((section: any) => ({
          ...section,
          id: generateId(),
          isVisible: true,
        })),
      }));

      const websiteData = {
        business_id: profile.businessId,
        theme: config.theme || {
          primaryColor: "#4f46e5",
          secondaryColor: "#1e293b",
          fontFamily: "Inter",
          style: "modern",
        },
        pages: formattedPages,
        seo: config.seo || {
          title: `${template.name} | My Business`,
          description: template.description,
          keywords: [template.category],
        },
        status: "draft",
        updated_at: new Date().toISOString(),
      };

      // Check if website already exists for this business
      const { data: existingWebsite } = await supabase
        .from("websites")
        .select("id")
        .eq("business_id", profile.businessId)
        .maybeSingle();

      if (existingWebsite) {
        const { error: updateError } = await supabase
          .from("websites")
          .update(websiteData)
          .eq("id", existingWebsite.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("websites").insert([
          {
            ...websiteData,
            id: generateId(),
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) throw insertError;
      }

      toast.success(`Template "${template.name}" applied successfully!`);
      navigate("/dashboard/website");
    } catch (error: any) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template: " + error.message);
    } finally {
      setApplying(null);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Website Templates
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Choose a professional template to jumpstart your website.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search templates..."
            className="pl-9 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
          <Layout className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No templates found
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Try adjusting your search or check back later for new designs.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ y: -8 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group relative"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={t.thumbnail}
                  alt={t.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-xl bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(t);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl bg-indigo-600 text-white border-none hover:bg-indigo-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(t);
                      }}
                      isLoading={applying === t.id}
                    >
                      <Zap className="h-4 w-4 mr-2" /> Use Template
                    </Button>
                  </div>
                </div>
                {t.is_premium && (
                  <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="h-3 w-3 fill-current" /> PREMIUM
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {t.category}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 h-8">
                  {t.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Ready to use
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-bold text-xs"
                    onClick={() => handleUseTemplate(t)}
                  >
                    Select Template
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleUseTemplate(previewTemplate)}
                isLoading={applying === previewTemplate?.id}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              >
                <Zap className="h-4 w-4 mr-2" /> Use This Template
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-50 relative group">
            {previewTemplate && (
              <div className="h-full w-full pointer-events-auto">
                {/* We pass a special prop to WebsiteRenderer to handle template objects */}
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
}
