/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { generateBlogPost } from "@/src/lib/gemini";
import { Helmet } from "react-helmet-async";
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
  Zap,
  Save,
  Eye,
  Loader2,
  X,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { BlogPost } from "../types";
import { formatDate, generateId } from "@/src/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

interface BlogCMSProps {
  isPlatform?: boolean;
}

export function BlogCMS({ isPlatform = false }: BlogCMSProps) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(
    null,
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const businessId = isPlatform ? "platform" : profile?.businessId;

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts(data.map(mapPost));
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    const channel = supabase
      .channel("blog-cms-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchPosts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const mapPost = (dbPost: any): BlogPost => ({
    id: dbPost.id,
    businessId: dbPost.business_id,
    title: dbPost.title,
    content: dbPost.content,
    excerpt: dbPost.excerpt,
    author: dbPost.author,
    status: dbPost.status,
    createdAt: new Date(dbPost.created_at).getTime(),
    updatedAt: new Date(dbPost.updated_at).getTime(),
    imageUrl: dbPost.image_url,
    slug: dbPost.slug,
  });

  const handleSave = async () => {
    if (!editingPost || !businessId) return;

    const postData: any = {
      title: editingPost.title,
      content: editingPost.content,
      excerpt: editingPost.excerpt,
      author: editingPost.author || profile?.email,
      status: editingPost.status || "draft",
      business_id: businessId,
      image_url: editingPost.imageUrl,
      slug:
        editingPost.slug ||
        editingPost.title
          ?.toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "") ||
        generateId(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingPost.id) {
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editingPost.id);
        if (error) throw error;
      } else {
        postData.created_at = new Date().toISOString();
        const { error } = await supabase.from("posts").insert([postData]);
        if (error) throw error;
      }
      setEditingPost(null);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic || !businessId) return;
    setAiLoading(true);
    try {
      const aiResponse = await generateBlogPost(aiTopic, businessId);
      setEditingPost({
        title: aiResponse.title,
        excerpt: aiResponse.excerpt,
        content: aiResponse.content,
        status: "draft",
      });
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingPost({ ...editingPost, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  if (editingPost) {
    return (
      <div className="space-y-6">
        <Helmet>
          <title>
            {editingPost.id
              ? `Edit: ${editingPost.title} | Blog CMS`
              : "New Post | Blog CMS"}
          </title>
          <meta
            name="description"
            content={`Authoring high-impact content for ${profile?.email}. Draft, edit, and optimize your latest business insights.`}
          />
        </Helmet>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {editingPost.id ? "Edit Post" : "New Post"}
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditingPost(null)}>
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
              <Save className="h-4 w-4" /> Save Post
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Post Title</Label>
                  <Input
                    value={editingPost.title || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Content (Markdown)
                  </label>
                  <textarea
                    className="flex min-h-[400px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    value={editingPost.content || ""}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
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
                <CardTitle className="text-base">Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={editingPost.status || "draft"}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Excerpt</Label>
                  <Input
                    value={editingPost.excerpt || ""}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        excerpt: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Author</Label>
                  <Input
                    value={editingPost.author || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, author: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>URL Slug</Label>
                  <Input
                    value={editingPost.slug || ""}
                    placeholder="my-awesome-post"
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Featured Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-indigo-400 transition-colors cursor-pointer relative group">
                    {editingPost.imageUrl ? (
                      <div className="relative w-full aspect-video">
                        <img
                          src={editingPost.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-md"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() =>
                            setEditingPost({
                              ...editingPost,
                              imageUrl: undefined,
                            })
                          }
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          PNG, JPG, GIF up to 2MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50 border-indigo-100">
              <CardHeader>
                <CardTitle className="text-base text-indigo-700 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Content Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Topic for generation..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={handleGenerateAI}
                  isLoading={aiLoading}
                >
                  Regenerate Content
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Blog Management | Bennie Tay Studio</title>
        <meta
          name="description"
          content="Advanced Blog CMS for orchestrating enterprise-grade marketing content and thought leadership."
        />
      </Helmet>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog CMS</h1>
          <p className="text-slate-500 mt-1">
            Manage your business blog and content marketing.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <Input
              placeholder="Topic..."
              className="border-0 shadow-none focus-visible:ring-0 w-48 h-8"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <Button
              size="sm"
              className="gap-2"
              onClick={handleGenerateAI}
              isLoading={aiLoading}
            >
              <Zap className="h-3 w-3" /> Smart Write
            </Button>
          </div>
          <Button onClick={() => setEditingPost({})} className="gap-2">
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="group overflow-hidden flex flex-col">
            <div className="h-40 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FileText className="h-12 w-12" />
              )}
            </div>
            <CardHeader className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <Badge
                  variant={
                    post.status === "published" ? "success" : "secondary"
                  }
                >
                  {post.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-500">
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {post.title}
              </CardTitle>
              <CardDescription className="line-clamp-3 mt-2">
                {post.excerpt}
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t border-slate-100 pt-4 flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPost(post)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePost(post.id)}
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" /> View
              </Button>
            </CardFooter>
          </Card>
        ))}
        {posts.length === 0 && (
          <div className="col-span-full text-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold">No posts yet</h3>
            <p className="text-slate-500 mb-6">
              Start writing or use our assistant to generate your first blog
              post.
            </p>
            <Button onClick={() => setEditingPost({})} className="gap-2">
              <Plus className="h-4 w-4" /> Create First Post
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && editingPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold">Post Preview</h3>
                  <p className="text-sm text-slate-500">
                    How your post will look to readers
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="space-y-4">
                    <Badge variant="secondary">PREVIEW MODE</Badge>
                    <h1 className="text-4xl font-bold text-slate-900">
                      {editingPost.title || "Untitled Post"}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>By {editingPost.author || profile?.email}</span>
                      <span>•</span>
                      <span>{formatDate(Date.now())}</span>
                    </div>
                  </div>

                  {editingPost.excerpt && (
                    <p className="text-xl text-slate-600 italic border-l-4 border-indigo-500 pl-6 py-2">
                      {editingPost.excerpt}
                    </p>
                  )}

                  {editingPost.imageUrl && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={editingPost.imageUrl}
                        alt={editingPost.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{editingPost.content || ""}</ReactMarkdown>
                  </div>

                  <div className="pt-12 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                      SEO Preview
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-white rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          B
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-700 font-medium leading-none">
                            Bennie Tay Studio
                          </span>
                          <span className="text-[10px] text-slate-400 leading-none mt-0.5">
                            https://{profile?.businessId || "your-business"}
                            .bennietay.com › blog ›{" "}
                            {editingPost.slug ||
                              editingPost.title
                                ?.toLowerCase()
                                .trim()
                                .replace(/[^\w\s-]/g, "")
                                .replace(/[\s_-]+/g, "-")
                                .replace(/^-+|-+$/g, "") ||
                              "untitled-post"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer mb-1">
                        {editingPost.title || "Untitled Post"} |{" "}
                        {profile?.businessId?.toUpperCase() || "Blog"}
                      </p>
                      <p className="text-[#4d5156] text-sm line-clamp-2 leading-relaxed">
                        <span className="text-slate-500">
                          {formatDate(Date.now())} —{" "}
                        </span>
                        {editingPost.excerpt ||
                          (editingPost.content
                            ? editingPost.content
                                .substring(0, 160)
                                .replace(/[#*`]/g, "")
                                .trim() + "..."
                            : "Discover insights and professional advice on our latest blog post. Click to read the full article and stay updated with our business news.")}
                      </p>
                    </div>
                  </div>
                </div>
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
