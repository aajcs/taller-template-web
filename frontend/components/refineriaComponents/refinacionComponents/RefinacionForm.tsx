// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { InputText } from "primereact/inputtext";
// import { Button } from "primereact/button";
// import { classNames } from "primereact/utils";
// import { refinacionSchema } from "@/libs/zods";
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
//   createRefinacion,
//   updateRefinacion,
// } from "@/app/api/refinacionService";

// type FormData = z.infer<typeof refinacionSchema>;

// interface RefinacionFormProps {
//   refinacion: any;
//   hideRefinacionFormDialog: () => void;
//   refinacions: any[];
//   setRefinacions: (refinacions: any[]) => void;
//   setRefinacion: (refinacion: any) => void;
//   showToast: (
//     severity: "success" | "error",
//     summary: string,
//     detail: string
//   ) => void;
// }

// const estatusValues = ["true", "false"];
// const estadoRefinacionValues = [
//   "En Cola",
//   "En Proceso",
//   "Finalizado",
//   "Pausado",
// ];

// const RefinacionForm = ({
//   refinacion,
//   hideRefinacionFormDialog,
//   refinacions,
//   setRefinacions,
//   showToast,
// }: RefinacionFormProps) => {
//   const { activeRefineria } = useRefineriaStore();
//   const toast = useRef<Toast | null>(null);
//   const [productos, setProductos] = useState<Producto[]>([]);

//   const [tanques, setTanques] = useState<Tanque[]>([]);
//   const [torresDestilacion, setTorresDestilacion] = useState<
//     TorreDestilacion[]
//   >([]);
//   const [derivados, setDerivados] = useState<
//     { idProducto: any; porcentaje: number }[]
//   >([]);
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
//     resolver: zodResolver(refinacionSchema),
//     defaultValues: {
//       cantidadTotal: 0,
//     },
//   });

//   useEffect(() => {
//     if (refinacion) {
//       Object.keys(refinacion).forEach((key) =>
//         setValue(key as keyof FormData, refinacion[key])
//       );
//     }
//   }, [refinacion, setValue]);
//   const fetchData = useCallback(async () => {
//     try {
//       const [productosDB, tanquesDB, torresDestilacionDB] = await Promise.all([
//         getProductos(),
//         getTanques(),
//         getTorresDestilacion(),
//       ]);

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
//   useEffect(() => {
//     if (refinacion && refinacion.idTorre?.id) {
//       setDerivados(refinacion.derivado || []);
//     }
//   }, [refinacion, torresDestilacion]);
//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);
//     const sumaPorcentajes = derivados.reduce(
//       (sum, derivado) => sum + derivado.porcentaje,
//       0
//     );

//     if (sumaPorcentajes !== 100) {
//       showToast("error", "Error", "La suma de los porcentajes debe ser 100%");
//       setSubmitting(false);
//       return;
//     }

//     try {
//       if (refinacion) {
//         const updatedRefinacion = await updateRefinacion(refinacion.id, {
//           ...data,
//           idProducto: data.idProducto?.id,
//           idTanque: data.idTanque?.id,
//           idTorre: data.idTorre?.id,
//           derivado: derivados,

//           idRefineria: activeRefineria?.id,
//         });
//         const updatedRefinacions = refinacions.map((t) =>
//           t.id === updatedRefinacion.id ? updatedRefinacion : t
//         );
//         setRefinacions(updatedRefinacions);
//         showToast("success", "Éxito", "Refinacion actualizado");
//       } else {
//         if (!activeRefineria)
//           throw new Error("No se ha seleccionado una refinería");
//         const newRefinacion = await createRefinacion({
//           ...data,

//           idProducto: data.idProducto?.id,
//           idTanque: data.idTanque?.id,
//           idTorre: data.idTorre?.id,
//           derivado: derivados,

//           idRefineria: activeRefineria?.id,
//         });
//         setRefinacions([...refinacions, newRefinacion]);
//         showToast("success", "Éxito", "Refinacion creado");
//       }
//       hideRefinacionFormDialog();
//     } catch (error) {
//       console.error("Error al crear/modificar refinacion:", error);
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
//           {/* Campo: Descripción */}
//           <div className="field mb-4 col-12 sm:col-6 lg:4">
//             <label htmlFor="descripcion" className="font-medium text-900">
//               Descripción
//             </label>
//             <InputText
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

//           {/* Campo: Nombre del Producto */}
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
//           </div>

