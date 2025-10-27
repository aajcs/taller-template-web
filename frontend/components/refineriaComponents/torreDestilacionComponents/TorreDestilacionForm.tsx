"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { torreDestilacionSchema } from "@/libs/zods";
import {
  createTorreDestilacion,
  updateTorreDestilacion,
} from "@/app/api/torreDestilacionService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { Material, Producto } from "@/libs/interfaces";
import { getProductos } from "@/app/api/productoService";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { handleFormError } from "@/utils/errorHandlers";

type FormData = z.infer<typeof torreDestilacionSchema>;

interface TorreDestilacionFormProps {
  torreDestilacion: any;
  hideTorreDestilacionFormDialog: () => void;
  torresDestilacion: any[];
  setTorresDestilacion: (torresDestilacion: any[]) => void;
  setTorreDestilacion: (torreDestilacion: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estatusValues = ["true", "false"];

const TorreDestilacionForm = ({
  toast,
  torreDestilacion,
  hideTorreDestilacionFormDialog,
  torresDestilacion,
  setTorresDestilacion,
  showToast,
}: TorreDestilacionFormProps) => {
  const { activeRefineria } = useRefineriaStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estado para materiales seleccionados
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(torreDestilacionSchema),
    defaultValues: {
      capacidad: 0,
    },
  });

  const fetchData = useCallback(async () => {
    try {
      const productosDB = await getProductos();
      if (productosDB && Array.isArray(productosDB.productos)) {
        const filteredProductos = productosDB.productos.filter(
          (producto: Producto) =>
            producto.idRefineria?.id === activeRefineria?.id &&
            producto.tipoMaterial === "Derivado"
        );
        setProductos(filteredProductos);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeRefineria]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (torreDestilacion && torreDestilacion.material) {
      Object.keys(torreDestilacion).forEach((key) =>
        setValue(key as keyof FormData, torreDestilacion[key])
      );
      setSelectedMaterials(torreDestilacion.material);
    }
  }, [torreDestilacion]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const requestData = {
        ...data,
        material: selectedMaterials,
      };

      if (torreDestilacion) {
        const updatedTorre = await updateTorreDestilacion(torreDestilacion.id, {
          ...requestData,
          idRefineria: activeRefineria?.id,
        });
        const updatedTorres = torresDestilacion.map((t) =>
          t.id === updatedTorre.id ? updatedTorre : t
        );
        setTorresDestilacion(updatedTorres);
        showToast("success", "Éxito", "Torre de destilación actualizada");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newTorre = await createTorreDestilacion({
          ...requestData,
          idRefineria: activeRefineria.id,
        });
        setTorresDestilacion([...torresDestilacion, newTorre]);
        showToast("success", "Éxito", "Torre de destilación creada");
      }
      hideTorreDestilacionFormDialog();
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      setSubmitting(false);
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
                {torreDestilacion
                  ? "Modificar Torre de Destilación"
                  : "Crear Torre de Destilación"}
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

            {/* Campo: Capacidad */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-chart-bar mr-2 text-primary"></i>
                  Capacidad de procesamiento
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
            {/* Campo: Materiales */}
            <div className="col-12">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-box mr-2 text-primary"></i>
                  Materiales y Procesamiento
                </label>

                {/* Selector de Materiales */}
                <MultiSelect
                  value={selectedMaterials.map((m) => m.idProducto)}
                  options={productos}
                  optionLabel="nombre"
                  onChange={(e) => {
                    const selectedIds = e.value;
                    const nuevosMateriales = selectedIds.map((id: any) => {
                      // Buscar si ya existe en los seleccionados
                      const existente = selectedMaterials.find(
                        (m) => m.idProducto === id
                      );
                      return (
                        existente || {
                          idProducto: id,
                          estadoMaterial: "True",
                          porcentaje: 0,
                        }
                      );
                    });
                    setSelectedMaterials(nuevosMateriales);
                  }}
                  display="chip"
                  placeholder="Seleccionar materiales"
                  maxSelectedLabels={3}
                  className="w-full mb-3"
                  disabled={loading}
                  selectAllLabel="Seleccionar todos"
                />

                {/* Inputs de Porcentaje */}
                {selectedMaterials.map((material, index) => (
                  <div
                    key={index}
                    className="flex align-items-center gap-3 mb-2"
                  >
                    <span className="w-6rem">
                      {productos.find((p) => p.id === material.idProducto?.id)
                        ?.nombre || "Material"}
                    </span>

                    <InputNumber
                      value={material.porcentaje}
                      onValueChange={(e) => {
                        const nuevosMateriales = [...selectedMaterials];
                        nuevosMateriales[index].porcentaje = e.value || 0;
                        setSelectedMaterials(nuevosMateriales);
                      }}
                      mode="decimal"
                      min={0}
                      max={100}
                      suffix="%"
                      className="w-6rem"
                    />

                    <Button
                      icon="pi pi-times"
                      className="p-button-danger p-button-text"
                      onClick={() => {
                        const nuevosMateriales = selectedMaterials.filter(
                          (_, i) => i !== index
                        );
                        setSelectedMaterials(nuevosMateriales);
                      }}
                    />
                  </div>
                ))}
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
                torreDestilacion
                  ? "Modificar Torre de Destilación"
                  : "Crear Torre de Destilación"
              }
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideTorreDestilacionFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TorreDestilacionForm;
