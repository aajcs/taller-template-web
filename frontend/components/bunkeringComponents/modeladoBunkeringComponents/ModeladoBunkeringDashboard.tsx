"use client";

import { useRefineriaStore } from "@/store/refineriaStore";
import { ProgressSpinner } from "primereact/progressspinner";
import ModeladoBunkeringLineaCarga from "./ModeladoBunkeringLineaCarga";
import { formatDateFH, formatDuration } from "@/utils/dateUtils";
import { useSocket } from "@/hooks/useSocket";
import { Dialog } from "primereact/dialog";
import { useState, useMemo, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ModeladoBunkeringContratosList from "./ModeladoBunkeringContratosList";
import ModeladoBunkeringRecepcionesList from "./ModeladoBunkeringRecepcionesList";
import ModeladoBunkeringLineaDespacho from "./ModeladoBunkeringLineaDespacho";
import ModeladoBunkeringDespachosList from "./ModeladoBunkeringDespachosList";
import ModeladoBunkeringContratosVentaList from "./ModeladoBunkeringContratosVentaList";

import { TabPanel, TabView } from "primereact/tabview";
import { InputSwitch } from "primereact/inputswitch";
import { useBunkeringData } from "@/hooks/useBunkeringData";

const ModeladoBunkeringDashboard = () => {
  const { activeRefineria } = useRefineriaStore();
  const { recepcionModificado } = useSocket(); // Obtén recepcionModificado desde el socket
  const {
    lineaRecepcions,
    recepcions,
    contratos,
    loading,
    lineaDespachos,
    despachos,
  } = useBunkeringData(activeRefineria?.id || "");
  const [visible, setVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [visibleDespachos, setVisibleDespachos] = useState<boolean>(false);
  const [selectedContratoVenta, setSelectedContratoVenta] = useState<any>(null);
  const [checked, setChecked] = useState(false); // Estado para el InputSwitch

  const showDialog = useCallback((product: any) => {
    setSelectedProduct(product);
    setVisible(true);
  }, []);
  const onShowDialogDespachos = useCallback((contrato: any) => {
    setSelectedContratoVenta(contrato);
    setVisibleDespachos(true);
  }, []);

  const hideDialog = useCallback(() => {
    setVisible(false);
    setSelectedProduct(null);
  }, []);
  const hideDialogDespacho = useCallback(() => {
    setVisibleDespachos(false);
    setSelectedContratoVenta(null);
  }, []);

  // Agrupar recepciones por contrato y producto
  const recepcionesPorContrato = useMemo(() => {
    return contratos.map((contrato) => {
      const recepcionesContrato = recepcions.filter(
        (recepcion) => recepcion.idContrato.id === contrato.id
      );
      const productos = contrato.idItems.map((item: any) => {
        const recepcionesProducto = recepcionesContrato.filter(
          (recepcion) =>
            recepcion.idContratoItems?.producto.id === item.producto?.id &&
            recepcion.idContratoItems?.idTipoProducto ===
              item.idTipoProducto?.id
        );

        const cantidadRecibida = recepcionesProducto.reduce(
          (total, recepcion) => total + recepcion.cantidadRecibida,
          0
        );

        const cantidadFaltante = item.cantidad - cantidadRecibida;

        const porcentaje = (cantidadRecibida / item.cantidad) * 100;

        const despachosProducto = despachos.filter(
          (despacho) =>
            despacho.idContratoItems?.producto.id === item.producto.id &&
            despacho.idContratoItems?.idTipoProducto === item.idTipoProducto.id
        );

        const cantidadDespachada = despachosProducto.reduce(
          (total, despacho) => total + despacho.cantidadRecibida,
          0
        );

        const porcentajeDespacho = (cantidadDespachada / item.cantidad) * 100;
        const cantidadFaltanteDespacho = item.cantidad - cantidadDespachada;

        return {
          producto: item.producto,
          cantidad: item.cantidad,

          recepciones: recepcionesProducto,
          cantidadRecibida,
          cantidadFaltante,
          porcentaje,

          despachos: despachosProducto,
          cantidadDespachada,
          cantidadFaltanteDespacho,
          porcentajeDespacho,
        };
      });

      return {
        ...contrato,
        productos,
      };
    });
  }, [contratos, recepcions]);

  const recepcionesEnTransito = useMemo(
    () => recepcions.filter((r) => r.estadoRecepcion === "EN_TRANSITO"),
    [recepcions]
  );

  const recepcionesEnRefineria = useMemo(
    () => recepcions.filter((r) => r.estadoRecepcion === "EN_REFINERIA"),
    [recepcions]
  );

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }
  const rowClass = (data: any) => {
    return {
      "bg-programado": data[0].estadoRecepcion === "PROGRAMADO",
      "bg-en-transito": data[0].estadoRecepcion === "EN_TRANSITO",
      "bg-en-refineria": data[0].estadoRecepcion === "EN_REFINERIA",
      "bg-completado": data[0].estadoRecepcion === "COMPLETADO",
      "bg-cancelado": data[0].estadoRecepcion === "CANCELADO",
    };
  };
  return (
    <div className="">
      <div className="flex flex-wrap ">
        <TabView className="w-full">
          <TabPanel header="Compras de Crudos" leftIcon="pi pi-wallet mr-2">
            <ModeladoBunkeringContratosList
              contratos={recepcionesPorContrato}
              onShowDialog={showDialog}
            />
          </TabPanel>
          <TabPanel
            header="Ventas de Productos"
            leftIcon="pi pi-briefcase mr-2"
          >
            <ModeladoBunkeringContratosVentaList
              contratos={recepcionesPorContrato}
              onShowDialogDespachos={onShowDialogDespachos}
            />
          </TabPanel>
          <TabPanel header="Recepciones" leftIcon="pi pi-truck mr-2">
            <div>
              {/* Switch para alternar entre recepciones */}
              <div className="flex align-items-center gap-3 mb-3">
                <span>Mostrar Recepciones en Tránsito</span>
                <InputSwitch
                  checked={checked}
                  onChange={(e) => setChecked(e.value)}
                />
                <span>Mostrar Recepciones en Refinería</span>
              </div>

              {/* Mostrar el componente según el estado del switch */}
              {checked ? (
                <ModeladoBunkeringRecepcionesList
                  recepciones={recepcionesEnRefineria}
                />
              ) : (
                <ModeladoBunkeringRecepcionesList
                  recepciones={recepcionesEnTransito}
                />
              )}
            </div>
          </TabPanel>

          <TabPanel header="Despacho" leftIcon="pi pi-truck mr-2">
            <ModeladoBunkeringDespachosList despachos={despachos} />
          </TabPanel>
        </TabView>

        {/* {torresDestilacion.map((torre) => (
          <div key={torre.id} className="col-12 md:col-6">
            <RefineryAnalysis
              torre={torre}
              corteRefinacions={corteRefinacions}
            />
          </div>
        ))} */}

        {/* Línea de recepción */}

        <div className="col-12 md:col-6 lg:col-2">
          <div className="card p-3 lg-h-fullScreen">
            <h1 className="text-2xl font-bold mb-3">Recepción de tractomula</h1>

            {lineaRecepcions.map((lineaRecepcion) => (
              <div key={lineaRecepcion.id} className="mb-2">
                <ModeladoBunkeringLineaCarga
                  lineaRecepcion={lineaRecepcion}
                  recepcions={recepcions}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Línea de recepción */}

        <div className="col-12 md:col-6 lg:col-8">
          <div className="card p-3 lg-h-fullScreen">
            <h1 className="text-2xl font-bold mb-3">Gabarras</h1>

            {lineaRecepcions.map((lineaRecepcion) => (
              <div key={lineaRecepcion.id} className="mb-2">
                <ModeladoBunkeringLineaCarga
                  lineaRecepcion={lineaRecepcion}
                  recepcions={recepcions}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Línea de Despacho */}
        <div className="col-12 md:col-6 lg:col-2">
          <div className="card p-3 lg-h-fullScreen">
            <h1 className="text-2xl font-bold mb-3">Línea de Despacho</h1>

            {lineaDespachos.map((lineaDespacho) => (
              <div key={lineaDespacho.id} className="mb-2">
                <ModeladoBunkeringLineaDespacho
                  lineaDespacho={lineaDespacho}
                  despachos={despachos}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        header="Detalles de Recepciones"
        visible={visible}
        modal
        onHide={hideDialog}
        style={{ width: "80vw" }}
        breakpoints={{
          "960px": "75vw",
          "641px": "100vw",
        }}
      >
        {selectedProduct && (
          <>
            <DataTable
              value={selectedProduct.recepciones}
              size="small"
              tableStyle={{ minWidth: "50rem" }}
              footer={
                <div className="p-2 flex justify-content-between">
                  <div>
                    <strong>Producto:</strong> {selectedProduct.producto.nombre}
                  </div>
                  <div>
                    <strong>Cantidad:</strong>{" "}
                    {selectedProduct.cantidad.toLocaleString("de-DE")} Bbls
                  </div>
                  <div>
                    <strong>Cantidad Recibida:</strong>{" "}
                    {selectedProduct.cantidadRecibida.toLocaleString("de-DE")}{" "}
                    Bbls
                  </div>
                  <div>
                    <strong>Cantidad Faltante:</strong>{" "}
                    {selectedProduct.cantidadFaltante.toLocaleString("de-DE")}{" "}
                    Bbls
                  </div>
                </div>
              }
              rowClassName={rowClass}
            >
              <Column field="placa" header="Placa"></Column>
              <Column
                field="nombreChofer"
                header="Chofer"
                body={(rowData: any) => rowData.nombreChofer}
              ></Column>
              <Column field="idGuia" header="Guía"></Column>
              <Column field="idTanque.nombre" header="Tanque"></Column>
              <Column
                field="cantidadRecibida"
                header="Cantidad Recibida"
                body={(rowData: any) =>
                  `${Number(rowData.cantidadRecibida).toLocaleString(
                    "de-DE"
                  )} Bbls`
                }
              ></Column>
              <Column
                field="fechaSalida"
                header="Fecha Inicio"
                body={(rowData: any) => formatDateFH(rowData.fechaSalida)}
              ></Column>
              <Column
                field="fechaLlegada"
                header="Fecha Fin"
                body={(rowData: any) => formatDateFH(rowData.fechaLlegada)}
              ></Column>
              <Column
                header="Tiempo de Carga"
                body={(rowData: any) =>
                  formatDuration(rowData.fechaSalida, rowData.fechaLlegada)
                }
              ></Column>
              <Column
                field="estadoRecepcion"
                header="Estado Recepción"
                body={(rowData: any) => rowData.estadoRecepcion}
              ></Column>
              <Column
                field="estadoCarga"
                header="Estado Carga"
                body={(rowData: any) => rowData.estadoCarga}
              ></Column>
            </DataTable>
          </>
        )}
      </Dialog>
      <Dialog
        header="Detalles de Recepciones"
        visible={visibleDespachos}
        modal
        onHide={hideDialogDespacho}
        style={{ width: "80vw" }}
        breakpoints={{
          "960px": "75vw",
          "641px": "100vw",
        }}
      >
        {selectedContratoVenta && (
          <>
            <DataTable
              value={selectedContratoVenta.despachos}
              size="small"
              tableStyle={{ minWidth: "50rem" }}
              footer={
                <div className="p-2 flex justify-content-between">
                  <div>
                    <strong>Producto:</strong>{" "}
                    {selectedContratoVenta.producto.nombre}
                  </div>
                  <div>
                    <strong>Cantidad:</strong>{" "}
                    {selectedContratoVenta.cantidad.toLocaleString("de-DE")}{" "}
                    Bbls
                  </div>
                  <div>
                    <strong>Cantidad Recibida:</strong>{" "}
                    {selectedContratoVenta.cantidadDespachada.toLocaleString(
                      "de-DE"
                    )}{" "}
                    Bbls
                  </div>
                  <div>
                    <strong>Cantidad Faltante:</strong>{" "}
                    {selectedContratoVenta.cantidadFaltanteDespacho.toLocaleString(
                      "de-DE"
                    )}{" "}
                    Bbls
                  </div>
                </div>
              }
            >
              <Column field="placa" header="Placa"></Column>
              <Column
                field="nombreChofer"
                header="Chofer"
                body={(rowData: any) =>
                  rowData.nombreChofer + " " + rowData.apellidoChofer
                }
              ></Column>
              <Column field="idGuia" header="Guía"></Column>
              <Column field="idTanque.nombre" header="Tanque"></Column>
              <Column
                field="cantidadRecibida"
                header="Cantidad Recibida"
                body={(rowData: any) =>
                  `${Number(rowData.cantidadRecibida).toLocaleString(
                    "de-DE"
                  )} Bbls`
                }
              ></Column>

              <Column
                field="fechaInicioDespacho"
                header="Fecha Inicio"
                body={(rowData: any) => formatDateFH(rowData.fechaInicio)}
              ></Column>
              <Column
                field="fechaDespacho"
                header="Fecha Despacho"
                body={(rowData: any) =>
                  formatDateFH(rowData.fechaInicioDespacho)
                }
              ></Column>
              <Column
                field="fechaFinDespacho"
                header="Fecha Fin"
                body={(rowData: any) => formatDateFH(rowData.fechaFinDespacho)}
              ></Column>
              <Column
                header="Tiempo de Carga"
                body={(rowData: any) =>
                  formatDuration(rowData.fechaInicio, rowData.fechaFin)
                }
              ></Column>
              <Column
                field="estadoDespacho"
                header="Estado Despacho"
                body={(rowData: any) => rowData.estadoDespacho}
              ></Column>
              <Column
                field="estadoCarga"
                header="Estado Carga"
                body={(rowData: any) => rowData.estadoCarga}
              ></Column>
            </DataTable>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default ModeladoBunkeringDashboard;
