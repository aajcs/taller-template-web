"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { embarcacionSchema } from "@/libs/zods";

import { Toast } from "primereact/toast";
import { InputSwitch } from "primereact/inputswitch";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputNumber } from "primereact/inputnumber";
import {
  createEmbarcacionBK,
  updateEmbarcacionBK,
} from "@/app/api/bunkering/embarcacionBKService";
import { Embarcacion } from "@/libs/interfaces";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";

type FormData = z.infer<typeof embarcacionSchema>;

interface EmbarcacionFormProps {
  embarcacion: Embarcacion | null;
  hideEmbarcacionFormDialog: () => void;
  embarcacions: any[];
  setEmbarcacions: (embarcacions: any[]) => void;
  setEmbarcacion: (embarcacion: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
}

const EmbarcacionForm = ({
  embarcacion,
  hideEmbarcacionFormDialog,
  embarcacions,
  setEmbarcacions,
  showToast,
}: EmbarcacionFormProps) => {
  const toast = useRef<Toast | null>(null);
  const { activeRefineria } = useRefineriaStore();

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(embarcacionSchema),
    defaultValues: {
      capacidad: 0,
    },
  });
  useEffect(() => {
    if (embarcacion) {
      (Object.keys(embarcacion) as (keyof FormData)[]).forEach((key) => {
        // @ts-expect-error: TypeScript may complain if Embarcacion has extra fields, but we only set those present in FormData
        setValue(key, embarcacion[key]);
      });
    }
  }, [embarcacion, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (embarcacion) {
        const updatedTorre = await updateEmbarcacionBK(embarcacion.id, {
          ...data,
          idBunkering: activeRefineria?.id,
        });
        const updatedEmbarcacions = embarcacions.map((t) =>
          t.id === updatedTorre.id ? updatedTorre : t
        );
        setEmbarcacions(updatedEmbarcacions);
        showToast("success", "Éxito", "Embarcacion actualizado");
      } else {
        const newEmbarcacion = await createEmbarcacionBK({
          ...data,
          idBunkering: activeRefineria?.id,
        });
        setEmbarcacions([...embarcacions, newEmbarcacion]);
        showToast("success", "Éxito", "Embarcacion creado");
      }
      hideEmbarcacionFormDialog();
    } catch (error) {
      console.error("Error al crear/modificar embarcacion:", error);
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setSubmitting(false); // Desactivar el estado de envío
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {embarcacion ? "Modificar Embarcacion" : "Crear Embarcacion"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid">
            {/* Campo: Nombre */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-tag mr-2 text-primary"></i>
                  Nombre
                </label>
                <InputText
                  id="nombre"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.nombre,
                  })}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.nombre.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: IMO */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-hashtag mr-2 text-primary"></i>
                  IMO
                </label>
                <InputText
                  id="imo"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.imo,
                  })}
                  {...register("imo")}
                />
                {errors.imo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.imo.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Tipo */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-list mr-2 text-primary"></i>
                  Tipo
                </label>
                <Controller
                  name="tipo"
                  control={control}
                  rules={{ required: "El tipo es requerido" }}
                  render={({ field, fieldState }) => (
                    <Dropdown
                      id="tipo"
                      value={field.value || ""}
                      options={[
                        { label: "Gabarra", value: "Gabarra" },
                        { label: "Remolcador", value: "Remolcador" },
                        { label: "Buque", value: "Buque" },
                      ]}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione tipo"
                      className={classNames("w-full", {
                        "p-invalid": fieldState.error,
                      })}
                    />
                  )}
                />
                {errors.tipo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.tipo.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Capacidad */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-chart-bar mr-2 text-primary"></i>
                  Capacidad
                </label>
                <Controller
                  name="capacidad"
                  control={control}
                  rules={{ required: "La capacidad es requerida" }}
                  render={({ field, fieldState }) => (
                    <InputNumber
                      id="capacidad"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      className={classNames("w-full", {
                        "p-invalid": fieldState.error,
                      })}
                      suffix=" bbl"
                    />
                  )}
                />
                {errors.capacidad && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.capacidad.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Tanques */}
            <div className="col-12">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <div className="flex justify-content-between align-items-center mb-2">
                  <label className="block font-medium text-900">
                    <i className="pi pi-box mr-2 text-primary"></i>
                    Tanques
                  </label>
                  <Button
                    icon="pi pi-plus"
                    label="Agregar Tanque"
                    size="small"
                    type="button"
                    onClick={() => {
                      const tanques = watch("tanques") || [];
                      setValue("tanques", [
                        ...tanques,
                        {
                          nombre: "",
                          capacidad: 0,
                          almacenamiento: 0,
                          ubicacion: "",
                          eliminado: false,
                        },
                      ]);
                    }}
                  />
                </div>
                {(watch("tanques") ?? []).length > 0 ? (
                  <ul className="list-none p-0 m-0">
                    {(watch("tanques") ?? []).map((tanque, idx) => (
                      <li
                        key={tanque._id || idx}
                        className="flex align-items-center justify-content-between border-bottom-1 surface-border py-2"
                      >
                        <div className="flex gap-2 flex-wrap align-items-center w-full">
                          <InputText
                            placeholder="Nombre"
                            value={tanque.nombre}
                            className="w-10rem"
                            onChange={(e) => {
                              const tanques = [...(watch("tanques") || [])];
                              tanques[idx].nombre = e.target.value;
                              setValue("tanques", tanques);
                            }}
                          />
                          <InputNumber
                            placeholder="Capacidad"
                            value={tanque.capacidad}
                            onValueChange={(e) => {
                              const tanques = [...(watch("tanques") || [])];
                              tanques[idx].capacidad = e.value ?? 0;
                              setValue("tanques", tanques);
                            }}
                            className="w-8rem"
                            suffix=" bbl"
                          />
                          <InputNumber
                            placeholder="Almacenamiento"
                            value={tanque.almacenamiento}
                            onValueChange={(e) => {
                              const tanques = [...(watch("tanques") || [])];
                              tanques[idx].almacenamiento = e.value ?? 0;
                              setValue("tanques", tanques);
                            }}
                            className="w-8rem"
                            suffix=" %"
                          />
                          <Dropdown
                            value={tanque.ubicacion}
                            options={[
                              { label: "Proa", value: "Proa" },
                              { label: "Popa", value: "Popa" },
                              { label: "Centro", value: "Centro" },
                            ]}
                            onChange={(e) => {
                              const tanques = [...(watch("tanques") || [])];
                              tanques[idx].ubicacion = e.value;
                              setValue("tanques", tanques);
                            }}
                            placeholder="Ubicación"
                            className="w-8rem"
                          />
                          <Button
                            icon="pi pi-trash"
                            severity="danger"
                            rounded
                            size="small"
                            type="button"
                            onClick={() => {
                              const tanques = [...(watch("tanques") || [])];
                              tanques.splice(idx, 1);
                              setValue("tanques", tanques);
                            }}
                            tooltip="Eliminar"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-600">Sin tanques</div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={
                embarcacion ? "Modificar Embarcacion" : "Crear Embarcacion"
              }
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideEmbarcacionFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmbarcacionForm;
