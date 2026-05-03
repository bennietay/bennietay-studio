import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Globe,
  Plus,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  Search,
  AlertCircle,
  Percent,
} from "lucide-react";
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
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { toast } from "sonner";

interface GeoAdjustment {
  country_code: string;
  country_name: string;
  discount_percentage: number;
  stripe_coupon_id?: string;
  is_enabled: boolean;
}

export function GeoPricingEditor() {
  const [adjustments, setAdjustments] = useState<GeoAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newCountry, setNewCountry] = useState({
    country_code: "",
    country_name: "",
    discount_percentage: 20,
    stripe_coupon_id: "",
    is_enabled: true,
  });

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("geo_pricing")
        .select("*")
        .order("country_name", { ascending: true });

      if (error) throw error;
      setAdjustments(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch geo pricing: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async () => {
    if (!newCountry.country_code || !newCountry.country_name) {
      toast.error("Please enter both country code and name");
      return;
    }

    if (newCountry.country_code.length !== 2) {
      toast.error("Country code must be 2 characters (e.g. US, IN, BR)");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("geo_pricing").insert([
        {
          country_code: newCountry.country_code.toUpperCase(),
          country_name: newCountry.country_name,
          discount_percentage: newCountry.discount_percentage,
          stripe_coupon_id: newCountry.stripe_coupon_id || null,
          is_enabled: newCountry.is_enabled,
        },
      ]);

      if (error) throw error;

      toast.success(`Pricing for ${newCountry.country_name} added`);
      setNewCountry({
        ...newCountry,
        country_code: "",
        country_name: "",
        stripe_coupon_id: "",
      });
      fetchAdjustments();
    } catch (error: any) {
      toast.error("Failed to add country: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdjustment = async (
    code: string,
    updates: Partial<GeoAdjustment>,
  ) => {
    try {
      const { error } = await supabase
        .from("geo_pricing")
        .update(updates)
        .eq("country_code", code);

      if (error) throw error;

      setAdjustments(
        adjustments.map((a) =>
          a.country_code === code ? { ...a, ...updates } : a,
        ),
      );
      toast.success("Updated successfully");
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    }
  };

  const handleDeleteAdjustment = async (code: string) => {
    if (!code) {
      toast.error("Invalid country code");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to remove localized pricing for ${code}?`,
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      console.log("Attempting to delete geo-pricing for:", code);
      // Ensure we target the right record
      const { error, count } = await supabase
        .from("geo_pricing")
        .delete({ count: "exact" })
        .eq("country_code", code);

      if (error) throw error;

      if (count === 0) {
        toast.warning("No record found to delete");
      } else {
        setAdjustments(adjustments.filter((a) => a.country_code !== code));
        toast.success("Removed successfully");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(
        "Delete failed: " +
          (error.message || "Check permissions or connection"),
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.country_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                Localized Geo-Pricing (PPP)
              </CardTitle>
              <CardDescription>
                Offer localized discounts based on customer's purchasing power
                by country.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdjustments}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Add New Form */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-indigo-600">
                ISO Code
              </Label>
              <Input
                placeholder="e.g. IN"
                maxLength={2}
                value={newCountry.country_code}
                onChange={(e) =>
                  setNewCountry({ ...newCountry, country_code: e.target.value })
                }
                className="bg-white rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-indigo-600">
                Country Name
              </Label>
              <Input
                placeholder="e.g. India"
                value={newCountry.country_name}
                onChange={(e) =>
                  setNewCountry({ ...newCountry, country_name: e.target.value })
                }
                className="bg-white rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-indigo-600">
                Discount (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={newCountry.discount_percentage}
                  onChange={(e) =>
                    setNewCountry({
                      ...newCountry,
                      discount_percentage: parseInt(e.target.value),
                    })
                  }
                  className="bg-white rounded-xl pr-10"
                />
                <Percent className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-indigo-600">
                Stripe Coupon
              </Label>
              <Input
                placeholder="PROMO_IN_40"
                value={newCountry.stripe_coupon_id}
                onChange={(e) =>
                  setNewCountry({
                    ...newCountry,
                    stripe_coupon_id: e.target.value,
                  })
                }
                className="bg-white rounded-xl"
              />
            </div>
            <Button
              onClick={handleAddCountry}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 shadow-lg shadow-indigo-100"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Location
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[100px]">ISO</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Stripe Coupon</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredAdjustments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-slate-400 italic"
                    >
                      No localized pricing configured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdjustments.map((adj) => (
                    <TableRow key={adj.country_code}>
                      <TableCell>
                        <Badge variant="outline">{adj.country_code}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {adj.country_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-20 h-8 rounded-lg"
                            value={adj.discount_percentage}
                            onBlur={(e) =>
                              handleUpdateAdjustment(adj.country_code, {
                                discount_percentage: parseInt(e.target.value),
                              })
                            }
                          />
                          <span className="text-xs text-slate-500">% off</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Coupon ID"
                          className="h-8 rounded-lg text-xs"
                          defaultValue={adj.stripe_coupon_id}
                          onBlur={(e) =>
                            handleUpdateAdjustment(adj.country_code, {
                              stripe_coupon_id: e.target.value || undefined,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={adj.is_enabled}
                          onCheckedChange={(checked) =>
                            handleUpdateAdjustment(adj.country_code, {
                              is_enabled: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteAdjustment(adj.country_code)
                          }
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t p-6">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>
              Discounts are detected automatically based on user IP address
              during the pricing page visit.
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
