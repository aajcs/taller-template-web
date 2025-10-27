import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { analytics } from "./constants";
import { formatCurrency } from "@/utils/funcionesUtiles";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Tooltip } from "primereact/tooltip";
import NumberFlow from "@number-flow/react";

interface HeaderProps {
  operationalData?: {
    productionRate: string;
    efficiency: string;
    status: "normal" | "alert" | "critical";
    lastUpdate?: string;
    alertMessage?: string;
  };
  financialMetrics?: {
    marginBruto: number; // USD
    costoProduccion: number; // USD por barril
    precioVentaPromedio: number; // USD por barril
    flujoCaja: number; // USD
    inventarioCrudo: number; // barriles (o miles si así se maneja fuera)
    status: "positive" | "warning" | "critical";
    lastUpdate: string;
    alertMessage?: string;
  };
  mesSeleccionado: string;
  mesesDisponibles: string[];
  onMesChange: (mes: string) => void;
}

const Header = ({
  operationalData,
  financialMetrics,
  mesSeleccionado,
  mesesDisponibles,
  onMesChange,
}: HeaderProps) => {
  const formatAbbrev = (v: number) => {
    const nf = (val: number) =>
      new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    if (Math.abs(v) >= 1_000_000) return nf(v / 1_000_000) + " MM";
    if (Math.abs(v) >= 1_000) return nf(v / 1_000) + " K";
    return null;
  };
  return (
    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-3 gap-3">
      {/* Dropdown de mes global */}
      <div className="flex align-items-center gap-3 mb-3">
        <span className="font-medium">Mes:</span>
        <Dropdown
          value={mesSeleccionado}
          options={mesesDisponibles.map((mes) => {
            // mes es 'YYYY-MM'
            const [anio, mesNum] = mes.split("-");
            const mesesES = [
              "enero",
              "febrero",
              "marzo",
              "abril",
              "mayo",
              "junio",
              "julio",
              "agosto",
              "septiembre",
              "octubre",
              "noviembre",
              "diciembre",
            ];
            const label = `${mesesES[parseInt(mesNum, 10) - 1]} ${anio}`;
            return { label, value: mes };
          })}
          onChange={(e) => onMesChange(e.value)}
          placeholder="Seleccionar mes"
          className="w-10rem"
        />
      </div>
      {operationalData && (
        <div className="flex flex-column md:flex-row align-items-start md:align-items-center gap-3 w-full">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* KPI de Producción */}
            <div className="text-center p-3 border-round surface-card flex-1">
              <span className="text-2xl font-bold block text-primary">
                {operationalData.productionRate}
              </span>
              <span className="text-color-secondary">Producción (bbl/d)</span>
              {operationalData.lastUpdate && (
                <div className="text-xs mt-1 text-color-secondary">
                  <i className="pi pi-clock mr-1"></i>
                  {operationalData.lastUpdate}
                </div>
              )}
            </div>
            {/* KPI de Eficiencia */}
            <div className="text-center p-3 border-round surface-card flex-1">
              <span
                className={`text-2xl font-bold block ${
                  parseFloat(operationalData.efficiency) > 95
                    ? "text-green-500"
                    : parseFloat(operationalData.efficiency) > 90
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {operationalData.efficiency}%
              </span>
              <span className="text-color-secondary">Eficiencia</span>
            </div>
            {/* Estado Operacional */}
            <div className="flex align-items-center p-3 border-round surface-card flex-1">
              <div className="flex align-items-center">
                <i
                  className={`pi pi-circle-fill mr-3 text-xl ${
                    operationalData.status === "normal"
                      ? "text-green-500"
                      : operationalData.status === "alert"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                ></i>
                <div>
                  <div className="font-bold">Estado Operacional</div>
                  <div className="text-sm text-color-secondary capitalize">
                    {operationalData.status}
                  </div>
                  {operationalData.alertMessage &&
                    operationalData.status !== "normal" && (
                      <div className="text-xs mt-1 flex align-items-center">
                        <i className="pi pi-exclamation-circle mr-1"></i>
                        {operationalData.alertMessage}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {financialMetrics && (
        <div className="flex flex-column md:flex-row align-items-start md:align-items-center gap-3 w-full">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Margen Bruto */}
            <div className="text-center p-3 border-round surface-card flex-1">
              {formatAbbrev(financialMetrics.marginBruto) && (
                <Tooltip
                  target=".tt-margen"
                  content={`≈ ${formatAbbrev(financialMetrics.marginBruto)}`}
                  position="top"
                />
              )}
              <span
                className="text-2xl font-bold block text-primary tt-margen"
                data-pr-tooltip={`≈ ${
                  formatAbbrev(financialMetrics.marginBruto) || ""
                }`}
              >
                <NumberFlow
                  value={financialMetrics.marginBruto}
                  locales="de-DE"
                  format={{
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }}
                />
              </span>
              <span className="text-color-secondary block mt-1">
                Margen Bruto
              </span>
              <div className="mt-2">
                <Badge
                  value={financialMetrics.marginBruto >= 0 ? "+" : "-"}
                  severity={
                    financialMetrics.marginBruto >= 0 ? "success" : "danger"
                  }
                />
              </div>
              <div className="text-xs mt-1 text-color-secondary">
                Mes seleccionado
              </div>
            </div>
            {/* Costo de Producción */}
            <div className="text-center p-3 border-round surface-card flex-1">
              <span className="text-2xl font-bold block">
                <NumberFlow
                  locales="de-DE"
                  value={financialMetrics.costoProduccion}
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
              </span>
              <span className="text-color-secondary">Costo/Barril</span>
              <div className="mt-2">
                <i
                  className={`pi ${
                    financialMetrics.costoProduccion <
                    financialMetrics.precioVentaPromedio * 0.7
                      ? "pi-arrow-down text-green-500"
                      : financialMetrics.costoProduccion <
                        financialMetrics.precioVentaPromedio * 0.9
                      ? "pi-arrow-right text-yellow-500"
                      : "pi-arrow-up text-red-500"
                  }`}
                ></i>
              </div>
              <div className="text-xs mt-1 text-color-secondary">
                PV Prom:{" "}
                <NumberFlow
                  locales="de-DE"
                  value={financialMetrics.precioVentaPromedio}
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
              </div>
            </div>
            {/* Flujo de Caja */}
            <div className="text-center p-3 border-round surface-card flex-1">
              {formatAbbrev(financialMetrics.flujoCaja) && (
                <Tooltip
                  target=".tt-flujo"
                  content={`≈ ${formatAbbrev(financialMetrics.flujoCaja)}`}
                  position="top"
                />
              )}
              <span
                className="text-2xl font-bold block tt-flujo"
                data-pr-tooltip={`≈ ${
                  formatAbbrev(financialMetrics.flujoCaja) || ""
                }`}
              >
                <NumberFlow
                  locales="de-DE"
                  value={financialMetrics.flujoCaja}
                  format={{
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }}
                />
              </span>
              <span className="text-color-secondary block mt-1">
                Flujo de Caja
              </span>
              <div className="mt-2">
                <span
                  className={`font-medium ${
                    financialMetrics.flujoCaja >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {financialMetrics.flujoCaja >= 0 ? "Positivo" : "Negativo"}{" "}
                  este mes
                </span>
              </div>
            </div>
            {/* Inventario Crudo */}
            <div className="text-center p-3 border-round surface-card flex-1">
              {formatAbbrev(financialMetrics.inventarioCrudo) && (
                <Tooltip
                  target=".tt-inv"
                  content={`≈ ${formatAbbrev(
                    financialMetrics.inventarioCrudo
                  )}`}
                  position="top"
                />
              )}
              <span
                className="text-2xl font-bold block tt-inv"
                data-pr-tooltip={`≈ ${
                  formatAbbrev(financialMetrics.inventarioCrudo) || ""
                }`}
              >
                <NumberFlow
                  value={financialMetrics.inventarioCrudo}
                  format={{ maximumFractionDigits: 0 }}
                  locales="de-DE"
                />
                <span className="text-base ml-1">bbl</span>
              </span>
              <span className="text-color-secondary block mt-1">
                Inventario Crudo (aprox)
              </span>
              <div className="text-xs mt-1 text-color-secondary">
                Puede incluir barriles en proceso de refinación
              </div>
              <div className="flex justify-content-between mt-2">
                <small className="text-color-secondary">Var mensual</small>
                <small
                  className={`font-medium ${
                    financialMetrics.inventarioCrudo < 0
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {financialMetrics.inventarioCrudo < 0
                    ? "Salida neta"
                    : "Entrada neta"}
                </small>
              </div>
            </div>
            {/* Alertas */}
            {financialMetrics.alertMessage && (
              <div className="text-center p-3 border-round surface-card flex-1">
                <div
                  className={`flex align-items-center justify-content-center p-2 border-round ${
                    financialMetrics.status === "critical"
                      ? "bg-red-100"
                      : financialMetrics.status === "warning"
                      ? "bg-yellow-100"
                      : ""
                  }`}
                  style={{ cursor: "pointer" }}
                >
                  <i
                    className={`pi ${
                      financialMetrics.status === "critical"
                        ? "pi-exclamation-triangle text-red-500"
                        : financialMetrics.status === "warning"
                        ? "pi-exclamation-circle text-yellow-500"
                        : "pi-info-circle text-green-500"
                    } mr-3`}
                  ></i>
                  <span>{financialMetrics.alertMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
