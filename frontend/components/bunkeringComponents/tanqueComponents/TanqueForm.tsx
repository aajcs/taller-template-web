"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";

import { ProgressSpinner } from "primereact/progressspinner";
import { InputNumber } from "primereact/inputnumber";
import { tanqueBKSchema } from "@/libs/zods";
import {
  createTanqueBK,
  updateTanqueBK,
} from "@/app/api/bunkering/tanqueBKService";
import { useByRefineryData } from "@/hooks/useByRefineryData";

type FormData = z.infer<typeof tanqueBKSchema>;

interface TanqueFormProps {
  tanque: any;
  hideTanqueFormDialog: () => void;
  tanques: any[];
  setTanques: (tanques: any[]) => void;
  setTanque: (tanque: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
}
const materiales = [
  "Nafta",
  "Fuel Oil 4 (MGO)",
  "Fuel Oil 6 (Fondo)",
  "Queroseno",
  "Petroleo Crudo",
];
const estatusValues = ["Activo", "Inactivo", "Mantenimiento"];

const TanqueForm = ({
  tanque,
  hideTanqueFormDialog,
  tanques,
  setTanques,
  showToast,
}: TanqueFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { productos = [], loading } = useByRefineryData(
    activeRefineria?.id as string
  );
  const toast = useRef<Toast | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(tanqueBKSchema),
    defaultValues: {
      capacidad: 0,
      almacenamiento: 0,
    },
  });
  useEffect(() => {
    if (tanque) {
      Object.keys(tanque).forEach((key) =>
        setValue(key as keyof FormData, tanque[key])
      );
    }
  }, [tanque, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (tanque) {
        const updatedTorre = await updateTanqueBK(tanque.id, {
          ...data,
          idBunkering: activeRefineria?.id,
        });
        const updatedTanques = tanques.map((t) =>
          t.id === updatedTorre.id ? updatedTorre : t
        );
        setTanques(updatedTanques);
        showToast("success", "Éxito", "Tanque actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newTanque = await createTanqueBK({
          ...data,
          idBunkering: activeRefineria.id,
        });
        setTanques([...tanques, newTanque]);
        showToast("success", "Éxito", "Tanque creado");
      }
      hideTanqueFormDialog();
    } catch (error) {
      console.error("Error al crear/modificar tanque:", error);
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setSubmitting(false); // Desactivar el estado de envío
    }
  };
  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {tanque ? "Modificar Tanque" : "Crear Tanque"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Embarcación */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-ship mr-2 text-primary"></i>
                  Embarcación
                </label>
                <InputText
                  id="idEmbarcacion.nombre"
                  value={watch("idEmbarcacion")?.nombre || ""}
                  disabled
                  className="w-full"
                />
              </div>
            </div>

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

            {/* Campo: Ubicación */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-map-marker mr-2 text-primary"></i>
                  Ubicación
                </label>
                <Controller
                  name="ubicacion"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Dropdown
                      id="ubicacion"
                      value={field.value}
                      options={[
                        { label: "Proa", value: "Proa" },
                        { label: "Popa", value: "Popa" },
                        { label: "Centro", value: "Centro" },
                      ]}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar"
                      className={classNames("w-full", {
                        "p-invalid": fieldState.error,
                      })}
                    />
                  )}
                />
                {errors.ubicacion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.ubicacion.message}
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

            {/* Campo: Almacenamiento */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-box mr-2 text-primary"></i>
                  Almacenamiento
                </label>
                <Controller
                  name="almacenamiento"
                  control={control}
                  rules={{ required: "El almacenamiento es requerido" }}
                  render={({ field, fieldState }) => (
                    <InputNumber
                      id="almacenamiento"
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
                {errors.almacenamiento && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.almacenamiento.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Estado
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-info-circle mr-2 text-primary"></i>
                  Estado
                </label>
                <Dropdown
                  id="estado"
                  value={watch("estado")}
                  onChange={(e) => setValue("estado", e.value)}
                  options={estatusValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.estado,
                  })}
                />
                {errors.estado && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.estado.message}
                  </small>
                )}
              </div>
            </div> */}
          </div>

          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={tanque ? "Modificar Tanque" : "Crear Tanque"}
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideTanqueFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TanqueForm;
