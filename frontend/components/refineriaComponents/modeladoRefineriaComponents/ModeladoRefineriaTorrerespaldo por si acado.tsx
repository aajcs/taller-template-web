import React, {
  useEffect,
  useState,
  SVGProps,
  useMemo,
  useCallback,
} from "react";
import ModeladoRefineriaTorreSVG from "./ModeladoRefineriaTorreSVG";
import ModeladoRefineriaTuberiaMaterial from "./ModeladoRefineriaTuberiaMaterial";
import { CorteRefinacion, TorreDestilacion } from "@/libs/interfaces";

interface TorreSection {
  name: string | undefined;
  idProducto: string | undefined;
  operational: boolean;
  bblPerHour: number;
  porcentaje: number;
  cantidad: string;
}

interface ModeladoRefineriaTorreProps extends SVGProps<SVGSVGElement> {
  torre: TorreDestilacion;
  corteRefinacions?: CorteRefinacion[];
}

const TOWER_HEIGHT = 380;
const TOWER_WIDTH = 100;
const TOWER_X = 150;
const TOWER_Y = 80;
interface DailyMetrics {
  date: string;
  products: {
    id: string;
    name: string;
    expected: number;
    actual: number;
    performance: number;
    difference: number;
  }[];
}

const calculateDailyProduction = (
  tower: TorreDestilacion,
  cuts: CorteRefinacion[]
): DailyMetrics[] => {
  const sortedCuts = [...cuts].sort(
    (a, b) =>
      new Date(a.fechaCorte).getTime() - new Date(b.fechaCorte).getTime()
  );

  const dailyResults: DailyMetrics[] = [];

  for (let i = 1; i < sortedCuts.length; i++) {
    const prev = sortedCuts[i - 1];
    const current = sortedCuts[i];

    const startDate = new Date(prev.fechaCorte);
    const endDate = new Date(current.fechaCorte);
    const hoursDiff = Math.abs(endDate.getTime() - startDate.getTime()) / 36e5;

    // Agrupar por día calendario
    const dateKey = endDate.toISOString().split("T")[0];

    const dailyEntry: DailyMetrics = {
      date: dateKey,
      products: [],
    };

    tower.material.forEach((material) => {
      const productId = material.idProducto?.id;
      if (!productId) return;
      const expectedDaily = tower.capacidad * (material.porcentaje / 100);
      const expected = expectedDaily * (hoursDiff / 24);

      const prevQty = getQuantity(prev, tower.id, productId);
      const currentQty = getQuantity(current, tower.id, productId);
      const actual = currentQty - prevQty;

      const performance = (actual / expected) * 100;

      dailyEntry.products.push({
        id: productId,
        name: material?.idProducto?.nombre || "",
        expected,
        actual,
        performance: isNaN(performance) ? 0 : performance,
        difference: actual - expected,
      });
    });

    dailyResults.push(dailyEntry);
  }

  return dailyResults;
};
const getProcessedRawMaterial = (
  cut: CorteRefinacion,
  towerId: string
): number => {
  const torreCut = cut.corteTorre.find((ct) => ct.idTorre.id === towerId);
  if (!torreCut) return 0;

  const rawMaterial = torreCut.detalles.find(
    (d) => d.idProducto?.tipoMaterial === "Materia Prima"
  );

  return rawMaterial?.cantidad || 0;
};

