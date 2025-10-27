// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { InputText } from "primereact/inputtext";
// import { Button } from "primereact/button";
// import { classNames } from "primereact/utils";
// import { chequeoCantidadSchema } from "@/libs/zod";
// import { Toast } from "primereact/toast";
// import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import {
//   createChequeoCantidad,
//   updateChequeoCantidad,
// } from "@/app/api/chequeoCantidadService";
// import { InputNumber } from "primereact/inputnumber";

// import { Calendar } from "primereact/calendar";
// import {
//   Contrato,
//   Producto,
//   Refinacion,
//   Tanque,
//   TorreDestilacion,
// } from "@/libs/interfaces";
// import { getTanques } from "@/app/api/tanqueService";
// import { ProgressSpinner } from "primereact/progressspinner";
// import { getProductos } from "@/app/api/productoService";
// import {
//   getTorreDestilacion,
//   getTorresDestilacion,
// } from "@/app/api/torreDestilacionService";
// import { getRefinacions } from "@/app/api/refinacionService";

// type FormData = z.infer<typeof chequeoCantidadSchema>;

// interface ChequeoCantidadFormProps {
//   chequeoCantidad: any;
//   hideChequeoCantidadFormDialog: () => void;
//   chequeoCantidads: any[];
//   setChequeoCantidads: (chequeoCantidads: any[]) => void;
//   setChequeoCantidad: (chequeoCantidad: any) => void;
//   showToast: (
//     severity: "success" | "error",
//     summary: string,
//     detail: string
//   ) => void;
// }

// const estatusValues = ["true", "false"];

// const ChequeoCantidadForm = ({
//   chequeoCantidad,
//   hideChequeoCantidadFormDialog,
//   chequeoCantidads,
//   setChequeoCantidads,
//   showToast,
// }: ChequeoCantidadFormProps) => {
//   const { activeRefineria } = useRefineriaStore();
//   const toast = useRef<Toast | null>(null);
//   const [productos, setProductos] = useState<Producto[]>([]);

//   const [tanques, setTanques] = useState<Tanque[]>([]);
//   const [torresDestilacion, setTorresDestilacion] = useState<
//     TorreDestilacion[]
//   >([]);
//   const [refinacions, setRefinacions] = useState<Refinacion[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     control,
//   } = useForm<FormData>({
//     resolver: zodResolver(chequeoCantidadSchema),
//     defaultValues: {
//       cantidad: 0,
//     },
//   });

//   useEffect(() => {
//     if (chequeoCantidad) {
//       Object.keys(chequeoCantidad).forEach((key) =>
//         setValue(key as keyof FormData, chequeoCantidad[key])
//       );
//     }
//   }, [chequeoCantidad, setValue]);
//   const fetchData = useCallback(async () => {
//     try {
//       const [refinacionsDB, productosDB, tanquesDB, torresDestilacionDB] =
//         await Promise.all([
//           getRefinacions(),
//           getProductos(),
//           getTanques(),
//           getTorresDestilacion(),
//         ]);
//       if (refinacionsDB && Array.isArray(refinacionsDB.refinacions)) {
//         const filteredRefinacions = refinacionsDB.refinacions.filter(
//           (refinacion: Refinacion) =>
//             refinacion.idRefineria.id === activeRefineria?.id
//         );
//         setRefinacions(filteredRefinacions);
//       }
//       if (productosDB && Array.isArray(productosDB.productos)) {
//         const filteredProductos = productosDB.productos.filter(
//           (producto: Producto) =>
//             producto.idRefineria.id === activeRefineria?.id
//         );
//         setProductos(filteredProductos);
//       }
//       if (tanquesDB && Array.isArray(tanquesDB.tanques)) {
//         const filteredTanques = tanquesDB.tanques.filter(
//           (tanque: Tanque) => tanque.idRefineria.id === activeRefineria?.id
//         );
//         setTanques(filteredTanques);
//       }
//       if (torresDestilacionDB && Array.isArray(torresDestilacionDB.torres)) {
//         const filteredTorresDestilacion = torresDestilacionDB.torres.filter(
//           (torre: TorreDestilacion) =>
//             torre.idRefineria.id === activeRefineria?.id
//         );
//         setTorresDestilacion(filteredTorresDestilacion);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [activeRefineria]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);
//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);
//     console.log(data);
//     try {
//       if (chequeoCantidad) {
//         const updatedChequeoCantidad = await updateChequeoCantidad(
//           chequeoCantidad.id,
//           {
//             ...data,
//             idProducto: data.idProducto?.id,
//             idTanque: data.idTanque?.id,
//             idTorre: data.idTorre?.id,
//             idRefinacion: data.idRefinacion?.id,
//             idRefineria: activeRefineria?.id,
//           }
//         );
//         const updatedChequeoCantidads = chequeoCantidads.map((t) =>
//           t.id === updatedChequeoCantidad.id ? updatedChequeoCantidad : t
//         );
//         setChequeoCantidads(updatedChequeoCantidads);
//         showToast("success", "Éxito", "ChequeoCantidad actualizado");
//       } else {
//         if (!activeRefineria)
//           throw new Error("No se ha seleccionado una refinería");
//         const newChequeoCantidad = await createChequeoCantidad({
//           ...data,

