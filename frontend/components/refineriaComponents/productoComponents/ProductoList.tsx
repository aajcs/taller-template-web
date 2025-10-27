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
import { Producto } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import { deleteProducto, getProductos } from "@/app/api/productoService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import CreateButton from "@/components/common/CreateButton";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";

const ProductoList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [productoFormDialog, setProductoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditProducto, setSelectedAuditProducto] =
    useState<Producto | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchProductos();
  }, [activeRefineria]);

  const fetchProductos = async () => {
    try {
      const productosDB = await getProductos();
      if (productosDB && Array.isArray(productosDB.productos)) {
        const filteredProductos = productosDB.productos.filter(
          (producto: Producto) =>
            producto.idRefineria?.id === activeRefineria?.id
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
  const openProductoFormDialog = () => {
    setProducto(null); // Limpia el producto seleccionado
    setProductoFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideProductoFormDialog = () => {
    setProducto(null);
    setProductoFormDialog(false);
  };

  const handleDeleteProducto = async () => {
    try {
      if (producto?.id) {
        await deleteProducto(producto.id);
        setProductos(productos.filter((val) => val.id !== producto.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Producto Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el producto",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setProducto(null);
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
      <CreateButton onClick={openProductoFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Producto) => (
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
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="posicion" header="Posición" sortable />
          <Column
            field="color"
            header="Color"
            body={(rowData: Producto) => (
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
            body={(rowData: Producto) =>
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
              toast={toast}
            />
          )}
        ></Dialog>
      </motion.div>
    </>
  );
};

export default ProductoList;
