"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { BoxCubeIcon, PageIcon, UserCircleIcon, ListIcon, HorizontaLDots } from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  {
    icon: <BoxCubeIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <PageIcon />,
    name: "Atender Órdenes",
    path: "/admin/ordenes",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Registrar Envío",
    path: "/admin/envios/esporadico",
  },
  {
    icon: <ListIcon />,
    name: "Informe de Envíos",
    path: "/admin/envios",
  },
  {
    icon: <UserCircleIcon />,
    name: "Mis Conductores",
    path: "/admin/conductores",
  },
  {
    icon: <PageIcon />,
    name: "Liquidaciones",
    path: "/admin/liquidaciones",
  },
  {
    icon: <UserCircleIcon />,
    name: "Clientes Potenciales",
    path: "/admin/leads",
  },
];

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = (path: string) => path === pathname;

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
          {isExpanded || isHovered || isMobileOpen ? (
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
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-3 text-[11px] font-bold tracking-widest uppercase flex leading-[20px] text-gray-400/80 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start ml-2"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav) => (
                  <li key={nav.name}>
                    <Link
                      href={nav.path}
                      className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                        }`}
                    >
                      <span
                        className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                          }`}
                      >
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
