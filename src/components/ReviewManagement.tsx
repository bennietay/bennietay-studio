import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Star,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export function ReviewManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();

        if (profile?.business_id) {
          setBusinessId(profile.business_id);
          fetchReviews(profile.business_id);
        }
      }
    };
    init();
  }, []);

  const fetchReviews = async (bizId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", bizId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      toast.error("Failed to fetch reviews: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      setActionLoading(reviewId);
      const { error } = await supabase
        .from("reviews")
        .update({ status: newStatus })
        .eq("id", reviewId);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r)),
      );
      toast.success(`Review ${newStatus} successfully`);
    } catch (err: any) {
      toast.error("Failed to update review: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      setActionLoading(reviewId);
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete review: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const stats = {
    avgRating:
      reviews.length > 0
        ? (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(1)
        : "0.0",
    pending: reviews.filter((r) => r.status === "pending").length,
    published: reviews.filter((r) => r.status === "published").length,
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Customer Reviews
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Manage and showcase your customer testimonials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {reviews.slice(0, 4).map((r, i) => (
              <div
                key={r.id}
                className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden"
              >
                <div className="h-full w-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  {r.author.charAt(0)}
                </div>
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-500">
            {reviews.length} Total Reviews
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Average Rating",
            value: stats.avgRating,
            icon: Star,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Pending Approval",
            value: stats.pending.toString(),
            icon: Clock,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Published",
            value: stats.published.toString(),
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-2xl ${stat.bg} dark:bg-slate-800 flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Feedback
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    No reviews yet
                  </h4>
                  <p className="text-sm text-slate-500 max-w-xs">
                    When customers leave feedback on your site, they will appear
                    here for you to manage.
                  </p>
                </div>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div
                  layout
                  key={review.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">
                        {review.author.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {review.author}
                          </h4>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                          {review.comment}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(review.created_at)}
                          </span>
                          <Badge
                            variant={
                              review.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className={cn(
                              "text-[10px] px-2 py-0 capitalize font-bold",
                              review.status === "published"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : review.status === "pending"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-red-50 text-red-600 border-red-100",
                            )}
                          >
                            {review.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AnimatePresence mode="wait">
                        {actionLoading === review.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        ) : review.status === "pending" ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusChange(review.id, "published")
                              }
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-[10px] font-bold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleStatusChange(review.id, "rejected")
                              }
                              className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 h-8 px-3 text-[10px] font-bold"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(review.id)}
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
