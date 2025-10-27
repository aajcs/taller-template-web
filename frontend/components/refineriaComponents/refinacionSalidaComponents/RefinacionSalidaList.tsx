// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { FilterMatchMode } from "primereact/api";
// import { Button } from "primereact/button";
// import { Column } from "primereact/column";
// import { DataTable, DataTableFilterMeta } from "primereact/datatable";
// import { InputText } from "primereact/inputtext";
// import { Toast } from "primereact/toast";
// import { Dialog } from "primereact/dialog";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import RefinacionSalidaForm from "./RefinacionSalidaForm";

// import { RefinacionSalida } from "@/libs/interface";
// import { formatDateFH } from "@/utils/dateUtils";

// import ChequeoCalidadListCort from "../chequeoCalidadComponents/ChequeoCalidadListCort";
// import ChequeoCantidadListCort from "../chequeoCantidadComponents/ChequeoCantidadListCort";
// import DerivadoListCort from "../productoComponents/DerivadoListCort";
// import {
//   deleteRefinacionSalida,
//   getRefinacionSalidas,
// } from "@/app/api/refinacionSalidaService";

// const RefinacionSalidaList = () => {
//   const { activeRefineria } = useRefineriaStore();
//   const [refinacionSalidas, setRefinacionSalidas] = useState<
//     RefinacionSalida[]
//   >([]);
//   const [refinacionSalida, setRefinacionSalida] =
//     useState<RefinacionSalida | null>(null);
//   const [filters, setFilters] = useState<DataTableFilterMeta>({});
//   const [loading, setLoading] = useState(true);
//   const [globalFilterValue, setGlobalFilterValue] = useState("");
//   const [deleteProductDialog, setDeleteProductDialog] = useState(false);
//   const [refinacionSalidaFormDialog, setRefinacionSalidaFormDialog] =
//     useState(false);
//   const [subTablaDialog, setSubTablaDialog] = useState(false);
//   const [subTablaInfo, setSubTablaInfo] = useState<any>("");
//   const [selectSubTabla, setSelectSubTabla] = useState<any>("");

//   const router = useRouter();
//   const dt = useRef(null);
//   const toast = useRef<Toast | null>(null);

//   useEffect(() => {
//     fetchRefinacionSalidas();
//   }, [activeRefineria]);

//   const fetchRefinacionSalidas = async () => {
//     try {
//       const refinacionSalidasDB = await getRefinacionSalidas();
//       if (
//         refinacionSalidasDB &&
//         Array.isArray(refinacionSalidasDB.refinacionSalidas)
//       ) {
//         const filteredRefinacionSalidas =
//           refinacionSalidasDB.refinacionSalidas.filter(
//             (refinacionSalida: RefinacionSalida) =>
//               refinacionSalida.idRefineria.id === activeRefineria?.id
//           );
//         setRefinacionSalidas(filteredRefinacionSalidas);
//       } else {
//         console.error("La estructura de refinacionSalidasDB no es la esperada");
//       }
//     } catch (error) {
//       console.error("Error al obtener los refinacionSalidas:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hideDeleteProductDialog = () => setDeleteProductDialog(false);
//   const hideRefinacionSalidaFormDialog = () => {
//     setRefinacionSalida(null);
//     setRefinacionSalidaFormDialog(false);
//   };

//   const handleDeleteRefinacionSalida = async () => {
//     if (refinacionSalida?.id) {
//       await deleteRefinacionSalida(refinacionSalida.id);
//       setRefinacionSalidas(
//         refinacionSalidas.filter((val) => val.id !== refinacionSalida.id)
//       );
//       toast.current?.show({
//         severity: "success",
//         summary: "Éxito",
//         detail: "RefinacionSalida Eliminada",
//         life: 3000,
//       });
//     } else {
//       toast.current?.show({
//         severity: "error",
//         summary: "Error",
//         detail: "No se pudo eliminar el chequeo de calidad",
//         life: 3000,
//       });
//     }
//     setDeleteProductDialog(false);
//   };

//   const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { value } = e.target;
//     setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
//     setGlobalFilterValue(value);
//   };

//   const renderHeader = () => (
//     <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
//       <span className="p-input-icon-left w-full sm:w-20rem flex-order-1 sm:flex-order-0">
//         <i className="pi pi-search"></i>
//         <InputText
//           value={globalFilterValue}
//           onChange={onGlobalFilterChange}
//           placeholder="Búsqueda Global"
//           className="w-full"
//         />
//       </span>
//       <Button
//         type="button"
//         icon="pi pi-user-plus"
//         label="Agregar Nuevo"
//         outlined
//         className="w-full sm:w-auto flex-order-0 sm:flex-order-1"
//         onClick={() => setRefinacionSalidaFormDialog(true)}
//       />
//     </div>
//   );

//   const actionBodyTemplate = (rowData: RefinacionSalida) => (
//     <>
//       <Button
//         icon="pi pi-pencil"
//         rounded
//         severity="success"
//         className="mr-2"
//         onClick={() => {
//           setRefinacionSalida(rowData);
//           setRefinacionSalidaFormDialog(true);
//         }}
//       />
//       <Button
//         icon="pi pi-trash"
//         severity="danger"
//         rounded
//         onClick={() => {
//           setRefinacionSalida(rowData);
//           setDeleteProductDialog(true);
//         }}
//       />
//     </>
//   );

