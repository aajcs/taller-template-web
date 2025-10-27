import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { contratoSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { createContrato, updateContrato } from "@/app/api/contratoService";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column, ColumnEditorOptions } from "primereact/column";
import { Calendar } from "primereact/calendar";

import { ProgressSpinner } from "primereact/progressspinner";
import CustomCalendar from "@/components/common/CustomCalendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { useRefineryData } from "@/hooks/useRefineryData";

type FormData = z.infer<typeof contratoSchema>;

interface ContratoFormProps {
  contrato: any;
  hideContratoFormDialog: () => void;
  contratos: any[];
  setContratos: (contratos: any[]) => void;
  setContrato: (contrato: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  tipoContrato?: string;
  contratoFormDialog: boolean;
}

const estatusValues = ["true", "false"];
const tipoContatroValues = ["Compra", "Venta"];
const estadoEntregaOptions = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "En Tránsito", value: "En Tránsito" },
  { label: "Entregado", value: "Entregado" },
  { label: "Cancelado", value: "Cancelado" },
];
const estado_contratoOptions = [
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
];

function ContratoForm({
  contrato,
  hideContratoFormDialog,
  contratos,
  setContratos,
  showToast,
  tipoContrato,
  contratoFormDialog,
}: ContratoFormProps) {
  const { activeRefineria } = useRefineriaStore();
  const { productos, tipoProductos, contactos, loading } = useRefineryData(
    activeRefineria?.id || ""
  );
  const toast = useRef<Toast | null>(null);
  const calendarRef = useRef<Calendar>(null);
  const [items, setItems] = useState(contrato?.idItems || []);

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      brent: 0,
      condicionesPago: {
        plazo: 0,
      },
    },
  });

  useEffect(() => {
    if (contrato) {
      Object.keys(contrato).forEach((key) =>
        setValue(key as keyof FormData, contrato[key])
      );
    }
  }, [contrato, setValue]);
  useEffect(() => {
    setValue("tipoContrato", tipoContrato || "Compra");
  }, [tipoContrato, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      data.items = items;
      if (contrato) {
        const updatedContrato = await updateContrato(contrato.id, {
          ...data,
          idRefineria: activeRefineria?.id,
          idContacto: data.idContacto.id,
        });
        const updatedContratos = contratos.map((t) =>
          t.id === updatedContrato.id ? updatedContrato : t
        );
        setContratos(updatedContratos);
        showToast("success", "Éxito", "Contrato actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newContrato = await createContrato({
          ...data,
          idRefineria: activeRefineria.id,
          idContacto: data.idContacto.id,
        });
        setContratos([...contratos, newContrato]);
        showToast("success", "Éxito", "Contrato creado");
      }
      hideContratoFormDialog();
    } catch (error) {
      console.error("Error al crear/modificar contrato:", error);
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setSubmitting(false); // Desactivar el estado de envío
    }
  };
  const addItem = () => {
    setItems([
      ...items,
      {
        nombre: "", // El nombre del crudo es obligatorio
        // clasificacion: undefined, // La clasificación es opcional
        gravedadAPI: 0, // Gravedad API del producto (opcional, debe ser no negativa)
        azufre: 0, // Porcentaje de azufre (opcional, debe ser no negativo)
        contenidoAgua: 0, // Contenido de agua en porcentaje (opcional, debe ser no negativo)
        puntoDeInflamacion: 0, // Flashpoint del producto (opcional)
        cantidad: 0, // Cantidad de producto (opcional, debe ser no negativa)

        convenio: 0, // Precio de convenio (opcional, debe ser no negativo)
        precioUnitario: 0, // Precio unitario (opcional, debe ser no negativo)
        montoTransporte: 0, // Monto de transporte (opcional, debe ser no negativo)
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    setItems(newItems);
    setValue("idItems", newItems);
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
  const calculatePrecioUnitario = (
    brent: number,
    convenio: number,
    transporte: number
  ) => {
    return (brent || 0) + (convenio || 0) + (transporte || 0);
  };
  const productoEditor = (options: ColumnEditorOptions) => {
    const onChange = (e: DropdownChangeEvent) => {
      options.editorCallback!(e.value);
    };

    return (
      <>
        <Dropdown
          id="idProducto.id"
          // value={watch("idProducto")}
          // onChange={(e) => {
          //   setValue("idProducto", e.value);
          // }}
          value={options.value}
          onChange={onChange}
          options={productos.map((producto) => ({
            label: producto.nombre,
            value: {
              id: producto.id,
              _id: producto.id,
              nombre: producto.nombre,
            },
          }))}
          placeholder="Seleccionar un producto"
          // className={classNames("w-full", {
          //   "p-invalid": errors.idProducto?.nombre,
          // })}
        />

        {/* <Dropdown
          value={options.value}
          options={productos}
          onChange={(e: DropdownChangeEvent) =>
            options.editorCallback!(e.value)
          }
          placeholder="Selecionar un producto"
          itemTemplate={(option) => {
            return (
              <Tag
                value={option}
                className={`customer-badge status-${option
                  .toLowerCase()
                  .replace(/[()]/g, "")
                  .replace(/\s+/g, "-")}`}
              ></Tag>
            );
          }}
        /> */}
      </>
    );
  };
  const idTipoProductoEditor = (options: ColumnEditorOptions) => {
    const onChange = (e: DropdownChangeEvent) => {
      options.editorCallback!(e.value);
      updateRowDataTipoProducto(options, e.value);
    };

    return (
      <Dropdown
        id="idTipoProducto.id"
        value={options.value}
        onChange={onChange}
        options={tipoProductos.map((tipoProducto) => ({
          label: tipoProducto.nombre,
          value: {
            id: tipoProducto.id,
            _id: tipoProducto.id,
            nombre: tipoProducto.nombre,
          },
        }))}
        placeholder="Seleccionar un tipo producto"
      />
    );
  };

  const updateRowDataTipoProducto = (
    options: { rowData: any; rowIndex: number },
    tipoProductoValue: any
  ) => {
    const caracteristicasTipoProducto = tipoProductos.find(
      (tipoProducto) => tipoProducto.id === tipoProductoValue?.id
    );

    // // Actualizar directamente el rowData
    options.rowData.idTipoProducto = tipoProductoValue;
    options.rowData.clasificacion =
      caracteristicasTipoProducto?.clasificacion || "";
    options.rowData.gravedadAPI = caracteristicasTipoProducto?.gravedadAPI || 0;
    options.rowData.azufre = caracteristicasTipoProducto?.azufre || 0;
    options.rowData.contenidoAgua =
      caracteristicasTipoProducto?.contenidoAgua || 0;
    options.rowData.puntoDeInflamacion =
      caracteristicasTipoProducto?.puntoDeInflamacion || 0;

    setItems(() =>
      items.map((item: any, index: number) => {
        if (index === options.rowIndex) {
          return {
            ...item,
            idTipoProducto: tipoProductoValue,
            clasificacion: caracteristicasTipoProducto?.clasificacion || "",
            gravedadAPI: caracteristicasTipoProducto?.gravedadAPI || 0,
            azufre: caracteristicasTipoProducto?.azufre || 0,
            contenidoAgua: caracteristicasTipoProducto?.contenidoAgua || 0,
            puntoDeInflamacion:
              caracteristicasTipoProducto?.puntoDeInflamacion || 0,
          };
        }
        return item;
      })
    );

    // Actualizar el estado de items para que la tabla se re-renderice
    // setItems((prevItems: any) => {
    //   const newItems = [...prevItems];
    //   newItems[options.rowIndex] = { ...options.rowData }; // Crear una nueva referencia para activar la re-renderización
    //   return newItems;
    // });
  };
  // if (loading) {
  //   return (
  //     <div className="flex justify-content-center align-items-center h-screen">
  //       <ProgressSpinner />
  //     </div>
  //   );
  // }
  // Observa el valor de brent
  const brent = watch("brent") || 0;
  // Efecto para actualizar el precio unitario cuando cambie el brent
  useEffect(() => {
    interface Item {
      convenio: number;
      montoTransporte: number;
      precioUnitario: number;
    }

    const updatedItems = items.map((item: Item) => ({
      ...item,
      precioUnitario: calculatePrecioUnitario(
        brent,
        item.convenio,
        item.montoTransporte
      ),
    }));
    setItems(updatedItems);
  }, [brent]);
  return (
    <Dialog
      visible={contratoFormDialog}
      style={{ width: "80vw", backgroundColor: "red" }}
      header={
        <div className="mb-2 text-center md:text-left surface-50">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
              {contrato ? "Editar" : "Agregar"} Contrato de {tipoContrato}
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
      onHide={hideContratoFormDialog}
      className="card   surface-50 p-1  border-round shadow-2xl"
      footer={
        <div className="flex justify-content-between align-items-center p-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text p-button-plain"
            onClick={hideContratoFormDialog}
          />
          {!loading && (
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : "pi pi-check"}
              label={contrato ? "Modificar Contrato" : "Crear Contrato"}
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
              {/* Campo: Número de Contrato */}
              <div className="col-12 sm:col-4 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-file mr-2 text-primary"></i>
                    Número de Contrato
                  </label>
                  <Controller
                    name="numeroContrato"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputText
                          id="numeroContrato"
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
              {/* Campo: Descripción de Contrato */}
              <div className="col-12 sm:col-6 lg:col-5 xl:col-4">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-align-left mr-2 text-primary"></i>
                    Descripción de Contrato
                  </label>
                  <Controller
                    name="descripcion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputTextarea
                          id="descripcion"
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
              {/* Campo: Nombre de Proveedor */}
              <div className="col-12 sm:col-6 lg:col-4 xl:col-3">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-user mr-2 text-primary"></i>
                    Nombre de Proveedor
                  </label>
                  <Controller
                    name="idContacto"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Dropdown
                          id="idContacto"
                          {...field}
                          options={contactos.map((contacto) => ({
                            label: contacto.nombre,
                            value: { id: contacto.id, nombre: contacto.nombre },
                          }))}
                          placeholder="Seleccionar un proveedor"
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

              {/* Campo: Tipo de contrato
          <div className="field mb-4 col-12 sm:col-6 lg:col-3">
            <label htmlFor="estado" className="font-medium text-900">
              Tipo de Contrato
            </label>
            <Dropdown
              id="tipoContrato"
              value={watch("tipoContrato")}
              onChange={(e) => setValue("tipoContrato", e.value)}
              options={tipoContatroValues}
              placeholder="Seleccionar"
              className={classNames("w-full", {
                "p-invalid": errors.tipoContrato,
              })}
            />
            {errors.tipoContrato && (
              <small className="p-error">{errors.tipoContrato.message}</small>
            )}
          </div> */}
              {/* Campo: Tipo de Condiciones de Pago */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-credit-card mr-2 text-primary"></i>
                    Condiciones de Pago
                  </label>
                  <Controller
                    name="condicionesPago.tipo"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Dropdown
                          id="condicionesPago.tipo"
                          {...field}
                          options={["Contado", "Crédito"]}
                          placeholder="Seleccionar un tipo de condiciones de pago"
                          className={classNames("w-full", {
                            "p-invalid": fieldState.error,
                          })}
                          showClear
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
              {/* Campo: Plazo de Condiciones de Pago */}
              {watch("condicionesPago.tipo") === "Crédito" && (
                <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                  <div className="p-2 bg-white border-round shadow-1 surface-card">
                    <label className="block font-medium text-900 mb-3 flex align-items-center">
                      <i className="pi pi-clock mr-2 text-primary"></i>
                      Plazo de Pago (Días)
                    </label>
                    <Controller
                      name="condicionesPago.plazo"
                      control={control}
                      render={({ field, fieldState }) => (
                        <>
                          <InputNumber
                            id="condicionesPago.plazo"
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
              )}

              {/* Campo: Estado de Contrato */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-flag mr-2 text-primary"></i>
                    Estado de Contrato
                  </label>
                  <Controller
                    name="estadoContrato"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Dropdown
                          id="estadoContrato"
                          {...field}
                          options={estado_contratoOptions}
                          placeholder="Seleccionar estado de contrato"
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
              {/* Campo: Estado de Entrega */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-truck mr-2 text-primary"></i>
                    Estado de Entrega
                  </label>
                  <Controller
                    name="estadoEntrega"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Dropdown
                          id="estadoEntrega"
                          {...field}
                          options={estadoEntregaOptions}
                          placeholder="Seleccionar estado de entrega"
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
              {/* Campo: Fecha de Inicio */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-3 bg-white border-round shadow-1">
                  <label className="block font-medium text-900 mb-2 flex align-items-center">
                    <i className="pi pi-calendar-plus text-primary mr-2"></i>
                    Fecha de Inicio
                  </label>
                  <Controller
                    name="fechaInicio"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <CustomCalendar
                          {...field}
                          name="fechaInicio"
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

              {/* Campo: Fecha de Fin */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-3 bg-white border-round shadow-1">
                  <label className="block font-medium text-900 mb-2 flex align-items-center">
                    <i className="pi pi-calendar-minus text-primary mr-2"></i>
                    Fecha de Fin
                  </label>
                  <Controller
                    name="fechaFin"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <CustomCalendar
                          {...field}
                          name="fechaFin"
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

              {/* Campo: Brent */}
              <div className="col-12 sm:col-6 lg:col-3 xl:col-2">
                <div className="p-2 bg-white border-round shadow-1 surface-card">
                  <label className="block font-medium text-900 mb-3 flex align-items-center">
                    <i className="pi pi-dollar mr-2 text-primary"></i>
                    Brent
                  </label>
                  <Controller
                    name="brent"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <InputNumber
                          id="brent"
                          className={classNames("w-full", {
                            "p-invalid": fieldState.error,
                          })}
                          mode="currency"
                          currency="USD"
                          locale="en-US"
                          value={field.value}
                          onValueChange={(e) => {
                            field.onChange(e.value);
                          }}
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

              {/* Tabla de Items del Contrato */}
              <div className="orders-subtable col-12">
                {/* <h5>Items for {contrato?.name}</h5> */}
                <DataTable
                  value={items}
                  responsiveLayout="scroll"
                  scrollable
                  className="datatable-responsive"
                  size="small"
                  editMode="cell"
                >
                  <Column
                    field="producto.nombre"
                    header="Producto"
                    editor={(options) => productoEditor(options)}
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
                      rowData.producto = newValue;
                      const updated = [...items];
                      updated[rowIndex].producto = newValue;
                      setItems(updated);
                    }}
                  />
                  <Column
                    field="idTipoProducto.nombre"
                    header="Tipo de Producto"
                    editor={(options) => idTipoProductoEditor(options)}
                    onCellEditComplete={(e) => {
                      const { newValue, rowData, rowIndex } = e;
                      updateRowDataTipoProducto(
                        { rowData, rowIndex },
                        newValue
                      );
                    }}
                  />

                  <Column
                    field="clasificacion"
                    header="Clasificación"
                    editor={(options) => (
                      <InputText
                        value={options.value}
                        onChange={(e) =>
                          updateItem(
                            options.rowIndex,
                            "clasificacion",
                            e.target.value
                          )
                        }
                      />
                    )}
                  />
                  <Column
                    field="gravedadAPI"
                    header="API (°API)"
                    body={(rowData: any) => `${rowData.gravedadAPI} °API`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) =>
                          updateItem(options.rowIndex, "gravedadAPI", e.value)
                        }
                      />
                    )}
                  />
                  <Column
                    field="azufre"
                    header="Azufre (%)"
                    body={(rowData: any) => `${rowData.azufre} %`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) =>
                          updateItem(options.rowIndex, "azufre", e.value)
                        }
                        suffix="%"
                      />
                    )}
                  />

                  <Column
                    field="contenidoAgua"
                    header="Contenido de Agua (%)"
                    body={(rowData: any) => `${rowData.contenidoAgua} %`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) =>
                          updateItem(options.rowIndex, "contenidoAgua", e.value)
                        }
                        suffix="%"
                      />
                    )}
                  />

                  <Column
                    field="puntoDeInflamacion"
                    header="Punto De Inflamación (°C)"
                    body={(rowData: any) => `${rowData.puntoDeInflamacion} °C`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) =>
                          updateItem(
                            options.rowIndex,
                            "puntoDeInflamacion",
                            e.value
                          )
                        }
                        suffix="°C"
                      />
                    )}
                  />
                  <Column
                    field="cantidad"
                    header="Cantidad (Bbl)"
                    body={(rowData: any) => `${rowData.cantidad} Bbl`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) =>
                          updateItem(options.rowIndex, "cantidad", e.value)
                        }
                        suffix=" Bbl"
                      />
                    )}
                  />

                  <Column
                    field="convenio"
                    header="Convenio ($)"
                    body={(rowData: any) => `$${rowData.convenio}`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) => {
                          updateItem(options.rowIndex, "convenio", e.value);
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
                      const brent = Number(watch("brent"));
                      console.log("brent", brent);
                      const newPrecio = calculatePrecioUnitario(
                        brent,
                        newValue,
                        rowData.montoTransporte
                      );
                      updateItem(rowIndex, "convenio", newValue);
                      updateItem(rowIndex, "precioUnitario", newPrecio);
                    }}
                  />
                  <Column
                    field="montoTransporte"
                    header="Transporte ($)"
                    body={(rowData: any) => `$${rowData.montoTransporte}`}
                    editor={(options) => (
                      <InputNumber
                        value={options.value}
                        onValueChange={(e) => {
                          updateItem(
                            options.rowIndex,
                            "montoTransporte",
                            e.value
                          );
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
                      const brent = Number(watch("brent"));
                      console.log("brent", brent);
                      const newPrecio = calculatePrecioUnitario(
                        brent,
                        rowData.convenio,
                        newValue
                      );
                      updateItem(rowIndex, "montoTransporte", newValue);
                      updateItem(rowIndex, "precioUnitario", newPrecio);
                    }}
                  />
                  <Column
                    field="precioUnitario"
                    header="Precio Unitario ($)"
                    body={(rowData: any) =>
                      `$${calculatePrecioUnitario(
                        brent,
                        rowData.convenio,
                        rowData.montoTransporte
                      )}`
                    }
                  />

                  <Column
                    header="Total ($)"
                    body={(rowData: any) =>
                      `$${(rowData.cantidad * rowData.precioUnitario).toFixed(
                        2
                      )}`
                    }
                    footer={() => {
                      const total = items.reduce(
                        (
                          acc: number,
                          item: { cantidad: number; precioUnitario: number }
                        ) => acc + item.cantidad * item.precioUnitario,
                        0
                      );

                      // Actualizar el monto total en el formulario
                      setValue("montoTotal", total);

                      return `$${total.toFixed(2)}`;
                    }}
                  />

                  <Column body={actionBodyTemplate} header="Acciones" />
                </DataTable>
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
                  label={contrato ? "Modificar contrato" : "Crear contrato"}
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

export default ContratoForm;
