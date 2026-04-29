"use client";

import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { CreditCard, Truck, CheckCircle2, ChevronLeft, QrCode, Smartphone, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Si se configuran las credenciales, importamos @react-google-maps/api
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries: any[] = ["places"];

type PaymentMethod = "card" | "yape";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as any,
  });
  
  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [yapeOperation, setYapeOperation] = useState("");

  const SHIPPING_COST = 5.00;
  const FINAL_TOTAL = totalPrice + SHIPPING_COST;
  const ADMIN_WHATSAPP = "51910179428";

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadata = session.user.user_metadata;
        const name = metadata?.full_name || metadata?.name || "";
        const phoneStr = metadata?.phone || "";
        
        if (name) setCustomerName(name);
        if (phoneStr) setCustomerPhone(phoneStr);
      }
    }
    loadUser();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Guardar en Supabase
    const { data: orderData, error } = await supabase.from('orders').insert([{
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      total_price: FINAL_TOTAL,
      payment_method: paymentMethod === 'yape' ? 'Yape' : 'Tarjeta',
      yape_operation: paymentMethod === 'yape' ? yapeOperation : null,
      status: 'Pendiente'
    }]).select();

    if (error) {
      console.error("Error al guardar el pedido:", error);
      alert("Hubo un error al procesar tu pedido. Por favor intenta nuevamente.");
      setIsProcessing(false);
      return;
    }

    // Formatear mensaje para WhatsApp
    let orderDetails = items.map(item => `- ${item.quantity}x ${item.product.name} (S/. ${(item.product.price * item.quantity).toFixed(2)})`).join('%0A');
    let message = `*NUEVO PEDIDO - PoncesFit*%0A%0A`;
    message += `*Cliente:* ${customerName}%0A`;
    message += `*Teléfono:* ${customerPhone}%0A`;
    message += `*Dirección:* ${customerAddress}%0A%0A`;
    message += `*Detalle:*%0A${orderDetails}%0A%0A`;
    message += `*Total a pagar:* S/. ${FINAL_TOTAL.toFixed(2)}%0A`;
    message += `*Método:* ${paymentMethod.toUpperCase()}%0A`;
    
    if (paymentMethod === "yape") {
      message += `*Nº Operación Yape:* ${yapeOperation}%0A`;
    }

    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;

    // Simular procesamiento interno y redirección
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
      
      // Abrir WhatsApp en una nueva pestaña
      window.open(whatsappUrl, "_blank");

      // Redirigir localmente a la vista de tracking
      setTimeout(() => {
        // Enviar el ID real de Supabase si existe
        const newOrderId = orderData?.[0]?.id || "pendiente";
        router.push(`/tracking?id=${newOrderId}`);
      }, 3000);
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card p-8 rounded-3xl border border-border text-center max-w-md w-full shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Pedido Confirmado!</h2>
          <p className="text-muted-foreground mb-6">
            Se ha abierto WhatsApp para que envíes el comprobante a nuestro equipo.
          </p>
          <div className="animate-pulse flex space-x-2 justify-center items-center text-primary">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="ml-2 text-sm font-medium">Redirigiendo al seguimiento...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No hay nada que pagar</h2>
          <Link
            href="/"
            className="text-primary hover:underline flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <Link
        href="/cart"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" />
        Volver al carrito
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Payment Form */}
        <div>
          <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>
          
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Truck size={24} className="text-primary" />
                Datos de Envío
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <input 
                    required 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="Juan Pérez" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono (Whatsapp)</label>
                  <input 
                    required 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="999 888 777" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección de Entrega</label>
                <div className="relative">
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(auto) => setAutocomplete(auto)}
                      onPlaceChanged={() => {
                        if (autocomplete !== null) {
                          const place = autocomplete.getPlace();
                          setCustomerAddress(place.formatted_address || place.name || "");
                        }
                      }}
                    >
                      <input 
                        required 
                        type="text" 
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-secondary border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none" 
                        placeholder="Busca tu dirección..." 
                      />
                    </Autocomplete>
                  ) : (
                    <input 
                      required 
                      type="text" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-secondary border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none" 
                      placeholder="Cargando mapa..." 
                    />
                  )}
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" size={18} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Con autocompletado inteligente de Google Maps.</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard size={24} className="text-primary" />
                Método de Pago
              </h2>

              {/* Tabs */}
              <div className="flex bg-secondary p-1 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    paymentMethod === "card" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard size={18} />
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("yape")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    paymentMethod === "yape" ? "bg-[#7400b8] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone size={18} />
                  Yape
                </button>
              </div>

              {/* Conditional Form */}
              {paymentMethod === "card" ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número de Tarjeta</label>
                    <input required type="text" className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha de Expiración</label>
                      <input required type="text" className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CVC</label>
                      <input required type="text" className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" placeholder="123" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-center">
                  <div className="bg-secondary/50 p-6 rounded-2xl border border-border inline-block w-full">
                    <h3 className="font-bold text-[#7400b8] mb-2 flex items-center justify-center gap-2">
                      <QrCode size={20} />
                      Escanea este código QR
                    </h3>
                    <div className="w-48 h-48 bg-white mx-auto rounded-xl p-2 shadow-sm mb-4">
                      {/* Fake QR Image placeholder */}
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PagoYapePoncesFit" alt="QR Yape" className="w-full h-full" />
                    </div>
                    <p className="text-sm font-medium mb-1">Titular: PoncesFit S.A.C</p>
                    <p className="text-sm font-medium">Celular: <span className="text-primary font-bold">999 888 777</span></p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Monto a yapear: <span className="font-bold">S/. {FINAL_TOTAL.toFixed(2)}</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-primary">Número de Operación de Yape</label>
                    <input 
                      required={paymentMethod === "yape"} 
                      type="text" 
                      value={yapeOperation}
                      onChange={(e) => setYapeOperation(e.target.value)}
                      className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7400b8] outline-none" 
                      placeholder="Ej. 123456" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">El repartidor o nuestro sistema validará este código antes de enviar el pedido.</p>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 px-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${
                isProcessing 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : paymentMethod === "yape" 
                    ? "bg-[#7400b8] hover:bg-[#60009c] shadow-[#7400b8]/30" 
                    : "bg-primary hover:bg-primary/90 shadow-primary/20"
              }`}
            >
              {isProcessing ? "Procesando..." : `Confirmar y Enviar a WhatsApp (S/. ${FINAL_TOTAL.toFixed(2)})`}
            </button>
          </form>
        </div>

        {/* Order Summary Minimal */}
        <div className="hidden md:block">
          <div className="bg-secondary/50 rounded-3xl p-8 sticky top-24">
            <h3 className="text-xl font-bold mb-6">Tu Pedido</h3>
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-1">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">Cant: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">S/. {(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>S/. {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span>S/. {SHIPPING_COST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total</span>
                <span className="text-primary">S/. {FINAL_TOTAL.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
