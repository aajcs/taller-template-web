import { useState, useEffect, useMemo, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { classNames } from "primereact/utils";
import { CrudeOption, Product } from "@/types/simulador";
import { getRefinerias } from "@/app/api/refineriaService";
import { useRefineryPrecios } from "@/hooks/useRefineryPrecios";

import { TipoProducto } from "@/libs/interfaces";
import { Dropdown } from "primereact/dropdown";
import { Accordion, AccordionTab } from "primereact/accordion";
import { ToggleButton } from "primereact/togglebutton";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputNumber } from "primereact/inputnumber";
import { useByRefineryData } from "@/hooks/useByRefineryData";
import { useRefineryDataFull } from "@/hooks/useRefineryDataFull";

// Definiciones de tipos y esquemas
type SimulationMode = "crudeToProducts" | "productsToCrude";
const products: Product[] = ["gas", "naphtha", "kerosene", "mgo4", "mgo6"];

const formSchema = z.object({
  mode: z.enum(["crudeToProducts", "productsToCrude"]),
  crudeType: z.object({
    id: z.string(),
    nombre: z.string(),
    gravedadAPI: z.number().optional(),
    azufre: z.number().optional(),
    rendimiento: z.number().optional(),
    color: z.string().optional(),
    clasificacion: z.string().optional(),
    contenidoAgua: z.number().optional(),
    convenio: z.number().optional(),
    costoOperacional: z.number().optional(),
    puntoDeInflamacion: z.number().optional(),
    transporte: z.number().optional(),
    idProducto: z
      .object({
        id: z.string(),
        nombre: z.string(),
        color: z.string().optional(),
        _id: z.string(),
      })
      .optional(),
    idRefineria: z
      .object({
        id: z.string(),
        nombre: z.string(),
        _id: z.string(),
        procesamientoDia: z.number().optional(),
      })
      .optional(),
    rendimientos: z
      .array(
        z.object({
          idProducto: z
            .object({
              id: z.string(),
              nombre: z.string(),
              color: z.string().optional(),
            })
            .optional(),
          transporte: z.number().optional(),
          bunker: z.number().optional(),
          costoVenta: z.number().optional(),
          porcentaje: z.number().optional(),
        })
      )
      .optional(),
    eliminado: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    _id: z.string(),
  }),

  crudeAmount: z.number().min(1).optional(),
  desiredProducts: z
    .record(
      z.enum(["gas", "naphtha", "kerosene", "mgo4", "mgo6"]),
      z.number().min(0)
    )
    .optional(),

  idRefineria: z.object({
    id: z.string(),
    nombre: z.string(),
    _id: z.string(),
  }),
});
// .refine(
//   (data) =>
//     data.mode === "crudeToProducts"
//       ? data.crudeAmount !== undefined
//       : Object.values(data.desiredProducts).some((v) => v > 0),
//   {
//     message: "Debe ingresar cantidad de crudo o al menos un producto deseado",
//     path: ["crudeAmount"],
//   }
// );

type FormValues = z.infer<typeof formSchema>;

interface SimulatorFormProps {
  onCalculate: (data: any) => void;
  isLoading: boolean;
}