//           idProducto: data.idProducto?.id,
//           idTanque: data.idTanque?.id,
//           idTorre: data.idTorre?.id,
//           idRefinacion: data.idRefinacion?.id,
//           idRefineria: activeRefineria?.id,
//         });
//         setChequeoCantidads([...chequeoCantidads, newChequeoCantidad]);
//         showToast("success", "Éxito", "ChequeoCantidad creado");
//       }
//       hideChequeoCantidadFormDialog();
//     } catch (error) {
//       console.error("Error al crear/modificar chequeoCantidad:", error);
//       showToast(
//         "error",
//         "Error",
//         error instanceof Error ? error.message : "Ocurrió un error inesperado"
//       );
//     } finally {
//       setSubmitting(false); // Desactivar el estado de envío
//     }
//   };

//   // console.log(errors);
//   // console.log(JSON.stringify(watch("idContrato"), null, 2));
//   // console.log(watch("idContrato"));
//   if (loading) {
//     return (
//       <div
//         className="flex justify-content-center align-items-center"
//         style={{ height: "300px" }}
//       >
//         <ProgressSpinner />
//         {/* <p className="ml-3">Cargando datos...</p> */}
//       </div>
//     );
//   }
//   return (
//     <div>
//       <Toast ref={toast} />
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="grid formgrid p-fluid">
//           {/* Campo: Refinacion */}
//           <div className="field mb-4 col-12 sm:col-6 lg:4">
//             <label htmlFor="idRefinacion" className="font-medium text-900">
//               Refinación
//             </label>
//             <Dropdown
//               id="idRefinacion.id"
//               value={watch("idRefinacion")}
//               // {...register("idRefinacion.id")}
//               onChange={(e) => {
//                 setValue("idRefinacion", e.value);
//               }}
//               options={refinacions.map((refinacion) => ({
//                 label: refinacion.descripcion,
//                 value: {
//                   id: refinacion.id,
//                   descripcion: refinacion.descripcion,
//                 },
//               }))}
//               placeholder="Seleccionar una refinacion"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idRefinacion?.descripcion,
//               })}
//             />
//             {errors.idRefinacion?.descripcion && (
//               <small className="p-error">
//                 {errors.idRefinacion.descripcion.message}
//               </small>
//             )}
//           </div>

//           {/* Campo: Nombre del Producto */}

//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="id_contacto.nombre"
//               className="font-medium text-900"
//             >
//               Nombre del Producto
//             </label>
//             <Dropdown
//               id="idProducto.id"
//               value={watch("idProducto")}
//               // {...register("idProducto.id")}
//               onChange={(e) => {
//                 setValue("idProducto", e.value);
//               }}
//               options={productos.map((producto) => ({
//                 label: producto.nombre,
//                 value: {
//                   id: producto.id,
//                   _id: producto.id,
//                   nombre: producto.nombre,
//                 },
//               }))}
//               placeholder="Seleccionar un producto"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idProducto?.nombre,
//               })}
//             />
//             {errors.idProducto?.nombre && (
//               <small className="p-error">
//                 {errors.idProducto.nombre.message}
//               </small>
//             )}
//           </div>

