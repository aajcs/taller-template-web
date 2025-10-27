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
// import RefinacionForm from "./RefinacionForm";

// import { Refinacion } from "@/libs/interface";
// import { formatDateFH } from "@/utils/dateUtils";
// import { deleteRefinacion, getRefinacions } from "@/app/api/refinacionService";
// import ChequeoCalidadListCort from "../chequeoCalidadComponents/ChequeoCalidadListCort";
// import ChequeoCantidadListCort from "../chequeoCantidadComponents/ChequeoCantidadListCort";
// import DerivadoListCort from "../productoComponents/DerivadoListCort";

// const RefinacionList = () => {
//   const { activeRefineria } = useRefineriaStore();
//   const [refinacions, setRefinacions] = useState<Refinacion[]>([]);
//   const [refinacion, setRefinacion] = useState<Refinacion | null>(null);
//   const [filters, setFilters] = useState<DataTableFilterMeta>({});
//   const [loading, setLoading] = useState(true);
//   const [globalFilterValue, setGlobalFilterValue] = useState("");
//   const [deleteProductDialog, setDeleteProductDialog] = useState(false);
//   const [refinacionFormDialog, setRefinacionFormDialog] = useState(false);
//   const [subTablaDialog, setSubTablaDialog] = useState(false);
//   const [subTablaInfo, setSubTablaInfo] = useState<any>("");
//   const [selectSubTabla, setSelectSubTabla] = useState<any>("");

//   const router = useRouter();
//   const dt = useRef(null);
//   const toast = useRef<Toast | null>(null);

//   useEffect(() => {
//     fetchRefinacions();
//   }, [activeRefineria]);

//   const fetchRefinacions = async () => {
//     try {
//       const refinacionsDB = await getRefinacions();
//       if (refinacionsDB && Array.isArray(refinacionsDB.refinacions)) {
//         const filteredRefinacions = refinacionsDB.refinacions.filter(
//           (refinacion: Refinacion) =>
//             refinacion.idRefineria.id === activeRefineria?.id
//         );
//         setRefinacions(filteredRefinacions);
//       } else {
//         console.error("La estructura de refinacionsDB no es la esperada");
//       }
//     } catch (error) {
//       console.error("Error al obtener los refinacions:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hideDeleteProductDialog = () => setDeleteProductDialog(false);
//   const hideRefinacionFormDialog = () => {
//     setRefinacion(null);
//     setRefinacionFormDialog(false);
//   };

//   const handleDeleteRefinacion = async () => {
//     if (refinacion?.id) {
//       await deleteRefinacion(refinacion.id);
//       setRefinacions(refinacions.filter((val) => val.id !== refinacion.id));
//       toast.current?.show({
//         severity: "success",
//         summary: "Éxito",
//         detail: "Refinacion Eliminada",
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
//         onClick={() => setRefinacionFormDialog(true)}
//       />
//     </div>
//   );

//   const actionBodyTemplate = (rowData: Refinacion) => (
//     <>
//       <Button
//         icon="pi pi-pencil"
//         rounded
//         severity="success"
//         className="mr-2"
//         onClick={() => {
//           setRefinacion(rowData);
//           setRefinacionFormDialog(true);
//         }}
//       />
//       <Button
//         icon="pi pi-trash"
//         severity="danger"
//         rounded
//         onClick={() => {
//           setRefinacion(rowData);
//           setDeleteProductDialog(true);
//         }}
//       />
//     </>
//   );

//   const actionSubTableTemplate = (
//     rowData: Refinacion,
//     sudTabla: keyof Refinacion
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
//           // setRefinacion(rowData);
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
//         value={refinacions}
//         header={renderHeader()}
//         paginator
//         rows={10}
//         responsiveLayout="scroll"
//         currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
//         rowsPerPageOptions={[10, 25, 50]}
//         filters={filters}
//         loading={loading}
//         emptyMessage="No hay refinacions disponibles"
//       >
//         <Column body={actionBodyTemplate} />
//         <Column
//           field="numeroRefinacion"
//           header="Número de Refinación"
//           sortable
//         />
//         <Column
//           header="Chequeo Calidad"
//           body={(rowData: Refinacion) =>
//             actionSubTableTemplate(rowData, "idChequeoCalidad")
//           }
//         />
//         <Column
//           header="Chequeo Cantidad"
//           body={(rowData: Refinacion) =>
//             actionSubTableTemplate(rowData, "idChequeoCantidad")
//           }
//         />
//         <Column
//           header="Derivados"
//           body={(rowData: Refinacion) =>
//             actionSubTableTemplate(rowData, "derivado")
//           }
//         />
//         {/* <Column
//           header="Historias de Operaciones"
//           body={(rowData: Refinacion) =>
//             actionSubTableTemplate(rowData, "historiasOperaciones")
//           }
//         /> */}
//         <Column field="descripcion" header="Descripción" />
//         <Column
//           field="idProducto.nombre"
//           header="Nombre del Producto"
//           sortable
//         />
//         <Column field="idTanque.nombre" header="Nombre del Tanque" sortable />
//         <Column field="operador" header="Operador" sortable />

//         <Column field="cantidadTotal" header="Cantidad Total" sortable />
//         <Column field="idTorre.nombre" header="Nombre de la Torre" sortable />

//         <Column field="estadoRefinacion" header="Estado Refinación" sortable />
//         <Column field="estado" header="Estado" sortable />
//         <Column
//           field="fechaInicio"
//           header="Fecha de Inicio"
//           sortable
//           body={(rowData: Refinacion) =>
//             rowData.fechaInicio
//               ? formatDateFH(rowData.fechaInicio)
//               : "En Proceso"
//           }
//         />
//         <Column
//           field="fechaFin"
//           header="Fecha de Fin"
//           sortable
//           body={(rowData: Refinacion) =>
//             rowData.fechaFin ? formatDateFH(rowData.fechaFin) : "En Proceso"
//           }
//         />
//         <Column
//           field="createdAt"
//           header="Fecha de Creación"
//           body={(rowData: Refinacion) => formatDateFH(rowData.createdAt)}
//         />
//         <Column
//           field="updatedAt"
//           header="Última Actualización"
//           body={(rowData: Refinacion) => formatDateFH(rowData.updatedAt)}
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
//               onClick={handleDeleteRefinacion}
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
//           {refinacion && (
//             <span>
//               ¿Estás seguro de que deseas eliminar la refinación con el número
//               de refinación <b>{refinacion.numeroRefinacion}</b>?
//             </span>
//           )}
//         </div>
//       </Dialog>

//       <Dialog
//         visible={refinacionFormDialog}
//         style={{ width: "50vw" }}
//         header={`${refinacion ? "Editar" : "Agregar"} Refinación`}
//         modal
//         onHide={hideRefinacionFormDialog}
//       >
//         <RefinacionForm
//           refinacion={refinacion}
//           hideRefinacionFormDialog={hideRefinacionFormDialog}
//           refinacions={refinacions}
//           setRefinacions={setRefinacions}
//           setRefinacion={setRefinacion}
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

// export default RefinacionList;
