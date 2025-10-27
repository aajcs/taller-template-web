"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { useRefineriaStore } from "@/store/refineriaStore";
import ChequeoCalidadForm from "./ChequeoCalidadForm";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";

import { formatDateFH } from "@/utils/dateUtils";
import {
  deleteChequeoCalidad,
  getChequeoCalidads,
} from "@/app/api/chequeoCalidadService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ChequeoCalidad } from "@/libs/interfaces";
import ChequeoCalidadTemplate from "@/components/pdf/templates/ChequeoCalidadTemplate";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const ChequeoCalidadList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [chequeoCalidads, setChequeoCalidads] = useState<ChequeoCalidad[]>([]);
  const [chequeoCalidad, setChequeoCalidad] = useState<ChequeoCalidad | null>(
    null
  );
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [chequeoCalidadFormDialog, setChequeoCalidadFormDialog] =
    useState(false);
  const [onDuplicate, setOnDuplicate] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditChequeoCalidad, setSelectedAuditChequeoCalidad] =
    useState<ChequeoCalidad | null>(null);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchChequeoCalidads();
  }, [activeRefineria]);

  const fetchChequeoCalidads = async () => {
    try {
      const chequeoCalidadsDB = await getChequeoCalidads();
      if (
        chequeoCalidadsDB &&
        Array.isArray(chequeoCalidadsDB.chequeoCalidads)
      ) {
        const filteredChequeoCalidads =
          chequeoCalidadsDB.chequeoCalidads.filter(
            (chequeoCalidad: ChequeoCalidad) =>
              chequeoCalidad.idRefineria.id === activeRefineria?.id
          );
        setChequeoCalidads(filteredChequeoCalidads);
      } else {
        console.error("La estructura de chequeoCalidadsDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los chequeoCalidads:", error);
    } finally {
      setLoading(false);
    }
  };

  const openChequeoCalidadFormDialog = () => {
    setChequeoCalidad(null); // Limpia el chequeo seleccionado
    setOnDuplicate(false); // Limpia el estado de duplicado si aplica
    setChequeoCalidadFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideChequeoCalidadFormDialog = () => {
    setChequeoCalidad(null);
    setOnDuplicate(false);
    setChequeoCalidadFormDialog(false);
  };

  const handleDeleteChequeoCalidad = async () => {
    try {
      console.log("Chequeo de Calidad a eliminar:", chequeoCalidad);
      if (chequeoCalidad?.id) {
        await deleteChequeoCalidad(chequeoCalidad.id);
        setChequeoCalidads(
          chequeoCalidads.filter((val) => val.id !== chequeoCalidad.id)
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Chequeo de Calidad Eliminada",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el chequeo de calidad",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setChequeoCalidad(null);
      setDeleteProductDialog(false);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <span className="p-input-icon-left w-full sm:w-20rem flex-order-1 sm:flex-order-0">
        <i className="pi pi-search"></i>
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Búsqueda Global"
          className="w-full"
        />
      </span>
      <CreateButton onClick={openChequeoCalidadFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: ChequeoCalidad) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditChequeoCalidad(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setChequeoCalidad(data);
        setChequeoCalidadFormDialog(true);
      }}
      onDelete={(data) => {
        setChequeoCalidad(data);
        setDeleteProductDialog(true);
      }}
      onDuplicate={(data) => {
        setChequeoCalidad(data);
        setOnDuplicate(true);
        setChequeoCalidadFormDialog(true);
      }}
      pdfTemplate={(props) => (
        <ChequeoCalidadTemplate {...props} logoUrl="/logo.png" />
      )}
      pdfFileName={`ChequeoCalidad${rowData.numeroChequeoCalidad}.pdf`}
      pdfDownloadText="Descargar Chequeo"
    />
  );

  const showToast = (
    severity: "success" | "error" | "info" | "warn",
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }
  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 40,
          filter: "blur(8px)",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={chequeoCalidads}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay chequeos de calidad disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column
            field="numeroChequeoCalidad"
            header="Número de Chequeo"
            sortable
          />
          <Column field="aplicar.tipo" header="Operacion" sortable />
          <Column
            header="Referencia"
            body={(rowData: ChequeoCalidad) => {
              const referencia = rowData.aplicar?.idReferencia;

              if (!referencia) {
                return "Sin Referencia";
              }

              // Renderizar según el tipo de referencia
              switch (rowData.aplicar?.tipo) {
                case "Recepcion":
                  return `ID Guía: ${referencia.idGuia}`;
                case "Tanque":
                  return `Nombre: ${referencia.nombre}`;
                case "Despacho":
                  return `ID Guía: ${referencia.idGuia}`;
                default:
                  return "Tipo Desconocido";
              }
            }}
          />
          <Column field="idProducto.nombre" header="Producto" sortable />
          {/* <Column field="idOperador.nombre" header="Operador" sortable /> */}
          <Column
            field="fechaChequeo"
            header="Fecha de Chequeo"
            body={(rowData: ChequeoCalidad) =>
              formatDateFH(rowData.fechaChequeo)
            }
            sortable
          />
          <Column field="gravedadAPI" header="Gravedad API" sortable />
          <Column field="azufre" header="Azufre (%)" sortable />
          <Column field="contenidoAgua" header="Agua (%)" sortable />
          <Column
            field="puntoDeInflamacion"
            header="Punto Inflamación"
            sortable
          />
          {/* <Column field="cetano" header="Índice Cetano" sortable /> */}
          <Column field="estado" header="Estado" sortable />
          {/* <Column
          field="createdAt"
          header="Creado en"
          body={(rowData: ChequeoCalidad) => formatDateFH(rowData.createdAt)}
          sortable
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: ChequeoCalidad) => formatDateFH(rowData.updatedAt)}
          sortable
        /> */}
        </DataTable>

        <Dialog
          visible={deleteProductDialog}
          style={{ width: "450px" }}
          header="Confirmar"
          modal
          footer={
            <>
              <Button
                label="No"
                icon="pi pi-times"
                text
                onClick={hideDeleteProductDialog}
              />
              <Button
                label="Sí"
                icon="pi pi-check"
                text
                onClick={handleDeleteChequeoCalidad}
              />
            </>
          }
          onHide={hideDeleteProductDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {chequeoCalidad && (
              <span>
                ¿Estás seguro de que deseas eliminar el chequeo de calidad con
                el número de chequeo{" "}
                <b>{chequeoCalidad.numeroChequeoCalidad}</b>?
              </span>
            )}
          </div>
        </Dialog>
        <AuditHistoryDialog
          visible={auditDialogVisible}
          onHide={() => setAuditDialogVisible(false)}
          title={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                  Historial -{" "}
                  {selectedAuditChequeoCalidad?.numeroChequeoCalidad}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditChequeoCalidad?.createdBy!}
          createdAt={selectedAuditChequeoCalidad?.createdAt!}
          historial={selectedAuditChequeoCalidad?.historial}
        />
        <Dialog
          visible={chequeoCalidadFormDialog}
          style={{ width: "70vw" }}
          header={`${chequeoCalidad ? "Editar" : "Agregar"} Chequeo de Calidad`}
          modal
          onHide={hideChequeoCalidadFormDialog}
          content={() => (
            <ChequeoCalidadForm
              chequeoCalidad={chequeoCalidad}
              hideChequeoCalidadFormDialog={hideChequeoCalidadFormDialog}
              chequeoCalidads={chequeoCalidads}
              setChequeoCalidads={setChequeoCalidads}
              setChequeoCalidad={setChequeoCalidad}
              showToast={showToast}
              onDuplicate={onDuplicate}
              setOnDuplicate={setOnDuplicate}
              toast={toast}
            />
          )}
        >
          {/* <ChequeoCalidadForm
          chequeoCalidad={chequeoCalidad}
          hideChequeoCalidadFormDialog={hideChequeoCalidadFormDialog}
          chequeoCalidads={chequeoCalidads}
          setChequeoCalidads={setChequeoCalidads}
          setChequeoCalidad={setChequeoCalidad}
          showToast={showToast}
        /> */}
        </Dialog>
      </motion.div>
    </>
  );
};

export default ChequeoCalidadList;
