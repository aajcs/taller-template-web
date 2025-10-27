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
import EmbarcacionForm from "./EmbarcacionForm";
import { formatDateFH } from "@/utils/dateUtils";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";

import { Embarcacion } from "@/libs/interfaces";
import {
  deleteEmbarcacionBK,
  getEmbarcacionsBK,
} from "@/app/api/bunkering/embarcacionBKService";

const EmbarcacionList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [embarcacions, setEmbarcacions] = useState<Embarcacion[]>([]);
  const [embarcacion, setEmbarcacion] = useState<Embarcacion | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [embarcacionFormDialog, setEmbarcacionFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditEmbarcacion, setSelectedAuditEmbarcacion] =
    useState<Embarcacion | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchEmbarcacions();
  }, [activeRefineria]);

  const fetchEmbarcacions = async () => {
    try {
      const embarcacionsDB = await getEmbarcacionsBK();
      if (embarcacionsDB && Array.isArray(embarcacionsDB.embarcacions)) {
        const filteredEmbarcacions = embarcacionsDB.embarcacions.filter(
          (embarcacion: Embarcacion) =>
            embarcacion.idBunkering.id === activeRefineria?.id
        );
        setEmbarcacions(filteredEmbarcacions);
      } else {
        console.error("La estructura de embarcacionsDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los embarcacions:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideEmbarcacionFormDialog = () => {
    setEmbarcacion(null);
    setEmbarcacionFormDialog(false);
  };

  const handleDeleteEmbarcacion = async () => {
    if (embarcacion?.id) {
      await deleteEmbarcacionBK(embarcacion.id);
      setEmbarcacions(embarcacions.filter((val) => val.id !== embarcacion.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Embarcacion Eliminada",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la torre de destilación",
        life: 3000,
      });
    }
    setEmbarcacion(null);
    setDeleteProductDialog(false);
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
      <Button
        type="button"
        icon="pi pi-user-plus"
        label="Agregar Nuevo"
        outlined
        className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
        onClick={() => setEmbarcacionFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: Embarcacion) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditEmbarcacion(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setEmbarcacion(rowData);
        data;
        setEmbarcacionFormDialog(true);
      }}
      onDelete={(data) => {
        setEmbarcacion(rowData);
        data;
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
  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        ref={dt}
        value={embarcacions}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay embarcacions disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="imo" header="IMO" sortable />
        <Column field="tipo" header="Tipo" sortable />
        <Column field="capacidad" header="Capacidad" sortable />
        <Column
          field="tanques"
          header="Tanques"
          body={(rowData: Embarcacion) =>
            rowData.tanques && rowData.tanques.length > 0
              ? rowData.tanques.map((t) => t.nombre).join(", ")
              : "Sin tanques"
          }
        />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Embarcacion) => formatDateFH(rowData.createdAt)}
          sortable
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Embarcacion) => formatDateFH(rowData.updatedAt)}
          sortable
        />
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
              onClick={handleDeleteEmbarcacion}
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
          {embarcacion && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{embarcacion.nombre}</b>?
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
                Historial - {selectedAuditEmbarcacion?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditEmbarcacion?.createdBy!}
        createdAt={selectedAuditEmbarcacion?.createdAt!}
        historial={selectedAuditEmbarcacion?.historial}
      />
      <Dialog
        visible={embarcacionFormDialog}
        style={{ width: "850px" }}
        header={`${embarcacion ? "Editar" : "Agregar"} Embarcacion`}
        modal
        onHide={hideEmbarcacionFormDialog}
        content={() => (
          <EmbarcacionForm
            embarcacion={embarcacion}
            hideEmbarcacionFormDialog={hideEmbarcacionFormDialog}
            embarcacions={embarcacions}
            setEmbarcacions={setEmbarcacions}
            setEmbarcacion={setEmbarcacion}
            showToast={showToast}
          />
        )}
      ></Dialog>
    </div>
  );
};

export default EmbarcacionList;
