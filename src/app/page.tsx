import { redirect } from "next/navigation";

// Página raíz: redirige automáticamente a la landing page de Contra Entrega
export default function RootPage() {
  redirect("/contra-entrega");
}
