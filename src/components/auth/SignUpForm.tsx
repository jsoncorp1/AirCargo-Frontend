"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
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
              Crear Cuenta
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              Ingresa tus datos para registrarte y potenciar tu logística.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900">
            <form>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Nombre <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative group">
                      <Input
                        type="text"
                        id="fname"
                        name="fname"
                        placeholder="Ingresa tu nombre"
                      />
                    </div>
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Apellido <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative group">
                      <Input
                        type="text"
                        id="lname"
                        name="lname"
                        placeholder="Ingresa tu apellido"
                      />
                    </div>
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Correo Electrónico <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                </div>
                {/* <!-- Password --> */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Input
                      placeholder="Crea tu contraseña (mínimo 8 caracteres)"
                      type={showPassword ? "text" : "password"}
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
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                    Al crear una cuenta aceptas los{" "}
                    <Link href="#" className="text-brand-600 font-bold hover:text-brand-700 dark:text-brand-400 transition-colors">
                      Términos y Condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link href="#" className="text-brand-600 font-bold hover:text-brand-700 dark:text-brand-400 transition-colors">
                      Política de Privacidad
                    </Link>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div className="pt-4">
                  <button className="flex w-full justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3.5 px-4 text-sm font-extrabold text-white shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02] hover:shadow-brand-500/40 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100">
                    Completar Registro
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ¿Ya tienes una cuenta? {" "}
                <Link
                  href="/signin"
                  className="text-brand-600 font-extrabold hover:text-brand-700 dark:text-brand-400 transition-colors underline decoration-2 underline-offset-4"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
