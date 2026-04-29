"use client";

import { motion } from "framer-motion";
import { MapPin, Package, ChefHat, Bike, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLoadScript, GoogleMap } from "@react-google-maps/api";

const TRACKING_STEPS = [
  { id: 1, title: "Pedido Recibido", icon: Package, description: "Hemos confirmado tu pedido.", statusMatch: "Pendiente" },
  { id: 2, title: "Preparando", icon: ChefHat, description: "El chef está preparando tu comida.", statusMatch: "Preparando" },
  { id: 3, title: "En Camino", icon: Bike, description: "El repartidor va hacia tu ubicación.", statusMatch: "En Camino" },
  { id: 4, title: "Entregado", icon: CheckCircle2, description: "¡Disfruta tu comida!", statusMatch: "Entregado" },
];

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const mapCenter = useMemo(() => ({ lat: -18.0146, lng: -70.2536 }), []); // Tacna, Peru

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (data) {
        setOrder(data);
        updateStep(data.status);
      }
      setLoading(false);
    };

    fetchOrder();

    // SUSCRIPCIÓN EN TIEMPO REAL
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new);
          updateStep(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const updateStep = (status: string) => {
    const step = TRACKING_STEPS.find(s => s.statusMatch === status);
    if (step) {
      setCurrentStep(step.id);
    } else if (status === "Entregado") {
      setCurrentStep(4);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Pedido no encontrado</h2>
        <p className="text-muted-foreground">Verifica el enlace o contacta a soporte.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Seguimiento del Pedido</h1>
        <p className="text-muted-foreground mt-1 font-mono uppercase">Orden #{order.id.slice(0, 8)}</p>
        <p className="text-sm font-semibold mt-2">Estado: <span className="text-primary">{order.status}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Tracker */}
        <div className="lg:col-span-1 bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm">
          <div className="space-y-8">
            {TRACKING_STEPS.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="relative flex gap-4">
                  {index < TRACKING_STEPS.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-[-2rem] w-0.5 bg-secondary">
                      <motion.div
                        className="w-full bg-primary"
                        initial={{ height: "0%" }}
                        animate={{ height: isCompleted ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}

                  <div
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isCompleted || isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <step.icon size={24} />
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>

                  <div className="flex flex-col justify-center pt-1">
                    <h3
                      className={`font-bold text-lg ${
                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative w-full h-[400px] lg:h-full min-h-[400px] bg-secondary rounded-3xl overflow-hidden border border-border">
            
            {/* Real Map */}
            {isLoaded ? (
              <div className="absolute inset-0">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={14}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: [
                      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                      {
                        featureType: "administrative.locality",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                      },
                      {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                      },
                      {
                        featureType: "poi.park",
                        elementType: "geometry",
                        stylers: [{ color: "#263c3f" }],
                      },
                      {
                        featureType: "poi.park",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#6b9a76" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#38414e" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#212a37" }],
                      },
                      {
                        featureType: "road",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#9ca5b3" }],
                      },
                      {
                        featureType: "road.highway",
                        elementType: "geometry",
                        stylers: [{ color: "#746855" }],
                      },
                      {
                        featureType: "road.highway",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#1f2835" }],
                      },
                      {
                        featureType: "road.highway",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#f3d19c" }],
                      },
                      {
                        featureType: "transit",
                        elementType: "geometry",
                        stylers: [{ color: "#2f3948" }],
                      },
                      {
                        featureType: "transit.station",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                      },
                      {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                      },
                      {
                        featureType: "water",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#515c6d" }],
                      },
                      {
                        featureType: "water",
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#17263c" }],
                      },
                    ],
                  }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <span className="text-muted-foreground animate-pulse">Cargando mapa...</span>
              </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

              {currentStep >= 3 && (
                <motion.div
                  initial={{ x: -100, y: 100 }}
                  animate={{ x: currentStep === 4 ? 100 : 0, y: currentStep === 4 ? -100 : 0 }}
                  transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                  className="absolute z-20 flex flex-col items-center pointer-events-auto"
                >
                  <div className="bg-background px-3 py-1 rounded-full shadow-lg text-xs font-bold mb-2 flex items-center gap-1">
                    <Bike size={14} className="text-primary" />
                    <span>Delivery en camino</span>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                    <Bike size={16} />
                  </div>
                </motion.div>
              )}

              <div className="absolute top-[20%] right-[20%] z-10 flex flex-col items-center">
                <div className="bg-background px-3 py-1 rounded-full shadow-lg text-xs font-bold mb-2">
                  {order.customer_address || "Tu ubicación"}
                </div>
                <div className="text-primary">
                  <MapPin size={32} className="fill-background" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