//   const actionSubTableTemplate = (
//     rowData: RefinacionSalida,
//     sudTabla: keyof RefinacionSalida
//   ) => {
//     return (
//       <Button
//         icon="pi pi-search"
//         rounded
//         // severity="success"
//         className="mr-2"
//         onClick={() => {
//           setSubTablaDialog(true);
//           setSubTablaInfo(rowData[sudTabla]);
//           setSelectSubTabla(sudTabla);
//           // setRefinacionSalida(rowData);
//           // setSubTablaDialog("ChequeoCalidad");
//         }}
//       />
//     );
//   };

//   const showToast = (
//     severity: "success" | "error",
//     summary: string,
//     detail: string
//   ) => {
//     toast.current?.show({ severity, summary, detail, life: 3000 });
//   };

//   return (
//     <div className="card">
//       <Toast ref={toast} />

//       <DataTable
//         ref={dt}
//         value={refinacionSalidas}
//         header={renderHeader()}
//         paginator
//         rows={10}
//         responsiveLayout="scroll"
//         currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
//         rowsPerPageOptions={[10, 25, 50]}
//         filters={filters}
//         loading={loading}
//         emptyMessage="No hay refinacionSalidas disponibles"
//       >
//         <Column body={actionBodyTemplate} />
//         <Column
//           field="numeroRefinacionSalida"
//           header="Número de Refinación"
//           sortable
//         />
//         <Column
//           header="Chequeo Calidad"
//           body={(rowData: RefinacionSalida) =>
//             actionSubTableTemplate(rowData, "idChequeoCalidad")
//           }
//         />
//         <Column
//           header="Chequeo Cantidad"
//           body={(rowData: RefinacionSalida) =>
//             actionSubTableTemplate(rowData, "idChequeoCantidad")
//           }
//         />

//         <Column field="descripcion" header="Descripción" />
//         <Column
//           field="idProducto.nombre"
//           header="Nombre del Producto"
//           sortable
//         />
//         <Column field="idTanque.nombre" header="Nombre del Tanque" sortable />
//         <Column field="operador" header="Operador" sortable />

//         <Column field="cantidadTotal" header="Cantidad Total" sortable />
//         <Column
//           field="idRefinacion.idTorre.nombre"
//           header="Nombre de la Torre"
//           sortable
//         />

//         <Column
//           field="estadoRefinacionSalida"
//           header="Estado Refinación Salida"
//           sortable
//         />
//         <Column field="estado" header="Estado" sortable />

//         <Column
//           field="fechaFin"
//           header="Fecha de Fin"
//           sortable
//           body={(rowData: RefinacionSalida) =>
//             rowData.fechaFin ? formatDateFH(rowData.fechaFin) : "En Proceso"
//           }
//         />
//         <Column
//           field="createdAt"
//           header="Fecha de Creación"
//           body={(rowData: RefinacionSalida) => formatDateFH(rowData.createdAt)}
//         />
//         <Column
//           field="updatedAt"
//           header="Última Actualización"
//           body={(rowData: RefinacionSalida) => formatDateFH(rowData.updatedAt)}
//         />
//       </DataTable>

//       <Dialog
//         visible={deleteProductDialog}
//         style={{ width: "450px" }}
//         header="Confirmar"
//         modal
//         footer={
//           <>
//             <Button
//               label="No"
//               icon="pi pi-times"
//               text
//               onClick={hideDeleteProductDialog}
//             />
//             <Button
//               label="Sí"
//               icon="pi pi-check"
//               text
//               onClick={handleDeleteRefinacionSalida}
//             />
//           </>
//         }
//         onHide={hideDeleteProductDialog}
//       >
//         <div className="flex align-items-center justify-content-center">
//           <i
//             className="pi pi-exclamation-triangle mr-3"
//             style={{ fontSize: "2rem" }}
//           />
//           {refinacionSalida && (
//             <span>
//               ¿Estás seguro de que deseas eliminar la refinación con el número
//               de refinación <b>{refinacionSalida.numeroRefinacionSalida}</b>?
//             </span>
//           )}
//         </div>
//       </Dialog>

//       <Dialog
//         // visible={refinacionSalidaFormDialog}
//         style={{ width: "50vw" }}
//         header={`${refinacionSalida ? "Editar" : "Agregar"} Refinación`}
//         modal
//         onHide={hideRefinacionSalidaFormDialog}
//       >
//         <RefinacionSalidaForm
//           refinacionSalida={refinacionSalida}
//           hideRefinacionSalidaFormDialog={hideRefinacionSalidaFormDialog}
//           refinacionSalidas={refinacionSalidas}
//           setRefinacionSalidas={setRefinacionSalidas}
//           setRefinacionSalida={setRefinacionSalida}
//           showToast={showToast}
//         />
//       </Dialog>
//       <Dialog
//         visible={subTablaDialog}
//         style={{ width: "50vw" }}
//         header={
//           selectSubTabla === "idChequeoCalidad"
//             ? "Chequeo de Calidad"
//             : selectSubTabla === "idChequeoCantidad"
//             ? "Chequeo de Cantidad"
//             : "Derivado"
//         }
//         modal
//         onHide={() => setSubTablaDialog(false)}
//       >
//         {selectSubTabla === "idChequeoCalidad" && (
//           <ChequeoCalidadListCort chequeoCalidad={subTablaInfo} />
//         )}
//         {/* <ChequeoCalidadListCort chequeoCalidad={subTablaInfo} /> */}
//         {selectSubTabla === "idChequeoCantidad" && (
//           <ChequeoCantidadListCort chequeoCantidad={subTablaInfo} />
//         )}
//         {selectSubTabla === "derivado" && (
//           <DerivadoListCort derivado={subTablaInfo} />
//         )}
//       </Dialog>
//     </div>
//   );
// };

// export default RefinacionSalidaList;
