/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Loader2,
  Search,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

export default function TeamManagement() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "staff" as "business_admin" | "staff",
  });

  const fetchMembers = async () => {
    if (!profile?.businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("business_id", profile.businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error("Error fetching team members:", err);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [profile?.businessId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.businessId) return;

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/create-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          businessId: profile.businessId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create member");
      }

      toast.success("Team member registered successfully!");
      setShowAddModal(false);
      setFormData({ email: "", password: "", role: "staff" });
      fetchMembers();
    } catch (err: any) {
      console.error("Error adding member:", err);
      toast.error(err.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === profile?.uid) {
      toast.error("You can't remove yourself");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ business_id: null, role: "client" }) // Reset to client role and no business
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Member removed from team");
      setShowDeleteModal(null);
      fetchMembers();
    } catch (err: any) {
      console.error("Error removing member:", err);
      toast.error("Failed to remove member");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Role updated");
      fetchMembers();
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast.error("Failed to update role");
    }
  };

  const filteredMembers = members.filter((m) =>
    m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your business admins and staff members.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 h-11 px-6 font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <UserPlus className="h-4 w-4" /> Add Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Role Guide</CardTitle>
            <CardDescription>Permissions by role level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-bold">Business Admin</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full access to all business features, settings, billing, and
                team management.
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold">Staff</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Access to CRM, appointments, products, and website editing.
                Cannot access billing or team management.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl"
            />
          </div>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      User
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Role
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-6" colSpan={5}>
                          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Users className="h-10 w-10 text-slate-300" />
                          <p className="text-slate-500 font-medium">
                            No team members found.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {member.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {member.email}
                              </p>
                              {member.id === profile?.uid && (
                                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            defaultValue={member.role}
                            disabled={member.id === profile?.uid}
                            onValueChange={(val) =>
                              handleUpdateRole(member.id, val)
                            }
                          >
                            <SelectTrigger className="w-40 h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="business_admin">
                                Business Admin
                              </SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100 py-0.5 font-bold uppercase text-[10px] tracking-wide">
                            {member.status || "Active"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.id !== profile?.uid && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl border-slate-200"
                              >
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer"
                                  onClick={() => setShowDeleteModal(member.id)}
                                >
                                  <Trash2 className="h-4 w-4" /> Remove from
                                  Team
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <UserPlus className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Add Team Member
            </DialogTitle>
            <DialogDescription>
              Register a new account for your business staff. They will be able
              to log in with these credentials immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-bold text-xs uppercase tracking-wider text-slate-500"
                >
                  Member Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-bold text-xs uppercase tracking-wider text-slate-500"
                >
                  Initial Password
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Share this password with them securely. They can change it
                  later.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="font-bold text-xs uppercase tracking-wider text-slate-500"
                >
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: any) =>
                    setFormData({ ...formData, role: val })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_admin">
                      Business Admin (Full Access)
                    </SelectItem>
                    <SelectItem value="staff">
                      Staff (Limited Access)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl h-11 px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold"
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!showDeleteModal}
        onOpenChange={() => setShowDeleteModal(null)}
      >
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Remove Team Member?
            </DialogTitle>
            <DialogDescription>
              This user will lose access to all business data and features
              immediately. This action can be undone by re-adding them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(null)}
              className="rounded-xl h-11 px-6 flex-1 border-slate-200"
              disabled={saving}
            >
              Keep Member
            </Button>
            <Button
              onClick={() =>
                showDeleteModal && handleRemoveMember(showDeleteModal)
              }
              variant="destructive"
              className="rounded-xl h-11 px-6 flex-1 font-bold bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
