"use client";

import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, Star, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState("Todas");
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'Activo');
        
      if (error) {
        console.error("Error cargando productos de Supabase:", error);
      } else if (data && data.length > 0) {
        setProducts(data);
      } else {
        // Fallback temporal si la base de datos está vacía (para no romper la UI)
        setProducts([
          { id: "1", name: "Classic Burger", price: 12.99, category: "Hamburguesas", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", description: "Doble carne smash, queso cheddar derretido." },
          { id: "2", name: "Pizza Margherita", price: 18.50, category: "Pizzas", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=80", description: "Masa madre, salsa de tomate San Marzano." }
        ]);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  const categories = ["Todas", "Hamburguesas", "Pizzas", "Snacks", "Bebidas"];

  const filteredProducts = activeCategory === "Todas" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-black leading-tight tracking-tighter"
            >
              Comida <span className="text-primary">Premium</span>,<br />
              Entrega Rápida.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-lg font-medium"
            >
              Disfruta de los mejores platillos de la ciudad sin salir de casa. Paga con Tarjeta o Yape en segundos.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="#menu" className="inline-flex items-center bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all">
                Ver Menú
                <ChevronRight className="ml-2" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black mb-4">Nuestro Menú</h2>
            <p className="text-muted-foreground font-medium">Seleccionado cuidadosamente para ti.</p>
          </div>
          
          {/* Category Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-4 md:pb-0 mt-6 md:mt-0 w-full md:w-auto hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? "bg-foreground text-background shadow-md" 
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-medium text-lg">
            No hay productos disponibles en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="relative h-56 overflow-hidden bg-secondary">
                  <img 
                    src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <Star size={14} className="text-yellow-500 mr-1 fill-yellow-500" />
                    4.8
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold line-clamp-1">{product.name}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-2xl font-black text-primary">S/. {product.price.toFixed(2)}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-12 h-12 bg-secondary hover:bg-foreground hover:text-background rounded-full flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
