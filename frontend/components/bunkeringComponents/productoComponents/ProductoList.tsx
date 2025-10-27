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
import ProductoForm from "./ProductoForm";
import { formatDateFH } from "@/utils/dateUtils";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { ProductoBK } from "@/libs/interfaces";
import {
  deleteProductoBK,
  getProductosBK,
} from "@/app/api/bunkering/productoBKService";

const ProductoList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [productos, setProductos] = useState<ProductoBK[]>([]);
  const [producto, setProducto] = useState<ProductoBK | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [productoFormDialog, setProductoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditProducto, setSelectedAuditProducto] =
    useState<ProductoBK | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchProductos();
  }, [activeRefineria]);

  const fetchProductos = async () => {
    try {
      const productosDB = await getProductosBK();
      if (productosDB && Array.isArray(productosDB.productos)) {
        const filteredProductos = productosDB.productos.filter(
          (producto: ProductoBK) =>
            producto.idBunkering.id === activeRefineria?.id
        );
        setProductos(filteredProductos);
      } else {
        console.error("La estructura de productosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideProductoFormDialog = () => {
    setProducto(null);
    setProductoFormDialog(false);
  };

  const handleDeleteProducto = async () => {
    if (producto?.id) {
      await deleteProductoBK(producto.id);
      setProductos(productos.filter((val) => val.id !== producto.id));
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto Eliminada",
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
    setProducto(null);
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
        onClick={() => setProductoFormDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: ProductoBK) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditProducto(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setProducto(rowData);
        data;
        setProductoFormDialog(true);
      }}
      onDelete={(data) => {
        setProducto(rowData);
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
        value={productos}
        header={renderHeader()}
        paginator
        rows={10}
        responsiveLayout="scroll"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        loading={loading}
        emptyMessage="No hay productos disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="posicion" header="Posición" sortable />
        <Column
          field="color"
          header="Color"
          body={(rowData: ProductoBK) => (
            <div className="flex items-center">
              <div
                className=" h-6 rounded-full mr-2"
                style={{ backgroundColor: `#${rowData.color}` }}
              >
                <span>{rowData.color}</span>
              </div>
            </div>
          )}
        />

        <Column field="tipoMaterial" header="Categoria" sortable />
        <Column
          field="idTipoProducto"
          header="Tipo de Producto"
          body={(rowData: ProductoBK) =>
            rowData.idTipoProducto
              ?.map((tipoProducto: { nombre: string }) => tipoProducto.nombre)
              .join(", ") || "N/A"
          }
          sortable
        />

        {/* <Column field="estado" header="Estado" sortable />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Producto) => formatDateFH(rowData.createdAt)}
          sortable
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Producto) => formatDateFH(rowData.updatedAt)}
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
              onClick={handleDeleteProducto}
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
          {producto && (
            <span>
              ¿Estás seguro de que deseas eliminar <b>{producto.nombre}</b>?
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
                Historial - {selectedAuditProducto?.nombre}
              </h2>
            </div>
          </div>
        }
        createdBy={selectedAuditProducto?.createdBy!}
        createdAt={selectedAuditProducto?.createdAt!}
        historial={selectedAuditProducto?.historial}
      />
      <Dialog
        visible={productoFormDialog}
        style={{ width: "850px" }}
        header={`${producto ? "Editar" : "Agregar"} Producto`}
        modal
        onHide={hideProductoFormDialog}
        content={() => (
          <ProductoForm
            producto={producto}
            hideProductoFormDialog={hideProductoFormDialog}
            productos={productos}
            setProductos={setProductos}
            setProducto={setProducto}
            showToast={showToast}
          />
        )}
      ></Dialog>
    </div>
  );
};

export default ProductoList;
