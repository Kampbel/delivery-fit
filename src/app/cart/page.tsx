"use client";

import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  const SHIPPING_COST = items.length > 0 ? 2.99 : 0;
  const FINAL_TOTAL = totalPrice + SHIPPING_COST;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCartIcon />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-8">¡Añade algo delicioso para comenzar!</p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors inline-block"
          >
            Explorar Menú
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex gap-4 p-4 bg-card rounded-2xl border border-border"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg leading-tight">{item.product.name}</h3>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="text-primary font-bold mt-1">S/. {item.product.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center bg-secondary rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-l-lg transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-r-lg transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="font-bold text-lg mt-4 sm:mt-0 ml-4 min-w-[80px] text-right">
                    S/. {(item.product.price * item.quantity).toFixed(2)}
                  </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-6">Resumen del Pedido</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span>S/. {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Envío estimado</span>
                <span>S/. {SHIPPING_COST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-black pt-4 border-t border-border mt-2">
                <span>Total</span>
                <span className="text-primary">S/. {FINAL_TOTAL.toFixed(2)}</span>
              </div>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-4 px-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <span>Proceder al Pago</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon helper to keep imports clean
function ShoppingCartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
