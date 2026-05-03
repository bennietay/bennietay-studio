/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Loader2, Palette, Layout, Save, CheckCircle2 } from "lucide-react";
import { Separator } from "../ui/separator";

const AVAILABLE_STYLES = [
  { id: "modern", name: "Modern (Clean & Professional)" },
  { id: "neumorphic", name: "Neumorphic (Soft UI Design)" },
  { id: "glassmorphic", name: "Glassmorphic (Frosted Glass)" },
  { id: "brutalist", name: "Brutalist (Bold & Raw)" },
  { id: "editorial", name: "Editorial (Magazine/Vogue style)" },
  { id: "action", name: "Action (High Urgency/Direct Response)" },
  { id: "immersive", name: "Immersive (Cinematic/Full Screen)" },
  { id: "authority", name: "Authority (Consultant/Lawyer/Expert)" },
  { id: "corporate", name: "Corporate (Modern Tech Giant Style)" },
];

const AVAILABLE_THEMES = [
  "Authority Master",
  "Lead Multiplier",
  "Visual Narrative",
  "Minimalist Clean",
  "Corporate Pro",
  "Midnight Glass",
  "Scandinavian",
];

export function ArchetypeThemeManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabledStyles, setEnabledStyles] = useState<string[]>([]);
  const [enabledThemes, setEnabledThemes] = useState<string[]>([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "archetype_config")
        .maybeSingle();

      if (data) {
        setEnabledStyles(data.content.enabledStyles || []);
        setEnabledThemes(data.content.enabledThemes || []);
      } else {
        // Fallback to all enabled if no config found
        setEnabledStyles(AVAILABLE_STYLES.map((s) => s.id));
        setEnabledThemes(AVAILABLE_THEMES);
      }
    } catch (err) {
      console.error("Error fetching archetype config:", err);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        id: "archetype_config",
        content: {
          enabledStyles,
          enabledThemes,
        },
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Configuration saved successfully");
    } catch (err) {
      console.error("Error saving config:", err);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = (styleId: string) => {
    setEnabledStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId],
    );
  };

  const toggleTheme = (themeName: string) => {
    setEnabledThemes((prev) =>
      prev.includes(themeName)
        ? prev.filter((name) => name !== themeName)
        : [...prev, themeName],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Archetypes & Themes Control
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Limit which design styles and presets are available to customers.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl h-12 px-8 bg-indigo-600 shadow-xl shadow-indigo-200"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                <Layout className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Available Styles (Archetypes)</CardTitle>
                <CardDescription>
                  Toggle which base design frameworks are selectable.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {AVAILABLE_STYLES.map((style) => (
                <div
                  key={style.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="space-y-1">
                    <Label
                      className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                      htmlFor={`style-${style.id}`}
                    >
                      {style.name}
                    </Label>
                    <p className="text-xs text-slate-500 capitalize">
                      {style.id} framework
                    </p>
                  </div>
                  <Switch
                    id={`style-${style.id}`}
                    checked={enabledStyles.includes(style.id)}
                    onCheckedChange={() => toggleStyle(style.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Theme Presets</CardTitle>
                <CardDescription>
                  Control which ready-to-use theme presets are active.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {AVAILABLE_THEMES.map((theme) => (
                <div
                  key={theme}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="space-y-1">
                    <Label
                      className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                      htmlFor={`theme-${theme}`}
                    >
                      {theme}
                    </Label>
                    <p className="text-xs text-slate-500">Preset Bundle</p>
                  </div>
                  <Switch
                    id={`theme-${theme}`}
                    checked={enabledThemes.includes(theme)}
                    onCheckedChange={() => toggleTheme(theme)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/10 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-1" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-400">
              Visibility Note
            </h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-500 leading-relaxed">
              Disabling a style or theme will immediately hide it from the
              website generator and editor for all customers. Websites already
              using a disabled style will remain operational but won't be able
              to re-select it if they change their mind.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
