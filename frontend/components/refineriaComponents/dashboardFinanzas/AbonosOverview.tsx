import React, { useState, useEffect } from "react";
import { Paginator } from "primereact/paginator";
import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import { Avatar } from "primereact/avatar";
import { Chart } from "primereact/chart";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { Abono } from "@/libs/interfaces";
import { TabView, TabPanel } from "primereact/tabview";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

// Interfaz para los datos del backend
// interface AbonoBackend {
//   id: string;
//   idRefineria: {
//     id: string;
//     nombre: string;
//     img: string;
//   };
//   idContrato: {
//     id: string;
//     numeroContrato: string;
//     descripcion: string;
//     idContacto: {
//       id: string;
//       nombre: string;
//       representanteLegal: string;
//       telefono: string;
//       correo: string;
//       direccion: string;
//     };
//     montoTotal: number;
//     montoPagado: number;
//     montoPendiente: number;
//   };
//   monto: number;
//   fecha: string;
//   tipoOperacion: string;
//   tipoAbono: "Cuentas por Cobrar" | "Cuentas por Pagar";
//   referencia: string;
//   numeroAbono: number;
//   createdAt: string;
//   createdBy: {
//     id: string;
//     nombre: string;
//     correo: string;
//   };
// }

// interface AbonosResponse {
//   total: number;
//   abonos: AbonoBackend[];
// }
interface AbonosOverviewProps {
  abonos: Abono[];
  loading: boolean;
  mesSeleccionado: string;
}

