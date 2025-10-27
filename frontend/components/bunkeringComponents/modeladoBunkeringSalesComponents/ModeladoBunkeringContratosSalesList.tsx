import React from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Contrato } from "@/libs/interfaces";
import { formatDateSinAnoFH } from "@/utils/dateUtils";
import ModeladoBunkeringContratosSalesCard from "./ModeladoBunkeringContratosSalesCard";

interface Producto {
  producto: { id: string; nombre: string; color: string };
  cantidad: number;
  formula: string;
  precioUnitario: number;
  total: number;
  precioTransporte: number;
  totalTransporte: number;
  brent: number;
  convenio: number;
}

interface ModeladoBunkeringContratosSalesListProps {
  contratos: Array<Contrato & { productos: Producto[] }>;
  tipo: string;
}

const ModeladoBunkeringContratosSalesList = ({
  contratos,
  tipo,
}: ModeladoBunkeringContratosSalesListProps) => {
  const totalCantidad = contratos.reduce(
    (acc, contrato) =>
      acc +
      contrato.productos.reduce((acc, item) => acc + (item.cantidad || 0), 0),
    0
  );
  const totalMontoTotal = contratos.reduce(
    (acc, contrato) =>
      acc +
      contrato.productos.reduce((acc, item) => acc + (item.total || 0), 0),
    0
  );
  const totalMontoTransporte = contratos.reduce(
    (acc, contrato) =>
      acc +
      contrato.productos.reduce(
        (acc, item) => acc + (item.totalTransporte || 0),
        0
      ),
    0
  );
  const totalMontoPorBarril = contratos.reduce(
    (acc, contrato) =>
      acc +
      contrato.productos.reduce(
        (acc, item) => acc + (item.precioUnitario || 0),
        0
      ),
    0
  );
  const totalMontoPorBarrilTransporte = contratos.reduce(
    (acc, contrato) =>
      acc +
      contrato.productos.reduce(
        (acc, item) => acc + (item.precioTransporte || 0),
        0
      ),
    0
  );
  const totalMontoPorBarrilTotal = contratos.reduce(
    (acc, contrato) =>
      acc +
      contrato.productos.reduce(
        (acc, item) =>
          acc + (item.precioUnitario || 0) + (item.precioTransporte || 0),
        0
      ),
    0
  );

  return (
    <MathJaxContext>
      <div className="col-12">
        <h1 className="text-2xl font-bold mb-3">Contratos {tipo}</h1>
        <div className="grid">
          {contratos
            .filter((contrato) => contrato.tipoContrato === tipo)
            .map((contrato) => (
              <div
                key={contrato.id}
                className="col-12 md:col-6 lg:col-4 xl:col-4 p-2"
              >
                <ModeladoBunkeringContratosSalesCard
                  contrato={contrato}
                  tipo={tipo}
                />
              </div>
            ))}
        </div>
      </div>
    </MathJaxContext>
  );
};

export default ModeladoBunkeringContratosSalesList;
