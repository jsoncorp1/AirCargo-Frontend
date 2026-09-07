"use client";
import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  BoxIconLine,
  CalenderIcon,
  CashIcon,
  ChevronDownIcon,
  DocsIcon,
  DollarLineIcon,
  HorizontaLDots,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
} from "../icons/index";

type SubItem = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  // Un item tiene `path` (link directo) o `subItems` (desplegable), nunca los dos.
  path?: string;
  subItems?: SubItem[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * El menú del admin de sucursal, ordenado por el día de trabajo y no por
 * módulo del sistema.
 *
 * Dos criterios detrás del orden:
 *
 * 1. **Lo que se toca muchas veces por día va plano.** "Mostrador" y
 *    "Operación" no tienen submenús a propósito: un nivel más son dos clics
 *    en vez de uno, y estas pantallas se abren decenas de veces por jornada.
 *    Lo que se toca una vez por semana sí se pliega, para bajar el ruido.
 * 2. **El dashboard no está.** Es la pantalla de `/admin` y son métricas
 *    inventadas a mano; el admin no toma ninguna decisión con eso. `/admin`
 *    redirige a Caja (ver `src/app/admin/page.tsx`).
 *
 * Cada item lleva su propio ícono, sin repetir: con la barra colapsada a 90px
 * el ícono es lo único que se ve, y tres "Envíos" con el mismo cubo no se
 * distinguen.
 */
const navSections: NavSection[] = [
  {
    // Abrir la caja es lo primero de la jornada, y ahora es obligatorio: sin
    // caja abierta el backend rechaza emitir cualquier guía con
    // `cashregister.session.notopen`. Abrirla es lo que declara que la
    // sucursal está atendiendo, así que va primera de todo.
    //
    // El cotizador se sacó del menú a pedido: el admin de sucursal no lo usa
    // en la atención. La ruta `/admin/cotizador` sigue existiendo.
    title: "Mostrador",
    items: [
      {
        icon: <CashIcon className="size-6" />,
        name: "Caja",
        path: "/admin/caja",
      },
      {
        icon: <DocsIcon />,
        name: "Atender Órdenes",
        path: "/admin/ordenes",
      },
      {
        icon: <BoxCubeIcon />,
        name: "Registrar Envío",
        path: "/admin/envios/esporadico",
      },
    ],
  },
  {
    // El envío ya existe; esto es moverlo. Sigue el recorrido de la carga:
    // se ve en la bandeja, se agrupa en un manifiesto, se asigna a reparto.
    title: "Operación",
    items: [
      {
        icon: <BoxIconLine />,
        name: "Envíos",
        path: "/admin/envios",
      },
      {
        icon: <TableIcon />,
        name: "Manifiestos",
        path: "/admin/manifiestos",
      },
      {
        icon: <TaskIcon />,
        name: "Reparto",
        path: "/admin/reparto",
      },
      {
        icon: <CalenderIcon />,
        name: "Solicitudes de Recojo",
        path: "/admin/recojos",
      },
    ],
  },
  {
    // Cierres, pagos y altas: se abren de a ratos, no en la atención.
    // Clientes potenciales se sacó del menú a pedido, igual que el cotizador;
    // la ruta `/admin/leads` sigue existiendo.
    title: "Administración",
    items: [
      {
        icon: <DollarLineIcon />,
        name: "Dinero",
        subItems: [
          // Caja chica ya no está: era el mismo cajón que el mostrador y se
          // fusionó en "Caja". Los gastos de la sucursal se cargan ahí como
          // egresos, contra el mismo saldo que los cobros.
          { name: "Cobranzas", path: "/admin/cuenta-corriente" },
          { name: "Liquidaciones", path: "/admin/liquidaciones" },
        ],
      },
      {
        icon: <UserCircleIcon />,
        name: "Conductores",
        subItems: [
          { name: "Mis Conductores", path: "/admin/conductores" },
          { name: "Perfiles de Conductor", path: "/admin/conductores/perfiles" },
        ],
      },
    ],
  },
];

// Todas las rutas del menú, para resolver cuál se marca como activa.
const allNavPaths: string[] = navSections.flatMap((section) =>
  section.items.flatMap((item) =>
    item.subItems ? item.subItems.map((sub) => sub.path) : item.path ? [item.path] : []
  )
);

const submenuKey = (sectionIndex: number, itemIndex: number) =>
  `${sectionIndex}-${itemIndex}`;

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // Gana el prefijo más largo que coincida. Con igualdad exacta,
  // `/admin/manifiestos/<id>` no marcaba nada; con prefijo a secas,
  // `/admin/envios/esporadico` marcaba "Envíos" y "Registrar Envío" a la vez.
  const activePath = useMemo(
    () =>
      allNavPaths
        .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
        .sort((a, b) => b.length - a.length)[0] ?? null,
    [pathname]
  );

  const isActive = useCallback((path: string) => path === activePath, [activePath]);

  // Qué desplegable corresponde a la pantalla actual.
  const activeSubmenu = useMemo(() => {
    for (const [sectionIndex, section] of navSections.entries()) {
      for (const [itemIndex, item] of section.items.entries()) {
        if (item.subItems?.some((sub) => sub.path === activePath)) {
          return submenuKey(sectionIndex, itemIndex);
        }
      }
    }
    return null;
  }, [activePath]);

  // Por defecto manda la ruta; mientras el usuario no se mueva de pantalla,
  // manda lo que abrió o cerró a mano (`key` vacía = lo cerró). Se guarda junto
  // al pathname para que al navegar el menú vuelva solo a seguir la ruta, sin
  // un efecto que sincronice: `setState` dentro de un `useEffect` dispara
  // renders en cascada y el lint del repo lo marca como error (ver
  // `AppSidebar`, que todavía lo hace).
  const [toggled, setToggled] = useState<{ path: string; key: string } | null>(null);
  const openSubmenu =
    toggled && toggled.path === pathname ? toggled.key || null : activeSubmenu;

  const handleSubmenuToggle = (key: string) =>
    setToggled({ path: pathname, key: openSubmenu === key ? "" : key });

  // La barra colapsada (90px) solo muestra íconos: los textos y los
  // desplegables aparecen al expandirla o al pasar el mouse por encima.
  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 text-gray-900 h-screen transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 border-r border-gray-100/50 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} group cursor-pointer`}
      >
        <Link href="/admin" className="flex items-center gap-2 transition-transform duration-300 ease-in-out group-hover:scale-105">
          {showLabels ? (
            <>
              <img src="/images/logo/logoaircargoazul.png" alt="AirCargo Logo" width={160} height={40} className="dark:hidden block object-contain drop-shadow-sm transition-all duration-300 group-hover:grayscale group-hover:opacity-80" />
              <img src="/images/logo/logoaircargoblanco.png" alt="AirCargo Logo" width={160} height={40} className="hidden dark:block object-contain drop-shadow-sm transition-all duration-300 group-hover:grayscale group-hover:opacity-80" />
            </>
          ) : (
            <span className="text-2xl font-black text-brand-600 tracking-tighter drop-shadow-md group-hover:text-brand-700 transition-colors">AC</span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {navSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <h2
                  className={`mb-3 text-[11px] font-bold tracking-widest uppercase flex leading-[20px] text-gray-400/80 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start ml-2"
                  }`}
                >
                  {showLabels ? section.title : <HorizontaLDots />}
                </h2>
                <ul className="flex flex-col gap-4">
                  {section.items.map((nav, itemIndex) => {
                    const key = submenuKey(sectionIndex, itemIndex);
                    const isOpen = openSubmenu === key;
                    // El desplegable cerrado también se marca cuando la
                    // pantalla abierta es una de sus hijas: colapsado no se ve
                    // el submenú y si no, nada indicaría dónde estás parado.
                    const submenuHasActive = activeSubmenu === key;

                    return (
                      <li key={nav.name}>
                        {nav.subItems ? (
                          <button
                            onClick={() => handleSubmenuToggle(key)}
                            className={`menu-item group cursor-pointer ${
                              isOpen || submenuHasActive ? "menu-item-active" : "menu-item-inactive"
                            } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                          >
                            <span
                              className={
                                isOpen || submenuHasActive
                                  ? "menu-item-icon-active"
                                  : "menu-item-icon-inactive"
                              }
                            >
                              {nav.icon}
                            </span>
                            {showLabels && <span className="menu-item-text">{nav.name}</span>}
                            {showLabels && (
                              <ChevronDownIcon
                                className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                                  isOpen ? "rotate-180 text-brand-500" : ""
                                }`}
                              />
                            )}
                          </button>
                        ) : (
                          nav.path && (
                            <Link
                              href={nav.path}
                              className={`menu-item group ${
                                isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                              }`}
                            >
                              <span
                                className={
                                  isActive(nav.path)
                                    ? "menu-item-icon-active"
                                    : "menu-item-icon-inactive"
                                }
                              >
                                {nav.icon}
                              </span>
                              {showLabels && <span className="menu-item-text">{nav.name}</span>}
                            </Link>
                          )
                        )}

                        {/* La animación va por `grid-template-rows` en vez de medir
                            `scrollHeight` con un ref: sin medición no hace falta
                            efecto ni estado de alturas, y la altura sale sola
                            aunque cambien los items. */}
                        {nav.subItems && showLabels && (
                          <div
                            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                          >
                            <div className="overflow-hidden">
                              <ul className="mt-2 space-y-1 ml-9">
                                {nav.subItems.map((subItem) => (
                                  <li key={subItem.name}>
                                    <Link
                                      href={subItem.path}
                                      className={`menu-dropdown-item ${
                                        isActive(subItem.path)
                                          ? "menu-dropdown-item-active"
                                          : "menu-dropdown-item-inactive"
                                      }`}
                                    >
                                      {subItem.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
