"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  // Cerrojo: evita que un doble click mande dos veces el login.
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    runSubmit(async () => {
      try {
        await login({ email, password });
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al iniciar sesión");
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md mx-auto mb-8 sm:pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-all hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:-translate-x-1"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto animate-fade-in-up">
        <div>
          {/* Logo solo visible en mobile (lg:hidden) ya que en desktop está en el panel derecho */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="relative w-48 h-14">
              <Image
                src="/images/logo/logoaircargoazul.png"
                alt="AirCargo Express"
                fill
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/images/logo/logoaircargoblanco.png"
                alt="AirCargo Express"
                fill
                className="object-contain hidden dark:block"
                priority
              />
            </div>
          </div>
          
          <div className="mb-10 text-center sm:text-left">
            <h1 className="mb-3 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              Ingresa tus credenciales para acceder a tu panel de control logístico.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-4 text-sm font-medium text-error-600 bg-error-50 border-l-4 border-error-500 rounded-r-lg shadow-sm dark:bg-error-500/10 dark:text-error-400 dark:border-error-500">
                    {error}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Correo Electrónico <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Input 
                      placeholder="ejemplo@correo.com" 
                      type="email" 
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-400 hover:text-brand-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeIcon className="w-5 h-5 fill-current" />
                      ) : (
                        <EyeCloseIcon className="w-5 h-5 fill-current" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-medium text-gray-600 text-sm dark:text-gray-400">
                      Recordar sesión
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <div className="pt-4">
                  <button
                    className="flex w-full justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3.5 px-4 text-sm font-extrabold text-white shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02] hover:shadow-brand-500/40 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    type="submit" 
                    disabled={submitting}
                  >
                    {submitting ? "Autenticando..." : "Ingresar"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ¿No tienes una cuenta corporativa? {" "}
                <Link
                  href="/signup"
                  className="text-brand-600 font-extrabold hover:text-brand-700 dark:text-brand-400 transition-colors underline decoration-2 underline-offset-4"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
