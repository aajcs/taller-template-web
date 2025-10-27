// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { InputText } from "primereact/inputtext";
// import { Button } from "primereact/button";
// import { classNames } from "primereact/utils";
// import { refinacionSalidaSchema } from "@/libs/zods";
// import { Toast } from "primereact/toast";
// import { Dropdown } from "primereact/dropdown";
// import { useRefineriaStore } from "@/store/refineriaStore";

// import { InputNumber } from "primereact/inputnumber";

// import { Calendar } from "primereact/calendar";
// import { Contrato, Producto, Tanque, TorreDestilacion } from "@/libs/interface";
// import { getTanques } from "@/app/api/tanqueService";
// import { ProgressSpinner } from "primereact/progressspinner";
// import { getProductos } from "@/app/api/productoService";
// import { getTorresDestilacion } from "@/app/api/torreDestilacionService";
// import {
//   createRefinacionSalida,
//   updateRefinacionSalida,
// } from "@/app/api/refinacionSalidaService";
//
// import { InputTextarea } from "primereact/inputtextarea";

// type FormData = z.infer<typeof refinacionSalidaSchema>;

// interface RefinacionSalidaFormProps {
//   refinacionSalida: any;
//   hideRefinacionSalidaFormDialog: () => void;
//   refinacionSalidas: any[];
//   setRefinacionSalidas: (refinacionSalidas: any[]) => void;
//   setRefinacionSalida: (refinacionSalida: any) => void;
//   showToast: (
//     severity: "success" | "error",
//     summary: string,
//     detail: string
//   ) => void;
// }

// const estatusValues = ["true", "false"];
// const estadoRefinacionSalidaValues = [
//   "En Cola",
//   "En Proceso",
//   "Finalizado",
//   "Pausado",
// ];

// const RefinacionSalidaForm = ({
//   refinacionSalida,
//   hideRefinacionSalidaFormDialog,
//   refinacionSalidas,
//   setRefinacionSalidas,
//   showToast,
// }: RefinacionSalidaFormProps) => {
//   const { activeRefineria } = useRefineriaStore();
//   const { productos, loading, tanques, refinacions, torresDestilacion } =
//     useRefineryData(activeRefineria?.id || "");
//   const toast = useRef<Toast | null>(null);

//   const [submitting, setSubmitting] = useState(false);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     control,
//   } = useForm<FormData>({
//     resolver: zodResolver(refinacionSalidaSchema),
//     defaultValues: {
//       cantidadTotal: 0,
//     },
//   });

//   useEffect(() => {
//     if (refinacionSalida) {
//       Object.keys(refinacionSalida).forEach((key) =>
//         setValue(key as keyof FormData, refinacionSalida[key])
//       );
//     }
//   }, [refinacionSalida, setValue]);

//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);

//     try {
//       if (refinacionSalida) {
//         const updatedRefinacionSalida = await updateRefinacionSalida(
//           refinacionSalida.id,
//           {
//             ...data,
//             idProducto: data.idProducto?.id,
//             idTanque: data.idTanque?.id,
//             idRefinacion: data.idRefinacion?.id,

//             idRefineria: activeRefineria?.id,
//           }
//         );
//         const updatedRefinacionSalidas = refinacionSalidas.map((t) =>
//           t.id === updatedRefinacionSalida.id ? updatedRefinacionSalida : t
//         );
//         setRefinacionSalidas(updatedRefinacionSalidas);
//         showToast("success", "Éxito", "RefinacionSalida actualizado");
//       } else {
//         if (!activeRefineria)
//           throw new Error("No se ha seleccionado una refinería");
//         const newRefinacionSalida = await createRefinacionSalida({
//           ...data,
//           idRefinacion: data.idRefinacion?.id,
//           idProducto: data.idProducto?.id,
//           idTanque: data.idTanque?.id,

//           idRefineria: activeRefineria?.id,
//         });
//         setRefinacionSalidas([...refinacionSalidas, newRefinacionSalida]);
//         showToast("success", "Éxito", "RefinacionSalida creado");
//       }
//       hideRefinacionSalidaFormDialog();
//     } catch (error) {
//       console.error("Error al crear/modificar refinacionSalida:", error);
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
//   // const selectedTorre = watch("idTorre");
//   // const productosTorre = selectedTorre?.material.map((material) => ({
//   //   idProducto: material.idProducto,
//   //   porcentaje: 0, // Inicialmente el porcentaje es 0
//   // }));
//   // setDerivados(productosTorre || []);

