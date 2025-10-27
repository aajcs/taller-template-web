"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { productoSchema } from "@/libs/zods";
import { createProducto, updateProducto } from "@/app/api/productoService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";
import { ColorPicker } from "primereact/colorpicker";
import { handleFormError } from "@/utils/errorHandlers";

type FormData = z.infer<typeof productoSchema>;

interface ProductoFormProps {
  producto: any;
  hideProductoFormDialog: () => void;
  productos: any[];
  setProductos: (productos: any[]) => void;
  setProducto: (producto: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estatusValues = ["true", "false"];
const tipoMaterialValues = ["Materia Prima", "Derivado"];

const ProductoForm = ({
  producto,
  toast,
  hideProductoFormDialog,
  productos,
  setProductos,
  showToast,
}: ProductoFormProps) => {
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
    resolver: zodResolver(productoSchema),
    defaultValues: {
      posicion: 0,
    },
  });
  useEffect(() => {
    if (producto) {
      Object.keys(producto).forEach((key) =>
        setValue(key as keyof FormData, producto[key])
      );
      if (Array.isArray(producto.material)) {
      }
    }
  }, [producto, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (producto) {
        const updatedProducto = await updateProducto(producto.id, {
          ...data,
          idRefineria: activeRefineria?.id,
        });
        const updatedProductos = productos.map((t) =>
          t.id === updatedProducto.id ? updatedProducto : t
        );
        setProductos(updatedProductos);
        showToast("success", "Éxito", "Producto actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newProducto = await createProducto({
          ...data,
          idRefineria: activeRefineria.id,
        });
        setProductos([...productos, newProducto]);
        showToast("success", "Éxito", "Producto creado");
      }
      hideProductoFormDialog();
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
                {producto ? "Modificar Producto" : "Crear Producto"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Nombre */}
            <div className="col-12 md:col-6 lg:col-4 ">
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
            {/* Campo: Posición */}
            <div className="col-12 md:col-6 lg:col-4 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-sort-numeric-up mr-2 text-primary"></i>
                  Posición
                </label>
                <Controller
                  name="posicion"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      className={classNames("w-full", {
                        "p-invalid": errors.posicion,
                      })}
                    />
                  )}
                />
                {errors.posicion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.posicion.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Color */}
            <div className="col-12 md:col-6 lg:col-4 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-palette mr-2 text-primary"></i>
                  Color
                </label>
                <ColorPicker
                  id="color"
                  format="hex"
                  value={watch("color")}
                  {...register("color")}
                  className={classNames("w-full", {
                    "p-invalid": errors.color,
                  })}
                />
                {errors.color && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.color.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Estado */}
            <div className="col-12 md:col-6 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-info-circle mr-2 text-primary"></i>
                  Categoria
                </label>
                <Dropdown
                  id="tipoMaterial"
                  value={watch("tipoMaterial")}
                  onChange={(e) => setValue("tipoMaterial", e.value)}
                  options={tipoMaterialValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.tipoMaterial,
                  })}
                />
                {errors.tipoMaterial && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.tipoMaterial.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Tipo de Material
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-list mr-2 text-primary"></i>
                  Tipo de Material
                </label>
                <Dropdown
                  id="tipoMaterial"
                  value={watch("tipoMaterial")}
                  onChange={(e) => setValue("tipoMaterial", e.value)}
                  options={tipoMaterialValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.tipoMaterial,
                  })}
                />
                {errors.tipoMaterial && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.tipoMaterial.message}
                  </small>
                )}
              </div>
            </div> */}
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
              label={producto ? "Modificar Producto" : "Crear Producto"}
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideProductoFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductoForm;
