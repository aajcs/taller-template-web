import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { chequeoCalidadSchema } from "@/libs/zods";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import {
  createChequeoCalidad,
  updateChequeoCalidad,
} from "@/app/api/chequeoCalidadService";
import { InputNumber } from "primereact/inputnumber";

import { Calendar } from "primereact/calendar";

import { ProgressSpinner } from "primereact/progressspinner";

import { useByRefineryData } from "@/hooks/useByRefineryData";

type FormData = z.infer<typeof chequeoCalidadSchema>;

interface ChequeoCalidadFormProps {
  chequeoCalidad: any;
  hideChequeoCalidadFormDialog: () => void;
  chequeoCalidads: any[];
  setChequeoCalidads: (chequeoCalidads: any[]) => void;
  setChequeoCalidad: (chequeoCalidad: any) => void;
  showToast: (
    severity: "success" | "error" | "info",
    summary: string,
    detail: string
  ) => void;
  onDuplicate?: boolean;
  setOnDuplicate?: (onDuplicate: boolean) => void;
}

const ChequeoCalidadForm = ({
  chequeoCalidad,
  hideChequeoCalidadFormDialog,
  chequeoCalidads,
  setChequeoCalidads,
  showToast,
  onDuplicate,
  setOnDuplicate,
}: ChequeoCalidadFormProps) => {
  const { activeRefineria } = useRefineriaStore();

  const {
    productos = [],
    tanques = [],
    recepcions = [],
    despachos = [],
    loading,
  } = useByRefineryData(activeRefineria?.id || "");

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
    resolver: zodResolver(chequeoCalidadSchema),
    defaultValues: {
      azufre: 0,
      contenidoAgua: 0,
      aplicar: {
        tipo: "Recepcion",
      },
      gravedadAPI: 0,
      puntoDeInflamacion: 0,
      // cetano: 0,
      estado: "aprobado",
      fechaChequeo: new Date(),
    },
  });
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
  useEffect(() => {
    const referenciaSeleccionada = watch("aplicar.idReferencia");
    if (referenciaSeleccionada) {
      const productoRelacionado = productos.find(
        (producto) => producto.id === referenciaSeleccionada.id
      );
      if (productoRelacionado) {
        setValue("idProducto", {
          id: productoRelacionado.id,
          nombre: productoRelacionado.nombre,
          _id: productoRelacionado.id,
        });
      }
    }
  }, [watch("aplicar.idReferencia"), productos, setValue]);
  useEffect(() => {
    if (chequeoCalidad) {
      Object.keys(chequeoCalidad).forEach((key) =>
        setValue(key as keyof FormData, chequeoCalidad[key])
      );
    }
    if (onDuplicate && chequeoCalidad) {
      // Establecer valores predeterminados para el modo duplicado
      setValue("azufre", 0); // Cambiar el valor de azufre
      setValue("contenidoAgua", 0); // Cambiar el valor de contenido de agua

      setValue("gravedadAPI", 0); // Cambiar el valor de gravedad API
      setValue("puntoDeInflamacion", 0); // Cambiar el valor de punto de inflamación
      // setValue("cetano", 0); // Cambiar el valor de cetano
      setValue("fechaChequeo", new Date()); // Cambiar la fecha de chequeo
    }
  }, [chequeoCalidad, onDuplicate, setValue]);

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
        idRefineria: activeRefineria?.id,
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
        delete payload.numeroChequeoCalidad; // Si hay un número único, también eliminarlo
        showToast("info", "Duplicado", "Se está creando un duplicado");
      }

      if (chequeoCalidad && !onDuplicate) {
        // Actualización
        const updatedChequeoCalidad = await updateChequeoCalidad(
          chequeoCalidad.id,
          payload
        );

        const updatedChequeoCalidads = chequeoCalidads.map((t) =>
          t.id === updatedChequeoCalidad.id ? updatedChequeoCalidad : t
        );
        setChequeoCalidads(updatedChequeoCalidads);
        showToast("success", "Éxito", "Control de calidad actualizado");
      } else {
        // Creación o Duplicado
        if (!payload.idRefineria) {
          throw new Error("Debe seleccionar una refinería");
        }

        const newChequeoCalidad = await createChequeoCalidad(payload);
        setChequeoCalidads([...chequeoCalidads, newChequeoCalidad]);
        showToast(
          "success",
          "Éxito",
          onDuplicate
            ? "Duplicado creado exitosamente"
            : "Control de calidad creado"
        );
      }

      hideChequeoCalidadFormDialog();
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
                Chequeo de Calidad
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

            {/* Campo: Gravedad API */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-chart-line mr-2 text-primary"></i>
                  Gravedad API
                </label>
                <Controller
                  name="gravedadAPI"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      max={100}
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.gravedadAPI && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.gravedadAPI.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Azufre */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-percentage mr-2 text-primary"></i>
                  Azufre (%)
                </label>
                <Controller
                  name="azufre"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      max={100}
                      suffix="%"
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.azufre && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.azufre.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Contenido de Agua */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-water mr-2 text-primary"></i>
                  Contenido de Agua (%)
                </label>
                <Controller
                  name="contenidoAgua"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      max={100}
                      suffix="%"
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.contenidoAgua && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.contenidoAgua.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Punto de Inflamación */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-fire mr-2 text-primary"></i>
                  Punto de Inflamación (°C)
                </label>
                <Controller
                  name="puntoDeInflamacion"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      suffix="°C"
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.puntoDeInflamacion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.puntoDeInflamacion.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Índice Cetano
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-star mr-2 text-primary"></i>
                  Índice Cetano
                </label>
                <Controller
                  name="cetano"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      max={100}
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.cetano && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.cetano.message}
                  </small>
                )}
              </div>
            </div> */}

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
                  : chequeoCalidad
                  ? "Actualizar Chequeo de Calidad"
                  : "Crear Chequeo de Calidad"
              }
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideChequeoCalidadFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChequeoCalidadForm;
