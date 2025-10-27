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
import DespachoTemplate from "@/components/pdf/templates/DespachoTemplate";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

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
  const [mostrarTodas, setMostrarTodas] = useState(false);
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

  const openDespachoFormDialog = () => {
    setDespacho(null); // Limpia el despacho seleccionado
    setDespachoFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideDespachoFormDialog = () => {
    setDespacho(null);
    setDespachoFormDialog(false);
  };

  const handleDeleteDespacho = async () => {
    try {
      if (despacho?.id) {
        await deleteDespacho(despacho.id);
        setDespachos(despachos.filter((val) => val.id !== despacho.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Despacho Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el despacho",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setDespacho(null);
      setDeleteProductDialog(false);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  // Filtrado según mostrarTodas
  const despachosFiltrados = mostrarTodas
    ? despachos
    : despachos.filter(
        (d) =>
          d.estadoDespacho !== "COMPLETADO" && d.estadoDespacho !== "CANCELADO"
      );

  const renderHeader = () => (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2 w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
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
          icon={mostrarTodas ? "pi pi-eye-slash" : "pi pi-eye"}
          label={mostrarTodas ? "Ver solo activos" : "Ver todos"}
          className="p-button-secondary"
          onClick={() => setMostrarTodas((prev) => !prev)}
          style={{ minWidth: 160 }}
        />
      </div>
      <CreateButton onClick={openDespachoFormDialog} />
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
        setDespachoFormDialog(true);
      }}
      onDelete={(data) => {
        setDespacho(rowData);
        setDeleteProductDialog(true);
      }}
      pdfTemplate={(props) => (
        <DespachoTemplate
          data={props.data}
          logoUrl="/layout/images/avatarHombre.png"
        />
      )}
      pdfFileName={`Despacho${rowData.numeroDespacho}.pdf`}
      pdfDownloadText="Descargar Despacho"
    />
  );

  const showToast = (
    severity: "success" | "error" | "warn",
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
          value={despachosFiltrados}
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
            header="Cantidad a Despachar"
            body={(rowData: Despacho) =>
              ` ${Number(rowData.cantidadEnviada).toLocaleString("de-DE")}Bbl`
            }
          />
          <Column
            field="cantidadRecibida"
            header="Cantidad Despachada"
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
        </Dialog>
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
            toast={toast}
          />
        )}
      </motion.div>
    </>
  );
};

export default DespachoList;
