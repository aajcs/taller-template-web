// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { InputText } from "primereact/inputtext";
// import { Button } from "primereact/button";
// import { classNames } from "primereact/utils";
// import { despachoSchema } from "@/libs/zod";
// import { Toast } from "primereact/toast";
// import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import { InputNumber } from "primereact/inputnumber";

// import { Calendar } from "primereact/calendar";
// import { Contrato, LineaDespacho, Tanque } from "@/libs/interfaces";
// import { getTanques } from "@/app/api/tanqueService";
// import { getContratos } from "@/app/api/contratoService";
// import { RadioButton } from "primereact/radiobutton";
// import { ProgressSpinner } from "primereact/progressspinner";
// import { createDespacho, updateDespacho } from "@/app/api/despachoService";
// import { getLineaDespachos } from "@/app/api/lineaDespachoService";

// type FormData = z.infer<typeof despachoSchema>;

// interface DespachoFormProps {
//   despacho: any;
//   hideDespachoFormDialog: () => void;
//   despachos: any[];
//   setDespachos: (despachos: any[]) => void;
//   setDespacho: (despacho: any) => void;
// }

// const estatusValues = ["true", "false"];
// const estadoCargaOptions = [
//   { label: "EN_TRANSITO", value: "EN_TRANSITO" },
//   { label: "ENTREGADO", value: "ENTREGADO" },
// ];

// const DespachoForm = ({
//   despacho,
//   hideDespachoFormDialog,
//   despachos,
//   setDespachos,
// }: DespachoFormProps) => {
//   const { activeRefineria } = useRefineriaStore();
//   const toast = useRef<Toast | null>(null);
//   const calendarRef = useRef<Calendar>(null);
//   const [lineaDespachos, setLineaDespachos] = useState<LineaDespacho[]>([]);
//   const [tanques, setTanques] = useState<Tanque[]>([]);
//   const [contratos, setContratos] = useState<Contrato[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<Contrato | null>(
//     null
//   );
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
//     resolver: zodResolver(despachoSchema),
//     defaultValues: {
//       idGuia: 0,
//       cantidadEnviada: 0,
//       cantidadRecibida: 0,
//     },
//   });

//   useEffect(() => {
//     if (despacho) {
//       Object.keys(despacho).forEach((key) =>
//         setValue(key as keyof FormData, despacho[key])
//       );
//     }
//   }, [despacho, setValue]);
//   const fetchData = useCallback(async () => {
//     try {
//       const [lineaDespachosDB, tanquesDB, contratosDB] = await Promise.all([
//         getLineaDespachos(),
//         getTanques(),
//         getContratos(),
//       ]);

//       if (lineaDespachosDB && Array.isArray(lineaDespachosDB.lineaDespachos)) {
//         const filteredLineaDespachos = lineaDespachosDB.lineaDespachos.filter(
//           (lineaDespacho: LineaDespacho) =>
//             lineaDespacho.idRefineria.id === activeRefineria?.id
//         );
//         setLineaDespachos(filteredLineaDespachos);
//       }

//       if (tanquesDB && Array.isArray(tanquesDB.tanques)) {
//         const filteredTanques = tanquesDB.tanques.filter(
//           (tanque: Tanque) => tanque.idRefineria.id === activeRefineria?.id
//         );
//         setTanques(filteredTanques);
//       }

//       if (contratosDB && Array.isArray(contratosDB.contratos)) {
//         const filteredContratos = contratosDB.contratos.filter(
//           (contrato: Contrato) =>
//             contrato.idRefineria.id === activeRefineria?.id
//         );
//         setContratos(filteredContratos);
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
//     try {
//       if (despacho) {
//         const updatedDespacho = await updateDespacho(despacho.id, {
//           ...data,
//           idContrato: data.idContrato?.id,
//           idLineaDespacho: data.idLineaDespacho?.id,
//           idContratoItems: data.idContratoItems?.id,
//           idTanque: data.idTanque?.id,
//           idRefineria: activeRefineria?.id,
//         });
//         const updatedDespachos = despachos.map((t) =>
//           t.id === updatedDespacho.id ? updatedDespacho : t
//         );
//         setDespachos(updatedDespachos);
//         showToast("success", "Éxito", "Despacho actualizado");
//       } else {
//         if (!activeRefineria)
//           throw new Error("No se ha seleccionado una refinería");
//         const newDespacho = await createDespacho({
//           ...data,
//           idContrato: data.idContrato?.id,
//           idLineaDespacho: data.idLineaDespacho?.id,
//           idTanque: data.idTanque?.id,
//           idContratoItems: data.idContratoItems?.id,
//           idRefineria: activeRefineria?.id,
//         });
//         setDespachos([...despachos, newDespacho.despacho]);
//         showToast("success", "Éxito", "Despacho creado");
//       }
//       hideDespachoFormDialog();
//     } catch (error) {
//       console.error("Error al crear/modificar despacho:", error);
//       showToast(
//         "error",
//         "Error",
//         error instanceof Error ? error.message : "Ocurrió un error inesperado"
//       );
//     } finally {
//       setSubmitting(false); // Desactivar el estado de envío
//     }
//   };

