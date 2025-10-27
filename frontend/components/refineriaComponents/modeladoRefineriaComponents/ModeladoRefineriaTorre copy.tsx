// import React, { useEffect, useState, SVGProps, useMemo } from "react";
// import ModeladoRefineriaTorreSVG from "./ModeladoRefineriaTorreSVG";
// import ModeladoRefineriaTuberiaMaterial from "./ModeladoRefineriaTuberiaMaterial";
// import { Refinacion, TorreDestilacion } from "@/libs/interface";
// interface ModeladoRefineriaTorreProps {
//   torre: TorreDestilacion;
//   refinacions?: Refinacion[];
// }
// const ModeladoRefineriaTorre = (
//   { torre, refinacions }: ModeladoRefineriaTorreProps,
//   props: SVGProps<SVGSVGElement>
// ) => {
//   const [apiData, setApiData] = useState({
//     sections: torre.material.map((material) => {
//       // Filtra las refinaciones relacionadas con la torre actual
//       const refinacionFilter = refinacions?.filter(
//         (refinacion) => refinacion.idTorre.id === torre.id
//       );

//       // Encuentra el derivado correspondiente al idProducto
//       const derivado = refinacionFilter
//         ?.flatMap((refinacion) => refinacion.derivado)
//         .find((d) => d.idProducto.id === material.idProducto?.id);

//       // Calcula el porcentaje y la cantidad si existe el derivado
//       const porcentaje = derivado ? derivado.porcentaje : 0;
//       const cantidadTotal = refinacionFilter?.reduce(
//         (acc, refinacion) => acc + refinacion.cantidadTotal,
//         0
//       );
//       const cantidad = derivado
//         ? ((porcentaje / 100) * (cantidadTotal || 0)).toFixed(2)
//         : "0.00";

//       return {
//         name: material.idProducto?.nombre,
//         idProducto: material.idProducto?.id,
//         operational: material.estadoMaterial === "True" ? true : false,
//         bblPerHour: 0,
//         porcentaje, // Asocia el porcentaje calculado
//         cantidad, // Asocia la cantidad calculada
//       };
//     }),
//   });
//   const [refinacion, setRefinacion] = useState<Refinacion | null>(null);

//   useEffect(() => {
//     const refinacionFilter = refinacions?.filter(
//       (refinacion) => refinacion.idTorre.id === torre.id
//     );
//     setRefinacion(refinacionFilter?.[0] ?? null);
//     // Calcula la cantidad de cada derivado según su porcentaje
//     const derivadoCantidades = refinacionFilter?.map((refinacion) => ({
//       ...refinacion,
//       derivados: refinacion.derivado.map((derivado) => ({
//         ...derivado,
//         cantidad: (
//           (derivado.porcentaje / 100) *
//           refinacion.cantidadTotal
//         ).toFixed(2), // Calcula la cantidad
//       })),
//     }));
//   }, [torre, refinacions]);

//   const totalRefinacion = useMemo(() => {
//     if (!torre || !refinacions) return 0;

//     const now = new Date();

//     return refinacions
//       .filter((refinacion) => refinacion.idTorre.id === torre.id)
//       .reduce((acc, refinacion) => {
//         // Ajusta el nombre de campos según tu estructura real
//         const { fechaInicio, fechaFin, cantidadTotal } = refinacion;
//         if (!fechaInicio || !fechaFin) return acc;

//         const start = new Date(fechaInicio);
//         const end = new Date(fechaFin);

//         // Si la fecha actual está antes del inicio, no se ha consumido nada
//         if (now < start) {
//           return acc;
//         }
//         // Si la fecha actual está después del fin, se ha consumido la totalidad
//         if (now >= end) {
//           return acc + cantidadTotal;
//         }
//         // En caso contrario, calcula la fracción consumida según el tiempo transcurrido
//         const totalTime = end.getTime() - start.getTime();
//         const elapsed = now.getTime() - start.getTime();
//         const fraction = elapsed / totalTime;
//         // Retorna la parte proporcional de la cantidadTotal
//         return acc + cantidadTotal * fraction;
//       }, 0);
//   }, [torre, refinacions]);
//   const [displayedRefinacion, setDisplayedRefinacion] =
//     useState(totalRefinacion);

//   // useEffect(() => {
//   //   const interval = setInterval(() => {
//   //     setDisplayedRefinacion((prev) => {
//   //       const nextValue = prev - 0.01; // Incrementa por 0.01 cada segundo

//   //       return nextValue < 0 ? 0 : nextValue; // No puede ser negativo
//   //     });
//   //   }, 1000);

//   //   return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente
//   // }, [totalRefinacion]);

//   // useEffect(() => {
//   //   setDisplayedRefinacion(totalRefinacion); // Sincroniza con el valor inicial de totalRefinacion
//   // }, [totalRefinacion]);
//   // console.log(totalRefinacion);
//   //   useEffect(() => {
//   //     const fetchData = () => {
//   //       setTimeout(() => {
//   //         setApiData({
//   //           sections: apiData.sections.map((section) => ({
//   //             ...section,
//   //             operational: Math.random() > 0.5,
//   //             bblPerHour: Math.floor(Math.random() * 500 + 100),
//   //           })),
//   //         });
//   //       }, 2000);
//   //     };

//   //     fetchData();
//   //     const interval = setInterval(fetchData, 5000);
//   //     return () => clearInterval(interval);
//   //   }, [torre]);

