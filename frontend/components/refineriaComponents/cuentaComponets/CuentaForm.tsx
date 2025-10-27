// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { Controller, useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { InputText } from "primereact/inputtext";
// import { Button } from "primereact/button";
// import { classNames } from "primereact/utils";
// import { cuentaSchema } from "@/libs/zods";
// import { createCuenta, updateCuenta } from "@/app/api/cuentaService";
// import { Toast } from "primereact/toast";
// import { Dropdown } from "primereact/dropdown";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import { Checkbox } from "primereact/checkbox";
// import { InputTextarea } from "primereact/inputtextarea";
// import { InputNumber } from "primereact/inputnumber";
// import { useBunkeringData } from "@/hooks/useBunkeringData";
// import { truncateText } from "@/utils/funcionesUtiles";
//
// import { ProgressSpinner } from "primereact/progressspinner";
// import { Calendar } from "primereact/calendar";
// import { log } from "console";

// type FormData = z.infer<typeof cuentaSchema>;

// interface CuentaFormProps {
//   cuenta: any;
//   hideCuentaFormDialog: () => void;
//   cuentas: any[];
//   setCuentas: (cuentas: any[]) => void;
//   setCuenta: (cuenta: any) => void;
//   showToast: (
//     severity: "success" | "error",
//     summary: string,
//     detail: string
//   ) => void;
// }

// const estatusValues = ["true", "false"];
// const tipoValues = ["Cliente", "Proveedor"]; // Valores para el campo "tipo"

// const CuentaForm = ({
//   cuenta,
//   hideCuentaFormDialog,
//   cuentas,
//   setCuentas,
//   showToast,
// }: CuentaFormProps) => {
//   const { activeRefineria } = useRefineriaStore();
//   const { contratos, loading } = useRefineryData(activeRefineria?.id || "");
//   const toast = useRef<Toast | null>(null);
//   const estado_operacionOptions = [
//     { label: "Efectivo", value: "Efectivo" },
//     { label: "Cheque", value: "Cheque" },
//     { label: "Deposito", value: "Deposito" },
//   ];
//   const [submitting, setSubmitting] = useState(false);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     control,
//   } = useForm<FormData>({
//     resolver: zodResolver(cuentaSchema),
//   });
//   console.log("Errors:", errors);

//   useEffect(() => {
//     if (cuenta) {
//       Object.keys(cuenta).forEach((key) =>
//         setValue(key as keyof FormData, cuenta[key])
//       );
//     }
//   }, [cuenta, setValue]);

//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);
//     console.log("Datos del formulario:", data);
//     try {
//       if (cuenta) {
//         const updatedCuenta = await updateCuenta(cuenta.id, {
//           ...data,
//           idRefineria: activeRefineria?.id,
//         });
//         const updatedCuentas = cuentas.map((t) =>
//           t.id === updatedCuenta.id ? updatedCuenta : t
//         );
//         setCuentas(updatedCuentas);
//         showToast("success", "Éxito", "Cuenta actualizado");
//       } else {
//         if (!activeRefineria)
//           throw new Error("No se ha seleccionado una refinería");
//         const newCuenta = await createCuenta({
//           ...data,
//           idRefineria: activeRefineria.id,
//           idContrato: data.idContrato.id,
//         });
//         setCuentas([...cuentas, newCuenta]);
//         showToast("success", "Éxito", "Cuenta creado");
//       }
//       hideCuentaFormDialog();
//     } catch (error) {
//       console.error("Error al crear/modificar cuenta:", error);
//       showToast(
//         "error",
//         "Error",
//         error instanceof Error ? error.message : "Ocurrió un error inesperado"
//       );
//     } finally {
//       setSubmitting(false); // Desactivar el estado de envío
//     }
//   };
//   if (loading) {
//     return (
//       <div
//         className="flex justify-content-center align-items-center"
//         style={{ height: "300px" }}
//       >
//         <ProgressSpinner />
//       </div>
//     );
//   }
//   return (
//     <div>
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="card p-fluid surface-50 p-3 border-round shadow-2">
//           {/* Header del Formulario */}
//           <div className="mb-2 text-center md:text-left">
//             <div className="border-bottom-2 border-primary pb-2">
//               <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
//                 <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
//                 {cuenta ? "Modificar Cuenta" : "Crear Cuenta"}
//               </h2>
//             </div>
//           </div>

//           {/* Cuerpo del Formulario */}
//           <div className="grid formgrid row-gap-2">
//             {/* Campo: Número de Contrato */}
//             <div className="col-12 md:col-6 lg:col-4 xl:col-3">
//               <div className="p-3 bg-white border-round shadow-1">
//                 <label className="block font-medium text-900 mb-2 flex align-items-center">
//                   <i className="pi pi-file text-primary mr-2"></i>
//                   Número de Contrato
//                 </label>
//                 <Controller
//                   name="idContrato"
//                   control={control}
//                   render={({ field, fieldState }) => (
//                     <>
//                       <Dropdown
//                         id="idContrato.id"
//                         value={field.value}
//                         onChange={(e) => field.onChange(e.value)}
//                         options={contratos.map((contrato) => ({
//                           label: `${contrato.numeroContrato} - ${truncateText(
//                             contrato.descripcion || "Sin descripción",
//                             30
//                           )}`,
//                           value: {
//                             id: contrato.id,
//                             numeroContrato: contrato.numeroContrato,
//                             idItems: contrato.idItems,
//                             _id: contrato._id,
//                           },
//                         }))}
//                         placeholder="Seleccionar un proveedor"
//                         className={classNames("w-full", {
//                           "p-invalid": fieldState.error,
//                         })}
//                         showClear
//                         filter
//                       />
//                       {fieldState.error && (
//                         <small className="p-error block mt-2 flex align-items-center">
//                           <i className="pi pi-exclamation-circle mr-2"></i>
//                           {fieldState.error.message}
//                         </small>
//                       )}
//                     </>
//                   )}
//                 />
//               </div>
//             </div>

