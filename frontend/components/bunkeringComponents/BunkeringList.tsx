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
import BunkeringForm from "./BunkeringForm";
import { Bunkering } from "@/libs/interfaces";
import CustomActionButtons from "../common/CustomActionButtons";
import AuditHistoryDialog from "../common/AuditHistoryDialog";
import {
  deleteBunkering,
  getBunkerings,
} from "@/app/api/bunkering/bunkeringService";

const BunkeringList = () => {
  const [bunkerings, setBunkerings] = useState<Bunkering[]>([]);
  const [bunkering, setBunkering] = useState<Bunkering | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [bunkeringFormDialog, setBunkeringFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditBunkering, setSelectedAuditBunkering] =
    useState<Bunkering | null>(null);
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
      const bunkeringsDB = await getBunkerings();
      const { bunkerings } = bunkeringsDB;
      setBunkerings(bunkerings);
      setLoading(false);
      initFilters();
    };

    fetchUsers();
  }, []);
  const hideDeleteProductDialog = () => {
    setDeleteProductDialog(false);
  };
  const hideBunkeringFormDialog = () => {
    setBunkeringFormDialog(false);
  };
  const deleteProduct = async () => {
    let Bunkerings = bunkerings.filter((val) => val.id !== bunkering?.id);
    if (bunkering?.id) {
      const bunkeringElminado = await deleteBunkering(bunkering.id);
      setBunkerings(Bunkerings);
      setDeleteProductDialog(false);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Bunkering Eliminado",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el bunkering",
        life: 3000,
      });
    }
    // setBunkering(emptyProduct);
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
          {bunkerings.length > 0 ? (
            <pre>{JSON.stringify(bunkerings, null, 2)}</pre>
          ) : (
            <p>No hay bunkerings disponibles</p>
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
          label="Crear Bunkering"
          outlined
          className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
          onClick={() => router.push("/todos-bunkering/create")}
        />
      </div>
    );
  };

  const header = renderHeader();

  const editBunkering = (bunkering: any) => {
    setBunkering(bunkering);
    setBunkeringFormDialog(true);
  };
  const confirmDeleteProduct = (bunkering: any) => {
    setBunkering(bunkering);
    setDeleteProductDialog(true);
  };
  const actionBodyTemplate = (rowData: any) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onInfo={(data) => {
          setSelectedAuditBunkering(data);

          setAuditDialogVisible(true);
        }}
        onEdit={(data) => {
          setBunkering(rowData);
          data;
          setBunkeringFormDialog(true);
        }}
        onDelete={(data) => {
          setBunkering(rowData);
          data;
          setDeleteProductDialog(true);
        }}
      />
    );
  };
  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        ref={dt}
        value={bunkerings}
        header={header}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column
          body={actionBodyTemplate}
          headerStyle={{ minWidth: "10rem" }}
        ></Column>
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
          style={{ width: "25%" }}
        ></Column>

        <Column
          field="ubicacion"
          header="Ubicación"
          sortable
          headerClassName="white-space-nowrap"
          style={{ width: "25%" }}
        ></Column>
        <Column
          field="nit"
          header="NIT"
          sortable
          headerClassName="white-space-nowrap"
          style={{ width: "25%" }}
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
                Historial - {selectedAuditBunkering?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditBunkering?.createdBy!}
        createdAt={selectedAuditBunkering?.createdAt!}
        historial={selectedAuditBunkering?.historial}
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
          {bunkering && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{bunkering.nombre}</b>{" "}
              <b>{bunkering.correo}</b>?
            </span>
          )}
        </div>
      </Dialog>
      <Dialog
        visible={bunkeringFormDialog}
        style={{ width: "850px" }}
        header="Editar Bunkering"
        modal
        // footer={deleteProductDialogFooter}
        onHide={hideBunkeringFormDialog}
      >
        <BunkeringForm
          bunkering={bunkering}
          hideBunkeringFormDialog={hideBunkeringFormDialog}
          bunkerings={bunkerings}
          setBunkerings={setBunkerings}
        />
      </Dialog>
    </div>
  );
};

export default BunkeringList;
