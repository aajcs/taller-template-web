// import React, { useEffect, useRef, useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { InputText } from "primereact/inputtext";
// import { Button } from "primereact/button";
// import { classNames } from "primereact/utils";
// import { recepcionSchema } from "@/libs/zod";
// import { Toast } from "primereact/toast";
// import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import { createRecepcion, updateRecepcion } from "@/app/api/recepcionService";
// import { InputNumber } from "primereact/inputnumber";

// import { Calendar } from "primereact/calendar";
// import { getLineaRecepcions } from "@/app/api/lineaRecepcionService";
// import { Contrato, LineaRecepcion, Tanque } from "@/libs/interfaces";
// import { getTanques } from "@/app/api/tanqueService";
// import { getContratos } from "@/app/api/contratoService";
// import { RadioButton } from "primereact/radiobutton";

// type FormData = z.infer<typeof recepcionSchema>;

// interface RecepcionFormProps {
//   recepcion: any;
//   hideRecepcionFormDialog: () => void;
//   recepcions: any[];
//   setRecepcions: (recepcions: any[]) => void;
//   setRecepcion: (recepcion: any) => void;
// }

// const estatusValues = ["true", "false"];

// function RecepcionForm({
//   recepcion,
//   hideRecepcionFormDialog,
//   recepcions,
//   setRecepcions,
// }: RecepcionFormProps) {
//   const { activeRefineria } = useRefineriaStore();
//   const toast = useRef<Toast | null>(null);
//   const [lineaRecepcions, setLineaRecepcions] = useState<LineaRecepcion[]>([]);
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
//     resolver: zodResolver(recepcionSchema),
//   });

//   const [productos] = useState<string[]>([
//     "Nafta",
//     "Queroseno",
//     "Fuel Oil 4 (MGO)",
//     "Fuel Oil 6 (Fondo)",
//     "Petroleo Crudo",
//   ]);
//   useEffect(() => {
//     if (recepcion) {
//       Object.keys(recepcion).forEach((key) =>
//         setValue(key as keyof FormData, recepcion[key])
//       );
//     }
//   }, [recepcion, setValue]);
//   useEffect(() => {
//     fetchLineaRecepcions();
//     fetchTanques();
//     fetchContratos();
//   }, [activeRefineria]);

//   const fetchLineaRecepcions = async () => {
//     try {
//       const lineaRecepcionsDB = await getLineaRecepcions();
//       if (lineaRecepcionsDB && Array.isArray(lineaRecepcionsDB.lineaCargas)) {
//         const filteredLineaRecepcions = lineaRecepcionsDB.lineaCargas.filter(
//           (lineaRecepcion: LineaRecepcion) =>
//             lineaRecepcion.idRefineria.id === activeRefineria?.id
//         );
//         setLineaRecepcions(filteredLineaRecepcions);
//       } else {
//         console.error("La estructura de lineaRecepcionsDB no es la esperada");
//       }
//     } catch (error) {
//       console.error("Error al obtener los lineaRecepcions:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const fetchTanques = async () => {
//     try {
//       const tanquesDB = await getTanques();
//       if (tanquesDB && Array.isArray(tanquesDB.tanques)) {
//         const filteredTanques = tanquesDB.tanques.filter(
//           (tanque: Tanque) => tanque.idRefineria.id === activeRefineria?.id
//         );
//         setTanques(filteredTanques);
//       } else {
//         console.error("La estructura de tanquesDB no es la esperada");
//       }
//     } catch (error) {
//       console.error("Error al obtener los tanques:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const fetchContratos = async () => {
//     try {
//       const contratosDB = await getContratos();
//       if (contratosDB && Array.isArray(contratosDB.contratos)) {
//         const filteredContratos = contratosDB.contratos.filter(
//           (contrato: Contrato) =>
//             contrato.idRefineria.id === activeRefineria?.id
//         );
//         setContratos(filteredContratos);
//       } else {
//         console.error("La estructura de contratosDB no es la esperada");
//       }
//     } catch (error) {
//       console.error("Error al obtener los contratos:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);
//     try {
//       if (recepcion) {
//         const updatedRecepcion = await updateRecepcion(recepcion.id, data);
//         const updatedRecepcions = recepcions.map((t) =>
//           t.id === updatedRecepcion.id ? updatedRecepcion : t
//         );
//         setRecepcions(updatedRecepcions);
//         showToast("success", "Éxito", "Recepcion actualizado");
//       } else {
//         if (!activeRefineria)
//           throw new Error("No se ha seleccionado una refinería");
//         const newRecepcion = await createRecepcion({
//           ...data,
//           idRefineria: activeRefineria.id,
//         });
//         setRecepcions([...recepcions, newRecepcion.nuevoRecepcion]);
//         showToast("success", "Éxito", "Recepcion creado");
//       }
//       hideRecepcionFormDialog();
//     } catch (error) {
//       console.error("Error al crear/modificar recepcion:", error);
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

//   // console.log(errors);
//   // console.log(JSON.stringify(watch("idContrato"), null, 2));
//   console.log(watch("idContrato"));
//   return (
//     <div>
//       <Toast ref={toast} />
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="grid formgrid p-fluid">
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

