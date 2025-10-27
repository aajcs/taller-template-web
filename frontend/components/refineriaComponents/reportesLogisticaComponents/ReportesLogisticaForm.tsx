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
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { useBunkeringData } from "@/hooks/useBunkeringData";

import { ProgressSpinner } from "primereact/progressspinner";
import { Calendar } from "primereact/calendar";
import { handleFormError } from "@/utils/errorHandlers";
import CustomCalendar from "@/components/common/CustomCalendar";
import {
  getRecepcions,
  createRecepcion,
  updateRecepcion,
} from "@/app/api/recepcionService";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReporteRecepcionTemplate from "@/components/pdf/templates/reportesLogisticaTemplate";
import { useByRefineryData } from "@/hooks/useByRefineryData";

const recepcionSchema = z.object({
  idContrato: z.object({
    id: z.string(),
    numeroContrato: z.string(),
    idItems: z.any(),
    _id: z.any(),
  }),
  fecha: z.date({ required_error: "La fecha es obligatoria" }),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  tipoProducto: z.string().min(1, "El tipo de producto es obligatorio"),
  observacion: z.string().optional(),
});

type FormData = z.infer<typeof recepcionSchema>;

interface ReportesLogisticaFormProps {
  recepcion?: any;
  hideRecepcionFormDialog: () => void;
  recepciones?: any[];
  setRecepciones?: (recepciones: any[]) => void;
  setRecepcion?: (recepcion: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const ReportesLogisticaForm = ({
  recepcion,
  toast,
  hideRecepcionFormDialog,
  recepciones,
  setRecepciones,
  showToast,
}: ReportesLogisticaFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { contratos = [], loading } = useByRefineryData(activeRefineria?.id || "");
  const calendarRef = useRef<Calendar>(null);

  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reporteData, setReporteData] = useState<any>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(recepcionSchema),
    defaultValues: {
      cantidad: 0,
    },
  });

  useEffect(() => {
    if (recepcion) {
      Object.keys(recepcion).forEach((key) =>
        setValue(key as keyof FormData, recepcion[key])
      );
    }
  }, [recepcion, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (recepcion) {
        const updatedRecepcion = await updateRecepcion(recepcion.id, {
          ...data,
          idRefineria: activeRefineria?.id,
        });
        const updatedRecepciones = recepciones?.map((t) =>
          t.id === updatedRecepcion.id ? updatedRecepcion : t
        );
        if (updatedRecepciones && setRecepciones)
          setRecepciones(updatedRecepciones);
        showToast("success", "Éxito", "Recepción actualizada");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newRecepcion = await createRecepcion({
          ...data,
          idRefineria: activeRefineria.id,
          idContrato: data.idContrato.id,
        });
        if (setRecepciones) {
          setRecepciones([...(recepciones || []), newRecepcion]);
        }
        showToast("success", "Éxito", "Recepción creada");
      }
      hideRecepcionFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  // Generar reporte de recepciones
  const handleGenerarReporte = async () => {
    try {
      const data = await getRecepcions();
      let recepcionesFiltradas = data.recepciones || [];
      recepcionesFiltradas = recepcionesFiltradas.filter(
        (r: any) =>
          r.idRefineria?.id === activeRefineria?.id &&
          (!fechaInicio || new Date(r.fecha) >= fechaInicio) &&
          (!fechaFin || new Date(r.fecha) <= fechaFin)
      );
      setReporteData({
        total: recepcionesFiltradas.length,
        recepciones: recepcionesFiltradas,
      });
      setShowPreview(true);
    } catch (e) {
      setReporteData(null);
      setShowPreview(true);
    }
  };

  const renderRecepcionesTable = (data: any) => (
    <div
      className="overflow-x-auto mt-4"
      style={{ maxWidth: "1200px", margin: "0 auto" }}
    >
      <table className="min-w-[900px] w-full text-sm border border-200">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
            <th className="p-2 border-b">Fecha</th>
            <th className="p-2 border-b">Contrato</th>
            <th className="p-2 border-b">Proveedor/Cliente</th>
            <th className="p-2 border-b">Tipo Producto</th>
            <th className="p-2 border-b">Cantidad</th>
            <th className="p-2 border-b">Observación</th>
          </tr>
        </thead>
        <tbody>
          {data.recepciones.map((r: any, idx: number) => (
            <tr key={idx} className="hover:bg-blue-50">
              <td className="p-2 border-b">
                {r.fecha ? new Date(r.fecha).toLocaleDateString() : ""}
              </td>
              <td className="p-2 border-b">
                {r.idContrato?.numeroContrato || ""}
              </td>
              <td className="p-2 border-b">
                {r.idContrato?.idContacto?.nombre || ""}
              </td>
              <td className="p-2 border-b">{r.tipoProducto || ""}</td>
              <td className="p-2 border-b">{r.cantidad}</td>
              <td className="p-2 border-b">{r.observacion || ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-blue-100">
            <td className="p-2 border-t" colSpan={4}>
              Total
            </td>
            <td className="p-2 border-t">
              {data.recepciones.reduce(
                (acc: number, r: any) => acc + Number(r.cantidad ?? 0),
                0
              )}
            </td>
            <td className="p-2 border-t"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

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
      {/* Formulario de Recepción */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {recepcion ? "Modificar Recepción" : "Crear Recepción"}
              </h2>
            </div>
          </div>
          <div className="grid formgrid row-gap-2">
            {/* Contrato */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-3 bg-white border-round shadow-1">
                <label className="block font-medium text-900 mb-2 flex align-items-center">
                  <i className="pi pi-file text-primary mr-2"></i>
                  Número de Contrato
                </label>
                <Controller
                  name="idContrato"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Dropdown
                        id="idContrato"
                        {...field}
                        options={contratos.map((contrato) => ({
                          label: `${contrato.numeroContrato} - ${
                            contrato.descripcion || "Sin descripción"
                          }`,
                          value: {
                            id: contrato.id,
                            numeroContrato: contrato.numeroContrato,
                            idItems: contrato.idItems,
                            _id: contrato._id,
                          },
                        }))}
                        placeholder="Seleccionar un contrato"
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                        })}
                        showClear
                        filter
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
            {/* Fecha */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2 text-primary"></i>
                  Fecha de Recepción
                </label>
                <Controller
                  name="fecha"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <CustomCalendar
                        {...field}
                        name="fecha"
                        control={control}
                        setValue={setValue}
                        calendarRef={calendarRef}
                        isFieldEnabled={false}
                        value={
                          field.value
                            ? new Date(field.value as string | Date)
                            : null
                        }
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
            {/* Tipo Producto */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-box mr-2 text-primary"></i>
                  Tipo de Producto
                </label>
                <Controller
                  name="tipoProducto"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText
                        id="tipoProducto"
                        {...field}
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                        })}
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
            {/* Cantidad */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-sort-numeric-up mr-2 text-primary"></i>
                  Cantidad
                </label>
                <Controller
                  name="cantidad"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={1}
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
            {/* Observación */}
            <div className="col-12">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-align-left mr-2 text-primary"></i>
                  Observación
                </label>
                <Controller
                  name="observacion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      {...field}
                      rows={2}
                      className="w-full"
                      autoResize
                    />
                  )}
                />
              </div>
            </div>
          </div>
          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={recepcion ? "Modificar Recepción" : "Crear Recepción"}
              className="w-auto"
            />
            <Button
              type="button"
              label="Salir"
              onClick={() => hideRecepcionFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>

      {/* Reporte de Recepciones */}
      <div
        className="card p-3 mt-5 border-round shadow-2"
        style={{ maxWidth: 1300, margin: "0 auto" }}
      >
        <h3 className="mb-4 text-lg font-semibold text-center text-primary">
          Reporte de Recepciones
        </h3>
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
            <label className="font-medium text-900">Fecha Inicio</label>
            <Calendar
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.value as Date)}
              dateFormat="yy-mm-dd"
              showIcon
              className="w-full"
            />
          </div>
          <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
            <label className="font-medium text-900">Fecha Fin</label>
            <Calendar
              value={fechaFin}
              onChange={(e) => setFechaFin(e.value as Date)}
              dateFormat="yy-mm-dd"
              showIcon
              className="w-full"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 justify-center mb-4">
          <div className="flex gap-3 justify-center">
            <Button
              label="Visualizar Reporte"
              icon="pi pi-eye"
              className="p-button-raised p-button-primary"
              style={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
              onClick={handleGenerarReporte}
              disabled={!fechaInicio || !fechaFin}
            />
            <Button
              label="Volver"
              icon="pi pi-times"
              className="p-button-raised"
              style={{
                minWidth: 120,
                background: "#ef4444",
                border: "none",
                color: "#fff",
              }}
              onClick={() => setShowPreview(false)}
            />
          </div>
        </div>
        {showPreview && (
          <>
            {reporteData && reporteData.recepciones.length > 0 ? (
              <>
                {renderRecepcionesTable(reporteData)}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-3">
                    <PDFDownloadLink
                      document={
                        <ReporteRecepcionTemplate
                          data={reporteData}
                          logoUrl={
                            activeRefineria?.img ||
                            "/layout/images/avatarHombre.png"
                          }
                        />
                      }
                      fileName={`ReporteRecepciones_${fechaInicio?.toLocaleDateString()}_${fechaFin?.toLocaleDateString()}.pdf`}
                      className="p-button p-component p-button-success"
                    >
                      {({ loading }) =>
                        loading ? (
                          <span>Generando PDF...</span>
                        ) : (
                          <span>Descargar Reporte PDF</span>
                        )
                      }
                    </PDFDownloadLink>
                    <Button
                      label="Volver"
                      icon="pi pi-times"
                      className="p-button-raised"
                      style={{
                        minWidth: 120,
                        background: "#ef4444",
                        border: "none",
                        color: "#fff",
                      }}
                      onClick={() => setShowPreview(false)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 justify-center mt-4">
                <span className="text-lg text-900 font-semibold mb-2">
                  No hay información para mostrar en este reporte.
                </span>
                <Button
                  label="Volver"
                  icon="pi pi-times"
                  className="p-button-raised"
                  style={{
                    minWidth: 120,
                    background: "#ef4444",
                    border: "none",
                    color: "#fff",
                  }}
                  onClick={() => setShowPreview(false)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportesLogisticaForm;