//   const towerHeight = 380;
//   const towerWidth = 100;
//   const towerX = 150;
//   const towerY = 80;
//   const sectionHeight = towerHeight / apiData.sections.length;
//   const radius = towerWidth / 2;

//   return (
//     <svg
//       width="200"
//       height="400"
//       viewBox="100 100 300 300"
//       // className="card m-0 p-0"
//       id="e73Ach9EHV41"
//       xmlns="http://www.w3.org/2000/svg"
//       xmlnsXlink="http://www.w3.org/1999/xlink"
//       shapeRendering="geometricPrecision"
//       textRendering="geometricPrecision"
//       project-id="1041a76c2f17444290a8b82eb9ff7078"
//       export-id="953efd2ad32d4eb5816f3fcb3b964593"
//       // cached="false"
//       {...props}
//     >
//       <defs>
//         {/* Gradiente para la torre */}
//         <radialGradient id="cylinderGradient" cx="50%" cy="50%" r="50%">
//           <stop offset="0%" stopColor="#e0e0e0" /> {/* Gris claro */}
//           <stop offset="100%" stopColor="#a0a0a0" /> {/* Gris oscuro */}
//         </radialGradient>

//         {/* Gradientes para las secciones (de rojo a naranja) */}
//         {apiData.sections.map((_, index) => {
//           const color = `#${torre.material[index].idProducto?.color}`; // Obtén el color basado en el material
//           return (
//             <linearGradient
//               key={`sectionGradient${color}`}
//               id={`sectionGradient${color}`}
//               x1="0%"
//               y1="0%"
//               x2="0%"
//               y2="100%"
//             >
//               <stop offset="0%" stopColor={color} /> {/* Color principal */}
//               <stop offset="100%" stopColor={`${color}80`} />{" "}
//               {/* Color con transparencia */}
//             </linearGradient>
//           );
//         })}
//       </defs>
//       {/* Torre */}
//       <ModeladoRefineriaTorreSVG />
//       <text x={135} y={495} fill="black" fontSize="18">
//         {refinacion?.cantidadTotal.toFixed(2)} bbl/h
//       </text>
//       <text x={135} y={515} fill="black" fontSize="18">
//         {displayedRefinacion.toFixed(2)} bbl/h
//       </text>
//       {/* Secciones */}
//       {apiData.sections.map((section, index) => {
//         const sectionY = towerY + index * sectionHeight;
//         const color = `#${torre.material[index].idProducto?.color}`; // Obtén el color basado en el material

//         return (
//           <g key={section.name}>
//             <rect
//               x={towerX + 15}
//               y={sectionY + 5}
//               width={towerWidth - 30}
//               height={sectionHeight - 10}
//               fill={
//                 section.operational ? `url(#sectionGradient${color})` : "#ddd"
//               }
//               opacity={section.operational ? "1" : "0.4"}
//               stroke="black"
//               strokeWidth="1"
//               rx="10"
//             />

//             {/* Tubería */}

//             {/* Conector */}
//             {/* <g transform="0 0"> */}
//             {/* <g
//               transform={`translate(${towerX - 78}, ${
//                 sectionY + 0.5 * sectionHeight + 12
//               }) scale(1.2)`}
//             >
//               <g transform="matrix(5.209884 0 0-5.20991-1472.67914 1768.349123)">
//                 <path
//                   d="M312.485,311.823h-18.679v-.992h18.679v.992Z"
//                   fill="#707070"
//                 />
//                 <path
//                   d="M312.884,311.305h-19.476c-.187,0-.338-.151-.338-.338s.151-.338.338-.338h19.476c.186,0,.338.151.338.338s-.152.338-.338.338Z"
//                   fill="#a0a09d"
//                 />
//               </g>
//             </g> */}
//             <path
//               d={`M ${towerX + towerWidth - 110} ${
//                 sectionY + sectionHeight
//               } L ${towerX + towerWidth + 10} ${sectionY + sectionHeight}`}
//               stroke="#707070"
//               strokeWidth="3"
//             />
//             <path
//               d={`M ${towerX + towerWidth - 110} ${
//                 sectionY + sectionHeight - 3
//               } L ${towerX + towerWidth + 10} ${sectionY + sectionHeight - 3}`}
//               stroke="#a0a09d"
//               strokeWidth="3"
//               strokeLinecap="round"
//             />
//             {/* </g> */}
//             <ModeladoRefineriaTuberiaMaterial
//               x={towerX + towerWidth + 35}
//               y={sectionY + sectionHeight / 2 + 10}
//             />
//             <text
//               x={towerX + towerWidth + 35}
//               y={sectionY + sectionHeight / 2 - 5}
//               fill="black"
//               fontSize="18"
//               fontWeight="bold"
//             >
//               {section.name}
//             </text>

//             <text
//               x={towerX + towerWidth + 35}
//               y={sectionY + sectionHeight / 2 + 10}
//               fill="black"
//               fontSize="18"
//             >
//               {section.operational ? "Operativa" : "Inactiva"}
//             </text>

//             <text
//               x={towerX + towerWidth + 35}
//               y={sectionY + sectionHeight / 2 + 25}
//               fill="black"
//               fontSize="18"
//             >
//               {section.cantidad} bbl/h
//             </text>
//           </g>
//         );
//       })}
//     </svg>
//   );
// };

// export default ModeladoRefineriaTorre;
