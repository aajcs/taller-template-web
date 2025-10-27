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
import { deleteCuenta, getCuentas } from "@/app/api/cuentaService";
// import CuentaForm from "./CuentaForm";
import { formatDateFH } from "@/utils/dateUtils";
import { Cuenta } from "@/libs/interfaces/contratoInterface";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { Accordion, AccordionTab } from "primereact/accordion";
import AbonoForm from "../abonoComponets/AbonoForm";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

interface CuentaListProps {
  tipoCuenta: string;
}

const CuentaList = ({ tipoCuenta }: CuentaListProps) => {
  const { activeRefineria } = useRefineriaStore();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [abonoFormDialog, setAbonoFormDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [selectedAuditCuenta, setSelectedAuditCuenta] = useState<Cuenta | null>(
    null
  );
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchCuentas();
  }, [activeRefineria]);

  const fetchCuentas = async () => {
    try {
      const cuentasDB = await getCuentas();
      if (cuentasDB && Array.isArray(cuentasDB.cuentas)) {
        const filteredCuentas = cuentasDB.cuentas.filter(
          (cuenta: Cuenta) =>
            cuenta.idRefineria?.id === activeRefineria?.id &&
            cuenta.tipoCuenta === tipoCuenta
        );
        setCuentas(filteredCuentas);
      } else {
        console.error("La estructura de cuentasDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los cuentas:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideCuentaFormDialog = () => {
    setCuenta(null);
    setAbonoFormDialog(false);
  };

  const handleDeleteCuenta = async () => {
    try {
      if (cuenta?.id) {
        await deleteCuenta(cuenta.id);
        setCuentas(cuentas.filter((val) => val.id !== cuenta.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta Eliminada",
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
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setCuenta(null);
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
      <CreateButton onClick={() => setAbonoFormDialog(true)} />
    </div>
  );

  const actionBodyTemplate = (rowData: Cuenta) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditCuenta(data);

        setAuditDialogVisible(true);
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
  const abonosBodyTemplate = (rowData: Cuenta) => (
    <Accordion>
      <AccordionTab
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-money-bill"></i>
            <span>
              Abonos (${" "}
              {(rowData.abonos
                ? rowData.abonos.reduce((acc, abono) => acc + abono.monto, 0)
                : 0
              ).toFixed(2)}
              )
            </span>
          </div>
        }
      >
        {rowData.abonos && rowData.abonos.length > 0 ? (
          <DataTable
            value={rowData.abonos}
            responsiveLayout="scroll"
            className="p-datatable-sm"
          >
            <Column
              field="numeroAbono"
              header={
                <span>
                  <i className="pi pi-hashtag text-orange-500 mr-2"></i>
                  N° Abono
                </span>
              }
              body={(abono) => <span>{abono.numeroAbono}</span>}
            />
            <Column
              field="fecha"
              header={
                <span>
                  <i className="pi pi-calendar text-orange-500 mr-2"></i>
                  Fecha
                </span>
              }
              body={(abono) => <span>{formatDateFH(abono.fecha)}</span>}
            />
            <Column
              field="monto"
              header={
                <span>
                  <i className="pi pi-money-bill text-orange-500 mr-2"></i>
                  Monto
                </span>
              }
              body={(abono) => (
                <span>
                  <span className="font-bold">${abono.monto.toFixed(2)}</span>
                </span>
              )}
            />
            <Column
              field="referencia"
              header={
                <span>
                  <i className="pi pi-book text-orange-500 mr-2"></i>
                  Referencia
                </span>
              }
              body={(abono) => (
                <span
                  className="text-overflow-ellipsis white-space-nowrap overflow-hidden"
                  style={{ maxWidth: "150px" }}
                  title={abono.referencia}
                >
                  {abono.referencia}
                </span>
              )}
            />
          </DataTable>
        ) : (
          <div className="p-3 text-center text-color-secondary">
            <i className="pi pi-info-circle mr-2"></i>
            No se han registrado abonos
          </div>
        )}
      </AccordionTab>
    </Accordion>
  );
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
          value={cuentas}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay cuentas disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="numeroCuenta" header="N° Cuenta" sortable />
          <Column
            field="idContrato.numeroContrato"
            header="N° Contrato"
            sortable
          />
          <Column
            header="Abonos"
            body={abonosBodyTemplate}
            style={{ minWidth: "250px" }}
          />
          <Column
            field="montoTotalContrato"
            header={
              <span>
                <i className="pi pi-wallet mr-2"></i>Monto Total Contrato
              </span>
            }
            sortable
            body={(rowData: Cuenta) =>
              rowData.montoTotalContrato != null
                ? `$${rowData.montoTotalContrato.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />
          <Column
            field="totalAbonado"
            header={
              <span>
                <i className="pi pi-money-bill mr-2"></i>Total Abonado
              </span>
            }
            sortable
            body={(rowData: Cuenta) =>
              rowData.totalAbonado != null
                ? `$${rowData.totalAbonado.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />
          <Column
            field="balancePendiente"
            header={
              <span>
                <i className="pi pi-chart-line mr-2"></i>Balance Pendiente
              </span>
            }
            sortable
            body={(rowData: Cuenta) =>
              rowData.balancePendiente != null
                ? `$${rowData.balancePendiente.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />

          <Column
            field="fechaCuenta"
            header={
              <span>
                <i className="pi pi-calendar-plus mr-2"></i>Fecha de la Cuenta
              </span>
            }
            sortable
            body={(rowData: Cuenta) => formatDateFH(rowData.fechaCuenta)}
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
                onClick={handleDeleteCuenta}
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
            {cuenta && (
              <span>
                ¿Estás seguro de que deseas eliminar{" "}
                <b>{cuenta.numeroCuenta}</b>?
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
                  Historial - {selectedAuditCuenta?.numeroCuenta}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditCuenta?.createdBy!}
          createdAt={selectedAuditCuenta?.createdAt!}
          historial={selectedAuditCuenta?.historial}
        />
        <Dialog
          visible={abonoFormDialog}
          style={{ width: "850px" }}
          header={`${cuenta ? "Editar" : "Agregar"} Cuenta`}
          modal
          onHide={hideCuentaFormDialog}
          content={
            <AbonoForm
              tipoAbono={tipoCuenta}
              hideAbonoFormDialog={hideCuentaFormDialog}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default CuentaList;
