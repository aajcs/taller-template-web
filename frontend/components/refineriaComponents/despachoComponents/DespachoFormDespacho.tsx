import { Controller } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { Steps } from "primereact/steps";
import { RadioButton } from "primereact/radiobutton";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import { useMemo } from "react";
import CustomCalendar from "@/components/common/CustomCalendar";

interface DespachoFormDespachoProps {
  control: any;
  errors: any;
  watch: any;
  showToast: (
    severity: "success" | "error" | "warn",
    summary: string,
    detail: string
  ) => void;
  isFieldEnabledDespacho: (
    fieldName: string,
    estadoDespacho: string
  ) => boolean;
  estadoDespacho: string;
  estadoDespachoOptions: { label: string; value: string }[];
  validarCamposRequeridosDespacho: (estadoDestino: string) => boolean;
  getValidTransitionsDespacho: (currentState: string) => string[];
  contratos: any[];
  truncateText: (text: string, maxLength: number) => string;
  register: any;
  setValue: any;
  calendarRef: any;
}

export const DespachoFormDespacho = ({
  control,
  errors,
  watch,
  showToast,
  isFieldEnabledDespacho,
  estadoDespacho,
  estadoDespachoOptions,
  validarCamposRequeridosDespacho,
  getValidTransitionsDespacho,
  contratos,
  truncateText,
  register,
  setValue,
  calendarRef,
}: DespachoFormDespachoProps) => {
  const idContratoValue = watch("idContrato")?.id;
  const productosFiltrados = useMemo(() => {
    const contrato = contratos.find((c) => c.id === idContratoValue);
    return contrato?.productos ?? [];
  }, [idContratoValue, contratos]);
  return (
    <div className="card p-fluid surface-50 p-2 border-round shadow-2">
      {/* Sección Estado Despacho */}
      <div className="col-12 mb-1">
        <div className="border-bottom-2 border-primary pb-3">
          {/* Versión Desktop */}
          <div className="hidden lg:block">
            <label className="block font-medium text-900 mb-3 flex align-items-center">
              <i className="pi pi-map-marker text-primary mr-2"></i>
              Estado de la Despacho
            </label>
            <Controller
              name="estadoDespacho"
              control={control}
              render={({ field, fieldState }) => (
                <div className="bg-white p-3 border-round shadow-1">
                  <Steps
                    model={estadoDespachoOptions.map((option) => ({
                      label: option.label,
                      command: () => {
                        const validTransitions =
                          getValidTransitionsDespacho(estadoDespacho);
                        if (validTransitions.includes(option.value)) {
                          if (validarCamposRequeridosDespacho(option.value)) {
                            field.onChange(option.value);
                          }
                        } else {
                          showToast(
                            "warn",
                            "Transición no válida",
                            `No puedes cambiar a ${option.label} desde ${estadoDespacho}`
                          );
                        }
                      },
                    }))}
                    activeIndex={estadoDespachoOptions.findIndex(
                      (option) => option.value === field.value
                    )}
                    readOnly={false}
                    className="surface-card"
                  />
                  {fieldState.error && (
                    <small className="p-error block mt-2 flex align-items-center">
                      <i className="pi pi-exclamation-circle mr-2"></i>
                      {fieldState.error.message}
                    </small>
                  )}
                </div>
              )}
            />
          </div>

          {/* Versión Mobile */}
          <div className="lg:hidden">
            <label className="block font-medium text-900 mb-3 flex align-items-center">
              <i className="pi pi-map-marker text-primary mr-2"></i>
              Estado de la Despacho
            </label>
            <Controller
              name="estadoDespacho"
              control={control}
              render={({ field, fieldState }) => (
                <div className="bg-white p-3 border-round shadow-1">
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={estadoDespachoOptions}
                    placeholder="Seleccionar estado"
                    className="w-full"
                    panelClassName="shadow-3"
                  />
                  {fieldState.error && (
                    <small className="p-error block mt-2 flex align-items-center">
                      <i className="pi pi-exclamation-circle mr-2"></i>
                      {fieldState.error.message}
                    </small>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Campos del Formulario */}
      <div className="grid formgrid row-gap-2 ">
        {/* Fila 1 */}
        <div className="col-12 lg:col-4">
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
                    id="idContrato.id"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={contratos
                      .filter((c) => c.tipoContrato === "Venta")
                      .map((contrato) => ({
                        label: `${contrato.numeroContrato} - ${truncateText(
                          contrato.descripcion || "Sin descripción",
                          30
                        )}`,
                        value: {
                          id: contrato.id,
                          numeroContrato: contrato.numeroContrato,
                          idItems: contrato.idItems,
                          _id: contrato._id,
                        },
                      }))}
                    placeholder="Seleccionar un proveedor"
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    showClear
                    filter
                    disabled={
                      !isFieldEnabledDespacho("idContrato", estadoDespacho)
                    }
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

        <div className="col-12 lg:col-6">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-box text-primary mr-2"></i>
              Seleccione Producto
            </label>
            <Controller
              name="idContratoItems"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <div className="grid gap-2">
                    {watch("idContrato.idItems")?.map((item: any) => (
                      <div
                        key={item.id}
                        className="col-12  flex align-items-center"
                      >
                        <RadioButton
                          inputId={item.id}
                          name="item"
                          value={item}
                          onChange={(e) => field.onChange(e.value)}
                          checked={field.value?.id === item.id}
                          className="mr-2"
                          disabled={
                            !isFieldEnabledDespacho(
                              "idContratoItems",
                              estadoDespacho
                            )
                          }
                        />
                        <label htmlFor={item.id} className="text-900">
                          {`${item.producto.nombre} - ${
                            item.idTipoProducto.nombre
                          } - ${item.cantidad.toLocaleString()} Bbl - Faltante: ${
                            productosFiltrados
                              .find(
                                (producto: {
                                  producto: { id: string };
                                  tipoProducto?: { id: string };
                                  cantidadFaltanteDespacho?: number;
                                  cantidadDespachada?: number;
                                }) =>
                                  producto.producto.id === item.producto.id &&
                                  producto.tipoProducto?.id ===
                                    item.idTipoProducto.id
                              )
                              ?.cantidadFaltanteDespacho?.toLocaleString() || 0
                          } Bbl - Enviado: ${
                            productosFiltrados
                              .find(
                                (producto: {
                                  producto: { id: string };
                                  tipoProducto?: { id: string };
                                  cantidadFaltanteDespacho?: number;
                                  cantidadDespachada?: number;
                                }) =>
                                  producto.producto.id === item.producto.id &&
                                  producto.tipoProducto?.id ===
                                    item.idTipoProducto.id
                              )
                              ?.cantidadDespachada?.toLocaleString() || 0
                          } Bbl`}
                        </label>
                      </div>
                    ))}
                  </div>
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

        {/* Fila 2 */}
        <div className="col-12 md:col-6 lg:col-2">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-arrow-right text-primary mr-2"></i>
              Cantidad a Despachar
            </label>
            <Controller
              name="cantidadEnviada"
              control={control}
              defaultValue={0} // Valor inicial
              render={({ field, fieldState }) => (
                <>
                  <InputNumber
                    id="cantidadEnviada"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value ?? 0)}
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    min={0}
                    locale="es"
                    disabled={
                      !isFieldEnabledDespacho("cantidadEnviada", estadoDespacho)
                    }
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

        <div className="col-12 md:col-6 lg:col-2">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-id-card text-primary mr-2"></i>
              ID de la Guía
            </label>
            <Controller
              name="idGuia"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputNumber
                    id="idGuia"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    min={0}
                    locale="es"
                    disabled={!isFieldEnabledDespacho("idGuia", estadoDespacho)}
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

        {/* Fila 3 */}
        <div className="col-12 md:col-6 lg:col-2">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-car text-primary mr-2"></i>
              Placa
            </label>
            <Controller
              name="placa"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputText
                    id="placa"
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    disabled={!isFieldEnabledDespacho("placa", estadoDespacho)}
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

        <div className="col-12 md:col-6 lg:col-2">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-user text-primary mr-2"></i>
              Nombre del Chofer
            </label>
            <Controller
              name="nombreChofer"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputText
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    disabled={
                      !isFieldEnabledDespacho("nombreChofer", estadoDespacho)
                    }
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

        {/* Fila 4 - Fechas */}
        {/* Campo: Fecha Salida */}

        <div className="col-12 md:col-6 lg:col-3">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-calendar-minus text-primary mr-2"></i>
              Fecha Salida
            </label>
            <Controller
              name="fechaSalida"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <CustomCalendar
                    {...field}
                    name="fechaSalida"
                    control={control}
                    setValue={setValue}
                    calendarRef={calendarRef}
                    isFieldEnabled={
                      !isFieldEnabledDespacho("fechaSalida", estadoDespacho)
                    }
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
        {/* Campo: Fecha Llegada */}
        <div className="col-12 md:col-6 lg:col-3">
          <div className="p-3 bg-white border-round shadow-1">
            <label className="block font-medium text-900 mb-2 flex align-items-center">
              <i className="pi pi-calendar-plus text-primary mr-2"></i>
              {watch("estadoDespacho") === "EN_TRANSITO"
                ? "Fecha estimada de llegada"
                : "Fecha de llegada real"}
            </label>

            <Controller
              name="fechaLlegada"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <>
                    <CustomCalendar
                      {...field}
                      name="fechaLlegada"
                      control={control}
                      setValue={setValue}
                      calendarRef={calendarRef}
                      isFieldEnabled={
                        !isFieldEnabledDespacho("fechaLlegada", estadoDespacho)
                      }
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
                </>
              )}
            />
          </div>
        </div>

        {/* Sección Chequeo Calidad */}
        <div className="col-12 mt-2">
          <div className="p-2 bg-blue-100 border-round-lg flex align-items-center surface-help">
            <i className="pi pi-info-circle text-2xl text-primary mr-3"></i>
            <span className="text-700">
              Control de Calidad y Cantidad
              <br />
              <strong>Nota:</strong> Realizar mediciones de API, azufre y
              contenido de agua antes de confirmar la despacho
            </span>
          </div>
        </div>
        {/* <div className="col-12 mt-2">
          <div className="p-2 bg-blue-100 border-round flex align-items-center surface-help">
            <i className="pi pi-check-circle text-2xl text-primary mr-3"></i>
            <div>
              <h4 className="text-900 mb-1">Control de Calidad y Cantidad</h4>
              <p className="text-600 m-0">
                Realizar mediciones de API, azufre y contenido de agua antes de
                confirmar la despacho
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};
