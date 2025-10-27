import { Card } from "primereact/card";
import { Column } from "primereact/column";
import {
  DataTable,
  type DataTableRowEditCompleteEvent,
} from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import "./Simulador.css";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { animated, useSprings } from "@react-spring/web";
import ReactSpeedometer from "react-d3-speedometer";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Steps } from "primereact/steps";
import type { MenuItem } from "primereact/menuitem";

import { getRefinerias } from "@/app/api/refineriaService";
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
  convenio: number;
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

function renderNumber(value: number, truncate?: boolean, point?: boolean) {
  return Number.isNaN(value)
    ? "-"
    : truncate
    ? Math.floor(value)
    : point
    ? Intl.NumberFormat("de-DE").format(value)
    : value.toFixed(2);
}

function ComprasCard() {
  const [refinerias, setRefinerias] = useState<Refineria[]>([]);
  const [selectedRefineria, setSelectedRefineria] = useState<Refineria | null>(
    null
  );
  const { tipoProductos = [], loading: loadingData } = useByRefineryData(
    selectedRefineria?.id || ""
  ) as { tipoProductos: Productos[]; loading: boolean };
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [selectedReferencia, setSelectedReferencia] =
    useState<Referencia | null>(null);

  const [maquila, setMaquila] = useState(3.5);
  const [tractomula, setTractomula] = useState(7);

  const [products, setProducts] = useState<Productos[]>([]);
  const defaultProduct: Mezcla = products?.map<Mezcla>((p) => ({
    id: p.id,
    nombre: p.nombre,
    cantidad: 100,
    precio: selectedReferencia ? selectedReferencia.price + p.convenio : 0,
    rendimientos: p.rendimientos.map((r) => ({
      id: r.idProducto.id,
      nombre: r.idProducto.nombre,
      value: r.porcentaje,
    })),
    transporte: 0,
  }))[0];

  const [mezcla, setMezcla] = useState<Mezcla[]>([]);

  const totalBbl = mezcla.reduce((prev, curr) => prev + curr?.cantidad, 0);
  const precioMezcla =
    mezcla.reduce(
      (prev, curr) =>
        prev + curr.cantidad * curr.precio + tractomula * curr.cantidad,
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
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const product = products.find((p) => p.nombre === newData.nombre)!;
    mezclaClone[index] = {
      ...newData,
      id: product.id,
      precio: selectedReferencia
        ? selectedReferencia.price + product.convenio
        : 0,
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
        <Button
          severity="success"
          icon="pi pi-plus"
          label="Añadir crudo"
          onClick={() => setMezcla([...mezcla, defaultProduct])}
          disabled={selectedRefineria === null || loadingData}
        />
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
      } ${renderNumber(Math.abs(diff), false, true)}`}</span>
    );
  };
  useEffect(() => {
    if (Array.isArray(tipoProductos)) {
      setProducts(tipoProductos);
    } else {
      console.error("tipoProductos is not an array:", tipoProductos);
    }
  }, [selectedRefineria, tipoProductos]);
  // Un effect todo pirata para hacer el llamado a la api, recomendado utilizar react query o similar
  useEffect(() => {
    // fetch(
    //   "https://api-maroil-refinery-2500582bacd8.herokuapp.com/api/tipoProducto"
    // )
    //   .then<{ tipoProductos: Productos[] }>((res) => res.json())
    //   .then((body) => setProducts(body.tipoProductos));

    // fetch(
    //   "https://api-maroil-refinery-2500582bacd8.herokuapp.com/api/refinerias"
    // )
    //   .then<{ refinerias: Refineria[] }>((res) => res.json())
    //   .then((body) => setRefinerias(body.refinerias));

    fetch("https://oil.sygem.net/brent")
      .then<{ price: string }>((res) => res.json())
      .then((body) =>
        setReferencias([
          {
            name: "Brent",
            price: Number.parseFloat(Number.parseFloat(body.price).toFixed(2)),
          },
        ])
      );
  }, []);
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
          <h2>
            <span
              className="pi pi-wallet"
              style={{ fontSize: "2rem", marginRight: ".5rem" }}
            />
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
              onChange={(e) => {
                setSelectedRefineria(e.value);
                setMaquila(3.5);
              }}
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
                setSelectedReferencia(e.value);
              }}
              options={referencias}
              itemTemplate={(referencia: Referencia) => (
                <span>{`${referencia.name} ($${referencia.price})`}</span>
              )}
              valueTemplate={(referencia: Referencia) =>
                !referencia ? (
                  "--- Seleccione ---"
                ) : (
                  <span>{`${referencia?.name} ($${renderNumber(
                    referencia?.price,
                    false,
                    true
                  )})`}</span>
                )
              }
              placeholder="--- Seleccione ---"
            />
          </div>
        </div>

        <DataTable
          header={header}
          value={mezcla}
          editMode="row"
          onRowEditComplete={onRowEditComplete}
          rowClassName={() => "animated-row"}
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
                  opt.editorCallback?.(e.value);
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
                  options.editorCallback?.(
                    typeof e === "number" ? e : e(options.value)
                  )
                }
                step={100}
              />
            )}
            footer={totalBbl}
          />
          <Column header="Fórmula" body={(col) => formulaColumn(col)} />
          <Column
            header="Precio"
            body={(col: Mezcla) => `${renderNumber(col.precio, false, true)}$`}
          />
          <Column
            rowEditor={true}
            headerStyle={{}}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            body={(_, column) => (
              <Button
                icon="pi pi-times"
                text
                severity="danger"
                onClick={() =>
                  setMezcla((prev) =>
                    prev.filter((_, idx) => idx !== column.rowIndex)
                  )
                }
              />
            )}
          />
        </DataTable>

        <h3>Dieta crudo</h3>
        <DietaBar mezcla={mezcla} total={totalBbl} />

        <h3>Rendimiento</h3>
        <RendimientoBar rendimientos={rendimientosParche} />

        <p className="operativeCost">
          {renderNumber(precioMezcla, false, true)}
          {dollarPerBarrelUnit}
        </p>
        <p>Costo operativo</p>
      </Card>
      <VentasCard
        tractomula={tractomula}
        maquila={maquila}
        operationalCost={mezcla.reduce(
          (prev, curr) =>
            prev + (curr.cantidad * (curr.precio + tractomula)) / totalBbl,
          maquila
        )}
        rendimientos={rendimientosParche}
        oilCost={mezcla.reduce(
          (prev, curr) => prev + (curr.cantidad * curr.precio) / totalBbl,
          0
        )}
        totalBbl={totalBbl}
        totalTractomula={mezcla.reduce(
          (prev, curr) => prev + tractomula * curr.cantidad,
          0
        )}
      />
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
  }, [rendimientos, api]);

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
    api.start((index) => ({
      to: {
        width: `${(mezcla[index].cantidad / total) * 100}%`,
      },
    }));
  }, [mezcla, total, api]);

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
  operativeCost: number;
  barrels: number;
};

function DerivadoPrice({ price, operativeCost, barrels }: DerivadoPriceProps) {
  const profit = price - operativeCost;
  return (
    <>
      <p className="derivativeProfit">
        {renderNumber(price, false, true)}
        {dollarPerBarrelUnit}
        <span
          className={`derivativeProfitDiff ${
            profit > 0 ? "positive" : "negative"
          }`}
        >
          {profit > 0 ? "+" : "-"}
          {renderNumber(Math.abs(profit), false, true)}
        </span>
      </p>
      <p>
        {barrels}
        {barrelUnit}
      </p>
    </>
  );
}

type VentasCardProps = {
  rendimientos: Mezcla["rendimientos"];
  operationalCost: number;
  oilCost: number;
  totalBbl: number;
  totalTractomula: number;
  tractomula: number;
  maquila: number;
};

type Derivative = {
  id: string;
  price: number;
  nombre: string;
  cantidad: number;
  sellSteps: number;
  selectedStepIndex: number;
};

function VentasCard({
  rendimientos,
  operationalCost,
  totalBbl,
  totalTractomula,
  tractomula,
  maquila,
  oilCost,
}: VentasCardProps) {
  const [derivativePrices, setDerivativePrices] = useState<Referencia[]>([]);
  const [derivative, setDerivative] = useState<Derivative[]>(
    rendimientos.map((r) => ({
      nombre: r.nombre,
      bunker: 0,
      id: r.id,
      price: operationalCost,
      tractomula: 0,
      cantidad: (r.value * totalBbl) / 100,
      // TODO: traer esto de la api
      sellSteps:
        r.nombre.toLowerCase().includes("fo4") ||
        r.nombre.toLowerCase().includes("fo6")
          ? 3
          : 2,
      selectedStepIndex: 0,
    }))
  );
  // A continuacion una serie de parches pirata
  const getRendimiento = (d: Derivative) => {
    return rendimientos.find((r) => r.id === d.id)?.value ?? 25;
  };

  const sellSteps: MenuItem[] = [
    {
      label: "Planta",
      data: {
        price: 0,
        total: 0,
      },
    },
    {
      label: "Destino",
      data: {
        price: 6.2,
        total: derivative
          .filter((d) => d.selectedStepIndex >= 1)
          .reduce(
            (prev, curr) =>
              prev + (getRendimiento(curr) / 100) * totalBbl * 6.2,
            0
          ),
      },
    },
    {
      label: "Bunker",
      data: {
        price: 3,
        total: derivative
          .filter((d) => d.selectedStepIndex >= 2)
          .reduce(
            (prev, curr) => prev + (getRendimiento(curr) / 100) * totalBbl * 3,
            0
          ),
      },
    },
  ];

  const sellCosts = sellSteps.reduce((prev, curr) => prev + curr.data.total, 0);

  const profit = derivative.reduce((prev, curr) => {
    return prev + (curr.price * getRendimiento(curr) * totalBbl) / 100;
  }, -operationalCost * totalBbl - sellCosts);

  // Parche pirata a las dos de la mañana porque hay un bug oculto que no me rellena el arreglo de derivados en el use state
  useEffect(() => {
    // if (derivative.length === 0)
    setDerivative(
      rendimientos.map((r) => {
        return {
          id: r.id,
          nombre: r.nombre,
          price:
            derivativePrices.find((d) =>
              r.nombre.toLowerCase().includes(d.name)
            )?.price ?? operationalCost,
          tractomula: 0,
          bunker: 0,
          cantidad: (r.value * totalBbl) / 100,
          // TODO: traer esto de la api
          sellSteps:
            r.nombre.toLowerCase().includes("fo4") ||
            r.nombre.toLowerCase().includes("fo6")
              ? 3
              : 2,
          selectedStepIndex: 0,
        };
      })
    );
  }, [rendimientos, operationalCost, totalBbl, derivativePrices]);

  useEffect(() => {
    fetch("https://oil.sygem.net/oil-derivatives")
      .then<Record<string, string>>((res) => res.json())
      .then((body) =>
        setDerivativePrices(
          Object.entries(body).map(([key, value]) => ({
            name: key,
            price: Number.parseFloat(value),
          }))
        )
      );
  }, []);

  return (
    <Card
      className="ventasCard"
      title={() => (
        <h2>
          <span
            className="pi pi-dollar"
            style={{ fontSize: "2rem", marginRight: "0.5rem" }}
          />
          Ventas
        </h2>
      )}
    >
      <h3 className="derivadosTitle">Costo Productos Refinados</h3>
      <div className="derivativesSection">
        {derivative.map((d) => (
          <article key={d.id}>
            <h3>{d.nombre}</h3>

            <ReactSpeedometer
              value={
                (d.price -
                  operationalCost -
                  sellSteps
                    .slice(0, d.selectedStepIndex + 1)
                    .reduce((prev, curr) => prev + curr.data.price, 0)) /
                operationalCost
              }
              minValue={-0.3}
              maxValue={0.3}
              segments={4}
              width={220}
              height={160}
              valueFormat="+.0%"
              valueTextFontSize="20px"
            />
            <DerivadoPrice
              price={d.price}
              operativeCost={
                operationalCost +
                sellSteps
                  .slice(0, d.selectedStepIndex + 1)
                  .reduce((prev, curr) => prev + curr.data.price, 0)
              }
              barrels={Math.floor((getRendimiento(d) * totalBbl) / 100)}
            />
            <Steps
              model={sellSteps.slice(0, d.sellSteps)}
              readOnly={false}
              className="stepper"
              activeIndex={d.selectedStepIndex}
              onSelect={(e) =>
                setDerivative((prev) =>
                  prev.map((p) =>
                    p.id === d.id
                      ? {
                          ...p,
                          selectedStepIndex: e.index,
                          price:
                            (derivativePrices.find((d) =>
                              p.nombre.toLowerCase().includes(d.name)
                            )?.price || 0) +
                            sellSteps
                              .slice(0, e.index + 1)
                              .reduce(
                                (prev, curr) => prev + curr.data.price,
                                0
                              ),
                        }
                      : p
                  )
                )
              }
            />
          </article>
        ))}
      </div>

      <div className="divider" />

      <div className="ventasDetail">
        <div>
          <h3>Costos Operativos</h3>
          <div className="ventasDetailContainer">
            <p>
              Crudo:{" "}
              <span>{renderNumber(oilCost * totalBbl, false, true)}$</span>
            </p>
            <p>
              Tractomula:{" "}
              <span>
                {renderNumber(totalTractomula, false, true)}$ (
                {renderNumber(tractomula, false, true)}
                {dollarPerBarrelUnit})
              </span>
            </p>
            <p>
              Maquila:{" "}
              <span>
                {renderNumber(maquila * totalBbl, false, true)}$ (
                {renderNumber(maquila, false, true)}
                {dollarPerBarrelUnit})
              </span>
            </p>
            <ResponsiveContainer width="100%" height="100%" minHeight="100px">
              <BarChart
                layout="vertical"
                width={150}
                height={80}
                data={[
                  {
                    name: "Crudo",
                    uv: oilCost * totalBbl,
                  },
                  {
                    name: "Tractomula",
                    uv: totalTractomula,
                  },
                  {
                    name: "Maquila",
                    uv: maquila * totalBbl,
                  },
                ]}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  width={90}
                  // padding={{ left: 20 }}
                  dataKey="name"
                />
                <Bar dataKey="uv" fill="#1a2874" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3>Costos de venta</h3>
          <div className="ventasDetailContainer">
            <p>
              Tractomula:
              <span>
                ${renderNumber(sellSteps[1].data.total)} (
                {renderNumber(sellSteps[1].data.price)}
                {dollarPerBarrelUnit})
              </span>
            </p>
            <p>
              Bunker:
              <span>
                ${renderNumber(sellSteps[2].data.total)} (
                {renderNumber(sellSteps[2].data.price)}
                {dollarPerBarrelUnit})
              </span>
            </p>
            <ResponsiveContainer width="100%" height="100%" minHeight="100px">
              <BarChart
                layout="vertical"
                width={150}
                height={80}
                data={[
                  {
                    name: "Tractomula",
                    uv: sellSteps[1].data.total,
                  },
                  {
                    name: "Bunker",
                    uv: sellSteps[2].data.total,
                  },
                ]}
              >
                <XAxis type="number" hide />
                <YAxis type="category" width={90} dataKey="name" />
                <Bar dataKey="uv" fill="#1a2874" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3>Saldos</h3>
          <div className="ventasDetailContainer">
            {derivative.map((d) => (
              <p key={d.id}>
                {d.nombre}:{" "}
                <span>
                  {renderNumber(
                    (d.price * totalBbl * getRendimiento(d)) / 100,
                    false,
                    true
                  )}
                  $
                </span>
              </p>
            ))}
            <ResponsiveContainer width="100%" height="100%" minHeight="100px">
              <BarChart
                layout="vertical"
                width={150}
                height={80}
                data={derivative.map((d) => ({
                  name: d.nombre.split(" ")[0],
                  uv: (d.price * getRendimiento(d) * totalBbl) / 100,
                }))}
              >
                <XAxis type="number" hide />
                <YAxis type="category" width={50} dataKey="name" />
                <Bar dataKey="uv" fill="#1a2874" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 className="derivadosTitle">Resumen Final</h3>

      <div className="summary">
        <div>
          <h3>Gastos totales</h3>
          <p>
            ${renderNumber(operationalCost * totalBbl + sellCosts, false, true)}
          </p>
        </div>
        <div>
          <h3>Ingresos Totales</h3>
          <p>
            $
            {renderNumber(
              derivative.reduce(
                (prev, curr) =>
                  prev + (curr.price * getRendimiento(curr) * totalBbl) / 100,
                0
              ),
              false,
              true
            )}
          </p>
        </div>
        <div>
          <h3>Margen Operativo</h3>
          <p>
            ${renderNumber(profit, false, true)}
            <span
              className={`derivativeProfitDiff ${
                profit > 0 ? "positive" : "negative"
              }`}
            >
              {}
              {renderNumber(
                Math.floor((profit / (operationalCost * totalBbl)) * 100),
                false,
                true
              )}
              %
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}

export default Simulador;
