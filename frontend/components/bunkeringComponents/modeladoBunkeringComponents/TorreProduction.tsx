// import { CorteRefinacion, TorreDestilacion } from "@/libs/interfaces";
// import { useEffect, useState } from "react";

// interface DailyProduction {
//   date: string;
//   processedCrude: number;
//   derivatives: {
//     name: string;
//     quantity: number;
//     percentage: number;
//   }[];
// }

// interface ProcessedData {
//   date: string;
//   processedCrude: number;
//   details: Array<{
//     derivative: string;
//     quantityProduced: number;
//     requiredCrude: number;
//   }>;
// }

// import { Producto } from "@/libs/interfaces";

// const calculateDailyProduction = (
//   tower: TorreDestilacion,
//   cuts: CorteRefinacion[]
// ): ProcessedData[] => {
//   if (cuts.length < 2) {
//     return [];
//   }

//   // 1. Ordenar cortes por fecha
//   const sortedCuts = [...cuts].sort(
//     (a, b) =>
//       new Date(a.fechaCorte).getTime() - new Date(b.fechaCorte).getTime()
//   );

//   const results: ProcessedData[] = [];

//   // 2. Procesar cada par de cortes consecutivos
//   for (let i = 1; i < sortedCuts.length; i++) {
//     const prev = sortedCuts[i - 1];
//     const current = sortedCuts[i];

//     // 3. Obtener detalles de la torre específica
//     const getTorreDetails = (cut: CorteRefinacion) =>
//       cut.corteTorre.find((ct) => ct.idTorre.id === tower.id)?.detalles || [];

//     const prevDetails = getTorreDetails(prev);
//     const currentDetails = getTorreDetails(current);

//     // 4. Calcular producción de derivados
//     const derivativesProduction = tower.material.map((material) => {
//       const isDerivado = material.idProducto?.tipoMaterial === "Derivado";
//       const productId = material.idProducto?.id;

//       const getQty = (details: any[]) =>
//         details.find((d) => d.idProducto?.id === productId)?.cantidad || 0;

//       const prevQty = getQty(prevDetails);
//       const currentQty = getQty(currentDetails);
//       const produced = currentQty - prevQty; // Permitir valores negativos

//       return {
//         name: material.idProducto.nombre,
//         percentage: material.porcentaje,
//         produced,
//         requiredCrude: produced / (material.porcentaje / 100),
//       };
//     });
//     // 5. Calcular crudo procesado (máximo requerido)
//     const processedCrude = Math.max(
//       ...derivativesProduction.map((d) => d.requiredCrude)
//     );

//       const getQty = (details: any[]) =>
//         details.find((d) => d.idProducto?.id === productId)?.cantidad || 0;

//       const prevQty = getQty(prevDetails);
//       const currentQty = getQty(currentDetails);
//       const produced = currentQty - prevQty; // Permitir valores negativos

//       return {
//         name: material.idProducto.nombre,
//         percentage: material.porcentaje,
//         produced,
//         requiredCrude: produced / (material.porcentaje / 100),
//       };
//     });

//     // 6. Agrupar por fecha calendario
//     const currentDate = new Date(current.fechaCorte)
//       .toISOString()
//       .split("T")[0];

//     results.push({
//       date: currentDate,
//       processedCrude: Number(processedCrude.toFixed(2)),
//       details: derivativesProduction.map((d) => ({
//         derivative: d.name,
//         quantityProduced: d.produced,
//         requiredCrude: Number(d.requiredCrude.toFixed(2)),
//       })),
//     });
//   }

//   return results;
// };

// // Componente React
// const TorreProduction: React.FC<{
//   tower: TorreDestilacion;
//   cuts: CorteRefinacion[];
// }> = ({ tower, cuts }) => {
//   const [productionData, setProductionData] = useState<ProcessedData[]>([]);

//   useEffect(() => {
//     if (cuts.length < 2) return;
//     const calculated = calculateDailyProduction(tower, cuts);
//     setProductionData(calculated);
//   }, [tower, cuts]);

//   return (
//     <div>
//       <h2>{tower.nombre} - Producción Diaria</h2>
//       <div className="capacity">
//         Capacidad Configurada: {tower.capacidad.toLocaleString()} bbl/día
//       </div>

//       {productionData.map((day, i) => (
//         <div key={i} className="day-production">
//           <h3>{new Date(day.date).toLocaleDateString()}</h3>
//           <div className="crude">
//             Crudo Procesado: {day.processedCrude.toLocaleString()} bbl
//           </div>

//           <div className="derivatives">
//             {day.details.map((d, j) => (
//               <div key={j} className="derivative">
//                 <span>{d.derivative}:</span>
//                 <span>{d.quantityProduced} bbl</span>
//                 <span>(Requiere {d.requiredCrude.toLocaleString()} bbl)</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default TorreProduction;
