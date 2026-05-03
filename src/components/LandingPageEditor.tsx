/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Layout,
  Zap,
  Users,
  Star,
  HelpCircle,
  Globe,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Type,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DEFAULT_LANDING_CONTENT } from "../constants/landingPageContent";

export const LandingPageEditor = () => {
  const [content, setContent] = useState<any>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("hero");

  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("content")
          .eq("id", "landing_page")
          .single();
        if (data?.content) setContent(data.content);
      } catch (err) {
        console.error("Error fetching landing page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLanding();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        id: "landing_page",
        content: content,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Landing page updated successfully");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save landing page");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  const updateNested = (path: string, value: any) => {
    const keys = path.split(".");
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setContent(newContent);
  };

  const addListItem = (path: string, defaultItem: any) => {
    const keys = path.split(".");
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    const list = [...(current[keys[keys.length - 1]] || [])];
    list.push(defaultItem);
    current[keys[keys.length - 1]] = list;
    setContent(newContent);
  };

  const removeListItem = (path: string, index: number) => {
    const keys = path.split(".");
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    const list = current[keys[keys.length - 1]].filter(
      (_: any, i: number) => i !== index,
    );
    current[keys[keys.length - 1]] = list;
    setContent(newContent);
  };

  const moveListItem = (
    path: string,
    index: number,
    direction: "up" | "down",
  ) => {
    const keys = path.split(".");
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    const list = [...current[keys[keys.length - 1]]];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    current[keys[keys.length - 1]] = list;
    setContent(newContent);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sales Page CMS
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control every aspect of your platform's main sales page.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl gap-2 h-11 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Publish Live Changes
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="hero" className="rounded-xl px-4 py-2 gap-2">
            <Zap className="h-4 w-4" /> Hero
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl px-4 py-2 gap-2">
            <Layout className="h-4 w-4" /> Features
          </TabsTrigger>
          <TabsTrigger value="process" className="rounded-xl px-4 py-2 gap-2">
            <ArrowRight className="h-4 w-4" /> Process
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl px-4 py-2 gap-2">
            <Zap className="h-4 w-4" /> Pricing
          </TabsTrigger>
          <TabsTrigger
            value="testimonials"
            className="rounded-xl px-4 py-2 gap-2"
          >
            <Star className="h-4 w-4" /> Proof
          </TabsTrigger>
          <TabsTrigger value="faq" className="rounded-xl px-4 py-2 gap-2">
            <HelpCircle className="h-4 w-4" /> FAQ
          </TabsTrigger>
          <TabsTrigger value="blog" className="rounded-xl px-4 py-2 gap-2">
            <FileText className="h-4 w-4" /> Blog
          </TabsTrigger>
          <TabsTrigger value="cta" className="rounded-xl px-4 py-2 gap-2">
            <ArrowRight className="h-4 w-4" /> CTA
          </TabsTrigger>
          <TabsTrigger value="footer" className="rounded-xl px-4 py-2 gap-2">
            <Globe className="h-4 w-4" /> Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>
                The first thing users see when they land on your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Badge Text</Label>
                  <Input
                    value={content?.hero?.badge || ""}
                    onChange={(e) => updateNested("hero.badge", e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g. The Future of Digital Presence"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Input
                    value={content?.hero?.headline || ""}
                    onChange={(e) =>
                      updateNested("hero.headline", e.target.value)
                    }
                    className="rounded-xl"
                    placeholder="e.g. Synthesize your digital empire with AI."
                  />
                </div>
                <div className="col-span-full space-y-1.5">
                  <Label>Subheadline</Label>
                  <Textarea
                    value={content?.hero?.subheadline || ""}
                    onChange={(e) =>
                      updateNested("hero.subheadline", e.target.value)
                    }
                    className="rounded-xl min-h-[100px]"
                    placeholder="Describe your platform's core value proposition..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Primary CTA Text</Label>
                  <Input
                    value={content?.hero?.ctaPrimary || ""}
                    onChange={(e) =>
                      updateNested("hero.ctaPrimary", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Secondary CTA Text</Label>
                  <Input
                    value={content?.hero?.ctaSecondary || ""}
                    onChange={(e) =>
                      updateNested("hero.ctaSecondary", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Social Proof</CardTitle>
              <CardDescription>
                The "Join X+ businesses" section in the hero.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Proof Text</Label>
                  <Input
                    value={content?.hero?.socialProof?.text || ""}
                    onChange={(e) =>
                      updateNested("hero.socialProof.text", e.target.value)
                    }
                    className="rounded-xl"
                    placeholder="e.g. Join 2,000+ businesses"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Avatar Images (URLs)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addListItem(
                        "hero.socialProof.avatars",
                        "https://i.pravatar.cc/150?u=" + Math.random(),
                      )
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Avatar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(content?.hero?.socialProof?.avatars || []).map(
                    (url: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={url}
                          onChange={(e) => {
                            const newList = [
                              ...content.hero.socialProof.avatars,
                            ];
                            newList[i] = e.target.value;
                            updateNested("hero.socialProof.avatars", newList);
                          }}
                          className="rounded-lg h-9 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() =>
                            removeListItem("hero.socialProof.avatars", i)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Featured In / Logos</CardTitle>
              <CardDescription>
                Trust signals showing where your platform has been featured.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {(content?.featuredIn || []).map((logo: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                  >
                    <Input
                      value={logo.name}
                      onChange={(e) => {
                        const newList = [...content.featuredIn];
                        newList[i].name = e.target.value;
                        setContent({ ...content, featuredIn: newList });
                      }}
                      className="rounded-lg h-9 text-sm bg-white"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => removeListItem("featuredIn", i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="h-16 rounded-xl border-dashed flex flex-col gap-1 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                  onClick={() =>
                    addListItem("featuredIn", { name: "New Logo" })
                  }
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Add Logo
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Features Section Header</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={content?.features?.title || ""}
                    onChange={(e) =>
                      updateNested("features.title", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Input
                    value={content?.features?.subtitle || ""}
                    onChange={(e) =>
                      updateNested("features.subtitle", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Feature Items
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={() =>
                  addListItem("features.items", {
                    title: "New Feature",
                    description: "Feature description...",
                    icon: "Zap",
                    color: "indigo",
                    span: "2",
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add Feature
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(content?.features?.items || []).map((item: any, i: number) => (
                <Card
                  key={i}
                  className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveListItem("features.items", i, "up")}
                        disabled={i === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          moveListItem("features.items", i, "down")
                        }
                        disabled={i === content.features.items.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => removeListItem("features.items", i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newList = [...content.features.items];
                          newList[i].title = e.target.value;
                          updateNested("features.items", newList);
                        }}
                        className="rounded-lg h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Icon (Lucide Name)</Label>
                      <Input
                        value={item.icon}
                        onChange={(e) => {
                          const newList = [...content.features.items];
                          newList[i].icon = e.target.value;
                          updateNested("features.items", newList);
                        }}
                        className="rounded-lg h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Grid Span (1-6)</Label>
                      <select
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        value={item.span}
                        onChange={(e) => {
                          const newList = [...content.features.items];
                          newList[i].span = e.target.value;
                          updateNested("features.items", newList);
                        }}
                      >
                        <option value="2">Small (2 cols)</option>
                        <option value="3">Medium (3 cols)</option>
                        <option value="4">Large (4 cols)</option>
                        <option value="6">Full Width (6 cols)</option>
                      </select>
                    </div>
                    <div className="col-span-full space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => {
                          const newList = [...content.features.items];
                          newList[i].description = e.target.value;
                          updateNested("features.items", newList);
                        }}
                        className="rounded-lg min-h-[60px] text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Process Section Header</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={content?.process?.title || ""}
                    onChange={(e) =>
                      updateNested("process.title", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Input
                    value={content?.process?.subtitle || ""}
                    onChange={(e) =>
                      updateNested("process.subtitle", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Process Steps
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={() =>
                  addListItem("process.items", {
                    title: "New Step",
                    description: "Step description...",
                    icon: "Globe",
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add Step
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(content?.process?.items || []).map((item: any, i: number) => (
                <Card
                  key={i}
                  className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="font-bold text-sm">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveListItem("process.items", i, "up")}
                        disabled={i === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveListItem("process.items", i, "down")}
                        disabled={i === content.process.items.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => removeListItem("process.items", i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newList = [...content.process.items];
                          newList[i].title = e.target.value;
                          updateNested("process.items", newList);
                        }}
                        className="rounded-lg h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Icon (Lucide Name)</Label>
                      <Input
                        value={item.icon}
                        onChange={(e) => {
                          const newList = [...content.process.items];
                          newList[i].icon = e.target.value;
                          updateNested("process.items", newList);
                        }}
                        className="rounded-lg h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-full space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => {
                          const newList = [...content.process.items];
                          newList[i].description = e.target.value;
                          updateNested("process.items", newList);
                        }}
                        className="rounded-lg min-h-[60px] text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Pricing Header</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={content?.pricing?.title || ""}
                    onChange={(e) =>
                      updateNested("pricing.title", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Input
                    value={content?.pricing?.subtitle || ""}
                    onChange={(e) =>
                      updateNested("pricing.subtitle", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Testimonials Header</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={content?.testimonials?.title || ""}
                    onChange={(e) =>
                      updateNested("testimonials.title", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Input
                    value={content?.testimonials?.subtitle || ""}
                    onChange={(e) =>
                      updateNested("testimonials.subtitle", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Testimonials</h3>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={() =>
                  addListItem("testimonials.items", {
                    name: "John Doe",
                    role: "CEO",
                    text: "Amazing platform!",
                    avatar: "https://i.pravatar.cc/150?u=new",
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add Testimonial
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(content?.testimonials?.items || []).map(
                (item: any, i: number) => (
                  <Card
                    key={i}
                    className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200">
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            moveListItem("testimonials.items", i, "up")
                          }
                          disabled={i === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            moveListItem("testimonials.items", i, "down")
                          }
                          disabled={i === content.testimonials.items.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() =>
                            removeListItem("testimonials.items", i)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => {
                            const newList = [...content.testimonials.items];
                            newList[i].name = e.target.value;
                            updateNested("testimonials.items", newList);
                          }}
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Role</Label>
                        <Input
                          value={item.role}
                          onChange={(e) => {
                            const newList = [...content.testimonials.items];
                            newList[i].role = e.target.value;
                            updateNested("testimonials.items", newList);
                          }}
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Avatar URL</Label>
                        <Input
                          value={item.avatar}
                          onChange={(e) => {
                            const newList = [...content.testimonials.items];
                            newList[i].avatar = e.target.value;
                            updateNested("testimonials.items", newList);
                          }}
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                      <div className="col-span-full space-y-1.5">
                        <Label>Testimonial Text</Label>
                        <Textarea
                          value={item.text}
                          onChange={(e) => {
                            const newList = [...content.testimonials.items];
                            newList[i].text = e.target.value;
                            updateNested("testimonials.items", newList);
                          }}
                          className="rounded-lg min-h-[60px] text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>FAQ Header</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={content?.faq?.title || ""}
                    onChange={(e) => updateNested("faq.title", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Input
                    value={content?.faq?.subtitle || ""}
                    onChange={(e) =>
                      updateNested("faq.subtitle", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">FAQ Items</h3>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={() =>
                  addListItem("faq.items", {
                    q: "New Question",
                    a: "Answer here...",
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add FAQ
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(content?.faq?.items || []).map((item: any, i: number) => (
                <Card
                  key={i}
                  className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                    <span className="font-bold text-sm truncate max-w-[80%]">
                      {item.q}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveListItem("faq.items", i, "up")}
                        disabled={i === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveListItem("faq.items", i, "down")}
                        disabled={i === content.faq.items.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => removeListItem("faq.items", i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label>Question</Label>
                      <Input
                        value={item.q}
                        onChange={(e) => {
                          const newList = [...content.faq.items];
                          newList[i].q = e.target.value;
                          updateNested("faq.items", newList);
                        }}
                        className="rounded-lg h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Answer</Label>
                      <Textarea
                        value={item.a}
                        onChange={(e) => {
                          const newList = [...content.faq.items];
                          newList[i].a = e.target.value;
                          updateNested("faq.items", newList);
                        }}
                        className="rounded-lg min-h-[80px] text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Blog Section Header</CardTitle>
              <CardDescription>
                Control the blog section on your landing page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input
                    value={content?.blog?.title || ""}
                    onChange={(e) => updateNested("blog.title", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Input
                    value={content?.blog?.subtitle || ""}
                    onChange={(e) =>
                      updateNested("blog.subtitle", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Final Call to Action</CardTitle>
              <CardDescription>
                The large section at the bottom of the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Input
                    value={content?.cta?.headline || ""}
                    onChange={(e) =>
                      updateNested("cta.headline", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subheadline</Label>
                  <Textarea
                    value={content?.cta?.subheadline || ""}
                    onChange={(e) =>
                      updateNested("cta.subheadline", e.target.value)
                    }
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Button Text</Label>
                  <Input
                    value={content?.cta?.buttonText || ""}
                    onChange={(e) =>
                      updateNested("cta.buttonText", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>
                Global footer content for the landing page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Footer Tagline</Label>
                  <Textarea
                    value={content?.footer?.tagline || ""}
                    onChange={(e) =>
                      updateNested("footer.tagline", e.target.value)
                    }
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Support Email</Label>
                  <Input
                    value={content?.footer?.email || ""}
                    onChange={(e) =>
                      updateNested("footer.email", e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Social Links</h3>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={() =>
                  addListItem("footer.socials", {
                    platform: "Twitter",
                    url: "https://twitter.com/...",
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add Social
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(content?.footer?.socials || []).map((item: any, i: number) => (
                <Card
                  key={i}
                  className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Social Profile {i + 1}
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeListItem("footer.socials", i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Platform Name</Label>
                      <Input
                        value={item.platform}
                        onChange={(e) => {
                          const newList = [...content.footer.socials];
                          newList[i].platform = e.target.value;
                          updateNested("footer.socials", newList);
                        }}
                        className="rounded-lg h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>URL</Label>
                      <Input
                        value={item.url}
                        onChange={(e) => {
                          const newList = [...content.footer.socials];
                          newList[i].url = e.target.value;
                          updateNested("footer.socials", newList);
                        }}
                        className="rounded-lg h-8 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPageEditor;