export default function SimulatorForm({
  onCalculate,
  isLoading,
}: SimulatorFormProps) {
  // Hooks y estados
  const { loading, brent, oilDerivate } = useRefineryPrecios();
  const [refineria, setRefineria] = useState<any | null>(null);
  const { refinerias = [] } = useRefineryDataFull();
  const { tipoProductos = [], loading: loadingData } = useByRefineryData(
    refineria?.id || ""
  );
  const [tipoProducto, setTipoProducto] = useState<TipoProducto>();

  // Form configuration
  const {
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "crudeToProducts",
      crudeAmount: refineria?.procesamientoDia || 1000,
    },
  });
  // Watchers
  const mode = watch("mode");
  const crudeType = watch("crudeType");
  // const selectedCrude = crudeOptions.find(
  //   (option) => option.value === crudeType
  // );

  // Efectos
  // useEffect(() => {
  //   fetchRefinerias();
  // }, []);

  // useEffect(() => {
  //   updateCrudeCosts();
  // }, [selectedCrude]);

  // useEffect(() => {
  //   updateProductPrices();
  // }, [oilDerivate]);

  // Handlers
  const onSubmit = (data: any) => {
    onCalculate({
      ...data,
      crudeType: {
        ...data.crudeType,
        convenio: data.crudeType.convenio + brent,
      },
    });
  };

  // Render helpers
  const renderRefinerySelector = () => (
    <div className="col-12 md:col-6 lg:col-6">
      <label className="block font-medium text-900 mb-3 flex align-items-center">
        <i className="pi pi-database mr-2 text-primary"></i>
        Seleccione la refinería
      </label>
      <Controller
        name="idRefineria"
        control={control}
        render={({ field, fieldState }) => (
          <Dropdown
            value={field.value}
            onChange={(e) => {
              field.onChange(e.value);
              setRefineria(e.value);
            }}
            options={refinerias.map((refineria) => ({
              label: `${refineria.nombre} - (${
                refineria.procesamientoDia || 0
              } Bbl x día)`,
              value: {
                id: refineria.id,
                nombre: refineria.nombre,
                _id: refineria.id,
              },
            }))}
            placeholder="Seleccionar refinería"
            className={classNames("w-full", { "p-invalid": fieldState.error })}
            showClear
            filter
          />
        )}
      />
    </div>
  );

  const renderCrudeTypeSelector = () => (
    <div className="col-12 md:col-6 lg:col-6">
      <label className="block font-medium text-900 mb-3 flex align-items-center">
        <i className="pi pi-database mr-2 text-primary"></i>
        Tipo de crudo
      </label>
      <Controller
        name="crudeType"
        control={control}
        render={({ field }) => (
          <Dropdown
            {...field}
            onChange={(e) => {
              field.onChange(e.value);
              setTipoProducto(e.value);
            }}
            options={tipoProductos.map((tipoProducto) => ({
              label: `${tipoProducto.nombre} - (API: ${
                tipoProducto.gravedadAPI || 0
              }, Azufre: ${tipoProducto.azufre || 0}%)`,
              value: { ...tipoProducto },
            }))}
            placeholder="Seleccione un crudo"
            className="w-full"
            filter
          />
        )}
      />
    </div>
  );

  const renderCrudeDetails = () => (
    <div className="col-12 md:col-12 lg:col-12 my-4">
      <Accordion>
        {tipoProducto && (
          <AccordionTab header={`Costos del crudo (${tipoProducto.nombre})`}>
            <CrudeCostsPanel tipoProducto={tipoProducto} control={control} />
          </AccordionTab>
        )}
        {tipoProducto && (
          <AccordionTab
            header={`Rendimientos (${tipoProducto.rendimientos?.length || 0})`}
          >
            <YieldDetails
              rendimientos={tipoProducto.rendimientos}
              control={control}
            />
          </AccordionTab>
        )}
      </Accordion>
    </div>
  );

  const renderSimulationModeToggle = () => (
    <div className="field">
      <label className="font-bold block mb-2">Modo de simulación</label>
      <Controller
        name="mode"
        control={control}
        render={({ field }) => (
          <Button
            label={
              field.value === "crudeToProducts"
                ? "Crudo → Derivados"
                : "Derivados → Crudo"
            }
            icon={
              field.value === "crudeToProducts"
                ? "pi pi-arrow-up"
                : "pi pi-arrow-down"
            }
            onClick={() =>
              field.onChange(
                field.value === "crudeToProducts"
                  ? "productsToCrude"
                  : "crudeToProducts"
              )
            }
            className="w-full p-button-outlined"
          />
        )}
      />
    </div>
  );

  const renderInputSection = () =>
    mode === "crudeToProducts" ? renderCrudeInput() : renderProductsInput();

  const renderCrudeInput = () => (
    <div className="field">
      <label className="font-bold block mb-2">Cantidad de crudo (bbl)</label>
      <Controller
        name="crudeAmount"
        control={control}
        render={({ field }) => (
          <InputNumber
            value={field.value}
            onValueChange={(e) => field.onChange(e.value)}
            min={0}
            className="w-full"
            mode="decimal"
            locale="es"
            placeholder="Ingrese cantidad de crudo"
            inputClassName={classNames({ "p-invalid": errors.crudeAmount })} // Añadir clase de error si hay un error
            tooltip="Cantidad de crudo en barriles (bbl)"
            tooltipOptions={{ position: "top" }}
          />
        )}
      />
      {errors.crudeAmount && (
        <small className="text-red-500">{errors.crudeAmount.message}</small>
      )}
    </div>
  );

  const renderProductsInput = () => (
    <div className="field">
      <label className="font-bold block mb-2">Derivados deseados (bbl)</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => (
          <Controller
            key={product}
            name={`desiredProducts.${product}`}
            control={control}
            render={({ field }) => (
              <div className="field">
                <label className="capitalize">{product}</label>
                <InputNumber
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  min={0}
                  className="w-full"
                />
              </div>
            )}
          />
        ))}
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className=" p-fluid p-2">
      <h2 className="text-2xl font-bold text-primary mb-4">
        Resultados de la simulación
      </h2>

      <div className="grid card">
        {/* {renderBrentPrice()} */}
        {renderRefinerySelector()}
        {renderCrudeTypeSelector()}
        {renderCrudeDetails()}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="-m-2 card">
        {renderSimulationModeToggle()}
        {renderInputSection()}

        <Button
          type="submit"
          label="Calcular"
          className="w-full"
          loading={isLoading}
        />
      </form>
    </div>
  );
}