//           {/* Campo: Nombre del Tanque */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idTanque.id" className="font-medium text-900">
//               Nombre de Tanque
//             </label>
//             <Dropdown
//               id="idTanque.id"
//               value={watch("idTanque")}
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

//           {/* Campo: Fecha de Inicio */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="fechaInicio" className="font-medium text-900">
//               Fecha de Inicio
//             </label>
//             <Calendar
//               id="fechaInicio"
//               value={
//                 watch("fechaInicio")
//                   ? new Date(watch("fechaInicio") as string | Date)
//                   : undefined
//               }
//               {...register("fechaInicio")}
//               showTime
//               hourFormat="24"
//               className={classNames("w-full", {
//                 "p-invalid": errors.fechaInicio,
//               })}
//               locale="es"
//             />
//             {errors.fechaInicio && (
//               <small className="p-error">{errors.fechaInicio.message}</small>
//             )}
//           </div>

//           {/* Campo: Fecha de Fin */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="fechaFin" className="font-medium text-900">
//               Fecha de Fin
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
//           {/* Campo: estadoRefinacion */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="estadoRefinacion" className="font-medium text-900">
//               Estado de Refinación
//             </label>
//             <Dropdown
//               id="estadoRefinacion"
//               value={watch("estadoRefinacion")}
//               {...register("estadoRefinacion")}
//               options={estadoRefinacionValues.map((value) => ({
//                 label: value,
//                 value,
//               }))}
//               placeholder="Seleccionar estado de refinación"
//               className={classNames("w-full", {
//                 "p-invalid": errors.estadoRefinacion,
//               })}
//             />
//             {errors.estadoRefinacion && (
//               <small className="p-error">
//                 {errors.estadoRefinacion.message}
//               </small>
//             )}
//           </div>
//           {/* Campo: Nombre de la Torre */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idTorre.id" className="font-medium text-900">
//               Nombre de Torre
//             </label>
//             <Dropdown
//               id="idTorre.id"
//               value={watch("idTorre")}
//               onChange={(e) => {
//                 setValue("idTorre", e.value);
//                 const selectedTorre = torresDestilacion.find(
//                   (torre) => torre.id === e.value.id
//                 );
//                 const productosTorre = selectedTorre?.material.map(
//                   (material) => ({
//                     idProducto: material.idProducto,
//                     porcentaje: 0, // Inicialmente el porcentaje es 0
//                   })
//                 );
//                 setDerivados(productosTorre || []);
//               }}
//               options={torresDestilacion.map((torre) => ({
//                 label: torre.nombre,
//                 value: {
//                   id: torre.id,
//                   nombre: torre.nombre,
//                   _id: torre.id,
//                 },
//               }))}
//               placeholder="Seleccionar una torre"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idTorre?.nombre,
//               })}
//             />
//             {/* <Dropdown
//               id="idTorre.id"
//               value={watch("idTorre")}
//               onChange={(e) => {
//                 setValue("idTorre", e.value);
//               }}
//               options={torresDestilacion.map((torre) => ({
//                 label: torre.nombre,
//                 value: {
//                   id: torre.id,
//                   nombre: torre.nombre,
// _id:torre.id
//                 },
//               }))}
//               placeholder="Seleccionar una torre"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idTorre?.nombre,
//               })}
//             /> */}
//             {errors.idTorre?.nombre && (
//               <small className="p-error">{errors.idTorre.nombre.message}</small>
//             )}
//           </div>
//           {derivados.map((derivado, index) => (
//             <div
//               key={derivado.idProducto.id}
//               className="field mb-4 col-12 sm:col-6 lg:col-4"
//             >
//               <label
//                 htmlFor={`derivado-${index}`}
//                 className="font-medium text-900"
//               >
//                 {derivado.idProducto.nombre}
//               </label>
//               <InputNumber
//                 id={`derivado-${index}`}
//                 value={derivado.porcentaje}
//                 onValueChange={(e) => {
//                   const nuevosDerivados = [...derivados];
//                   nuevosDerivados[index].porcentaje = e.value || 0;
//                   setDerivados(nuevosDerivados);
//                 }}
//                 min={0}
//                 max={100}
//                 suffix="%"
//                 className={classNames("w-full")}
//               />
//             </div>
//           ))}
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
//             label={refinacion ? "Modificar Refinación" : "Crear Refinación"}
//             className="w-auto mt-3"
//           />
//         </div>
//       </form>
//     </div>
//   );
// };

// export default RefinacionForm;