//             {/* Campo: Monto */}
//             <div className="col-12 md:col-6 lg:col-4 xl:col-3">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-chart-scatter mr-2 text-primary"></i>
//                   Monto
//                 </label>
//                 <Controller
//                   name="monto"
//                   control={control}
//                   render={({ field }) => (
//                     <InputNumber
//                       value={field.value}
//                       onValueChange={(e) => field.onChange(e.value)}
//                       min={0}
//                       className="w-full"
//                       locale="es"
//                     />
//                   )}
//                 />
//                 {errors.monto && (
//                   <small className="p-error block mt-2 flex align-items-center">
//                     <i className="pi pi-exclamation-circle mr-2"></i>
//                     {errors.monto.message}
//                   </small>
//                 )}
//               </div>
//             </div>

//             {/* Campo: Fecha de Cuenta */}
//             <div className="col-12 md:col-6 lg:col-4 xl:col-3">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-calendar mr-2 text-primary"></i>
//                   Fecha de Cuenta
//                 </label>
//                 <Controller
//                   name="fecha"
//                   control={control}
//                   render={({ field }) => (
//                     <Calendar
//                       value={field.value ? new Date(field.value) : null}
//                       onChange={(e) => field.onChange(e.value)}
//                       showTime
//                       hourFormat="24"
//                       className="w-full"
//                       locale="es"
//                     />
//                   )}
//                 />
//                 {errors.fecha && (
//                   <small className="p-error block mt-2 flex align-items-center">
//                     <i className="pi pi-exclamation-circle mr-2"></i>
//                     {errors.fecha.message}
//                   </small>
//                 )}
//               </div>
//             </div>

//             {/* Campo: Estado de Contrato */}
//             <div className="col-12 md:col-6 lg:col-4 xl:col-3">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-flag mr-2 text-primary"></i>
//                   Tipo de Operacion
//                 </label>
//                 <Controller
//                   name="tipoOperacion"
//                   control={control}
//                   render={({ field, fieldState }) => (
//                     <>
//                       <Dropdown
//                         id="tipoOperacion"
//                         {...field}
//                         options={estado_operacionOptions}
//                         placeholder="Seleccionar estado de operacion"
//                         className={classNames("w-full", {
//                           "p-invalid": fieldState.error,
//                         })}
//                         showClear
//                         filter
//                       />
//                       {fieldState.error && (
//                         <small className="p-error block mt-2 flex align-items-center">
//                           <i className="pi pi-exclamation-circle mr-2"></i>
//                           {fieldState.error.message}
//                         </small>
//                       )}
//                     </>
//                   )}
//                 />
//               </div>
//             </div>

//             {/* Campo: Referencia */}
//             <div className="col-12 sm:col-12 lg:col-12 xl:col-12">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-align-left mr-2 text-primary"></i>
//                   Referencia
//                 </label>
//                 <Controller
//                   name="referencia"
//                   control={control}
//                   render={({ field, fieldState }) => (
//                     <>
//                       <InputText
//                         id="referencia"
//                         {...field}
//                         className={classNames("w-full", {
//                           "p-invalid": fieldState.error,
//                         })}
//                       />
//                       {fieldState.error && (
//                         <small className="p-error block mt-2 flex align-items-center">
//                           <i className="pi pi-exclamation-circle mr-2"></i>
//                           {fieldState.error.message}
//                         </small>
//                       )}
//                     </>
//                   )}
//                 />
//               </div>
//             </div>

//             {/* Campo: Estado
//             <div className="col-12 md:col-6 lg:col-4 xl:col-3">
//               <div className="p-2 bg-white border-round shadow-1 surface-card">
//                 <label className="block font-medium text-900 mb-3 flex align-items-center">
//                   <i className="pi pi-info-circle mr-2 text-primary"></i>
//                   Estado
//                 </label>
//                 <Dropdown
//                   id="estado"
//                   value={watch("estado")}
//                   onChange={(e) => setValue("estado", e.value)}
//                   options={estatusValues}
//                   placeholder="Seleccionar"
//                   className={classNames("w-full", {
//                     "p-invalid": errors.estado,
//                   })}
//                 />
//                 {errors.estado && (
//                   <small className="p-error block mt-2 flex align-items-center">
//                     <i className="pi pi-exclamation-circle mr-2"></i>
//                     {errors.estado.message}
//                   </small>
//                 )}
//               </div>
//             </div> */}
//           </div>

//           {/* Botones */}
//           <div className="col-12 flex justify-content-between align-items-center mt-3">
//             <Button
//               type="submit"
//               disabled={submitting}
//               icon={submitting ? "pi pi-spinner pi-spin" : ""}
//               label={cuenta ? "Modificar Cuenta" : "Crear Cuenta"}
//               className="w-auto"
//             />

//             <Button
//               type="button"
//               label="Salir"
//               onClick={() => hideCuentaFormDialog()}
//               className="w-auto"
//               severity="danger"
//             />
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default CuentaForm;
