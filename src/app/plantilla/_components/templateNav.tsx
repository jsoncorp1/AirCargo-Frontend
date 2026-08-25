import React from "react";
import {
  AlertIcon,
  BoltIcon,
  BoxCubeIcon,
  CalenderIcon,
  DocsIcon,
  ErrorIcon,
  FolderIcon,
  GridIcon,
  InfoIcon,
  ListIcon,
  LockIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  UserIcon,
  VideoIcon,
} from "@/icons";

export type TemplateNavItem = {
  name: string;
  path: string;
  description: string;
  icon: React.ReactNode;
  /** Vive fuera de /plantilla (tiene su propio layout): se abre en otra pestaña. */
  external?: boolean;
};

export type TemplateNavGroup = {
  title: string;
  items: TemplateNavItem[];
};

/**
 * Catálogo de las pantallas de demo de la plantilla TailAdmin.
 * Vive sólo dentro de /plantilla: no toca el menú ni las rutas del sistema real.
 */
export const templateNavGroups: TemplateNavGroup[] = [
  {
    title: "General",
    items: [
      {
        name: "Dashboard original",
        path: "/plantilla",
        description: "Dashboard eCommerce que trae TailAdmin de fábrica.",
        icon: <GridIcon />,
      },
      {
        name: "Logistics",
        path: "/plantilla/logistics",
        description:
          "Recreación del dashboard de logística del pack PRO, armada con componentes de la versión free.",
        icon: <BoxCubeIcon />,
      },
    ],
  },
  {
    title: "UI Elements",
    items: [
      {
        name: "Alerts",
        path: "/plantilla/alerts",
        description: "Alertas success, warning, error e info.",
        icon: <AlertIcon />,
      },
      {
        name: "Avatars",
        path: "/plantilla/avatars",
        description: "Avatares con tamaños y estados de conexión.",
        icon: <UserCircleIcon />,
      },
      {
        name: "Badges",
        path: "/plantilla/badge",
        description: "Badges sólidos, claros y con iconos.",
        icon: <InfoIcon />,
      },
      {
        name: "Buttons",
        path: "/plantilla/buttons",
        description: "Botones primary y outline, con iconos y tamaños.",
        icon: <BoltIcon />,
      },
      {
        name: "Images",
        path: "/plantilla/images",
        description: "Imágenes responsive y grillas de 2 y 3 columnas.",
        icon: <FolderIcon />,
      },
      {
        name: "Videos",
        path: "/plantilla/videos",
        description: "Embeds de video con distintos aspect ratios.",
        icon: <VideoIcon />,
      },
      {
        name: "Modals",
        path: "/plantilla/modals",
        description: "Modales default, centrado, full screen y con formulario.",
        icon: <BoxCubeIcon />,
      },
    ],
  },
  {
    title: "Charts",
    items: [
      {
        name: "Bar Chart",
        path: "/plantilla/bar-chart",
        description: "Gráfico de barras (ApexCharts).",
        icon: <PieChartIcon />,
      },
      {
        name: "Line Chart",
        path: "/plantilla/line-chart",
        description: "Gráfico de líneas (ApexCharts).",
        icon: <ListIcon />,
      },
    ],
  },
  {
    title: "Forms & Tables",
    items: [
      {
        name: "Form Elements",
        path: "/plantilla/form-elements",
        description:
          "Inputs, selects, checkboxes, radios, toggles, file upload y dropzone.",
        icon: <PageIcon />,
      },
      {
        name: "Basic Tables",
        path: "/plantilla/basic-tables",
        description: "Tabla base con la que están hechos los listados.",
        icon: <TableIcon />,
      },
    ],
  },
  {
    title: "Otras páginas",
    items: [
      {
        name: "Calendar",
        path: "/plantilla/calendar",
        description: "Calendario FullCalendar con eventos y modal de alta.",
        icon: <CalenderIcon />,
      },
      {
        name: "Profile",
        path: "/plantilla/profile",
        description:
          "Tarjeta de perfil del usuario. Sin sesión activa muestra los valores por defecto.",
        icon: <UserCircleIcon />,
      },
      {
        name: "Blank Page",
        path: "/plantilla/blank",
        description: "Página en blanco para arrancar una pantalla nueva.",
        icon: <DocsIcon />,
      },
    ],
  },
  {
    title: "Full width",
    items: [
      {
        name: "Sign In",
        path: "/signin",
        description: "Pantalla de login real del sistema. Abre en otra pestaña.",
        icon: <LockIcon />,
        external: true,
      },
      {
        name: "Sign Up",
        path: "/signup",
        description: "Pantalla de registro de la plantilla. Abre en otra pestaña.",
        icon: <UserIcon />,
        external: true,
      },
      {
        name: "Error 404",
        path: "/error-404",
        description: "Página de error 404 de la plantilla. Abre en otra pestaña.",
        icon: <ErrorIcon />,
        external: true,
      },
    ],
  },
];

export const templateNavItems: TemplateNavItem[] = templateNavGroups.flatMap(
  (group) => group.items
);