//   return (
//     <div>
//       <Toast ref={toast} />
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="grid formgrid p-fluid">
//           {/* Campo: Refinación
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idRefinacion.id" className="font-medium text-900">
//               Refinación
//             </label>
//             <Dropdown
//               id="idRefinacion.id"
//               value={watch("idRefinacion")}
//               onChange={(e) => {
//                 setValue("idRefinacion", e.value);
//               }}
//               options={refinacions.map((refinacion) => ({
//                 label: `Refinación #${refinacion.numeroRefinacion} - ${refinacion.descripcion}`,
//                 value: {
//                   id: refinacion.id,
//                   numeroRefinacion: refinacion.numeroRefinacion,
//                   descripcion: refinacion.descripcion,
//                   idTorre: refinacion.idTorre,
//                   idProducto: refinacion.idProducto,
//                   cantidadTotal: refinacion.cantidadTotal,
//                   _id: refinacion.id,
//                   derivado: refinacion.derivado,
//                 },
//               }))}
//               placeholder="Seleccionar una refinación"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idRefinacion?.id,
//               })}
//             />
//             {errors.idRefinacion?.id && (
//               <small className="p-error">
//                 {errors.idRefinacion.id.message}
//               </small>
//             )}
//           </div> */}
//           {/* Campo: Nombre del Producto
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idProducto.id" className="font-medium text-900">
//               Nombre del Producto
//             </label>
//             <Dropdown
//               id="idProducto.id"
//               value={watch("idProducto")}
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
//           </div> */}
//           {/* Campo: Nombre del Tanque */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <h1 className="text-xl font-bold text-900 mb-3">Materia Prima </h1>
//             <label htmlFor="idTanque.id" className="font-medium text-900">
//               Nombre de Tanque
//             </label>
//             <Dropdown
//               id="idTanque.id"
//               value={watch("idTanque")}
//               onChange={(e) => {
//                 setValue("idTanque", e.value);
//               }}
//               options={tanques
//                 .filter(
//                   (tanque: Tanque) => tanque.almacenamientoMateriaPrimaria
//                 )
//                 .map((tanque) => ({
//                   label: `${tanque.nombre} - ${
//                     tanque.idProducto?.nombre || "Sin producto"
//                   } `,
//                   value: {
//                     id: tanque.id,
//                     nombre: tanque.nombre,
//                     _id: tanque.id,
//                   },
//                 }))}
//               placeholder="Seleccionar un tanque"
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
//           {/* Campo: Cantidad Total */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="cantidadTotal" className="font-medium text-900">
//               Cantidad Total
//             </label>
//             <Controller
//               name="cantidadTotal"
//               control={control}
//               render={({ field }) => (
//                 <InputNumber
//                   id="cantidadTotal"
//                   value={field.value}
//                   onValueChange={(e) => field.onChange(e.value)}
//                   className={classNames("w-full", {
//                     "p-invalid": errors.cantidadTotal,
//                   })}
//                   min={0}
//                   locale="es"
//                 />
//               )}
//             />
//             {errors.cantidadTotal && (
//               <small className="p-error">{errors.cantidadTotal.message}</small>
//             )}
//           </div>
//           <div className="col-12">
//             <h1 className="text-xl font-bold text-900 mb-3">
//               Derivado de Torres de Destilación
//             </h1>
//             {torresDestilacion.length > 0 &&
//               torresDestilacion.map((torre) => (
//                 <div key={torre.id} className="mb-4 col-12">
//                   <h1 className="text-xl font-bold text-900 mb-3">
//                     {torre.nombre}
//                   </h1>
//                   {torre.material.map((material) => (
//                     <div
//                       key={material.idProducto?.id}
//                       className="field mb-4 col-12  flex"
//                     >
//                       <label
//                         htmlFor={`idProducto.id_${material.idProducto?.id}`}
//                         className="font-medium text-900"
//                       >
//                         Nombre del Producto: {material.idProducto?.nombre}
//                       </label>
//                       {/* Campo: Nombre del Tanque */}
//                       <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//                         <label
//                           htmlFor="idTanque.id"
//                           className="font-medium text-900"
//                         >
//                           Nombre de Tanque
//                         </label>
//                         <Dropdown
//                           id="idTanque.id"
//                           value={watch("idTanque")}
//                           onChange={(e) => {
//                             setValue("idTanque", e.value);
//                           }}
//                           options={tanques
//                             .filter(
//                               (tanque: Tanque) =>
//                                 tanque.idProducto?.id ===
//                                 material.idProducto?.id
//                             )
//                             .map((tanque) => ({
//                               label: `${tanque.nombre} - ${
//                                 tanque.idProducto?.nombre || "Sin producto"
//                               } `,
//                               value: {
//                                 id: tanque.id,
//                                 nombre: tanque.nombre,
//                                 _id: tanque.id,
//                               },
//                             }))}
//                           placeholder="Seleccionar un tanque"
//                           className={classNames("w-full", {
//                             "p-invalid": errors.idTanque?.nombre,
//                           })}
//                         />
//                         {errors.idTanque?.nombre && (
//                           <small className="p-error">
//                             {errors.idTanque.nombre.message}
//                           </small>
//                         )}
//                       </div>
//                       {/* Campo: Cantidad Total */}
//                       <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//                         <label
//                           htmlFor="cantidadTotal"
//                           className="font-medium text-900"
//                         >
//                           Cantidad Total
//                         </label>
//                         <Controller
//                           name="cantidadTotal"
//                           control={control}
//                           render={({ field }) => (
//                             <InputNumber
//                               id="cantidadTotal"
//                               value={field.value}
//                               onValueChange={(e) => field.onChange(e.value)}
//                               className={classNames("w-full", {
//                                 "p-invalid": errors.cantidadTotal,
//                               })}
//                               min={0}
//                               locale="es"
//                             />
//                           )}
//                         />
//                         {errors.cantidadTotal && (
//                           <small className="p-error">
//                             {errors.cantidadTotal.message}
//                           </small>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ))}
//           </div>
//           {/* Campo: Operador */}
//           {/* <div className="field mb-4 col-12 sm:col-6 lg:col-4">
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
//           </div> */}
//           {/* Campo: Fecha de Fin */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="fechaFin" className="font-medium text-900">
//               Fecha de Corte
//             </label>
//             <Calendar
//               id="fechaFin"
//               value={
//                 watch("fechaFin")
//                   ? new Date(watch("fechaFin") as string | Date)
//                   : undefined
//               }
//               {...register("fechaFin")}
//               showTime
//               hourFormat="24"
//               className={classNames("w-full", {
//                 "p-invalid": errors.fechaFin,
//               })}
//               locale="es"
//             />
//             {errors.fechaFin && (
//               <small className="p-error">{errors.fechaFin.message}</small>
//             )}
//           </div>
//           {/* Campo: estadoRefinacionSalida */}
//           {/* <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="estadoRefinacionSalida"
//               className="font-medium text-900"
//             >
//               Estado de Refinación
//             </label>
//             <Dropdown
//               id="estadoRefinacionSalida"
//               value={watch("estadoRefinacionSalida")}
//               {...register("estadoRefinacionSalida")}
//               options={estadoRefinacionSalidaValues.map((value) => ({
//                 label: value,
//                 value,
//               }))}
//               placeholder="Seleccionar estado de refinación"
//               className={classNames("w-full", {
//                 "p-invalid": errors.estadoRefinacionSalida,
//               })}
//             />
//             {errors.estadoRefinacionSalida && (
//               <small className="p-error">
//                 {errors.estadoRefinacionSalida.message}
//               </small>
//             )}
//           </div> */}
//           {/* Campo: Estado */}
//           {/* <div className="field mb-4 col-12 sm:col-6 lg:col-4">
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
//           </div> */}{" "}
//           {/* Campo: Descripción */}
//           <div className="field mb-4 col-12 sm:col-6 lg:4">
//             <label htmlFor="descripcion" className="font-medium text-900">
//               Observacion
//             </label>
//             <InputTextarea
//               id="descripcion"
//               value={watch("descripcion")}
//               {...register("descripcion")}
//               className={classNames("w-full", {
//                 "p-invalid": errors.descripcion,
//               })}
//             />
//             {errors.descripcion && (
//               <small className="p-error">{errors.descripcion.message}</small>
//             )}
//           </div>
//         </div>

//         <div className="col-12">
//           <Button
//             type="submit"
//             disabled={submitting} // Deshabilitar el botón mientras se envía
//             icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
//             label={
//               refinacionSalida ? "Modificar Refinación" : "Crear Refinación"
//             }
//             className="w-auto mt-3"
//           />
//         </div>
//       </form>
//     </div>
//   );
// };

// export default RefinacionSalidaForm;
