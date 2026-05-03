import React from "react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  Layout,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Zap,
  TrendingUp,
  BrainCircuit,
  FileText,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { generateMarketingContent, askAI } from "../lib/gemini";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function AIContentHub() {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [business, setBusiness] = React.useState<any>(null);
  const [contentType, setContentType] = React.useState<
    "ad" | "email" | "social" | "blog"
  >("ad");
  const [results, setResults] = React.useState<any[]>([]);
  const [blogResults, setBlogResults] = React.useState<any[]>([]);
  const [customPrompt, setCustomPrompt] = React.useState("");

  React.useEffect(() => {
    if (profile?.businessId) {
      supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.businessId)
        .single()
        .then(({ data }) => setBusiness(data));
    }
  }, [profile?.businessId]);

  const handleGenerate = async () => {
    if (!business) return;
    setLoading(true);
    try {
      if (contentType === "ad") {
        const res = await generateMarketingContent("ad_copy", {
          id: business.id,
          name: business.name,
          industry: business.industry,
          description: business.description || "",
          location: business.location || "",
        });
        setResults(res.variations || []);
        setBlogResults([]);
      } else if (contentType === "blog") {
        const res = await generateMarketingContent("ad_copy", {
          id: business.id,
          name: business.name,
          industry: business.industry,
          description: business.description || "",
          location: business.location || "",
        });
        // We actually have a dedicated generateBlogPost in gemini.ts
        // Let's use that if possible, but I need to make sure I import it.
        // Wait, I'll just use a generic 'askAI' for now or the existing exported ones.
        const blogRes = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", profile?.uid)
          .single();
        const bizId = blogRes.data?.business_id;

        const prompt = `Write a high-converting, SEO-optimized blog post for "${business.name}" in the "${business.industry}" industry.
        Topic: ${customPrompt || "The benefits of professional " + business.industry + " services"}
        Structure: Title, Intro, 3 Key Points, Conclusion.
        Return as JSON with: title, excerpt, content (markdown).`;

        const aiResponse = await askAI("blog", prompt, {
          businessId: bizId,
          isJson: true,
        });
        setBlogResults([aiResponse]);
        setResults([]);
      } else {
        toast.info(
          `Generation for ${contentType} coming soon! Using standard ad copy for demo.`,
        );
        const res = await generateMarketingContent("ad_copy", {
          id: business.id,
          name: business.name,
          industry: business.industry,
          description: business.description || "",
          location: business.location || "",
        });
        setResults(res.variations || []);
      }
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Helmet>
        <title>
          {business?.name
            ? `${business.name} | AI Content Hub`
            : "AI Content Hub"}
        </title>
        <meta
          name="description"
          content={`Synthesize high-conversion marketing materials for ${business?.name || "your business"} using enterprise-grade AI algorithms.`}
        />
      </Helmet>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              AI Content Hub
            </h1>
            <p className="text-slate-500 font-medium italic">
              Synthesize high-conversion marketing materials instantly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none h-full">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold">Parameters</CardTitle>
              <CardDescription>
                Configure the neural engine for your content needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Content Type
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={contentType === "ad" ? "default" : "outline"}
                    onClick={() => setContentType("ad")}
                    className="justify-start gap-3 h-14 rounded-2xl border-slate-100 dark:border-slate-800"
                  >
                    <Send className="h-4 w-4" />
                    <span>Ad Copy (FB/Google)</span>
                  </Button>
                  <Button
                    variant={contentType === "email" ? "default" : "outline"}
                    onClick={() => setContentType("email")}
                    className="justify-start gap-3 h-14 rounded-2xl border-slate-100 dark:border-slate-800"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Campaign</span>
                  </Button>
                  <Button
                    variant={contentType === "social" ? "default" : "outline"}
                    onClick={() => setContentType("social")}
                    className="justify-start gap-3 h-14 rounded-2xl border-slate-100 dark:border-slate-800"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>Social Media Posts</span>
                  </Button>
                  <Button
                    variant={contentType === "blog" ? "default" : "outline"}
                    onClick={() => setContentType("blog")}
                    className="justify-start gap-3 h-14 rounded-2xl border-slate-100 dark:border-slate-800"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Long-form Blog Post</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {contentType === "blog" ? "Blog Topic" : "Industry Context"}
                </Label>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {contentType === "blog"
                      ? customPrompt || "Strategic Content Pillar"
                      : business?.name || "Loading..."}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {business?.industry}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {contentType === "blog"
                    ? "Custom Topic"
                    : "Custom Emphasis (Optional)"}
                </Label>
                <Textarea
                  placeholder={
                    contentType === "blog"
                      ? "Deep dive into..."
                      : "e.g. Focus on our 20% summer sale..."
                  }
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="rounded-2xl border-slate-100 dark:border-slate-800 h-24 text-sm"
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button
                onClick={handleGenerate}
                disabled={loading || !business}
                className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" /> Synthesize
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {results.length === 0 && blogResults.length === 0 && !loading ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 shadow-sm">
                <Sparkles className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
                Ready for Synthesis
              </h3>
              <p className="text-slate-500 max-w-sm mt-2 font-medium">
                Configure your parameters and click synthesize to generate
                high-conversion marketing content.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card
                      key={i}
                      className="animate-pulse rounded-[2.5rem] border-slate-100 dark:border-slate-800"
                    >
                      <div className="h-64 bg-slate-50/50 dark:bg-slate-900/50" />
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {blogResults.map((result, idx) => (
                    <motion.div
                      key={`blog-${idx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold">
                                  {result.title}
                                </CardTitle>
                                <CardDescription className="text-[10px] uppercase font-black tracking-widest text-orange-600">
                                  SEO Optimized Long-form Pillar
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                copyToClipboard(
                                  `# ${result.title}\n\n${result.content}`,
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 italic">
                            {result.excerpt}
                          </div>
                          <div className="prose prose-slate dark:prose-invert max-w-none prose-sm prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase">
                            <ReactMarkdown>{result.content}</ReactMarkdown>
                          </div>
                        </CardContent>
                        <CardFooter className="p-8 border-t border-slate-50 dark:border-slate-800">
                          <Button className="w-full h-14 rounded-2xl bg-slate-950 text-white font-bold">
                            Publish to Blog CMS
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}

                  {results.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-indigo-200 transition-all">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 p-8 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                              {result.platform === "Facebook" ? (
                                <Facebook className="h-4 w-4" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold">
                                {result.platform} Variation {idx + 1}
                              </CardTitle>
                              <CardDescription className="text-[10px] uppercase font-black tracking-widest text-indigo-600">
                                Optimized for Conversion
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-indigo-50 hover:text-indigo-600"
                            onClick={() =>
                              copyToClipboard(
                                `${result.headline}\n\n${result.primaryText}`,
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Headline
                            </Label>
                            <p className="text-lg font-black text-slate-950 dark:text-white leading-tight">
                              {result.headline}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Primary Text / Body
                            </Label>
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                              {result.primaryText}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-8 pt-0 flex justify-end gap-3">
                          <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 text-xs font-bold h-10 px-6"
                          >
                            Regenerate This
                          </Button>
                          <Button className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold h-10 px-6">
                            Apply to Ads
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
