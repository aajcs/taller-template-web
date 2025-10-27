"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  DataTableExpandedRows,
  DataTableFilterMeta,
} from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { useRefineriaStore } from "@/store/refineriaStore";
import CustomActionButtons from "@/components/common/CustomActionButtons";

import FacturaForm from "./FacturaForm";
import { Factura, LineaFactura, Tanque } from "@/libs/interfaces";
import { formatDateFH, formatDateFHSinHora } from "@/utils/dateUtils";
import { deleteFactura, getFacturas } from "@/app/api/facturaService";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { Tag } from "primereact/tag";
import FacturaTemplate from "@/components/pdf/templates/FacturaTemplate";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const FacturaList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [facturaFormDialog, setFacturaFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditFactura, setSelectedAuditFactura] =
    useState<Factura | null>(null);
  const [expandedRows, setExpandedRows] = useState<
    any[] | DataTableExpandedRows
  >([]);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchFacturas();
  }, [activeRefineria]);

  const fetchFacturas = async () => {
    try {
      const facturasDB = await getFacturas();
      if (facturasDB && Array.isArray(facturasDB.facturas)) {
        const filteredFacturas = facturasDB.facturas;
        setFacturas(filteredFacturas);
      } else {
        console.error("La estructura de facturasDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los facturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideFacturaFormDialog = () => {
    setFactura(null);
    setFacturaFormDialog(false);
  };

  const handleDeleteFactura = async () => {
    try {
      if (factura?.id) {
        await deleteFactura(factura.id);
        setFacturas(facturas.filter((val) => val.id !== factura.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Factura Eliminada",
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
      setFactura(null);
      setDeleteProductDialog(false);
    }
  };

  const openFacturaFormDialog = () => {
    setFactura(null); // Limpia la factura seleccionada
    setFacturaFormDialog(true);
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
      <CreateButton onClick={openFacturaFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Factura) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditFactura(data);
        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setFactura(data);
        setFacturaFormDialog(true);
      }}
      onDelete={(data) => {
        setFactura(data);
        setDeleteProductDialog(true);
      }}
      pdfTemplate={(props) => (
        <FacturaTemplate
          data={props.data}
          logoUrl="/layout/images/avatarHombre.png"
        />
      )}
      pdfFileName={`Recepcion${rowData.numeroFactura}.pdf`}
      pdfDownloadText="Descargar Recepcion"
    />
  );
  const rowExpansionTemplate = (data: Factura) => {
    return (
      <div className="orders-subtable">
        <h5>Items for {data.concepto}</h5>
        <DataTable value={data.idLineasFactura} responsiveLayout="scroll">
          <Column field="descripcion" header="Descripción" />
          <Column
            field="subTotal"
            header="Subtotal"
            body={(rowData: any) =>
              `$${rowData.subTotal.toLocaleString("de-DE")}`
            }
          />
          <Column field="idPartida.descripcion" header="ID Partida" />
        </DataTable>
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

  // Helper to map estado to severity
  const getSeverity = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return "warning";
      case "Aprobada":
        return "success";
      case "Rechazada":
        return "danger";
      default:
        return "info";
    }
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
          value={facturas}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay facturas disponibles"
          rowClassName={() => "animated-row"}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander style={{ width: "3em" }} />
          <Column body={actionBodyTemplate} />
          <Column field="numeroFactura" header="N° Factura" sortable />
          <Column field="concepto" header="Concepto" />
          <Column
            field="total"
            header="Total"
            sortable
            body={(rowData: Factura) =>
              `$${rowData.total.toLocaleString("de-DE")}`
            }
          />
          <Column
            field="fechaFactura"
            header="Fecha"
            sortable
            body={(rowData: Factura) =>
              formatDateFHSinHora(rowData.fechaFactura)
            }
          />
          <Column
            field="estado"
            header="Estado"
            body={(rowData: any) => (
              <Tag
                value={rowData.estado}
                severity={getSeverity(rowData.estado)}
              />
            )}
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
                onClick={handleDeleteFactura}
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
            {factura && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{factura.concepto}</b>?
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
                  Historial - {selectedAuditFactura?.concepto}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditFactura?.createdBy!}
          createdAt={selectedAuditFactura?.createdAt!}
          historial={selectedAuditFactura?.historial}
        />
        <Dialog
          visible={facturaFormDialog}
          style={{ width: "850px" }}
          header={`${factura ? "Editar" : "Agregar"} Recepción de tractomula.
`}
          modal
          onHide={hideFacturaFormDialog}
          content={() => (
            <FacturaForm
              factura={factura ?? undefined}
              hideFacturaFormDialog={hideFacturaFormDialog}
              facturas={facturas}
              setFacturas={setFacturas}
              setFactura={setFactura}
              showToast={showToast}
              facturaFormDialog={facturaFormDialog}
            />
          )}
        ></Dialog>
      </motion.div>
    </>
  );
};

export default FacturaList;
