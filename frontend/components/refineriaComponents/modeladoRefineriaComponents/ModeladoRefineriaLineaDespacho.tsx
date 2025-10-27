import { useCallback, useEffect, useState } from "react";
import {
  DefsLineaDespacho,
  GabarraCarga,
  GandolaDespacho,
  PocisionAbiertaDespacho,
  PocisionCerradaDespacho,
  TuberiaDespacho,
  ValvulaAbierda,
  ValvulaCerrada,
} from "./ElementosLineaCarga";
import { LineaDespacho, Despacho } from "@/libs/interfaces";
import ModeladoRefineriaDespachosList from "./ModeladoRefineriaDespachosList";
import { createPortal } from "react-dom";

interface ModeladoRefineriaLineaDespachoProps {
  lineaDespacho: LineaDespacho; // Ajusta el tipo según sea necesario
  despachos: Despacho[]; // Ajusta el tipo según sea necesario
}

const Tooltip = ({
  despacho,
  position,
}: {
  despacho: Despacho;
  position: { x: number; y: number };
}) => (
  <div
    style={{
      position: "fixed",
      left: position.x + 10, // Pequeño offset para no cubrir el cursor
      top: position.y + 10,
      // backgroundColor: "white",
      // padding: "8px",
      // border: "1px solid #ccc",
      // borderRadius: "4px",
      // boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 1000,
      pointerEvents: "none",
      minWidth: "200px",
      transform: "translate(-100%, -100%)", // Para que aparezca arriba del cursor
    }}
  >
    <div className="col-12">
      <ModeladoRefineriaDespachosList
        responsiveCols={false}
        despachos={[despacho]}
      />
    </div>
  </div>
);
const ModeladoRefineriaLineaDespacho = ({
  lineaDespacho,
  despachos,
}: ModeladoRefineriaLineaDespachoProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(
    null
  );
  const [animationKey, setAnimationKey] = useState(0);

  const hasAssociatedDespacho = despachos.some(
    (despacho) => despacho.idLineaDespacho?.id === lineaDespacho.id
    // &&
    //   despacho.estado === "true"
  );
  const tanqueRecetor = despachos.find(
    (despacho) =>
      despacho.idLineaDespacho?.id === lineaDespacho.id &&
      despacho.estadoDespacho === "EN_REFINERIA" &&
      (despacho.estadoCarga === "EN_PROCESO" ||
        despacho.estadoCarga === "PENDIENTE_MUESTREO" ||
        despacho.estadoCarga === "MUESTREO_APROBADO")
  );
  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [hasAssociatedDespacho]);

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
        id="eDfk30VHEwb1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="200"
        height="200"
        viewBox="0 0 200 200"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        project-id="be6fbb0f9bd74a698581b7dd144c3cc0"
        export-id="8bbb831ca7944f759f77e141ff4bfb70"
        // cached="false"
        // className="card m-0 p-0"
        // {...props}
      >
        <DefsLineaDespacho />
        {/* {lineaDespacho.ubicacion === "Carabobo 333" ? (
        <g transform="matrix(.590231 0 0 0.590231 27.439475 -100.975139)">
          <GabarraCarga />
        </g>
      ) : (
        <g id="eDfk30VHEwb6" transform="translate(170.493 163.57889)">
          <GandolaDespacho />
          <animateTransform
            attributeName="transform"
            type="translate"
            from="170.493 163.57889"
            to="0 20"
            dur="2s"
            fill="freeze"
          />
        </g>
      )} */}
        <text x="0" y="10" fill="black" fontSize="12" fontWeight="bold">
          {lineaDespacho.nombre}
        </text>
        <text x="0" y="25" fill="black" fontSize="12" fontWeight="bold">
          {tanqueRecetor?.idTanque?.nombre}
        </text>
        {hasAssociatedDespacho && (
          <g>
            {despachos
              .filter(
                (despacho: Despacho) =>
                  despacho.idLineaDespacho?.id === lineaDespacho.id
              )
              .map((despacho: any, index: number) => (
                <g
                  key={`${animationKey}-${index}`}
                  onMouseEnter={() => {
                    setSelectedDespacho(despacho);
                    setShowTooltip(true);
                  }}
                  onMouseLeave={() => {
                    setShowTooltip(false);
                    setSelectedDespacho(null);
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
                  <g id="eDfk30VHEwb6" transform="translate(170.493 163.57889)">
                    <GandolaDespacho />
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="170.493 163.57889"
                      to="0 20"
                      dur="2s"
                      fill="freeze"
                    />
                  </g>
                </g>
              ))}
          </g>
        )}
        <g transform="translate(-204.787843-3.102847)">
          <TuberiaDespacho />
        </g>

        {!hasAssociatedDespacho ? (
          // <g transform="matrix(.045615 0 0 0.045615-51.186032-48.938911)">
          //   {/* <PocisionCerradaDespacho /> */}
          //   <ValvulaCerrada />
          // </g>

          <g transform="translate(-50, -45) scale(0.8)">
            <ValvulaCerrada />
          </g>
        ) : (
          // <g transform="matrix(.045615 0 0 0.045615-51.18604-48.938999)">
          //   <PocisionAbiertaDespacho />
          // </g>
          <g transform="translate(-50, -45)scale(0.8) ">
            <ValvulaAbierda />
          </g>
        )}
        <script />
        {hasAssociatedDespacho ? (
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
      </svg>

      {showTooltip &&
        selectedDespacho &&
        createPortal(
          <Tooltip despacho={selectedDespacho} position={tooltipPosition} />,
          document.body
        )}
    </div>
  );
};
export default ModeladoRefineriaLineaDespacho;
