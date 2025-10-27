import React, { useState, useEffect } from "react";

import SummaryCards from "./SummaryCards";

import Header from "./Header";
import AbonosOverview from "./AbonosOverview";
import GastosResumen from "./GastosResumen";
import { useByRefineryData } from "@/hooks/useByRefineryData";
import { useRefineriaStore } from "@/store/refineriaStore";
import { AnalisisContratos } from "./AnalisisContratos";

const DashboardFinanzas = () => {
  const { activeRefineria } = useRefineriaStore();

  const {
    facturas = [],
    balances = [],
    cuentas = [],
    abonos = [],
    loading,
  } = useByRefineryData(activeRefineria?.id || "");
  console.log("cuentas", cuentas);
  // --- Meses disponibles y selección de mes global para abonos y facturas ---
  // Obtener meses únicos de abonos y facturas en formato YYYY-MM
  const mesesDisponibles = React.useMemo(() => {
    const set = new Set<string>();
    abonos.forEach((abono) => {
      if (
        abono.fecha &&
        typeof abono.fecha === "string" &&
        abono.fecha.length >= 7
      ) {
        // Extrae YYYY-MM directamente del string
        set.add(abono.fecha.slice(0, 7));
      }
    });
    facturas.forEach((factura) => {
      if (
        factura.fechaFactura &&
        typeof factura.fechaFactura === "string" &&
        factura.fechaFactura.length >= 7
      ) {
        set.add(factura.fechaFactura.slice(0, 7));
      }
    });
    cuentas.forEach((cuenta) => {
      if (
        cuenta.fechaCuenta &&
        typeof cuenta.fechaCuenta === "string" &&
        cuenta.fechaCuenta.length >= 7
      ) {
        set.add(cuenta.fechaCuenta.slice(0, 7));
      }
    });
    // Ordenar descendente (más reciente primero) usando comparación de fechas
    return Array.from(set).sort((a, b) => {
      // a y b son strings tipo 'YYYY-MM'
      const dateA = new Date(a + "-01");
      const dateB = new Date(b + "-01");
      return dateB.getTime() - dateA.getTime();
    });
  }, [abonos, facturas, cuentas]);

  // Estado para el mes seleccionado
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("");

  // Cuando cambian los abonos o los meses disponibles, setear el mes más reciente por defecto
  useEffect(() => {
    if (mesesDisponibles.length > 0) {
      setMesSeleccionado((prev) =>
        prev && mesesDisponibles.includes(prev) ? prev : mesesDisponibles[0]
      );
    }
  }, [mesesDisponibles]);

  // Handler para cambio de mes
  const handleMesChange = (mes: string) => {
    setMesSeleccionado(mes);
  };

  // Métricas financieras calculadas desde cuentas y abonos
  const financialMetrics = React.useMemo(() => {
    if (!mesSeleccionado) return undefined;

    // Obtener fin de mes seleccionado
    let endOfSelectedMonth: Date | null = null;
    if (mesSeleccionado.length === 7) {
      const [y, m] = mesSeleccionado.split("-");
      const year = parseInt(y, 10);
      const monthIndex = parseInt(m, 10) - 1; // 0-based
      endOfSelectedMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    }

    // Filtrar cuentas acumuladas hasta el fin del mes seleccionado (inclusive)
    const cuentasMes = cuentas.filter((c) => {
      if (!endOfSelectedMonth) return false;
      if (typeof c.fechaCuenta !== "string") return false;
      const fecha = new Date(c.fechaCuenta);
      return fecha <= endOfSelectedMonth; // acumulado hasta ese mes
    });

    // (Abonos ahora también acumulados hasta el fin del mes seleccionado)
    const abonosAcumulados = abonos.filter((a) => {
      if (!endOfSelectedMonth) return false;
      if (typeof a.fecha !== "string") return false;
      // Fecha puede venir como 'YYYY-MM-DD' o ISO; parse segura
      const fecha = new Date(a.fecha);
      if (isNaN(fecha.getTime())) return false;
      return fecha <= endOfSelectedMonth;
    });

    // Totales contratos (compras vs ventas) en el mes (monto de contratos asociados a las cuentas)
    let totalCompras = 0;
    let totalVentas = 0;
    // Para cálculos de costo / precio promedio por barril
    let cantidadComprada = 0;
    let costoCompras = 0;
    let cantidadVendida = 0;
    let montoVentasItems = 0;

    cuentasMes.forEach((cuenta) => {
      const tipoContrato = cuenta.idContrato?.tipoContrato; // 'Compra' | 'Venta'
      const montoContrato =
        cuenta.montoTotalContrato || cuenta.idContrato?.montoTotalContrato || 0;
      if (tipoContrato === "Compra") totalCompras += montoContrato;
      if (tipoContrato === "Venta") totalVentas += montoContrato;

      // Recorrer items para obtener cantidades y precios unitarios si existen
      cuenta.idContrato?.idItems?.forEach((item) => {
        const cantidad = item?.cantidad || 0;
        const precioUnitario = item?.precioUnitario || 0;
        if (tipoContrato === "Compra") {
          cantidadComprada += cantidad;
          costoCompras += cantidad * precioUnitario;
        } else if (tipoContrato === "Venta") {
          cantidadVendida += cantidad;
          montoVentasItems += cantidad * precioUnitario;
        }
      });
    });

    // Margen Bruto estimado (valor bruto en USD, sin escalar)
    const margenBruto = totalVentas - totalCompras; // USD

    // Costo de producción aproximado (USD por barril) usando promedio ponderado de compras
    const costoProduccion =
      cantidadComprada > 0 ? costoCompras / cantidadComprada : 0;

    // Precio de venta promedio (USD por barril) usando items de ventas
    const precioVentaPromedio =
      cantidadVendida > 0 ? montoVentasItems / cantidadVendida : 0;

    // Flujo de caja acumulado: Ingresos (abonos CxC) - Egresos (abonos CxP) hasta el mes seleccionado
    const ingresos = abonosAcumulados
      .filter((a) => a.tipoAbono === "Cuentas por Cobrar")
      .reduce((s, a) => s + (a.monto || 0), 0);
    const egresos = abonosAcumulados
      .filter((a) => a.tipoAbono === "Cuentas por Pagar")
      .reduce((s, a) => s + (a.monto || 0), 0);
    const flujoCaja = ingresos - egresos; // USD acumulado

    // Inventario crudo: si no hay dato directo, se puede aproximar: inventario anterior + compras - ventas.
    // Aquí sólo mostramos compras netas del mes como proxy (en miles de barriles si tu cantidad es en barriles)
    // Ajusta según tus unidades reales.
    const inventarioCrudo = cantidadComprada - cantidadVendida; // placeholder (puede ser negativo)

    // Determinar status simple según umbrales
    let status: "positive" | "warning" | "critical" = "positive";
    if (costoProduccion > precioVentaPromedio * 0.9)
      status = "critical"; // margen muy bajo
    else if (costoProduccion > precioVentaPromedio * 0.7) status = "warning";

    // Alertas básicas
    let alertMessage: string | undefined;
    if (status === "critical") {
      alertMessage = "Margen crítico: revisar costos de producción";
    } else if (status === "warning") {
      alertMessage = "Margen ajustado: monitorear costos";
    }

    return {
      marginBruto: Number.isFinite(margenBruto) ? Math.round(margenBruto) : 0,
      costoProduccion: Number.isFinite(costoProduccion)
        ? Number(costoProduccion.toFixed(2))
        : 0,
      precioVentaPromedio: Number.isFinite(precioVentaPromedio)
        ? Number(precioVentaPromedio.toFixed(2))
        : 0,
      flujoCaja: Number.isFinite(flujoCaja) ? Math.round(flujoCaja) : 0,
      inventarioCrudo: Number.isFinite(inventarioCrudo) ? inventarioCrudo : 0,
      status,
      lastUpdate: new Date().toISOString(),
      alertMessage,
    };
  }, [cuentas, abonos, mesSeleccionado]);

  return (
    <div className="grid">
      <div className="col-12">
        <Header
          financialMetrics={financialMetrics}
          mesSeleccionado={mesSeleccionado}
          mesesDisponibles={mesesDisponibles}
          onMesChange={handleMesChange}
        />
      </div>

      <div className="col-12">
        <SummaryCards cuentas={cuentas} mesSeleccionado={mesSeleccionado} />
      </div>

      <div className="col-12 lg:col-6">
        <AbonosOverview
          abonos={abonos}
          loading={loading}
          mesSeleccionado={mesSeleccionado}
        />
      </div>

      <div className="col-12  lg:col-6">
        <GastosResumen
          facturas={facturas}
          loading={loading}
          mesSeleccionado={mesSeleccionado}
        />
      </div>

      <div className="col-12 lg:col-8 ">
        <AnalisisContratos balances={balances} loading={loading} />
      </div>
      {/* 
      <div className="col-12 md:col-6 lg:col-6">
        <CustomerStories />
        <PotentialInfluencers />
      </div> */}
    </div>
  );
};

export default DashboardFinanzas;
