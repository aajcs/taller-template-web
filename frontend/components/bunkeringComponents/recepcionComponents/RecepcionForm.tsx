import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { InputNumber } from "primereact/inputnumber";

import { Calendar } from "primereact/calendar";

import { ProgressSpinner } from "primereact/progressspinner";
import { truncateText } from "@/utils/funcionesUtiles";
import { Steps } from "primereact/steps";

import {
  fieldRulesCarga,
  fieldRulesRecepcion,
  getValidTransitionsRecepcion,
  EstadoRecepcion,
  estadoCargaOptions,
  estadoRecepcionOptions,
  EstadoCarga,
  estadoValidacionesRecepcion,
  estadoValidacionesCarga,
  getValidTransitionsCarga,
} from "@/libs/recepcionWorkflow";
import { RepecionFormRecepcion } from "./RepecionFormRecepcion";
import { ProgressBar } from "primereact/progressbar";
import CustomCalendar from "@/components/common/CustomCalendar";
import { Dialog } from "primereact/dialog";
import { recepcionBKSchema } from "@/libs/zods";
import { RecepcionBK } from "@/libs/interfaces";
import { useBunkeringData } from "@/hooks/useBunkeringData";
import {
  createRecepcionBK,
  updateRecepcionBK,
} from "@/app/api/bunkering/recepcionBKService";

type FormData = z.infer<typeof recepcionBKSchema>;

interface RecepcionFormProps {
  recepcion: any;
  hideRecepcionFormDialog: () => void;
  recepcionFormDialog: boolean;
  recepcions: RecepcionBK[];
  setRecepcions: (recepcions: RecepcionBK[]) => void;
  setRecepcion: (recepcion: any) => void;
  showToast: (
    severity: "success" | "error" | "warn",
    summary: string,
    detail: string
  ) => void;
}

