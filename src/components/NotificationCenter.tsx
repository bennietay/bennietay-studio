import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Info,
  CreditCard,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Notification } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button, buttonVariants } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export function NotificationCenter() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = {
            id: payload.new.id,
            userId: payload.new.user_id,
            businessId: payload.new.business_id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            isRead: payload.new.is_read,
            metadata: payload.new.metadata,
            createdAt: new Date(payload.new.created_at).getTime(),
          } as Notification;

          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Trigger toast
          toast(newNotif.title, {
            description: newNotif.message,
            icon: getIcon(newNotif.type),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped = (data || []).map((n) => ({
        id: n.id,
        userId: n.user_id,
        businessId: n.business_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        metadata: n.metadata,
        createdAt: new Date(n.created_at).getTime(),
      })) as Notification[];

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <Users className="h-4 w-4 text-emerald-500" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      case "payout":
        return <DollarSign className="h-4 w-4 text-amber-500" />;
      case "billing":
        return <CreditCard className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative rounded-full",
        )}
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 rounded-3xl overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-700"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "p-4 group relative flex gap-3 transition-colors",
                      !n.isRead
                        ? "bg-indigo-50/30 dark:bg-indigo-900/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        !n.isRead
                          ? "bg-indigo-100 dark:bg-indigo-900/30"
                          : "bg-slate-100 dark:bg-slate-800",
                      )}
                    >
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between pr-8">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            !n.isRead
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-600 dark:text-slate-400",
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-inherit pl-2">
                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-emerald-100 hover:text-emerald-600"
                            onClick={() => markAsRead(n.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-red-100 hover:text-red-600"
                          onClick={() => deleteNotification(n.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <Button variant="link" className="text-xs font-bold text-slate-500">
            View All Activity
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
