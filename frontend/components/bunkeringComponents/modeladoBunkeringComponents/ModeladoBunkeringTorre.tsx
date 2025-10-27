import React, {
  useEffect,
  useState,
  SVGProps,
  useMemo,
  useCallback,
} from "react";
import ModeladoBunkeringTorreSVG from "./ModeladoBunkeringTorreSVG";
import ModeladoBunkeringTuberiaMaterial from "./ModeladoBunkeringTuberiaMaterial";
import { CorteRefinacion, TorreDestilacion } from "@/libs/interfaces";

interface TorreSection {
  horasEntreCortes: any;
  cantidadMateriaPrima: any;
  porcentajeReal: any;
  name: string | undefined;
  idProducto: string | undefined;
  operational: boolean;
  bblPerHour: number;
  porcentaje: number;
  cantidad: string;
}

interface ModeladoBunkeringTorreProps extends SVGProps<SVGSVGElement> {
  torre: TorreDestilacion;
  corteRefinacions?: CorteRefinacion[];
}

const TOWER_HEIGHT = 380;
const TOWER_WIDTH = 100;
const TOWER_X = 150;
const TOWER_Y = 80;

const ModeladoBunkeringTorre: React.FC<ModeladoBunkeringTorreProps> = ({
  torre,
  corteRefinacions,
  ...props
}) => {
  const [apiData, setApiData] = useState<{ sections: TorreSection[] }>({
    sections: [],
  });
  // Calcular datos de las secciones

  const { ultimosCortes, diferenciasPorTorre } = useMemo(() => {
    if (!corteRefinacions || corteRefinacions.length < 2) {
      return { ultimosCortes: [], diferenciasPorTorre: [] };
    }

    // Filtrar cortes solo de la fecha de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cortesHoy = corteRefinacions.filter((corte) => {
      const fechaCorte = new Date(corte.fechaCorte);
      fechaCorte.setHours(0, 0, 0, 0);
      return fechaCorte.getTime() === today.getTime();
    });

    // Ordenar cortes de hoy por fecha
    const sortedCortes = [...cortesHoy].sort(
      (a, b) =>
        new Date(b.fechaCorte).getTime() - new Date(a.fechaCorte).getTime()
    );

    const ultimosCortes = [
      sortedCortes[sortedCortes.length - 1],
      sortedCortes[0],
    ];
    const [primerCorte, ultimoCorte] = ultimosCortes;

    // Calcular diferencias entre cortes
    const diferenciasPorTorre = ultimoCorte.corteTorre.map((torreUltimo) => {
      const torrePenultimo = primerCorte.corteTorre.find(
        (t) => t.idTorre?.id === torreUltimo.idTorre?.id
      );
      // Calcular la diferencia de horas entre el último y penúltimo corte
      let horasEntreCortes = 0;
      if (ultimoCorte && primerCorte) {
        const fechaUltimo = new Date(ultimoCorte.fechaCorte);
        const fechaPenultimo = new Date(primerCorte.fechaCorte);
        horasEntreCortes =
          Math.abs(fechaUltimo.getTime() - fechaPenultimo.getTime()) / 36e5;
        horasEntreCortes = Number(horasEntreCortes.toFixed(2));
      }
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
            horasEntreCortes,
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

        console.log(datosMateriaPrimaTotal);
        console.log(datosActualizados);
        return {
          name: material.idProducto?.nombre || "Desconocido",
          idProducto: material.idProducto?.id || "",
          operational: material.estadoMaterial === "True",
          porcentaje: material.porcentaje || 0,
          porcentajeReal:
            datosActualizados?.diferenciaCantidad &&
            datosMateriaPrimaTotal?.diferenciaCantidad
              ? (datosActualizados.diferenciaCantidad /
                  (datosMateriaPrimaTotal.diferenciaCantidad || 1)) *
                100
              : 0,
          cantidad: datosActualizados?.diferenciaCantidad.toString() || "0",
          bblPerHour: 0,
          diferenciaCantidad:
            datosActualizados?.diferenciaCantidad.toString() || "0",
          cantidadMateriaPrima:
            datosMateriaPrimaTotal?.diferenciaCantidad.toString() || "0",
          horasEntreCortes:
            datosActualizados?.horasEntreCortes.toString() || "0",
        };
      });
    };

    setApiData({ sections: calcularSecciones() });
  }, [torre, diferenciasPorTorre]);

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

          <ModeladoBunkeringTuberiaMaterial
            x={TOWER_X + TOWER_WIDTH + 35}
            y={sectionY + sectionHeight / 2 + 80}
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
                textDecoration="underline"
              >
                {section.name || "Sección sin nombre"}
              </text>

              {/* Línea divisoria más visible */}
              <path d="M0 -3 L140 -3" stroke="#e0e0e0" strokeWidth="1" />

              {/* Contenedor de datos técnicos */}
              <g transform="translate(0, 10)" fontSize="14" fill="#4a4a4a">
                {/* Fila de rendimientos */}
                <g transform="translate(0, 0)">
                  <text font-weight="600">
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
                  <text font-weight="600">
                    <tspan fill="#6c757d" dx="2">
                      Real:{" "}
                    </tspan>
                    <tspan
                      // fill={isOperational ? "#28a745" : "#dc3545"}
                      fontWeight="700"
                    >
                      {section.porcentajeReal.toLocaleString() * -1} %
                    </tspan>
                  </text>
                </g>

                {/* Fila de cantidades */}
                <g transform="translate(0, 36)">
                  <text>
                    <tspan fill="#6c757d" font-weight="600" dx="2">
                      Cantidad:{" "}
                    </tspan>
                    <tspan fill="#1a1a1a" font-weight="600">
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

      <ModeladoBunkeringTorreSVG />

      <g fontSize="14" fill="black">
        <text x={135} y={495}>
          Diseño {torre?.capacidad?.toFixed(0) || "0.00"} bpd
        </text>
        <text x={135} y={515}>
          {apiData.sections[0]?.cantidadMateriaPrima * -1} Blb por{" "}
          {apiData.sections[0]?.horasEntreCortes}
          {" horas "}
        </text>
        <text x={195} y={515}></text>
      </g>

      {renderSections()}
    </svg>
  );
};

export default React.memo(ModeladoBunkeringTorre);