//   const showToast = (
//     severity: "success" | "error",
//     summary: string,
//     detail: string
//   ) => {
//     toast.current?.show({ severity, summary, detail, life: 3000 });
//   };

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
//   const footerTemplate = () => (
//     <div className="flex justify-content-between">
//       <Button
//         label="Aceptar"
//         onClick={() => calendarRef.current?.hide()}
//         className="p-button-text"
//       />
//       <Button
//         label="Hoy"
//         onClick={() => {
//           const today = new Date();
//           setValue("fechaInicio", today); // Establece la fecha actual
//           calendarRef.current?.hide(); // Cierra el calendario
//         }}
//         className="p-button-text p-button-sm"
//       />
//       <Button
//         label="Limpiar"
//         onClick={() => {
//           setValue("fechaInicio", ""); // Limpia la fecha
//           calendarRef.current?.hide(); // Cierra el calendario
//         }}
//         className="p-button-text p-button-sm"
//       />
//     </div>
//   );
//   return (
//     <div>
//       <Toast ref={toast} />
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="grid formgrid p-fluid">
//           {/* Campo: ID de la Guía */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//             <label htmlFor="idGuia" className="font-medium text-900">
//               ID de la Guía
//             </label>
//             <Controller
//               name="idGuia"
//               control={control}
//               render={({ field }) => (
//                 <InputNumber
//                   id="idGuia"
//                   value={field.value}
//                   onValueChange={(e) => field.onChange(e.value)}
//                   className={classNames("w-full", {
//                     "p-invalid": errors.idGuia,
//                   })}
//                   min={0}
//                   locale="es"
//                 />
//               )}
//             />
//             {errors.idGuia && (
//               <small className="p-error">{errors.idGuia.message}</small>
//             )}
//           </div>
//           {/* Campo: Placa */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//             <label htmlFor="placa" className="font-medium text-900">
//               Placa
//             </label>
//             <InputText
//               id="placa"
//               {...register("placa")}
//               className={classNames("w-full", { "p-invalid": errors.placa })}
//             />
//             {errors.placa && (
//               <small className="p-error">{errors.placa.message}</small>
//             )}
//           </div>
//           {/* Campo: Nombre del Chofer */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="nombreChofer" className="font-medium text-900">
//               Nombre del Chofer
//             </label>
//             <InputText
//               id="nombreChofer"
//               {...register("nombreChofer")}
//               className={classNames("w-full", {
//                 "p-invalid": errors.nombreChofer,
//               })}
//             />
//             {errors.nombreChofer && (
//               <small className="p-error">{errors.nombreChofer.message}</small>
//             )}
//           </div>
//           {/* Campo: Apellido del Chofer */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="apellidoChofer" className="font-medium text-900">
//               Apellido del Chofer
//             </label>
//             <InputText
//               id="apellidoChofer"
//               {...register("apellidoChofer")}
//               className={classNames("w-full", {
//                 "p-invalid": errors.apellidoChofer,
//               })}
//             />
//             {errors.apellidoChofer && (
//               <small className="p-error">{errors.apellidoChofer.message}</small>
//             )}
//           </div>

