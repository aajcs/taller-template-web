import React, { useState, useEffect } from "react";
import { Chart } from "primereact/chart";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { classNames } from "primereact/utils";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";

import { Factura, Partida } from "@/libs/interfaces";
import { Dialog } from "primereact/dialog";

// Extiende la interface Partida para agregar los campos usados en partidasMap
export interface PartidaResumen extends Partida {
  total: number;
  porcentaje: number;
  color: string;
}

interface GastosResumenProps {
  facturas: Factura[] | null;
  loading: boolean;
  mesSeleccionado: string;
}

const GastosResumen: React.FC<GastosResumenProps> = ({
  facturas,
  loading,
  mesSeleccionado,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [partidas, setPartidas] = useState<PartidaResumen[]>([]);
  // Para guardar los totales de cada partida del mes anterior
  const [partidasAnteriores, setPartidasAnteriores] = useState<{
    [key: string]: number;
  }>({});
  const [totalGastos, setTotalGastos] = useState(0);
  const [selectedPartida, setSelectedPartida] = useState<PartidaResumen | null>(
    null
  );
  console.log("mesSeleccionado", mesSeleccionado);
  // Procesar datos para agrupar por partidas (solo facturas del mes seleccionado)
  const [totalGastosAnterior, setTotalGastosAnterior] = useState<number | null>(
    null
  );
  useEffect(() => {
    if (!facturas) return;

    const partidasMap: { [key: string]: PartidaResumen } = {};
    let total = 0;

    // Calcular mes anterior
    let mesAnterior = "";
    if (mesSeleccionado && mesSeleccionado.length === 7) {
      const [anio, mes] = mesSeleccionado.split("-");
      let anioAnt = parseInt(anio, 10);
      let mesAnt = parseInt(mes, 10) - 1;
      if (mesAnt === 0) {
        mesAnt = 12;
        anioAnt--;
      }
      mesAnterior = `${anioAnt}-${mesAnt.toString().padStart(2, "0")}`;
    }

    // Filtrar facturas por mes seleccionado
    const facturasFiltradas = facturas.filter((factura) => {
      if (
        !factura.fechaFactura ||
        typeof factura.fechaFactura !== "string" ||
        factura.fechaFactura.length < 7
      )
        return false;
      const mes = factura.fechaFactura.substring(0, 7); // YYYY-MM
      return mes === mesSeleccionado;
    });

    // Filtrar facturas por mes anterior
    const facturasAnteriores = facturas.filter((factura) => {
      if (
        !factura.fechaFactura ||
        typeof factura.fechaFactura !== "string" ||
        factura.fechaFactura.length < 7
      )
        return false;
      const mes = factura.fechaFactura.substring(0, 7);
      return mes === mesAnterior;
    });

    // Recorremos todas las facturas filtradas y sus líneas (mes actual)
    facturasFiltradas.forEach((factura) => {
      factura.idLineasFactura.forEach((linea) => {
        const partidaDesc = linea.idPartida?.descripcion;
        const monto = linea.subTotal;

        if (partidaDesc) {
          if (!partidasMap[partidaDesc]) {
            partidasMap[partidaDesc] = {
              id: linea.idPartida?.id ?? "",
              descripcion: partidaDesc,
              codigo: linea.idPartida?.codigo ?? 0,
              eliminado: linea.idPartida?.eliminado ?? false,
              total: 0,
              porcentaje: 0,
              color: linea.idPartida?.color ?? "gray",
            };
          }

          partidasMap[partidaDesc].total += monto;
          total += monto;
        }
      });
    });

    // Calcular porcentajes
    Object.values(partidasMap).forEach((partida) => {
      partida.porcentaje = Math.round((partida.total / total) * 100);
    });

    // Ordenar por monto descendente
    const sortedPartidas = Object.values(partidasMap).sort(
      (a, b) => b.total - a.total
    );

    setPartidas(sortedPartidas);
    setTotalGastos(total);

    // Calcular total del mes anterior (general)
    if (mesAnterior) {
      const totalAnterior = facturasAnteriores.reduce((acc, factura) => {
        return (
          acc +
          factura.idLineasFactura.reduce(
            (sum, linea) => sum + linea.subTotal,
            0
          )
        );
      }, 0);
      setTotalGastosAnterior(totalAnterior);
    } else {
      setTotalGastosAnterior(null);
    }

    // Calcular totales por partida del mes anterior
    const partidasAntMap: { [key: string]: number } = {};
    facturasAnteriores.forEach((factura) => {
      factura.idLineasFactura.forEach((linea) => {
        const partidaDesc = linea.idPartida?.descripcion;
        const monto = linea.subTotal;
        if (partidaDesc) {
          if (!partidasAntMap[partidaDesc]) {
            partidasAntMap[partidaDesc] = 0;
          }
          partidasAntMap[partidaDesc] += monto;
        }
      });
    });
    setPartidasAnteriores(partidasAntMap);
  }, [facturas, mesSeleccionado]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEstadoTag = (estado: string) => {
    const severity =
      estado === "Aprobada"
        ? "success"
        : estado === "Pendiente"
        ? "warning"
        : "danger";
    return <Tag value={estado} severity={severity} />;
  };

  const getFacturasByPartida = (partidaId: string) => {
    if (!facturas) return [];
    // Solo facturas del mes seleccionado
    return facturas.filter((factura) => {
      if (
        !factura.fechaFactura ||
        typeof factura.fechaFactura !== "string" ||
        factura.fechaFactura.length < 7
      )
        return false;
      const mes = factura.fechaFactura.substring(0, 7);
      return (
        mes === mesSeleccionado &&
        factura.idLineasFactura.some(
          (linea) => linea.idPartida?.id === partidaId
        )
      );
    });
  };

  // Datos para gráficos
  const getChartData = () => {
    return {
      labels: partidas.map((p) => p.descripcion),
      datasets: [
        {
          data: partidas.map((p) => p.total),
          // Usa color pastel/opaco agregando 'b3' (70% opacity) al final del color hex
          backgroundColor: partidas.map((p) => `#${p.color}90`),
          borderWidth: 0,
        },
      ],
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw || 0;
            const percentage = Math.round((value / totalGastos) * 100);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <Card className="h-full">
        <div className="flex justify-content-between align-items-center mb-4">
          <Skeleton width="10rem" height="2rem" />
          <Skeleton width="8rem" height="2rem" />
        </div>

        <TabView>
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12 lg:col-6">
                <Card className="h-full">
                  <div className="flex flex-column gap-3">
                    <Skeleton width="10rem" height="1.5rem" />
                    <Skeleton shape="circle" size="300px" className="mx-auto" />
                  </div>
                </Card>
              </div>

              <div className="col-12 lg:col-6">
                <Card>
                  <Skeleton width="10rem" height="1.5rem" className="mb-4" />
                  <div className="flex flex-column gap-3">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i}>
                        <div className="flex justify-content-between mb-2">
                          <Skeleton width="40%" height="1rem" />
                          <Skeleton width="20%" height="1rem" />
                        </div>
                        <Skeleton width="100%" height="0.5rem" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Detalle">
            <Card>
              <div className="grid">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="col-12 md:col-6 lg:col-4">
                    <Skeleton height="4rem" className="mb-3" />
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>
        </TabView>
      </Card>
    );
  }

  // Determinar color de variación
  let variacionColor = "text-gray-700";
  if (totalGastosAnterior !== null) {
    if (totalGastos < totalGastosAnterior)
      variacionColor = "text-green-600 text-xl font-bold ";
    else if (totalGastos > totalGastosAnterior)
      variacionColor = "text-red-600 text-xl font-bold ";
  }

  return (
    <div className="card h-full">
      <div className="flex justify-content-between align-items-center mb-1">
        <h5 className="m-0">Análisis de Gastos</h5>
        <div className="flex flex-column align-items-end">
          {/* <div className="bg-blue-100 text-blue-800 border-round px-3 py-1 mb-1">
            <span className=" text-xl font-bold">Total: </span>
            <span className={variacionColor}>
              {formatCurrency(totalGastos)}
            </span>
          </div> */}
          <div className="p-3 border-round bg-blue-100">
            <span className="text-xl text-green-700 ">Total Gasto: </span>
            <span className={variacionColor}>
              {formatCurrency(totalGastos)}
            </span>
            <div className="flex flex-column align-items-end">
              {totalGastosAnterior !== null && (
                <span className="text-sm text-color-secondary">
                  Mes anterior: {formatCurrency(totalGastosAnterior)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
        className="custom-tabview"
      >
        {/* Vista Resumen */}
        <TabPanel
          header={
            <span>
              <i className="pi pi-chart-pie mr-2"></i>Resumen
            </span>
          }
        >
          <div className="grid">
            <div className="col-12 lg:col-6">
              <div title="Top Partidas">
                <ul className="list-none m-0 p-0">
                  {partidas.slice(0, 5).map((partida, i) => {
                    // Comparación con el mes anterior
                    const totalAnterior =
                      partidasAnteriores[partida.descripcion] || 0;
                    let color = "text-gray-700";
                    if (totalAnterior > 0) {
                      if (partida.total < totalAnterior)
                        color = "text-green-600";
                      else if (partida.total > totalAnterior)
                        color = "text-red-600";
                    }
                    return (
                      <li
                        key={i}
                        className={classNames(
                          "p-3 border-round mb-2 cursor-pointer transition-colors transition-duration-200",
                          {
                            "bg-primary-50 border-left-3 border-primary":
                              selectedPartida?.id === partida.id,
                            "surface-hover": selectedPartida?.id !== partida.id,
                          }
                        )}
                        onClick={() => {
                          setSelectedPartida(partida);
                          // setActiveTab(2); // Cambiar a la pestaña de partida
                        }}
                      >
                        <div className="flex align-items-center justify-content-between mb-2">
                          <div className="flex align-items-center">
                            <i
                              className="pi pi-circle-fill mr-2"
                              style={{ color: `#${partida.color}` }}
                            ></i>
                            <span className="font-bold">
                              {partida.descripcion}
                            </span>
                          </div>
                          <div className="flex flex-column align-items-end gap-1">
                            <span className={classNames("font-bold", color)}>
                              {formatCurrency(partida.total)}
                            </span>
                            <span className="text-xs text-color-secondary">
                              Mes ant: {formatCurrency(totalAnterior)}
                            </span>
                          </div>
                          <span
                            className={classNames(
                              "font-bold py-1 px-2 border-round"
                              // `bg-${partida.color}-100 text-${partida.color}-700`
                            )}
                            style={{
                              backgroundColor: `#${partida.color}20`,
                              color: `#${partida.color}`,
                            }}
                          >
                            {partida.porcentaje}%
                          </span>
                        </div>
                        <ProgressBar
                          value={partida.porcentaje}
                          className={`h-1rem bg-${partida.color}-100`}
                          showValue={false}
                        />
                      </li>
                    );
                  })}
                </ul>
                <Button
                  label="Ver todas las partidas"
                  icon="pi pi-list"
                  className="w-full mt-3"
                  outlined
                  onClick={() => setActiveTab(1)}
                />
              </div>
            </div>
            <div className="col-12 lg:col-6 flex">
              <div className="surface-card p-4 border-round flex-grow-1 shadow-1">
                <div className="flex justify-content-between align-items-center mb-4">
                  <h6 className="m-0">Distibucion de partidas Mensual</h6>
                  <span className="text-sm text-color-secondary">
                    {new Date(mesSeleccionado + "-11").toLocaleString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Chart
                  type="doughnut"
                  data={getChartData()}
                  options={chartOptions}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Vista Detalle */}
        <TabPanel
          header={
            <span>
              <i className="pi pi-list mr-2"></i>Detalle
            </span>
          }
        >
          <div title="Todas las Partidas">
            <h6 className="m-0 mb-3">Todas las Partidas</h6>
            <div className="grid">
              {partidas.map((partida, i) => {
                const totalAnterior =
                  partidasAnteriores[partida.descripcion] || 0;
                let color = "text-gray-700";
                if (totalAnterior > 0) {
                  if (partida.total < totalAnterior) color = "text-green-600";
                  else if (partida.total > totalAnterior)
                    color = "text-red-600";
                }
                return (
                  <div key={i} className="col-12 md:col-6 lg:col-4">
                    <div
                      className={classNames("cursor-pointer h-full card", {
                        "border-primary border-2":
                          selectedPartida?.id === partida.id,
                      })}
                      onClick={() => {
                        setSelectedPartida(partida);
                        // setActiveTab(2); // Cambiar a la pestaña de partida
                      }}
                    >
                      <div className="flex justify-content-between align-items-center mb-3">
                        <div className="flex align-items-center">
                          <i
                            className="pi pi-circle-fill mr-2"
                            style={{ color: `#${partida.color}` }}
                          ></i>
                          <span className="font-bold">
                            {partida.descripcion}
                          </span>
                        </div>
                        <span
                          className={classNames(
                            "font-bold py-1 px-2 border-round"
                          )}
                          style={{
                            backgroundColor: `#${partida.color}40`,
                            color: `#${partida.color}`,
                          }}
                        >
                          {partida.porcentaje}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold mb-2 flex flex-column align-items-end gap-1">
                        <span className={color}>
                          {formatCurrency(partida.total)}
                        </span>
                        <span className="text-xs text-color-secondary">
                          Mes ant: {formatCurrency(totalAnterior)}
                        </span>
                      </div>
                      <ProgressBar
                        value={partida.porcentaje}
                        className={`h-1rem bg-${partida.color}-100`}
                        showValue={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabPanel>

        {/* Vista por Partida
        {selectedPartida && (
          <TabPanel
            header={
              <div className="flex align-items-center">
                <i
                  className="pi pi-circle-fill mr-2"
                  style={{ color: `#${selectedPartida.color}` }}
                ></i>
                <span>{selectedPartida.descripcion}</span>
              </div>
            }
          >
            <Card
              title={selectedPartida.descripcion}
              subTitle={`Código: ${selectedPartida.codigo}`}
            >
              <div className="grid mb-4">
                <div className="col-12 md:col-4">
                  <div className="surface-100 p-3 border-round">
                    <div className="text-sm text-color-secondary">
                      Total Gastado
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedPartida.total)}
                    </div>
                  </div>
                </div>
                <div className="col-12 md:col-4">
                  <div className="surface-100 p-3 border-round">
                    <div className="text-sm text-color-secondary">
                      Porcentaje
                    </div>
                    <div className="text-2xl font-bold">
                      {selectedPartida.porcentaje}%
                    </div>
                  </div>
                </div>
                <div className="col-12 md:col-4">
                  <div className="surface-100 p-3 border-round">
                    <div className="text-sm text-color-secondary">Facturas</div>
                    <div className="text-2xl font-bold">
                      {getFacturasByPartida(selectedPartida.id).length}
                    </div>
                  </div>
                </div>
              </div>

              <DataTable
                value={getFacturasByPartida(selectedPartida.id)}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25]}
                className="p-datatable-sm"
                emptyMessage="No se encontraron facturas para esta partida."
              >
                <Column
                  header="Factura"
                  body={(rowData) => (
                    <div>
                      <div className="font-bold">#{rowData.numeroFactura}</div>
                      <div className="text-sm text-color-secondary">
                        {formatDate(rowData.fechaFactura)}
                      </div>
                    </div>
                  )}
                />
                <Column field="concepto" header="Concepto" sortable />
                <Column
                  header="Descripción"
                  body={(rowData) => {
                    const linea = rowData.idLineasFactura.find(
                      (l: any) => l.idPartida.id === selectedPartida.id
                    );
                    return (
                      <div className="font-bold">{linea?.descripcion}</div>
                    );
                  }}
                />
                <Column
                  header="Monto"
                  body={(rowData) => {
                    const linea = rowData.idLineasFactura.find(
                      (l: any) => l.idPartida.id === selectedPartida.id
                    );
                    return (
                      <div className="font-bold">
                        {formatCurrency(linea?.subTotal || 0)}
                      </div>
                    );
                  }}
                />
                <Column
                  field="estado"
                  header="Estado"
                  body={(rowData) => getEstadoTag(rowData.estado)}
                />
                <Column
                  header="Acciones"
                  body={() => (
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-outlined"
                      tooltip="Ver detalles"
                      tooltipOptions={{ position: "top" }}
                    />
                  )}
                />
              </DataTable>
            </Card>
          </TabPanel>
        )} */}
      </TabView>
      <Dialog
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-info-circle mr-3 text-primary text-3xl"></i>
                Detalle del Abono
              </h2>
            </div>
          </div>
        }
        visible={!!selectedPartida}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => setSelectedPartida(null)}
        modal
        className="p-fluid"
        content={
          selectedPartida && (
            <div className="card p-fluid surface-50 p-3 border-round shadow-2">
              <div className="mb-2 text-center md:text-left">
                <div className="border-bottom-2 border-primary pb-2">
                  <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                    <i className="pi pi-info-circle mr-3 text-primary text-3xl"></i>
                    {selectedPartida.descripcion}
                  </h2>
                  <div className="text-sm text-color-secondary">
                    Código: {selectedPartida.codigo}
                  </div>
                </div>
              </div>

              <div className="grid formgrid row-gap-2 mb-2">
                {/* Número de Abono */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-wallet text-primary mr-2"></i>
                      Total Gastado
                    </label>
                    <span className="text-2xl font-bold">
                      {formatCurrency(selectedPartida.total)}
                    </span>
                  </div>
                </div>

                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-percentage text-primary mr-2"></i>
                      Porcentaje
                    </label>
                    <span className="text-2xl font-bold">
                      {selectedPartida.porcentaje}%
                    </span>
                  </div>
                </div>
                {/* Número de Facturas */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-file text-primary mr-2"></i>
                      Facturas
                    </label>
                    <span className="text-2xl font-bold">
                      {getFacturasByPartida(selectedPartida.id).length}
                    </span>
                  </div>
                </div>
              </div>

              <DataTable
                value={getFacturasByPartida(selectedPartida.id)}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25]}
                className="p-datatable-sm"
                emptyMessage="No se encontraron facturas para esta partida."
              >
                <Column
                  header="Factura"
                  body={(rowData) => (
                    <div>
                      <div className="font-bold">#{rowData.numeroFactura}</div>
                      <div className="text-sm text-color-secondary">
                        {formatDate(rowData.fechaFactura)}
                      </div>
                    </div>
                  )}
                />
                <Column field="concepto" header="Concepto" sortable />
                <Column
                  header="Descripción"
                  body={(rowData) => {
                    const linea = rowData.idLineasFactura.find(
                      (l: any) => l.idPartida.id === selectedPartida.id
                    );
                    return (
                      <div className="font-bold">{linea?.descripcion}</div>
                    );
                  }}
                />
                <Column
                  header="Monto"
                  body={(rowData) => {
                    const linea = rowData.idLineasFactura.find(
                      (l: any) => l.idPartida.id === selectedPartida.id
                    );
                    return (
                      <div className="font-bold">
                        {formatCurrency(linea?.subTotal || 0)}
                      </div>
                    );
                  }}
                />
                <Column
                  field="estado"
                  header="Estado"
                  body={(rowData) => getEstadoTag(rowData.estado)}
                />
              </DataTable>
              {/* Botón de cierre */}
              <div className="col-12 flex justify-content-end mt-4">
                <Button
                  label="Cerrar"
                  onClick={() => setSelectedPartida(null)}
                  className="w-auto"
                  severity="secondary"
                  icon="pi pi-times"
                />
              </div>
            </div>
          )
        }
      ></Dialog>
    </div>
  );
};

export default GastosResumen;
