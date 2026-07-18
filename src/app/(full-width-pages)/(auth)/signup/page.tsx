import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro | AirCargo",
  description: "Crea tu cuenta en AirCargo",
};

export default function SignUp() {
  return <SignUpForm />;
}