//           {/* Campo: Número de Contrato */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idContacto.nombre" className="font-medium text-900">
//               Número de Contrato
//             </label>
//             <Dropdown
//               id="idContrato.id"
//               value={watch("idContrato")}
//               onChange={(e) => {
//                 setValue("idContrato", e.value);
//               }}
//               options={contratos.map((contrato) => ({
//                 label: contrato.numeroContrato,
//                 value: {
//                   id: contrato.id,
//                   idItems: contrato.idItems,
//                   numeroContrato: contrato.numeroContrato,
//                   _id: contrato.id,
//                 },
//               }))}
//               // options={contratos}
//               // optionLabel="numeroContrato"
//               placeholder="Seleccionar un proveedor"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idContrato?.numeroContrato,
//               })}
//             />
//             {errors.idContrato?.numeroContrato && (
//               <small className="p-error">
//                 {errors.idContrato.numeroContrato.message}
//               </small>
//             )}
//           </div>
//           {/* Campo: Nombre del producto*/}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idContacto.nombre" className="font-medium text-900">
//               Seleccione Producto
//             </label>
//             <Controller
//               name="idContratoItems"
//               control={control}
//               render={({ field }) => (
//                 <>
//                   {watch("idContrato.idItems")?.map((items) => (
//                     <div key={items.id} className="flex align-items-center">
//                       <RadioButton
//                         inputId={items.id}
//                         name="items"
//                         value={items}
//                         onChange={(e) => field.onChange(e.value)}
//                         checked={field.value?.id === items.id}
//                       />
//                       <label htmlFor={items.id} className="ml-2">
//                         {items.producto.nombre + "-" + items.cantidad + "Bbl"}
//                       </label>
//                     </div>
//                   ))}
//                 </>
//               )}
//             />
//             {errors.idContratoItems && (
//               <small className="p-error">
//                 {errors.idContratoItems.message}
//               </small>
//             )}
//           </div>
//           {/* Campo: Cantidad Enviada */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//             <label htmlFor="cantidadEnviada" className="font-medium text-900">
//               Cantidad Enviada
//             </label>
//             <Controller
//               name="cantidadEnviada"
//               control={control}
//               defaultValue={0} // Valor inicial como número
//               render={({ field }) => (
//                 <InputNumber
//                   id="cantidadEnviada"
//                   value={field.value}
//                   onValueChange={(e) => field.onChange(e.value ?? 0)} // Manejo de valores nulos
//                   className={classNames("w-full", {
//                     "p-invalid": errors.cantidadEnviada,
//                   })}
//                   min={0}
//                   locale="es"
//                 />
//               )}
//             />
//             {errors.cantidadEnviada && (
//               <small className="p-error">
//                 {errors.cantidadEnviada.message}
//               </small>
//             )}
//           </div>
//           {/* Campo: Cantidad Recibida */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//             <label htmlFor="cantidadRecibida" className="font-medium text-900">
//               Cantidad Recibida
//             </label>
//             <Controller
//               name="cantidadRecibida"
//               control={control}
//               render={({ field }) => (
//                 <InputNumber
//                   id="cantidadRecibida"
//                   value={field.value}
//                   onValueChange={(e) => field.onChange(e.value)}
//                   className={classNames("w-full", {
//                     "p-invalid": errors.cantidadRecibida,
//                   })}
//                   min={0}
//                   locale="es"
//                 />
//               )}
//             />
//             {errors.cantidadRecibida && (
//               <small className="p-error">
//                 {errors.cantidadRecibida.message}
//               </small>
//             )}
//           </div>
//           {/* Campo: Nombre de la Línea */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="id_contacto.nombre"
//               className="font-medium text-900"
//             >
//               Nombre de la Línea de Despacho
//             </label>
//             <Dropdown
//               id="idLineaDespacho.id"
//               value={watch("idLineaDespacho")}
//               // {...register("idLineaDespacho.id")}
//               onChange={(e) => {
//                 setValue("idLineaDespacho", e.value);
//               }}
//               options={lineaDespachos.map((lineaDespacho) => ({
//                 label: lineaDespacho.nombre,
//                 value: {
//                   id: lineaDespacho.id,
//                   nombre: lineaDespacho.nombre,
//                 },
//               }))}
//               placeholder="Seleccionar un proveedor"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idLineaDespacho?.nombre,
//               })}
//             />
//             {errors.idLineaDespacho?.nombre && (
//               <small className="p-error">
//                 {errors.idLineaDespacho.nombre.message}
//               </small>
//             )}
//           </div>

//           {/* Campo:  del Tanque */}
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

//           {/* Campo: Estado de carga*/}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="estadoEntrega" className="font-medium text-900">
//               Estado de Carga
//             </label>
//             <Dropdown
//               id="estadoCarga"
//               value={watch("estadoCarga")}
//               {...register("estadoCarga")}
//               options={estadoCargaOptions}
//               placeholder="Seleccionar estado de entrega"
//               className={classNames("w-full", {
//                 "p-invalid": errors.estadoCarga,
//               })}
//             />
//             {errors.estadoCarga && (
//               <small className="p-error">{errors.estadoCarga.message}</small>
//             )}
//           </div>

//           {/* Campo: Fecha de Inicio */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="fechaInicio" className="font-medium text-900">
//               Fecha de Inicio
//             </label>

//             <Controller
//               name="fechaInicio"
//               control={control}
//               render={({ field, fieldState }) => (
//                 <Calendar
//                   id="fechaInicio"
//                   value={field.value ? new Date(field.value) : null}
//                   onChange={(e) => field.onChange(e.value)}
//                   // onSelect={() => calendarRef.current?.hide()}
//                   showTime
//                   hourFormat="24"
//                   className={classNames("w-full", {
//                     "p-invalid": fieldState.error,
//                   })}
//                   locale="es"
//                   ref={calendarRef}
//                   // showButtonBar
//                   footerTemplate={footerTemplate}
//                 />
//               )}
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
//               className={classNames("w-full", { "p-invalid": errors.fechaFin })}
//               locale="es"
//             />
//             {/* <Controller
//               name="fechaFin"
//               control={control}
//               render={({ field, fieldState }) => (
//                 <Calendar
//                   id="fechaFin"
//                   value={field.value ? new Date(field.value) : null}
//                   onChange={(e) => {
//                     field.onChange(e.value); // Actualiza el valor del campo
//                     calendarRef.current?.hide(); // Cierra el calendario
//                   }}
//                   showTime
//                   hourFormat="24"
//                   className={classNames("w-full", {
//                     "p-invalid": fieldState.error,
//                   })}
//                   locale="es"
//                   ref={calendarRef} // Asigna la referencia
//                   showButtonBar
//                 />
//               )}
//             /> */}
//             {errors.fechaFin && (
//               <small className="p-error">{errors.fechaFin.message}</small>
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
//               options={estatusValues}
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
//             label={despacho ? "Modificar Recepción" : "Crear Recepción"}
//             className="w-auto mt-3"
//           />
//         </div>
//       </form>
//     </div>
//   );
// };

// export default DespachoForm;
