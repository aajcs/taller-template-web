import { useRefineriaStore } from "@/store/refineriaStore";
import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";

const AppMenuRefineria = () => {
  const { activeRefineria } = useRefineriaStore();
  const model: MenuModel[] = [
    {
      label: activeRefineria?.nombre || "Seleciona una refinería",
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
      // Cambiado a un icono más representativo de empresa

      items: [
        {
          label: "Configuración",
          icon: "pi pi-fw pi-cog",
          items: [
            {
              label: "Producto",
              icon: "pi pi-fw pi-plus",
              to: "/refineria/configuracion/producto",
            },
            {
              label: "Tipo de Crudo",
              icon: "pi pi-fw pi-plus",
              to: "/refineria/configuracion/tipo-producto",
            },

            {
              label: "Linea de Recepción",
              icon: "pi pi-fw pi-list",
              to: "/refineria/configuracion/linea-recepcion",
            },
            {
              label: "Linea de Despacho",
              icon: "pi pi-fw pi-list",
              to: "/refineria/configuracion/linea-despacho",
            },
            {
              label: "Tanques",
              icon: "pi pi-fw pi-database",
              to: "/refineria/configuracion/tanques",
            },
            {
              label: "Torres de Destilación",
              icon: "pi pi-fw pi-building",
              to: "/refineria/configuracion/torre-destilacion",
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
              to: "/refineria/finanzas/contacto",
            },
            {
              label: "Contrato Compra",
              icon: "pi pi-fw pi-briefcase",
              to: "/refineria/finanzas/contrato-compra",
            },

            {
              label: "Contrato Venta",
              icon: "pi pi-fw pi-briefcase",
              to: "/refineria/finanzas/contrato-venta",
            },

            {
              label: "Abono Egreso",
              icon: "pi pi-fw pi-receipt",
              to: "/refineria/finanzas/abono-egreso",
            },

            {
              label: "Abono Ingreso",
              icon: "pi pi-fw pi-receipt",
              to: "/refineria/finanzas/abono-ingreso",
            },

            {
              label: "Cuenta por Cobrar",
              icon: "pi pi-fw pi-money-bill",
              to: "/refineria/finanzas/cuenta-cobrar",
            },

            {
              label: "Cuenta por Pagar",
              icon: "pi pi-fw pi-money-bill",
              to: "/refineria/finanzas/cuenta-pagar",
            },

            {
              label: "Facturas de Gastos",
              icon: "pi pi-fw pi-truck",
              to: "/refineria/finanzas/facturas",
            },
            {
              label: "Balance Ventana de compras vs ventas",
              icon: "pi pi-fw pi-chart-line",
              to: "/refineria/finanzas/balance-ventana",
            },

            {
              label: "Reportes Financieros",
              icon: "pi pi-fw pi-money-bill",
              to: "/refineria/finanzas/reportes-financieros",
            },
          ],
        },
        {
          label: "Logística",
          icon: "pi pi-fw pi-briefcase",
          items: [
            {
              label: "Recepción",
              icon: "pi pi-fw pi-truck",
              to: "/refineria/logistica/recepcion",
            },
            {
              label: "Despacho",
              icon: "pi pi-fw pi-truck",
              to: "/refineria/logistica/despacho",
            },
            {
              label: "Reportes Logistica",
              icon: "pi pi-fw pi-truck",
              to: "/refineria/logistica/reportes-logistica",
            },
          ],
        },

        {
          label: "Operaciones",
          icon: "pi pi-fw pi-briefcase",
          items: [
            {
              label: "Chequeo Cantidad",
              icon: "pi pi-fw pi-check-circle",
              to: "/refineria/operaciones/chequeo-cantidad",
            },
            {
              label: "Corte de Refinación",
              icon: "pi pi-fw pi-table",
              to: "/refineria/operaciones/corte-refinacion",
            },
          ],
        },
        {
          label: "Laboratorio",
          icon: "pi pi-fw pi-briefcase",
          items: [
            {
              label: "Chequeo Calidad",
              icon: "pi pi-fw pi-check-circle",
              to: "/refineria/laboratorio/chequeo-calidad",
            },
          ],
        },
        {
          label: "Reportes y graficos",
          icon: "pi pi-fw pi-chart-bar",
          items: [
            {
              label: "Gráficos de Tanques",
              icon: "pi pi-fw pi-chart-line",
              to: "/refineria/reportes-graficas/graficos-tanques",
            },
            {
              label: "Gráficos de Recepciones",
              icon: "pi pi-fw pi-chart-bar",
              to: "/refineria/reportes-graficas/graficos-recepciones",
            },
            {
              label: "Gráficos de Despachos",
              icon: "pi pi-fw pi-chart-pie",
              to: "/refineria/reportes-graficas/graficos-despachos",
            },
            {
              label: "Gráficos de Contratos",
              icon: "pi pi-fw pi-chart-line",
              to: "/refineria/reportes-graficas/graficos-contratos",
            },
            {
              label: "Gráficos de Productos",
              icon: "pi pi-fw pi-chart-bar",
              to: "/refineria/reportes-graficas/graficos-productos",
            },
            {
              label: "Gráficos de Finanzas",
              icon: "pi pi-fw pi-chart-pie",
              to: "/refineria/reportes-graficas/graficos-finanzas",
            },
          ],
        },
        // {
        //   label: "Refinación",
        //   icon: "pi pi-fw pi-plus",
        //   to: "/refineria/refinacion",
        // },
        // {
        //   label: "Refinación Salida",
        //   icon: "pi pi-fw pi-plus",
        //   to: "/refineria/refinacion-salida",
        // },
      ],
    },
    // {
    //   label: "Gestión de Refinerias",
    //   icon: "pi pi-fw pi-user",
    //   items: [
    //     {
    //       label: "Lista",
    //       icon: "pi pi-fw pi-list",
    //       to: "/refineria/list",
    //     },
    //     {
    //       label: "Crear",
    //       icon: "pi pi-fw pi-plus",
    //       to: "/refineria/create",
    //     },
    //   ],
    // },
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenuRefineria;
