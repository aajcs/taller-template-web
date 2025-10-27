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

import LineaDespachoForm from "./LineaDespachoForm";
import { LineaDespachoBK, Tanque } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";

import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import {
  deleteLineaDespachoBK,
  getLineaDespachosBK,
} from "@/app/api/bunkering/lineaDespachoBKService";

const LineaDespachoList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [lineaDespachos, setLineaDespachos] = useState<LineaDespachoBK[]>([]);
  const [lineaDespacho, setLineaDespacho] = useState<LineaDespachoBK | null>(
    null
  );
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [lineaDespachoFormDialog, setLineaDespachoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditLineaDespacho, setSelectedAuditLineaDespacho] =
    useState<LineaDespachoBK | null>(null);

  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchLineaDespachos();
  }, [activeRefineria]);

  const fetchLineaDespachos = async () => {
    try {
      const lineaDespachosDB = await getLineaDespachosBK();
      if (lineaDespachosDB && Array.isArray(lineaDespachosDB.lineaDespachos)) {
        const filteredLineaDespachos = lineaDespachosDB.lineaDespachos.filter(
          (lineaDespacho: LineaDespachoBK) =>
            lineaDespacho.idBunkering.id === activeRefineria?.id
        );
        setLineaDespachos(filteredLineaDespachos);
      } else {
        console.error("La estructura de lineaDespachosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los lineaDespachos:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideLineaDespachoFormDialog = () => {
    setLineaDespacho(null);
    setLineaDespachoFormDialog(false);
  };

  const handleDeleteLineaDespacho = async () => {
    if (lineaDespacho?.id) {
      await deleteLineaDespachoBK(lineaDespacho.id);
      setLineaDespachos(
        lineaDespachos.filter((val) => val.id !== lineaDespacho.id)
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "LineaDespacho Eliminada",
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
    setLineaDespacho(null);
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
        onClick={() => setLineaDespachoFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: LineaDespachoBK) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditLineaDespacho(data);
        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setLineaDespacho(data);
        setLineaDespachoFormDialog(true);
      }}
      onDelete={(data) => {
        setLineaDespacho(data);
        setDeleteProductDialog(true);
      }}
    />
  );
  const productoBodyTemplate = (rowData: Tanque) => {
    const { idProducto } = rowData;
    return (
      <div>
        <span
          className={"customer-badge"}
          style={{ backgroundColor: `#${idProducto?.color}50` }}
        >
          {idProducto?.nombre}
        </span>
      </div>
    );
  };
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
        value={lineaDespachos}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay linea de despachos disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        <Column field="nombre" header="Nombre" />
        <Column field="idMuelle.nombre" header="Muelle" />
        <Column field="estado" header="Estado" />
        {/* <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: LineaDespacho) => formatDateFH(rowData.createdAt)}
          sortable
          style={{ width: "25%" }}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: LineaDespacho) => formatDateFH(rowData.updatedAt)}
          sortable
          style={{ width: "25%" }}
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
              onClick={handleDeleteLineaDespacho}
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
          {lineaDespacho && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{lineaDespacho.nombre}</b>
              ?
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
                Historial - {selectedAuditLineaDespacho?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditLineaDespacho?.createdBy!}
        createdAt={selectedAuditLineaDespacho?.createdAt!}
        historial={selectedAuditLineaDespacho?.historial}
      />
      <Dialog
        visible={lineaDespachoFormDialog}
        style={{ width: "850px" }}
        header={`${
          lineaDespacho ? "Editar" : "Agregar"
        } Recepción de tractomula.
`}
        modal
        onHide={hideLineaDespachoFormDialog}
        content={() => (
          <LineaDespachoForm
            lineaDespacho={lineaDespacho}
            hideLineaDespachoFormDialog={hideLineaDespachoFormDialog}
            lineaDespachos={lineaDespachos}
            setLineaDespachos={setLineaDespachos}
            setLineaDespacho={setLineaDespacho}
            showToast={showToast}
          />
        )}
      ></Dialog>
    </div>
  );
};

export default LineaDespachoList;
