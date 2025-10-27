"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { muelleSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { useRefineriaStore } from "@/store/refineriaStore";
import { InputTextarea } from "primereact/inputtextarea";
import {
  createMuelleBK,
  updateMuelleBK,
} from "@/app/api/bunkering/muelleBKService";
import { Dropdown } from "primereact/dropdown";

type FormData = z.infer<typeof muelleSchema>;

interface MuelleFormProps {
  muelle: any;
  hideMuelleFormDialog: () => void;
  muelles: any[];
  setMuelles: (muelles: any[]) => void;
  setMuelle: (muelle: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
}

const MuelleForm = ({
  muelle,
  hideMuelleFormDialog,
  muelles,
  setMuelles,
  showToast,
}: MuelleFormProps) => {
  const { activeRefineria } = useRefineriaStore();
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
    resolver: zodResolver(muelleSchema),
  });

  useEffect(() => {
    if (muelle) {
      Object.keys(muelle).forEach((key) =>
        setValue(key as keyof FormData, muelle[key])
      );
    }
  }, [muelle, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (muelle) {
        const updatedMuelle = await updateMuelleBK(muelle.id, {
          ...data,
          idBunkering: activeRefineria?.id,
        });
        const updatedMuelles = muelles.map((t) =>
          t.id === updatedMuelle.id ? updatedMuelle : t
        );
        setMuelles(updatedMuelles);
        showToast("success", "Éxito", "Muelle actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newMuelle = await createMuelleBK({
          ...data,
          idBunkering: activeRefineria.id,
        });
        setMuelles([...muelles, newMuelle]);
        showToast("success", "Éxito", "Muelle creado");
      }
      hideMuelleFormDialog();
    } catch (error) {
      console.error("Error al crear/modificar muelle:", error);
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
                {muelle ? "Modificar Muelle" : "Crear Muelle"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Nombre */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-user mr-2 text-primary"></i>
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

            {/* Campo: NIT */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-id-card mr-2 text-primary"></i>
                  NIT
                </label>
                <InputText
                  id="nit"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.nit,
                  })}
                  {...register("nit")}
                />
                {errors.nit && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.nit.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Representante Legal */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-user-edit mr-2 text-primary"></i>
                  Representante Legal
                </label>
                <InputText
                  id="legal"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.legal,
                  })}
                  {...register("legal")}
                />
                {errors.legal && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.legal.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Teléfono */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-3 bg-white border-round shadow-1">
                <label className="block font-medium text-900 mb-2 flex align-items-center">
                  <i className="pi pi-phone text-primary mr-2"></i>
                  Teléfono
                </label>
                <InputText
                  id="telefono"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.telefono,
                  })}
                  {...register("telefono")}
                />
                {errors.telefono && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.telefono.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Correo */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-envelope mr-2 text-primary"></i>
                  Correo
                </label>
                <InputText
                  id="correo"
                  type="email"
                  className={classNames("w-full", {
                    "p-invalid": errors.correo,
                  })}
                  {...register("correo")}
                />
                {errors.correo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.correo.message}
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
                <InputTextarea
                  id="ubicacion"
                  className={classNames("w-full", {
                    "p-invalid": errors.ubicacion,
                  })}
                  {...register("ubicacion")}
                />
                {errors.ubicacion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.ubicacion.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Estado */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-info-circle mr-2 text-primary"></i>
                  Estado
                </label>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estado"
                      value={field.value}
                      options={[
                        { label: "Activo", value: "Activo" },
                        { label: "Inactivo", value: "Inactivo" },
                      ]}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione el estado"
                      className={classNames("w-full", {
                        "p-invalid": errors.estado,
                      })}
                    />
                  )}
                />
                {errors.estado && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.estado.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Imagen */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-image mr-2 text-primary"></i>
                  Imagen (URL)
                </label>
                <InputText
                  id="img"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.img,
                  })}
                  {...register("img")}
                />
                {errors.img && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.img.message}
                  </small>
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
              label={muelle ? "Modificar Muelle" : "Crear Muelle"}
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideMuelleFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default MuelleForm;
