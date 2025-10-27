import { Card } from "primereact/card";
import { Column, ColumnEditorOptions } from "primereact/column";
import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import "./Simulador.css";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { animated, useSprings } from "@react-spring/web";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { getRefinerias } from "@/app/api/refineriaService";

import { TipoProducto } from "@/libs/interfaces";
import { useRefineryPrecios } from "@/hooks/useRefineryPrecios";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { useByRefineryData } from "@/hooks/useByRefineryData";

const barrelUnit = "BBL";
const dollarPerBarrelUnit = "$/BBL";

function Simulador() {
  return <ComprasCard />;
}

type Mezcla = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  transporte: number;
  rendimientos: {
    id: string;
    nombre: string;
    value: number;
  }[];
};

type Productos = {
  id: string;
  idRefineria: {
    id: string;
  };
  idProducto: {
    id: string;
  };
  nombre: string;
  clasificacion: string;
  rendimientos: {
    idProducto: {
      id: string;
      nombre: string;
    };
    porcentaje: number;
  }[];
};

type Refineria = {
  id: string;
  nombre: string;
  img: string;
};

type Referencia = {
  name: string;
  price: number;
};

function NumericEditor({ value, editorCallback }: ColumnEditorOptions) {
  return (
    <InputNumber
      className="numericInput numericInputContainer"
      inputClassName="numericInput"
      value={value}
      onValueChange={(e) => editorCallback!(e.value)}
      showButtons
      currency="USD"
      buttonLayout="horizontal"
      step={0.5}
      incrementButtonIcon="pi pi-plus"
      decrementButtonIcon="pi pi-minus"
      incrementButtonClassName="increment"
      decrementButtonClassName="decrement"
    />
  );
}
type NumericInputProps = {
  label?: string;
  unit?: string;
  value: number;
  onChange: Dispatch<SetStateAction<number>>;
  step?: number;
};
function NumericInput({
  label,
  unit,
  value,
  onChange: setValue,
  step: stepSize,
}: NumericInputProps) {
  const step = stepSize ?? 0;
  const increment = () => setValue((prev) => prev + step);
  const decrement = () => setValue((prev) => prev - step);

  return (
    <div>
      {label && (
        <label htmlFor={label} className="label">
          {label}:
        </label>
      )}
      <div className="numericInputContainer">
        <button
          type="button"
          className="minus numericInputButton"
          onClick={decrement}
        >
          -
        </button>
        <input
          name={label}
          className="numericInput"
          type="number"
          min={0}
          max={0}
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.valueAsNumber)}
        />
        <button
          type="button"
          className={"numericInputButton plus"}
          onClick={increment}
        >
          +
        </button>
        {unit && <span className={"numericInputSpan"}>{unit}</span>}
      </div>
    </div>
  );
}

function SelectEditor({
  value,
  editorCallback,
  options,
  optionLabel,
  optionValue,
}: ColumnEditorOptions & {
  options: unknown[];
  optionLabel: string;
  optionValue: string;
}) {
  return (
    <Dropdown
      optionValue={optionValue}
      value={value}
      onChange={(e) => {
        // console.log(e.value);
        return editorCallback!(e.value);
      }}
      options={options}
      optionLabel={optionLabel}
      placeholder="--- Seleccione ---"
    />
  );
}

function renderNumber(value: number, truncate?: boolean) {
  return isNaN(value) ? "-" : truncate ? Math.floor(value) : value.toFixed(2);
}