// Componentes auxiliares
const LoadingSpinner = () => (
  <div
    className="flex justify-content-center align-items-center"
    style={{ height: "300px" }}
  >
    <ProgressSpinner />
  </div>
);

const CrudeCostsPanel = ({
  tipoProducto,
  control,
}: {
  tipoProducto: TipoProducto;
  control: any;
}) => (
  <div
    className="p-3 mb-2 border-round shadow-1 text-sm text-gray-800 flex align-items-center gap-4"
    style={{ backgroundColor: `#${tipoProducto.idProducto?.color}20` }}
  >
    <span className="font-bold text-primary">
      {tipoProducto.idProducto?.nombre || "Producto Desconocido"}
    </span>
    <div className="flex gap-4">
      {/* Costo Compra */}
      <div className="flex align-items-center gap-2">
        <i className="pi pi-dollar text-green-500"></i>
        <span>
          <strong>Convenio Compra:</strong>{" "}
          <Controller
            name={`crudeType.convenio`}
            control={control}
            defaultValue={tipoProducto.convenio || 0}
            render={({ field }) => (
              <InputNumber
                value={field.value} // Asegúrate de que el valor sea controlado
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="USD"
                locale="es"
                className="w-20"
              />
            )}
          />
        </span>
      </div>
      {/* Transporte */}

      {/* Bunker */}
      <div className="flex align-items-center gap-2">
        <i className="pi pi-dollar text-green-500"></i>
        <span>
          <strong>Transporte:</strong>{" "}
          <Controller
            name={`crudeType.transporte`}
            control={control}
            defaultValue={tipoProducto.transporte || 0}
            render={({ field }) => (
              <InputNumber
                value={field.value} // Asegúrate de que el valor sea controlado
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="USD"
                locale="es"
                className="w-20"
              />
            )}
          />
        </span>
      </div>
      <div className="flex align-items-center gap-2">
        <i className="pi pi-dollar text-green-500"></i>
        <span>
          <strong>Costo Operacional:</strong>{" "}
          <Controller
            name={`crudeType.costoOperacional`}
            control={control}
            defaultValue={tipoProducto.costoOperacional || 0}
            render={({ field }) => (
              <InputNumber
                value={field.value} // Asegúrate de que el valor sea controlado
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="USD"
                locale="es"
                className="w-20"
              />
            )}
          />
        </span>
      </div>
    </div>
  </div>
);