//           {/* Campo: Nombre del Tanque */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="id_contacto.nombre"
//               className="font-medium text-900"
//             >
//               Nombre del Tanque
//             </label>
//             <Dropdown
//               id="idTanque.id"
//               value={watch("idTanque")}
//               // {...register("idTanque.id")}
//               onChange={(e) => {
//                 setValue("idTanque", e.value);
//               }}
//               options={tanques.map((tanque) => ({
//                 label: tanque.nombre,
//                 value: {
//                   id: tanque.id,
//                   nombre: tanque.nombre,
//                   _id: tanque.id,
//                 },
//               }))}
//               placeholder="Seleccionar un proveedor"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idTanque?.nombre,
//               })}
//             />
//             {errors.idTanque?.nombre && (
//               <small className="p-error">
//                 {errors.idTanque.nombre.message}
//               </small>
//             )}
//           </div>

//           {/* Campo: Nombre de la Torre */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="id_contacto.nombre"
//               className="font-medium text-900"
//             >
//               Nombre de Torre
//             </label>
//             <Dropdown
//               id="idTorre.id"
//               value={watch("idTorre")}
//               // {...register("idTorre.id")}
//               onChange={(e) => {
//                 setValue("idTorre", e.value);
//               }}
//               options={torresDestilacion.map((torre) => ({
//                 label: torre.nombre,
//                 value: {
//                   id: torre.id,
//                   nombre: torre.nombre,
//                   _id: torre.id,
//                 },
//               }))}
//               placeholder="Seleccionar un torre"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idTorre?.nombre,
//               })}
//             />
//             {errors.idTorre?.nombre && (
//               <small className="p-error">{errors.idTorre.nombre.message}</small>
//             )}
//           </div>

//           {/* Campo: Operador */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="operador" className="font-medium text-900">
//               Operador
//             </label>
//             <InputText
//               id="operador"
//               value={watch("operador")}
//               {...register("operador")}
//               className={classNames("w-full", {
//                 "p-invalid": errors.operador,
//               })}
//             />
//             {errors.operador && (
//               <small className="p-error">{errors.operador.message}</small>
//             )}
//           </div>
//           {/* Campo: Fecha de Chequeo */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="fechaChequeo" className="font-medium text-900">
//               Fecha de Chequeo
//             </label>
//             <Calendar
//               id="fechaChequeo"
//               value={
//                 watch("fechaChequeo")
//                   ? new Date(watch("fechaChequeo") as string | Date)
//                   : undefined
//               }
//               {...register("fechaChequeo")}
//               showTime
//               hourFormat="24"
//               className={classNames("w-full", {
//                 "p-invalid": errors.fechaChequeo,
//               })}
//               locale="es"
//             />
//             {errors.fechaChequeo && (
//               <small className="p-error">{errors.fechaChequeo.message}</small>
//             )}
//           </div>
//           {/* Campo: Cantidad*/}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="cantidad" className="font-medium text-900">
//               Cantidad
//             </label>
//             <Controller
//               name="cantidad"
//               control={control}
//               render={({ field }) => (
//                 <InputNumber
//                   id="cantidad"
//                   value={field.value}
//                   onValueChange={(e) => field.onChange(e.value)}
//                   className={classNames("w-full", {
//                     "p-invalid": errors.cantidad,
//                   })}
//                   min={0}
//                   locale="es"
//                 />
//               )}
//             />
//             {errors.cantidad && (
//               <small className="p-error">{errors.cantidad.message}</small>
//             )}
//           </div>

//           {/* Campo: Estado */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="estado" className="font-medium text-900">
//               Estado
//             </label>
//             <Dropdown
//               id="estado"
//               value={watch("estado")}
//               {...register("estado")}
//               options={estatusValues.map((value) => ({
//                 label: value,
//                 value,
//               }))}
//               placeholder="Seleccionar estado"
//               className={classNames("w-full", { "p-invalid": errors.estado })}
//             />
//             {errors.estado && (
//               <small className="p-error">{errors.estado.message}</small>
//             )}
//           </div>
//         </div>
//         <div className="col-12">
//           <Button
//             type="submit"
//             disabled={submitting} // Deshabilitar el botón mientras se envía
//             icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
//             label={
//               chequeoCantidad
//                 ? "Modificar Chequeo de Cantidad"
//                 : "Crear Chequeo de Cantidad"
//             }
//             className="w-auto mt-3"
//           />
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ChequeoCantidadForm;
