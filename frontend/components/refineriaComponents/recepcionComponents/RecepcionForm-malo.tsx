// // components/recepcion/RecepcionForm.tsx
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useForm, FormProvider, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Toast } from "primereact/toast";
// import { ProgressSpinner } from "primereact/progressspinner";
// import { Steps } from "primereact/steps";
// import { Button } from "primereact/button";
// import { RadioButton } from "primereact/radiobutton";

// import { recepcionSchema } from "@/libs/zod";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import { createRecepcion, updateRecepcion } from "@/app/api/recepcionService";
// import { truncateText } from "@/utils/funcionesUtiles";
// import { workflowConfig } from "@/libs/recepcionWorkflow";

//
// import { EstadoRecepcionSection } from "./estadoRecepcion";

// type FormData = z.infer<typeof recepcionSchema>;

// interface RecepcionFormProps {
//   recepcion?: any;
//   hideRecepcionFormDialog: () => void;
//   recepcions: any[];
//   setRecepcions: (recepcions: any[]) => void;
// }

// const RecepcionForm = ({
//   recepcion,
//   hideRecepcionFormDialog,
//   recepcions,
//   setRecepcions,
// }: RecepcionFormProps) => {
//   const { activeRefineria } = useRefineriaStore();
//   const { tanques, contratos, lineaRecepcions, loading } = useRefineryData(
//     activeRefineria?.id || ""
//   );
//   const toast = useRef<Toast>(null);

//   const [submitting, setSubmitting] = useState(false);

//   const methods = useForm<FormData>({
//     resolver: zodResolver(recepcionSchema),
//     defaultValues: {
//       idGuia: 0,
//       cantidadEnviada: 0,
//       cantidadRecibida: 0,
//       estadoRecepcion: "PROGRAMADO",
//       estadoCarga: "PENDIENTE_MUESTREO",
//       ...recepcion,
//     },
//   });

//   const { control, handleSubmit, setValue, watch } = methods;
//   const estadoRecepcion = useWatch({ control, name: "estadoRecepcion" });
//   const estadoCarga = useWatch({ control, name: "estadoCarga" });

//   // ... (fetchData y useEffect se mantienen similares pero con mejor manejo de errores)

//   const onSubmit = async (data: FormData) => {
//     setSubmitting(true);
//     try {
//       const payload = {
//         ...data,
//         idContrato: data.idContrato?.id,
//         idLinea: data.idLinea?.id,
//         idTanque: data.idTanque?.id,
//         idContratoItems: data.idContratoItems?.id,
//         idRefineria: activeRefineria?.id,
//       };

//       if (recepcion) {
//         const updatedRecepcion = await updateRecepcion(recepcion.id, payload);
//         setRecepcions(
//           recepcions.map((t) =>
//             t.id === updatedRecepcion.id ? updatedRecepcion : t
//           )
//         );
//       } else {
//         const newRecepcion = await createRecepcion(payload);
//         setRecepcions([...recepcions, newRecepcion.recepcion]);
//       }
//       hideRecepcionFormDialog();
//     } catch (error) {
//       showToast(
//         "error",
//         "Error",
//         error instanceof Error ? error.message : "Error desconocido"
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const getFieldState = (field: string, type: "recepcion" | "carga") => {
//     const rules =
//       type === "recepcion"
//         ? workflowConfig.estadosRecepcion.reglasCampos[
//             estadoRecepcion as EstadoRecepcion
//           ]
//         : workflowConfig.estadosCarga.reglasCampos[estadoCarga as EstadoCarga];

//     return rules?.includes(field) ?? false;
//   };

//   if (loading) return <LoadingSpinner />;

//   return (
//     <div>
//       <Toast ref={toast} />
//       <FormProvider {...methods}>
//         <form
//           onSubmit={handleSubmit(onSubmit)}
//           className="grid formgrid p-fluid"
//         >
//           <EstadoRecepcionSection />

//           <DatosContratoSection
//             contratos={contratos}
//             disabled={!getFieldState("idContrato", "recepcion")}
//           />

//           <DatosEnvioSection
//             disabledPlaca={!getFieldState("placa", "recepcion")}
//             disabledChofer={!getFieldState("nombreChofer", "recepcion")}
//           />

//           <EstadoCargaSection />

//           <DatosDescargaSection
//             lineaRecepcions={lineaRecepcions}
//             tanques={tanques}
//             disabledLinea={!getFieldState("idLinea", "carga")}
//             disabledTanque={!getFieldState("idTanque", "carga")}
//           />

//           <SubmitButton submitting={submitting} isEdit={!!recepcion} />
//         </form>
//       </FormProvider>
//     </div>
//   );
// };

// const LoadingSpinner = () => (
//   <div
//     className="flex justify-content-center align-items-center"
//     style={{ height: "300px" }}
//   >
//     <ProgressSpinner />
//   </div>
// );

// const SubmitButton = ({
//   submitting,
//   isEdit,
// }: {
//   submitting: boolean;
//   isEdit: boolean;
// }) => (
//   <div className="col-12">
//     <Button
//       type="submit"
//       disabled={submitting}
//       icon={submitting ? "pi pi-spinner pi-spin" : ""}
//       label={isEdit ? "Modificar Recepción" : "Crear Recepción"}
//       className="w-auto mt-3"
//     />
//   </div>
// );

// export default React.memo(RecepcionForm);
