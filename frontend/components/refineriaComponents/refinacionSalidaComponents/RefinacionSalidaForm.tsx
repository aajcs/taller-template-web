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
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="card p-fluid surface-50 p-3 border-round shadow-2">
//           {/* Header del Formulario */}
//           <div className="mb-2 text-center md:text-left">
//             <div className="border-bottom-2 border-primary pb-2">
//               <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
//                 <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
//                 {refinacionSalida
//                   ? "Modificar Refinación de Salida"
//                   : "Crear Refinación de Salida"}
//               </h2>
//             </div>
//           </div>

//           {/* Cuerpo del Formulario */}
//           <div className="grid formgrid row-gap-2">
//             {/* Derivados de Torres de Destilación */}
//             <div className="col-12">
//               {torresDestilacion.length > 0 &&
//                 torresDestilacion.map((torre) => (
//                   <div key={torre.id} className="mb-4">
//                     <h4 className="text-lg font-semibold text-800 mb-3">
//                       {torre.nombre}
//                     </h4>

//                     <div className="flex">
//                       {/* Materiales */}
//                       {torre.material.map((material) => (
//                         <div
//                           key={material.idProducto?.id}
//                           className=" align-items-center mt-4"
//                         >
//                           <div className="col-12">
//                             <label className="block font-medium text-900 mb-3 flex align-items-center">
//                               <i className="pi pi-tag mr-2 text-primary"></i>
//                               Producto: {material.idProducto?.nombre}
//                             </label>
//                           </div>

//                           <div className="col-12 ">
//                             <div className="p-2 bg-white border-round shadow-1 surface-card">
//                               <label className="block font-medium text-900 mb-3 flex align-items-center">
//                                 <i className="pi pi-box mr-2 text-primary"></i>
//                                 Nombre de Tanque
//                               </label>
//                               <Dropdown
//                                 id="idTanque.id"
//                                 value={watch("idTanque")}
//                                 onChange={(e) => setValue("idTanque", e.value)}
//                                 options={tanques
//                                   .filter(
//                                     (tanque: Tanque) =>
//                                       tanque.idProducto?.id ===
//                                       material.idProducto?.id
//                                   )
//                                   .map((tanque) => ({
//                                     label: `${tanque.nombre} - ${
//                                       tanque.idProducto?.nombre ||
//                                       "Sin producto"
//                                     }`,
//                                     value: {
//                                       id: tanque.id,
//                                       nombre: tanque.nombre,
//                                       _id: tanque.id,
//                                     },
//                                   }))}
//                                 placeholder="Seleccionar un tanque"
//                                 className={classNames("w-full", {
//                                   "p-invalid": errors.idTanque?.nombre,
//                                 })}
//                               />
//                               {errors.idTanque?.nombre && (
//                                 <small className="p-error block mt-2 flex align-items-center">
//                                   <i className="pi pi-exclamation-circle mr-2"></i>
//                                   {errors.idTanque.nombre.message}
//                                 </small>
//                               )}
//                             </div>
//                           </div>

//                           <div className="col-12  ">
//                             <div className="p-2 bg-white border-round shadow-1 surface-card">
//                               <label className="block font-medium text-900 mb-3 flex align-items-center">
//                                 <i className="pi pi-sort-numeric-up mr-2 text-primary"></i>
//                                 Cantidad Total
//                               </label>
//                               <Controller
//                                 name="cantidadTotal"
//                                 control={control}
//                                 render={({ field }) => (
//                                   <InputNumber
//                                     id="cantidadTotal"
//                                     value={field.value}
//                                     onValueChange={(e) =>
//                                       field.onChange(e.value)
//                                     }
//                                     className={classNames("w-full", {
//                                       "p-invalid": errors.cantidadTotal,
//                                     })}
//                                     min={0}
//                                     locale="es"
//                                   />
//                                 )}
//                               />
//                               {errors.cantidadTotal && (
//                                 <small className="p-error block mt-2 flex align-items-center">
//                                   <i className="pi pi-exclamation-circle mr-2"></i>
//                                   {errors.cantidadTotal.message}
//                                 </small>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//             </div>

//             {/* Fecha de Corte */}
//             <div className="col-12 md:col-6 lg:col-4">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-calendar mr-2 text-primary"></i>
//                   Fecha de Corte
//                 </label>
//                 <Calendar
//                   id="fechaFin"
//                   value={
//                     watch("fechaFin")
//                       ? new Date(watch("fechaFin") as string | Date)
//                       : undefined
//                   }
//                   {...register("fechaFin")}
//                   showTime
//                   hourFormat="24"
//                   className={classNames("w-full", {
//                     "p-invalid": errors.fechaFin,
//                   })}
//                   locale="es"
//                 />
//                 {errors.fechaFin && (
//                   <small className="p-error block mt-2 flex align-items-center">
//                     <i className="pi pi-exclamation-circle mr-2"></i>
//                     {errors.fechaFin.message}
//                   </small>
//                 )}
//               </div>
//             </div>

//             {/* Observación */}
//             <div className="col-12 md:col-6 lg:col-4">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-pencil mr-2 text-primary"></i>
//                   Observación
//                 </label>
//                 <InputTextarea
//                   id="descripcion"
//                   value={watch("descripcion")}
//                   {...register("descripcion")}
//                   className={classNames("w-full", {
//                     "p-invalid": errors.descripcion,
//                   })}
//                 />
//                 {errors.descripcion && (
//                   <small className="p-error block mt-2 flex align-items-center">
//                     <i className="pi pi-exclamation-circle mr-2"></i>
//                     {errors.descripcion.message}
//                   </small>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Botones */}
//           <div className="col-12 flex justify-content-between align-items-center mt-3">
//             <Button
//               type="submit"
//               disabled={submitting}
//               icon={submitting ? "pi pi-spinner pi-spin" : ""}
//               label={
//                 refinacionSalida
//                   ? "Modificar Refinación de Salida"
//                   : "Crear Refinación de Salida"
//               }
//               className="w-auto"
//             />

//             <Button
//               type="button"
//               label="Salir"
//               onClick={() => hideRefinacionSalidaFormDialog()}
//               className="w-auto"
//               severity="danger"
//             />
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default RefinacionSalidaForm;
