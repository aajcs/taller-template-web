import { useEffect, useState } from "react";

export type RecepcionResponse = {
  total: number;
  recepcions: Recepcion[];
};

export type Recepcion = {
  idContrato: IDContrato;
  idContratoItems: IDContratoItems;
  idRefineria: IDRefineria;
  cantidadRecibida: number;
  cantidadEnviada: number;
  estadoRecepcion: EstadoRecepcion;
  estadoCarga: EstadoCarga;
  fechaInicioRecepcion: Date;
  fechaFinRecepcion: Date;
  fechaSalida: Date;
  fechaLlegada: Date;
  idGuia: number;
  placa: string;
  nombreChofer: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  idChequeoCantidad?: IDChequeoCantidad;
  idChequeoCalidad?: IDChequeoCalidad;
  id: string;
  idLinea?: IDLinea;
  idTanque?: IDRefineria;
};

export enum EstadoCarga {
  EnProceso = "EN_PROCESO",
  Finalizado = "FINALIZADO",
  MuestreoAprobado = "MUESTREO_APROBADO",
  PendienteMuestreo = "PENDIENTE_MUESTREO",
}

export enum EstadoRecepcion {
  Completado = "COMPLETADO",
  EnRefineria = "EN_REFINERIA",
  EnTransito = "EN_TRANSITO",
}

export type IDChequeoCalidad = {
  aplicar: Aplicar;
  _id: string;
  idRefineria: string;
  idProducto: string;
  fechaChequeo: Date;
  gravedadAPI: number;
  azufre: number;
  contenidoAgua: number;
  puntoDeInflamacion: number;
  cetano: number;
  idOperador: string;
  estado: Estado;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  numeroChequeoCalidad: number;
  id: string;
};

export type Aplicar = {
  tipo: Tipo;
  idReferencia: string;
};

export enum Tipo {
  Recepcion = "Recepcion",
}

export enum Estado {
  Aprobado = "aprobado",
}

export type IDChequeoCantidad = {
  aplicar: Aplicar;
  idRefineria: string;
  idProducto: string;
  idOperador: string;
  fechaChequeo: Date;
  cantidad: number;
  estado: Estado;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  numeroChequeoCantidad: number;
  id: string;
};

export type IDContrato = {
  _id: string;
  numeroContrato: string;
  idItems: IDItem[];
  id: string;
};

export type IDItem = {
  _id: string;
  idContrato: string;
  producto: IDRefineria;
  cantidad: number;
  precioUnitario: number;
  brent?: number;
  convenio: number;
  montoTransporte: number;
  idTipoProducto: IDRefineria;
  clasificacion: Clasificacion;
  gravedadAPI: number;
  azufre: number;
  contenidoAgua: number;
  flashPoint?: number;
  estado: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  puntoDeInflamacion?: number;
};

export enum Clasificacion {
  Liviano = "Liviano",
  Mediano = "Mediano",
}

export type IDRefineria = {
  _id: string;
  nombre: string;
  id: string;
};

export type IDContratoItems = {
  _id: string;
  idContrato: string;
  producto: IDRefineria;
  cantidad: number;
  precioUnitario: number;
  brent?: number;
  convenio: number;
  montoTransporte: number;
  idTipoProducto: IDTipoProducto;
  clasificacion: Clasificacion;
  gravedadAPI: number;
  azufre: number;
  contenidoAgua: number;
  flashPoint?: number;
  estado: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  puntoDeInflamacion?: number;
};

export enum IDTipoProducto {
  The67F3D72962Dddfb155E49Abb = "67f3d72962dddfb155e49abb",
  The67F971180Fba83Db24F97Cce = "67f971180fba83db24f97cce",
  The67F974466E03B862A41Aab93 = "67f974466e03b862a41aab93",
  The67Fa91F464190E77Eadaccb5 = "67fa91f464190e77eadaccb5",
}

export type IDLinea = {
  nombre: Nombre;
  id: ID;
};

export enum Nombre {
  L01 = "L 01",
  LineaDePrueba = "Linea de prueba",
}

export interface CorteRefinacion {
  idRefineria: ID;
  numeroCorteRefinacion: number;
  corteTorre: CorteTorre[];
  fechaCorte: Date;
  observacion: string;
  estado: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
  id: string;
}

export interface CorteTorre {
  idTorre: ID;
  detalles: Detalle[];
  _id: string;
}

export interface Detalle {
  idTanque?: ID;
  idProducto: ID;
  cantidad: number;
  _id: string;
}

export interface ID {
  _id: string;
  nombre: string;
  tipoMaterial?: TipoMaterial;
  id: string;
}

export enum TipoMaterial {
  Derivado = "Derivado",
  MateriaPrima = "Materia Prima",
}

