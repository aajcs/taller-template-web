// /components/dashboard/AnalisisContratos.tsx

import React, { useState, useMemo, useEffect } from "react";
import ReactSpeedometer from "react-d3-speedometer";
import { Tooltip } from "primereact/tooltip";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Balance, Contrato } from "@/libs/interfaces"; // Asegúrate que la ruta sea correcta

interface AnalisisContratosProps {
  balances: Balance[];
  loading: boolean;
}

export const AnalisisContratos: React.FC<AnalisisContratosProps> = ({
  balances,
  loading,
}) => {
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);

  // Seleccionar el último balance por defecto
  useEffect(() => {
    if (balances && balances.length > 0 && !selectedBalance) {
      setSelectedBalance(balances[balances.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances]);

  // --- Funciones de formato y utilidad ---
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("es-VE").format(value);

  const getSeverityForEstado = (estado: string) => {
    // ... (sin cambios)
    switch (estado.toLowerCase()) {
      case "activo":
        return "success";
      case "pendiente":
        return "warning";
      case "finalizado":
        return "info";
      case "cancelado":
        return "danger";
      default:
        return undefined;
    }
  };

  // --- Opciones para el Dropdown ---
  const balanceOptions = useMemo(() => {
    if (!balances) return [];
    return balances.map((balance) => ({
      label: `Balance #${balance.numeroBalance} (${formatDate(
        balance.fechaInicio
      )} - ${formatDate(balance.fechaFin)})`,
      value: balance,
    }));
  }, [balances]);

  // --- Cálculos para el análisis ---
  const analisisData = useMemo(() => {
    if (!selectedBalance) return null;

    // 1. Cálculos de costo por barril
    const costoPorBarrilCompra =
      selectedBalance.totalBarrilesCompra > 0
        ? selectedBalance.totalCompras / selectedBalance.totalBarrilesCompra
        : 0;
    const precioPorBarrilVenta =
      selectedBalance.totalBarrilesVenta > 0
        ? selectedBalance.totalVentas / selectedBalance.totalBarrilesVenta
        : 0;
    const porcentajeVenta =
      selectedBalance.totalBarrilesCompra > 0
        ? (selectedBalance.totalBarrilesVenta /
            selectedBalance.totalBarrilesCompra) *
          100
        : 0;

    // 2. Resumen de barriles vendidos por producto
    const resumenVentas: { [key: string]: number } = {};
    selectedBalance.contratosVentas.forEach((contrato) => {
      contrato.idItems.forEach((item) => {
        const nombreProducto = item.producto.nombre;
        resumenVentas[nombreProducto] =
          (resumenVentas[nombreProducto] || 0) + (item.cantidad ?? 0);
      });
    });

    const barrilesVendidosPorProducto = Object.keys(resumenVentas).map(
      (producto) => ({
        producto,
        totalVendido: resumenVentas[producto],
      })
    );

    return {
      costoPorBarrilCompra,
      precioPorBarrilVenta,
      porcentajeVenta,
      barrilesVendidosPorProducto,
    };
  }, [selectedBalance]);

  // --- Templates para componentes PrimeReact ---
  const accordionHeaderTemplate = (contrato: Contrato) => (
    <div className="flex align-items-center justify-content-between w-full">
      <div className="flex align-items-center">
        <span className="font-bold mr-4">{`Contrato: ${contrato.numeroContrato}`}</span>
        <span className="hidden md:block">{contrato.descripcion}</span>
      </div>
      <div className="flex align-items-center">
        <span className="font-bold text-lg mr-4">
          {formatCurrency(contrato.montoTotal ?? 0)}
        </span>
        <Tag
          value={contrato.estadoContrato}
          severity={getSeverityForEstado(contrato.estadoContrato)}
        />
      </div>
    </div>
  );

  return (
    <div className="card h-full">
      <div className="grid align-items-center mb-1">
        <div className="col-12 md:col-6">
          <h5 className="m-0">Análisis de Contratos: Compra vs. Venta</h5>
        </div>
        <div className="col-12 md:col-6">
          <div className="p-fluid">
            {/* Selector de Balance */}
            <div className="field m-0">
              <label htmlFor="balance-selector">
                Seleccione un Período de Balance
              </label>
              <Dropdown
                id="balance-selector"
                value={selectedBalance}
                options={balanceOptions}
                onChange={(e) => setSelectedBalance(e.value)}
                placeholder="Elige un balance para analizar"
                className="w-full md:w-20rem"
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Renderizado condicional del análisis --- */}
      {selectedBalance && analisisData && !loading && (
        <div className="mt-4 grid">
          {/* 1. Resumen Financiero */}
          <div className="grid text-center col-12">
            <div className="col-12 md:col-4 lg:col-4 xl:col-4">
              <div className="card h-full shadow-1 bg-blue-50 border-none">
                <div className="p-1">
                  <div className="flex align-items-center mb-2">
                    <span
                      className="mr-2"
                      style={{
                        width: "6px",
                        height: "18px",
                        borderRadius: "4px",
                        backgroundColor: "#60a5fa",
                      }}
                    />
                    <span className="uppercase tracking-wider text-xs text-blue-700 font-semibold">
                      Compras
                    </span>
                  </div>
                  <div className="flex align-items-center justify-content-between">
                    <div className="flex flex-column align-items-start">
                      <span className="text-2xl text-blue-900 font-bold">
                        {formatCurrency(selectedBalance.totalCompras)}
                      </span>
                      <span className="text-xs text-blue-800 mt-1">
                        Total del período
                      </span>
                    </div>
                    <span
                      className="inline-flex align-items-center justify-content-center bg-blue-100 text-blue-700 border-circle"
                      style={{ width: "3rem", height: "3rem" }}
                      aria-hidden
                    >
                      <i className="pi pi-shopping-cart text-xl"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 md:col-4 lg:col-4 xl:col-4">
              <div className="card h-full shadow-1 bg-teal-50 border-none">
                <div className="p-1">
                  <div className="flex align-items-center mb-2">
                    <span
                      className="mr-2"
                      style={{
                        width: "6px",
                        height: "18px",
                        borderRadius: "4px",
                        backgroundColor: "#2dd4bf",
                      }}
                    />
                    <span className="uppercase tracking-wider text-xs text-teal-700 font-semibold">
                      Ventas
                    </span>
                  </div>
                  <div className="flex align-items-center justify-content-between">
                    <div className="flex flex-column align-items-start">
                      <span className="text-2xl text-teal-900 font-bold">
                        {formatCurrency(selectedBalance.totalVentas)}
                      </span>
                      <span className="text-xs text-teal-800 mt-1">
                        Total del período
                      </span>
                    </div>
                    <span
                      className="inline-flex align-items-center justify-content-center bg-teal-100 text-teal-700 border-circle"
                      style={{ width: "3rem", height: "3rem" }}
                      aria-hidden
                    >
                      <i className="pi pi-shopping-bag text-xl"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 md:col-4 lg:col-4 xl:col-4">
              <div
                className={`card h-full shadow-1 border-none ${
                  selectedBalance.ganancia > 0 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="p-1">
                  <div className="flex align-items-center mb-2">
                    <span
                      className="mr-2"
                      style={{
                        width: "6px",
                        height: "18px",
                        borderRadius: "4px",
                        backgroundColor:
                          selectedBalance.ganancia > 0 ? "#34d399" : "#f87171",
                      }}
                    />
                    <span
                      className={`uppercase tracking-wider text-xs font-semibold ${
                        selectedBalance.ganancia > 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      Resultado del Período
                    </span>
                  </div>
                  <div className="flex align-items-center justify-content-between">
                    <div className="flex flex-column align-items-start">
                      <span
                        className={`text-2xl font-bold ${
                          selectedBalance.ganancia > 0
                            ? "text-green-900"
                            : "text-red-900"
                        }`}
                      >
                        {selectedBalance.ganancia > 0
                          ? formatCurrency(selectedBalance.ganancia)
                          : formatCurrency(selectedBalance.perdida)}
                      </span>
                      <span
                        className={`text-xs mt-1 ${
                          selectedBalance.ganancia > 0
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {selectedBalance.ganancia > 0 ? "Ganancia" : "Pérdida"}
                      </span>
                    </div>
                    <span
                      className={`inline-flex align-items-center justify-content-center border-circle ${
                        selectedBalance.ganancia > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                      style={{ width: "3rem", height: "3rem" }}
                      aria-hidden
                    >
                      <i
                        className={`pi text-xl ${
                          selectedBalance.ganancia > 0
                            ? "pi-arrow-up-right"
                            : "pi-arrow-down-right"
                        }`}
                      ></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Análisis Volumétrico y de Costos 📊 */}
          <div className="col-12 md:col-6 lg:col-6 xl:col-6">
            <div
              title="Análisis Volumétrico y de Costos por Barril"
              className="mt-4 h-full"
            >
              <div className="grid text-center">
                <div className="col-6 md:col-3 lg:col-3 xl:col-3">
                  <p className="text-xl font-semibold m-0" id="tt-bbls-comp">
                    {formatNumber(selectedBalance.totalBarrilesCompra)}
                  </p>
                  <p className="text-sm text-600 m-0">Bbls Comprados</p>
                  <Tooltip
                    target="#tt-bbls-comp"
                    content="Total de barriles adquiridos en el período."
                  />
                </div>
                <div className="col-6 md:col-3 lg:col-3 xl:col-3">
                  <p className="text-xl font-semibold m-0" id="tt-bbls-vend">
                    {formatNumber(selectedBalance.totalBarrilesVenta)}
                  </p>
                  <p className="text-sm text-600 m-0">Bbls Vendidos</p>
                  <Tooltip
                    target="#tt-bbls-vend"
                    content="Total de barriles vendidos en el período."
                  />
                </div>
                <div className="col-6 md:col-3 lg:col-3 xl:col-3">
                  <p
                    className="text-xl font-semibold m-0 text-blue-500"
                    id="tt-costo-bbl"
                  >
                    {formatCurrency(analisisData.costoPorBarrilCompra)}
                  </p>
                  <p className="text-sm text-600 m-0">Costo Prom./Bbl</p>
                  <Tooltip
                    target="#tt-costo-bbl"
                    content="Costo promedio por barril comprado."
                  />
                </div>
                <div className="col-6 md:col-3 lg:col-3 xl:col-3">
                  <p
                    className="text-xl font-semibold m-0 text-teal-500"
                    id="tt-precio-bbl"
                  >
                    {formatCurrency(analisisData.precioPorBarrilVenta)}
                  </p>
                  <p className="text-sm text-600 m-0">Precio Prom./Bbl</p>
                  <Tooltip
                    target="#tt-precio-bbl"
                    content="Precio promedio por barril vendido."
                  />
                </div>
              </div>

              {/* Porcentaje de barriles vendidos vs. comprados */}
              <div className="mt-3">
                <div className="flex flex-column align-items-center">
                  <span className="font-medium">
                    % Barriles Vendidos vs. Comprados
                  </span>
                  <div className="w-full md:w-20rem mt-2">
                    <div
                      className="progress-bar-container"
                      style={{
                        background: "#e0e0e0",
                        borderRadius: "8px",
                        height: "18px",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: `${analisisData.porcentajeVenta.toFixed(2)}%`,
                          background:
                            analisisData.porcentajeVenta >= 100
                              ? "#10b981"
                              : analisisData.porcentajeVenta >= 80
                              ? "#f59e42"
                              : "#ef4444",
                          height: "100%",
                          borderRadius: "8px",
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                    <span className="block mt-1 text-sm font-semibold">
                      {analisisData.porcentajeVenta.toFixed(2)}% vendidos
                    </span>
                  </div>
                </div>
              </div>

              {/* Margen promedio por barril */}
              <div className="mt-3 flex flex-column align-items-center">
                <span className="font-medium mb-2">
                  Margen Promedio por Barril
                </span>
                <ReactSpeedometer
                  value={
                    analisisData.costoPorBarrilCompra > 0
                      ? (analisisData.precioPorBarrilVenta -
                          analisisData.costoPorBarrilCompra) /
                        analisisData.costoPorBarrilCompra
                      : 0
                  }
                  minValue={-0.3}
                  maxValue={0.3}
                  segments={4}
                  width={220}
                  height={160}
                  valueFormat={"+.0%"}
                  valueTextFontSize={"20px"}
                  needleColor="#374151"
                  segmentColors={["#ef4444", "#f59e42", "#10b981", "#22d3ee"]}
                  currentValueText={
                    analisisData.costoPorBarrilCompra > 0
                      ? `${(
                          ((analisisData.precioPorBarrilVenta -
                            analisisData.costoPorBarrilCompra) /
                            analisisData.costoPorBarrilCompra) *
                          100
                        ).toFixed(1)}%`
                      : "0%"
                  }
                />
                <span className="mt-0 text-sm text-600">
                  {formatCurrency(
                    analisisData.precioPorBarrilVenta -
                      analisisData.costoPorBarrilCompra
                  )}{" "}
                  por barril
                </span>
              </div>
            </div>
          </div>

          {/* 3. Resumen de Barriles Vendidos por Producto ⛽ */}
          <div className="col-12 md:col-6 lg:col-6 xl:col-6">
            <Card
              title="Resumen de Barriles Vendidos por Producto"
              className="mt-4 h-full"
            >
              <div className="grid">
                <div className="col-12">
                  <DataTable
                    value={analisisData.barrilesVendidosPorProducto}
                    responsiveLayout="scroll"
                    size="small"
                  >
                    <Column
                      field="producto"
                      header="Producto"
                      style={{ width: "25%" }}
                    ></Column>
                    <Column
                      field="totalVendido"
                      header="Total Barriles Vendidos"
                      body={(rowData) => formatNumber(rowData.totalVendido)}
                      style={{ width: "15%" }}
                    ></Column>
                    <Column
                      header="Precio de Venta (Total)"
                      body={(rowData) => {
                        // Total de venta por producto
                        if (!selectedBalance) return "-";
                        let totalVenta = 0;
                        selectedBalance.contratosVentas.forEach((contrato) => {
                          contrato.idItems.forEach((item) => {
                            if (item.producto.nombre === rowData.producto) {
                              totalVenta += item.precioUnitario
                                ? item.precioUnitario * (item.cantidad ?? 0)
                                : 0;
                            }
                          });
                        });
                        return totalVenta > 0
                          ? formatCurrency(totalVenta)
                          : "-";
                      }}
                      style={{ width: "15%" }}
                    ></Column>
                    <Column
                      header="Costo por Barril (Promedio)"
                      body={(rowData) => {
                        // Costo promedio por barril = totalVenta / totalVendido
                        if (!selectedBalance) return "-";
                        let totalVenta = 0;
                        let totalVendido = rowData.totalVendido;
                        selectedBalance.contratosVentas.forEach((contrato) => {
                          contrato.idItems.forEach((item) => {
                            if (item.producto.nombre === rowData.producto) {
                              totalVenta += item.precioUnitario
                                ? item.precioUnitario * (item.cantidad ?? 0)
                                : 0;
                            }
                          });
                        });
                        return totalVendido > 0
                          ? formatCurrency(totalVenta / totalVendido)
                          : "-";
                      }}
                      style={{ width: "15%" }}
                    ></Column>
                    <Column
                      header="Rendimiento (%)"
                      body={(rowData) =>
                        selectedBalance &&
                        selectedBalance.totalBarrilesCompra > 0
                          ? `${(
                              (rowData.totalVendido /
                                selectedBalance.totalBarrilesCompra) *
                              100
                            ).toFixed(1)}%`
                          : "-"
                      }
                      style={{ width: "15%" }}
                    ></Column>
                  </DataTable>
                </div>
              </div>
            </Card>
          </div>

          {/* 4. Contratos de Compra en Acordeón */}
          <div className="col-12 md:col-6 lg:col-6 xl:col-6">
            <Card
              title="Detalle de Contratos de Compra"
              className="mt-4 h-full"
            >
              <Accordion>
                {selectedBalance.contratosCompras.map((contrato) => (
                  <AccordionTab
                    key={contrato._id}
                    headerTemplate={() => accordionHeaderTemplate(contrato)}
                  >
                    <DataTable
                      value={contrato.idItems}
                      responsiveLayout="scroll"
                      size="small"
                    >
                      <Column
                        field="producto.nombre"
                        header="Producto"
                      ></Column>
                      <Column
                        field="cantidad"
                        header="Cantidad (Bbls)"
                        body={(rowData) => formatNumber(rowData.cantidad)}
                      ></Column>
                    </DataTable>
                  </AccordionTab>
                ))}
              </Accordion>
            </Card>
          </div>

          {/* 5. Contratos de Venta en Acordeón */}
          <div className="col-12 md:col-6 lg:col-6 xl:col-6">
            <Card title="Detalle de Contratos de Venta" className="mt-4 h-full">
              <Accordion>
                {selectedBalance.contratosVentas.map((contrato) => (
                  <AccordionTab
                    key={contrato._id}
                    headerTemplate={() => accordionHeaderTemplate(contrato)}
                  >
                    <DataTable
                      value={contrato.idItems}
                      responsiveLayout="scroll"
                      size="small"
                    >
                      <Column
                        field="producto.nombre"
                        header="Producto"
                      ></Column>
                      <Column
                        field="cantidad"
                        header="Cantidad (Bbls)"
                        body={(rowData) => formatNumber(rowData.cantidad)}
                      ></Column>
                    </DataTable>
                  </AccordionTab>
                ))}
              </Accordion>
            </Card>
          </div>
        </div>
      )}

      {loading && <p className="text-center mt-4">Cargando datos...</p>}
    </div>
  );
};
