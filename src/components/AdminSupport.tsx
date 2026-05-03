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
import { Badge } from "./ui/badge";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  MoreVertical,
  ArrowUpDown,
  Trash2,
  Flag,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
  user_email?: string;
  template_id?: string;
  template?: { name: string; category: string };
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);

      const channel = supabase
        .channel(`admin_ticket_messages:${selectedTicket.id}`)
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
      let query = supabase
        .from("support_tickets")
        .select(
          `
          *,
          user:user_id (email),
          template:template_id (name, category)
        `,
        )
        .order("updated_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedTickets = (data || []).map((t: any) => ({
        ...t,
        user_email: t.user?.email,
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load support tickets");
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

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === "open") {
        await supabase
          .from("support_tickets")
          .update({ status: "in_progress" })
          .eq("id", selectedTicket.id);

        setSelectedTicket((prev) =>
          prev ? { ...prev, status: "in_progress" } : null,
        );
        fetchTickets();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const updateTicketStatus = async (status: Ticket["status"]) => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      fetchTickets();
      toast.success(`Ticket marked as ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const updateTicketPriority = async (priority: Ticket["priority"]) => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket((prev) => (prev ? { ...prev, priority } : null));
      fetchTickets();
      toast.success(`Priority updated to ${priority}`);
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const deleteTicket = async () => {
    if (!selectedTicket) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this ticket? This action cannot be undone.",
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", selectedTicket.id);

      if (error) throw error;

      toast.success("Ticket deleted successfully");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const filteredAndSortedTickets = React.useMemo(() => {
    let result = tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

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
  }, [tickets, searchQuery, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Support Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage and respond to platform support tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div
          className={cn(
            "lg:col-span-1 space-y-4",
            selectedTicket ? "hidden lg:block" : "block",
          )}
        >
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-9 rounded-xl h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all", "open", "in_progress", "resolved", "closed"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all",
                          statusFilter === status
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-600",
                        )}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ),
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-auto">
                    Sort By
                  </span>
                  <button
                    onClick={() => setSortBy("date")}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-colors",
                      sortBy === "date"
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setSortBy("priority")}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-colors",
                      sortBy === "priority"
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    Priority
                  </button>
                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ArrowUpDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        sortOrder === "asc" && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto scrollbar-hide">
              {filteredAndSortedTickets.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAndSortedTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col gap-2",
                        selectedTicket?.id === ticket.id
                          ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-indigo-600"
                          : "border-l-4 border-transparent",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          #{ticket.id.substring(0, 8)}
                        </span>
                        <Badge
                          className={cn(
                            "text-[8px] rounded-full px-1.5 py-0",
                            ticket.status === "open"
                              ? "bg-blue-100 text-blue-600"
                              : ticket.status === "in_progress"
                                ? "bg-amber-100 text-amber-600"
                                : ticket.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {ticket.subject}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">
                          {ticket.user_email}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div
          className={cn(
            "lg:col-span-2",
            !selectedTicket ? "hidden lg:block" : "block",
          )}
        >
          {selectedTicket ? (
            <Card className="h-[700px] flex flex-col rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden rounded-xl"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedTicket.subject}
                      </CardTitle>
                      <CardDescription>
                        {selectedTicket.user_email}
                        {selectedTicket.template && (
                          <span className="ml-2 text-indigo-600 font-medium">
                            • Template: {selectedTicket.template.name} (
                            {selectedTicket.template.category})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      value={selectedTicket.status}
                      onChange={(e) =>
                        updateTicketStatus(e.target.value as any)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-xl h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50"
                      >
                        <DropdownMenuLabel>Ticket Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => updateTicketPriority("high")}
                        >
                          <Flag className="mr-2 h-4 w-4 text-red-500" />
                          <span>Set High Priority</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTicketPriority("medium")}
                        >
                          <Flag className="mr-2 h-4 w-4 text-amber-500" />
                          <span>Set Medium Priority</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTicketPriority("low")}
                        >
                          <Flag className="mr-2 h-4 w-4 text-emerald-500" />
                          <span>Set Low Priority</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={deleteTicket}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Ticket</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col",
                      msg.sender_id === user?.id ? "items-end" : "items-start",
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
                    placeholder="Type your response..."
                    className="rounded-xl flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <MessageSquare className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Select a ticket
              </h3>
              <p className="text-sm max-w-xs text-center mt-2">
                Choose a ticket from the list to view the conversation and
                respond to the user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
