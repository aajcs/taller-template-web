import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { chequeoCantidadBKSchema } from "@/libs/zods";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";

import { InputNumber } from "primereact/inputnumber";

import { Calendar } from "primereact/calendar";

import { ProgressSpinner } from "primereact/progressspinner";

import { useBunkeringData } from "@/hooks/useBunkeringData";
import {
  createChequeoCantidadBK,
  updateChequeoCantidadBK,
} from "@/app/api/bunkering/chequeoCantidadBKService";

type FormData = z.infer<typeof chequeoCantidadBKSchema>;

interface ChequeoCantidadFormProps {
  chequeoCantidad: any;
  hideChequeoCantidadFormDialog: () => void;
  chequeoCantidads: any[];
  setChequeoCantidads: (chequeoCantidads: any[]) => void;
  setChequeoCantidad: (chequeoCantidad: any) => void;
  showToast: (
    severity: "success" | "error" | "info",
    summary: string,
    detail: string
  ) => void;
  onDuplicate?: boolean;
  setOnDuplicate?: (onDuplicate: boolean) => void;
}

const ChequeoCantidadForm = ({
  chequeoCantidad,
  hideChequeoCantidadFormDialog,
  chequeoCantidads,
  setChequeoCantidads,
  showToast,
  onDuplicate,
  setOnDuplicate,
}: ChequeoCantidadFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { productos, tanques, recepcions, despachos, loading } =
    useBunkeringData(activeRefineria?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(chequeoCantidadBKSchema),
    defaultValues: {
      aplicar: {
        tipo: "Recepcion",
      },
      cantidad: 0,
      estado: "aprobado",
      fechaChequeo: new Date(),
    },
  });
  // Actualizar las opciones dinámicas según la selección de "Aplicar a"
  useEffect(() => {
    const { tipo } = watch("aplicar");
    if (tipo === "Tanque") {
      setDynamicOptions(
        tanques.map((tanque) => ({
          label: tanque.nombre,
          value: {
            id: tanque.id,
            nombre: tanque.nombre,
            _id: tanque.id,
          },
        }))
      );
    } else if (tipo === "Recepcion") {
      setDynamicOptions(
        recepcions.map((recepcion) => ({
          label: `Recepción - ${recepcion.idGuia}`,
          value: {
            id: recepcion.id,
            idGuia: recepcion.idGuia,
          },
        }))
      );
    } else if (tipo === "Despacho") {
      setDynamicOptions(
        despachos.map((despacho) => ({
          label: `Despacho - ${despacho.idGuia}`,
          value: {
            id: despacho.id,
            idGuia: despacho.idGuia,
            _id: despacho.id,
          },
        }))
      );
    } else {
      setDynamicOptions([]);
    }
  }, [watch("aplicar.tipo"), tanques, recepcions, despachos]);
  const tipoAplicar = watch("aplicar.tipo");
  const referencia = watch("aplicar.idReferencia");
  // Auto-seleccionar producto según el tipo de referencia
  useEffect(() => {
    if (!tipoAplicar || !referencia?.id) {
      setValue("idProducto", { id: "", nombre: "", _id: undefined });
      return;
    }

    let prod: { id: string; nombre: string } | undefined;

    if (tipoAplicar === "Recepcion") {
      const rc = recepcions.find((r) => r.id === referencia.id);
      prod = rc?.idContratoItems?.producto;
    } else if (tipoAplicar === "Tanque") {
      const tn = tanques.find((t) => t.id === referencia.id);
      prod = tn?.idProducto; // Asume que tanque tiene campo `producto`
    } else if (tipoAplicar === "Despacho") {
      const dsp = despachos.find((d) => d.id === referencia.id);
      prod = dsp?.idContratoItems?.producto;
    }

    if (prod) {
      setValue("idProducto", {
        id: prod.id,
        nombre: prod.nombre,
        _id: prod.id,
      });
    } else {
      setValue("idProducto", { id: "", nombre: "", _id: undefined });
    }
  }, [tipoAplicar, referencia, recepcions, tanques, despachos, setValue]);

  useEffect(() => {
    if (chequeoCantidad) {
      Object.keys(chequeoCantidad).forEach((key) =>
        setValue(key as keyof FormData, chequeoCantidad[key])
      );
    }
    if (onDuplicate && chequeoCantidad) {
      // Establecer valores predeterminados para el modo duplicado
      setValue("cantidad", 0); // Cambiar el valor de azufre

      setValue("fechaChequeo", new Date()); // Cambiar la fecha de chequeo
    }
  }, [chequeoCantidad, onDuplicate, setValue]);

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
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      let payload = {
        ...data,
        idBunkering: activeRefineria?.id,
        idProducto: data.idProducto?.id,
        idOperador: data.idOperador?.id,
        aplicar: {
          tipo: data.aplicar.tipo,
          idReferencia:
            data.aplicar.idReferencia.id || data.aplicar.idReferencia,
        },
      };

      if (onDuplicate) {
        // Si es un duplicado, eliminamos identificadores únicos
        delete payload.id; // Eliminar el identificador único
        delete payload.numeroChequeoCantidad; // Si hay un número único, también eliminarlo
        showToast("info", "Duplicado", "Se está creando un duplicado");
      }

      if (chequeoCantidad && !onDuplicate) {
        // Actualización
        const updatedChequeoCantidad = await updateChequeoCantidadBK(
          chequeoCantidad.id,
          payload
        );

        const updatedChequeoCantidads = chequeoCantidads.map((t) =>
          t.id === updatedChequeoCantidad.id ? updatedChequeoCantidad : t
        );
        setChequeoCantidads(updatedChequeoCantidads);
        showToast("success", "Éxito", "Control de calidad actualizado");
      } else {
        // Creación o Duplicado
        if (!payload.idBunkering) {
          throw new Error("Debe seleccionar una bunkering");
        }

        const newChequeoCantidad = await createChequeoCantidadBK(payload);
        setChequeoCantidads([...chequeoCantidads, newChequeoCantidad]);
        showToast(
          "success",
          "Éxito",
          onDuplicate
            ? "Duplicado creado exitosamente"
            : "Control de calidad creado"
        );
      }

      hideChequeoCantidadFormDialog();
    } catch (error) {
      console.error("Error en operación de calidad:", error);
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
      if (onDuplicate && setOnDuplicate) {
        setOnDuplicate(false); // Restablecer el estado de duplicado
      }
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card  p-fluid surface-50 p-3  border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                Chequeo de Cantidad
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Aplicar a */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-tag mr-2 text-primary"></i>
                  Aplicar a
                </label>
                <Controller
                  name="aplicar.tipo"
                  control={control}
                  rules={{ required: "Debe seleccionar una opción" }}
                  render={({ field }) => (
                    <Dropdown
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: "Tanque", value: "Tanque" },
                        { label: "Recepción", value: "Recepcion" },
                        { label: "Despacho", value: "Despacho" },
                      ]}
                      placeholder="Seleccionar aplicación"
                      className={classNames("w-full", {
                        "p-invalid": errors.aplicar,
                      })}
                    />
                  )}
                />
                {errors.aplicar && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.aplicar.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Referencia dinámica */}
            {watch("aplicar.tipo") && (
              <div className="col-12 md:col-6 lg:col-4 xl:col-3 xl:col-3">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-list mr-2 text-primary"></i>
                    Seleccionar {watch("aplicar.tipo")}
                  </label>
                  <Controller
                    name="aplicar.idReferencia"
                    control={control}
                    rules={{
                      required: `Debe seleccionar un ${watch("aplicar.tipo")}`,
                    }}
                    render={({ field }) => (
                      <Dropdown
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        options={dynamicOptions} // Opciones dinámicas según el tipo seleccionado
                        placeholder={`Seleccionar ${watch("aplicar.tipo")}`}
                        className={classNames("w-full", {
                          "p-invalid": errors.aplicar?.idReferencia,
                        })}
                        showClear
                        filter
                      />
                    )}
                  />
                  {errors.aplicar?.idReferencia && (
                    <small className="p-error block mt-2 flex align-items-center">
                      <i className="pi pi-exclamation-circle mr-2"></i>
                      {errors.aplicar.idReferencia.message}
                    </small>
                  )}
                </div>
              </div>
            )}
            {/* Campo: Producto */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-box mr-2 text-primary"></i>
                  Producto
                </label>
                <Controller
                  name="idProducto"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={productos.map((producto) => ({
                        label: producto.nombre,
                        value: {
                          id: producto.id,
                          nombre: producto.nombre,
                          _id: producto.id,
                        },
                      }))}
                      placeholder="Seleccionar producto"
                      className="w-full"
                      showClear
                      filter
                      disabled
                    />
                  )}
                />
                {errors.idProducto?.nombre && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.idProducto.nombre.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Operador */}
            {/* <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-user mr-2 text-primary"></i>
                  Operador
                </label>
                <Controller
                  name="idOperador"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={operadors.map((operador: any) => ({
                        label: operador.nombre,
                        value: {
                          id: operador.id,
                          nombre: operador.nombre,
                        },
                      }))}
                      placeholder="Seleccionar operador"
                      className="w-full"
                      showClear
                      filter
                    />
                  )}
                />
                {errors.idOperador?.nombre && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.idOperador.nombre.message}
                  </small>
                )}
              </div>
            </div> */}

            {/* Campo: Fecha de Chequeo */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2 text-primary"></i>
                  Fecha de Chequeo
                </label>
                <Controller
                  name="fechaChequeo"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      value={field.value ? new Date(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      showTime
                      hourFormat="24"
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.fechaChequeo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.fechaChequeo.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Cantidad */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-chart-scatter mr-2 text-primary"></i>
                  Cantidad
                </label>
                <Controller
                  name="cantidad"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.cantidad && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.cantidad.message}
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
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: "Aprobado", value: "aprobado" },
                        { label: "Rechazado", value: "rechazado" },
                      ]}
                      placeholder="Seleccionar estado"
                      className="w-full"
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
          </div>

          {/* Botón de Envío */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={
                onDuplicate
                  ? "Crear Duplicado"
                  : chequeoCantidad
                  ? "Actualizar Chequeo de Cantidad"
                  : "Crear Chequeo de Cantidad"
              }
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideChequeoCantidadFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChequeoCantidadForm;
