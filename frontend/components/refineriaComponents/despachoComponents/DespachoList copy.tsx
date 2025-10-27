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
// import DespachoForm from "./DespachoForm";
// import { Despacho } from "@/libs/interfaces";
// import { formatDateFH } from "@/utils/dateUtils";
// import { deleteDespacho, getDespachos } from "@/app/api/despachoService";

// const DespachoList = () => {
//   const { activeRefineria } = useRefineriaStore();
//   const [despachos, setDespachos] = useState<Despacho[]>([]);
//   const [despacho, setDespacho] = useState<Despacho | null>(null);
//   const [filters, setFilters] = useState<DataTableFilterMeta>({});
//   const [loading, setLoading] = useState(true);
//   const [globalFilterValue, setGlobalFilterValue] = useState("");
//   const [deleteProductDialog, setDeleteProductDialog] = useState(false);
//   const [despachoFormDialog, setDespachoFormDialog] = useState(false);

//   const router = useRouter();
//   const dt = useRef(null);
//   const toast = useRef<Toast | null>(null);

//   useEffect(() => {
//     fetchDespachos();
//   }, [activeRefineria]);

//   const fetchDespachos = async () => {
//     try {
//       const despachosDB = await getDespachos();
//       if (despachosDB && Array.isArray(despachosDB.despachos)) {
//         const filteredDespachos = despachosDB.despachos.filter(
//           (despacho: Despacho) =>
//             despacho.idRefineria.id === activeRefineria?.id
//         );
//         setDespachos(filteredDespachos);
//       } else {
//         console.error("La estructura de despachosDB no es la esperada");
//       }
//     } catch (error) {
//       console.error("Error al obtener los despachos:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hideDeleteProductDialog = () => setDeleteProductDialog(false);
//   const hideDespachoFormDialog = () => {
//     setDespacho(null);
//     setDespachoFormDialog(false);
//   };

//   const handleDeleteDespacho = async () => {
//     if (despacho?.id) {
//       await deleteDespacho(despacho.id);
//       setDespachos(despachos.filter((val) => val.id !== despacho.id));
//       toast.current?.show({
//         severity: "success",
//         summary: "Éxito",
//         detail: "Despacho Eliminada",
//         life: 3000,
//       });
//     } else {
//       toast.current?.show({
//         severity: "error",
//         summary: "Error",
//         detail: "No se pudo eliminar la torre de destilación",
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
//         onClick={() => setDespachoFormDialog(true)}
//       />
//     </div>
//   );

//   const actionBodyTemplate = (rowData: Despacho) => (
//     <>
//       <Button
//         icon="pi pi-pencil"
//         rounded
//         severity="success"
//         className="mr-2"
//         onClick={() => {
//           setDespacho(rowData);
//           setDespachoFormDialog(true);
//         }}
//       />
//       <Button
//         icon="pi pi-trash"
//         severity="warning"
//         rounded
//         onClick={() => {
//           setDespacho(rowData);
//           setDeleteProductDialog(true);
//         }}
//       />
//     </>
//   );

//   return (
//     <div className="card">
//       <Toast ref={toast} />

//       <DataTable
//         ref={dt}
//         value={despachos}
//         header={renderHeader()}
//         paginator
//         rows={10}
//         responsiveLayout="scroll"
//         currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
//         rowsPerPageOptions={[10, 25, 50]}
//         filters={filters}
//         loading={loading}
//         emptyMessage="No hay despachos disponibles"
//       >
//         <Column body={actionBodyTemplate} />
//         <Column
//           field="numeroDespacho"
//           header="Número de Chequeo de Cantidad"
//           sortable
//         />
//         <Column field="idGuia" header="ID de la Guía" sortable />
//         <Column field="placa" header="Placa" />
//         <Column field="nombreChofer" header="Nombre del Chofer" sortable />
//         <Column field="apellidoChofer" header="Apellido del Chofer" sortable />
//         <Column
//           field="idContrato.numeroContrato"
//           header="Número de Contrato"
//           sortable
//         />
//         <Column
//           field="idContratoItems.producto.nombre"
//           header="Nombre del Producto"
//         />
//         <Column
//           field="cantidadEnviada"
//           header="Cantidad Enviada"
//           body={(rowData: Despacho) =>
//             ` ${Number(rowData.cantidadEnviada).toLocaleString("de-DE")}Bbl`
//           }
//         />
//         <Column
//           field="cantidadRecibida"
//           header="Cantidad Recibida"
//           body={(rowData: Despacho) =>
//             ` ${Number(rowData.cantidadRecibida).toLocaleString("de-DE")}Bbl`
//           }
//         />

//         <Column
//           field="idLineaDespacho.nombre"
//           header="Nombre de la Línea"
//           sortable
//         />
//         <Column field="idTanque.nombre" header="ID del Tanque" sortable />
//         <Column
//           field="fechaInicio"
//           header="Fecha de Inicio"
//           body={(rowData: Despacho) => formatDateFH(rowData.fechaInicio)}
//         />
//         <Column
//           field="fechaFin"
//           header="Fecha de Fin"
//           body={(rowData: Despacho) => formatDateFH(rowData.fechaFin)}
//         />
//         <Column field="estadoCarga" header="Estado de la Carga" />
//         <Column field="estado" header="Estado" />
//         <Column
//           field="createdAt"
//           header="Fecha de Creación"
//           body={(rowData: Despacho) => formatDateFH(rowData.createdAt)}
//         />
//         <Column
//           field="updatedAt"
//           header="Última Actualización"
//           body={(rowData: Despacho) => formatDateFH(rowData.updatedAt)}
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
//               onClick={handleDeleteDespacho}
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
//           {despacho && (
//             <span>
//               ¿Estás seguro de que deseas eliminar <b>{despacho.idGuia}</b>?
//             </span>
//           )}
//         </div>
//       </Dialog>

//       <Dialog
//         visible={despachoFormDialog}
//         style={{ width: "50vw" }}
//         header={`${despacho ? "Editar" : "Agregar"} Despacho`}
//         modal
//         onHide={hideDespachoFormDialog}
//       >
//         <DespachoForm
//           despacho={despacho}
//           hideDespachoFormDialog={hideDespachoFormDialog}
//           despachos={despachos}
//           setDespachos={setDespachos}
//           setDespacho={setDespacho}
//         />
//       </Dialog>
//     </div>
//   );
// };

// export default DespachoList;
