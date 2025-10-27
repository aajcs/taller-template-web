"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";

import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { InputNumber } from "primereact/inputnumber";

import { ProgressSpinner } from "primereact/progressspinner";
import { MultiSelect } from "primereact/multiselect";
import { Rendimiento } from "@/libs/interfaces";
import {
  createTipoProductoBK,
  updateTipoProductoBK,
} from "@/app/api/bunkering/tipoProductoBKService";
import { useBunkeringData } from "@/hooks/useBunkeringData";
import { tipoProductoBKSchema } from "@/libs/zods/tipoProductoBKZod";
import {
  RendimientoBK,
  TipoProductoBK,
} from "@/libs/interfaces/tipoProductoBKInterface";
import { Dialog } from "primereact/dialog";

type FormData = z.infer<typeof tipoProductoBKSchema>;

interface TipoProductoFormProps {
  tipoProducto: any;
  tipoProductoFormDialog: boolean;
  hideTipoProductoFormDialog: () => void;
  tipoProductos: TipoProductoBK[];
  setTipoProductos: (tipoProductos: any[]) => void;
  setTipoProducto: (tipoProducto: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
}

const clasificacionValues = ["Liviano", "Mediano", "Pesado"];

const TipoProductoForm = ({
  tipoProducto,
  tipoProductoFormDialog,
  hideTipoProductoFormDialog,
  tipoProductos,
  setTipoProductos,
  showToast,
}: TipoProductoFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { productos, loading } = useBunkeringData(activeRefineria?.id || "");
  const toast = useRef<Toast | null>(null);
  const [selectedRendimientos, setSelectedRendimientos] = useState<
    RendimientoBK[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(tipoProductoBKSchema),
    defaultValues: {
      nombre: "",
      clasificacion: "",
      gravedadAPI: 0,
      azufre: 0,
      contenidoAgua: 0,
      puntoDeInflamacion: 0,
      estado: "true",
    },
  });

