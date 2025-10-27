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
import { getTanques, deleteTanque } from "@/app/api/tanqueService";
import { Tanque } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";

import CreateButton from "@/components/common/CreateButton";

import { handleFormError } from "@/utils/errorHandlers";


const TanqueList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [tanque, setTanque] = useState<Tanque | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [tanqueFormDialog, setTanqueFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditTanque, setSelectedAuditTanque] = useState<Tanque | null>(
    null
  );

  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchTanques();
  }, [activeRefineria]);

  const fetchTanques = async () => {
    try {
      const tanquesDB = await getTanques();
      if (tanquesDB && Array.isArray(tanquesDB.tanques)) {
        const filteredTanques = tanquesDB.tanques.filter(
          (tanque: Tanque) => tanque.idRefineria.id === activeRefineria?.id
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
    setTanque(null); // Limpia el estado del tanque seleccionado
    setTanqueFormDialog(false);
  };

  const openTanqueFormDialog = () => {
    setTanque(null); // Limpia el estado del tanque seleccionado
    setTanqueFormDialog(true);
  };
  const handleDeleteTanque = async () => {
    try {
      if (tanque?.id) {
        await deleteTanque(tanque.id);
        setTanques(tanques.filter((val) => val.id !== tanque.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tanque eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el tanque",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setTanque(null);
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
      <CreateButton onClick={openTanqueFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Tanque) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditTanque(data);
        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setTanque(rowData);
        setTanqueFormDialog(true);
      }}
      onDelete={(data) => {
        setTanque(rowData);
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
          value={tanques}
          header={renderHeader()}
          paginator
          rows={10}
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay tanques disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          <Column
            field="capacidad"
            header="Capacidad (m³)"
            sortable
            body={(rowData: Tanque) =>
              rowData.capacidad.toLocaleString("de-DE")
            }
          />
          <Column
            field="nivel"
            header="Nivel Actual (%)"
            sortable
            body={(rowData: Tanque) => {
              const porcentaje =
                (rowData.almacenamiento / rowData.capacidad) * 100;
              return (
                <div>
                  {porcentaje.toFixed(2)}%
                  <span
                    style={{
                      fontSize: "0.8em",
                      marginLeft: "0.5em",
                      color: "#6c757d",
                    }}
                  >
                    ({rowData.almacenamiento.toLocaleString("de-DE")} m³)
                  </span>
                </div>
              );
            }}
          />
          <Column
            field="idProducto.nombre"
            header="Producto"
            body={productoBodyTemplate}
          />
          <Column
            field="almacenamientoMateriaPrimaria"
            header="Tipo Almacenamiento"
            body={(rowData: Tanque) =>
              rowData.almacenamientoMateriaPrimaria
                ? "Materia Prima"
                : "Producto Terminado"
            }
          />
          <Column field="estado" header="Estado" sortable />
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
        >
          <TanqueForm
            tanque={tanque}
            setTanque={setTanque}
            hideTanqueFormDialog={hideTanqueFormDialog}
            tanques={tanques}
            setTanques={setTanques}
            showToast={showToast}
            toast={toast}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default TanqueList;
