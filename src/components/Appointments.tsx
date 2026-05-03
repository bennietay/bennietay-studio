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
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Search,
  Filter,
  Plus,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Zap,
} from "lucide-react";
import { Appointment } from "../types";
import { formatDate, cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export function Appointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "calendar">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newAppointment, setNewAppointment] = useState({
    customerName: "",
    customerEmail: "",
    service: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    status: "pending" as Appointment["status"],
  });

  useEffect(() => {
    if (!profile?.businessId) {
      setLoading(false);
      return;
    }

    fetchAppointments();

    const channel = supabase
      .channel(`appointments-${profile.businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${profile.businessId}`,
        },
        (payload) => {
          console.log("Postgres changes received:", payload);
          fetchAppointments();
        },
      )
      .subscribe((status) => {
        console.log(`Supabase real-time status for appointments: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.businessId]);

  const fetchAppointments = async () => {
    if (!profile?.businessId) return;
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", profile.businessId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;
      setAppointments(data.map(mapAppointment));
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const mapAppointment = (dbApp: any): Appointment => ({
    id: dbApp.id,
    businessId: dbApp.business_id,
    customerName: dbApp.customer_name,
    customerEmail: dbApp.customer_email,
    service: dbApp.service,
    date: dbApp.date,
    time: dbApp.time,
    status: dbApp.status,
    createdAt: dbApp.created_at,
    updatedAt: dbApp.updated_at,
  });

  const handleAddAppointment = async () => {
    if (
      !profile?.businessId ||
      !newAppointment.customerName ||
      !newAppointment.customerEmail
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const appData = {
        business_id: profile.businessId,
        customer_name: newAppointment.customerName,
        customer_email: newAppointment.customerEmail,
        service: newAppointment.service,
        date: newAppointment.date,
        time: newAppointment.time,
        status: newAppointment.status,
      };
      const { error } = await supabase.from("appointments").insert([appData]);

      if (error) throw error;

      toast.success("Appointment created successfully");
      setShowAddModal(false);
      setNewAppointment({
        customerName: "",
        customerEmail: "",
        service: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "10:00",
        status: "pending",
      });
      fetchAppointments();
    } catch (error) {
      console.error("Add appointment failed:", error);
      toast.error("Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetchAppointments();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update status");
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    if (!profile?.businessId) {
      toast.error("Session error: Business ID not found. Please refresh.");
      return;
    }

    setDeletingId(id);
    const deletePromise = async () => {
      try {
        const { error, count } = await supabase
          .from("appointments")
          .delete({ count: "exact" })
          .eq("id", id);

        if (error) throw error;
        if (count === 0)
          throw new Error("No permission or appointment missing");

        if (selectedAppointment?.id === id) setSelectedAppointment(null);
        await fetchAppointments();
        return true;
      } finally {
        setDeletingId(null);
      }
    };

    toast.promise(deletePromise(), {
      loading: "Deleting appointment...",
      success: "Appointment deleted successfully",
      error: (err) => `Delete failed: ${err.message}`,
    });
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calendar Logic
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getAppointmentsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return appointments.filter((app) => app.date === dayStr);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px] w-full rounded-3xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Appointments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your schedule and client bookings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className={cn(
                "rounded-lg h-8 px-3",
                view === "calendar"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-500",
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Calendar
            </Button>
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className={cn(
                "rounded-lg h-8 px-3",
                view === "table"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-500",
              )}
            >
              <List className="h-4 w-4 mr-2" /> Table
            </Button>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
          >
            <Plus className="h-4 w-4" /> New Appointment
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                className="rounded-xl"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
                className="rounded-xl px-4"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="rounded-xl"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {calendarDays.map((day, i) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={i}
                  className={cn(
                    "p-2 border-r border-b border-slate-100 dark:border-slate-800 transition-colors relative group",
                    !isCurrentMonth
                      ? "bg-slate-50/50 dark:bg-slate-800/20"
                      : "bg-white dark:bg-slate-900",
                    i % 7 === 6 ? "border-r-0" : "",
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={cn(
                        "text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full transition-colors",
                        isToday
                          ? "bg-indigo-600 text-white"
                          : isCurrentMonth
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-300 dark:text-slate-700",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                    {dayAppointments.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedAppointment(app)}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-all hover:scale-[1.02]",
                          app.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : app.status === "cancelled"
                              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                        )}
                      >
                        {app.time.substring(0, 5)} {app.customerName}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                    Customer
                  </th>
                  <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                    Service
                  </th>
                  <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                    Date & Time
                  </th>
                  <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
                    Status
                  </th>
                  <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                          {app.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className="cursor-pointer min-w-0"
                          onClick={() => setSelectedAppointment(app)}
                        >
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                            {app.customerName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                            {app.customerEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {app.service}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />{" "}
                          {app.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />{" "}
                          {app.time.substring(0, 5)}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge
                        variant={
                          app.status === "pending"
                            ? "warning"
                            : app.status === "confirmed"
                              ? "success"
                              : "destructive"
                        }
                        className="rounded-full px-3 py-0.5 text-[10px] uppercase tracking-widest"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(app.id, "confirmed")}
                          disabled={app.status === "confirmed"}
                          className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(app.id, "cancelled")}
                          disabled={app.status === "cancelled"}
                          className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAppointment(app.id)}
                          isLoading={deletingId === app.id}
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-20 text-center text-slate-500"
                    >
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Appointment Details Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Appointment Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAppointment(null)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-2xl font-bold">
                    {selectedAppointment.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedAppointment.customerName}
                    </h2>
                    <Badge
                      variant={
                        selectedAppointment.status === "pending"
                          ? "warning"
                          : selectedAppointment.status === "confirmed"
                            ? "success"
                            : "destructive"
                      }
                    >
                      {selectedAppointment.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Mail className="h-4 w-4" />{" "}
                    {selectedAppointment.customerEmail}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Zap className="h-4 w-4" /> {selectedAppointment.service}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <CalendarIcon className="h-4 w-4" />{" "}
                    {selectedAppointment.date}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4" /> {selectedAppointment.time}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-3">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteAppointment(selectedAppointment.id)}
                  isLoading={deletingId === selectedAppointment.id}
                  className="rounded-xl"
                >
                  <Trash2 className="h-5 w-5 text-white" />
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAppointment(null)}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                  {selectedAppointment.status !== "confirmed" && (
                    <Button
                      onClick={() => {
                        updateStatus(selectedAppointment.id, "confirmed");
                        setSelectedAppointment(null);
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      Confirm
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  New Appointment
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Customer Name</Label>
                  <Input
                    value={newAppointment.customerName}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        customerName: e.target.value,
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer Email</Label>
                  <Input
                    type="email"
                    value={newAppointment.customerEmail}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        customerEmail: e.target.value,
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Service</Label>
                  <Input
                    value={newAppointment.service}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        service: e.target.value,
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          date: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          time: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAppointment}
                  isLoading={saving}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Appointment
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
