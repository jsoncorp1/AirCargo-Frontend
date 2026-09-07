import { redirect } from "next/navigation";

// `/admin` no tiene pantalla propia: es a donde cae el admin al iniciar sesión
// (ver `AuthContext.login`) y a donde apunta el logo de la barra lateral.
//
// Antes mostraba un dashboard con métricas escritas a mano —124 envíos, 89% de
// efectividad, siempre los mismos— que no salían de ningún endpoint. Nadie
// decide nada con eso, así que la ruta manda directo a la primera pantalla real
// del día: el turno de caja del mostrador, que al entrar ofrece abrirlo si
// todavía no lo está.
//
// Si algún día hay un dashboard con datos de verdad, se reemplaza este redirect.
export default function AdminHomePage() {
  redirect("/admin/caja");
}