const RecepcionForm = ({
  recepcion,
  hideRecepcionFormDialog,
  recepcionFormDialog,
  recepcions,
  setRecepcions,
  showToast,
}: RecepcionFormProps) => {
  const { activeRefineria } = useRefineriaStore();

  const { tanques, contratos, lineaRecepcions, loading } = useBunkeringData(
    activeRefineria?.id || ""
  );
  const calendarRef = useRef<Calendar>(null);

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(recepcionBKSchema),
    defaultValues: {
      idGuia: 0,
      cantidadEnviada: 250,
      cantidadRecibida: 0,
      estadoRecepcion: "PROGRAMADO", // Default initial state
      estadoCarga: "PENDIENTE_MUESTREO", // Default initial state for carga
      fechaInicioRecepcion: new Date(),
      fechaFinRecepcion: new Date(),
    },
  });
  useEffect(() => {
    if (recepcion) {
      Object.keys(recepcion).forEach((key) =>
        setValue(key as keyof FormData, recepcion[key])
      );
    }
    if (recepcion?.idChequeoCantidad) {
      setValue("cantidadRecibida", recepcion.idChequeoCantidad.cantidad);
    }
  }, [recepcion, setValue]);
  // Agrupar recepciones por contrato y producto
  const recepcionesPorContrato = useMemo(() => {
    return contratos.map((contrato) => {
      const recepcionesContrato = recepcions.filter(
        (recepcion) => recepcion.idContrato?.id === contrato.id
      );
      const productos = contrato.idItems.map((item: any) => {
        const recepcionesProducto = recepcionesContrato.filter(
          (recepcion) =>
            recepcion.idContratoItems?.producto.id === item.producto?.id &&
            recepcion.idContratoItems?.idTipoProducto ===
              item.idTipoProducto?.id
        );

        const cantidadRecibida = recepcionesProducto.reduce(
          (total, recepcion) => total + recepcion.cantidadRecibida,
          0
        );

        const cantidadFaltante = item.cantidad - cantidadRecibida;

        const porcentaje = (cantidadRecibida / item.cantidad) * 100;

        return {
          producto: item.producto,
          cantidad: item.cantidad,
          tipoProducto: item.idTipoProducto,
          recepciones: recepcionesProducto,
          cantidadRecibida,
          cantidadFaltante,
          porcentaje,
        };
      });

      return {
        ...contrato,
        productos,
      };
    });
  }, [contratos, recepcions]);
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        idContrato: data.idContrato?.id,
        idLinea: data.idLinea?.id,
        idTanque: data.idTanque?.id,
        idContratoItems: data.idContratoItems?.id,
        idBunkering: activeRefineria?.id,
      };

      if (recepcion) {
        const updatedRecepcion = await updateRecepcionBK(recepcion.id, payload);
        setRecepcions(
          recepcions.map((t) =>
            t.id === updatedRecepcion.id ? updatedRecepcion : t
          )
        );
      } else {
        const newRecepcion = await createRecepcionBK(payload);
        setRecepcions([...recepcions, newRecepcion.recepcion]);
      }
      hideRecepcionFormDialog();
    } catch (error) {
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const estadoRecepcion = watch("estadoRecepcion") as EstadoRecepcion;
  const estadoCarga = watch("estadoCarga") as EstadoCarga;
  // console.log(watch("idContrato"));
  const contrato = watch("idContrato");

  const validarCamposRequeridosRecepcion = (estadoDestino: string): boolean => {
    const camposRequeridos =
      estadoValidacionesRecepcion[
        estadoDestino as keyof typeof estadoValidacionesRecepcion
      ] || [];
    let isValid = true;

    for (const campo of camposRequeridos) {
      const valor = watch(campo as keyof FormData);

      if (!valor || (typeof valor === "number" && valor <= 0)) {
        isValid = false;

        // Marcar el campo como error
        setError(campo as keyof FormData, {
          type: "required",
          message: `El campo "${campo}" es obligatorio para cambiar a ${estadoDestino}`,
        });

        // Mostrar el mensaje de advertencia
        showToast(
          "warn",
          "Transición no válida",
          `El campo "${campo}" es obligatorio para cambiar a ${estadoDestino}`
        );
      } else {
        // Limpiar el error si el campo es válido
        clearErrors(campo as keyof FormData);
      }
    }

    return isValid;
  };

  const validarCamposRequeridosCarga = (estadoDestino: string): boolean => {
    const camposRequeridos =
      estadoValidacionesCarga[
        estadoDestino as keyof typeof estadoValidacionesCarga
      ] || [];
    let isValid = true;
    for (const campo of camposRequeridos) {
      const valor = watch(campo as keyof FormData);
      if (!valor || (typeof valor === "number" && valor <= 0)) {
        isValid = false;
        setError(campo as keyof FormData, {
          type: "required",
          message: `El campo "${campo}" es obligatorio para cambiar a ${estadoDestino}`,
        });
        showToast(
          "warn",
          "Transición no válida",
          `El campo "${campo}" es obligatorio para cambiar a ${estadoDestino}`
        );
      } else {
        clearErrors(campo as keyof FormData);
      }
    }
    return isValid;
  };

  const isFieldEnabledRecepcion = (
    fieldName: string,
    estadoRecepcion: EstadoRecepcion
  ): boolean => {
    return fieldRulesRecepcion[estadoRecepcion]?.[fieldName] ?? false;
  };

  const isFieldEnabledCarga = (
    fieldName: any,
    estadoCarga: EstadoCarga
  ): boolean => {
    return fieldRulesCarga[estadoCarga]?.[fieldName] ?? false;
  };

  return (
    <Dialog
      visible={recepcionFormDialog}
      style={{ width: "70vw", padding: "0px" }}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
              {recepcion ? "Editar" : "Agregar"} Recepción
            </h2>
          </div>
        </div>
      }
      modal
      onHide={hideRecepcionFormDialog}
      footer={
        <div className="flex justify-content-between align-items-center p-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text p-button-plain"
            onClick={hideRecepcionFormDialog}
          />
          {!loading && (
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : "pi pi-check"}
              label={recepcion ? "Modificar Recepción" : "Crear Recepción"}
              className={`p-button-raised ${
                submitting ? "p-button-secondary" : "p-button-primary"
              }`}
              onClick={handleSubmit(onSubmit)}
            />
          )}
        </div>
      }
    >
      <div>
        {loading ? (
          <div className="flex justify-content-center align-items-center">
            <ProgressSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <RepecionFormRecepcion
              control={control}
              errors={errors}
              watch={watch}
              showToast={showToast}
              isFieldEnabledRecepcion={(fieldName: string, estado: string) =>
                isFieldEnabledRecepcion(fieldName, estado as EstadoRecepcion)
              }
              estadoRecepcion={estadoRecepcion || "PROGRAMADO"}
              estadoRecepcionOptions={estadoRecepcionOptions}
              validarCamposRequeridosRecepcion={
                validarCamposRequeridosRecepcion
              }
              getValidTransitionsRecepcion={
                getValidTransitionsRecepcion as (
                  currentState: string
                ) => string[]
              }
              contratos={recepcionesPorContrato.filter(
                (contrato) => contrato.tipoContrato === "Compra"
              )}
              truncateText={truncateText}
              register={register}
              setValue={setValue}
              calendarRef={calendarRef}
            />
            {(watch("estadoRecepcion") === "EN_REFINERIA" ||
              watch("estadoRecepcion") === "COMPLETADO") &&
            recepcion?.idChequeoCalidad ? (
              <div className="card p-fluid surface-50 p-2 border-round shadow-2">
                {/* Header del Proceso */}
                <div className="mb-2 text-center md:text-left">
                  <div className="border-bottom-2 border-primary pb-2">
                    <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                      <i className="pi pi-cloud-download mr-3 text-primary text-3xl"></i>
                      Proceso de Descarga en Refinería
                    </h2>

                    {/* Stepper Estado de Carga */}
                    <div className="hidden lg:block">
                      <Controller
                        name="estadoCarga"
                        control={control}
                        render={({ field }) => {
                          // Verificar si el estatus es "Aprobado" y establecer automáticamente "MUESTREO_APROBADO"

                          return (
                            <Steps
                              model={estadoCargaOptions.map((option) => ({
                                label: option.label,
                                command: () => {
                                  const validTransitions =
                                    getValidTransitionsCarga(estadoCarga);
                                  if (
                                    validTransitions.includes(
                                      option.value as EstadoCarga
                                    )
                                  ) {
                                    if (
                                      validarCamposRequeridosCarga(option.value)
                                    ) {
                                      field.onChange(option.value);
                                    }
                                  } else {
                                    showToast(
                                      "warn",
                                      "Transición no válida",
                                      `No puedes cambiar a ${option.label} desde ${estadoCarga}`
                                    );
                                  }
                                },
                              }))}
                              activeIndex={estadoCargaOptions.findIndex(
                                (option) => option.value === field.value
                              )}
                              className="bg-white p-3 border-round shadow-1"
                              readOnly={false}
                            />
                          );
                        }}
                      />
                    </div>
                    <div className="p-3 bg-white border-round shadow-1 surface-card">
                      <div className="flex flex-column md:flex-row align-items-center justify-content-between">
                        {/* Información de Chequeo de Calidad */}
                        <div className="mb-3 md:mb-0">
                          <h3 className="text-xl font-bold text-900 mb-2 flex align-items-center">
                            <i className="pi pi-check-circle text-primary mr-2"></i>
                            Chequeo de Calidad
                          </h3>
                          <p className="text-700 mb-1">
                            <strong>Número:</strong>{" "}
                            {recepcion?.idChequeoCalidad
                              ?.numeroChequeoCalidad || "N/A"}
                          </p>
                          <p className="text-700">
                            <strong>Estatus:</strong>{" "}
                            <span
                              className={classNames("font-bold", {
                                "text-yellow-500": recepcion?.idChequeoCalidad,
                                "text-green-500":
                                  recepcion?.idChequeoCalidad?.estado ===
                                  "aprobado",
                                "text-red-500":
                                  recepcion?.idChequeoCalidad?.estado ===
                                  "rechazado",
                              })}
                            >
                              {recepcion?.idChequeoCalidad?.estado ||
                                "Pendiente"}
                            </span>
                          </p>
                        </div>

                        {/* Información de Chequeo de Cantidad */}
                        <div>
                          <h3 className="text-xl font-bold text-900 mb-2 flex align-items-center">
                            <i className="pi pi-chart-bar text-primary mr-2"></i>
                            Chequeo de Cantidad
                          </h3>
                          <p className="text-700">
                            <strong>Número:</strong>{" "}
                            {recepcion?.idChequeoCantidad
                              ?.numeroChequeoCantidad || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Dropdown Mobile */}
                    <div className="lg:hidden mt-3">
                      <Controller
                        name="estadoCarga"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            value={field.value}
                            onChange={(e) => field.onChange(e.value)}
                            options={estadoCargaOptions}
                            optionLabel="label"
                            placeholder="Estado de Carga"
                            className="w-full"
                            panelClassName="shadow-3"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Cuerpo del Formulario */}
                <div className="grid formgrid  row-gap-2">
                  {/* Línea de Descarga */}
                  <div className="col-12 md:col-6 lg:col-3">
                    <div className="p-2 bg-white border-round shadow-1 surface-card">
                      <label className="block font-medium text-900 mb-3 flex align-items-center">
                        <i className="pi pi-link mr-2 text-primary"></i>
                        Línea de Descarga
                      </label>
                      <Controller
                        name="idLinea"
                        control={control}
                        render={({ field }) => {
                          watch("idLinea");
                          const filteredLineas = !watch("idLinea")
                            ? lineaRecepcions.filter(
                                (lineaRecepcion) =>
                                  !recepcions.some(
                                    (recepcion) =>
                                      recepcion.idLinea?.id ===
                                        lineaRecepcion.id &&
                                      recepcion.estadoRecepcion ===
                                        "EN_REFINERIA" &&
                                      recepcion.estadoCarga === "EN_PROCESO"
                                  )
                              )
                            : lineaRecepcions;
                          const isDisabled = isFieldEnabledCarga(
                            "idLinea",
                            estadoCarga
                          );

                          return (
                            <Dropdown
                              value={field.value}
                              onChange={(e) => field.onChange(e.value)}
                              options={filteredLineas.map((lineaRecepcion) => ({
                                label: lineaRecepcion.nombre,
                                value: {
                                  id: lineaRecepcion.id,
                                  nombre: lineaRecepcion.nombre,
                                },
                              }))}
                              // optionLabel="nombre"
                              placeholder="Seleccionar línea"
                              className="w-full"
                              showClear
                              filter
                              disabled={isDisabled}
                            />
                          );
                        }}
                      />
                      {errors.idLinea && (
                        <small className="p-error block mt-2 flex align-items-center">
                          <i className="pi pi-exclamation-circle mr-2"></i>
                          {errors.idLinea.message}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Tanque Destino */}
                  <div className="col-12 md:col-6 lg:col-3">
                    <div className="p-2 bg-white border-round shadow-1 surface-card">
                      <label className="block font-medium text-900 mb-3 flex align-items-center">
                        <i className="pi pi-database mr-2 text-primary"></i>
                        Tanque Destino
                      </label>
                      <Controller
                        name="idTanque"
                        control={control}
                        render={({ field, fieldState }) => {
                          const selectedProducto =
                            watch("idContratoItems")?.producto;
                          const filteredTanques = tanques.filter(
                            (tanque) =>
                              tanque.idProducto?.id === selectedProducto?.id
                          );
                          const isDisabled = isFieldEnabledCarga(
                            "idTanque",
                            estadoCarga
                          );

                          return (
                            <>
                              <Dropdown
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                options={filteredTanques.map((tanque) => ({
                                  label: `${tanque.nombre} - ${
                                    tanque.idProducto?.nombre || "Sin producto"
                                  } (${tanque.almacenamiento || 0} Bbl)`,
                                  value: {
                                    id: tanque.id,
                                    nombre: tanque.nombre,
                                    _id: tanque.id,
                                  },
                                }))}
                                placeholder="Seleccionar tanque"
                                className={classNames("w-full", {
                                  "p-invalid": fieldState.error,
                                })}
                                showClear
                                filter
                                disabled={isDisabled}
                              />
                              {fieldState.error && (
                                <small className="p-error block mt-2 flex align-items-center">
                                  <i className="pi pi-exclamation-circle mr-2"></i>
                                  {fieldState.error.message}
                                </small>
                              )}
                            </>
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-12 md:col-6 lg:col-2">
                    <div className="p-2 bg-white border-round shadow-1 surface-card">
                      <label className="block font-medium text-900 mb-3 flex align-items-center">
                        <i className="pi pi-calendar-plus mr-2 text-primary"></i>
                        Inicio Descarga
                      </label>
                      {/* <Controller
                          name="fechaInicioRecepcion"
                          control={control}
                          render={({ field, fieldState }) => (
                            <>
                              <Calendar
                                id="fechaInicioRecepcion"
                                value={
                                  field.value
                                    ? new Date(field.value as string | Date)
                                    : undefined
                                }
                                onChange={(e) => field.onChange(e.value)}
                                showTime
                                hourFormat="24"
                                className={classNames("w-full", {
                                  "p-invalid": fieldState.error, // Aplica la clase de error si existe
                                })}
                                inputClassName="w-full"
                                locale="es"
                              />
                              {fieldState.error && (
                                <small className="p-error block mt-2 flex align-items-center">
                                  <i className="pi pi-exclamation-circle mr-2"></i>
                                  {fieldState.error.message}
                                </small>
                              )}
                            </>
                          )}
                        /> */}
                      <Controller
                        name="fechaInicioRecepcion"
                        defaultValue={new Date()}
                        control={control}
                        render={({ field, fieldState }) => (
                          <>
                            <CustomCalendar
                              {...field}
                              name="fechaInicioRecepcion"
                              control={control}
                              setValue={setValue}
                              calendarRef={calendarRef}
                              isFieldEnabled={isFieldEnabledCarga(
                                "fechaInicioRecepcion",
                                estadoCarga as EstadoCarga
                              )}
                              value={field.value ? new Date(field.value) : null}
                              onChange={field.onChange}
                            />

                            {fieldState.error && (
                              <small className="p-error block mt-2 flex align-items-center">
                                <i className="pi pi-exclamation-circle mr-2"></i>
                                {fieldState.error.message}
                              </small>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="col-12 md:col-6 lg:col-2">
                    <div className="p-2 bg-white border-round shadow-1 surface-card">
                      <label className="block font-medium text-900 mb-3 flex align-items-center">
                        <i className="pi pi-calendar-minus mr-2 text-primary"></i>
                        Fin Recepción
                      </label>
                      <Controller
                        name="fechaFinRecepcion"
                        control={control}
                        render={({ field, fieldState }) => (
                          <>
                            <CustomCalendar
                              {...field}
                              name="fechaFinRecepcion"
                              control={control}
                              setValue={setValue}
                              calendarRef={calendarRef}
                              isFieldEnabled={
                                isFieldEnabledCarga(
                                  "fechaFinRecepcion",
                                  estadoCarga as EstadoCarga
                                ) ||
                                isFieldEnabledRecepcion(
                                  "cantidadRecibida",
                                  estadoRecepcion as EstadoRecepcion
                                )
                              }
                              value={field.value ? new Date(field.value) : null}
                              onChange={field.onChange}
                            />

                            {fieldState.error && (
                              <small className="p-error block mt-2 flex align-items-center">
                                <i className="pi pi-exclamation-circle mr-2"></i>
                                {fieldState.error.message}
                              </small>
                            )}
                          </>
                        )}
                      />
                      {/* <Controller
                          name="fechaFinRecepcion"
                          control={control}
                          render={({ field, fieldState }) => (
                            <>
                              <Calendar
                                id="fechaFinRecepcion"
                                value={
                                  field.value
                                    ? new Date(field.value as string | Date)
                                    : undefined
                                }
                                onChange={(e) => field.onChange(e.value)}
                                showTime
                                hourFormat="24"
                                className={classNames("w-full", {
                                  "p-invalid": fieldState.error, // Aplica la clase de error si existe
                                })}
                                inputClassName="w-full"
                                locale="es"
                              />
                              {fieldState.error && (
                                <small className="p-error block mt-2 flex align-items-center">
                                  <i className="pi pi-exclamation-circle mr-2"></i>
                                  {fieldState.error.message}
                                </small>
                              )}
                            </>
                          )}
                        /> */}
                    </div>
                  </div>

                  {/* Cantidad Recibida */}
                  <div className="col-12 md:col-6 lg:col-2">
                    <div className="p-2 bg-white border-round shadow-1 surface-card">
                      <label className="block font-medium text-900 mb-3 flex align-items-center">
                        <i className="pi pi-chart-line mr-2 text-primary"></i>
                        Cantidad Recibida
                      </label>
                      <Controller
                        name="cantidadRecibida"
                        control={control}
                        render={({ field }) => (
                          <InputNumber
                            value={field.value}
                            onValueChange={(e) => field.onChange(e.value)}
                            mode="decimal"
                            min={0}
                            max={100000}
                            className="w-full"
                            inputClassName="w-full"
                            suffix=" Bbl"
                            locale="es"
                            disabled={
                              isFieldEnabledCarga(
                                "cantidadRecibida",
                                estadoCarga as EstadoCarga
                              ) ||
                              isFieldEnabledRecepcion(
                                "cantidadRecibida",
                                estadoRecepcion as EstadoRecepcion
                              )
                            }
                          />
                        )}
                      />
                      {errors.cantidadRecibida && (
                        <small className="p-error block mt-2 flex align-items-center">
                          <i className="pi pi-exclamation-circle mr-2"></i>
                          {errors.cantidadRecibida.message}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Nota Final */}
                  <div className="col-12 mt-2">
                    <div className="p-2 bg-blue-100 border-round-lg flex align-items-center surface-help">
                      <i className="pi pi-info-circle text-2xl text-primary mr-3"></i>
                      <span className="text-700">
                        Verifique todos los datos antes de finalizar el proceso.
                        <br />
                        <strong>Nota:</strong> La cantidad recibida no podrá ser
                        modificada después de completar la operación.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-fluid shadow-1 p-2 surface-50">
                {/* Header Estado General */}
                <div className="flex flex-column md:flex-row align-items-center justify-content-between mb-3 p-2 bg-white border-round">
                  <div className="text-center md:text-left mb-3 md:mb-0">
                    <h2 className="text-2xl font-bold text-900 mb-1">
                      <i className="pi pi-map-marker text-primary mr-2"></i>
                      Estado de la Operación
                    </h2>
                    <p className="text-600 mt-2 flex align-items-center">
                      <i className="pi pi-info-circle mr-2"></i>
                      {recepcion?.idChequeoCalidad
                        ? "Actualmente no estás en estado de refinería"
                        : "Actualmente esta esperando el chequeo de calidad"}
                    </p>
                  </div>
                  <i className="pi pi-truck text-6xl text-primary hidden md:block"></i>
                </div>

                {/* Tarjetas Informativas */}
                <div className="grid row-gap-2 ">
                  {/* Programaciones */}
                  <div className="col-12 md:col-6 lg:col-4">
                    <div className="p-3 bg-white border-round shadow-1 surface-card">
                      <div className="flex align-items-center justify-content-between mb-2">
                        <h3 className="font-medium text-900">
                          <i className="pi pi-calendar mr-2 text-primary"></i>
                          Programaciones
                        </h3>
                        <i className="pi pi-clock text-xl text-primary"></i>
                      </div>
                      <ul className="list-none p-0 m-0">
                        <li className="mb-3 flex align-items-center">
                          <i className="pi pi-history mr-2 text-600"></i>
                          Pendientes: <strong className="ml-2">2</strong>
                        </li>
                        <li className="flex align-items-center">
                          <i className="pi pi-check-circle mr-2 text-green-500"></i>
                          Actualización: <strong className="ml-2">Hoy</strong>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="col-12 md:col-6 lg:col-4">
                    <div className="p-3 bg-white border-round shadow-1 surface-card">
                      <div className="flex align-items-center justify-content-between mb-2">
                        <h3 className="font-medium text-900">
                          <i className="pi pi-bolt mr-2 text-primary"></i>
                          Acciones Rápidas
                        </h3>
                        <i className="pi pi-star text-xl text-primary"></i>
                      </div>
                      <div className="grid gap-2">
                        <Button
                          label="Nueva Programación"
                          icon="pi pi-plus"
                          className="p-button-sm w-full mb-2"
                          severity="help"
                          outlined
                        />
                        <Button
                          label="Ver Contratos"
                          icon="pi pi-file"
                          className="p-button-sm w-full"
                          severity="help"
                          outlined
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="col-12 lg:col-4">
                    <div className="p-3 bg-white border-round shadow-1 surface-card">
                      <div className="flex align-items-center justify-content-between mb-2">
                        <h3 className="font-medium text-900">
                          <i className="pi pi-chart-bar mr-2 text-primary"></i>
                          Progreso
                        </h3>
                        <i className="pi pi-chart-line text-xl text-primary"></i>
                      </div>
                      <div className="flex flex-column">
                        <ProgressBar
                          value={40}
                          showValue={false}
                          className="h-1rem mb-3"
                          style={{ borderRadius: "10px" }}
                        />
                        <span className="text-sm text-600 flex align-items-center">
                          <i className="pi pi-info-circle mr-2"></i>
                          Progreso general de operaciones
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerta Final */}
                <div className="mt-2 p-2 bg-yellow-100 border-round flex align-items-center surface-warning">
                  <i className="pi pi-exclamation-triangle text-2xl text-yellow-600 mr-3"></i>
                  <div>
                    <h4 className="text-900 mb-1">Acción Requerida</h4>
                    <p className="text-600 m-0">
                      Completa los datos de transporte para habilitar la
                      refinación
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Dialog>
  );
};

export default RecepcionForm;