//           {/* Campo: Cantidad Recibida */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
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
//                 />
//               )}
//             />
//             {errors.cantidadRecibida && (
//               <small className="p-error">
//                 {errors.cantidadRecibida.message}
//               </small>
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
//               className={classNames("w-full", { "p-invalid": errors.fechaFin })}
//               locale="es"
//             />
//             {errors.fechaFin && (
//               <small className="p-error">{errors.fechaFin.message}</small>
//             )}
//           </div>

//           {/* Campo: Número de Contrato */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idContacto.nombre" className="font-medium text-900">
//               Numero de Contrato
//             </label>
//             <Dropdown
//               id="idContrato.id"
//               value={watch("idContrato")}
//               // {...register("idLinea.id")}
//               onChange={(e) => {
//                 setValue("idContrato", e.value);
//               }}
//               options={contratos.map((contrato) => ({
//                 label: contrato.numeroContrato,
//                 value: {
//                   id: contrato.id,
//                   idContacto: contrato.idContacto,
//                   idItems: contrato.idItems,
//                   idRefineria: contrato.idRefineria,
//                   numeroContrato: contrato.numeroContrato,
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
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idContacto.nombre" className="font-medium text-900">
//               Seleccione Producto
//             </label>
//             {watch("idContrato.idItems")?.map((items) => {
//               return (
//                 <div key={items.id} className="flex align-items-center">
//                   <RadioButton
//                     inputId={items.id}
//                     name="items"
//                     value={items}
//                     onChange={(e) => setSelectedCategory(e.value)}
//                     checked={selectedCategory?.id === items.id}
//                   />
//                   <label htmlFor={items.id} className="ml-2">
//                     {items.producto + "-" + items.cantidad + "Bbl"}
//                   </label>
//                 </div>
//               );
//             })}
//             {/* <Dropdown
//               id="idContrato.id"
//               value={watch("idContrato")}
//               // {...register("idLinea.id")}
//               onChange={(e) => {
//                 setValue("idContrato", e.value);
//               }}
//               options={contratos.map((contrato) => ({
//                 label: contrato.numeroContrato,
//                 value: {
//                   id: contrato.id,
//                   nombre: contrato.numeroContrato,
//                 },
//               }))}
//               placeholder="Seleccionar un proveedor"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idContrato?.numeroContrato,
//               })}
//             /> */}
//             {errors.idContrato?.numeroContrato && (
//               <small className="p-error">
//                 {errors.idContrato.numeroContrato.message}
//               </small>
//             )}
//           </div>

//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="idContrato.numeroContrato"
//               className="font-medium text-900"
//             >
//               Número de Contrato
//             </label>
//             <InputText
//               id="idContrato.numeroContrato"
//               {...register("idContrato.numeroContrato")}
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
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="id_contacto.nombre"
//               className="font-medium text-900"
//             >
//               Nombre de la Línea
//             </label>
//             <Dropdown
//               id="idLinea.id"
//               value={watch("idLinea")}
//               // {...register("idLinea.id")}
//               onChange={(e) => {
//                 setValue("idLinea", e.value);
//               }}
//               options={lineaRecepcions.map((lineaRecepcion) => ({
//                 label: lineaRecepcion.nombre,
//                 value: {
//                   id: lineaRecepcion.id,
//                   nombre: lineaRecepcion.nombre,
//                 },
//               }))}
//               placeholder="Seleccionar un proveedor"
//               className={classNames("w-full", {
//                 "p-invalid": errors.idLinea?.nombre,
//               })}
//             />
//             {errors.idLinea?.nombre && (
//               <small className="p-error">{errors.idLinea.nombre.message}</small>
//             )}
//           </div>
//           {/* Campo: Nombre de la Línea */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idLinea.nombre" className="font-medium text-900">
//               Nombre de la Línea
//             </label>
//             <InputText
//               id="idLinea.nombre"
//               {...register("idLinea.nombre")}
//               className={classNames("w-full", {
//                 "p-invalid": errors.idLinea?.nombre,
//               })}
//             />
//             {errors.idLinea?.nombre && (
//               <small className="p-error">{errors.idLinea.nombre.message}</small>
//             )}
//           </div>
//           {/* Campo:  del Tanque */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label
//               htmlFor="id_contacto.nombre"
//               className="font-medium text-900"
//             >
//               Nombre de Tanque
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
//           {/* Campo: ID del Tanque */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//             <label htmlFor="idTanque.id" className="font-medium text-900">
//               Nombre del Tanque
//             </label>
//             <InputText
//               id="idTanque.nombre"
//               {...register("idTanque.nombre")}
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

//           {/* Campo: Placa */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
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

//           {/* Campo: ID de la Guía */}
//           <div className="field mb-4 col-12 sm:col-6 lg:col-4">
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
//                 />
//               )}
//             />
//             {errors.idGuia && (
//               <small className="p-error">{errors.idGuia.message}</small>
//             )}
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default RecepcionForm;