const YieldDetails = ({
  rendimientos,
  control,
}: {
  rendimientos: Array<{
    idProducto?: { nombre?: string; color?: string };
    costoVenta?: number;
    transporte?: number;
    bunker?: number;
    porcentaje?: number;
  }>;
  control: any;
}) => (
  <>
    {rendimientos?.map((rendimiento, index) => (
      <div
        key={index}
        className="p-3 mb-2 border-round shadow-1 text-sm text-gray-800 flex align-items-center gap-4"
        style={{ backgroundColor: `#${rendimiento.idProducto?.color}20` }}
      >
        <span className="font-bold text-primary">
          {rendimiento.idProducto?.nombre || "Producto Desconocido"}
        </span>
        <div className="flex gap-4">
          {/* Costo Venta */}
          <div className="flex align-items-center gap-2">
            <i className="pi pi-dollar text-green-500"></i>
            <span>
              <strong>Costo Venta:</strong>{" "}
              <Controller
                name={`crudeType.rendimientos.${index}.costoVenta`}
                control={control}
                defaultValue={rendimiento.costoVenta || 0}
                render={({ field }) => (
                  <InputNumber
                    value={field.value} // Asegúrate de que el valor sea controlado
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="es"
                    className="w-20"
                  />
                )}
              />
            </span>
          </div>
          {/* Transporte */}
          <div className="flex align-items-center gap-2">
            <i className="pi pi-dollar text-green-500"></i>
            <span>
              <strong>Transporte:</strong>{" "}
              <Controller
                name={`crudeType.rendimientos.${index}.transporte`}
                control={control}
                defaultValue={rendimiento.transporte || 0}
                render={({ field }) => (
                  <InputNumber
                    value={field.value} // Asegúrate de que el valor sea controlado
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="es"
                    className="w-20"
                  />
                )}
              />
            </span>
          </div>

          {/* Bunker */}
          <div className="flex align-items-center gap-2">
            <i className="pi pi-dollar text-green-500"></i>
            <span>
              <strong>Bunker:</strong>{" "}
              <Controller
                name={`crudeType.rendimientos.${index}.bunker`}
                control={control}
                defaultValue={rendimiento.bunker || 0}
                render={({ field }) => (
                  <InputNumber
                    value={field.value} // Asegúrate de que el valor sea controlado
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="es"
                    className="w-20"
                  />
                )}
              />
            </span>
          </div>

          {/* Porcentaje */}
          <div className="flex align-items-center gap-2">
            <i className="pi pi-percentage text-purple-500"></i>
            <span>
              <strong>Porcentaje:</strong>{" "}
              <Controller
                name={`crudeType.rendimientos.${index}.porcentaje`}
                control={control}
                defaultValue={rendimiento.porcentaje || 0}
                render={({ field }) => (
                  <InputNumber
                    value={field.value} // Asegúrate de que el valor sea controlado
                    onValueChange={(e) => field.onChange(e.value)}
                    suffix="%"
                    className="w-20"
                  />
                )}
              />
            </span>
          </div>
        </div>
      </div>
    ))}
  </>
);

// // Funciones de apoyo
// const getDefaultValues = () => ({
//   mode: "crudeToProducts",
//   crudeType: "",
//   crudeAmount: 1000,
//   desiredProducts: products.reduce(
//     (acc, product) => ({ ...acc, [product]: 0 }),
//     {} as Record<Product, number>
//   ),
//   productPrices: products.reduce(
//     (acc, product) => ({ ...acc, [product]: 0 }),
//     {} as Record<Product, number>
//   ),
//   crudeCosts: {
//     purchasePrice: 0,
//     transportCost: 0,
//     operationalCost: 0,
//   },
// });

// const processFormData = (data: FormValues) => ({
//   ...data,
//   crudeCosts: {
//     purchasePrice: data.crudeCosts.purchasePrice + brent,
//     transportCost: data.crudeCosts.transportCost,
//     operationalCost: data.crudeCosts.operationalCost,
//   },
// });
