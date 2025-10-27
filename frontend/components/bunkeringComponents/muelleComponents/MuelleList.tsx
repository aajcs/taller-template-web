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
import MuelleForm from "./MuelleForm";
import { formatDateFH } from "@/utils/dateUtils";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { Muelle } from "@/libs/interfaces";
import {
  deleteMuelleBK,
  getMuellesBK,
} from "@/app/api/bunkering/muelleBKService";

const MuelleList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [muelles, setMuelles] = useState<Muelle[]>([]);
  const [muelle, setMuelle] = useState<Muelle | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [muelleFormDialog, setMuelleFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditMuelle, setSelectedAuditMuelle] = useState<Muelle | null>(
    null
  );
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchMuelles();
  }, [activeRefineria]);

  const fetchMuelles = async () => {
    try {
      const muellesDB = await getMuellesBK();
      if (muellesDB && Array.isArray(muellesDB.muelles)) {
        const filteredMuelles = muellesDB.muelles.filter(
          (muelle: Muelle) => muelle.idBunkering.id === activeRefineria?.id
        );
        setMuelles(filteredMuelles);
      } else {
        console.error("La estructura de muellesDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los muelles:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideMuelleFormDialog = () => {
    setMuelle(null);
    setMuelleFormDialog(false);
  };

  const handleDeleteMuelle = async () => {
    if (muelle?.id) {
      await deleteMuelleBK(muelle.id);
      setMuelles(muelles.filter((val) => val.id !== muelle.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Muelle Eliminada",
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
    setMuelle(null);
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
        onClick={() => setMuelleFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: Muelle) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditMuelle(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setMuelle(rowData);
        data;
        setMuelleFormDialog(true);
      }}
      onDelete={(data) => {
        setMuelle(rowData);
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
        value={muelles}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay muelles disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        <Column field="nombre" header="Nombre" />
        <Column field="nit" header="NIT" />
        <Column field="correo" header="Correo" />
        <Column field="telefono" header="Teléfono" />
        <Column field="ubicacion" header="Ubicación" />
        <Column field="legal" header="Representante Legal" />
        <Column field="estado" header="Estado" />
        {/* <Column field="eliminado" header="Eliminado" />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Muelle) => formatDateFH(rowData.createdAt)}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Muelle) => formatDateFH(rowData.updatedAt)}
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
              onClick={handleDeleteMuelle}
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
          {muelle && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{muelle.nombre}</b>?
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
                Historial - {selectedAuditMuelle?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditMuelle?.createdBy!}
        createdAt={selectedAuditMuelle?.createdAt!}
        historial={selectedAuditMuelle?.historial}
      />
      <Dialog
        visible={muelleFormDialog}
        style={{ width: "850px" }}
        header={`${muelle ? "Editar" : "Agregar"} Muelle`}
        modal
        onHide={hideMuelleFormDialog}
        content={
          <MuelleForm
            muelle={muelle}
            hideMuelleFormDialog={hideMuelleFormDialog}
            muelles={muelles}
            setMuelles={setMuelles}
            setMuelle={setMuelle}
            showToast={showToast}
          />
        }
      ></Dialog>
    </div>
  );
};

export default MuelleList;
