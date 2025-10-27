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
                    options={contratos.map((contrato) => ({
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
                  <Calendar
                    id="fechaSalida"
                    value={
                      field.value
                        ? new Date(field.value as string | Date)
                        : undefined
                    }
                    onChange={(e) => field.onChange(e.value)}
                    showTime
                    hourFormat="24"
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    locale="es"
                    disabled={
                      !isFieldEnabledDespacho("fechaSalida", estadoDespacho)
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
              Fecha Llegada
            </label>

            <Controller
              name="fechaLlegada"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Calendar
                    id="fechaLlegada"
                    value={
                      field.value
                        ? new Date(field.value as string | Date)
                        : undefined
                    }
                    onChange={(e) => field.onChange(e.value)}
                    showTime
                    hourFormat="24"
                    className={classNames("w-full", {
                      "p-invalid": fieldState.error,
                    })}
                    locale="es"
                    disabled={
                      !isFieldEnabledDespacho("fechaLlegada", estadoDespacho)
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
//  <div className="grid formgrid p-fluid border-1 border-gray-200 rounded-lg">
//       {/* Campo: Estado de la Despacho */}
//       <div className="field mb-4 col-12 hidden lg:block">
//         <label htmlFor="estadoDespacho" className="font-medium text-900">
//           Estado de la Despacho
//         </label>
//         <Controller
//           name="estadoDespacho"
//           control={control}
//           render={({ field, fieldState }) => (
//             <>
//               <Steps
//                 model={estadoDespachoOptions.map((option) => ({
//                   label: option.label,
//                   command: () => {
//                     const validTransitions =
//                       getValidTransitionsDespacho(estadoDespacho);
//                     if (validTransitions.includes(option.value)) {
//                       if (validarCamposRequeridosDespacho(option.value)) {
//                         field.onChange(option.value);
//                       }
//                     } else {
//                       showToast(
//                         "warn",
//                         "Transición no válida",
//                         `No puedes cambiar a ${option.label} desde ${estadoDespacho}`
//                       );
//                     }
//                   },
//                 }))}
//                 activeIndex={estadoDespachoOptions.findIndex(
//                   (option) => option.value === field.value
//                 )}
//                 readOnly={false}
//               />
//               {fieldState.error && (
//                 <small className="p-error">{fieldState.error.message}</small>
//               )}
//             </>
//           )}
//         />
//       </div>
//       <div className="field mb-4 col-12 sm:col-6 lg:4 lg:hidden">
//         <label htmlFor="estadoDespacho" className="font-medium text-900">
//           Estado de la Despacho
//         </label>
//         <Controller
//           name="estadoDespacho"
//           control={control}
//           render={({ field, fieldState }) => (
//             <Dropdown
//               id="estadoDespacho"
//               value={field.value}
//               onChange={(e) => field.onChange(e.value)}
//               options={estadoDespachoOptions}
//               placeholder="Seleccionar estado de la despacho"
//               className={classNames("w-full", {
//                 "p-invalid": fieldState.error,
//               })}
//             />
//           )}
//         />
//         {errors.estadoDespacho && (
//           <small className="p-error">{errors.estadoDespacho.message}</small>
//         )}
//       </div>

//       {/* Campo: Número de Contrato */}
//       <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//         <label htmlFor="idContacto.nombre" className="font-medium text-900">
//           Número de Contrato
//         </label>
//         <Controller
//           name="idContrato"
//           control={control}
//           render={({ field, fieldState }) => {
//             console.log("fieldState", fieldState.error);
//             return (
//               <>
//                 <Dropdown
//                   id="idContrato.id"
//                   value={field.value}
//                   onChange={(e) => field.onChange(e.value)}
//                   options={contratos.map((contrato) => ({
//                     label: `${contrato.numeroContrato} - ${truncateText(
//                       contrato.descripcion || "Sin descripción",
//                       30
//                     )}`,
//                     value: { ...contrato },
//                   }))}
//                   placeholder="Seleccionar un proveedor"
//                   className={classNames("w-full", {
//                     "p-invalid": fieldState.error,
//                   })}
//                   showClear
//                   filter
//                   disabled={
//                     !isFieldEnabledDespacho("idContrato", estadoDespacho)
//                   }
//                 />
//                 {fieldState.error && (
//                   <small className="p-error">{fieldState.error.message}</small>
//                 )}
//               </>
//             );
//           }}
//         />
//         {errors.idContrato?.numeroContrato && (
//           <small className="p-error">
//             {errors.idContrato.numeroContrato.message}
//           </small>
//         )}
//       </div>

//       {/* Campo: Nombre del producto*/}
//       <div className="field mb-4 col-12 sm:col-6 lg:col-6">
//         <label htmlFor="idContacto.nombre" className="font-medium text-900">
//           Seleccione Producto
//         </label>
//         <Controller
//           name="idContratoItems"
//           control={control}
//           render={({ field }) => (
//             <>
//               {watch("idContrato.idItems")?.map((items: any) => (
//                 <div key={items.id} className="flex align-items-center">
//                   <RadioButton
//                     inputId={items.id}
//                     name="items"
//                     value={items}
//                     onChange={(e) => field.onChange(e.value)}
//                     checked={field.value?.id === items.id}
//                     disabled={
//                       !isFieldEnabledDespacho(
//                         "idContratoItems",
//                         estadoDespacho
//                       )
//                     }
//                   />
//                   <label htmlFor={items.id} className="ml-2">
//                     {items.producto.nombre + "-" + items.cantidad + "Bbl"}
//                   </label>
//                 </div>
//               ))}
//             </>
//           )}
//         />
//         {errors.idContratoItems && (
//           <small className="p-error">{errors.idContratoItems.message}</small>
//         )}
//       </div>

//       {/* Campo: Cantidad Enviada */}
//       <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//         <label htmlFor="cantidadEnviada" className="font-medium text-900">
//           Cantidad Enviada
//         </label>
//         <Controller
//           name="cantidadEnviada"
//           control={control}
//           defaultValue={0}
//           render={({ field }) => (
//             <InputNumber
//               id="cantidadEnviada"
//               value={field.value}
//               onValueChange={(e) => field.onChange(e.value ?? 0)}
//               className={classNames("w-full", {
//                 "p-invalid": errors.cantidadEnviada,
//               })}
//               min={0}
//               locale="es"
//               disabled={
//                 !isFieldEnabledDespacho("cantidadEnviada", estadoDespacho)
//               }
//             />
//           )}
//         />
//         {errors.cantidadEnviada && (
//           <small className="p-error">{errors.cantidadEnviada.message}</small>
//         )}
//       </div>

//       {/* Campo: ID de la Guía */}
//       <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//         <label htmlFor="idGuia" className="font-medium text-900">
//           ID de la Guía
//         </label>
//         <Controller
//           name="idGuia"
//           control={control}
//           render={({ field }) => (
//             <InputNumber
//               id="idGuia"
//               value={field.value}
//               onValueChange={(e) => field.onChange(e.value)}
//               className={classNames("w-full", {
//                 "p-invalid": errors.idGuia,
//               })}
//               min={0}
//               locale="es"
//               disabled={!isFieldEnabledDespacho("idGuia", estadoDespacho)}
//             />
//           )}
//         />
//         {errors.idGuia && (
//           <small className="p-error">{errors.idGuia.message}</small>
//         )}
//       </div>

//       {/* Campo: Placa */}
//       <div className="field mb-4 col-12 sm:col-6 lg:col-2">
//         <label htmlFor="placa" className="font-medium text-900">
//           Placa
//         </label>
//         <InputText
//           id="placa"
//           {...register("placa")}
//           className={classNames("w-full", { "p-invalid": errors.placa })}
//           disabled={!isFieldEnabledDespacho("placa", estadoDespacho)}
//         />
//         {errors.placa && (
//           <small className="p-error">{errors.placa.message}</small>
//         )}
//       </div>

//       {/* Campo: Nombre del Chofer */}
//       <div className="field mb-4 col-12 sm:col-6 lg:col-4">
//         <label htmlFor="nombreChofer" className="font-medium text-900">
//           Nombre del Chofer
//         </label>
//         <InputText
//           id="nombreChofer"
//           {...register("nombreChofer")}
//           className={classNames("w-full", {
//             "p-invalid": errors.nombreChofer,
//           })}
//           disabled={!isFieldEnabledDespacho("nombreChofer", estadoDespacho)}
//         />
//         {errors.nombreChofer && (
//           <small className="p-error">{errors.nombreChofer.message}</small>
//         )}
//       </div>

//       {/* Campo: Fecha Salida */}
//       <div className="field mb-4 col-12 sm:col-4 lg:4">
//         <label htmlFor="fechaSalida" className="font-medium text-900">
//           Fecha Salida
//         </label>
//         <Calendar
//           id="fechaSalida"
//           value={
//             watch("fechaSalida")
//               ? new Date(watch("fechaSalida") as string | Date)
//               : undefined
//           }
//           {...register("fechaSalida")}
//           showTime
//           hourFormat="24"
//           className={classNames("w-full", {
//             "p-invalid": errors.fechaSalida,
//           })}
//           locale="es"
//           disabled={!isFieldEnabledDespacho("fechaSalida", estadoDespacho)}
//         />
//         {errors.fechaSalida && (
//           <small className="p-error">{errors.fechaSalida.message}</small>
//         )}
//       </div>

//       {/* Campo: Fecha Llegada */}
//       <div className="field mb-4 col-12 sm:col-4 lg:4">
//         <label htmlFor="fechaLlegada" className="font-medium text-900">
//           Fecha Llegada
//         </label>
{
  /* <Calendar
  id="fechaLlegada"
  value={
    watch("fechaLlegada")
      ? new Date(watch("fechaLlegada") as string | Date)
      : undefined
  }
  {...register("fechaLlegada")}
  showTime
  hourFormat="24"
  className={classNames("w-full", {
    "p-invalid": errors.fechaLlegada,
  })}
  locale="es"
  disabled={!isFieldEnabledDespacho("fechaLlegada", estadoDespacho)}
/>; */
}
//         {errors.fechaLlegada && (
//           <small className="p-error">{errors.fechaLlegada.message}</small>
//         )}
//       </div>

//       <h3>falta el tema del chequeo de cantidad y calidad</h3>
//     </div>
