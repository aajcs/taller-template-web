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
import ContratoForm from "./ContratoForm";
import { formatDateFH } from "@/utils/dateUtils";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { ContratoBK } from "@/libs/interfaces";
import {
  deleteContratoBK,
  getContratosBK,
} from "@/app/api/bunkering/contratoBKService";
interface ContratoListProps {
  tipoContrato: string;
}

const ContratoList = ({ tipoContrato }: ContratoListProps) => {
  const { activeRefineria } = useRefineriaStore();
  const [contratos, setContratos] = useState<ContratoBK[]>([]);
  const [contrato, setContrato] = useState<ContratoBK | null>(null);
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
    useState<ContratoBK | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchContratos();
  }, [activeRefineria]);

  const fetchContratos = async () => {
    try {
      const contratosDB = await getContratosBK();
      if (contratosDB && Array.isArray(contratosDB.contratos)) {
        const filteredContratos = contratosDB.contratos.filter(
          (contrato: ContratoBK) =>
            contrato.idBunkering.id === activeRefineria?.id &&
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

  const handleDeleteContrato = async () => {
    if (contrato?.id) {
      await deleteContratoBK(contrato.id);
      setContratos(contratos.filter((val) => val.id !== contrato.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Contrato Eliminada",
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
    setContrato(null);
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
        onClick={() => setContratoFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: ContratoBK) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditContrato(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setContrato(rowData);
        data;
        setContratoFormDialog(true);
      }}
      onDelete={(data) => {
        setContrato(rowData);
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

  const rowExpansionTemplate = (data: any) => {
    return (
      <div className="orders-subtable">
        <h5>Items for {data.name}</h5>
        <DataTable
          value={data.idItems}
          responsiveLayout="scroll"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column field="producto.nombre" header="Producto" />
          <Column field="idTipoProducto.nombre" header="Tipo de Producto" />
          <Column field="clasificacion" header="Clasificación" />
          <Column field="gravedadAPI" header="Gravedad API" />
          <Column field="azufre" header="Azufre" />

          <Column field="contenidoAgua" header="Contenido de Agua" />
          <Column field="puntoDeInflamacion" header="Punto De Inflamación" />

          <Column field="cantidad" header="Cantidad" />
          <Column field="precioUnitario" header="Precio Unitario" />
          <Column
            header="Total"
            body={(rowData: any) => rowData.cantidad * rowData.precioUnitario}
          />
          <Column field="convenio" header="Convenio" />
          <Column field="montoTransporte" header="Monto Transporte" />
        </DataTable>
      </div>
    );
  };
  return (
    <div className="card">
      <Toast ref={toast} />

      <DataTable
        ref={dt}
        value={contratos}
        header={renderHeader()}
        paginator
        rows={10}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay contratos disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column expander style={{ width: "3em" }} />
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        {/* <Column field="tipoContrato" header="Tipo de Contrato" sortable /> */}
        <Column field="numeroContrato" header="Número de Contrato" sortable />
        {/* <Column field="descripcion" header="Descripción de Contrato" />
        <Column
          field="montoTotal"
          header="Monto Total"
          body={(rowData: Contrato) => rowData.montoTotal?.toFixed(2)}
        /> */}
        <Column
          field="condicionesPago.tipo"
          header="Tipo de Condiciones de Pago"
        />
        <Column
          field="condicionesPago.plazo"
          header="Plazo de Condiciones de Pago"
        />

        <Column field="estadoEntrega" header="Estado de Entrega" />
        <Column field="estadoContrato" header="Estado de Contrato" />
        {/* <Column field="estado" header="Estado" /> */}
        <Column
          field="idContacto.nombre"
          header="Nombre de Contacto"
          sortable
        />
        <Column
          field="fechaInicio"
          header="Fecha de Inicio"
          body={(rowData: ContratoBK) => formatDateFH(rowData.fechaInicio)}
          sortable
        />
        <Column
          field="fechaFin"
          header="Fecha de Fin"
          body={(rowData: ContratoBK) => formatDateFH(rowData.fechaFin)}
          sortable
        />
        {/* <Column
          field="brent"
          header="Brent"
          body={(rowData: Contrato) => rowData.brent?.toFixed(2)}
          sortable
        />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Contrato) => formatDateFH(rowData.createdAt)}
          sortable
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Contrato) => formatDateFH(rowData.updatedAt)}
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
      {/* <Dialog
        visible={contratoFormDialog}
        style={{ width: "80vw", backgroundColor: "red" }}
        header={
          <div className="mb-2 text-center md:text-left surface-50">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {contrato ? "Editar" : "Agregar"} Contrato de {tipoContrato}
              </h2>
            </div>
          </div>
        }
        headerStyle={{
          backgroundColor: "transparent",
        }}
        contentStyle={{
          backgroundColor: "transparent",
        }}
        modal
        onHide={hideContratoFormDialog}
        className="card   surface-50 p-1  border-round shadow-2xl"
        footer={
          <div className="flex justify-content-end">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              text
              onClick={hideContratoFormDialog}
            />
          </div>
        }
      > */}

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

      {/* </Dialog> */}
    </div>
  );
};

export default ContratoList;
