"use client";

import { useRefineriaStore } from "@/store/refineriaStore";
import ModeladoRefineriaTanque from "./ModeladoRefineriaTanque";
import ModeladoRefineriaTorre from "./ModeladoRefineriaTorre";
import { ProgressSpinner } from "primereact/progressspinner";
import ModeladoRefineriaLineaCarga from "./ModeladoRefineriaLineaCarga";
import { formatDateFH, formatDuration } from "@/utils/dateUtils";
import { useSocket } from "@/hooks/useSocket";

import { Dialog } from "primereact/dialog";
import { useState, useMemo, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ModeladoRefineriaContratosList from "./ModeladoRefineriaContratosList";
import ModeladoRefineriaRecepcionesList from "./ModeladoRefineriaRecepcionesList";
import ModeladoRefineriaLineaDespacho from "./ModeladoRefineriaLineaDespacho";
import ModeladoRefineriaDespachosList from "./ModeladoRefineriaDespachosList";
import ModeladoRefineriaContratosVentaList from "./ModeladoRefineriaContratosVentaList";

import { TabPanel, TabView } from "primereact/tabview";
import { InputSwitch } from "primereact/inputswitch";
import { motion } from "framer-motion";
import { useByRefineryData } from "@/hooks/useByRefineryData";

const AnimatedTitle = ({ text }: { text: string }) => {
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };
  const letter = {
    hidden: { opacity: 0, y: 40, scale: 0.7, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  };
  return (
    <motion.h1
      className="text-2xl font-bold mb-3"
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexWrap: "wrap" }}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          variants={letter}
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

const ModeladoRefineriaDashboard = () => {
  const { activeRefineria } = useRefineriaStore();
  const { recepcionModificado } = useSocket(); // Obtén recepcionModificado desde el socket
  const {
    tanques = [],
    torresDestilacions = [],
    lineaRecepcions = [],
    recepcions = [],
    contratos = [],
    loading,
    lineaDespachos = [],
    despachos = [],
    corteRefinacions = [],
    chequeoCantidads = [],
  } = useByRefineryData(
    activeRefineria?.id || "",
    recepcionModificado || undefined // Pasa recepcionModificado como dependencia
  );
  const [visible, setVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [visibleDespachos, setVisibleDespachos] = useState<boolean>(false);
  const [selectedContratoVenta, setSelectedContratoVenta] = useState<any>(null);
  console.log("selectedContratoVenta", selectedContratoVenta);
  const [checked, setChecked] = useState(false); // Estado para el InputSwitch
  const [checkedDespachos, setCheckedDespachos] = useState(false); // Estado para el InputSwitch de despachos
  const showDialog = useCallback((product: any) => {
    setSelectedProduct(product);
    setVisible(true);
  }, []);
  const onShowDialogDespachos = useCallback((product: any) => {
    setSelectedContratoVenta(product);
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
  const tanquesFiltradosOrdenados = useMemo(
    () =>
      (tanques || [])
        .filter((tanque) => !tanque.almacenamientoMateriaPrimaria)
        .sort(
          (a, b) =>
            (a.idProducto?.posicion || 0) - (b.idProducto?.posicion || 0)
        ),
    [tanques]
  );
  // Agrupar recepciones por contrato y producto
  const recepcionesPorContrato = useMemo(() => {
    return contratos.map((contrato) => {
      const recepcionesContrato = recepcions.filter(
        (recepcion) => recepcion.idContrato.id === contrato.id
      );

      // Totalidad de recepciones del contrato
      const totalRecepciones = recepcionesContrato.length;
      // Recepciones en estado COMPLETADO
      const recepcionesCompletadas = recepcionesContrato.filter(
        (recepcion) => recepcion.estadoRecepcion === "COMPLETADO"
      );
      const totalRecepcionesCompletadas = recepcionesCompletadas.length;

      const despachosContrato = despachos.filter(
        (despacho) => despacho.idContrato.id === contrato.id
      );
      console.log("despachosContrato", despachosContrato);
      const totalDespachos = despachosContrato.length;
      const despachosCompletados = despachosContrato.filter(
        (despacho) => despacho.estadoDespacho === "COMPLETADO"
      );
      console.log("despachosCompletados", despachosCompletados);
      const totalDespachosCompletados = despachosCompletados.length;

      const productos = contrato.idItems.map((item: any) => {
        const recepcionesProducto = recepcionesContrato.filter(
          (recepcion) =>
            recepcion.idContratoItems?.producto.id === item.producto?.id &&
            recepcion.idContratoItems?.idTipoProducto ===
              item.idTipoProducto?.id
        );

        const cantidadRecibida = recepcionesProducto
          .filter((r) => r.estadoRecepcion === "COMPLETADO")
          .reduce((total, recepcion) => total + recepcion.cantidadRecibida, 0);

        const cantidadFaltante = item.cantidad - cantidadRecibida;

        const porcentaje = (cantidadRecibida / item.cantidad) * 100;
        const despachosProducto = despachosContrato.filter(
          (despacho) =>
            despacho.idContratoItems?.producto.id === item.producto?.id &&
            despacho.idContratoItems?.idTipoProducto === item.idTipoProducto.id
        );

        const cantidadDespachada = despachosProducto
          .filter((d) => d.estadoDespacho === "COMPLETADO")
          .reduce((total, despacho) => total + despacho.cantidadRecibida, 0);

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
        totalRecepciones,
        totalRecepcionesCompletadas,
        recepcionesCompletadas,
        totalDespachos,
        totalDespachosCompletados,
        despachosCompletados,
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
  const despachosEnTransito = useMemo(
    () => despachos.filter((d) => d.estadoDespacho === "EN_TRANSITO"),
    [despachos]
  );
  const despachosEnRefineria = useMemo(
    () => despachos.filter((d) => d.estadoDespacho === "EN_REFINERIA"),
    [despachos]
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
  const rowClassDespacho = (data: any) => {
    return {
      "bg-programado": data[0].estadoDespacho === "PROGRAMADO",
      "bg-en-transito": data[0].estadoDespacho === "EN_TRANSITO",
      "bg-en-refineria": data[0].estadoDespacho === "EN_REFINERIA",
      "bg-completado": data[0].estadoDespacho === "COMPLETADO",
      "bg-cancelado": data[0].estadoDespacho === "CANCELADO",
    };
  };
  return (
    <div className="">
      <div className="flex flex-wrap ">
        <TabView className="card w-full p-1">
          <TabPanel header="Compras de Crudos" leftIcon="pi pi-wallet mr-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                type: "spring",
                bounce: 0.35,
                delay: 0.2,
              }}
            >
              <ModeladoRefineriaContratosList
                contratos={recepcionesPorContrato}
                onShowDialog={showDialog}
              />
            </motion.div>
          </TabPanel>
          <TabPanel
            header="Ventas de Productos"
            leftIcon="pi pi-briefcase mr-2"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                type: "spring",
                bounce: 0.35,
                delay: 0.2,
              }}
            >
              <ModeladoRefineriaContratosVentaList
                contratos={recepcionesPorContrato}
                onShowDialogDespachos={onShowDialogDespachos}
              />
            </motion.div>
          </TabPanel>
          <TabPanel header="Recepciones" leftIcon="pi pi-truck mr-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                type: "spring",
                bounce: 0.35,
                delay: 0.2,
              }}
            >
              <div>
                {/* Switch para alternar entre recepciones */}
                <div className="flex align-items-center gap-3 mb-3">
                  <span>Mostrar Recepciones en Refinería</span>
                  <InputSwitch
                    checked={checked}
                    onChange={(e) => setChecked(e.value)}
                  />
                  <span>Mostrar Recepciones en Tránsito</span>
                </div>

                {/* Mostrar el componente según el estado del switch */}
                {checked ? (
                  <ModeladoRefineriaRecepcionesList
                    recepciones={recepcionesEnTransito}
                  />
                ) : (
                  <ModeladoRefineriaRecepcionesList
                    recepciones={recepcionesEnRefineria}
                  />
                )}
              </div>
            </motion.div>
          </TabPanel>
          <TabPanel header="Despacho" leftIcon="pi pi-truck mr-2">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.85,
                y: -40,
                filter: "blur(12px)",
              }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                type: "spring",
                bounce: 0.35,
                delay: 0.3,
              }}
            >
              <div>
                {/* Switch para alternar entre recepciones */}
                <div className="flex align-items-center gap-3 mb-3">
                  <span>Mostrar Despachos en Refinería</span>
                  <InputSwitch
                    checked={checkedDespachos}
                    onChange={(e) => setCheckedDespachos(e.value)}
                  />
                  <span>Mostrar Despachos en Tránsito</span>
                </div>

                {/* Mostrar el componente según el estado del switch */}
                {checkedDespachos ? (
                  <ModeladoRefineriaDespachosList
                    despachos={despachosEnTransito}
                  />
                ) : (
                  <ModeladoRefineriaDespachosList
                    despachos={despachosEnRefineria}
                  />
                )}
              </div>
            </motion.div>
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
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-2 ">
            <motion.div
              initial={{
                opacity: 0,
                y: 80,
                scale: 0.85,
                rotate: -8,
                filter: "blur(16px) grayscale(60%)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                filter: "blur(0px) grayscale(0%)",
              }}
              transition={{ duration: 0.9, type: "spring", bounce: 0.45 }}
              className="card p-3 lg-h-fullScreen overflow-auto"
            >
              <AnimatedTitle text="Recepciones" />

              {lineaRecepcions.map((lineaRecepcion) => (
                <div key={lineaRecepcion.id} className="mb-2">
                  <ModeladoRefineriaLineaCarga
                    lineaRecepcion={lineaRecepcion}
                    recepcions={recepcions}
                  />
                </div>
              ))}
            </motion.div>
          </div>
          {/* Almacenamiento Crudo */}
          <div className="col-12 md:col-6 lg:col-2">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
              className="card p-3 lg-h-fullScreen overflow-auto"
            >
              <AnimatedTitle text="Materia Prima" />
              {tanques
                .filter((tanque) => tanque.almacenamientoMateriaPrimaria)
                .map((tanque) => (
                  <div key={tanque.id} className="mb-2">
                    <ModeladoRefineriaTanque
                      tanque={tanque}
                      recepcions={recepcions}
                      corteRefinacions={corteRefinacions}
                      chequeoCantidads={chequeoCantidads}
                      salida={false}
                    />
                  </div>
                ))}
            </motion.div>
          </div>

          {/* Torres de Procesamiento */}
          <div className="col-12 md:col-6 lg:col-3">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
              className="card p-3 lg-h-fullScreen overflow-auto"
            >
              <AnimatedTitle text="Torres de Procesamiento" />
              <div className="grid">
                {torresDestilacions.map((torre) => (
                  <div key={torre.id} className="col-12 md:col-12">
                    <ModeladoRefineriaTorre
                      torre={torre}
                      corteRefinacions={corteRefinacions}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Almacenamiento de Productos */}
          <div className="col-12 md:col-6 lg:col-3">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
              className="card p-3 lg-h-fullScreen overflow-auto"
            >
              <AnimatedTitle text="Derivados" />
              <div className="grid">
                {tanquesFiltradosOrdenados.map((tanque) => (
                  <div key={tanque.id} className="mb-2">
                    <ModeladoRefineriaTanque
                      tanque={tanque}
                      despachos={despachos}
                      chequeoCantidads={chequeoCantidads}
                      corteRefinacions={corteRefinacions}
                      salida={true}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Línea de Despacho */}
          <div className="col-12 md:col-6 lg:col-2">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
              className="card p-3 lg-h-fullScreen overflow-auto"
            >
              <AnimatedTitle text="Despachos" />

              {lineaDespachos.map((lineaDespacho) => (
                <div key={lineaDespacho.id} className="mb-2">
                  <ModeladoRefineriaLineaDespacho
                    lineaDespacho={lineaDespacho}
                    despachos={despachos}
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* {refinacions.map((refinacion) => (
          <div key={refinacion.id} className="mb-2">
            <pre>{JSON.stringify(refinacion, null, 2)}</pre>
            <div className="card p-3">
              <p>
                <strong>Descripción:</strong> {refinacion.descripcion}
              </p>
              <p>
                <strong>Fecha de Inicio:</strong>{" "}
                {new Date(refinacion.fechaInicio).toLocaleString()}
              </p>
              <p>
                <strong>Fecha de Fin:</strong>{" "}
                {new Date(refinacion.fechaFin).toLocaleString()}
              </p>
              <p>
                <strong>Estado:</strong> {refinacion.estadoRefinacion}
              </p>
              <p>
                <strong>Operador:</strong> {refinacion.operador}
              </p>
              <p>
                <strong>Tanque:</strong> {refinacion.idTanque.nombre}
              </p>
              <p>
                <strong>Torre:</strong> {refinacion.idTorre.nombre}
              </p>
              <p>
                <strong>Producto:</strong> {refinacion.idProducto.nombre}
              </p>
              <p>
                <strong>Cantidad Total:</strong> {refinacion.cantidadTotal}
              </p>
              <h3 className="text-lg font-bold mt-3">Derivados:</h3>
              <ul>
                {refinacion.derivado.map((derivado) => (
                  <li key={derivado._id}>
                    <p>
                      <strong>Producto:</strong> {derivado.idProducto.nombre}
                    </p>
                    <p>
                      <strong>Porcentaje:</strong> {derivado.porcentaje}%
                    </p>
                  </li>
                ))}
              </ul>
              <ul>
                {refinacion.idRefinacionSalida.map((salida) => (
                  <li key={salida.id}>
                    <h1>salidas</h1>
                    <p>
                      <strong>Producto:</strong> {salida.idProducto.nombre}
                    </p>
                    <p>
                      <strong>Cantidad:</strong> {salida.cantidadTotal}
                    </p>
                    <p>
                      <strong>Descripción:</strong> {salida.descripcion}
                    </p>
                    <p>
                      <strong>Tanque:</strong> {salida.idTanque.nombre}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))} */}
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
              // rowClassName={(rowData) => {
              //   return {
              //     "bg-programado": rowData.estadoRecepcion === "PROGRAMADO",
              //     "bg-en-transito": rowData.estadoRecepcion === "EN_TRANSITO",
              //     "bg-en-refineria": rowData.estadoRecepcion === "EN_REFINERIA",
              //     "bg-completado": rowData.estadoRecepcion === "COMPLETADO",
              //     "bg-cancelado": rowData.estadoRecepcion === "CANCELADO",
              //   };
              // }}
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
        header="Detalles de Despachos"
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
              rowClassName={rowClassDespacho}
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

export default ModeladoRefineriaDashboard;
