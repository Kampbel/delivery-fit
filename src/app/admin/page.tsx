"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  ShoppingBag, 
  Tag, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Search,
  Plus,
  Save,
  X,
  MessageCircle,
  Upload,
  Trash2,
  Truck
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "promos">("orders");
  
  // State for data
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoadData() {
      // 1. Verificar Seguridad (Muralla Frontend)
      const { data: { session } } = await supabase.auth.getSession();
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      
      if (!session?.user || !adminEmails.includes(session.user.email || '')) {
        // Impostor detectado, expulsar a la página principal
        router.push('/');
        return; // Detener ejecución
      }
      
      // Usuario autorizado
      setIsAuthorized(true);

      // 2. Cargar Pedidos
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersData) setOrders(ordersData.map(o => ({
        id: o.id,
        customer: o.customer_name,
        phone: o.customer_phone,
        total: parseFloat(o.total_price),
        method: o.payment_method,
        operationRef: o.yape_operation,
        status: o.status,
        date: new Date(o.created_at).toLocaleTimeString()
      })));

      // Cargar Productos
      const { data: productsData } = await supabase
        .from('products')
        .select('*');
      
      if (productsData) setProducts(productsData);

      // Cargar Promociones
      const { data: promosData } = await supabase
        .from('promos')
        .select('*');
        
      if (promosData) setPromos(promosData);

      setLoading(false);
    }
    checkAuthAndLoadData();
  }, [router]);

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const handleNotifyCustomer = (order: any) => {
    const trackingLink = `http://localhost:3000/tracking?id=${order.id}`;
    const message = `¡Hola ${order.customer}! 👋%0A%0ATu pedido ha sido verificado y está siendo preparado.%0A%0APuedes seguir el estado de tu delivery en tiempo real aquí:%0A${trackingLink}%0A%0A¡Gracias por elegir PoncesFit!`;
    const whatsappUrl = `https://wa.me/${order.phone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const openEditModal = (product: any = null) => {
    if (product) {
      setEditingProduct({ ...product });
    } else {
      // Nuevo producto
      setEditingProduct({
        name: "",
        description: "",
        price: 0,
        status: "Activo",
        category: "General",
        image: ""
      });
    }
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    setProducts(products.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const [isUploading, setIsUploading] = useState(false);

  const saveProduct = async () => {
    setIsUploading(true);
    let imageUrl = editingProduct.image;

    if (editingProduct.imageFile) {
      const fileExt = editingProduct.imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, editingProduct.imageFile);
      
      if (!error) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const updatedProduct = { ...editingProduct, image: imageUrl };
    delete updatedProduct.imageFile;

    setIsEditModalOpen(false);
    
    if (updatedProduct.id) {
      // Actualizar
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      await supabase.from('products').update({
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        status: updatedProduct.status,
        category: updatedProduct.category,
        image: updatedProduct.image
      }).eq('id', updatedProduct.id);
    } else {
      // Crear
      const { data } = await supabase.from('products').insert([{
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        status: updatedProduct.status,
        category: updatedProduct.category,
        image: updatedProduct.image
      }]).select().single();
      
      if (data) {
        setProducts([data, ...products]);
      }
    }
    
    setIsUploading(false);
  };

  // --- PROMOS CRUD ---
  const handleCreatePromo = async () => {
    const code = window.prompt("Ingresa el código del cupón (ej. VERANO50):");
    if (!code) return;
    const discountStr = window.prompt("Ingresa el porcentaje de descuento (ej. 20):");
    if (!discountStr) return;
    
    const discount = parseFloat(discountStr);
    if (isNaN(discount)) return;

    const { data } = await supabase.from('promos').insert([{
      code: code.toUpperCase(),
      discount_percentage: discount,
      status: 'Activo'
    }]).select().single();

    if (data) setPromos([data, ...promos]);
  };

  const handleUpdatePromoStatus = async (id: string, newStatus: string) => {
    setPromos(promos.map(p => p.id === id ? { ...p, status: newStatus } : p));
    await supabase.from('promos').update({ status: newStatus }).eq('id', id);
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cupón?")) return;
    setPromos(promos.filter(p => p.id !== id));
    await supabase.from('promos').delete().eq('id', id);
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-secondary/20">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus pedidos, menú y promociones.</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white dark:bg-card px-4 py-2 rounded-xl shadow-sm border border-border inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
              AD
            </div>
            <div>
              <p className="text-sm font-bold">Admin Restaurante</p>
              <p className="text-xs text-green-500 font-medium">● Conectado</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-secondary p-1 rounded-xl mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "orders" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <ShoppingBag size={20} />
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "products" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Package size={20} />
            Productos
          </button>
          <button
            onClick={() => setActiveTab("promos")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "promos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Tag size={20} />
            Promociones
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/50">
                  <h2 className="text-xl font-bold">Pedidos Recientes</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar pedido..." 
                      className="pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/30 text-muted-foreground text-sm border-b border-border">
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Cliente</th>
                        <th className="p-4 font-semibold">Total</th>
                        <th className="p-4 font-semibold">Método / Yape</th>
                        <th className="p-4 font-semibold">Estado</th>
                        <th className="p-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                          <td className="p-4 font-medium">{order.id}</td>
                          <td className="p-4">
                            <p className="font-semibold">{order.customer}</p>
                            <p className="text-xs text-muted-foreground">{order.phone}</p>
                          </td>
                          <td className="p-4 font-bold text-primary">S/. {order.total.toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full inline-block w-fit ${
                                order.method === "Yape" ? "bg-[#7400b8]/10 text-[#7400b8]" : "bg-blue-500/10 text-blue-500"
                              }`}>
                                {order.method}
                              </span>
                              {order.method === "Yape" && order.operationRef && (
                                <span className="text-xs font-mono mt-1 text-muted-foreground">
                                  Op: {order.operationRef}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 ${
                              order.status === "Pendiente" ? "bg-yellow-500/10 text-yellow-600" :
                              order.status === "Preparando" ? "bg-orange-500/10 text-orange-500" :
                              order.status === "En Camino" ? "bg-blue-500/10 text-blue-500" :
                              order.status === "Entregado" ? "bg-green-500/10 text-green-500" :
                              "bg-red-500/10 text-red-500"
                            }`}>
                              {(order.status === "Pendiente" || order.status === "En Camino") && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {order.status === "Pendiente" && (
                                <>
                                  <button onClick={() => {
                                      handleUpdateOrderStatus(order.id, "Preparando");
                                      handleNotifyCustomer(order);
                                    }} 
                                    className="p-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg" 
                                    title="Aceptar Pago y Notificar"
                                  >
                                    <MessageCircle size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(order.id, "Rechazado")}
                                    className="p-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg" 
                                    title="Rechazar"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              {order.status === "Preparando" && (
                                <button 
                                  onClick={() => handleUpdateOrderStatus(order.id, "En Camino")} 
                                  className="text-xs px-3 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center gap-1"
                                >
                                  <Truck size={14} />
                                  Enviar Delivery
                                </button>
                              )}
                              {order.status === "En Camino" && (
                                <button 
                                  onClick={() => handleUpdateOrderStatus(order.id, "Entregado")} 
                                  className="text-xs px-3 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 flex items-center gap-1"
                                >
                                  <CheckCircle size={14} />
                                  Marcar Entregado
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-end">
                <button 
                  onClick={() => openEditModal()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-colors"
                >
                  <Plus size={20} />
                  Nuevo Producto
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-semibold px-2 py-1 bg-secondary rounded-md text-muted-foreground mb-2 inline-block">
                          {product.category}
                        </span>
                        <h3 className="text-lg font-bold">{product.name}</h3>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        product.status === "Activo" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-primary mb-6">S/. {product.price.toFixed(2)}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PROMOS TAB */}
          {activeTab === "promos" && (
            <motion.div
              key="promos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Cupones de Descuento</h2>
                  <button onClick={handleCreatePromo} className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline">
                    <Plus size={16} /> Crear
                  </button>
                </div>
                
                <div className="space-y-4">
                  {promos.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                          <Tag size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold font-mono tracking-wider">{promo.code}</h4>
                          <p className="text-sm text-muted-foreground">{promo.discount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          className="bg-background border border-border rounded-lg text-sm font-medium p-2 outline-none"
                          value={promo.status}
                          onChange={(e) => handleUpdatePromoStatus(promo.id, e.target.value)}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                        <button 
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold">Editar Producto</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del Plato</label>
                  <input 
                    type="text" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea 
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    rows={2}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio (S/.)</label>
                    <input 
                      type="number" 
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <select 
                      value={editingProduct.status}
                      onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Agotado">Agotado</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <input 
                    type="text" 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Imagen del Producto</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary border border-border flex-shrink-0">
                      {(editingProduct.imageFile || editingProduct.image) ? (
                        <img 
                          src={editingProduct.imageFile ? URL.createObjectURL(editingProduct.imageFile) : editingProduct.image} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={24}/></div>
                      )}
                    </div>
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-4 hover:bg-secondary cursor-pointer transition-colors">
                      <Upload size={20} className="text-muted-foreground mb-1" />
                      <span className="text-xs font-medium text-muted-foreground">Click para subir nueva imagen</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditingProduct({...editingProduct, imageFile: e.target.files[0]});
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveProduct}
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {isUploading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
