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
import { deleteAbono, getAbonos } from "@/app/api/abonoService";
import AbonoForm from "./AbonoForm";
import { formatDateFH } from "@/utils/dateUtils";
import { Abono } from "@/libs/interfaces/contratoInterface";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import AbonoTemplate from "@/components/pdf/templates/AbonoTemplate";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

interface AbonoListProps {
  tipoAbono: string;
}
const AbonoList = ({ tipoAbono }: AbonoListProps) => {
  const { activeRefineria } = useRefineriaStore();
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [abono, setAbono] = useState<Abono | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [abonoFormDialog, setAbonoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditAbono, setSelectedAuditAbono] = useState<Abono | null>(
    null
  );
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchAbonos();
  }, [activeRefineria]);

  const fetchAbonos = async () => {
    try {
      const abonosDB = await getAbonos();
      if (abonosDB && Array.isArray(abonosDB.abonos)) {
        const filteredAbonos = abonosDB.abonos.filter(
          (abono: Abono) =>
            abono.idRefineria?.id === activeRefineria?.id &&
            abono.tipoAbono === tipoAbono
        );
        setAbonos(filteredAbonos);
      } else {
        console.error("La estructura de abonosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los abonos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAbonoFormDialog = () => {
    setAbono(null); // Limpia el abono seleccionado
    setAbonoFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideAbonoFormDialog = () => {
    setAbono(null);
    setAbonoFormDialog(false);
  };

  const handleDeleteAbono = async () => {
    try {
      if (abono?.id) {
        await deleteAbono(abono.id);
        setAbonos(abonos.filter((val) => val.id !== abono.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Abono Eliminada",
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
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setAbono(null);
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
      <CreateButton onClick={openAbonoFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Abono) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditAbono(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setAbono(rowData);
        data;
        setAbonoFormDialog(true);
      }}
      onDelete={(data) => {
        setAbono(rowData);
        data;
        setDeleteProductDialog(true);
      }}
      pdfTemplate={(props) => (
        <AbonoTemplate
          data={props.data}
          logoUrl="/layout/images/avatarHombre.png"
        />
      )}
      pdfFileName={`Despacho${rowData.numeroAbono}.pdf`}
      pdfDownloadText="Descargar Despacho"
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
          value={abonos}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay abonos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="numeroAbono" header="N° Abono" sortable />
          <Column
            field="monto"
            header="Monto"
            sortable
            body={(rowData: Abono) =>
              `$${rowData.monto.toLocaleString("de-DE")}`
            }
          />
          <Column
            field="fecha"
            header="Fecha"
            body={(rowData: Abono) => formatDateFH(rowData.fecha)}
            sortable
          />
          <Column field="tipoOperacion" header="Tipo Operación" sortable />
          <Column field="referencia" header="Referencia" />
          <Column field="idContrato.numeroContrato" header="N° Contrato" />
          {/* <Column field="idRefineria.nombre" header="Refinería" /> */}
          {/* <Column field="createdBy.nombre" header="Creado Por" />
          <Column
            field="createdAt"
            header="Fecha de Creación"
            body={(rowData: Abono) => formatDateFH(rowData.createdAt)}
          />
          <Column
            field="updatedAt"
            header="Última Actualización"
            body={(rowData: Abono) => formatDateFH(rowData.updatedAt)}
          /> */}
          {/* <Column
          field="estado"
          header="Estado"
        
          style={{ width: "20%" }}
        />
        <Column
          field="eliminado"
          header="Eliminado"
        
          style={{ width: "20%" }}
        />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Abono) => formatDateFH(rowData.createdAt)}
        
          style={{ width: "20%" }}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Abono) => formatDateFH(rowData.updatedAt)}
        
          style={{ width: "20%" }}
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
                onClick={handleDeleteAbono}
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
            {abono && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{abono.numeroAbono}</b>?
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
                  Historial - {selectedAuditAbono?.numeroAbono}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditAbono?.createdBy!}
          createdAt={selectedAuditAbono?.createdAt!}
          historial={selectedAuditAbono?.historial}
        />
        <Dialog
          visible={abonoFormDialog}
          style={{ width: "850px" }}
          header={`${abono ? "Editar" : "Agregar"} Abono`}
          modal
          onHide={hideAbonoFormDialog}
          content={
            <AbonoForm
              abono={abono}
              tipoAbono={tipoAbono}
              hideAbonoFormDialog={hideAbonoFormDialog}
              abonos={abonos}
              setAbonos={setAbonos}
              setAbono={setAbono}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default AbonoList;
