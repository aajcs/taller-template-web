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
import { deleteContacto, getContactos } from "@/app/api/contactoService";
import ContactoForm from "./ContactoForm";
import { formatDateFH } from "@/utils/dateUtils";
import { Contacto } from "@/libs/interfaces/contratoInterface";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const ContactoList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [contactoFormDialog, setContactoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditContacto, setSelectedAuditContacto] =
    useState<Contacto | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchContactos();
  }, [activeRefineria]);

  const fetchContactos = async () => {
    try {
      const contactosDB = await getContactos();
      if (contactosDB && Array.isArray(contactosDB.contactos)) {
        const filteredContactos = contactosDB.contactos.filter(
          (contacto: Contacto) =>
            contacto.idRefineria.id === activeRefineria?.id
        );
        setContactos(filteredContactos);
      } else {
        console.error("La estructura de contactosDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los contactos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openContactoFormDialog = () => {
    setContacto(null); // Limpia el contacto seleccionado
    setContactoFormDialog(true);
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideContactoFormDialog = () => {
    setContacto(null);
    setContactoFormDialog(false);
  };

  const handleDeleteContacto = async () => {
    try {
      if (contacto?.id) {
        await deleteContacto(contacto.id);
        setContactos(contactos.filter((val) => val.id !== contacto.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contacto Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el contacto",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setContacto(null);
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
      <CreateButton onClick={openContactoFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Contacto) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditContacto(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setContacto(rowData);
        data;
        setContactoFormDialog(true);
      }}
      onDelete={(data) => {
        setContacto(rowData);
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
          value={contactos}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay contactos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Razon Social" />
          <Column field="identificacionFiscal" header="NIT" />
          <Column field="correo" header="Correo" />
          <Column field="ciudad" header="Ciudad" />
          <Column field="direccion" header="Dirección" />
          <Column field="telefono" header="Teléfono" />
          <Column field="tipo" header="Tipo" sortable />

          <Column field="representanteLegal" header="Representante Legal" />
          {/* <Column
          field="estado"
          header="Estado"
        
          style={{ width: "20%" }}
        />
        <Column
          field="eliminado"
          header="Eliminado"
        
          style={{ width: "20%" }}
        />
        <Column
          field="createdAt"
          header="Fecha de Creación"
          body={(rowData: Contacto) => formatDateFH(rowData.createdAt)}
        
          style={{ width: "20%" }}
        />
        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: Contacto) => formatDateFH(rowData.updatedAt)}
        
          style={{ width: "20%" }}
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
                onClick={handleDeleteContacto}
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
            {contacto && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{contacto.nombre}</b>?
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
                  Historial - {selectedAuditContacto?.nombre}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditContacto?.createdBy!}
          createdAt={selectedAuditContacto?.createdAt!}
          historial={selectedAuditContacto?.historial}
        />
        <Dialog
          visible={contactoFormDialog}
          style={{ width: "850px" }}
          header={`${contacto ? "Editar" : "Agregar"} Contacto`}
          modal
          onHide={hideContactoFormDialog}
          content={
            <ContactoForm
              contacto={contacto}
              hideContactoFormDialog={hideContactoFormDialog}
              contactos={contactos}
              setContactos={setContactos}
              setContacto={setContacto}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default ContactoList;
