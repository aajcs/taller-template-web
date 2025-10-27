"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { lineaRecepcionSchema } from "@/libs/zods";
import {
  createLineaRecepcion,
  updateLineaRecepcion,
} from "@/app/api/lineaRecepcionService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { Checkbox } from "primereact/checkbox";
import { handleFormError } from "@/utils/errorHandlers";

type FormData = z.infer<typeof lineaRecepcionSchema>;

interface LineaRecepcionFormProps {
  lineaRecepcion: any;
  hideLineaRecepcionFormDialog: () => void;
  lineaRecepcions: any[];
  setLineaRecepcions: (lineaRecepcions: any[]) => void;
  setLineaRecepcion: (lineaRecepcion: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estatusValues = ["Activo", "Inactivo", "Mantenimiento"];

const LineaRecepcionForm = ({
  lineaRecepcion,
  toast,
  hideLineaRecepcionFormDialog,
  lineaRecepcions,
  setLineaRecepcions,
  showToast,
}: LineaRecepcionFormProps) => {
  const { activeRefineria } = useRefineriaStore();

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(lineaRecepcionSchema),
  });
  useEffect(() => {
    if (lineaRecepcion) {
      Object.keys(lineaRecepcion).forEach((key) =>
        setValue(key as keyof FormData, lineaRecepcion[key])
      );
      if (Array.isArray(lineaRecepcion.material)) {
      }
    }
  }, [lineaRecepcion, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (lineaRecepcion) {
        const updatedLineaRecepcion = await updateLineaRecepcion(
          lineaRecepcion.id,
          {
            ...data,
            idRefineria: activeRefineria?.id,
          }
        );
        const updatedLineaRecepcions = lineaRecepcions.map((t) =>
          t.id === updatedLineaRecepcion.id ? updatedLineaRecepcion : t
        );
        setLineaRecepcions(updatedLineaRecepcions);
        showToast("success", "Éxito", "LineaRecepcion actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newLineaRecepcion = await createLineaRecepcion({
          ...data,
          idRefineria: activeRefineria.id,
        });
        setLineaRecepcions([...lineaRecepcions, newLineaRecepcion]);
        showToast("success", "Éxito", "LineaRecepcion creado");
      }
      hideLineaRecepcionFormDialog();
    } catch (error) {
    handleFormError(error, toast); // Pasamos la referencia del toast
      
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
                {lineaRecepcion
                  ? "Modificar Línea de Recepción"
                  : "Crear Línea de Recepción"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Nombre */}
            <div className="col-12 md:col-6 ">
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
            {/* Campo: Estado */}
            <div className="col-12 md:col-6 ">
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
            </div>
            {/* Campo: Ubicación
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-map-marker mr-2 text-primary"></i>
                  Ubicación
                </label>
                <InputText
                  id="ubicacion"
                  type="text"
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
            </div> */}
          </div>

          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={
                lineaRecepcion
                  ? "Modificar Línea de Recepción"
                  : "Crear Línea de Recepción"
              }
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideLineaRecepcionFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default LineaRecepcionForm;
