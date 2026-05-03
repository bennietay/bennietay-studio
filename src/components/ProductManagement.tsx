import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  Save,
  CreditCard,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { cn, formatDate } from "@/src/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export function ProductManagement() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  useEffect(() => {
    if (!profile?.businessId) return;

    fetchProducts();

    const channel = supabase
      .channel(`products-${profile.businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `business_id=eq.${profile.businessId}`,
        },
        () => fetchProducts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.businessId]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", profile?.businessId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        // If table doesn't exist yet, we show empty state rather than error toast
        // to avoid annoying the user if it's just a schema sync delay
        setProducts([]);
        return;
      }
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    if (!profile?.businessId) return;

    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", profile.businessId)
        .order("created_at", { ascending: false });

      if (error) {
        // If the table doesn't exist yet (PGRST204) or schema cache issue, fail silently
        if (
          error.code === "PGRST204" ||
          error.message?.includes("schema cache")
        ) {
          console.warn("Orders table not yet available in schema cache");
          setOrders([]);
          return;
        }
        throw error;
      }
      setOrders(data || []);
    } catch (err) {
      console.error("Fatal error fetching orders:", err);
      // We keep the toast for non-expected errors
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }

  const handleAddProduct = () => {
    setCurrentProduct({
      name: "",
      price: "",
      category: "Service",
      status: "active",
      stock: "Unlimited",
      description: "",
      image_url: "",
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setCurrentProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;
      toast.success("Product deleted successfully");
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !profile?.businessId) return;

    try {
      setIsSaving(true);
      const productData = {
        name: currentProduct.name,
        price: parseFloat(currentProduct.price) || 0,
        category: currentProduct.category,
        status: currentProduct.status,
        stock: currentProduct.stock,
        description: currentProduct.description,
        image_url: currentProduct.image_url,
        business_id: profile.businessId,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (currentProduct.id) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", currentProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(currentProduct.id ? "Product updated" : "Product added");
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(
        "Failed to save product. Ensure the products table exists in the database.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">
            Commerce & Inventory
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Manage your boutique and track client acquisitions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="rounded-2xl h-12 bg-slate-950 hover:bg-slate-900 font-black uppercase tracking-widest text-[10px] px-6 gap-2"
            onClick={handleAddProduct}
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="products"
        className="w-full"
        onValueChange={(val) => val === "orders" && fetchOrders()}
      >
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 mb-8">
          <TabsTrigger
            value="products"
            className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full"
          >
            Inventory ({products.length})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full"
          >
            Sales & Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    className="group bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] transition-all duration-500"
                  >
                    <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative group-hover:shadow-inner">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all text-slate-600 hover:bg-slate-950 hover:text-white border-none shadow-xl"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all border-none shadow-xl"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="text-[8px] font-black uppercase tracking-[0.2em] border-slate-200 text-slate-400"
                          >
                            {product.category}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[8px] font-black uppercase tracking-[0.2em] border-none px-2 rounded-lg",
                              product.status === "active"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-slate-100 text-slate-400",
                            )}
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-black tracking-tighter uppercase text-slate-900 line-clamp-1">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Unit Price
                          </span>
                          <span className="text-lg font-black tracking-tighter text-slate-900">
                            ${product.price}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Availability
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {product.stock}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {product.description || "No description provided."}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">
                  No items found
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Start by adding your first product to the gallery.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="rounded-[2.5rem] border-slate-100 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-950 leading-none">
                    Recent Acquisitions
                  </CardTitle>
                  <CardDescription className="font-medium text-slate-400 mt-1">
                    Real-time purchase activity for your business.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-black uppercase tracking-widest text-[8px] gap-2 h-10 px-4 border-slate-200 hover:bg-white"
                  onClick={fetchOrders}
                >
                  <RefreshCw
                    className={cn("h-3 w-3", loadingOrders && "animate-spin")}
                  />{" "}
                  Update
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingOrders ? (
                <div className="p-20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-50">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Order ID
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Customer
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Item
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Amount
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="group border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                        >
                          <td className="px-8 py-6">
                            <span className="font-mono text-[10px] text-slate-400">
                              #{order.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                                {order.customer_name || "Guest"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {order.customer_email}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                                  {order.items?.[0]?.name || "Product"}
                                  {order.items?.length > 1 &&
                                    ` +${order.items.length - 1} more`}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  Qty: {order.items?.[0]?.quantity || 1}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-black tracking-tighter text-slate-950">
                              ${order.total_amount}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <Badge
                              className={cn(
                                "text-[8px] font-black uppercase tracking-[0.2em] border-none px-3 py-1 rounded-lg",
                                order.status === "paid"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-amber-100 text-amber-600",
                              )}
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-bold text-slate-400">
                              {formatDate(new Date(order.created_at).getTime())}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-32">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter leading-none">
                    No sales yet
                  </h3>
                  <p className="text-slate-400 text-xs mt-2">
                    Acquisitions will appear here once customers start buying.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <form onSubmit={handleSaveProduct}>
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentProduct?.id ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Configure your product or professional service.
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 pt-0 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Image Preview / Upload UI */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Product Image URL
                </Label>
                <div className="flex gap-4 items-start">
                  <div className="h-28 w-28 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                    {currentProduct?.image_url ? (
                      <img
                        src={currentProduct.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="https://images.unsplash.com/..."
                      className="rounded-xl h-12 bg-white dark:bg-slate-900"
                      value={currentProduct?.image_url || ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          image_url: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-slate-400">
                      Use a high-quality image URL to represent your digital
                      product or service.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Product Name
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Strategy Audit"
                    className="rounded-xl h-12 bg-white dark:bg-slate-900"
                    value={currentProduct?.name || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Category
                  </Label>
                  <Select
                    value={currentProduct?.category}
                    onValueChange={(val) =>
                      setCurrentProduct({ ...currentProduct, category: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Product">Physical Product</SelectItem>
                      <SelectItem value="Digital">Digital Download</SelectItem>
                      <SelectItem value="Service">
                        Professional Service
                      </SelectItem>
                      <SelectItem value="Subscription">
                        Monthly Subscription
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Price (USD)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="rounded-xl h-12 bg-white dark:bg-slate-900 font-bold"
                    value={currentProduct?.price || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Inventory / Stock
                  </Label>
                  <Input
                    placeholder="e.g. Unlimited"
                    className="rounded-xl h-12 bg-white dark:bg-slate-900"
                    value={currentProduct?.stock || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        stock: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Description
                </Label>
                <Textarea
                  placeholder="Tell your customers about the value this product provides..."
                  className="rounded-xl min-h-[120px] py-3 bg-white dark:bg-slate-900"
                  value={currentProduct?.description || ""}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Active for Sale
                  </span>
                  <span className="text-xs text-slate-500">
                    Enable this to show the product on your website.
                  </span>
                </div>
                <Badge
                  variant={
                    currentProduct?.status === "active"
                      ? "default"
                      : "secondary"
                  }
                  className={cn(
                    "cursor-pointer rounded-full h-8 px-4",
                    currentProduct?.status === "active"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "",
                  )}
                  onClick={() =>
                    setCurrentProduct({
                      ...currentProduct,
                      status:
                        currentProduct.status === "active" ? "draft" : "active",
                    })
                  }
                >
                  {currentProduct?.status === "active" ? "Active" : "Draft"}
                </Badge>
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl h-12 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 min-w-[140px] h-12 px-6 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {currentProduct?.id ? "Update Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border-none shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-[2.5rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-center">
                Delete Product?
              </DialogTitle>
              <DialogDescription className="text-center text-slate-500">
                This will permanently remove{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  "{productToDelete?.name}"
                </span>
                . This action is irreversible.
              </DialogDescription>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-14"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-14 bg-red-500 hover:bg-red-600 shadow-xl shadow-red-100 dark:shadow-none"
                onClick={confirmDelete}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
