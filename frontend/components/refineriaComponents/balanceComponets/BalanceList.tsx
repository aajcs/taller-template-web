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
import { deleteBalance, getBalances } from "@/app/api/balanceService";
// import BalanceForm from "./BalanceForm";
import { formatDateFHSinHora } from "@/utils/dateUtils";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import AuditHistoryDialog from "@/components/common/AuditHistoryDialog";
import { Accordion, AccordionTab } from "primereact/accordion";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { Balance } from "@/libs/interfaces";
import BalanceForm from "./BalanceForm";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";


const BalanceList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [auditDialogVisible, setAuditDialogVisible] = useState(false);
  const [balanceFormDialog, setBalanceFormDialog] = useState(false);
  const [selectedAuditBalance, setSelectedAuditBalance] =
    useState<Balance | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchBalances();
  }, [activeRefineria]);

  const fetchBalances = async () => {
    try {
      const balancesDB = await getBalances();
      if (balancesDB && Array.isArray(balancesDB.balances)) {
        const filteredBalances = balancesDB.balances.filter(
          (balance: Balance) => balance.idRefineria?.id === activeRefineria?.id
        );
        setBalances(filteredBalances);
      } else {
        console.error("La estructura de balancesDB no es la esperada");
      }
    } catch (error) {
      console.error("Error al obtener los balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteProductDialog = () => setDeleteProductDialog(false);
  const hideBalanceFormDialog = () => {
    setBalance(null);
    setBalanceFormDialog(false);
  };

  const openBalanceFormDialog = () => {
    setBalance(null); // Limpia el balance seleccionado
    setBalanceFormDialog(true);
  };

  const handleDeleteBalance = async () => {
    try {
      if (balance?.id) {
        await deleteBalance(balance.id);
        setBalances(balances.filter((val) => val.id !== balance.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Balance Eliminada",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el balance",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setBalance(null);
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
      <CreateButton onClick={openBalanceFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Balance) => (
    <CustomActionButtons
      rowData={rowData}
      onInfo={(data) => {
        setSelectedAuditBalance(data);

        setAuditDialogVisible(true);
      }}
      onEdit={(data) => {
        setBalance(data);
        setBalanceFormDialog(true);
      }}
      onDelete={(data) => {
        setBalance(data);
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
  // const balancesBodyTemplate = (rowData: Balance) => (
  //   <Accordion>
  //     <AccordionTab
  //       header={
  //         <div className="flex align-items-center gap-2">
  //           <i className="pi pi-money-bill"></i>
  //           <span>
  //             Balances (${" "}
  //             {(rowData.balances
  //               ? rowData.balances.reduce((acc, balance) => acc + balance.monto, 0)
  //               : 0
  //             ).toFixed(2)}
  //             )
  //           </span>
  //         </div>
  //       }
  //     >
  //       {rowData.balances && rowData.balances.length > 0 ? (
  //         <DataTable
  //           value={rowData.balances}
  //           responsiveLayout="scroll"
  //           className="p-datatable-sm"
  //         >
  //           <Column
  //             field="numeroBalance"
  //             header={
  //               <span>
  //                 <i className="pi pi-hashtag text-orange-500 mr-2"></i>
  //                 N° Balance
  //               </span>
  //             }
  //             body={(balance) => <span>{balance.numeroBalance}</span>}
  //           />
  //           <Column
  //             field="fecha"
  //             header={
  //               <span>
  //                 <i className="pi pi-calendar text-orange-500 mr-2"></i>
  //                 Fecha
  //               </span>
  //             }
  //             body={(balance) => <span>{formatDateFH(balance.fecha)}</span>}
  //           />
  //           <Column
  //             field="monto"
  //             header={
  //               <span>
  //                 <i className="pi pi-money-bill text-orange-500 mr-2"></i>
  //                 Monto
  //               </span>
  //             }
  //             body={(balance) => (
  //               <span>
  //                 <span className="font-bold">${balance.monto.toFixed(2)}</span>
  //               </span>
  //             )}
  //           />
  //           <Column
  //             field="referencia"
  //             header={
  //               <span>
  //                 <i className="pi pi-book text-orange-500 mr-2"></i>
  //                 Referencia
  //               </span>
  //             }
  //             body={(balance) => (
  //               <span
  //                 className="text-overflow-ellipsis white-space-nowrap overflow-hidden"
  //                 style={{ maxWidth: "150px" }}
  //                 title={balance.referencia}
  //               >
  //                 {balance.referencia}
  //               </span>
  //             )}
  //           />
  //         </DataTable>
  //       ) : (
  //         <div className="p-3 text-center text-color-secondary">
  //           <i className="pi pi-info-circle mr-2"></i>
  //           No se han registrado balances
  //         </div>
  //       )}
  //     </AccordionTab>
  //   </Accordion>
  // );
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
          value={balances}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay balances disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="numeroBalance" header="N° Balance" sortable />
          <Column
            field="fechaInicio"
            header="Fecha Inicio"
            sortable
            body={(rowData) => formatDateFHSinHora(rowData.fechaInicio)}
          />
          <Column
            field="fechaFin"
            header="Fecha Fin"
            sortable
            body={(rowData) => formatDateFHSinHora(rowData.fechaFin)}
          />
          <Column
            field="totalBarrilesCompra"
            header={
              <span>
                <i className="pi pi-box mr-2 text-green-500"></i>
                Total Barriles Compra (bbls)
              </span>
            }
            sortable
            body={(rowData) =>
              rowData.totalBarrilesCompra != null
                ? `${rowData.totalBarrilesCompra.toLocaleString("de-DE")} bbls`
                : ""
            }
          />
          <Column
            field="totalBarrilesVenta"
            header={
              <span>
                <i className="pi pi-box mr-2 text-orange-500"></i>
                Total Barriles Venta (bbls)
              </span>
            }
            sortable
            body={(rowData) =>
              rowData.totalBarrilesVenta != null
                ? `${rowData.totalBarrilesVenta.toLocaleString("de-DE")} bbls`
                : ""
            }
          />
          <Column
            header={
              <span>
                <i className="pi pi-percentage mr-2 text-blue-500"></i>
                Diferencia Barriles (%)
              </span>
            }
            body={(rowData) => {
              if (
                rowData.totalBarrilesCompra != null &&
                rowData.totalBarrilesVenta != null &&
                rowData.totalBarrilesCompra > 0
              ) {
                const diferencia =
                  rowData.totalBarrilesVenta - rowData.totalBarrilesCompra;
                const porcentaje =
                  (diferencia / rowData.totalBarrilesCompra) * 100;
                let color = "text-green-600";
                if (Math.abs(porcentaje) >= 5) {
                  color = "text-red-600 font-bold";
                } else if (Math.abs(porcentaje) >= 2.5) {
                  color = "text-yellow-600 font-bold";
                }
                return <span className={color}>{porcentaje.toFixed(2)}%</span>;
              }
              return <span className="text-gray-400">-</span>;
            }}
          />
          <Column
            field="totalCompras"
            header="Total Compras"
            sortable
            body={(rowData) =>
              rowData.totalCompras != null
                ? `$${rowData.totalCompras.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />
          <Column
            field="totalVentas"
            header="Total Ventas"
            sortable
            body={(rowData) =>
              rowData.totalVentas != null
                ? `$${rowData.totalVentas.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />
          <Column
            field="ganancia"
            header="Ganancia"
            sortable
            body={(rowData) =>
              rowData.ganancia != null
                ? `$${rowData.ganancia.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />
          <Column
            field="perdida"
            header="Pérdida"
            sortable
            body={(rowData) =>
              rowData.perdida != null
                ? `$${rowData.perdida.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""
            }
          />
          <Column
            header={
              <span>
                <i className="pi pi-file-contract mr-2"></i>Contratos de Compra
              </span>
            }
            body={(rowData: Balance) => (
              <Accordion>
                <AccordionTab
                  header={
                    <span>
                      <i className="pi pi-file-contract text-green-500 mr-2"></i>
                      Compras ({rowData.contratosCompras?.length || 0})
                    </span>
                  }
                >
                  {rowData.contratosCompras &&
                  rowData.contratosCompras.length > 0 ? (
                    <DataTable
                      value={rowData.contratosCompras}
                      responsiveLayout="scroll"
                      className="p-datatable-sm"
                    >
                      <Column
                        field="numeroContrato"
                        header={
                          <span>
                            <i className="pi pi-hashtag text-green-500 mr-2"></i>
                            N° Contrato
                          </span>
                        }
                      />

                      <Column
                        field="montoTotal"
                        header={
                          <span>
                            <i className="pi pi-money-bill text-green-500 mr-2"></i>
                            Monto
                          </span>
                        }
                        body={(c) =>
                          `$${c.montoTotal?.toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        }
                      />
                      <Column
                        header={
                          <span>
                            <i className="pi pi-list text-green-500 mr-2"></i>
                            Productos
                          </span>
                        }
                        body={(contrato) =>
                          contrato.idItems && Array.isArray(contrato.idItems)
                            ? contrato.idItems.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="mb-1">
                                  <span className="font-bold">
                                    {item.producto?.nombre || "Sin nombre"}
                                  </span>
                                  {" - "}
                                  <span>
                                    {item.cantidad?.toLocaleString("de-DE")}{" "}
                                    bbls
                                  </span>
                                </div>
                              ))
                            : null
                        }
                      />
                    </DataTable>
                  ) : (
                    <div className="p-3 text-center text-color-secondary">
                      <i className="pi pi-info-circle mr-2"></i>
                      No hay contratos de compra
                    </div>
                  )}
                </AccordionTab>
              </Accordion>
            )}
          />
          <Column
            header={
              <span>
                <i className="pi pi-file-contract mr-2"></i>Contratos de Venta
              </span>
            }
            body={(rowData: Balance) => (
              <Accordion>
                <AccordionTab
                  header={
                    <span>
                      <i className="pi pi-file-contract text-orange-500 mr-2"></i>
                      Ventas ({rowData.contratosVentas?.length || 0})
                    </span>
                  }
                >
                  {rowData.contratosVentas &&
                  rowData.contratosVentas.length > 0 ? (
                    <DataTable
                      value={rowData.contratosVentas}
                      responsiveLayout="scroll"
                      className="p-datatable-sm"
                    >
                      <Column
                        field="numeroContrato"
                        header={
                          <span>
                            <i className="pi pi-hashtag text-orange-500 mr-2"></i>
                            N° Contrato
                          </span>
                        }
                      />

                      <Column
                        field="montoTotal"
                        header={
                          <span>
                            <i className="pi pi-money-bill text-orange-500 mr-2"></i>
                            Monto
                          </span>
                        }
                        body={(c) =>
                          `$${c.montoTotal?.toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        }
                      />
                      <Column
                        header={
                          <span>
                            <i className="pi pi-list text-orange-500 mr-2"></i>
                            Productos
                          </span>
                        }
                        body={(contrato) =>
                          contrato.idItems && Array.isArray(contrato.idItems)
                            ? contrato.idItems.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="mb-1">
                                  <span className="font-bold">
                                    {item.producto?.nombre || "Sin nombre"}
                                  </span>
                                  {" - "}
                                  <span>
                                    {item.cantidad?.toLocaleString("de-DE")}
                                  </span>
                                </div>
                              ))
                            : null
                        }
                      />
                    </DataTable>
                  ) : (
                    <div className="p-3 text-center text-color-secondary">
                      <i className="pi pi-info-circle mr-2"></i>
                      No hay contratos de venta
                    </div>
                  )}
                </AccordionTab>
              </Accordion>
            )}
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
                onClick={handleDeleteBalance}
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
            {balance && (
              <span>
                ¿Estás seguro de que deseas eliminar{" "}
                <b>{balance.numeroBalance}</b>?
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
                  Historial - {selectedAuditBalance?.numeroBalance}
                </h2>
              </div>
            </div>
          }
          createdBy={selectedAuditBalance?.createdBy!}
          createdAt={selectedAuditBalance?.createdAt!}
          historial={selectedAuditBalance?.historial}
        />
        <Dialog
          visible={balanceFormDialog}
          style={{ width: "850px" }}
          header={`${balance ? "Editar" : "Agregar"} Balance`}
          modal
          onHide={hideBalanceFormDialog}
          content={
            <BalanceForm
              balance={balance}
              setBalances={setBalances}
              balances={balances}
              setBalance={setBalance}
              hideBalanceFormDialog={hideBalanceFormDialog}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default BalanceList;
