"use client";
import React, { useEffect, useRef, useState } from "react";
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
import { deleteContrato, getContratos } from "@/app/api/contratoService";
import ContratoForm from "./ContratoForm";
import { formatDateFH } from "@/utils/dateUtils";
import { Contrato } from "@/libs/interfaces";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import ContratoTemplate from "@/components/pdf/templates/ContratoTemplate";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

interface ContratoListProps {
  tipoContrato: string;
}

const ContratoList = ({ tipoContrato }: ContratoListProps) => {
  const { activeRefineria } = useRefineriaStore();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [contratoFormDialog, setContratoFormDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<
    any[] | DataTableExpandedRows
  >([]);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditContrato, setSelectedAuditContrato] =
    useState<Contrato | null>(null);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchContratos();
  }, [activeRefineria]);

  const fetchContratos = async () => {
    try {
      const contratosDB = await getContratos();
      if (contratosDB && Array.isArray(contratosDB.contratos)) {
        const filteredContratos = contratosDB.contratos.filter(
          (contrato: Contrato) =>
            contrato.idRefineria.id === activeRefineria?.id &&
            contrato.tipoContrato === tipoContrato
        );
        setContratos(filteredContratos);
      } else {
        console.error("La estructura de contratosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los contratos:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideContratoFormDialog = () => {
    setContrato(null);
    setContratoFormDialog(false);
  };

  const openContratoFormDialog = () => {
    setContrato(null); // Limpia el contrato seleccionado
    setContratoFormDialog(true);
  };

  const handleDeleteContrato = async () => {
    try {
      if (contrato?.id) {
        await deleteContrato(contrato.id);
        setContratos(contratos.filter((val) => val.id !== contrato.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contrato Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el contrato",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setContrato(null);
      setDeleteProductDialog(false);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  // Filtrado según mostrarTodas
  const contratosFiltrados = mostrarTodas
    ? contratos
    : contratos.filter(
        (c) =>
          c.estadoContrato === "Activo" &&
          c.estadoEntrega !== "Entregado" &&
          c.estadoEntrega !== "Cancelado"
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
      <CreateButton onClick={openContratoFormDialog} />
    </div>
  );

  const rowExpansionTemplate = (data: any) => {
    return (
      <div className="orders-subtable">
        <h5>Items for {data.name}</h5>
        <DataTable value={data.idItems} responsiveLayout="scroll">
          <Column
            field="producto.nombre"
            header="Producto"
            body={(rowData: any) => rowData.producto?.nombre}
          />
          <Column
            field="idTipoProducto.nombre"
            header="Tipo de Producto"
            body={(rowData: any) => rowData.idTipoProducto?.nombre}
          />
          <Column
            field="clasificacion"
            header="Clasificación"
            body={(rowData: any) => rowData.clasificacion}
          />
          <Column
            field="gravedadAPI"
            header="Gravedad API"
            body={(rowData: any) => `${rowData.gravedadAPI} °API`}
          />
          <Column
            field="azufre"
            header="Azufre"
            body={(rowData: any) => `${rowData.azufre} %`}
          />
          <Column
            field="contenidoAgua"
            header="Contenido de Agua"
            body={(rowData: any) => `${rowData.contenidoAgua} %`}
          />
          <Column
            field="puntoDeInflamacion"
            header="Punto De Inflamación"
            body={(rowData: any) => `${rowData.puntoDeInflamacion} °C`}
          />
          <Column
            field="cantidad"
            header="Cantidad"
            body={(rowData: any) => `${rowData.cantidad} Bbl`}
          />
          <Column
            field="precioUnitario"
            header="Precio Unitario"
            body={(rowData: any) => `$${rowData.precioUnitario.toFixed(2)}`}
          />
          <Column
            header="Total"
            body={(rowData: any) =>
              `$${(rowData.cantidad * rowData.precioUnitario).toFixed(2)}`
            }
          />
          <Column
            field="convenio"
            header="Convenio"
            body={(rowData: any) => `$${rowData.convenio.toFixed(2)}`}
          />
          <Column
            field="montoTransporte"
            header="Monto Transporte"
            body={(rowData: any) => `$${rowData.montoTransporte.toFixed(2)}`}
          />
        </DataTable>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Contrato) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditContrato(data);
        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setContrato(rowData);
        setContratoFormDialog(true);
      }}
      onDelete={(data) => {
        setContrato(rowData);
        setDeleteProductDialog(true);
      }}
      pdfTemplate={(props) => (
        <ContratoTemplate
          data={props.data}
          logoUrl="/layout/images/avatarHombre.png"
        />
      )}
      pdfFileName={`Contrato${rowData.numeroContrato}.pdf`}
      pdfDownloadText="Descargar Contrato"
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
          value={contratosFiltrados}
          header={renderHeader()}
          paginator
          rows={10}
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay contratos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander />
          <Column body={actionBodyTemplate} />
          <Column field="numeroContrato" header="Número de Contrato" sortable />
          <Column field="estadoContrato" header="Estado del Contrato" />
          <Column field="estadoEntrega" header="Estado de Entrega" />
          <Column
            field="fechaInicio"
            header="Fecha de Inicio"
            body={(rowData: Contrato) => formatDateFH(rowData.fechaInicio)}
            sortable
          />
          <Column
            field="fechaFin"
            header="Fecha de Fin"
            body={(rowData: Contrato) => formatDateFH(rowData.fechaFin)}
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
                onClick={handleDeleteContrato}
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
            {contrato && (
              <span>
                ¿Estás seguro de que deseas eliminar el contrato de número{" "}
                <b>{contrato.numeroContrato}</b>?
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
                  Historial - {selectedAuditContrato?.numeroContrato}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditContrato?.createdBy!}
          createdAt={selectedAuditContrato?.createdAt!}
          historial={selectedAuditContrato?.historial}
        />
        {contratoFormDialog && (
          <ContratoForm
            contrato={contrato}
            contratoFormDialog={contratoFormDialog}
            hideContratoFormDialog={hideContratoFormDialog}
            contratos={contratos}
            setContratos={setContratos}
            setContrato={setContrato}
            showToast={showToast}
            tipoContrato={tipoContrato}
          />
        )}
      </motion.div>
    </>
  );
};

export default ContratoList;