const AbonosOverview = ({
  abonos,
  loading,
  mesSeleccionado,
}: AbonosOverviewProps) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedAbono, setSelectedAbono] = useState<Abono | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const abonosPorPagina = 4;
  console.log(abonos);
  // Cambiar de página y resetear selección al cambiar de tab
  useEffect(() => {
    setCurrentPage(1);
    setSelectedAbono(null);
  }, [activeTab]);

  // Filtrar abonos por mes seleccionado
  const abonosFiltradosPorMes = abonos.filter((abono) => {
    if (
      !abono.fecha ||
      typeof abono.fecha !== "string" ||
      abono.fecha.length < 7
    )
      return false;
    const mes = abono.fecha.substring(0, 7); // Normaliza a formato YYYY-MM
    return mes === mesSeleccionado;
  });

  // Separar abonos por tipo, pero solo del mes seleccionado
  const abonosPorCobrar = abonosFiltradosPorMes.filter(
    (abono) => abono.tipoAbono === "Cuentas por Cobrar"
  );
  const abonosPorPagar = abonosFiltradosPorMes.filter(
    (abono) => abono.tipoAbono === "Cuentas por Pagar"
  );

  // TabView panels config
  const abonosTabs = [
    {
      label: "Todos",
      icon: "pi pi-list",
      lista: abonosFiltradosPorMes,
    },
    {
      label: "Abono Cuentas por Cobrar",
      icon: "pi pi-arrow-down text-green-500",
      lista: abonosPorCobrar,
    },
    {
      label: "Abono Cuentas por Pagar",
      icon: "pi pi-arrow-up text-red-500",
      lista: abonosPorPagar,
    },
  ];

  // Calcular totales y gráfica por semana usando los abonos filtrados por mes
  // Agrupar abonos por semana del mes seleccionado
  function getWeekOfMonth(date: Date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay() || 7; // 1 (lunes) ... 7 (domingo)
    const adjustedDate = date.getDate() + dayOfWeek - 1;
    return Math.ceil(adjustedDate / 7); // 1 a 5
  }

  const semanas = [1, 2, 3, 4, 5];
  const ingresosPorSemana = [0, 0, 0, 0, 0];
  const egresosPorSemana = [0, 0, 0, 0, 0];

  abonosFiltradosPorMes.forEach((abono) => {
    const fecha = new Date(abono.fecha);
    const semana = getWeekOfMonth(fecha) - 1; // 0-indexed
    if (semana >= 0 && semana < 5) {
      if (abono.tipoAbono === "Cuentas por Cobrar") {
        ingresosPorSemana[semana] += abono.monto;
      } else if (abono.tipoAbono === "Cuentas por Pagar") {
        egresosPorSemana[semana] += abono.monto;
      }
    }
  });

  // Totales del mes seleccionado
  const totalIngresos = ingresosPorSemana.reduce((a, b) => a + b, 0);
  const totalEgresos = egresosPorSemana.reduce((a, b) => a + b, 0);

  // Calcular mes anterior (YYYY-MM)
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

  // Filtrar abonos del mes anterior
  const abonosAnterior = abonos.filter((abono) => {
    if (
      !abono.fecha ||
      typeof abono.fecha !== "string" ||
      abono.fecha.length < 7
    )
      return false;
    const mes = abono.fecha.substring(0, 7);
    return mes === mesAnterior;
  });
  // Separar abonos por tipo, pero solo del mes anterior
  const abonosPorCobrarAnterior = abonosAnterior.filter(
    (abono) => abono.tipoAbono === "Cuentas por Cobrar"
  );
  const abonosPorPagarAnterior = abonosAnterior.filter(
    (abono) => abono.tipoAbono === "Cuentas por Pagar"
  );
  const totalIngresosAnterior = abonosPorCobrarAnterior.reduce(
    (a, b) => a + b.monto,
    0
  );
  const totalEgresosAnterior = abonosPorPagarAnterior.reduce(
    (a, b) => a + b.monto,
    0
  );

  // Determinar icono y color de variación según tipo (ingreso/egreso)
  const getVarIcon = (
    actual: number,
    anterior: number,
    tipo: "ingreso" | "egreso"
  ) => {
    if (anterior === 0) return null;
    let colorClass = tipo === "ingreso" ? "text-green-500" : "text-red-600";
    if (actual > anterior)
      return (
        <i
          className={`pi pi-arrow-up ${colorClass} ml-2`}
          title="Mayor que el mes anterior"
        ></i>
      );
    if (actual < anterior)
      return (
        <i
          className={`pi pi-arrow-down ${colorClass} ml-2`}
          title="Menor que el mes anterior"
        ></i>
      );
    return (
      <i
        className={`pi pi-minus ${colorClass} ml-2`}
        title="Igual que el mes anterior"
      ></i>
    );
  };

  // Configuración del gráfico
  const chartData = {
    labels: semanas.map((s) => `Sem ${s}`),
    datasets: [
      {
        label: "Ingresos",
        backgroundColor: "#4CAF50",
        data: ingresosPorSemana,
      },
      {
        label: "Egresos",
        backgroundColor: "#F44336",
        data: egresosPorSemana,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number) {
            return "$" + (value / 1000).toLocaleString() + "K";
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const getTipoAbonoClass = (
    tipo: "Cuentas por Cobrar" | "Cuentas por Pagar"
  ) => {
    return tipo === "Cuentas por Cobrar"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getTipoAbonoTag = (
    tipo: "Cuentas por Cobrar" | "Cuentas por Pagar"
  ) => {
    const severity = tipo === "Cuentas por Cobrar" ? "success" : "danger";
    return <Tag value={tipo} severity={severity} className="ml-2" />;
  };

  if (loading) {
    return (
      <div className="card h-full">
        <div className="flex justify-content-between mb-4">
          <Skeleton width="10rem" height="2rem" />
          <Skeleton width="12rem" height="2rem" />
        </div>

        <div className="grid">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="col-12 md:col-6 mb-3">
              <div className="surface-card border-1 surface-border border-round p-3">
                <div className="flex">
                  <Skeleton shape="circle" size="3rem" className="mr-3" />
                  <div className="flex-1">
                    <Skeleton width="60%" height="1.2rem" className="mb-2" />
                    <Skeleton width="40%" height="1rem" className="mb-3" />
                    <Skeleton width="50%" height="1.5rem" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Skeleton height="300px" className="border-round" />
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="flex justify-content-between align-items-center mb-1">
        <h5 className="m-0">Análisis de Abonos</h5>
        <div className="flex flex-row align-items-end gap-3">
          <div className="p-3 border-round bg-green-50 flex flex-column align-items-start">
            <div>
              <span className="text-xl text-green-700">Total Ingresos: </span>
              <span className="text-xl text-green-700 font-bold">
                {formatCurrency(totalIngresos)}
              </span>
              {getVarIcon(totalIngresos, totalIngresosAnterior, "ingreso")}
            </div>
            {mesAnterior && (
              <span className="text-xs text-color-secondary mt-1">
                Mes anterior: {formatCurrency(totalIngresosAnterior)}
              </span>
            )}
          </div>
          <div className="p-3 border-round bg-red-50 flex flex-column align-items-start">
            <div>
              <span className="text-xl text-red-700">Total Egresos: </span>
              <span className="text-xl text-red-700 font-bold">
                {formatCurrency(totalEgresos)}
              </span>
              {getVarIcon(totalEgresos, totalEgresosAnterior, "egreso")}
            </div>
            {mesAnterior && (
              <span className="text-xs text-color-secondary mt-1">
                Mes anterior: {formatCurrency(totalEgresosAnterior)}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Selector de mes ahora está en Header */}
      <div className="mb-4">
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => {
            setActiveTab(e.index);
            setCurrentPage(1);
            setSelectedAbono(null);
          }}
          className="w-full"
        >
          {abonosTabs.map((tab, idx) => (
            <TabPanel
              key={tab.label}
              header={
                <span>
                  <i className={tab.icon}></i>{" "}
                  <span className="ml-2">{tab.label}</span>
                </span>
              }
            >
              <div className="grid">
                <div className="col-12 lg:col-6">
                  {/* <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-sm text-color-secondary">
                      {tab.lista.length} registros
                    </span>
                  </div> */}
                  <div className="border-round overflow-hidden border-1 surface-border">
                    {(() => {
                      const lista = tab.lista;
                      const start = (currentPage - 1) * abonosPorPagina;
                      const end = start + abonosPorPagina;
                      return lista.slice(start, end).map((abono) => (
                        <div
                          key={abono.id}
                          className={classNames(
                            "p-3 flex cursor-pointer border-bottom-1 surface-border",
                            {
                              "bg-primary-50": selectedAbono?.id === abono.id,
                              "hover:surface-hover":
                                selectedAbono?.id !== abono.id,
                            }
                          )}
                          onClick={() => setSelectedAbono(abono)}
                        >
                          <Avatar
                            icon={
                              abono.tipoAbono === "Cuentas por Cobrar"
                                ? "pi pi-arrow-down"
                                : "pi pi-arrow-up"
                            }
                            size="large"
                            shape="circle"
                            className={classNames(
                              "mr-3",
                              getTipoAbonoClass(
                                abono.tipoAbono === "Cuentas por Cobrar" ||
                                  abono.tipoAbono === "Cuentas por Pagar"
                                  ? abono.tipoAbono
                                  : "Cuentas por Cobrar"
                              )
                            )}
                          />
                          <div className="flex-1">
                            <div className="flex justify-content-between align-items-start">
                              <div>
                                <span className="font-bold block">
                                  {abono.idContrato.numeroContrato}
                                </span>
                                <span className="text-sm text-color-secondary">
                                  #{abono.numeroAbono} •{" "}
                                  {formatDate(abono.fecha)}
                                </span>
                              </div>
                              <span
                                className={classNames("font-bold", {
                                  "text-green-500":
                                    abono.tipoAbono === "Cuentas por Cobrar",
                                  "text-red-500":
                                    abono.tipoAbono === "Cuentas por Pagar",
                                })}
                              >
                                {formatCurrency(abono.monto)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-sm">
                                {abono.referencia}
                              </span>
                              {getTipoAbonoTag(
                                abono.tipoAbono === "Cuentas por Cobrar" ||
                                  abono.tipoAbono === "Cuentas por Pagar"
                                  ? abono.tipoAbono
                                  : "Cuentas por Cobrar"
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {/* Paginador PrimeReact */}
                  {(() => {
                    const lista = tab.lista;
                    if (lista.length <= abonosPorPagina) return null;
                    return (
                      <div className="flex justify-content-center mt-3">
                        <Paginator
                          first={(currentPage - 1) * abonosPorPagina}
                          rows={abonosPorPagina}
                          totalRecords={lista.length}
                          onPageChange={(e) =>
                            setCurrentPage(
                              Math.floor(e.first / abonosPorPagina) + 1
                            )
                          }
                          template="PrevPageLink PageLinks NextPageLink"
                          className="w-auto"
                        />
                      </div>
                    );
                  })()}
                </div>
                {/* Detalle y gráfico */}
                <div className="col-12 lg:col-6 flex flex-column gap-3">
                  <div className="surface-card p-4 border-round flex-grow-1 shadow-1">
                    <div className="flex justify-content-between align-items-center mb-4">
                      <h6 className="m-0">Resumen Mensual</h6>
                      <span className="text-sm text-color-secondary">
                        {new Date(mesSeleccionado + "-01").toLocaleString(
                          "es-ES",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div>
                      <Chart
                        type="bar"
                        data={chartData}
                        options={chartOptions}
                        height="100%"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          ))}
        </TabView>
      </div>

      {/* Modal de detalle de abono fuera del TabView para evitar problemas de renderizado y cierre inesperado */}
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
        visible={!!selectedAbono}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => setSelectedAbono(null)}
        modal
        className="p-fluid"
        content={
          selectedAbono && (
            <div className="card p-fluid surface-50 p-3 border-round shadow-2">
              <div className="mb-2 text-center md:text-left">
                <div className="border-bottom-2 border-primary pb-2">
                  <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                    <i className="pi pi-info-circle mr-3 text-primary text-3xl"></i>
                    Detalle del Abono
                  </h2>
                </div>
              </div>
              <div className="grid formgrid row-gap-2">
                {/* Número de Abono */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-hashtag text-primary mr-2"></i>
                      Número de Abono
                    </label>
                    <span className="font-medium text-lg">
                      #{selectedAbono.numeroAbono}
                    </span>
                  </div>
                </div>

                {/* Contrato */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-file text-primary mr-2"></i>
                      Contrato
                    </label>
                    <span className="font-medium text-lg">
                      {selectedAbono.idContrato.numeroContrato}
                    </span>
                  </div>
                </div>

                {/* Fecha */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-calendar text-primary mr-2"></i>
                      Fecha
                    </label>
                    <span className="font-medium text-lg">
                      {formatDate(selectedAbono.fecha)}
                    </span>
                  </div>
                </div>

                {/* Tipo de Operación */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-flag text-primary mr-2"></i>
                      Tipo de Operación
                    </label>
                    <span className="font-medium text-lg">
                      {selectedAbono.tipoOperacion}
                    </span>
                  </div>
                </div>

                {/* Monto */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-money-bill text-primary mr-2"></i>
                      Monto
                    </label>
                    <span
                      className={classNames("font-bold text-lg", {
                        "text-green-500":
                          selectedAbono.tipoAbono === "Cuentas por Cobrar",
                        "text-red-500":
                          selectedAbono.tipoAbono === "Cuentas por Pagar",
                      })}
                    >
                      {formatCurrency(selectedAbono.monto)}
                    </span>
                    <Tag
                      value={selectedAbono.tipoAbono}
                      severity={
                        selectedAbono.tipoAbono === "Cuentas por Cobrar"
                          ? "success"
                          : "danger"
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Registrado por */}
                <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-user text-primary mr-2"></i>
                      Registrado por
                    </label>
                    <span className="font-medium text-lg">
                      {selectedAbono.createdBy.nombre}
                    </span>
                  </div>
                </div>

                {/* Referencia/Descripción */}
                <div className="col-12">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-align-left text-primary mr-2"></i>
                      Referencia/Descripción
                    </label>
                    <p className="font-medium text-lg mt-1">
                      {selectedAbono.referencia}
                    </p>
                  </div>
                </div>

                {/* Cliente/Proveedor */}
                <div className="col-12">
                  <div className="p-3 bg-white border-round shadow-1">
                    <label className="block font-medium text-900 mb-2 flex align-items-center">
                      <i className="pi pi-building text-primary mr-2"></i>
                      Cliente/Proveedor
                    </label>
                    <div className="flex align-items-center mt-2">
                      <Avatar
                        label={selectedAbono.idContrato.idContacto.nombre[0]}
                        size="large"
                        shape="circle"
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-lg m-0">
                          {selectedAbono.idContrato.idContacto.nombre}
                        </p>
                        <p className="text-color-secondary m-0">
                          {
                            selectedAbono.idContrato.idContacto
                              .representanteLegal
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid">
                      <div className="col-12 md:col-4">
                        <div className="flex align-items-center">
                          <i className="pi pi-phone mr-2 text-color-secondary"></i>
                          <span>
                            {selectedAbono.idContrato.idContacto.telefono}
                          </span>
                        </div>
                      </div>
                      <div className="col-12 md:col-4">
                        <div className="flex align-items-center">
                          <i className="pi pi-envelope mr-2 text-color-secondary"></i>
                          <span>
                            {selectedAbono.idContrato.idContacto.correo}
                          </span>
                        </div>
                      </div>
                      <div className="col-12 md:col-4">
                        <div className="flex align-items-center">
                          <i className="pi pi-map-marker mr-2 text-color-secondary"></i>
                          <span>
                            {selectedAbono.idContrato.idContacto.direccion}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de cierre */}
              <div className="col-12 flex justify-content-end mt-4">
                <Button
                  label="Cerrar"
                  onClick={() => setSelectedAbono(null)}
                  className="w-auto"
                  severity="secondary"
                  icon="pi pi-times"
                />
              </div>
            </div>
          )
        }
      ></Dialog>
      {/* ...el resto del código se maneja dentro de TabView... */}
    </div>
  );
};

export default AbonosOverview;
