import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { facturaSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { createFactura, updateFactura } from "@/app/api/facturaService";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column, ColumnEditorOptions } from "primereact/column";
import { Calendar } from "primereact/calendar";

import { ProgressSpinner } from "primereact/progressspinner";
import CustomCalendar from "@/components/common/CustomCalendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { useRefineryPrecios } from "@/hooks/useRefineryPrecios";
import { useByRefineryData } from "@/hooks/useByRefineryData";
import { handleFormError } from "@/utils/errorHandlers";
import { Factura, LineaFactura } from "@/libs/interfaces";

type FormData = z.infer<typeof facturaSchema>;

interface FacturaFormProps {
  factura: Factura | any;
  hideFacturaFormDialog: () => void;
  facturas: Factura[];
  setFacturas: (facturas: Factura[]) => void;
  setFactura: (factura: Factura) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  tipoFactura?: string;
  facturaFormDialog: boolean;
}

const estadoEntregaOptions = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "En Tránsito", value: "En Tránsito" },
  { label: "Entregado", value: "Entregado" },
  { label: "Cancelado", value: "Cancelado" },
];
const estadoOptions = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "Aprobada", value: "Aprobada" },
  { label: "Rechazada", value: "Rechazada" },
];

function FacturaForm({
  factura,
  hideFacturaFormDialog,
  facturas,
  setFacturas,
  showToast,
  tipoFactura,
  facturaFormDialog,
}: FacturaFormProps) {
  const { activeRefineria } = useRefineriaStore();

  const { partidas = [], loading } = useByRefineryData(
    activeRefineria?.id as string
  );
  const { brent: brentOnline, oilDerivate } = useRefineryPrecios();

  const toast = useRef<Toast | null>(null);
  const calendarRef = useRef<Calendar>(null);
  const [items, setItems] = useState<LineaFactura[]>(
    factura?.idLineasFactura || []
  );

  const [submitting, setSubmitting] = useState(false);
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (factura) {
      Object.keys(factura).forEach((key) =>
        setValue(key as keyof FormData, factura[key])
      );
    }
  }, [factura, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const lineasTransformadas = (items || []).map((linea: any) => ({
        ...linea,
        idPartida: linea.idPartida?.id || linea.idPartida || null,
      }));

      const payload = {
        ...data,
        idLineasFactura: lineasTransformadas,
        lineas: lineasTransformadas,
        idRefineria: activeRefineria?.id,
      };
      // data.idLineasFactura = items;
      if (factura) {
        const updatedFactura = await updateFactura(factura.id, payload);
        const updatedFacturas = facturas.map((t) =>
          t.id === updatedFactura.id ? updatedFactura : t
        );
        setFacturas(updatedFacturas);
        showToast("success", "Éxito", "Factura actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newFactura = await createFactura(payload);
        setFacturas([...facturas, newFactura]);
        showToast("success", "Éxito", "Factura creado");
      }
      hideFacturaFormDialog();
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      setSubmitting(false); // Desactivar el estado de envío
    }
  };
  // Calcular el total
  const lineasFactura = watch("idLineasFactura") || [];
  const totalCalculado = lineasFactura.reduce((acc: number, linea: any) => {
    const subTotal = Number(linea?.subTotal) || 0;
    return acc + subTotal;
  }, 0);

  useEffect(() => {
    setValue("total", totalCalculado);
  }, [totalCalculado, setValue]);
  const addItem = () => {
    setItems([
      ...items,
      {
        descripcion: "", // El nombre del crudo es obligatorio
        // clasificacion: undefined, // La clasificación es opcional
        subTotal: 0, // Gravedad API del producto (opcional, debe ser no negativa)
        // idPartida: 0, // Porcentaje de azufre (opcional, debe ser no negativo)
      },
    ]);
    setValue("idLineasFactura", [
      ...items,
      {
        descripcion: "", // El nombre del crudo es obligatorio
        // clasificacion: undefined, // La clasificación es opcional
        subTotal: 0, // Gravedad API del producto (opcional, debe ser no negativa)
        // idPartida: 0, // Porcentaje de azufre (opcional, debe ser no negativo)
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
    setValue("idLineasFactura", newItems);
    console.log("Updated items:", newItems); // Debugging line to check updated items
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    setItems(newItems);
    setValue("idLineasFactura", newItems);
  };

  const actionBodyTemplate = (rowData: any, options: any) => {
    return (
      <div className="flex justify-content-center">
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => deleteItem(options.rowIndex)}
        />
      </div>
    );
  };

  const partidaEditor = (options: ColumnEditorOptions) => {
    const onChange = (e: DropdownChangeEvent) => {
      options.editorCallback!(e.value);
    };

    return (
      <Dropdown
        id="idPartida.id"
        // value={watch("idProducto")}
        // onChange={(e) => {
        //   setValue("idProducto", e.value);
        // }}
        value={options.value}
        onChange={onChange}
        options={partidas.map((p) => ({
          label: p.descripcion,
          value: {
            id: p.id,
            _id: p.id,
            descripcion: p.descripcion,
            codigo: p.codigo,
          },
        }))}
        // options={productos.map((producto) => ({
        //   label: producto.nombre,
        //   value: {
        //     id: producto.id,
        //     _id: producto.id,
        //     nombre: producto.nombre,
        //   },
        // }))}
        placeholder="Seleccionar una partida"
      />
    );
  };

  return (
    <Dialog
      visible={facturaFormDialog}
      style={{ width: "80vw", backgroundColor: "red" }}
      header={
        <div className="mb-2 text-center md:text-left surface-50">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
              {factura ? "Editar" : "Agregar"} Factura
            </h2>
          </div>
        </div>
      }
      headerStyle={{
        backgroundColor: "transparent",
      }}
      contentStyle={{
        backgroundColor: "transparent",
      }}
      modal
      onHide={hideFacturaFormDialog}
      className="card   surface-50 p-1  border-round shadow-2xl"
      footer={
        <div className="flex justify-content-between align-items-center p-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text p-button-plain"
            onClick={hideFacturaFormDialog}
          />
          {!loading && (
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : "pi pi-check"}
              label={factura ? "Modificar Factura" : "Crear Factura"}
              className={`p-button-raised ${
                submitting ? "p-button-secondary" : "p-button-primary"
              }`}
              onClick={handleSubmit(onSubmit)}
            />
          )}
        </div>
      }
    >
      <div>
        <Toast ref={toast} />
        {loading ? (
          <div className="flex justify-content-center align-items-center">
            <ProgressSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid">
              {/* Campo: Número de Factura */}
              <div className="col-12 sm:col-4 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-align-left mr-2 text-primary"></i>
                    Concepto
                  </label>
                  <Controller
                    name="concepto"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputText
                          id="concepto"
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

              {/* Campo: Total */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-3">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-align-left mr-2 text-primary"></i>
                    Total
                  </label>
                  <Controller
                    name="total"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputNumber
                          id="total"
                          className={classNames("w-full", {
                            "p-invalid": fieldState.error,
                          })}
                          mode="currency"
                          currency="USD"
                          locale="en-US"
                          value={totalCalculado}
                          onValueChange={(e) => {
                            field.onChange(e.value);
                          }}
                          disabled
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

              {/* Campo: Fecha de Inicio */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-3 bg-white border-round shadow-1">
                  <label className="block font-medium text-900 mb-2 flex align-items-center">
                    <i className="pi pi-calendar-plus text-primary mr-2"></i>
                    Fecha Factura
                  </label>
                  <Controller
                    name="fechaFactura"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <CustomCalendar
                          {...field}
                          name="fechaFactura"
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

              {/* Campo: Estado de Factura */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-flag mr-2 text-primary"></i>
                    Estado de Factura
                  </label>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Dropdown
                          id="estado"
                          {...field}
                          options={estadoOptions}
                          placeholder="Seleccionar estado de factura"
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

              {/* Tabla de Items del Factura */}
              <div
                className={`orders-subtable col-12${
                  errors.idLineasFactura ? " p-invalid" : ""
                }`}
              >
                <DataTable
                  value={items}
                  scrollable
                  className={`datatable-responsive${
                    errors.idLineasFactura ? " p-invalid" : " "
                  }`}
                  style={
                    errors.idLineasFactura
                      ? { border: "1px solid #f44336" } // rojo y más grueso si hay error
                      : {}
                  }
                  size="small"
                  editMode="cell"
                >
                  <Column
                    field="idPartida.descripcion"
                    header="Partida"
                    editor={(options) => partidaEditor(options)}
                    onCellEditComplete={(e) => {
                      const {
                        rowData,
                        newValue,
                        rowIndex,
                        originalEvent: event,
                      } = e;
                      if (!newValue || !newValue.id) {
                        event.preventDefault();
                        return;
                      }
                      rowData.idPartida = newValue;
                      const updated = [...items];
                      updated[rowIndex].idPartida = newValue;
                      setItems(updated);
                    }}
                    body={(rowData: any) =>
                      rowData.idPartida?.descripcion || "Sin producto"
                    }
                  />

                  <Column
                    field="descripcion"
                    header="Descripción"
                    style={{ minWidth: "180px" }}
                    editor={(options) => (
                      <InputText
                        value={options.value}
                        onChange={(e) =>
                          options.editorCallback!(e.target.value)
                        }
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Descripción del item"
                      />
                    )}
                    onCellEditComplete={(e) => {
                      const { newValue, rowIndex } = e;
                      updateItem(rowIndex, "descripcion", newValue);
                    }}
                    body={(rowData: any) => (
                      <div
                        style={{
                          border:
                            rowData.descripcion === ""
                              ? "2px solid #f44336"
                              : undefined,
                          borderRadius: "4px",
                          padding: "2px 6px",
                          display: "inline-block",
                        }}
                      >
                        {rowData.descripcion || "Sin Descripción"}
                      </div>
                    )}
                  />

                  <Column
                    field="subTotal"
                    header="Subtotal"
                    body={(rowData: any) => `$${rowData.subTotal}`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) => {
                          updateItem(options.rowIndex, "subTotal", e.value);
                          options.editorCallback!(e.value);
                        }}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                      />
                    )}
                    onCellEditComplete={(e) => {
                      const {
                        rowData,
                        newValue,
                        rowIndex,
                        originalEvent: event,
                      } = e;
                      if (newValue === undefined) {
                        event.preventDefault();
                        return;
                      }

                      updateItem(rowIndex, "subTotal", newValue);
                    }}
                  />

                  <Column body={actionBodyTemplate} header="Acciones" />
                </DataTable>
                {errors.idLineasFactura && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.idLineasFactura.message}
                  </small>
                )}
                <Button
                  type="button"
                  label="Agregar Item"
                  icon="pi pi-plus"
                  className="mt-2"
                  onClick={addItem}
                />
                {/* Campo: Monto Total
                <div className="col-12 sm:col-6 lg:col-3">
                  <div className="p-2 bg-white border-round shadow-1 surface-card">
                    <label className="block font-medium text-900 mb-3 flex align-items-center">
                      <i className="pi pi-wallet mr-2 text-primary"></i>
                      Monto Total
                    </label>
                    <Controller
                      name="montoTotal"
                      control={control}
                      render={({ field, fieldState }) => (
                        <>
                          <InputNumber
                            id="montoTotal"
                            {...field}
                            className={classNames("w-full", {
                              "p-invalid": fieldState.error,
                            })}
                            mode="currency"
                            currency="USD"
                            locale="en-US"
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
                </div> */}
              </div>

              {/* Campo: Estado
          <div className="field mb-4 col-12 md:col-6">
            <label htmlFor="estado" className="font-medium text-900">
              Estado
            </label>
            <Dropdown
              id="estado"
              value={watch("estado")}
              onChange={(e) => setValue("estado", e.value)}
              options={estatusValues}
              placeholder="Seleccionar"
              className={classNames("w-full", { "p-invalid": errors.estado })}
            />
            {errors.estado && (
              <small className="p-error">{errors.estado.message}</small>
            )}
          </div> */}

              {/* Botón de Envío
              <div className="col-12">
                <Button
                  type="submit"
                  disabled={submitting} // Deshabilitar el botón mientras se envía
                  icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
                  label={factura ? "Modificar factura" : "Crear factura"}
                  className="w-auto mt-3"
                />
              </div> */}
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}

export default FacturaForm;
