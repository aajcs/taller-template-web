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
import TanqueForm from "./TanqueForm";
import { useRefineriaStore } from "@/store/refineriaStore";
import { TanqueBK } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import {
  deleteTanqueBK,
  getTanquesBK,
} from "@/app/api/bunkering/tanqueBKService";

const TanqueList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [tanques, setTanques] = useState<TanqueBK[]>([]);
  const [tanque, setTanque] = useState<TanqueBK | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [tanqueFormDialog, setTanqueFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditTanque, setSelectedAuditTanque] =
    useState<TanqueBK | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);

  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchTanques();
  }, [activeRefineria]);

  const fetchTanques = async () => {
    try {
      const tanquesDB = await getTanquesBK();
      if (tanquesDB && Array.isArray(tanquesDB.tanques)) {
        const filteredTanques = tanquesDB.tanques.filter(
          (tanque: TanqueBK) => tanque.idBunkering.id === activeRefineria?.id
        );
        setTanques(filteredTanques);
      } else {
        console.error("La estructura de tanquesDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los tanques:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideTanqueFormDialog = () => {
    setTanque(null);
    setTanqueFormDialog(false);
  };

  const handleDeleteTanque = async () => {
    if (tanque?.id) {
      await deleteTanqueBK(tanque.id);
      setTanques(tanques.filter((val) => val.id !== tanque.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tanque Eliminada",
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
    setTanque(null);
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
        onClick={() => setTanqueFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: TanqueBK) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditTanque(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setTanque(rowData);
        data;
        setTanqueFormDialog(true);
      }}
      onDelete={(data) => {
        setTanque(rowData);
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
        value={tanques}
        rowGroupMode="subheader"
        groupRowsBy="idEmbarcacion.nombre"
        sortMode="single"
        sortField="idEmbarcacion.nombre"
        sortOrder={1}
        expandableRowGroups
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowGroupHeaderTemplate={(data) => (
          <span className="font-bold text-primary">
            Embarcación: {data.idEmbarcacion?.nombre || "-"}
          </span>
        )}
        rowGroupFooterTemplate={(data) => {
          const total = tanques.filter(
            (t) => t.idEmbarcacion?.nombre === data.idEmbarcacion?.nombre
          ).length;
          const totalAlmacenamiento = tanques
            .filter(
              (t) => t.idEmbarcacion?.nombre === data.idEmbarcacion?.nombre
            )
            .reduce((sum, t) => sum + (Number(t.almacenamiento) || 0), 0);
          return (
            <td colSpan={7}>
              <div className="flex flex-col md:flex-row justify-content-between w-full font-bold">
                <span>Total tanques: {total}</span>
                <span>Total almacenamiento: {totalAlmacenamiento}</span>
              </div>
            </td>
          );
        }}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay tanques disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column
          field="idEmbarcacion.nombre"
          header="Embarcación"
          style={{ display: "none" }}
        />
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="capacidad" header="Capacidad" sortable />
        <Column field="almacenamiento" header="Almacenamiento" sortable />
        <Column field="ubicacion" header="Ubicación" sortable />
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
              onClick={handleDeleteTanque}
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
          {tanque && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{tanque.nombre}</b>?
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
                Historial - {selectedAuditTanque?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditTanque?.createdBy!}
        createdAt={selectedAuditTanque?.createdAt!}
        historial={selectedAuditTanque?.historial}
      />
      <Dialog
        visible={tanqueFormDialog}
        style={{ width: "850px" }}
        header={`${tanque ? "Editar" : "Agregar"} Tanque`}
        modal
        onHide={hideTanqueFormDialog}
        content={() => (
          <TanqueForm
            tanque={tanque}
            hideTanqueFormDialog={hideTanqueFormDialog}
            tanques={tanques}
            setTanques={setTanques}
            setTanque={setTanque}
            showToast={showToast}
          />
        )}
      ></Dialog>
    </div>
  );
};

export default TanqueList;
