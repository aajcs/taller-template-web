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
import {
  deleteTorreDestilacion,
  getTorresDestilacion,
} from "@/app/api/torreDestilacionService";
import TorreDestilacionForm from "./TorreDestilacionForm";
import { useRefineriaStore } from "@/store/refineriaStore";
import { Material, TorreDestilacion } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Divider } from "primereact/divider";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";

const TorreDestilacionList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [torresDestilacion, setTorresDestilacion] = useState<
    TorreDestilacion[]
  >([]);
  const [torreDestilacion, setTorreDestilacion] =
    useState<TorreDestilacion | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditTorre, setSelectedAuditTorre] =
    useState<TorreDestilacion | null>(null);
  const [torreDestilacionFormDialog, setTorreDestilacionFormDialog] =
    useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchTorresDestilacion();
  }, [activeRefineria]);

  const fetchTorresDestilacion = async () => {
    try {
      const torresDestilacionDB = await getTorresDestilacion();
      if (torresDestilacionDB && Array.isArray(torresDestilacionDB.torres)) {
        const filteredTorresDestilacion = torresDestilacionDB.torres.filter(
          (torre: TorreDestilacion) =>
            torre.idRefineria.id === activeRefineria?.id
        );
        setTorresDestilacion(filteredTorresDestilacion);
      } else {
        console.error("La estructura de torresDestilacionDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener las torres de destilación:", error);
    } finally {
      setLoading(false);
    }
  };

  const openTorreDestilacionFormDialog = () => {
    setTorreDestilacion(null); // Limpia la torre seleccionada
    setTorreDestilacionFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideTorreDestilacionFormDialog = () => {
    setTorreDestilacion(null);
    setTorreDestilacionFormDialog(false);
  };

  const handleDeleteTorreDestilacion = async () => {
    if (torreDestilacion?.id) {
      await deleteTorreDestilacion(torreDestilacion.id);
      setTorresDestilacion(
        torresDestilacion.filter((val) => val.id !== torreDestilacion.id)
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Torre Destilacion Eliminada",
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
    setTorreDestilacion(null);
    setDeleteProductDialog(false);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };
  // Mostrar notificaciones Toast
  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
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
      <CreateButton onClick={openTorreDestilacionFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: TorreDestilacion) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setTorreDestilacion(rowData);
        setTorreDestilacionFormDialog(true);
      }}
      onDelete={(data) => {
        setTorreDestilacion(rowData);
        setDeleteProductDialog(true);
      }}
      onInfo={(data) => {
        setSelectedAuditTorre(data);
        setAuditDialogVisible(true);
      }}
    />
  );
  const materialBodyTemplate = (rowData: TorreDestilacion) => {
    return (
      <div>
        {Array.isArray(rowData.material) &&
          rowData.material.map((material, index) => (
            <span
              key={index}
              className={"customer-badge"}
              style={{ backgroundColor: `#${material.idProducto?.color}50` }}
            >
              {material.idProducto?.nombre}
            </span>
          ))}
      </div>
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
          value={torresDestilacion}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay torres de destilación disponibles"
          className="p-datatable-sm"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column
            body={actionBodyTemplate}
            headerStyle={{ minWidth: "10rem" }}
          />
          <Column field="nombre" header="Nombre" />
          {/* <Column field="ubicacion" header="Ubicación" /> */}
          <Column
            field="material"
            header="Material"
            body={materialBodyTemplate}
          />
          {/* <Column field="estado" header="Estado" /> */}
          {/* <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: TorreDestilacion) => formatDateFH(rowData.createdAt)}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: TorreDestilacion) => formatDateFH(rowData.updatedAt)}
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
                onClick={handleDeleteTorreDestilacion}
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
            {torreDestilacion && (
              <span>
                ¿Estás seguro de que deseas eliminar{" "}
                <b>{torreDestilacion.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>
        {/* <Dialog
        visible={auditDialogVisible}
        style={{ width: "600px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                Historial - {selectedAuditTorre?.nombre}
              </h2>
            </div>
          </div>
        }
        contentClassName="p-0"
        modal
        draggable={false}
        onHide={() => setAuditDialogVisible(false)}
        footer={
          <div className="col-12 flex justify-content-end align-items-center mt-3">
            <Button
              type="button"
              label="Salir"
              className="w-auto"
              onClick={() => setAuditDialogVisible(false)}
              severity="danger"
            />
          </div>
        }
      >
        <div className="m-3 p-3 border-round surface-50 border-left-3 border-primary">
          <div className="text-sm text-600">CREACIÓN INICIAL</div>
          <div className="flex flex-column gap-1 mt-2">
            <span>
              <span className="font-medium">Autor:</span>{" "}
              {selectedAuditTorre?.createdBy?.nombre}
            </span>
            <span>
              <span className="font-medium">Email:</span>{" "}
              {selectedAuditTorre?.createdBy?.correo}
            </span>
            <span>
              <span className="font-medium">Fecha:</span>{" "}
              {formatDateFH(selectedAuditTorre?.createdAt || "")}
            </span>
          </div>
        </div>

        <div className="m-3 p-3 border-round surface-50 border-left-3 border-primary">
          <Accordion multiple>
            {selectedAuditTorre?.historial?.length ? (
              selectedAuditTorre.historial.map((h, idx) => (
                <AccordionTab
                  key={idx}
                  header={
                    <div className="flex align-items-center gap-3">
                      <i className="pi pi-pencil text-green-500"></i>
                      <div>
                        <div className="font-medium">
                          {formatDateFH(h.fecha)}
                        </div>
                        <div className="text-sm text-600">
                          {h.modificadoPor.nombre}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="m-2 p-3 surface-50 border-round">
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <span className="font-medium">Usuario:</span>{" "}
                        {h.modificadoPor.nombre}
                      </div>
                      <div className="col-12 md:col-6">
                        <span className="font-medium">Email:</span>{" "}
                        {h.modificadoPor.correo}
                      </div>
                    </div>

                    <Divider className="my-3" />

                    <div className="text-lg font-medium mb-2">Cambios:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {Object.entries(h.cambios).map(([field, change], i) => (
                        <div
                          key={i}
                          className="bg-gray-50 p-3 rounded flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-800 font-medium">
                            {field}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 line-through">
                              {String(change.from)}
                            </span>
                            <i className="pi pi-arrow-right text-gray-500"></i>
                            <span className="text-green-600 font-semibold">
                              {String(change.to)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionTab>
              ))
            ) : (
              <div className="m-3 p-3 text-center text-600">
                No se encontraron modificaciones
              </div>
            )}
          </Accordion>
        </div>
      </Dialog> */}

        <AuditHistoryDialog
          visible={auditDialogVisible}
          onHide={() => setAuditDialogVisible(false)}
          title={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                  Historial - {selectedAuditTorre?.nombre}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditTorre?.createdBy!}
          createdAt={selectedAuditTorre?.createdAt!}
          historial={selectedAuditTorre?.historial}
        />
        <Dialog
          visible={torreDestilacionFormDialog}
          style={{ width: "850px" }}
          header={`${
            torreDestilacion ? "Editar" : "Agregar"
          } Torre de Destilación`}
          modal
          onHide={hideTorreDestilacionFormDialog}
          content={() => (
            <TorreDestilacionForm
              torreDestilacion={torreDestilacion}
              hideTorreDestilacionFormDialog={hideTorreDestilacionFormDialog}
              torresDestilacion={torresDestilacion}
              setTorresDestilacion={setTorresDestilacion}
              setTorreDestilacion={setTorreDestilacion}
              showToast={showToast}
              toast={toast}
            />
          )}
        ></Dialog>
      </motion.div>
    </>
  );
};

export default TorreDestilacionList;
