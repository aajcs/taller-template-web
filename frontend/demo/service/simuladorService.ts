// import { CrudeOption, Product, ProductYields } from "@/types/simulador";

// export interface CrudeTypeConfig {
//   name: string;
//   yields: ProductYields;
//   purchasePrice: number;
//   transportCost: number;
//   operationalCost: number;
//   sulfurContent: number;
//   api: number;
// }

// export const crudeTypes: Record<string, CrudeTypeConfig> = {
//   crude1: {
//     name: "U liviano",
//     yields: {
//       gas: 0.01,
//       naphtha: 0.09,
//       kerosene: 0,
//       mgo4: 0.25,
//       mgo6: 0.65,
//     },
//     purchasePrice: 0.53,
//     transportCost: 7.39,
//     operationalCost: 3,
//     sulfurContent: 0.55,
//     api: 21,
//   },
//   crude2: {
//     name: "Tapir/ RCS",
//     yields: {
//       gas: 0.02,
//       naphtha: 0.16,
//       kerosene: 0,
//       mgo4: 0.27,
//       mgo6: 0.55,
//     },
//     purchasePrice: 77.28,
//     transportCost: 6.78,
//     operationalCost: 3.5,
//     sulfurContent: 0.4,
//     api: 22,
//   },
//   crude3: {
//     name: "Nashira",
//     yields: {
//       gas: 0.01,
//       naphtha: 0.1,
//       kerosene: 0,
//       mgo4: 0.22,
//       mgo6: 0.67,
//     },
//     purchasePrice: 75.31,
//     transportCost: 0,
//     operationalCost: 3.5,
//     sulfurContent: 0.15,
//     api: 21,
//   },
//   crude4: {
//     name: "CN PESADO",
//     yields: {
//       gas: 0.02,
//       naphtha: 0.04,
//       kerosene: 0,
//       mgo4: 0.1,
//       mgo6: 0.85,
//     },
//     purchasePrice: 67.94,
//     transportCost: 7.44,
//     operationalCost: 3.5,
//     sulfurContent: 0.3,
//     api: 13,
//   },
//   crude5: {
//     name: "T liviano",
//     yields: {
//       gas: 0.01,
//       naphtha: 0.19,
//       kerosene: 0,
//       mgo4: 0.4,
//       mgo6: 0.4,
//     },
//     purchasePrice: 75.13,
//     transportCost: 7.63,
//     operationalCost: 3.5,
//     sulfurContent: 1.31,
//     api: 16.7,
//   },
// };

// // // Precios de los productos
// // export const productPrices: Record<Product, number> = {
// //   gas: 0,
// //   naphtha: 72.74 + 8,
// //   kerosene: 0,
// //   mgo4: 72.74 + 24 - 2.9 - 6.1,
// //   mgo6: 72.74 + 6 - 2.9 - 6.1,
// // };
// // Precios de los productos
// export const defaultProductPrices: Record<Product, number> = {
//   gas: 0,
//   naphtha: 72.74 + 8,
//   kerosene: 0,
//   mgo4: 72.74 + 24 - 2.9 - 6.1,
//   mgo6: 72.74 + 6 - 2.9 - 6.1,
// };

// // Obtener opciones de crudo para el selector
// export function getCrudeOptions(): CrudeOption[] {
//   return Object.entries(crudeTypes).map(([id, crude]) => ({
//     value: id,
//     label: crude.name,
//     api: crude.api,
//     sulfur: crude.sulfurContent,
//     purchasePrice: crude.purchasePrice,
//     transportCost: crude.transportCost,
//     operationalCost: crude.operationalCost,
//   }));
// }
