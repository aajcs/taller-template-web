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
import { deleteDespacho, getDespachos } from "@/app/api/despachoService";
import { Despacho } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import DespachoForm from "./DespachoForm";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
const DespachoList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [despacho, setDespacho] = useState<Despacho | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [despachoFormDialog, setDespachoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditDespacho, setSelectedAuditDespacho] =
    useState<Despacho | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchDespachos();
  }, [activeRefineria]);

  const fetchDespachos = async () => {
    try {
      const despachosDB = await getDespachos();
      if (despachosDB && Array.isArray(despachosDB.despachos)) {
        const filteredDespachos = despachosDB.despachos.filter(
          (despacho: Despacho) =>
            despacho.idRefineria.id === activeRefineria?.id
        );
        setDespachos(filteredDespachos);
      } else {
        console.error("La estructura de despachosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los despachos:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideDespachoFormDialog = () => {
    setDespacho(null);
    setDespachoFormDialog(false);
  };

  const handleDeleteDespacho = async () => {
    if (despacho?.id) {
      await deleteDespacho(despacho.id);
      setDespachos(despachos.filter((val) => val.id !== despacho.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Despacho Eliminada",
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
    setDespacho(null);
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
        onClick={() => setDespachoFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: Despacho) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditDespacho(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setDespacho(rowData);
        data;
        setDespachoFormDialog(true);
      }}
      onDelete={(data) => {
        setDespacho(rowData);
        data;
        setDeleteProductDialog(true);
      }}
    />
  );
  const showToast = (
    severity: "success" | "error" | "warn",
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
        value={despachos}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay despachos disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column body={actionBodyTemplate} />
        <Column field="idGuia" header="ID de la Guía" sortable />
        <Column field="placa" header="Placa" />
        <Column field="nombreChofer" header="Nombre del Chofer" sortable />
        {/* <Column field="apellidoChofer" header="Apellido del Chofer" sortable /> */}
        <Column
          field="idContrato.numeroContrato"
          header="Número de Contrato"
          sortable
        />
        <Column
          field="idContratoItems.producto.nombre"
          header="Nombre del Producto"
        />
        <Column
          field="cantidadEnviada"
          header="Cantidad a Depachar"
          body={(rowData: Despacho) =>
            ` ${Number(rowData.cantidadEnviada).toLocaleString("de-DE")}Bbl`
          }
        />
        <Column
          field="cantidadRecibida"
          header="Cantidad Depachada"
          body={(rowData: Despacho) =>
            ` ${Number(rowData.cantidadRecibida).toLocaleString("de-DE")}Bbl`
          }
        />

        <Column
          field="idLineaDespacho.nombre"
          header="Nombre de la Línea"
          sortable
        />
        <Column field="idTanque.nombre" header="ID del Tanque" sortable />
        <Column
          field="fechaSalida"
          header="Fecha de Salida"
          body={(rowData: Despacho) => formatDateFH(rowData.fechaSalida)}
        />
        <Column
          field="fechaLlegada"
          header="Fecha de Llegada"
          body={(rowData: Despacho) => formatDateFH(rowData.fechaLlegada)}
        />
        <Column
          field="fechaInicioDespacho"
          header="Fecha de Inicio de Descarga"
          body={(rowData: Despacho) =>
            formatDateFH(rowData.fechaInicioDespacho)
          }
        />
        <Column
          field="fechaFinDespacho"
          header="Fecha de Fin de Descarga"
          body={(rowData: Despacho) => formatDateFH(rowData.fechaFinDespacho)}
        />

        <Column field="estadoDespacho" header="Estado de la Despacho" />
        <Column field="estadoCarga" header="Estado de la Carga" />
        {/* <Column field="estado" header="Estado" />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Despacho) => formatDateFH(rowData.createdAt)}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Despacho) => formatDateFH(rowData.updatedAt)}
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
              onClick={handleDeleteDespacho}
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
          {despacho && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{despacho.idGuia}</b>?
            </span>
          )}
        </div>
      </Dialog>{" "}
      <AuditHistoryDialog
        visible={auditDialogVisible}
        onHide={() => setAuditDialogVisible(false)}
        title={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                Historial - {selectedAuditDespacho?.numeroDespacho}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditDespacho?.createdBy!}
        createdAt={selectedAuditDespacho?.createdAt!}
        historial={selectedAuditDespacho?.historial}
      />
      {despachoFormDialog && (
        <DespachoForm
          despacho={despacho}
          despachoFormDialog={despachoFormDialog}
          hideDespachoFormDialog={hideDespachoFormDialog}
          despachos={despachos}
          setDespachos={setDespachos}
          setDespacho={setDespacho}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default DespachoList;
