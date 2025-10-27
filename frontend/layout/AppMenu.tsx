import AppSubMenu from "./AppSubMenu";
import type { MenuModel } from "@/types";

const AppMenu = () => {
  const model: MenuModel[] = [
    {
      label: "Dashboards",
      icon: "pi pi-home",
      items: [
        {
          label: "Operaciones",
          icon: "pi pi-fw pi-home",
          to: "/",
        },
        {
          label: "Finanzas",
          icon: "pi pi-fw pi-image",
          to: "/dashboard-sales",
        },
      ],
    },
    // {
    //     label: 'UI Kit',
    //     icon: 'pi pi-fw pi-star',
    //     items: [
    //         {
    //             label: 'Form Layout',
    //             icon: 'pi pi-fw pi-id-card',
    //             to: '/uikit/formlayout'
    //         },
    //         {
    //             label: 'Input',
    //             icon: 'pi pi-fw pi-check-square',
    //             to: '/uikit/input'
    //         },
    //         {
    //             label: 'Float Label',
    //             icon: 'pi pi-fw pi-bookmark',
    //             to: '/uikit/floatlabel'
    //         },
    //         {
    //             label: 'Invalid State',
    //             icon: 'pi pi-fw pi-exclamation-circle',
    //             to: '/uikit/invalidstate'
    //         },
    //         {
    //             label: 'Button',
    //             icon: 'pi pi-fw pi-box',
    //             to: '/uikit/button'
    //         },
    //         {
    //             label: 'Table',
    //             icon: 'pi pi-fw pi-table',
    //             to: '/uikit/table'
    //         },
    //         {
    //             label: 'List',
    //             icon: 'pi pi-fw pi-list',
    //             to: '/uikit/list'
    //         },
    //         {
    //             label: 'Tree',
    //             icon: 'pi pi-fw pi-share-alt',
    //             to: '/uikit/tree'
    //         },
    //         {
    //             label: 'Panel',
    //             icon: 'pi pi-fw pi-tablet',
    //             to: '/uikit/panel'
    //         },
    //         {
    //             label: 'Overlay',
    //             icon: 'pi pi-fw pi-clone',
    //             to: '/uikit/overlay'
    //         },
    //         {
    //             label: 'Media',
    //             icon: 'pi pi-fw pi-image',
    //             to: '/uikit/media'
    //         },
    //         {
    //             label: 'Menu',
    //             icon: 'pi pi-fw pi-bars',
    //             to: '/uikit/menu'
    //         },
    //         {
    //             label: 'Message',
    //             icon: 'pi pi-fw pi-comment',
    //             to: '/uikit/message'
    //         },
    //         {
    //             label: 'File',
    //             icon: 'pi pi-fw pi-file',
    //             to: '/uikit/file'
    //         },
    //         {
    //             label: 'Chart',
    //             icon: 'pi pi-fw pi-chart-bar',
    //             to: '/uikit/charts'
    //         },
    //         {
    //             label: 'Misc',
    //             icon: 'pi pi-fw pi-circle-off',
    //             to: '/uikit/misc'
    //         }
    //     ]
    // },
    // {
    //   label: "Apps",
    //   icon: "pi pi-th-large",
    //   items: [
    //     {
    //       label: "Blog",
    //       icon: "pi pi-fw pi-comment",
    //       items: [
    //         {
    //           label: "List",
    //           icon: "pi pi-fw pi-image",
    //           to: "/apps/blog/list",
    //         },
    //         {
    //           label: "Detail",
    //           icon: "pi pi-fw pi-list",
    //           to: "/apps/blog/detail",
    //         },
    //         {
    //           label: "Edit",
    //           icon: "pi pi-fw pi-pencil",
    //           to: "/apps/blog/edit",
    //         },
    //       ],
    //     },
    //     {
    //       label: "Calendar",
    //       icon: "pi pi-fw pi-calendar",
    //       to: "/apps/calendar",
    //     },
    //     {
    //       label: "Chat",
    //       icon: "pi pi-fw pi-comments",
    //       to: "/apps/chat",
    //     },
    //     {
    //       label: "Files",
    //       icon: "pi pi-fw pi-folder",
    //       to: "/apps/files",
    //     },
    //     {
    //       label: "Mail",
    //       icon: "pi pi-fw pi-envelope",
    //       items: [
    //         {
    //           label: "Inbox",
    //           icon: "pi pi-fw pi-inbox",
    //           to: "/apps/mail/inbox",
    //         },
    //         {
    //           label: "Compose",
    //           icon: "pi pi-fw pi-pencil",
    //           to: "/apps/mail/compose",
    //         },
    //         {
    //           label: "Detail",
    //           icon: "pi pi-fw pi-comment",
    //           to: "/apps/mail/detail/1000",
    //         },
    //       ],
    //     },
    //     {
    //       label: "Task List",
    //       icon: "pi pi-fw pi-check-square",
    //       to: "/apps/tasklist",
    //     },
    //   ],
    // },

    // {
    //   label: "Pages",
    //   icon: "pi pi-fw pi-briefcase",
    //   items: [
    //     {
    //       label: "Landing",
    //       icon: "pi pi-fw pi-globe",
    //       to: "/landing",
    //     },
    //     {
    //       label: "Auth",
    //       icon: "pi pi-fw pi-user",
    //       items: [
    //         {
    //           label: "Login",
    //           icon: "pi pi-fw pi-sign-in",
    //           to: "/auth/login",
    //         },

    //         {
    //           label: "Error",
    //           icon: "pi pi-fw pi-times-circle",
    //           to: "/auth/error",
    //         },

    //         {
    //           label: "Access Denied",
    //           icon: "pi pi-fw pi-lock",
    //           to: "/auth/access",
    //         },

    //         {
    //           label: "Register",
    //           icon: "pi pi-fw pi-user-plus",
    //           to: "/auth/register",
    //         },
    //         {
    //           label: "Forgot Password",
    //           icon: "pi pi-fw pi-question",
    //           to: "/auth/forgotpassword",
    //         },
    //         {
    //           label: "New Password",
    //           icon: "pi pi-fw pi-cog",
    //           to: "/auth/newpassword",
    //         },
    //         {
    //           label: "Verification",
    //           icon: "pi pi-fw pi-envelope",
    //           to: "/auth/verification",
    //         },
    //         {
    //           label: "Lock Screen",
    //           icon: "pi pi-fw pi-eye-slash",
    //           to: "/auth/lockscreen",
    //         },
    //       ],
    //     },
    //     {
    //       label: "Crud",
    //       icon: "pi pi-fw pi-pencil",
    //       to: "/pages/crud",
    //     },
    //     {
    //       label: "Timeline",
    //       icon: "pi pi-fw pi-calendar",
    //       to: "/pages/timeline",
    //     },
    //     {
    //       label: "Invoice",
    //       icon: "pi pi-fw pi-dollar",
    //       to: "/pages/invoice",
    //     },

    //     {
    //       label: "Help",
    //       icon: "pi pi-fw pi-question-circle",
    //       to: "/pages/help",
    //     },
    //     {
    //       label: "Not Found",
    //       icon: "pi pi-fw pi-exclamation-circle",
    //       to: "/pages/notfound",
    //     },
    //     {
    //       label: "Empty",
    //       icon: "pi pi-fw pi-circle-off",
    //       to: "/pages/empty",
    //     },
    //     {
    //       label: "Contact Us",
    //       icon: "pi pi-fw pi-phone",
    //       to: "/pages/contact",
    //     },
    //   ],
    // },
    // {
    //   label: "E-Commerce",
    //   icon: "pi pi-fw pi-wallet",
    //   items: [
    //     {
    //       label: "Product Overview",
    //       icon: "pi pi-fw pi-image",
    //       to: "/ecommerce/product-overview",
    //     },
    //     {
    //       label: "Product List",
    //       icon: "pi pi-fw pi-list",
    //       to: "/ecommerce/product-list",
    //     },
    //     {
    //       label: "New Product",
    //       icon: "pi pi-fw pi-plus",
    //       to: "/ecommerce/new-product",
    //     },
    //     {
    //       label: "Shopping Cart",
    //       icon: "pi pi-fw pi-shopping-cart",
    //       to: "/ecommerce/shopping-cart",
    //     },
    //     {
    //       label: "Checkout Form",
    //       icon: "pi pi-fw pi-check-square",
    //       to: "/ecommerce/checkout-form",
    //     },
    //     {
    //       label: "Order History",
    //       icon: "pi pi-fw pi-history",
    //       to: "/ecommerce/order-history",
    //     },
    //     {
    //       label: "Order Summary",
    //       icon: "pi pi-fw pi-file",
    //       to: "/ecommerce/order-summary",
    //     },
    //   ],
    // },

    {
      label: "Gestión de Usuarios",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "Lista",
          icon: "pi pi-fw pi-list",
          to: "/users/list",
        },
        {
          label: "Crear",
          icon: "pi pi-fw pi-plus",
          to: "/users/create",
        },
      ],
    },
    {
      label: "Gestión de Gastos",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "Partidas",
          icon: "pi pi-fw pi-truck",
          to: "/partidas",
        },
      ],
    },
    {
      label: "Gestión de Refinerias",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "Lista",
          icon: "pi pi-fw pi-list",
          to: "/todas-refinerias/list",
        },
        {
          label: "Crear",
          icon: "pi pi-fw pi-plus",
          to: "/todas-refinerias/create",
        },
      ],
    },
    {
      label: "Gestión de Bunkering",
      icon: "pi pi-fw pi-ship", // Cambiado a icono de buque
      items: [
        {
          label: "Lista",
          icon: "pi pi-fw pi-list",
          to: "/todos-bunkering/list",
        },
        {
          label: "Crear",
          icon: "pi pi-fw pi-plus",
          to: "/todos-bunkering/create",
        },
      ],
    },
    {
      label: "Simulador - Análisis de Rentabilidad",
      icon: "pi pi-fw pi-chart-line",
      items: [
        {
          label: "Simulador Básico",
          icon: "pi pi-fw pi-chart-line",
          to: "/simulacion",
        },
        {
          label: "Simulador Avanzado",
          icon: "pi pi-fw pi-chart-line",
          to: "/simulacion-avanzado",
        },
      ],
    },
    // {
    //   label: "Hierarchy",
    //   icon: "pi pi-fw pi-align-left",
    //   items: [
    //     {
    //       label: "Submenu 1",
    //       icon: "pi pi-fw pi-align-left",
    //       items: [
    //         {
    //           label: "Submenu 1.1",
    //           icon: "pi pi-fw pi-align-left",
    //           items: [
    //             {
    //               label: "Submenu 1.1.1",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //             {
    //               label: "Submenu 1.1.2",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //             {
    //               label: "Submenu 1.1.3",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //           ],
    //         },
    //         {
    //           label: "Submenu 1.2",
    //           icon: "pi pi-fw pi-align-left",
    //           items: [
    //             {
    //               label: "Submenu 1.2.1",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //     {
    //       label: "Submenu 2",
    //       icon: "pi pi-fw pi-align-left",
    //       items: [
    //         {
    //           label: "Submenu 2.1",
    //           icon: "pi pi-fw pi-align-left",
    //           items: [
    //             {
    //               label: "Submenu 2.1.1",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //             {
    //               label: "Submenu 2.1.2",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //           ],
    //         },
    //         {
    //           label: "Submenu 2.2",
    //           icon: "pi pi-fw pi-align-left",
    //           items: [
    //             {
    //               label: "Submenu 2.2.1",
    //               icon: "pi pi-fw pi-align-left",
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },
  ];

  return <AppSubMenu model={model} />;
};

export default AppMenu;
