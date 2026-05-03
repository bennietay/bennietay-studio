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
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Headphones,
  Loader2,
  ArrowLeft,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function Support() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTicketData, setNewTicketData] = useState({
    subject: "",
    description: "",
    priority: "medium" as const,
    templateId: "",
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedTickets = React.useMemo(() => {
    let result = [...tickets];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        const priorityMap = { low: 1, medium: 2, high: 3 };
        const prioA = priorityMap[a.priority] || 0;
        const prioB = priorityMap[b.priority] || 0;
        return sortOrder === "desc" ? prioB - prioA : prioA - prioB;
      }
    });

    return result;
  }, [tickets, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, category");
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`ticket_messages:${selectedTicket.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_messages",
            filter: `ticket_id=eq.${selectedTicket.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.subject || !newTicketData.description) return;

    setSending(true);
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert([
          {
            user_id: user?.id,
            subject: newTicketData.subject,
            priority: newTicketData.priority,
            status: "open",
            template_id: newTicketData.templateId || null,
          },
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { error: messageError } = await supabase
        .from("support_messages")
        .insert([
          {
            ticket_id: ticket.id,
            sender_id: user?.id,
            content: newTicketData.description,
          },
        ]);

      if (messageError) throw messageError;

      toast.success("Support ticket created successfully");
      setShowNewTicket(false);
      setNewTicketData({
        subject: "",
        description: "",
        priority: "medium",
        templateId: "",
      });
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create support ticket");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    const content = newMessage.trim();
    setNewMessage("");
    try {
      const { error } = await supabase.from("support_messages").insert([
        {
          ticket_id: selectedTicket.id,
          sender_id: user?.id,
          content,
        },
      ]);

      if (error) throw error;

      // Update ticket status to in_progress if it was resolved/closed or just keep it open
      if (
        selectedTicket.status === "resolved" ||
        selectedTicket.status === "closed"
      ) {
        await supabase
          .from("support_tickets")
          .update({ status: "open" })
          .eq("id", selectedTicket.id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Support Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Get help with your account or report issues.
          </p>
        </div>
        {!selectedTicket && !showNewTicket && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32 border-none bg-transparent focus:ring-0">
                  <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-9 w-32 border-none bg-transparent focus:ring-0">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
              >
                <ArrowUpDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    sortOrder === "asc" && "rotate-180",
                  )}
                />
              </Button>
            </div>
            <Button
              onClick={() => setShowNewTicket(true)}
              className="gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showNewTicket ? (
          <motion.div
            key="new-ticket"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewTicket(false)}
                    className="rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                </div>
                <CardTitle>Create New Support Ticket</CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you as soon as
                  possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="Brief summary of the issue"
                      value={newTicketData.subject}
                      onChange={(e) =>
                        setNewTicketData({
                          ...newTicketData,
                          subject: e.target.value,
                        })
                      }
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        value={newTicketData.priority}
                        onChange={(e) =>
                          setNewTicketData({
                            ...newTicketData,
                            priority: e.target.value as any,
                          })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Related Template (Optional)</Label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        value={newTicketData.templateId}
                        onChange={(e) =>
                          setNewTicketData({
                            ...newTicketData,
                            templateId: e.target.value,
                          })
                        }
                      >
                        <option value="">None</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Detailed description of the problem..."
                      className="min-h-[150px] rounded-xl"
                      value={newTicketData.description}
                      onChange={(e) =>
                        setNewTicketData({
                          ...newTicketData,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl"
                    isLoading={sending}
                  >
                    Submit Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : selectedTicket ? (
          <motion.div
            key="ticket-chat"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 flex flex-col h-[600px]">
              <Card className="flex-1 flex flex-col rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(null)}
                        className="rounded-xl"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedTicket.subject}
                        </CardTitle>
                        <CardDescription>
                          Ticket #{selectedTicket.id.substring(0, 8)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full px-3",
                        selectedTicket.status === "open"
                          ? "bg-blue-100 text-blue-600"
                          : selectedTicket.status === "in_progress"
                            ? "bg-amber-100 text-amber-600"
                            : selectedTicket.status === "resolved"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {selectedTicket.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex flex-col",
                        msg.sender_id === user?.id
                          ? "items-end"
                          : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-4 rounded-2xl text-sm",
                          msg.sender_id === user?.id
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none",
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="border-t border-slate-100 dark:border-slate-800 p-4">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex w-full gap-2"
                  >
                    <Input
                      placeholder="Type your message..."
                      className="rounded-xl flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={selectedTicket.status === "closed"}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-xl"
                      disabled={selectedTicket.status === "closed"}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-sm uppercase tracking-widest text-slate-400">
                    Ticket Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Priority</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full",
                        selectedTicket.priority === "high"
                          ? "text-red-600 border-red-200 bg-red-50"
                          : selectedTicket.priority === "medium"
                            ? "text-amber-600 border-amber-200 bg-amber-50"
                            : "text-blue-600 border-blue-200 bg-blue-50",
                      )}
                    >
                      {selectedTicket.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Created</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedTicket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Last Update</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedTicket.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <div className="bg-indigo-600 rounded-3xl p-6 text-white space-y-4">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Need faster help?</h3>
                  <p className="text-xs text-indigo-100 mt-1">
                    Our premium support team is available 24/7 for priority
                    customers.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ticket-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {filteredAndSortedTickets.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No support tickets found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                  {statusFilter !== "all"
                    ? `No tickets with status "${statusFilter}" were found.`
                    : "If you have any questions or issues, create a ticket and our team will help you."}
                </p>
                {statusFilter === "all" && (
                  <Button
                    onClick={() => setShowNewTicket(true)}
                    variant="outline"
                    className="mt-6 rounded-xl gap-2"
                  >
                    <Plus className="h-4 w-4" /> Create Your First Ticket
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center",
                            ticket.status === "resolved"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-indigo-50 text-indigo-600",
                          )}
                        >
                          {ticket.status === "resolved" ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <MessageSquare className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {ticket.subject}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />{" "}
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] rounded-full px-2 py-0",
                                ticket.priority === "high"
                                  ? "text-red-600 border-red-200"
                                  : ticket.priority === "medium"
                                    ? "text-amber-600 border-amber-200"
                                    : "text-blue-600 border-blue-200",
                              )}
                            >
                              {ticket.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          className={cn(
                            "rounded-full px-3",
                            ticket.status === "open"
                              ? "bg-blue-100 text-blue-600"
                              : ticket.status === "in_progress"
                                ? "bg-amber-100 text-amber-600"
                                : ticket.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
