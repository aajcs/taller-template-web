import React, { useMemo } from "react";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { Tooltip } from "primereact/tooltip";
import { Chart } from "primereact/chart";
import { classNames } from "primereact/utils";
import { Cuenta } from "@/libs/interfaces";
import NumberFlow from "@number-flow/react";

interface FinancialCard {
  icon: string;
  color: string;
  title: string;
  currentValue: number;
  comparison: {
    value: number;
    percentage: number;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  format: "currency" | "number";
  tooltip?: string;
  trendData?: number[];
}
interface SummaryCardsProps {
  cuentas: Cuenta[]; // Adjust type as needed
  mesSeleccionado?: string; // formato YYYY-MM
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  cuentas,
  mesSeleccionado,
}) => {
  // Función para obtener el rango de fechas basado en mesSeleccionado (fin de mes seleccionado y fin de mes anterior)
  const getDateRanges = () => {
    if (mesSeleccionado && mesSeleccionado.length === 7) {
      const [yearStr, monthStr] = mesSeleccionado.split("-");
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1; // 0-based

      // Fin del mes seleccionado (último día del mes a las 23:59:59.999)
      const currentMonthEnd = new Date(
        year,
        monthIndex + 1,
        0,
        23,
        59,
        59,
        999
      );
      // Fin del mes anterior
      const previousMonthEnd = new Date(year, monthIndex, 0, 23, 59, 59, 999);
      return { currentMonthEnd, previousMonthEnd };
    }
    // Fallback al comportamiento original (mes actual vs mes anterior relativo a hoy)
    const now = new Date();
    const currentMonthEnd = now;
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );
    return { currentMonthEnd, previousMonthEnd };
  };

  // Obtener rangos de fechas
  const { currentMonthEnd, previousMonthEnd } = getDateRanges();

  // Calcular totales acumulados hasta cada fecha
  const {
    totalPorPagarCurrent,
    totalPorPagarPrevious,
    totalPorCobrarCurrent,
    totalPorCobrarPrevious,
    totalComprasCurrent,
    totalComprasPrevious,
    totalVentasCurrent,
    totalVentasPrevious,
  } = useMemo(() => {
    // Inicializar variables
    let tpc = 0,
      tpp = 0,
      tcc = 0,
      tcp = 0,
      coc = 0,
      cop = 0,
      voc = 0,
      vop = 0;

    cuentas.forEach((cuenta) => {
      const cuentaDate = new Date(cuenta.fechaCuenta);

      // Acumulado hasta el mes actual (incluye hoy)
      if (cuentaDate <= currentMonthEnd) {
        if (cuenta.tipoCuenta === "Cuentas por Pagar")
          tpc += cuenta.balancePendiente;
        if (cuenta.tipoCuenta === "Cuentas por Cobrar")
          tcc += cuenta.balancePendiente;
        if (cuenta.idContrato.tipoContrato === "Compra")
          coc += cuenta.montoTotalContrato;
        if (cuenta.idContrato.tipoContrato === "Venta")
          voc += cuenta.montoTotalContrato;
      }

      // Acumulado hasta el mes anterior (hasta el último día del mes pasado)
      if (cuentaDate <= previousMonthEnd) {
        if (cuenta.tipoCuenta === "Cuentas por Pagar")
          tpp += cuenta.balancePendiente;
        if (cuenta.tipoCuenta === "Cuentas por Cobrar")
          tcp += cuenta.balancePendiente;
        if (cuenta.idContrato.tipoContrato === "Compra")
          cop += cuenta.montoTotalContrato;
        if (cuenta.idContrato.tipoContrato === "Venta")
          vop += cuenta.montoTotalContrato;
      }
    });

    return {
      totalPorPagarCurrent: tpc,
      totalPorPagarPrevious: tpp,
      totalPorCobrarCurrent: tcc,
      totalPorCobrarPrevious: tcp,
      totalComprasCurrent: coc,
      totalComprasPrevious: cop,
      totalVentasCurrent: voc,
      totalVentasPrevious: vop,
    };
  }, [cuentas, mesSeleccionado]);

  // Función para calcular el crecimiento
  const calcularCrecimiento = (
    actual: number,
    anterior: number
  ): {
    value: number;
    percentage: number;
    trend: "up" | "down" | "neutral";
    period: string;
  } => {
    if (anterior === 0)
      return {
        value: 0,
        percentage: 0,
        trend: "neutral",
        period: "mes anterior",
      };

    const diferencia = actual - anterior;
    const porcentaje = Math.round((Math.abs(diferencia) / anterior) * 100);

    return {
      value: anterior,
      percentage: porcentaje,
      trend: diferencia > 0 ? "up" : diferencia < 0 ? "down" : "neutral",
      period: "mes anterior",
    };
  };

  // Generar datos de tendencia
  const generarTrendData = (actual: number, anterior: number) => {
    // Crear 4 puntos que muestren la progresión
    return [
      anterior * 0.75, // Hace 3 meses
      anterior, // Mes anterior
      (anterior + actual) / 2, // Promedio
      actual, // Mes actual
    ];
  };

  // Configurar las tarjetas
  const cards: FinancialCard[] = [
    {
      icon: "pi pi-credit-card",
      color: "#2563eb",
      title: "Cuentas por Pagar",
      currentValue: totalPorPagarCurrent,
      comparison: {
        ...calcularCrecimiento(totalPorPagarCurrent, totalPorPagarPrevious),
        period: "mes anterior",
      },
      format: "currency",
      tooltip: "Obligaciones pendientes con proveedores de crudo y servicios",
      trendData: generarTrendData(totalPorPagarCurrent, totalPorPagarPrevious),
    },
    {
      icon: "pi pi-wallet",
      color: "green",
      title: "Cuentas por Cobrar",
      currentValue: totalPorCobrarCurrent,
      comparison: {
        ...calcularCrecimiento(totalPorCobrarCurrent, totalPorCobrarPrevious),
        period: "mes anterior",
      },
      format: "currency",
      tooltip: "Facturas pendientes de pago por clientes y distribuidores",
      trendData: generarTrendData(
        totalPorCobrarCurrent,
        totalPorCobrarPrevious
      ),
    },
    {
      icon: "pi pi-shopping-cart",
      color: "orange",
      title: "Compras Crudo",
      currentValue: totalComprasCurrent,
      comparison: {
        ...calcularCrecimiento(totalComprasCurrent, totalComprasPrevious),
        period: "mes anterior",
      },
      format: "currency",
      tooltip: "Inversión total en adquisición de crudo y materias primas",
      trendData: generarTrendData(totalComprasCurrent, totalComprasPrevious),
    },
    {
      icon: "pi pi-chart-line",
      color: "purple",
      title: "Ventas Derivados",
      currentValue: totalVentasCurrent,
      comparison: {
        ...calcularCrecimiento(totalVentasCurrent, totalVentasPrevious),
        period: "mes anterior",
      },
      format: "currency",
      tooltip: "Ingresos por venta de productos refinados y derivados",
      trendData: generarTrendData(totalVentasCurrent, totalVentasPrevious),
    },
  ];

  const formatValue = (value: number, type: "currency" | "number") => {
    if (type === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: value < 1000000 ? 2 : 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getTrendChart = (data: number[] = [], color: string) => {
    const chartData = {
      labels: Array(data.length).fill(""),
      datasets: [
        {
          data: data,
          fill: true,
          borderColor: `var(--${color}-500)`,
          backgroundColor: `var(--${color}-100)`,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    };

    const chartOptions = {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
          min: Math.min(...data) * 0.95,
          max: Math.max(...data) * 1.05,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    return { data: chartData, options: chartOptions };
  };

  return (
    <div className="card p-0 grid grid-nogutter">
      {/* <pre>{JSON.stringify(cuentas, null, 2)}</pre> */}
      {cards.map((card, index) => {
        const chartConfig = getTrendChart(card.trendData, card.color);
        const tooltipId = `tooltip-${index}`;

        return (
          <div
            key={index}
            className={`col-12 md:col-6 lg:col-3 py-5 px-6 border-none ${
              index < 3 ? "md:border-right-1 surface-border" : ""
            }`}
          >
            {/* Tooltip */}
            <Tooltip
              // id={tooltipId}
              target={`.tooltip-target-${index}`}
              content={card.tooltip}
              position="top"
              className="text-xs max-w-10rem"
            />

            {/* Encabezado con tooltip */}
            <div
              className={`flex align-items-center mb-3 cursor-help tooltip-target-${index}`}
              data-pr-tooltip={card.tooltip}
              data-pr-position="top"
              data-pr-at="center top-4"
              data-pr-id={tooltipId}
            >
              <Avatar
                icon={card.icon}
                size="large"
                shape="circle"
                className={`text-base bg-${card.color}-100 text-${card.color}-700`}
              />
              <span className="text-xl ml-2">{card.title}</span>
              <i className="pi pi-info-circle ml-2 text-sm text-color-secondary"></i>
            </div>

            {/* Valor principal */}
            <div className="flex align-items-center justify-content-between mb-3">
              <span className="block font-bold text-4xl mb-3">
                <NumberFlow
                  value={card.currentValue}
                  locales="es-ES"
                  format={
                    card.format === "currency"
                      ? { currency: "USD", style: "currency" }
                      : undefined
                  }
                />
                {card.currentValue >= 1000000 && (
                  <span className="text-sm ml-1">USD</span>
                )}
              </span>
              <Badge
                value={
                  <NumberFlow
                    value={card.comparison.percentage}
                    suffix="%"
                    locales="es-ES"
                  />
                }
                severity={
                  card.comparison.trend === "up"
                    ? card.title.includes("Pagar") ||
                      card.title.includes("Compras")
                      ? "danger"
                      : "success"
                    : card.comparison.trend === "down"
                    ? card.title.includes("Cobrar")
                      ? "danger"
                      : "success"
                    : "info"
                }
                className="mr-2"
              />
            </div>

            {/* Comparación */}
            <div className="flex justify-content-between text-sm text-color-secondary">
              <span>vs {card.comparison.period}:</span>
              <span
                className={classNames("font-medium", {
                  "text-green-500":
                    card.comparison.trend === "up" &&
                    !card.title.includes("Pagar") &&
                    !card.title.includes("Compras"),
                  "text-red-500":
                    card.comparison.trend === "up" &&
                    (card.title.includes("Pagar") ||
                      card.title.includes("Compras")),
                  "text-blue-500":
                    card.comparison.trend === "down" &&
                    card.title.includes("Cobrar"),
                  "text-orange-500": card.comparison.trend === "neutral",
                })}
              >
                <NumberFlow
                  // className="number"
                  value={card.comparison.value}
                  locales="es-ES"
                  format={{ currency: "USD", style: "currency" }}
                />
                {/* {formatValue(card.comparison.value, card.format)} */}
                <i
                  className={classNames("ml-2", {
                    "pi pi-arrow-up": card.comparison.trend === "up",
                    "pi pi-arrow-down": card.comparison.trend === "down",
                    "pi pi-minus": card.comparison.trend === "neutral",
                  })}
                ></i>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