const calculateProductionMetrics = (
  tower: TorreDestilacion,
  cuts: CorteRefinacion[]
): any[] => {
  const sortedCuts = [...cuts].sort(
    (a, b) =>
      new Date(a.fechaCorte).getTime() - new Date(b.fechaCorte).getTime()
  );

  return sortedCuts.slice(1).map((currentCut, index) => {
    const prevCut = sortedCuts[index];
    const timeDiffHours =
      Math.abs(
        new Date(currentCut.fechaCorte).getTime() -
          new Date(prevCut.fechaCorte).getTime()
      ) / 36e5;

    // Calcular materia prima procesada
    const currentRaw = getProcessedRawMaterial(currentCut, tower.id);
    const prevRaw = getProcessedRawMaterial(prevCut, tower.id);
    const processedRaw = currentRaw - prevRaw;

    // Calcular métricas por producto
    const productsMetrics = tower.material.map((material) => {
      const productId = material.idProducto?.id;

      if (!productId) {
        return null;
      }
      // Obtener cantidades del producto derivado
      const getDerivedQty = (cut: CorteRefinacion) => {
        const torreCut = cut.corteTorre.find(
          (ct) => ct.idTorre.id === tower.id
        );
        const product = torreCut?.detalles.find(
          (d) =>
            d.idProducto?.id === productId &&
            d.idProducto?.tipoMaterial === "Derivado"
        );
        return product?.cantidad || 0;
      };

      const currentQty = getDerivedQty(currentCut);
      const prevQty = getDerivedQty(prevCut);
      const actualProduction = currentQty - prevQty;

      // Calcular producción esperada basada en materia prima real procesada
      const expectedProduction = processedRaw * (material.porcentaje / 100);
      const performance = (actualProduction / processedRaw) * 100;

      return {
        id: productId,
        name: material.idProducto?.nombre || "",
        expected: expectedProduction,
        actual: actualProduction,
        performance: isFinite(performance) ? performance : 0,
      };
    });

    return {
      processedRawMaterial: processedRaw,
      products: productsMetrics,
    };
  });
};
const getQuantity = (
  cut: CorteRefinacion,
  towerId: string,
  productId: string
): number => {
  const torreCut = cut.corteTorre.find((ct) => ct.idTorre.id === towerId);
  if (!torreCut) return 0;

  const producto = torreCut.detalles.find(
    (d) => d.idProducto?.id === productId
  );
  return producto?.cantidad || 0;
};
const ModeladoRefineriaTorre: React.FC<ModeladoRefineriaTorreProps> = ({
  torre,
  corteRefinacions,
  ...props
}) => {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<
    Record<string, DailyMetrics["products"][0]>
  >({});

  useEffect(() => {
    if (!torre || !corteRefinacions?.length) return;

    const calculatedMetrics = calculateProductionMetrics(
      torre,
      corteRefinacions
    );
    setMetrics(calculatedMetrics);

    // Obtener última métrica por producto
    const latest = calculatedMetrics.reduce((acc, day) => {
      day.products.forEach((product: DailyMetrics["products"][0]) => {
        acc[product.id] = product;
      });
      return acc;
    }, {});

    setLatestMetrics(latest);
  }, [torre, corteRefinacions]);
  const [apiData, setApiData] = useState<{ sections: TorreSection[] }>({
    sections: [],
  });
  console.log(apiData.sections);
  // const [ultimosCortes, setUltimosCortes] = useState<CorteRefinacion[]>([]);
  // const [difUltimosCortes, setDifUltimosCortes] = useState<any[]>([]);
  // console.log(difUltimosCortes);
  // console.log(ultimosCortes);

  // Calcular datos de las secciones
  interface DerivadoSection {
    name: string;
    idProducto: string;
    operational: boolean;
    bblPerHour: string;
    porcentaje: number;
    cantidad: string;
  }

  interface TorreData {
    sections: DerivadoSection[];
  }
  const { ultimosCortes, diferenciasPorTorre } = useMemo(() => {
    if (!corteRefinacions || corteRefinacions.length < 2) {
      return { ultimosCortes: [], diferenciasPorTorre: [] };
    }

    // Ordenar cortes por fecha
    const sortedCortes = [...corteRefinacions].sort(
      (a, b) =>
        new Date(b.fechaCorte).getTime() - new Date(a.fechaCorte).getTime()
    );

    const ultimosCortes = sortedCortes.slice(0, 2);
    const [ultimoCorte, penultimoCorte] = ultimosCortes;

    // Calcular diferencias entre cortes
    const diferenciasPorTorre = ultimoCorte.corteTorre.map((torreUltimo) => {
      const torrePenultimo = penultimoCorte.corteTorre.find(
        (t) => t.idTorre?.id === torreUltimo.idTorre?.id
      );

      return {
        idTorre: torreUltimo.idTorre?.id || "Desconocido",
        productos: torreUltimo.detalles.map((detalleUltimo) => {
          const detallePenultimo = torrePenultimo?.detalles.find(
            (d) => d.idProducto?.id === detalleUltimo.idProducto?.id
          );

          return {
            idProducto: detalleUltimo.idProducto?.id || "Desconocido",
            materiaPrima:
              detalleUltimo.idProducto.tipoMaterial || "Desconocido",
            diferenciaCantidad:
              detalleUltimo.cantidad - (detallePenultimo?.cantidad || 0),
            cantidadActual: detalleUltimo.cantidad,
          };
        }),
      };
    });

    return { ultimosCortes, diferenciasPorTorre };
  }, [corteRefinacions]);
  // Efecto principal para actualizar secciones
  useEffect(() => {
    if (!torre?.material) return;

    const calcularSecciones = () => {
      return torre.material.map((material) => {
        // Buscar datos actualizados en los cortes
        const datosActualizados = diferenciasPorTorre
          .find((t) => t.idTorre === torre?.id)
          ?.productos.find((p) => p.idProducto === material.idProducto?.id);
        const datosMateriaPrimaTotal = diferenciasPorTorre
          .find((t) => t.idTorre === torre?.id)
          ?.productos.find((p) => p.materiaPrima === "Materia Prima");

        return {
          name: material.idProducto?.nombre || "Desconocido",
          idProducto: material.idProducto?.id || "",
          operational: material.estadoMaterial === "True",
          porcentaje: material.porcentaje || 0,
          cantidad: datosActualizados?.cantidadActual.toString() || "0",
          bblPerHour: 0,
          diferenciaCantidad:
            datosActualizados?.diferenciaCantidad.toString() || "0",
        };
      });
    };

    setApiData({ sections: calcularSecciones() });
  }, [torre, diferenciasPorTorre]);
  // useEffect(() => {
  //   if (!torre?.material) return;

  //   const calculateDerivados = () => {
  //     return torre.material.map((material) => {
  //       const porcentaje = material.porcentaje || 0;

  //       return {
  //         name: material.idProducto?.nombre || "Desconocido",
  //         idProducto: material.idProducto?.id || "",
  //         operational: material.estadoMaterial === "True",
  //         bblPerHour: 0,
  //         porcentaje,
  //         cantidad: "0", // Inicialmente en 0, se actualizará con los datos de los cortes
  //         diferenciaCantidad: "0", // Inicialmente en 0, se actualizará con los datos de los cortes
  //       };
  //     });
  //   };

  //   const sections = calculateDerivados();
  //   setApiData({ sections });

  //   // Obtener los últimos dos cortes
  //   const ultimosCortes = corteRefinacions
  //     ?.sort(
  //       (a, b) =>
  //         new Date(b.fechaCorte).getTime() - new Date(a.fechaCorte).getTime()
  //     )
  //     .slice(0, 2);
  //   setUltimosCortes(ultimosCortes || []);

  //   if (ultimosCortes && ultimosCortes.length === 2) {
  //     const [ultimoCorte, penultimoCorte] = ultimosCortes;

  //     // Calcular las diferencias por torre y producto
  //     const diferenciasPorTorre = ultimoCorte.corteTorre.map((torreUltimo) => {
  //       const torrePenultimo = penultimoCorte.corteTorre.find(
  //         (torre) => torre.idTorre?.id === torreUltimo.idTorre?.id
  //       );

  //       const productos = torreUltimo.detalles.map((detalleUltimo) => {
  //         const detallePenultimo = torrePenultimo?.detalles.find(
  //           (detalle) => detalle.idProducto?.id === detalleUltimo.idProducto?.id
  //         );

  //         const diferenciaCantidad =
  //           detalleUltimo.cantidad - (detallePenultimo?.cantidad || 0);

  //         return {
  //           idProducto: detalleUltimo.idProducto?.id || "Desconocido",
  //           nombreProducto:
  //             detalleUltimo.idProducto?.nombre || "Producto sin nombre",
  //           cantidad: detalleUltimo.cantidad,
  //           diferenciaCantidad,
  //         };
  //       });

  //       return {
  //         idTorre: torreUltimo.idTorre?.id || "Desconocido",
  //         nombreTorre: torreUltimo.idTorre?.nombre || "Torre sin nombre",
  //         productos,
  //       };
  //     });

  //     // Actualizar las secciones con las cantidades y diferencias
  //     const updatedSections = sections.map((section) => {
  //       const torreData = diferenciasPorTorre.find(
  //         (torre) => torre.idTorre === torre.idProducto
  //       );

  //       if (torreData) {
  //         const productoData = torreData.productos.find(
  //           (producto) => producto.idProducto === section.idProducto
  //         );

  //         if (productoData) {
  //           return {
  //             ...section,
  //             cantidad: productoData.cantidad.toString(),
  //             diferenciaCantidad: productoData.diferenciaCantidad.toString(),
  //           };
  //         }
  //       }

  //       return section;
  //     });

  //     setApiData({ sections: updatedSections });
  //   }
  // }, [torre, corteRefinacions, difUltimosCortes]);
  // useEffect(() => {
  //   if (!ultimosCortes || ultimosCortes.length < 2) return;

  //   // Ordenar los cortes por fecha de corte (más reciente primero)
  //   const sortedCortes = [...ultimosCortes].sort(
  //     (a, b) =>
  //       new Date(b.fechaCorte).getTime() - new Date(a.fechaCorte).getTime()
  //   );

  //   // Calcular las diferencias en horas entre cada corte y las cantidades por torre y producto
  //   const diferenciasHoras = sortedCortes.map((corte, index) => {
  //     if (index === sortedCortes.length - 1) return null; // No hay siguiente corte para el último

  //     const fechaActual = new Date(corte.fechaCorte);
  //     const fechaSiguiente = new Date(sortedCortes[index + 1].fechaCorte);

  //     // Diferencia en milisegundos y convertir a horas
  //     const diferenciaMs = fechaActual.getTime() - fechaSiguiente.getTime();
  //     const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

  //     // Calcular cantidades por torre y producto en el corte actual
  //     const cantidadesPorTorreActual = corte.corteTorre.map((torre) => ({
  //       idTorre: torre.idTorre?.id || "Desconocido",
  //       nombreTorre: torre.idTorre?.nombre || "Torre sin nombre",
  //       productos: torre.detalles.map((detalle) => ({
  //         idProducto: detalle.idProducto?.id || "Desconocido",
  //         nombreProducto: detalle.idProducto?.nombre || "Producto sin nombre",
  //         cantidad: detalle.cantidad,
  //       })),
  //     }));

  //     // Calcular cantidades por torre y producto en el siguiente corte
  //     const cantidadesPorTorreSiguiente = sortedCortes[
  //       index + 1
  //     ].corteTorre.map((torre) => ({
  //       idTorre: torre.idTorre?.id || "Desconocido",
  //       nombreTorre: torre.idTorre?.nombre || "Torre sin nombre",
  //       productos: torre.detalles.map((detalle) => ({
  //         idProducto: detalle.idProducto?.id || "Desconocido",
  //         nombreProducto: detalle.idProducto?.nombre || "Producto sin nombre",
  //         cantidad: detalle.cantidad,
  //       })),
  //     }));

  //     return {
  //       numeroCorteActual: corte.numeroCorteRefinacion,
  //       numeroCorteSiguiente: sortedCortes[index + 1].numeroCorteRefinacion,
  //       diferenciaHoras: diferenciaHoras.toFixed(2), // Redondear a 2 decimales
  //       cantidadesPorTorreActual,
  //       cantidadesPorTorreSiguiente,
  //     };
  //   });

  //   console.log(
  //     "Diferencias en horas y cantidades por torre y producto entre cortes:",
  //     diferenciasHoras.filter(Boolean)
  //   );
  // }, [ultimosCortes]);
  // useEffect(() => {
  //   if (!ultimosCortes || ultimosCortes.length < 2) return;

  //   // Ordenar los cortes por fecha de corte (más reciente primero)
  //   const sortedCortes = [...ultimosCortes].sort(
  //     (a, b) =>
  //       new Date(b.fechaCorte).getTime() - new Date(a.fechaCorte).getTime()
  //   );

  //   // Obtener el último y el penúltimo corte
  //   const ultimoCorte = sortedCortes[0];
  //   const penultimoCorte = sortedCortes[1];

  //   // Calcular la diferencia de cantidades por producto y torre
  //   const diferenciasPorTorre = ultimoCorte.corteTorre.map((torreUltimo) => {
  //     const torrePenultimo = penultimoCorte.corteTorre.find(
  //       (torre) => torre.idTorre?.id === torreUltimo.idTorre?.id
  //     );

  //     if (!torrePenultimo) {
  //       // Si no existe la torre en el penúltimo corte, todas las cantidades son nuevas
  //       return {
  //         idTorre: torreUltimo.idTorre?.id || "Desconocido",
  //         nombreTorre: torreUltimo.idTorre?.nombre || "Torre sin nombre",
  //         productos: torreUltimo.detalles.map((detalleUltimo) => ({
  //           idProducto: detalleUltimo.idProducto?.id || "Desconocido",
  //           nombreProducto:
  //             detalleUltimo.idProducto?.nombre || "Producto sin nombre",
  //           diferenciaCantidad: detalleUltimo.cantidad, // Todo el producto es nuevo
  //         })),
  //       };
  //     }

  //     // Calcular la diferencia de cantidades para cada producto
  //     const productosDiferencias = torreUltimo.detalles.map((detalleUltimo) => {
  //       const detallePenultimo = torrePenultimo.detalles.find(
  //         (detalle) => detalle.idProducto?.id === detalleUltimo.idProducto?.id
  //       );

  //       const diferenciaCantidad =
  //         detalleUltimo.cantidad - (detallePenultimo?.cantidad || 0);

  //       return {
  //         idProducto: detalleUltimo.idProducto?.id || "Desconocido",
  //         nombreProducto:
  //           detalleUltimo.idProducto?.nombre || "Producto sin nombre",
  //         diferenciaCantidad,
  //       };
  //     });

  //     return {
  //       idTorre: torreUltimo.idTorre?.id || "Desconocido",
  //       nombreTorre: torreUltimo.idTorre?.nombre || "Torre sin nombre",
  //       productos: productosDiferencias,
  //     };
  //   });

  //   console.log(
  //     "Diferencias de cantidades por torre y producto:",
  //     diferenciasPorTorre
  //   );
  //   setDifUltimosCortes(diferenciasPorTorre);
  // }, [ultimosCortes]);

  const sectionHeight = TOWER_HEIGHT / Math.max(apiData.sections.length, 1);

  // Memoizar el renderizado de las secciones
  const renderSections = useCallback(() => {
    return apiData.sections.map((section, index) => {
      const sectionY = TOWER_Y + index * sectionHeight;
      const color = `#${torre.material[index]?.idProducto?.color || "ccc"}`;
      const isOperational = section.operational;

      return (
        <g key={`${section.idProducto || index}-${section.operational}`}>
          <rect
            x={TOWER_X + 15}
            y={sectionY + 5}
            width={TOWER_WIDTH - 30}
            height={sectionHeight - 10}
            fill={isOperational ? `url(#sectionGradient${color})` : "#ddd"}
            opacity={isOperational ? "1" : "0.4"}
            stroke="black"
            strokeWidth="1"
            rx="10"
          />

          <g strokeLinecap="round">
            <path
              d={`M ${TOWER_X + TOWER_WIDTH - 110} ${sectionY + sectionHeight}
                L ${TOWER_X + TOWER_WIDTH + 10} ${sectionY + sectionHeight}`}
              stroke="#707070"
              strokeWidth="3"
            />
            <path
              d={`M ${TOWER_X + TOWER_WIDTH - 110} ${
                sectionY + sectionHeight - 3
              }
                L ${TOWER_X + TOWER_WIDTH + 10} ${
                sectionY + sectionHeight - 3
              }`}
              stroke="#a0a09d"
              strokeWidth="3"
            />
          </g>

          <ModeladoRefineriaTuberiaMaterial
            x={TOWER_X + TOWER_WIDTH + 35}
            y={sectionY + sectionHeight / 2 + 100}
          />

          <g
            transform={`translate(${TOWER_X + TOWER_WIDTH + 35}, ${
              sectionY + sectionHeight / 2 + -15
            })`}
          >
            {/* Fondo aumentado con sombra suave */}
            <rect
              x="-10"
              y="-30"
              width="160"
              height="90"
              rx="6"
              fill="#ffffff"
              stroke="#e0e0e0"
              strokeWidth="1.2"
              filter="url(#shadow-light)"
            />

            {/* Contenido */}
            <g fontFamily="Segoe UI, sans-serif">
              {/* Título de la sección */}
              <text
                x="0"
                y="-10"
                fill="#1a1a1a"
                fontSize="16"
                fontWeight="700"
                text-decoration="underline"
              >
                {section.name || "Sección sin nombre"}
              </text>

              {/* Línea divisoria más visible */}
              <path d="M0 -3 L140 -3" stroke="#e0e0e0" strokeWidth="1" />

              {/* Contenedor de datos técnicos */}
              <g transform="translate(0, 10)" fontSize="14" fill="#4a4a4a">
                {/* Fila de rendimientos */}
                <g transform="translate(0, 0)">
                  <text fontWeight="600">
                    <tspan fill="#6c757d" dx="2">
                      Diseño:{" "}
                    </tspan>
                    <tspan
                      // fill={isOperational ? "#28a745" : "#dc3545"}
                      fontWeight="700"
                    >
                      {section.porcentaje}%
                    </tspan>
                  </text>
                </g>

                <g transform="translate(0, 18)">
                  <text fontWeight="600">
                    <tspan fill="#6c757d" dx="2">
                      Real:{" "}
                    </tspan>
                    <tspan
                      // fill={isOperational ? "#28a745" : "#dc3545"}
                      fontWeight="700"
                    >
                      no lo tengo%
                    </tspan>
                  </text>
                </g>

                {/* Fila de cantidades */}
                <g transform="translate(0, 36)">
                  <text>
                    <tspan fill="#6c757d" fontWeight="600" dx="2">
                      Cantidad:{" "}
                    </tspan>
                    <tspan fill="#1a1a1a" fontWeight="600">
                      {section.cantidad.toLocaleString()} bpd
                    </tspan>
                  </text>
                </g>
              </g>
            </g>
          </g>
        </g>
      );
    });
  }, [apiData.sections, sectionHeight, torre.material]);
  // const renderSections = useCallback(() => {
  //   return torre.material.map((material, index) => {
  //     const product = latestMetrics[material.idProducto.id] || {};
  //     const sectionY = TOWER_Y + index * (TOWER_HEIGHT / torre.material.length);
  //     console.log("product", product);
  //     return (
  //       <g key={material.idProducto.id}>
  //         {/* Renderizado de la sección */}
  //         {/* <rect
  //           x={TOWER_X}
  //           y={sectionY}
  //           width={TOWER_WIDTH}
  //           height={sectionHeight}
  //           fill={`#${material.idProducto.color}`}
  //         /> */}
  //         <rect
  //           x={TOWER_X + 15}
  //           y={sectionY + 5}
  //           width={TOWER_WIDTH - 30}
  //           height={sectionHeight - 10}
  //           fill={
  //             material.idProducto
  //               ? `url(#sectionGradient${material.idProducto.color})`
  //               : "#ddd"
  //           }
  //           fill={`#${material.idProducto.color}`}
  //           opacity={"0.4"}
  //           stroke="black"
  //           strokeWidth="1"
  //           rx="10"
  //         />
  //         <g strokeLinecap="round">
  //           <path
  //             d={`M ${TOWER_X + TOWER_WIDTH - 110} ${sectionY + sectionHeight}
  //               L ${TOWER_X + TOWER_WIDTH + 10} ${sectionY + sectionHeight}`}
  //             stroke="#707070"
  //             strokeWidth="3"
  //           />
  //           <path
  //             d={`M ${TOWER_X + TOWER_WIDTH - 110} ${
  //               sectionY + sectionHeight - 3
  //             }
  //               L ${TOWER_X + TOWER_WIDTH + 10} ${
  //               sectionY + sectionHeight - 3
  //             }`}
  //             stroke="#a0a09d"
  //             strokeWidth="3"
  //           />
  //         </g>

  //         <ModeladoRefineriaTuberiaMaterial
  //           x={TOWER_X + TOWER_WIDTH + 35}
  //           y={sectionY + sectionHeight / 2 + 100}
  //         />
  //         <g
  //           transform={`translate(${TOWER_X + TOWER_WIDTH + 35}, ${
  //             sectionY + sectionHeight / 2 + -15
  //           })`}
  //         >
  //           {/* Fondo aumentado con sombra suave */}
  //           <rect
  //             x="-10"
  //             y="-30"
  //             width="160"
  //             height="90"
  //             rx="6"
  //             fill="#ffffff"
  //             stroke="#e0e0e0"
  //             stroke-width="1.2"
  //             filter="url(#shadow-light)"
  //           />
  //         </g>

  //         {/* Datos de rendimiento */}
  //         <text x={TOWER_X + TOWER_WIDTH + 20} y={sectionY + 20}>
  //           {product.name} - Real: {product.performance?.toFixed(1)}%
  //         </text>
  //         <text x={TOWER_X + TOWER_WIDTH + 20} y={sectionY + 40}>
  //           Esperado: {material.porcentaje}% | Diferencia:{" "}
  //           {product.difference?.toFixed(1)}
  //         </text>
  //       </g>
  //     );
  //   });
  // }, [torre.material, latestMetrics]);

  return (
    <svg
      width="300"
      height="400"
      viewBox="100 100 400 300"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      {...props}
    >
      <defs>
        <radialGradient id="cylinderGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </radialGradient>

        {torre.material.map((material, index) => {
          const color = `#${material.idProducto?.color || "ccc"}`;
          return (
            <linearGradient
              key={`sectionGradient-${color}-${index}`}
              id={`sectionGradient${color}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={`${color}80`} />
            </linearGradient>
          );
        })}
      </defs>

      <ModeladoRefineriaTorreSVG />

      <g fontSize="14" fill="black">
        <text x={135} y={495}>
          {torre?.capacidad?.toFixed(2) || "0.00"} bpd
        </text>
        <text x={135} y={515}>
          {/* {displayedRefinacion.toFixed(2)} bbl/h */}
        </text>
      </g>

      {renderSections()}
    </svg>
  );
};

export default React.memo(ModeladoRefineriaTorre);
