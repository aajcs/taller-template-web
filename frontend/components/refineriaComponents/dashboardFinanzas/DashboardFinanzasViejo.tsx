import { useState, useEffect, useMemo } from "react";
import "./DashboardFinanzasViejo.css";
import { Chart } from "primereact/chart";
import type { ChartData, Plugin } from "chart.js";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import NumberFlow from "@number-flow/react";
import { getDespachos } from "@/app/api/despachoService";
import { getRecepcions } from "@/app/api/recepcionService";
import { getTanques } from "@/app/api/tanqueService";
import { getContratos } from "@/app/api/contratoService";

// Función de agrupación manual
const groupBy = <T,>(
  array: T[],
  callback: (item: T) => string
): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const key = callback(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

type GastosOperativos = {
  partida: string;
  subpartida?: string;
  monto: number;
};

type Despacho = {
  id: string;
  fecha: string;
  // contacto: string;
  producto: string;
  cantidad: number;
  valorUnitario: number;
};

type DespachoResponse = {
  fechaLlegada: string;
  id: string;
  idContratoItems: {
    producto: {
      id: string;
      nombre: string;
    };
    precioUnitario: number;
  };
  idItems: {
    producto: {
      id: string;
      nombre: string;
    };
    precioUnitario: number;
    montoTransporte: number;
  }[];
  cantidadEnviada: number;
};

type ContratoResponse = {
  id: string;
  tipoContrato: "Compra" | "Venta";
  idRefineria: {
    id: string;
    nombre: string;
  };
  montoTotal: number;
  fechaInicio: string;
  fechaFin: string;
  abono: {
    monto: number;
    fecha: string;
    _id: string;
  }[];
};

type Recepciones = {
  id: string;
  fechaLlegada: string;
  contacto: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
};

type RecepcionesResponse = {
  id: string;
  idContratoItems: {
    producto: {
      id: string;
      nombre: string;
    };
    precioUnitario: number;
  };
  idItems: {
    producto: {
      id: string;
      nombre: string;
    };
    precioUnitario: number;
    montoTransporte: number;
  }[];
  cantidadEnviada: number;
  fechaFinRecepcion: string;
};

type FacturaResponse = {
  idPartida: {
    id: string;
    descripcion: string;
  };
  idSubPartida?: {
    id: string;
  };
  concepto: string;
  fechaFactura: string;
  total: number;
};
export type Tanque = {
  _id: string;
  nombre: string;
  ubicacion?: string;
  capacidad: number;
  material?: string[];
  almacenamientoMateriaPrimaria: boolean;
  almacenamiento: number;
  estado: string;
  eliminado: boolean;
  idRefineria: IDRefineria;
  createdAt: Date;
  updatedAt: Date;
  idProducto?: IDProducto | null;
  idChequeoCantidad?: IDChequeoCantidad | null;
  idChequeoCalidad?: IDChequeoCalidad | null;
  cortesRefinacion: string[];
  id: string;
};

export type IDChequeoCalidad = {
  aplicar: Aplicar;
  _id: string;
  idRefineria: ID;
  idProducto: string;
  fechaChequeo: Date;
  gravedadAPI: number;
  azufre: number;
  contenidoAgua: number;
  puntoDeInflamacion: number;
  cetano: number;
  idOperador: string;
  estado: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  numeroChequeoCalidad: number;
  id: string;
};

export type Aplicar = {
  tipo: string;
  idReferencia: string;
};

export enum ID {
  The679D76Faeaf50E0015087940 = "679d76faeaf50e0015087940",
  The679D7792Eaf50E0015087941 = "679d7792eaf50e0015087941",
  The679D7812Eaf50E0015087942 = "679d7812eaf50e0015087942",
  The67F994D00Adbd27F0F5E387E = "67f994d00adbd27f0f5e387e",
}

export type IDChequeoCantidad = {
  aplicar: Aplicar;
  idRefineria: ID;
  idProducto: string;
  idOperador: string;
  fechaChequeo: Date;
  cantidad: number;
  estado: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  numeroChequeoCantidad: number;
  id: string;
};

export type IDProducto = {
  _id: string;
  nombre: string;
  posicion: number;
  color: string;
  id: string;
};

export type IDRefineria = {
  _id: ID;
  nombre: Nombre;
  id: ID;
};

export enum Nombre {
  MarineNRGSAS = "Marine NRG S.A.S.",
  OctanoIndustrialSAS = "Octano Industrial S.A.S.",
  PruebasDelSistema = "Pruebas del sistema",
  RefisamagSAS = "Refisamag S.A.S",
}

function DashboardFinanzasViejo() {
  const [ingresosEgresosChartData, setIngresosEgresosChartData] =
    useState<ChartData>();
  const [compras, setCompras] = useState(0);
  const [ventas, setVentas] = useState(0);
  const [pagar, setPagar] = useState(0);
  const [cobrar, setCobrar] = useState(0);
  const [totalDespachos, setTotalDespachos] = useState(0);
  const [totalRecepciones, setTotalRecepciones] = useState(0);
  const [gastosOperativos, setGastosOperativos] = useState<GastosOperativos[]>(
    []
  );

  const [recepcionesVolumetria, setRecepcionesVolumetria] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const [recepcionDinero, setRecepcionDinero] = useState([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const [despachoVolumetria, setDespachosVolumetria] = useState<
    Record<string, number[]>
  >({});
  const [despachoDinero, setDespachoDinero] = useState<
    Record<string, number[]>
  >({});

  const [inventarios, setInventarios] = useState<
    Record<string, { name: string; quantity: number }>
  >({});
  const [inventarioVolumetriaOption, setInventarioVolumetriaOption] =
    useState(0);
  const [comprasVolumetriaOption, setComprasVolumetriaOptions] = useState(0);
  const [ventasVolumetriaOption, setVentasVolumetriaOption] = useState(0);

  const doughnutLabel: Plugin<"doughnut"> = {
    id: "doughnutLabel",
    afterDatasetsDraw(chart, args, plugins) {
      const { ctx, data } = chart;

      if (!chart.getDatasetMeta(0).data[0]) {
        return;
      }

      const centerX = chart.getDatasetMeta(0).data[0].x;
      const centerY = chart.getDatasetMeta(0).data[0].y;

      ctx.save();
      ctx.font = "bold 1.5rem sans-serif";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "USD",
        }).format(
          gastosOperativos.reduce((prev, curr) => prev + curr.monto, 0)
        ),
        centerX,
        centerY
      );
    },
  };

  useEffect(() => {
    async () => {
      const res = await getDespachos();
      const body = res.data as { despachos: DespachoResponse[] };
      const group = groupBy(
        body.despachos,
        (d) => d.idContratoItems.producto.nombre
      );

      setTotalDespachos(body.despachos.length);

      setDespachosVolumetria(
        Object.entries(group).reduce(
          (prev, [productId, despachoGroup]) => {
            const monthGroups = groupBy(despachoGroup, (v) =>
              new Date(v.fechaLlegada).getMonth().toString()
            );

            for (const [month, d] of Object.entries(monthGroups)) {
              prev[productId][+month] = d.reduce(
                (prev, curr) => prev + curr.cantidadEnviada,
                0
              );
            }

            return prev;
          },
          Object.keys(group).reduce<Record<string, number[]>>((prev, id) => {
            prev[id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            return prev;
          }, {})
        )
      );

      setDespachoDinero(
        Object.entries(group).reduce<typeof despachoVolumetria>(
          (prev, [productId, despachoGroup]) => {
            const monthGroups = groupBy(despachoGroup, (v) =>
              new Date(v.fechaLlegada).getMonth().toString()
            );

            for (const [month, d] of Object.entries(monthGroups)) {
              prev[productId][+month] = d.reduce(
                (prev, curr) =>
                  prev +
                  curr.cantidadEnviada * curr.idContratoItems.precioUnitario,
                0
              );
            }

            return prev;
          },
          Object.keys(group).reduce<Record<string, number[]>>((prev, id) => {
            prev[id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            return prev;
          }, {})
        )
      );
    };

    (async () => {
      const res = await getRecepcions();
      const body = res as { recepcions: RecepcionesResponse[] };
      setTotalRecepciones(body.recepcions.length);

      const receptionMonthGroups = groupBy(body.recepcions, (d) =>
        new Date(d.fechaFinRecepcion).getMonth().toString()
      );

      setRecepcionesVolumetria(
        Object.entries(receptionMonthGroups).reduce(
          (prev, [month, curr]) => {
            prev[+month] = curr.reduce(
              (sum, item) => sum + item.cantidadEnviada,
              0
            );
            return prev;
          },
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
      );

      setRecepcionDinero(
        Object.entries(receptionMonthGroups).reduce(
          (prev, [month, curr]) => {
            prev[+month] = curr.reduce(
              (sum, item) =>
                sum +
                item.cantidadEnviada * item.idContratoItems.precioUnitario,
              0
            );
            return prev;
          },
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
      );
    })();

    fetch("https://api-maroil-refinery-2500582bacd8.herokuapp.com/api/factura")
      .then<{ facturas: FacturaResponse[] }>((res) => res.json())
      .then((body) => {
        const groupedFacturas = groupBy(
          body.facturas,
          (f) => f.idPartida.id ?? "-"
        );

        setGastosOperativos(
          Object.values(groupedFacturas).map((f) => ({
            monto: f.reduce((prev, curr) => prev + curr.total, 0),
            partida: f[0]?.idPartida.descripcion ?? "Sin partida",
            subpartida: f[0]?.idSubPartida?.id ?? "-",
          }))
        );
      });
    (async () => {
      const res = await getTanques();
      const body = res as { tanques: Tanque[] };
      const filteredTanques = body.tanques.filter(
        (t) => t.idRefineria.nombre === Nombre.OctanoIndustrialSAS
      );

      const groupedTanques = groupBy(
        filteredTanques,
        (t) => t.idProducto?.id ?? "-"
      );

      setInventarios(
        Object.entries(groupedTanques).reduce<
          Record<string, { name: string; quantity: number }>
        >((prev, [id, group]) => {
          prev[id] = {
            name: group[0].idProducto?.nombre ?? "",
            quantity: group.reduce(
              (sum, curr) => sum + (curr.idChequeoCantidad?.cantidad ?? 0),
              0
            ),
          };
          return prev;
        }, {})
      );
    })();

    (async () => {
      const res = await getContratos();
      const body = res as { contratos: ContratoResponse[] };

      const comprasTotal = body.contratos
        .filter((c) => c.tipoContrato === "Compra")
        .reduce((prev, curr) => prev + curr.montoTotal, 0);

      const ventasTotal = body.contratos
        .filter((c) => c.tipoContrato === "Venta")
        .reduce((prev, curr) => prev + curr.montoTotal, 0);

      setCompras(comprasTotal);
      setVentas(ventasTotal);

      setPagar(
        body.contratos
          .filter((c) => c.tipoContrato === "Compra")
          .reduce(
            (prev, curr) =>
              prev + curr.abono.reduce((prev, curr) => prev + curr.monto, 0),
            -comprasTotal
          ) * -1
      );

      setCobrar(
        body.contratos
          .filter((c) => c.tipoContrato === "Venta")
          .reduce(
            (prev, curr) =>
              prev + curr.abono.reduce((prev, curr) => prev + curr.monto, 0),
            -ventasTotal
          ) * -1
      );

      const comprasPorMes = Object.entries(
        groupBy(
          body.contratos.filter((c) => c.tipoContrato === "Compra"),
          (c) => new Date(c.fechaInicio).getMonth().toString()
        )
      ).reduce(
        (prev, [month, value]) => {
          const total = value.reduce((sum, curr) => sum + curr.montoTotal, 0);
          prev[+month] = total;
          return prev;
        },
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      );

      const ventasPorMes = Object.entries(
        groupBy(
          body.contratos.filter((c) => c.tipoContrato === "Venta"),
          (c) => new Date(c.fechaInicio).getMonth().toString()
        )
      ).reduce(
        (prev, [month, value]) => {
          const total = value.reduce((sum, curr) => sum + curr.montoTotal, 0);
          prev[+month] = total;
          return prev;
        },
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      );

      setIngresosEgresosChartData({
        labels: [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Novimebre",
          "Dicimebre",
        ],
        datasets: [
          {
            label: "Compras",
            data: comprasPorMes,
            backgroundColor: ["#1a2874"],
            borderColor: ["#1a2874"],
            borderWidth: 1,
            borderRadius: 8,
          },
          {
            label: "Ventas",
            data: ventasPorMes,
            backgroundColor: ["rgb(0, 195, 191)"],
            borderColor: ["rgb(75, 192, 192)"],
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      });
    })();
  }, []);

  return (
    <main>
      <h1>Finanzas</h1>
      <div className="statsContainer">
        <div className="stats">
          <article className="card">
            <h2>Compras</h2>
            <NumberFlow
              className="number"
              value={compras}
              format={{ currency: "USD", style: "currency" }}
            />
            {/* <div className="profit">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330">
								<path d="M329.986 14.723a15.13 15.13 0 0 0-.04-.797 16.288 16.288 0 0 0-.061-.707c-.029-.239-.069-.476-.109-.713-.043-.252-.083-.504-.138-.752-.049-.22-.11-.436-.168-.654-.068-.253-.134-.507-.215-.754-.071-.218-.155-.432-.236-.647-.09-.236-.176-.473-.277-.703-.098-.225-.21-.444-.32-.665-.105-.211-.207-.424-.322-.629-.124-.223-.262-.438-.398-.656-.123-.196-.244-.393-.375-.583-.142-.204-.295-.4-.448-.598-.15-.196-.3-.391-.46-.578-.15-.176-.309-.345-.468-.515a16.402 16.402 0 0 0-.568-.582c-.066-.063-.123-.133-.19-.195-.098-.091-.204-.167-.304-.254a16.487 16.487 0 0 0-.628-.526A14.871 14.871 0 0 0 315.396.02C315.261.017 315.133 0 315 0h-60c-8.284 0-15 6.716-15 15s6.716 15 15 15h25.669l-91.084 98.371-38.978-38.978c-2.882-2.883-6.804-4.448-10.891-4.391a15.005 15.005 0 0 0-10.717 4.801l-125 134.868c-5.631 6.076-5.271 15.566.805 21.198a14.945 14.945 0 0 0 10.193 3.999c4.03 0 8.049-1.615 11.005-4.803l114.409-123.441 38.983 38.983c2.884 2.884 6.847 4.483 10.895 4.391a14.998 14.998 0 0 0 10.718-4.806L300 53.278V75c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15V15c0-.094-.012-.184-.014-.277zM315 300H15c-8.284 0-15 6.716-15 15 0 8.284 6.716 15 15 15h300c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15z" />
							</svg>
							<p>+14%</p>
						</div> */}
          </article>
          <article className="card">
            <h2>Ventas</h2>
            <NumberFlow
              className="number"
              value={ventas}
              format={{ currency: "USD", style: "currency" }}
            />
          </article>
          <article className="card">
            <h2>Recepciones</h2>
            <NumberFlow className="number" value={totalRecepciones} />
          </article>
          <article className="card">
            <h2>Despachos</h2>
            <NumberFlow className="number" value={totalDespachos} />
          </article>
          <article className="card">
            <h2>Por pagar</h2>
            <NumberFlow
              className="number"
              value={pagar}
              format={{ currency: "USD", style: "currency" }}
            />
          </article>
          <article className="card">
            <h2>Por cobrar</h2>
            <NumberFlow
              className="number"
              value={cobrar}
              format={{ currency: "USD", style: "currency" }}
            />
          </article>
        </div>
        <div className="card">
          <h2>Ingresos y Egresos</h2>
          <Chart
            type="bar"
            data={ingresosEgresosChartData}
            options={{
              responsive: true,
              scales: {
                x: {
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="x">
        <div className="card">
          <h2>Inventario</h2>
          {inventarioVolumetriaOption === 1 && (
            <p className="note">
              Nota: El valor reflejado en la gráfica es meramente referencial,
              el cual es calculado utilizando como referencia los precios del
              mercado
            </p>
          )}
          <div className="volumetriaCardContainer">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <section
              className={`volumetriaCard ${
                inventarioVolumetriaOption === 0 && "active"
              }`}
              onClick={(_) => setInventarioVolumetriaOption(0)}
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M18 19h1v2H5v-2h1v-6H5v-2h1V5H5V3h14v2h-1v6h1v2h-1v6m-9-6a3 3 0 0 0 3 3 3 3 0 0 0 3-3c0-2-3-5.37-3-5.37S9 11 9 13Z" />
              </svg>
              <h4>Volumen</h4>
              <NumberFlow
                className="volumetriaValue"
                value={Object.values(inventarios).reduce(
                  (prev, curr) => prev + curr.quantity,
                  0
                )}
                suffix=" BBL"
              />
            </section>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <section
              className={`volumetriaCard ${
                inventarioVolumetriaOption === 1 && "active"
              }`}
              onClick={(_) => setInventarioVolumetriaOption(1)}
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="#000"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 8.5v-.146A3.354 3.354 0 0 0 14.646 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H9.427A3.427 3.427 0 0 1 6 15.573V15.5M12 3v18"
                />
              </svg>
              <h4>Valor</h4>
              <NumberFlow
                className="volumetriaValue"
                locales="de-DE"
                // TODO: obtener el valor de lo que hay en los tanques
                value={0}
                // value={recepcionDinero.reduce((prev, curr) => prev + curr, 0)}
                format={{ currency: "USD", style: "currency" }}
              />
            </section>
          </div>
          <Chart
            type="bar"
            data={{
              labels: Object.values(inventarios).map((i) => i.name),
              datasets: [
                {
                  label:
                    inventarioVolumetriaOption === 0
                      ? "Cantidad (BBL)"
                      : "Valor ($)",
                  data: Object.values(inventarios).map((i) => i.quantity),
                  // backgroundColor: "rgb(0, 167, 111)",
                  // borderWidth: 1,
                  borderRadius: 15,
                  backgroundColor: "rgba(255, 171, 0, 0.8)",
                  // backgroundColor: "#1a2874"
                },
              ],
            }}
            options={{
              responsive: true,
              scales: {
                x: {
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </div>
        <article className="operationalContainer">
          <h2>Gastos Operativos</h2>
          <Chart
            className="operationalDoughnut"
            type="doughnut"
            plugins={[doughnutLabel]}
            data={{
              labels: Object.keys(
                groupBy(gastosOperativos, (go) => go.partida)
              ),
              datasets: [
                {
                  label: "Dataset 1",
                  data: gastosOperativos.map((go) => go.monto),
                },
              ],
            }}
            options={{
              responsive: true,
              cutout: "70%",
            }}
          />
          <DataTable value={gastosOperativos}>
            <Column header="Partida" field="partida" />
            <Column header="Subpartida" field="subpartida" />
            <Column
              header="Monto"
              body={(col) =>
                Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "USD",
                }).format(col.monto)
              }
            />
          </DataTable>
        </article>
      </div>

      <article className="volumetria card">
        <h2>Volumetría</h2>
        <section>
          <h3>Compras</h3>
          <div>
            <div className="volumetriaCardContainer">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <section
                className={`volumetriaCard ${
                  comprasVolumetriaOption === 0 && "active"
                }`}
                onClick={(_) => setComprasVolumetriaOptions(0)}
              >
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M18 19h1v2H5v-2h1v-6H5v-2h1V5H5V3h14v2h-1v6h1v2h-1v6m-9-6a3 3 0 0 0 3 3 3 3 0 0 0 3-3c0-2-3-5.37-3-5.37S9 11 9 13Z" />
                </svg>
                <h4>Volumen</h4>
                <NumberFlow
                  className="volumetriaValue"
                  value={recepcionesVolumetria.reduce(
                    (prev, curr) => prev + curr,
                    0
                  )}
                  suffix=" BBL"
                />
              </section>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <section
                className={`volumetriaCard ${
                  comprasVolumetriaOption === 1 && "active"
                }`}
                onClick={(_) => setComprasVolumetriaOptions(1)}
              >
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#000"
                    d="M6.5 19.75c-.19 0-.38-.07-.53-.22l-2.5-2.5a.754.754 0 0 1 0-1.06c.29-.29.77-.29 1.06 0l1.97 1.97 1.97-1.97c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06l-2.5 2.5c-.15.15-.34.22-.53.22Z"
                  />
                  <path
                    fill="#000"
                    d="M6.5 19.75c-.41 0-.75-.34-.75-.75V5c0-.41.34-.75.75-.75s.75.34.75.75v14c0 .41-.34.75-.75.75ZM20 17.25h-8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h8c.41 0 .75.34.75.75s-.34.75-.75.75ZM16 11.25h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75ZM14 8.25h-2c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2c.41 0 .75.34.75.75s-.34.75-.75.75ZM18 14.25h-6c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h6c.41 0 .75.34.75.75s-.34.75-.75.75Z"
                  />
                </svg>
                <h4>Egreso</h4>
                <NumberFlow
                  className="volumetriaValue"
                  locales="de-DE"
                  value={recepcionDinero.reduce((prev, curr) => prev + curr, 0)}
                  format={{ currency: "USD", style: "currency" }}
                />
              </section>
            </div>

            <Chart
              type="line"
              data={{
                labels: [
                  "Enero",
                  "Febrero",
                  "Marzo",
                  "Abril",
                  "Mayo",
                  "Junio",
                  "Julio",
                  "Agosto",
                  "Septiembre",
                  "Octubre",
                  "Noviembre",
                  "Diciembre",
                ],
                datasets: [
                  {
                    label: "Crudo",
                    // data: despachoVolumetria,
                    data:
                      comprasVolumetriaOption === 0
                        ? recepcionesVolumetria
                        : recepcionDinero,
                  },
                ],
              }}
              options={{
                responsive: true,
                scales: {
                  x: {
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                  y: {
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />
          </div>
        </section>
        <section>
          <h3>Ventas</h3>
          <div className="volumetriaCardContainer">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <section
              className={`volumetriaCard ${
                ventasVolumetriaOption === 0 && "active"
              }`}
              onClick={(_) => setVentasVolumetriaOption(0)}
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M18 19h1v2H5v-2h1v-6H5v-2h1V5H5V3h14v2h-1v6h1v2h-1v6m-9-6a3 3 0 0 0 3 3 3 3 0 0 0 3-3c0-2-3-5.37-3-5.37S9 11 9 13Z" />
              </svg>
              <h4>Volumen</h4>
              <NumberFlow
                className="volumetriaValue"
                value={Object.values(despachoVolumetria).reduce(
                  (prev, curr) => prev + curr.reduce((p, c) => p + c, 0),
                  0
                )}
                suffix=" BBL"
              />
            </section>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <section
              className={`volumetriaCard ${
                ventasVolumetriaOption === 1 && "active"
              }`}
              onClick={(_) => setVentasVolumetriaOption(1)}
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                <path d="M277.675 981.521c5.657 0 10.24-4.583 10.24-10.24V499.514c0-5.651-4.588-10.24-10.24-10.24h-81.92c-5.652 0-10.24 4.589-10.24 10.24v471.767c0 5.657 4.583 10.24 10.24 10.24h81.92zm0 40.96h-81.92c-28.278 0-51.2-22.922-51.2-51.2V499.514c0-28.271 22.924-51.2 51.2-51.2h81.92c28.276 0 51.2 22.929 51.2 51.2v471.767c0 28.278-22.922 51.2-51.2 51.2zm275.456-40.96c5.657 0 10.24-4.583 10.24-10.24V408.777c0-5.657-4.583-10.24-10.24-10.24h-81.92a10.238 10.238 0 0 0-10.24 10.24v562.504c0 5.657 4.583 10.24 10.24 10.24h81.92zm0 40.96h-81.92c-28.278 0-51.2-22.922-51.2-51.2V408.777c0-28.278 22.922-51.2 51.2-51.2h81.92c28.278 0 51.2 22.922 51.2 51.2v562.504c0 28.278-22.922 51.2-51.2 51.2zm275.456-40.016c5.657 0 10.24-4.583 10.24-10.24V318.974c0-5.651-4.588-10.24-10.24-10.24h-81.92c-5.652 0-10.24 4.589-10.24 10.24v653.251c0 5.657 4.583 10.24 10.24 10.24h81.92zm0 40.96h-81.92c-28.278 0-51.2-22.922-51.2-51.2V318.974c0-28.271 22.924-51.2 51.2-51.2h81.92c28.276 0 51.2 22.929 51.2 51.2v653.251c0 28.278-22.922 51.2-51.2 51.2zM696.848 40.96l102.39.154c11.311.017 20.494-9.138 20.511-20.449S810.611.171 799.3.154L696.91 0c-11.311-.017-20.494 9.138-20.511 20.449s9.138 20.494 20.449 20.511z" />
                <path d="m778.789 20.571-.307 101.827c-.034 11.311 9.107 20.508 20.418 20.542s20.508-9.107 20.542-20.418l.307-101.827C819.783 9.384 810.642.187 799.331.153s-20.508 9.107-20.542 20.418z" />
                <path d="M163.84 317.682h154.184a51.207 51.207 0 0 0 36.211-14.999L457.208 199.71a10.263 10.263 0 0 1 7.237-3.003h159.754a51.235 51.235 0 0 0 36.198-14.976l141.13-141.13c7.998-7.998 7.998-20.965 0-28.963s-20.965-7.998-28.963 0L631.447 152.755a10.265 10.265 0 0 1-7.248 2.992H464.445a51.226 51.226 0 0 0-36.201 14.999L325.271 273.719a10.244 10.244 0 0 1-7.248 3.003H163.839c-11.311 0-20.48 9.169-20.48 20.48s9.169 20.48 20.48 20.48z" />
              </svg>
              <h4>Ingreso</h4>
              <NumberFlow
                className="volumetriaValue"
                locales="de-DE"
                value={Object.values(despachoDinero).reduce(
                  (prev, curr) => prev + curr.reduce((p, c) => p + c, 0),
                  0
                )}
                format={{ currency: "USD", style: "currency" }}
              />
            </section>
          </div>
          <Chart
            type="line"
            data={{
              labels: [
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",
              ],
              datasets:
                ventasVolumetriaOption === 0
                  ? Object.entries(despachoVolumetria).map(([key, value]) => ({
                      label: key,
                      data: value,
                    }))
                  : Object.entries(despachoDinero).map(([key, value]) => ({
                      label: key,
                      data: value,
                    })),
            }}
            options={{
              responsive: true,
              scales: {
                x: {
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </section>
      </article>
    </main>
  );
}

export default DashboardFinanzasViejo;
