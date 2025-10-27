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
import TipoProductoForm from "./TipoProductoForm";
import { formatDateFH } from "@/utils/dateUtils";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";

import { Accordion, AccordionTab } from "primereact/accordion";
import {
  deleteTipoProductoBK,
  getTipoProductosBK,
} from "@/app/api/bunkering/tipoProductoBKService";
import { TipoProductoBK } from "@/libs/interfaces/tipoProductoBKInterface";

const TipoProductoList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [tipoProductos, setTipoProductos] = useState<TipoProductoBK[]>([]);
  const [tipoProducto, setTipoProducto] = useState<TipoProductoBK | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [tipoProductoFormDialog, setTipoProductoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditTipoProducto, setSelectedAuditTipoProducto] =
    useState<TipoProductoBK | null>(null);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchTipoProductos();
  }, [activeRefineria]);

  const fetchTipoProductos = async () => {
    try {
      const tipoProductosDB = await getTipoProductosBK();
      if (tipoProductosDB && Array.isArray(tipoProductosDB.tipoProductos)) {
        const filteredTipoProductos = tipoProductosDB.tipoProductos.filter(
          (tipoProducto: TipoProductoBK) =>
            tipoProducto.idBunkering.id === activeRefineria?.id
        );
        setTipoProductos(filteredTipoProductos);
      } else {
        console.error("La estructura de tipoProductosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los tipoProductos:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideTipoProductoFormDialog = () => {
    setTipoProducto(null);
    setTipoProductoFormDialog(false);
  };

  const handleDeleteTipoProducto = async () => {
    if (tipoProducto?.id) {
      await deleteTipoProductoBK(tipoProducto.id);
      setTipoProductos(
        tipoProductos.filter((val) => val.id !== tipoProducto.id)
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "TipoProducto Eliminada",
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
    setTipoProducto(null);
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
        onClick={() => setTipoProductoFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: TipoProductoBK) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditTipoProducto(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setTipoProducto(rowData);
        data;
        setTipoProductoFormDialog(true);
      }}
      onDelete={(data) => {
        setTipoProducto(rowData);
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
  const rendimientoBodyTemplate = (rowData: TipoProductoBK) => {
    return (
      <Accordion>
        <AccordionTab
          key={rowData.id}
          header={`Rendimientos (${rowData.rendimientos?.length || 0})`}
        >
          {Array.isArray(rowData.rendimientos) &&
            rowData.rendimientos.map((rendimiento, index) => (
              <div
                className="p-3 mb-1 border-round shadow-1 text-sm text-gray-800 flex align-items-center gap-1"
                style={{
                  backgroundColor: `#${rendimiento.idProducto?.color}20`,
                }}
              >
                <span className="font-bold text-primary">
                  {rendimiento.idProducto?.nombre || "Producto Desconocido"}
                </span>
                <div className="flex gap-4">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-dollar text-green-500"></i>
                    <span>
                      <strong>Transporte:</strong>{" "}
                      {rendimiento.transporte || "N/A"}
                    </span>
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-dollar text-green-500"></i>
                    <span>
                      <strong>Bunker:</strong> {rendimiento.bunker || "N/A"}
                    </span>
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-dollar text-green-500"></i>
                    <span>
                      <strong>Convenio:</strong> {rendimiento.convenio || "N/A"}
                    </span>
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-dollar text-green-500"></i>
                    <span>
                      <strong>Precio Venta:</strong>{" "}
                      {rendimiento.costoVenta || "N/A"}
                    </span>
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-percentage text-purple-500"></i>
                    <span>
                      <strong>Porcentaje:</strong>{" "}
                      {rendimiento.porcentaje || "N/A"}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </AccordionTab>
      </Accordion>
    );
  };
  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        ref={dt}
        value={tipoProductos}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay tipoProductos disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        <Column field="idProducto.nombre" header="Producto" />
        <Column field="nombre" header="Nombre" />
        <Column field="clasificacion" header="Clasificación" />
        <Column field="costoOperacional" header="Costo Operacional" />
        <Column field="transporte" header="Costo de Transporte" />
        <Column
          field="rendimiento"
          header="Rendimiento"
          body={rendimientoBodyTemplate}
        />
        <Column field="convenio" header="Convenio para el Precio de Compra" />
        <Column
          field="gravedadAPI"
          header="Gravedad API"
          body={(rowData: TipoProductoBK) =>
            rowData.gravedadAPI?.toFixed(2) || "N/A"
          }
        />
        <Column
          field="azufre"
          header="Azufre (%)"
          body={(rowData: TipoProductoBK) =>
            rowData.azufre?.toFixed(2) || "N/A"
          }
        />
        <Column
          field="contenidoAgua"
          header="Contenido de Agua (%)"
          body={(rowData: TipoProductoBK) =>
            rowData.contenidoAgua?.toFixed(2) || "N/A"
          }
        />
        <Column
          field="puntoDeInflamacion"
          header="Punto De Inflamación (°C)"
          body={(rowData: TipoProductoBK) =>
            rowData.puntoDeInflamacion || "N/A"
          }
        />
        <Column field="estado" header="Estado" />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: TipoProductoBK) => formatDateFH(rowData.createdAt)}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: TipoProductoBK) => formatDateFH(rowData.updatedAt)}
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
              onClick={handleDeleteTipoProducto}
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
          {tipoProducto && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{tipoProducto.nombre}</b>?
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
                Historial - {selectedAuditTipoProducto?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditTipoProducto?.createdBy!}
        createdAt={selectedAuditTipoProducto?.createdAt!}
        historial={selectedAuditTipoProducto?.historial}
      />

      {tipoProductoFormDialog && (
        <TipoProductoForm
          tipoProducto={tipoProducto}
          hideTipoProductoFormDialog={hideTipoProductoFormDialog}
          tipoProductos={tipoProductos}
          setTipoProductos={setTipoProductos}
          setTipoProducto={setTipoProducto}
          showToast={showToast}
          tipoProductoFormDialog={tipoProductoFormDialog}
        />
      )}
      {/* <Dialog
        visible={tipoProductoFormDialog}
        style={{ width: "850px" }}
        header={`${tipoProducto ? "Editar" : "Agregar"} Tipo de Producto`}
        modal
        onHide={hideTipoProductoFormDialog}
        content={() => (
          <TipoProductoForm
            tipoProducto={tipoProducto}
            hideTipoProductoFormDialog={hideTipoProductoFormDialog}
            tipoProductos={tipoProductos}
            setTipoProductos={setTipoProductos}
            setTipoProducto={setTipoProducto}
            showToast={showToast}
          />
        )}
      ></Dialog> */}
    </div>
  );
};

export default TipoProductoList;
