"use client";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import React, { useEffect, useRef, useState } from "react";
import { deleteUser } from "@/app/api/userService";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import RefineriaForm from "./RefineriaForm";
import { deleteRefineria, getRefinerias } from "@/app/api/refineriaService";
import { Refineria } from "@/libs/interfaces";
import CustomActionButtons from "../common/CustomActionButtons";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";


const RefineriaList = () => {
  const [refinerias, setRefinerias] = useState<Refineria[]>([]);
  const [refineria, setRefineria] = useState<Refineria | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [refineriaFormDialog, setRefineriaFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditRefineria, setSelectedAuditRefineria] =
    useState<Refineria | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);
  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue("");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const refineriasDB = await getRefinerias();
      const { refinerias } = refineriasDB;
      setRefinerias(refinerias);
      setLoading(false);
      initFilters();
    };

    fetchUsers();
  }, []);
  const hideDeleteProductDialog = () => {
    setDeleteProductDialog(false);
  };
  const hideRefineriaFormDialog = () => {
    setRefineriaFormDialog(false);
  };
  const deleteProduct = async () => {
    let Refinerias = refinerias.filter((val) => val.id !== refineria?.id);
    if (refineria?.id) {
      const refineriaElminado = await deleteRefineria(refineria.id);
      setRefinerias(Refinerias);
      setDeleteProductDialog(false);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Refineria Eliminado",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el refineria",
        life: 3000,
      });
    }
    // setRefineria(emptyProduct);
  };
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let _filters = { ...filters };
    (_filters["global"] as any).value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };
  const deleteProductDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        text
        onClick={hideDeleteProductDialog}
      />
      <Button label="Yes" icon="pi pi-check" text onClick={deleteProduct} />
    </>
  );
  const renderHeader = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        {/* <div>
          {refinerias.length > 0 ? (
            <pre>{JSON.stringify(refinerias, null, 2)}</pre>
          ) : (
            <p>No hay refinerias disponibles</p>
          )}
        </div> */}
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
          label="Crear Refineria"
          outlined
          className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
          onClick={() => router.push("/todas-refinerias/create")}
        />
      </div>
    );
  };

  const header = renderHeader();

  const editRefineria = (refineria: any) => {
    setRefineria(refineria);
    setRefineriaFormDialog(true);
  };
  const confirmDeleteProduct = (refineria: any) => {
    setRefineria(refineria);
    setDeleteProductDialog(true);
  };
  const actionBodyTemplate = (rowData: any) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onInfo={(data) => {
          setSelectedAuditRefineria(data);

          setAuditDialogVisible(true);
        }}
        onEdit={(data) => {
          setRefineria(rowData);
          data;
          setRefineriaFormDialog(true);
        }}
        onDelete={(data) => {
          setRefineria(rowData);
          data;
          setDeleteProductDialog(true);
        }}
      />
    );
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
          value={refinerias}
          header={header}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          rowClassName={(_, i) => `animated-row`}
          size="small"
        >
          <Column body={actionBodyTemplate}></Column>
          {/* <Column
          field="img"
          header="Imagen"
          sortable
          headerClassName="white-space-nowrap"
          style={{ width: "25%" }}
        ></Column> */}
          <Column
            field="nombre"
            header="Nombre"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="procesamientoDia"
            header="Procesamiento por día"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="ubicacion"
            header="Ubicación"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          <Column
            field="nit"
            header="NIT"
            sortable
            headerClassName="white-space-nowrap"
          ></Column>
          {/* 
        <Column
          field="estado"
          header="Estado"
          sortable
          headerClassName="white-space-nowrap"
          style={{ width: "25%" }}
        ></Column> */}
        </DataTable>
        <AuditHistoryDialog
          visible={auditDialogVisible}
          onHide={() => setAuditDialogVisible(false)}
          title={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                  Historial - {selectedAuditRefineria?.nombre}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditRefineria?.createdBy!}
          createdAt={selectedAuditRefineria?.createdAt!}
          historial={selectedAuditRefineria?.historial}
        />
        <Dialog
          visible={deleteProductDialog}
          style={{ width: "450px" }}
          header="Confirmar"
          modal
          footer={deleteProductDialogFooter}
          onHide={hideDeleteProductDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {refineria && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{refineria.nombre}</b>{" "}
                <b>{refineria.correo}</b>?
              </span>
            )}
          </div>
        </Dialog>
        <Dialog
          visible={refineriaFormDialog}
          style={{ width: "850px" }}
          header="Editar Refineria"
          modal
          // footer={deleteProductDialogFooter}
          onHide={hideRefineriaFormDialog}
        >
          <RefineriaForm
            refineria={refineria}
            hideRefineriaFormDialog={hideRefineriaFormDialog}
            refinerias={refinerias}
            setRefinerias={setRefinerias}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default RefineriaList;