function ComprasCard() {
  const { loading, brent, oilDerivate } = useRefineryPrecios();
  const [refinerias, setRefinerias] = useState<Refineria[]>([]);
  const [selectedRefineria, setSelectedRefineria] = useState<Refineria | null>(
    null
  );
  const { tipoProductos = [], loading: loadingData } = useByRefineryData(
    selectedRefineria?.id || ""
  );
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [selectedReferencia, setSelectedReferencia] =
    useState<Referencia | null>(null);
  const [filteredDerivatesdata, setFilteredDerivatesdata] = useState([]);

  const [maquila, setMaquila] = useState(3.5);

  const [products, setProducts] = useState<TipoProducto[]>(tipoProductos || []);
  const defaultProduct: Mezcla = products.map<Mezcla>((p) => ({
    id: p.id,
    nombre: p.nombre,
    cantidad: 100,
    precio: (selectedReferencia?.price ?? 0) + (p.convenio ?? 0),
    rendimientos: [],
    transporte: 0,
  }))[0];
  const [mezcla, setMezcla] = useState<Mezcla[]>([]);

  const totalBbl = mezcla.reduce((prev, curr) => prev + curr.cantidad, 0);
  const precioMezcla =
    mezcla.reduce(
      (prev, curr) =>
        prev + curr.cantidad * curr.precio + curr.transporte * curr.cantidad,
      0
    ) /
      totalBbl +
    maquila;

  const rendimientoMezcla = mezcla.reduce<
    Record<string, Mezcla["rendimientos"][number]>
  >((prev, curr) => {
    for (const rendimiento of curr.rendimientos) {
      if (!prev[rendimiento.id]) {
        prev[rendimiento.id] = {
          id: rendimiento.id,
          nombre: rendimiento.nombre,
          value: 0,
        };
      }
      prev[rendimiento.id].value +=
        (rendimiento.value * curr.cantidad) / totalBbl;
    }
    return prev;
  }, {});

  // Parche temporal ya que me interesa 3 tipos de derivados, realmente el filtro debería filtrar por los object id que te indica la torre de la refinería
  const rendimientosParche = Object.values(rendimientoMezcla).filter(
    (value) =>
      value.nombre.toLowerCase().includes("nafta") ||
      value.nombre.toLowerCase().includes("mgo") ||
      value.nombre.toLowerCase().includes("fo6")
  );

  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    const mezclaClone = [...mezcla];
    const { newData, index } = e;
    const product = products.find((p) => p.nombre === newData.nombre)!;
    mezclaClone[index] = {
      ...newData,
      id: product.id,
      rendimientos: product.rendimientos.map((r) => ({
        id: r.idProducto.id,
        nombre: r.idProducto.nombre,
        value: r.porcentaje,
      })),
    } as unknown as Mezcla;
    setMezcla(mezclaClone);
  };

  const header = () => {
    return (
      <div className="tableHeader">
        <h3>Crudos</h3>
        {products.length > 0 && (
          <Button
            severity="success"
            icon="pi pi-plus"
            label="Añadir crudo"
            onClick={() => setMezcla([...mezcla, defaultProduct])}
          />
        )}
      </div>
    );
  };

  const formulaColumn = (col: Mezcla) => {
    if (!selectedReferencia) {
      return <p>-</p>;
    }

    const diff = col.precio - selectedReferencia.price;

    if (diff === 0) {
      return <span className="brentFormula">{selectedReferencia.name}</span>;
    }

    return !selectedReferencia ? (
      "-"
    ) : (
      <span className="brentFormula">{`${selectedReferencia.name} ${
        diff > 0 ? "+" : "-"
      } ${renderNumber(Math.abs(diff))}`}</span>
    );
  };

  useEffect(() => {
    setProducts(tipoProductos);
  }, [selectedRefineria, tipoProductos]);
  useEffect(() => {
    setReferencias([
      {
        name: "Brent",
        price: brent,
      },
    ]);
  }, [brent]);
  useEffect(() => {
    const fetchRefinerias = async () => {
      try {
        const data = await getRefinerias();
        const { refinerias: dataRefinerias } = data;
        if (Array.isArray(dataRefinerias)) {
          setRefinerias(dataRefinerias);
        } else {
          console.error("La respuesta no es un array:", dataRefinerias);
        }
      } catch (error) {
        console.error("Error al obtener las refinerías:", error);
      }
    };

    fetchRefinerias();
  }, []);

  return (
    <main>
      <Card
        title={() => (
          <h2 className="mb-0">
            {" "}
            <span
              className="pi pi-wallet"
              style={{ fontSize: "2rem", marginRight: ".5rem" }}
            ></span>{" "}
            Compras
          </h2>
        )}
      >
        <div className="refineryGroup">
          <div className="inputGroup">
            <label htmlFor="refineria">Refinería:</label>
            <Dropdown
              inputId="refineria"
              value={selectedRefineria}
              onChange={(e) => setSelectedRefineria(e.value)}
              options={refinerias}
              optionLabel="nombre"
              placeholder="--- Seleccione ---"
            />
          </div>
          <div className="inputGroup">
            <label htmlFor="referencia">Referencia:</label>
            <Dropdown
              inputId="referencia"
              value={selectedReferencia}
              onChange={(e) => {
                // const referencia = referencias.find(r => r.name === e.value)
                // if (referencia) {
                //     setSelectedReferencia(referencia);
                // }
                setSelectedReferencia(e.value);
              }}
              options={referencias}
              // optionLabel="name"
              itemTemplate={(referencia: Referencia) => (
                <span>{`${referencia.name} ($${referencia.price})`}</span>
              )}
              valueTemplate={(referencia: Referencia) =>
                !referencia ? (
                  "--- Seleccione ---"
                ) : (
                  <span>{`${referencia?.name} ($${referencia?.price})`}</span>
                )
              }
              placeholder="--- Seleccione ---"
            />
          </div>
          <div className="inputGroup">
            <label htmlFor="maquila">Maquila:</label>
            <NumericInput onChange={setMaquila} value={maquila} step={0.5} />
          </div>
        </div>

        <DataTable
          header={header}
          value={mezcla}
          editMode="row"
          onRowEditComplete={onRowEditComplete}
          size="small"
        >
          <Column
            field="nombre"
            header="Nombre"
            editor={(opt) => (
              <Dropdown
                value={opt.value}
                options={products}
                optionLabel={"nombre"}
                optionValue="nombre"
                onChange={(e) => {
                  opt.editorCallback!(e.value);
                }}
                placeholder="--- Seleccione ---"
              />
            )}
            footer="Total"
          />
          <Column
            field="cantidad"
            header={`Cantidad (${barrelUnit})`}
            editor={(options) => (
              <NumericInput
                value={options.value}
                onChange={(e) =>
                  options.editorCallback!(
                    typeof e === "number" ? e : e(options.value)
                  )
                }
                step={100}
              />
            )}
            footer={totalBbl}
          />
          <Column
            field="precio"
            header={`Precio (${dollarPerBarrelUnit})`}
            editor={(options) => (
              <NumericInput
                value={options.value}
                onChange={(e) =>
                  options.editorCallback!(
                    typeof e === "number" ? e : e(options.value)
                  )
                }
                step={0.5}
              />
            )}
            footer={renderNumber(
              mezcla.reduce(
                (prev, curr) => prev + curr.cantidad * curr.precio,
                0
              ) / totalBbl
            )}
          />
          <Column
            field="transporte"
            header={`Tractomula (${dollarPerBarrelUnit})`}
            editor={(options) => (
              <NumericInput
                value={options.value}
                onChange={(e) =>
                  options.editorCallback!(
                    typeof e === "number" ? e : e(options.value)
                  )
                }
                step={0.5}
              />
            )}
            footer={renderNumber(
              mezcla.reduce(
                (prev, curr) => prev + curr.cantidad * curr.transporte,
                0
              ) / totalBbl
            )}
          />
          <Column header="Fórmula" body={(col) => formulaColumn(col)} />
          <Column
            rowEditor={true}
            headerStyle={{ width: "10%", minWidth: "8rem" }}
            bodyStyle={{ textAlign: "center" }}
          />
        </DataTable>

        <h3>Dieta crudo</h3>
        <DietaBar mezcla={mezcla} total={totalBbl} />

        <h3>Rendimiento</h3>
        <RendimientoBar rendimientos={rendimientosParche} />

        <p className="operativeCost">
          {renderNumber(precioMezcla)}
          {dollarPerBarrelUnit}
        </p>
        <p>Costo operativo</p>
        {/* <p>Costo Operativo {renderNumber(precioMezcla)}</p> */}
      </Card>
      <VentasCard
        maquila={maquila}
        operationalCost={mezcla.reduce(
          (prev, curr) =>
            prev + (curr.cantidad * (curr.precio + curr.transporte)) / totalBbl,
          maquila
        )}
        rendimientos={rendimientosParche}
        oilCost={mezcla.reduce(
          (prev, curr) => prev + (curr.cantidad * curr.precio) / totalBbl,
          0
        )}
        totalBbl={totalBbl}
        totalTractomula={mezcla.reduce(
          (prev, curr) => prev + curr.transporte * curr.cantidad,
          0
        )}
      ></VentasCard>
    </main>
  );
}

