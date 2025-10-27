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
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";

import {
  getLineaRecepcions,
  deleteLineaRecepcion,
} from "@/app/api/lineaRecepcionService";
import LineaRecepcionForm from "./LineaRecepcionForm";
import { LineaRecepcion } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";

import CreateButton from "@/components/common/CreateButton";

import { handleFormError } from "@/utils/errorHandlers";


const LineaRecepcionList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [lineaRecepcions, setLineaRecepcions] = useState<LineaRecepcion[]>([]);
  const [lineaRecepcion, setLineaRecepcion] = useState<LineaRecepcion | null>(
    null
  );
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [lineaRecepcionFormDialog, setLineaRecepcionFormDialog] =
    useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditLineaRecepcion, setSelectedAuditLineaRecepcion] =
    useState<LineaRecepcion | null>(null);

  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchLineaRecepcions();
  }, [activeRefineria]);

  const fetchLineaRecepcions = async () => {
    try {
      const lineaRecepcionsDB = await getLineaRecepcions();
      if (lineaRecepcionsDB && Array.isArray(lineaRecepcionsDB.lineaCargas)) {
        const filteredLineaRecepcions = lineaRecepcionsDB.lineaCargas.filter(
          (lineaRecepcion: LineaRecepcion) =>
            lineaRecepcion.idRefineria.id === activeRefineria?.id
        );
        setLineaRecepcions(filteredLineaRecepcions);
      } else {
        console.error("La estructura de lineaRecepcionsDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los lineaRecepcions:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLineaRecepcionFormDialog = () => {
    setLineaRecepcion(null); // Limpia la línea seleccionada
    setLineaRecepcionFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideLineaRecepcionFormDialog = () => {
    setLineaRecepcion(null);
    setLineaRecepcionFormDialog(false);
  };

  const handleDeleteLineaRecepcion = async () => {
    try {
      if (lineaRecepcion?.id) {
        await deleteLineaRecepcion(lineaRecepcion.id);
        setLineaRecepcions(
          lineaRecepcions.filter((val) => val.id !== lineaRecepcion.id)
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Linea de Recepción Eliminada",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la Linea de Recepción",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLineaRecepcion(null);
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

      <CreateButton onClick={openLineaRecepcionFormDialog} />
    </div>
  );
  const actionBodyTemplate = (rowData: LineaRecepcion) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditLineaRecepcion(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setLineaRecepcion(data);
        setLineaRecepcionFormDialog(true);
      }}
      onDelete={(data) => {
        setLineaRecepcion(data);
        setDeleteProductDialog(true);
      }}
    />
  );

  const showToast = (
    severity: "success" | "error",
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
          value={lineaRecepcions}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay linea Recepcion disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          {/* <Column
          field="ubicacion"
          header="Ubicación"
          sortable

        /> */}

          <Column field="estado" header="Estado" sortable />
          {/* <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: LineaRecepcion) => formatDateFH(rowData.createdAt)}
          sortable

        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: LineaRecepcion) => formatDateFH(rowData.updatedAt)}
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
                onClick={handleDeleteLineaRecepcion}
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
            {lineaRecepcion && (
              <span>
                ¿Estás seguro de que deseas eliminar{" "}
                <b>{lineaRecepcion.nombre}</b>?
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
                  Historial - {selectedAuditLineaRecepcion?.nombre}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditLineaRecepcion?.createdBy!}
          createdAt={selectedAuditLineaRecepcion?.createdAt!}
          historial={selectedAuditLineaRecepcion?.historial}
        />
        <Dialog
          visible={lineaRecepcionFormDialog}
          style={{ width: "850px" }}
          header={`${
            lineaRecepcion ? "Editar" : "Agregar"
          } Recepción de tractomula.
`}
          modal
          onHide={hideLineaRecepcionFormDialog}
          content={() => (
            <LineaRecepcionForm
              lineaRecepcion={lineaRecepcion}
              hideLineaRecepcionFormDialog={hideLineaRecepcionFormDialog}
              lineaRecepcions={lineaRecepcions}
              setLineaRecepcions={setLineaRecepcions}
              setLineaRecepcion={setLineaRecepcion}
              showToast={showToast}
              toast={toast}
            />
          )}
        ></Dialog>
      </motion.div>
    </>
  );
};

export default LineaRecepcionList;