  useEffect(() => {
    if (tipoProducto) {
      Object.keys(tipoProducto).forEach((key) =>
        setValue(key as keyof FormData, tipoProducto[key])
      );
      setSelectedRendimientos(tipoProducto.rendimientos);
    }
  }, [tipoProducto, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const requestData = {
        ...data,
        idBunkering: activeRefineria?.id,
        idProducto: data.idProducto?.id,
        rendimientos: selectedRendimientos.map(
          ({
            idProducto,
            porcentaje,
            transporte,
            bunker,
            costoVenta,
            convenio,
          }) => ({
            idProducto: idProducto.id,
            porcentaje,
            transporte,
            bunker,
            costoVenta,
            convenio,
          })
        ),
      };
      if (tipoProducto) {
        const updatedTipoProducto = await updateTipoProductoBK(
          tipoProducto.id,
          requestData
        );
        const updatedTipoProductos = tipoProductos.map((t) =>
          t.id === updatedTipoProducto.id ? updatedTipoProducto : t
        );
        setTipoProductos(updatedTipoProductos);
        showToast("success", "Éxito", "TipoProducto actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newTipoProducto = await createTipoProductoBK(requestData);
        setTipoProductos([...tipoProductos, newTipoProducto]);
        showToast("success", "Éxito", "TipoProducto creado");
      }
      hideTipoProductoFormDialog();
    } catch (error) {
      console.error("Error al crear/modificar tipoProducto:", error);
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }
  return (
    <Dialog
      visible={tipoProductoFormDialog}
      style={{ width: "70vw", padding: "0px" }}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
              {tipoProducto ? "Editar" : "Agregar"} Tipo de Producto
            </h2>
          </div>
        </div>
      }
      modal
      onHide={hideTipoProductoFormDialog}
      footer={
        <div className="flex justify-content-between align-items-center p-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text p-button-plain"
            onClick={hideTipoProductoFormDialog}
          />
          {!loading && (
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : "pi pi-check"}
              label={tipoProducto ? "Modificar Recepción" : "Crear Recepción"}
              className={`p-button-raised ${
                submitting ? "p-button-secondary" : "p-button-primary"
              }`}
              onClick={handleSubmit(onSubmit)}
            />
          )}
        </div>
      }
    >
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-fluid">
          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Nombre del Producto */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-box mr-2 text-primary"></i>
                  Producto Asociado
                </label>
                <Dropdown
                  id="idProducto"
                  value={watch("idProducto")}
                  onChange={(e) => setValue("idProducto", e.value)}
                  options={productos.map((producto) => ({
                    label: producto.nombre,
                    value: {
                      id: producto.id,
                      _id: producto.id,
                      nombre: producto.nombre,
                      color: producto.color,
                    },
                  }))}
                  placeholder="Seleccionar un producto"
                  className={classNames("w-full", {
                    "p-invalid": errors.idProducto?.nombre,
                  })}
                />
                {errors.idProducto?.nombre && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.idProducto.nombre.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Nombre */}
            <div className="col-12 md:col-6 lg:col-4">
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
            {/* Campo: Procedencia */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-tag mr-2 text-primary"></i>
                  Procedencia
                </label>
                <InputText
                  id="procedencia"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.procedencia,
                  })}
                  {...register("procedencia")}
                />
                {errors.procedencia && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.procedencia.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Clasificación */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-list mr-2 text-primary"></i>
                  Clasificación
                </label>
                <Dropdown
                  id="clasificacion"
                  value={watch("clasificacion")}
                  onChange={(e) => setValue("clasificacion", e.value)}
                  options={clasificacionValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.clasificacion,
                  })}
                />
                {errors.clasificacion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.clasificacion.message}
                  </small>
                )}
              </div>
            </div>
            {/* Campo: Gravedad API */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-sliders-h mr-2 text-primary"></i>
                  Gravedad API
                </label>
                <Controller
                  name="gravedadAPI"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      className={classNames("w-full", {
                        "p-invalid": errors.gravedadAPI,
                      })}
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
            <div className="col-12 md:col-6 lg:col-4">
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
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      className={classNames("w-full", {
                        "p-invalid": errors.azufre,
                      })}
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
            {/* Campo: Costo Operacional */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-dollar mr-2 text-primary"></i>
                  Costo Operacional
                </label>
                <Controller
                  name="costoOperacional"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      className={classNames("w-full", {
                        "p-invalid": errors.costoOperacional,
                      })}
                    />
                  )}
                />
                {errors.costoOperacional && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.costoOperacional.message}
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
            {/* Campo: Transporte */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-truck mr-2 text-primary"></i>
                  Transporte
                </label>
                <Controller
                  name="transporte"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      className={classNames("w-full", {
                        "p-invalid": errors.transporte,
                      })}
                    />
                  )}
                />
                {errors.transporte && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.transporte.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Convenio */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-handshake mr-2 text-primary"></i>
                  Convenio
                </label>
                <Controller
                  name="convenio"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      className={classNames("w-full", {
                        "p-invalid": errors.convenio,
                      })}
                    />
                  )}
                />
                {errors.convenio && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.convenio.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Estado
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-info-circle mr-2 text-primary"></i>
                  Estado
                </label>
                <Dropdown
                  id="estado"
                  value={watch("estado")}
                  onChange={(e) => setValue("estado", e.value)}
                  options={[
                    { label: "Activo", value: "true" },
                    { label: "Inactivo", value: "false" },
                  ]}
                  placeholder="Seleccionar estado"
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

            {/* Campo: Rendimientos */}
            <div className="col-12">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-chart-bar mr-2 text-primary"></i>
                  Rendimientos
                </label>

                {/* Selector de Productos para Rendimientos */}
                <MultiSelect
                  value={selectedRendimientos.map((r) => r.idProducto)}
                  options={productos}
                  optionLabel="nombre"
                  onChange={(e) => {
                    const selectedIds = e.value;
                    const nuevosRendimientos = selectedIds.map((id: any) => {
                      // Buscar si ya existe en los seleccionados
                      const existente = selectedRendimientos.find(
                        (r) => r.idProducto.id === id
                      );
                      return (
                        existente || {
                          idProducto: id,
                          porcentaje: 0,
                          transporte: 0,
                          bunker: 0,
                          costoVenta: 0,
                          convenio: 0,
                        }
                      );
                    });
                    setSelectedRendimientos(nuevosRendimientos);
                  }}
                  display="chip"
                  placeholder="Seleccionar productos"
                  maxSelectedLabels={3}
                  className="w-full mb-3"
                  disabled={loading}
                  selectAllLabel="Seleccionar todos"
                />

                {/* Inputs de Rendimientos */}
                {selectedRendimientos.map((rendimiento, index) => (
                  <div
                    key={index}
                    className="p-3 mb-2 border-round shadow-1 flex align-items-center gap-4"
                    style={{
                      backgroundColor: `#${
                        productos.find(
                          (p) => p.id === rendimiento.idProducto?.id
                        )?.color || "cccccc"
                      }20`,
                    }}
                  >
                    {/* Nombre del Producto */}
                    <span className="font-bold text-primary w-6rem">
                      {productos.find(
                        (p) => p.id === rendimiento.idProducto?.id
                      )?.nombre || "Producto"}
                    </span>

                    {/* Porcentaje */}
                    <div className="flex flex-column align-items-start">
                      <label
                        htmlFor={`porcentaje-${index}`}
                        className="block font-medium text-900"
                      >
                        Porcentaje
                      </label>
                      <InputNumber
                        id={`porcentaje-${index}`}
                        value={rendimiento.porcentaje}
                        onValueChange={(e) => {
                          const nuevosRendimientos = [...selectedRendimientos];
                          nuevosRendimientos[index].porcentaje = e.value || 0;
                          setSelectedRendimientos(nuevosRendimientos);
                        }}
                        mode="decimal"
                        min={0}
                        max={100}
                        suffix="%"
                        className="w-6rem"
                      />
                    </div>

                    {/* Transporte */}
                    <div className="flex flex-column align-items-start">
                      <label
                        htmlFor={`transporte-${index}`}
                        className="block font-medium text-900"
                      >
                        Transporte
                      </label>
                      <InputNumber
                        id={`transporte-${index}`}
                        value={rendimiento.transporte}
                        onValueChange={(e) => {
                          const nuevosRendimientos = [...selectedRendimientos];
                          nuevosRendimientos[index].transporte = e.value || 0;
                          setSelectedRendimientos(nuevosRendimientos);
                        }}
                        mode="decimal"
                        min={0}
                        className="w-6rem"
                        placeholder="Transporte"
                      />
                    </div>

                    {/* Bunker */}
                    <div className="flex flex-column align-items-start">
                      <label
                        htmlFor={`bunker-${index}`}
                        className="block font-medium text-900"
                      >
                        Bunker
                      </label>
                      <InputNumber
                        id={`bunker-${index}`}
                        value={rendimiento.bunker}
                        onValueChange={(e) => {
                          const nuevosRendimientos = [...selectedRendimientos];
                          nuevosRendimientos[index].bunker = e.value || 0;
                          setSelectedRendimientos(nuevosRendimientos);
                        }}
                        mode="decimal"
                        min={0}
                        className="w-6rem"
                        placeholder="Bunker"
                      />
                    </div>
                    {/* Convenio */}
                    <div className="flex flex-column align-items-start">
                      <label
                        htmlFor={`convenio-${index}`}
                        className="block font-medium text-900"
                      >
                        Convenio
                      </label>
                      <InputNumber
                        id={`convenio-${index}`}
                        value={rendimiento.convenio}
                        onValueChange={(e) => {
                          const nuevosRendimientos = [...selectedRendimientos];
                          nuevosRendimientos[index].convenio = e.value || 0;
                          setSelectedRendimientos(nuevosRendimientos);
                        }}
                        mode="decimal"
                        className="w-6rem"
                        placeholder="Convenio"
                      />
                    </div>
                    {/* Costo de Venta */}
                    <div className="flex flex-column align-items-start">
                      <label
                        htmlFor={`costoVenta-${index}`}
                        className="block font-medium text-900"
                      >
                        Costo de Venta
                      </label>
                      <InputNumber
                        id={`costoVenta-${index}`}
                        value={rendimiento.costoVenta}
                        onValueChange={(e) => {
                          const nuevosRendimientos = [...selectedRendimientos];
                          nuevosRendimientos[index].costoVenta = e.value || 0;
                          setSelectedRendimientos(nuevosRendimientos);
                        }}
                        mode="decimal"
                        min={0}
                        className="w-6rem"
                        placeholder="Costo Venta"
                      />
                    </div>

                    {/* Botón para eliminar rendimiento */}
                    <Button
                      type="button"
                      icon="pi pi-times"
                      className="p-button-danger p-button-text"
                      onClick={() => {
                        const nuevosRendimientos = selectedRendimientos.filter(
                          (_, i) => i !== index
                        );
                        setSelectedRendimientos(nuevosRendimientos);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Campo: Punto de Inflamación
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
            Campo: Índice Cetano
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
            {/* Campo: Estado
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
            </div> */}
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default TipoProductoForm;