type RendimientoBarProps = {
  rendimientos: {
    id: string;
    nombre: string;
    value: number;
  }[];
};

function RendimientoBar({ rendimientos }: RendimientoBarProps) {
  const [springs, api] = useSprings(
    rendimientos.length,
    () => ({
      from: {
        width: "0%",
      },
    }),
    [rendimientos]
  );

  useEffect(() => {
    // console.log(mezcla, total)
    api.start((index) => ({
      to: {
        width: `${rendimientos[index].value}%`,
      },
    }));
  }, [rendimientos]);

  return (
    <div className="rendimientoBar">
      {rendimientos.map((r, i) => (
        <animated.div key={r.id} style={{ ...springs[i] }}>
          <span>{r.nombre}</span>
          <span>{`${renderNumber(r.value)}%`}</span>
        </animated.div>
      ))}
    </div>
  );
}

type DietaBarProps = {
  mezcla: {
    nombre: Mezcla["nombre"];
    cantidad: Mezcla["cantidad"];
  }[];
  total: number;
};

function DietaBar({ mezcla, total }: DietaBarProps) {
  const [springs, api] = useSprings(
    mezcla.length,
    () => ({
      from: {
        width: "0%",
      },
    }),
    [mezcla, total]
  );

  useEffect(() => {
    // console.log(mezcla, total)
    api.start((index) => ({
      to: {
        width: `${(mezcla[index].cantidad / total) * 100}%`,
      },
    }));
  }, [mezcla, total]);

  return (
    <div className="dietaBar">
      {mezcla.map((m, i) => (
        <animated.div key={i} style={{ ...springs[i] }}>
          <span>{m.nombre}</span>
          <span>{`${renderNumber(m.cantidad, true)} BBL`}</span>
        </animated.div>
      ))}
    </div>
  );
}

