"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Comprobar si es admin
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        if (adminEmails.includes(email)) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu correo o inicia sesión ahora.");
        setIsLogin(true);
      }
    } catch (error: any) {
      alert(error.message || "Ocurrió un error en la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login?checkAdmin=true`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Error iniciando sesión con Google: " + error.message);
    }
  };

  // Efecto para capturar el regreso de Google OAuth
  useEffect(() => {
    const checkUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('checkAdmin') === 'true') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
          if (adminEmails.includes(session.user.email || "")) {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-secondary/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto mb-4 shadow-lg shadow-primary/30">
              F
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLogin ? "Bienvenido de nuevo" : "Crea una cuenta"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Ingresa tus datos para continuar" : "Únete para pedir tu comida favorita"}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full bg-secondary border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition-shadow"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Teléfono</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">📞</span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+51 999 888 777"
                      className="w-full bg-secondary border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition-shadow"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hola@ejemplo.com"
                  className="w-full bg-secondary border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium">Contraseña</label>
                {isLogin && (
                  <Link href="#" className="text-xs text-primary hover:underline font-medium">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-secondary border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:gap-3 disabled:opacity-50"
            >
              <span>{loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs font-medium text-muted-foreground uppercase">O continúa con</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-background border border-border hover:bg-secondary rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <UserCircle size={20} />
              <span>Cuenta de Google</span>
            </button>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