function CargaPlanta() {
  const [cortesRefinacion, setCortesRefinacion] = useState<CorteRefinacion[]>(
    []
  );
  const [recepciones, setRecepciones] = useState<
    RecepcionResponse["recepcions"]
  >([]);
  const [despachos, setDespachos] = useState([]);

  const [ultimoCorte, penultimoCorte] = cortesRefinacion.slice(-2);
  const recepcionesRango =
    ultimoCorte && penultimoCorte
      ? recepciones.filter(
          (r) =>
            new Date(r.fechaLlegada) >= new Date(penultimoCorte.fechaCorte) &&
            new Date(r.fechaLlegada) <= new Date(ultimoCorte.fechaCorte)
        )
      : [];

  const consumoPlanta =
    penultimoCorte && ultimoCorte
      ? penultimoCorte.corteTorre[0].detalles
          .filter((d) => d.idProducto.tipoMaterial === "Materia Prima")
          .reduce((prev, curr) => prev + curr.cantidad, 0) -
        ultimoCorte.corteTorre[0].detalles
          .filter((d) => d.idProducto.tipoMaterial === "Materia Prima")
          .reduce((prev, curr) => prev + curr.cantidad, 0) +
        recepcionesRango.reduce((prev, curr) => prev + curr.cantidadRecibida, 0)
      : 0;

  const consumos =
    penultimoCorte && ultimoCorte
      ? Object.entries(
          groupBy(
            [
              ...penultimoCorte.corteTorre[0].detalles.filter(
                (d) => d.idProducto.tipoMaterial === "Derivado"
              ),
              ...ultimoCorte.corteTorre[0].detalles.filter(
                (d) => d.idProducto.tipoMaterial === "Derivado"
              ),
            ],
            (d) => d.idProducto.nombre
          )
        ).reduce<Record<string, number>>((prev, [name, value]) => {
          const [first, last] = value?.slice(-2).map((v) => v.cantidad) ?? [
            0, 0,
          ];
          prev[name] = last - first;

          return prev;
        }, {})
      : {};

  useEffect(() => {
    fetch(
      "https://api-maroil-refinery-2500582bacd8.herokuapp.com/api/corteRefinacion/"
    )
      .then<{ corteRefinacions: CorteRefinacion[] }>((res) => res.json())
      .then((body) => setCortesRefinacion(body.corteRefinacions));

    fetch(
      "https://api-maroil-refinery-2500582bacd8.herokuapp.com/api/recepcion"
    )
      .then<RecepcionResponse>((res) => res.json())
      .then((body) => setRecepciones(body.recepcions));
  });

  const diferenciaHoras =
    ultimoCorte && penultimoCorte
      ? (new Date(ultimoCorte.fechaCorte).getTime() -
          new Date(penultimoCorte.fechaCorte).getTime()) /
        3600000
      : 1;

  return (
    <main>
      <h1>Datos corte refinacion</h1>
      <h2>Cortes</h2>
      <h3>Penultimo</h3>
      {penultimoCorte && (
        <>
          <p>{new Date(penultimoCorte.fechaCorte).toDateString()}</p>
          <h4>Tanques</h4>
          <ul>
            {penultimoCorte.corteTorre[0].detalles.map((d) => (
              <li key={d._id}>
                {d.idTanque?.nombre} ({d.idProducto.nombre}) habian {d.cantidad}{" "}
                BBL
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>Ultimo</h3>
      {ultimoCorte && (
        <>
          <p>{new Date(ultimoCorte.fechaCorte).toDateString()}</p>
          <h4>Tanques</h4>
          <ul>
            {ultimoCorte.corteTorre[0].detalles.map((d) => (
              <li key={d._id}>
                {d.idTanque?.nombre} ({d.idProducto.nombre}) habian {d.cantidad}{" "}
                BBL
              </li>
            ))}
          </ul>
        </>
      )}
      {ultimoCorte && penultimoCorte && (
        <p>
          Diferencia de horas:{" "}
          {(new Date(ultimoCorte.fechaCorte).getTime() -
            new Date(penultimoCorte.fechaCorte).getTime()) /
            3600000}
        </p>
      )}
      <h2>Recepciones</h2>
      <ul>
        <li>
          {recepcionesRango.map((r) => (
            <li key={r.id}>
              {new Date(r.fechaLlegada).toDateString()} entraron{" "}
              {r.cantidadRecibida} BBL
            </li>
          ))}
        </li>
      </ul>

      <p>
        Tu carga de la planta es{" "}
        {Intl.NumberFormat().format((consumoPlanta * -24) / diferenciaHoras)}{" "}
        BBL/dia
      </p>
      <h3>Rendimientos</h3>
      <ul>
        {Object.entries(consumos).map(([name, value]) => (
          <li key={name}>
            Se obtuvieron {value}BBL de {name} y el rendimiento obtenido es de{" "}
            {(value / consumoPlanta) * -100}%
          </li>
        ))}
      </ul>
    </main>
  );
}

export default CargaPlanta;
function groupBy<T, K extends keyof any>(
  list: T[],
  key: (obj: T) => K
): Record<K, T[]> {
  return list.reduce((acc: Record<K, T[]>, obj: T) => {
    const groupKey = key(obj);
    acc[groupKey] = acc[groupKey] || [];
    acc[groupKey].push(obj);
    return acc;
  }, {} as Record<K, T[]>);
}
