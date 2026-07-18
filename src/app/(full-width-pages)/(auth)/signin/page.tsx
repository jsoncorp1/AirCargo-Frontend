import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | AirCargo",
  description: "Inicia sesión en tu cuenta de AirCargo",
};

export default function SignIn() {
  return <SignInForm />;
}
