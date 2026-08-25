"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { HorizontaLDots } from "@/icons";
import { templateNavGroups } from "./templateNav";

const TemplateSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const showLabels = isExpanded || isHovered || isMobileOpen;
  const isActive = (path: string) => path === pathname;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 text-gray-900 h-screen transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 border-r border-gray-100/50 dark:border-gray-800 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!showLabels ? "lg:justify-center" : "justify-start"}`}
      >
        <Link href="/plantilla" className="flex flex-col">
          {showLabels ? (
            <>
              <span className="text-lg font-black tracking-tight text-brand-600 dark:text-brand-400">
                TailAdmin
              </span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                Referencia de plantilla
              </span>
            </>
          ) : (
            <span className="text-2xl font-black text-brand-600 tracking-tighter">
              TA
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex flex-col gap-5">
          {templateNavGroups.map((group) => (
            <div key={group.title}>
              <h2
                className={`mb-3 text-[11px] font-bold tracking-widest uppercase flex leading-[20px] text-gray-400/80 ${
                  !showLabels ? "lg:justify-center" : "justify-start ml-2"
                }`}
              >
                {showLabels ? group.title : <HorizontaLDots />}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const content = (
                    <>
                      <span
                        className={
                          isActive(item.path)
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"
                        }
                      >
                        {item.icon}
                      </span>
                      {showLabels && (
                        <span className="menu-item-text">{item.name}</span>
                      )}
                      {showLabels && item.external && (
                        <span className="ml-auto text-xs text-gray-400">↗</span>
                      )}
                    </>
                  );
                  const className = `menu-item group ${
                    isActive(item.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } ${!showLabels ? "lg:justify-center" : "lg:justify-start"}`;

                  return (
                    <li key={item.path}>
                      {item.external ? (
                        <a
                          href={item.path}
                          title={item.name}
                          target="_blank"
                          rel="noreferrer"
                          className={className}
                        >
                          {content}
                        </a>
                      ) : (
                        <Link
                          href={item.path}
                          title={item.name}
                          className={className}
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {showLabels && (
          <Link
            href="/dashboard"
            className="mb-8 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400"
          >
            ← Volver al sistema AirCargo
          </Link>
        )}
      </div>
    </aside>
  );
};

export default TemplateSidebar;