type DerivadoPriceProps = {
  price: number;
  oilCost: number;
  tractomula: number;
  bunker: number;
  barrels: number;
};

function DerivadoPrice({
  price,
  oilCost,
  barrels,
  tractomula,
  bunker,
}: DerivadoPriceProps) {
  const profit = price - oilCost - tractomula - bunker;

  return (
    <>
      <p className="derivativeProfit">
        {price}
        {dollarPerBarrelUnit}
        <span
          className={`derivativeProfitDiff ${
            profit > 0 ? "positive" : "negative"
          }`}
        >
          {profit > 0 ? "+" : "-"}
          {renderNumber(Math.abs(profit))}
        </span>
      </p>
      <p>
        {barrels}
        {barrelUnit}
      </p>
    </>
  );
}

const OperationalMargin = ({
  profit,
  operationalCost,
}: {
  profit: number;
  operationalCost: number;
}) => {
  if (profit === 0) {
    return <p>-</p>;
  } else
    return (
      <>
        <p className="operativeCost">
          {renderNumber(profit)}$
          <span
            className={`derivativeProfitDiff ${
              profit > 0 ? "positive" : "negative"
            }`}
          >
            {profit > 0 ? "+" : "-"}
            {renderNumber(Math.abs((profit / operationalCost) * 100))}%
          </span>
        </p>
        <p>Margen Operativo</p>
      </>
    );
};

type VentasCardProps = {
  rendimientos: Mezcla["rendimientos"];
  operationalCost: number;
  oilCost: number;
  totalBbl: number;
  totalTractomula: number;
  maquila: number;
};

type Derivative = {
  id: string;
  price: number;
  tractomula: number;
  bunker: number;
  nombre: string;
  cantidad: number;
};

