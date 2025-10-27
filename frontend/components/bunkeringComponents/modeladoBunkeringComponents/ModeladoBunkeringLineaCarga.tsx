import { useEffect, useState, useCallback } from "react";
import {
  Defs,
  GabarraCarga,
  GandolaCarga,
  PocisionAbierta,
  PocisionCerrada,
  Tuberia,
  ValvulaAbierda,
  ValvulaCerrada,
} from "./ElementosLineaCarga";
import { LineaRecepcionBK, RecepcionBK } from "@/libs/interfaces";
import ModeladoBunkeringRecepcionesList from "./ModeladoBunkeringRecepcionesList";

interface ModeladoBunkeringLineaCargaProps {
  lineaRecepcion: LineaRecepcionBK;
  recepcions: RecepcionBK[];
}

const Tooltip = ({
  recepcion,
  position,
}: {
  recepcion: RecepcionBK;
  position: { x: number; y: number };
}) => (
  <div
    style={{
      position: "fixed",
      left: position.x + 10, // Pequeño offset para no cubrir el cursor
      top: position.y + 10,
      backgroundColor: "white",
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 1000,
      pointerEvents: "none",
      minWidth: "200px",
      transform: "translate(0, -100%)", // Para que aparezca arriba del cursor
    }}
  >
    <ModeladoBunkeringRecepcionesList recepciones={[recepcion]} />
  </div>
);

const ModeladoBunkeringLineaCarga = ({
  lineaRecepcion,
  recepcions,
}: ModeladoBunkeringLineaCargaProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedRecepcion, setSelectedRecepcion] =
    useState<RecepcionBK | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const hasAssociatedRecepcion = recepcions.some(
    (recepcion) =>
      recepcion.idLinea?.id === lineaRecepcion.id &&
      recepcion.estadoRecepcion === "EN_REFINERIA" &&
      (recepcion.estadoCarga === "EN_PROCESO" ||
        recepcion.estadoCarga === "PENDIENTE_MUESTREO" ||
        recepcion.estadoCarga === "MUESTREO_APROBADO")
  );

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [hasAssociatedRecepcion]);

  const tanqueRecetor = recepcions.find(
    (recepcion) =>
      recepcion.idLinea?.id === lineaRecepcion.id &&
      recepcion.estadoRecepcion === "EN_REFINERIA" &&
      (recepcion.estadoCarga === "EN_PROCESO" ||
        recepcion.estadoCarga === "PENDIENTE_MUESTREO" ||
        recepcion.estadoCarga === "MUESTREO_APROBADO")
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGGElement, MouseEvent>) => {
      // Usar las coordenadas directas del mouse
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY,
      });
    },
    []
  );

  return (
    <div style={{ position: "relative" }}>
      <svg
        id="eYfEaAlRzTb1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="200"
        height="200"
        viewBox="0 0 200 200"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ position: "relative" }}
      >
        <Defs />
        <g transform="matrix(-1 0 0-1 390.484357 167.237367)">
          <Tuberia />
        </g>

        {hasAssociatedRecepcion && (
          <g>
            {recepcions
              .filter(
                (recepcion: RecepcionBK) =>
                  recepcion.idLinea?.id === lineaRecepcion.id &&
                  recepcion.estadoRecepcion === "EN_REFINERIA" &&
                  (recepcion.estadoCarga === "EN_PROCESO" ||
                    recepcion.estadoCarga === "PENDIENTE_MUESTREO" ||
                    recepcion.estadoCarga === "MUESTREO_APROBADO")
              )
              .map((recepcion: RecepcionBK, index: number) => (
                <g
                  key={`${animationKey}-${index}`}
                  onMouseEnter={() => {
                    setSelectedRecepcion(recepcion);
                    setShowTooltip(true);
                  }}
                  onMouseLeave={() => {
                    setShowTooltip(false);
                    setSelectedRecepcion(null);
                  }}
                  onMouseMove={handleMouseMove}
                >
                  {/* Area interactiva para el tooltip */}
                  <rect
                    x="0"
                    y="0"
                    width="200"
                    height="200"
                    fill="transparent"
                    stroke="none"
                  />

                  <g transform="matrix(-1 0 0 1 195.70719 21.492352)">
                    <GandolaCarga />
                  </g>

                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from="-170.493 163.57889"
                    to="0 0"
                    dur="2s"
                    fill="freeze"
                  />
                </g>
              ))}
          </g>
        )}

        <text x="0" y="10" fill="black" fontSize="12" fontWeight="bold">
          {lineaRecepcion.nombre}
        </text>
        <text x="160" y="150" fill="black" fontSize="12" fontWeight="bold">
          {tanqueRecetor?.idTanque?.nombre}
        </text>

        {hasAssociatedRecepcion ? (
          <circle cx="180" cy="20" r="10" fill="green">
            <animate
              attributeName="opacity"
              values="1;0;1"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        ) : (
          <circle cx="180" cy="20" r="10" fill="red">
            <animate
              attributeName="opacity"
              values="1;0;1"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {hasAssociatedRecepcion ? (
          // <g transform="matrix(-.045615 0 0-.045615 236.787253 212.815595)">
          //   <PocisionAbierta />
          // </g>
          <g transform="translate(110, 48)scale(0.8) ">
            <ValvulaAbierda />
          </g>
        ) : (
          // <g transform="matrix(-.045615 0 0-.045615 236.755662 212.77328)">
          //   <PocisionCerrada />
          // </g>
          <g transform="translate(110, 48) scale(0.8)">
            <ValvulaCerrada />
          </g>
        )}
      </svg>

      {showTooltip && selectedRecepcion && (
        <Tooltip recepcion={selectedRecepcion} position={tooltipPosition} />
      )}
    </div>
  );
};

export default ModeladoBunkeringLineaCarga;
