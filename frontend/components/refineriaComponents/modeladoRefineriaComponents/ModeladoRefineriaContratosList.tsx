// components/ContratosList.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { Tooltip } from "primereact/tooltip";
import { formatDateSinAnoFH } from "@/utils/dateUtils";
import { truncateText } from "@/utils/funcionesUtiles";
import { Contrato } from "@/libs/interfaces";
import { Carousel } from "primereact/carousel";

interface Producto {
  producto: { id: string; nombre: string; color: string };
  cantidad: number;
  cantidadRecibida: number;
  cantidadFaltante: number;
  porcentaje: number;
}
export interface ContratoConTotales extends Contrato {
  totalRecepciones?: number;
  totalRecepcionesCompletadas?: number;
}
interface ModeladoRefineriaContratosListProps {
  contratos: Array<ContratoConTotales & { productos: Producto[] }>;
  onShowDialog?: (product: Producto) => void;
}

const ModeladoRefineriaContratosList = ({
  contratos,
  onShowDialog,
}: ModeladoRefineriaContratosListProps) => {
  // Control de orientación en responsive
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal"
  );
  useEffect(() => {
    const handleResize = () =>
      setOrientation(window.innerWidth <= 460 ? "vertical" : "horizontal");
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Solo contratos de tipo Compra
  const compraContratos = contratos.filter(
    (contrato) => contrato.tipoContrato === "Compra"
  );

  // Renderiza cada card como item del carrusel
  const contratoTemplate = (contrato: Contrato & { productos: Producto[] }) => (
    <ContratoCard
      key={contrato.id}
      contrato={contrato}
      onShowDialog={onShowDialog}
    />
  );

  return (
    <div className="col-12">
      <Carousel
        value={compraContratos}
        itemTemplate={contratoTemplate}
        numVisible={4}
        numScroll={1}
        circular
        showIndicators
        showNavigators
        orientation={orientation}
        verticalViewPortHeight="200px"
        responsiveOptions={[
          { breakpoint: "1400px", numVisible: 2, numScroll: 1 },
          { breakpoint: "900px", numVisible: 1, numScroll: 1 },
        ]}
      />
    </div>
  );
};

// Nuevo componente para tarjeta de contrato
const ContratoCard = ({
  contrato,
  onShowDialog,
}: {
  contrato: ContratoConTotales & { productos: Producto[] };
  onShowDialog?: (product: Producto) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showExpand, setShowExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Altura máxima de la tarjeta (más pequeña)
  const CARD_MAX_HEIGHT = 220;

  useEffect(() => {
    if (contentRef.current) {
      setShowExpand(contentRef.current.scrollHeight > CARD_MAX_HEIGHT - 60);
    }
  }, [contrato]);

  return (
    <div className="col-12  p-1">
      <div
        className="h-full p-2 surface-card border-round shadow-2 flex flex-column"
        style={{
          maxHeight: expanded ? undefined : CARD_MAX_HEIGHT,
          minHeight: 180,
          overflow: "visible",
          transition: "max-height 0.3s",
          position: "relative",
          width: "100%",
          // minWidth: 280,
        }}
      >
        <div
          ref={contentRef}
          className={
            "flex flex-column gap-2" + (expanded ? "" : " overflow-auto")
          }
          style={{
            maxHeight: expanded ? undefined : CARD_MAX_HEIGHT - 60,
            overflowY: expanded ? "visible" : "auto",
            transition: "max-height 0.3s",
          }}
        >
          {/* Cabecera */}
          <div className="flex justify-content-between align-items-start">
            <div className="flex flex-column">
              <span className="text-lg font-bold white-space-normal">
                {expanded
                  ? contrato.descripcion.toLocaleUpperCase()
                  : truncateText(contrato.descripcion.toLocaleUpperCase(), 40)}
              </span>
              <span className="text-sm text-500 mt-1">
                {`(${contrato.idContacto.nombre})`}
              </span>
            </div>
            <div className="flex flex-column text-right">
              <span className="text-sm font-semibold">
                Nº: {contrato.numeroContrato}
              </span>
              <span className="text-xs text-green-500">
                Act-{formatDateSinAnoFH(contrato.updatedAt)}
              </span>
            </div>
          </div>

          <hr className="my-0" />

          {/* Fechas */}
          <div className="text-sm flex justify-content-between align-items-center">
            <div>
              <span className="font-medium">Inicio:</span>{" "}
              {formatDateSinAnoFH(contrato.fechaInicio)}
              {" - "}
              <span className="font-medium">Fin:</span>{" "}
              {formatDateSinAnoFH(contrato.fechaFin)}
            </div>
            <span
              className="ml-2 flex align-items-center text-primary"
              id={`recepciones-tooltip-${contrato.id}`}
              style={{ cursor: "pointer" }}
            >
              <i
                className="pi pi-truck mr-1"
                style={{ fontSize: "1.2rem" }}
              ></i>
              <span className="font-bold">
                {`${contrato.totalRecepcionesCompletadas ?? 0} / ${
                  contrato.totalRecepciones ?? 0
                } `}
              </span>
            </span>
            <Tooltip
              target={`#recepciones-tooltip-${contrato.id}`}
              content="Recepciones completadas / Recepciones totales"
              position="top"
            />
          </div>

          <hr className="my-0" />

          {/* Productos */}
          {contrato.productos.map((item) => (
            <div
              key={item.producto?.id}
              className="flex align-items-center gap-2"
            >
              <span className="font-bold min-w-8rem">
                {item.producto?.nombre}
              </span>
              <div className="flex-grow-1">
                <ProgressBar
                  value={item.porcentaje}
                  showValue={false}
                  style={{ minWidth: "10rem", height: "0.6rem" }}
                  color={`#${item.producto?.color}`}
                />
                <div className="flex justify-content-between text-xs mt-1">
                  <span>{item.cantidad.toLocaleString("de-DE")}Bbl</span>
                  <span className="text-green-800">
                    {item.cantidadRecibida.toLocaleString("de-DE")}Bbl
                  </span>
                  <span className="text-red-800">
                    {item.cantidadFaltante.toLocaleString("de-DE")}Bbl
                  </span>
                </div>
              </div>
              {onShowDialog && (
                <Button
                  icon="pi pi-search"
                  onClick={() => onShowDialog(item)}
                  className="p-button-sm p-button-text p-button-rounded"
                  tooltip="Mostrar todas las Recepciones"
                  tooltipOptions={{ position: "top" }}
                />
              )}
            </div>
          ))}
        </div>
        {/* Botón Mostrar Más/Menos solo si el contenido excede el alto máximo */}
        {showExpand && (
          <>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-button p-button-text p-button-sm p-0 border-circle bg-white shadow-1"
              style={{
                position: "absolute",
                bottom: -14, // la mitad del alto (28px/2)
                right: -14, // la mitad del ancho (28px/2)
                zIndex: 2,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
              aria-label={expanded ? "Mostrar menos" : "Mostrar más"}
              tabIndex={0}
              data-pr-tooltip={expanded ? "Mostrar menos" : "Mostrar más"}
              data-pr-position="left"
              id={`expand-btn-${contrato.id}`}
            >
              <i
                className={`pi pi-${expanded ? "chevron-up" : "chevron-down"}`}
              />
            </button>
            <Tooltip target={`#expand-btn-${contrato.id}`} />
          </>
        )}
      </div>
    </div>
  );
};

export default ModeladoRefineriaContratosList;