function VentasCard({
  rendimientos,
  operationalCost,
  totalBbl,
  totalTractomula,
  maquila,
  oilCost,
}: VentasCardProps) {
  // const operationalMargin =
  const [derivative, setDerivative] = useState<Derivative[]>(
    rendimientos.map((r) => ({
      nombre: r.nombre,
      bunker: 0,
      id: r.id,
      price: operationalCost,
      tractomula: 0,
      cantidad: (r.value * totalBbl) / 100,
    }))
  );

  // A continuacion una serie de parches pirata
  const getRendimiento = (d: Derivative) => {
    return rendimientos.find((r) => r.id === d.id)?.value ?? 25;
  };

  // Parche pirata a las dos de la mañana porque hay un bug oculto que no me rellena el arreglo de derivados en el use state
  useEffect(() => {
    if (derivative.length === 0)
      setDerivative(
        rendimientos.map((r) => {
          return {
            id: r.id,
            nombre: r.nombre,
            price: operationalCost,
            tractomula: 0,
            bunker: 0,
            cantidad: (r.value * totalBbl) / 100,
          };
        })
      );
  }, [rendimientos]);

  const barData = [
    derivative.reduce<Record<string, number>>(
      (prev, curr) => {
        prev[curr.nombre] =
          (getRendimiento(curr) * totalBbl * curr.price) / 100;
        // console.log(totalBbl, operationalCost, curr.cantidad, curr.rendimiento, curr.price, curr.rendimiento * totalBbl / 100)
        return prev;
      },
      {
        tractomula:
          derivative.reduce(
            (prev, curr) => prev + curr.tractomula * curr.cantidad,
            0
          ) + totalTractomula,
        bunker: derivative.reduce(
          (prev, curr) => prev + curr.bunker * curr.cantidad,
          0
        ),
        materiaPrima: totalBbl * oilCost,
        maquila: totalBbl * maquila,
      }
    ),
  ];

  return (
    <Card
      className="ventasCard probando"
      title={() => (
        <h2 className="mb-0 p-0 -mb-3">
          {" "}
          <span
            className="pi pi-dollar"
            style={{ fontSize: "2rem", marginRight: "0.5rem" }}
          ></span>
          Ventas
        </h2>
      )}
    >
      <h3 className="my-1">Derivados</h3>
      <div className="derivativesSection">
        {derivative.map((d, i) => (
          <article key={d.id}>
            <h3>{d.nombre}</h3>
            <div className="inputGroup">
              <label htmlFor="naftaPrice">Precio</label>
              <InputNumber
                showButtons
                incrementButtonClassName="primeReactInputNumberButtons"
                decrementButtonClassName="primeReactInputNumberButtons"
                value={d.price}
                onChange={(e) => {
                  setDerivative((prev) =>
                    prev.map((p) =>
                      p.id === d.id ? { ...p, price: e.value ?? 0 } : p
                    )
                  );
                }}
              />
            </div>
            <div className="inputGroup">
              <label htmlFor="naftaPrice">Tractomula</label>
              <InputNumber
                showButtons
                incrementButtonClassName="primeReactInputNumberButtons"
                decrementButtonClassName="primeReactInputNumberButtons"
                value={d.tractomula}
                onChange={(e) => {
                  setDerivative((prev) =>
                    prev.map((p) =>
                      p.id === d.id ? { ...p, tractomula: e.value ?? 0 } : p
                    )
                  );
                }}
              />
            </div>
            <div className="inputGroup">
              <label htmlFor="naftaPrice">Bunker</label>
              <InputNumber
                showButtons
                incrementButtonClassName="primeReactInputNumberButtons"
                decrementButtonClassName="primeReactInputNumberButtons"
                value={d.bunker}
                onChange={(e) => {
                  setDerivative((prev) =>
                    prev.map((p) =>
                      p.id === d.id ? { ...p, bunker: e.value ?? 0 } : p
                    )
                  );
                }}
              />
            </div>
            <DerivadoPrice
              tractomula={d.tractomula}
              bunker={d.bunker}
              price={d.price}
              oilCost={operationalCost}
              barrels={Math.floor((getRendimiento(d) * totalBbl) / 100)}
            />
          </article>
        ))}
      </div>

      <OperationalMargin
        profit={derivative.reduce((prev, curr) => {
          return (
            prev +
            ((curr.price - curr.tractomula - curr.bunker) *
              getRendimiento(curr) *
              totalBbl) /
              100
          );
        }, -operationalCost * totalBbl)}
        operationalCost={operationalCost * totalBbl}
      />

      {derivative.length > 0 && (
        <div className="graphContainer">
          <BarChart
            // style={{width: "100%"}}
            width={500}
            height={300}
            data={barData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="materiaPrima" stackId="a" fill="#2196f3" />
            <Bar dataKey="tractomula" stackId="a" fill="#a2cf6e" />
            <Bar dataKey="maquila" stackId="a" fill="#8561c5" />
            <Bar dataKey="bunker" stackId="a" fill="#82ca9d" />
            {derivative.map((d, i) => (
              <Bar
                dataKey={d.nombre}
                stackId="b"
                fill={`rgb(${30 + i * 80},${30 + i * 20},${10 + i * 10})`}
              />
            ))}
          </BarChart>
        </div>
      )}
    </Card>
  );
}

export default Simulador;
