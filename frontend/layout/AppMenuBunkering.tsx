import { useRefineriaStore } from "@/store/refineriaStore";
import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";

const AppMenuBunkering = () => {
  const { activeRefineria } = useRefineriaStore();
  const model: MenuModel[] = [
    {
      label: activeRefineria?.nombre || "Seleciona un bunkering",
      icon: "pi pi-home",
      items: [
        {
          label: "Operaciones",
          icon: "pi pi-fw pi-home",
          to: "/refineria",
        },
        {
          label: "Finanzas",
          icon: "pi pi-fw pi-image",
          to: "/refineria/dashboard-sales",
        },
      ],
    },

    {
      label: "Gestión de " + activeRefineria?.nombre,
      icon: "pi pi-fw pi-building", // Cambiado a un icono más representativo de empresa
      items: [
        {
          label: "Configuración",
          icon: "pi pi-fw pi-cog",
          items: [
            {
              label: "Muelle",
              icon: "pi pi-fw pi-compass", // icono alternativo para muelle
              to: "/bunkering/muelle",
            },
            {
              label: "Linea de Recepción",
              icon: "pi pi-fw pi-list",
              to: "/bunkering/linea-recepcion",
            },
            {
              label: "Embarcación",
              icon: "pi pi-fw pi-ship",
              to: "/bunkering/embarcacion",
            },

            {
              label: "Tanques",
              icon: "pi pi-fw pi-database",
              to: "/bunkering/tanques",
            },

            {
              label: "Linea de Despacho",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/linea-despacho",
            },
            {
              label: "Producto",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/producto",
            },
            {
              label: "Tipo de Producto",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/tipo-producto",
            },
          ],
        },
        {
          label: "Finanzas",
          icon: "pi pi-fw pi-dollar",
          items: [
            {
              label: "Contactos",
              icon: "pi pi-fw pi-id-card",
              to: "/bunkering/contacto",
            },
            {
              label: "Contrato Compra",
              icon: "pi pi-fw pi-briefcase",
              to: "/bunkering/contrato-compra",
            },
            {
              label: "Contrato Venta",
              icon: "pi pi-fw pi-briefcase",
              to: "/bunkering/contrato-venta",
            },
          ],
        },
        {
          label: "Logística",
          icon: "pi pi-fw pi-briefcase",
          items: [
            {
              label: "Recepción",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/recepcion",
            },
            {
              label: "Despacho",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/despacho",
            },
          ],
        },
        {
          label: "Operaciones",
          icon: "pi pi-fw pi-briefcase",
          items: [
            {
              label: "Chequeo Cantidad",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/chequeo-cantidad",
            },
          ],
        },
        {
          label: "Laboratorio",
          icon: "pi pi-fw pi-briefcase",
          items: [
            {
              label: "Chequeo Calidad",
              icon: "pi pi-fw pi-plus",
              to: "/bunkering/chequeo-calidad",
            },
          ],
        },
      ],
    },
    // {
    //   label: "Gestión de Refinerias",
    //   icon: "pi pi-fw pi-user",
    //   items: [
    //     {
    //       label: "Lista",
    //       icon: "pi pi-fw pi-list",
    //       to: "/bunkering/list",
    //     },
    //     {
    //       label: "Crear",
    //       icon: "pi pi-fw pi-plus",
    //       to: "/bunkering/create",
    //     },
    //   ],
    // },
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenuBunkering;
