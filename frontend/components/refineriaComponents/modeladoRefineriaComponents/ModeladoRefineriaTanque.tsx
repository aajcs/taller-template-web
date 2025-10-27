"use client";
import {
  ChequeoCantidad,
  CorteRefinacion,
  Despacho,
  Recepcion,
  Tanque,
} from "@/libs/interfaces";
import { useEffect, useState, useMemo } from "react";
import {
  PocisionAbierta,
  PocisionCerrada,
  ValvulaAbierda,
  ValvulaCerrada,
} from "./ElementosLineaCarga";
import { getFillColor } from "@/utils/getFillCollor";

interface ModeladoRefineriaTanqueProps {
  tanque: Tanque;
  recepcions?: Recepcion[];
  despachos?: Despacho[];
  corteRefinacions?: CorteRefinacion[];
  chequeoCantidads?: ChequeoCantidad[];
  salida?: Boolean;
}

const ModeladoRefineriaTanque = ({
  tanque,
  recepcions,
  despachos,
  corteRefinacions,
  chequeoCantidads,
  salida = false,
}: ModeladoRefineriaTanqueProps) => {
  const [apiData, setApiData] = useState<{ tankLevel: number }>({
    tankLevel: 0,
  });

  // refinacions?.forEach((refinacions) => {
  //   console.log("refinacions", refinacions);
  // });

  // refinacions
  //   ?.map((refinacion) => refinacion.idRefinacionSalida)
  //   .forEach((idRefinacionSalida) => {
  //     console.log("idChequeoCidRefinacionSalidaantidad", idRefinacionSalida);
  //   });

  const totalRecepcion = useMemo(() => {
    if (!tanque || !recepcions || tanque.capacidad <= 0) return 0;
    return recepcions
      .filter((recepcion) => recepcion.idTanque?.id === tanque.id)
      .reduce((sum, recepcion) => sum + recepcion.cantidadRecibida, 0);
  }, [tanque, recepcions]);
  const totalDespacho = useMemo(() => {
    if (!tanque || !despachos || tanque.capacidad <= 0) return 0;
    return despachos
      .filter((despacho) => despacho.idTanque?.id === tanque.id)
      .reduce((sum, despacho) => sum + despacho.cantidadRecibida, 0);
  }, [tanque, despachos]);
  const totalCorteRefinacion = useMemo(() => {
    if (!tanque || !corteRefinacions || tanque.capacidad <= 0) {
      return 0;
    }

    return corteRefinacions.reduce((totalSum, refinacion) => {
      const corteSum = refinacion.corteTorre.reduce((corteSum, corte) => {
        const detallesSum = (corte.detalles || []).reduce(
          (detalleSum, detalle) => {
            if (detalle.idTanque?.id === tanque.id) {
              return detalleSum + detalle.cantidad;
            }
            return detalleSum;
          },
          0
        );

        return corteSum + detallesSum;
      }, 0);

      return totalSum + corteSum;
    }, 0);
  }, [tanque, corteRefinacions]);
  const ultimoCorteRefinacion = useMemo(() => {
    if (!tanque || !corteRefinacions || tanque.capacidad <= 0) {
      return null;
    }

    // Filtrar los cortes de refinación que tienen el tanque asociado
    const cortesFiltrados = corteRefinacions.filter((refinacion) =>
      refinacion.corteTorre.some((corte) =>
        (corte.detalles || []).some(
          (detalle) => detalle.idTanque?.id === tanque.id
        )
      )
    );

    // Obtener el último corte basado en la fecha
    const ultimoCorte = cortesFiltrados.reduce((ultimo, actual) => {
      return new Date(actual.fechaCorte) > new Date(ultimo.fechaCorte)
        ? actual
        : ultimo;
    }, cortesFiltrados[0]);

    if (!ultimoCorte) return null;

    // Calcular el totalCorteRefinacion para el tanque en el último corte
    const totalCorteRefinacionUltimo = ultimoCorte.corteTorre.reduce(
      (corteSum, corte) => {
        const detallesSum = (corte.detalles || []).reduce(
          (detalleSum, detalle) => {
            if (detalle.idTanque?.id === tanque.id) {
              return detalleSum + detalle.cantidad;
            }
            return detalleSum;
          },
          0
        );
        return corteSum + detallesSum;
      },
      0
    );

    return { ...ultimoCorte, totalCorteRefinacion: totalCorteRefinacionUltimo };
  }, [tanque, corteRefinacions]);

  const ultimoChequeoCantidad = useMemo(() => {
    if (!chequeoCantidads || !tanque) {
      return 0;
    }
    // Filtrar por tipo "Tanque" y que coincida con el tanque actual
    const chequeosFiltrados = chequeoCantidads.filter(
      (chequeo) =>
        chequeo.aplicar?.tipo === "Tanque" &&
        chequeo.aplicar?.idReferencia?.id === tanque.id
    );

    // Obtener el último registro basado en la fecha
    return chequeosFiltrados.reduce((ultimo, actual) => {
      return new Date(actual.fechaChequeo) > new Date(ultimo.fechaChequeo)
        ? actual
        : ultimo;
    }, chequeosFiltrados[0]);
  }, [chequeoCantidads, tanque]);

  // console.log("totalRefinacionSalida", totalRefinacionSalida);
  const tanqueLevel = useMemo(() => {
    if (!tanque || tanque.capacidad <= 0) {
      return 0; // Retornar 0 si el tanque no es válido o la capacidad es inválida
    }

    // Usar ultimoCorteRefinacion.totalCorteRefinacion si está disponible
    const totalCorte = ultimoCorteRefinacion?.totalCorteRefinacion || 0;

    // Calcular el nivel del tanque según el caso (entrada o salida)
    const nivel = salida
      ? (totalCorte - totalDespacho) / tanque.capacidad // Caso de salida
      : (totalRecepcion - totalCorte) / tanque.capacidad; // Caso de entrada

    // Asegurar que el nivel esté entre 0% y 100%
    return Math.min(Math.max(nivel * 100, 0), 100);
  }, [tanque, salida, totalRecepcion, totalDespacho, ultimoCorteRefinacion]);

  const isLoadingRecepcion = useMemo(() => {
    if (!recepcions || !tanque) return false;
    return recepcions.some(
      (recepcion) =>
        recepcion.idTanque?.id === tanque.id &&
        recepcion.estadoRecepcion === "EN_REFINERIA" &&
        (recepcion.estadoCarga === "EN_PROCESO" ||
          recepcion.estadoCarga === "PENDIENTE_MUESTREO" ||
          recepcion.estadoCarga === "MUESTREO_APROBADO")
    );
  }, [recepcions, tanque]);

  const isLoadingDespacho = useMemo(() => {
    if (!despachos || !tanque) return false;

    return despachos.some(
      (despacho) => despacho.idTanque?.id === tanque.id
      // && despacho.estado === "true"
    );
  }, [despachos, tanque]);

  useEffect(() => {
    setApiData({ tankLevel: parseFloat(tanqueLevel.toString()) });
  }, [tanqueLevel]);

  const bottomY = 250;
  const tankHeight = 150;
  const fillHeight = (apiData.tankLevel / 100) * tankHeight;
  const waterLevelY = bottomY - fillHeight;
  const fillColor = tanque.idProducto
    ? `#${tanque.idProducto.color}`
    : "#cccccc";
  const fillPath = `M 50,250 Q 150,500 250,250 L 250,${waterLevelY} Q 150,${
    waterLevelY + 50
  } 50,${waterLevelY} Z`;
  const gradientId = `tankGradient-${tanque.id}`;
  return (
    <>
      <svg
        width="180"
        height="210"
        viewBox="0 50 250 230"
        // className="card m-0 p-0"
      >
        {/* ----------- GRADIENTE Y CLIP-PATH PARA EL TANQUE ----------- */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor={fillColor} />
          </linearGradient>
          <clipPath id="tankClip">
            <path d="M 50,100 A 100,40 0 0 1 250,100 L 250,250 A 100,40 0 0 1 50,250 Z" />
          </clipPath>
        </defs>
        <g transform="matrix(0.5 0 0 0.5 60 0)">
          {/* ----------- RELLENO DINÁMICO CON CURVA INFERIOR ----------- */}
          <path
            d={fillPath}
            fill={`url(#${gradientId})`}
            clipPath="url(#tankClip)"
            className="fill-animate"
          />
          {/* ----------- BARRA DE CARGA ----------- */}
          {/* {isLoading && (
          <rect
            x="50"
            y="150"
            width="20"
            height="150"
            fill={fillColor}
            clipPath="url(#tankClip)"
          >
            <animate
              attributeName="y"
              from="250"
              to="100"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </rect>
        )}
        {isLoading && (
          <rect
            x="230"
            y="150"
            width="20"
            height="150"
            fill={fillColor}
            clipPath="url(#tankClip)"
          >
            <animate
              attributeName="y"
              from="100"
              to="250"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </rect>
        )} */}
          {/* <g transform="matrix(.066237 0 0 0.066236 44.872293 39.087458)"> */}

          {/* </g> */}
          {/* ----------- CUERPO DEL TANQUE ----------- */}
          {/* Elipse superior */}
          <ellipse
            cx="150"
            cy="100"
            rx="100"
            ry="40"
            fill="#ccc"
            stroke="#888"
            strokeWidth="2"
          />
          {/* Elipse inferior */}
          <ellipse
            cx="150"
            cy="250"
            rx="100"
            ry="40"
            fill="rgba(204, 204, 204, 0.5)"
            stroke="#888"
            strokeWidth="2"
          />
          {/* Contorno lateral */}
          <path
            d="M 50,100 
             L 50,250
             M 250,100
             L 250,250"
            stroke="#999"
            strokeWidth="2"
          />
          {/* Líneas horizontales simulando costillas */}
          {Array.from({ length: 8 }).map((_, i) => {
            const yPos = 110 + i * ((240 - 110) / 7);
            return (
              <path
                key={i}
                d={`
                M 50,${yPos} 
                A 100,40 0 0 0 250,${yPos}
              `}
                fill="none"
                stroke="#bbb"
                strokeWidth="1"
              />
            );
          })}
          {/* ----------- PLATAFORMA / PASARELA ----------- */}
          <rect
            x="230"
            y="85"
            width="40"
            height="10"
            fill="#ccc"
            stroke="#666"
            strokeWidth="1"
          />
          <line
            x1="230"
            y1="85"
            x2="270"
            y2="85"
            stroke="#f2a13e"
            strokeWidth="2"
          />
          <line
            x1="230"
            y1="85"
            x2="230"
            y2="95"
            stroke="#f2a13e"
            strokeWidth="2"
          />
          <line
            x1="270"
            y1="85"
            x2="270"
            y2="95"
            stroke="#f2a13e"
            strokeWidth="2"
          />
          {/* ----------- ESCALERA LATERAL ----------- */}
          <path
            d="M 270,95 L 270,250
             M 260,95 L 260,250
            "
            stroke="#f2a13e"
            strokeWidth="3"
          />
          {Array.from({ length: 10 }).map((_, i) => {
            const stepY = 100 + i * ((250 - 100) / 9);
            return (
              <line
                key={i}
                x1="260"
                y1={stepY}
                x2="270"
                y2={stepY}
                stroke="#f2a13e"
                strokeWidth="2"
              />
            );
          })}
        </g>
        {/* ----------- TEXTO DEL NIVEL ----------- */}
        {/* <g>
          Fondo para el texto
          <rect
            x="80"
            y="135"
            width="100"
            height="20"
            fill="white"
            opacity="0.8"
            rx="5"
            ry="5"
          />

          Texto del nivel
          <text
            x="90"
            y="150"
            fill={
              apiData.tankLevel > 90
                ? "red" // Rojo si el nivel es mayor al 90%
                : apiData.tankLevel < 20
                ? "green" // Verde si el nivel es menor al 20%
                : "black" // Negro para niveles entre 20% y 90%
            }
            fontSize="14"
            fontWeight="bold"
          >
            Nivel: {apiData.tankLevel}%
          </text>
        </g> */}
        {/* <text x="90" y="70" fill="black" fontSize="14">
          {tanque.nombre} {tanque.idProducto?.nombre}
        </text>
        <text x="90" y="90" fill="black" fontSize="14">
          {tanque.idProducto?.nombre} 
        </text> */}
        <g transform="translate(0, 150)">
          {/* Fondo con borde y sombra */}
          <rect
            x="5"
            y="5"
            width="240"
            height="135"
            rx="8"
            fill="#f8f9fa"
            stroke="#dee2e6"
            strokeWidth="1.5"
            filter="url(#shadow)"
          />

          {/* Contenido */}
          <g fontFamily="Segoe UI, Arial, sans-serif">
            {/* Título */}
            <text x="15" y="30" fill="#2d3436" fontSize="20" fontWeight="600">
              <tspan>{tanque.nombre}</tspan>
              <tspan
                x="110"
                y="30"
                fill="#2d3436"
                fontSize="20"
                fontWeight="600"
              >
                {tanque.idProducto?.nombre}
              </tspan>
            </text>

            {/* Línea divisoria */}
            <path d="M15 40 L225 40" stroke="#ced4da" strokeWidth="1" />

            {/* Detalles */}
            <g fontSize="17" fill="#495057">
              {/* Capacidad */}
              {/* <text x="15" y="65" fontWeight="500">
                Capacidad Diseño:
              </text>
              <text
                x="240"
                y="65"
                fontSize="18"
                textAnchor="end"
                fill="#2d3436"
                fontWeight="600"
              >
                {tanque.capacidad.toLocaleString()} bls
              </text> */}

              {/* Nivel */}
              <text x="15" y="60" fontWeight="500">
                Nivel:
              </text>
              <text
                x="240"
                y="60"
                fontSize="18"
                textAnchor="end"
                fontWeight="600"
                style={{
                  fill:
                    apiData.tankLevel < 7.5
                      ? "red"
                      : apiData.tankLevel < 15
                      ? "#FFC107"
                      : apiData.tankLevel > 92.5
                      ? "red"
                      : apiData.tankLevel > 85
                      ? "#FFC107"
                      : "green",
                  animation:
                    apiData.tankLevel < 7.5 || apiData.tankLevel > 92.5
                      ? "blink 1s steps(5, start) infinite"
                      : "none",
                }}
              >
                {apiData.tankLevel.toFixed(2)}%
              </text>

              {/* Cantidad */}
              <text x="15" y="80" fontWeight="500">
                Cantidad:
              </text>
              <text
                x="240"
                y="80"
                fontSize="18"
                textAnchor="end"
                fill="#2d3436"
                fontWeight="600"
              >
                {ultimoCorteRefinacion
                  ? (!salida
                      ? totalRecepcion +
                        totalDespacho -
                        ultimoCorteRefinacion.totalCorteRefinacion // Caso de entrada
                      : ultimoCorteRefinacion.totalCorteRefinacion -
                        totalDespacho
                    ) // Caso de salida
                      .toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                  : "0.00"}{" "}
                Bbl
              </text>

              {/* Temperatura */}
              <text x="15" y="100" fontWeight="500">
                Temperatura:
              </text>
              <text
                x="240"
                y="100"
                fontSize="18"
                textAnchor="end"
                fill="#6c757d"
                fontStyle="italic"
                fontWeight="600"
              >
                {/* Puedes reemplazar con el dato real cuando lo tengas */}
                N/A
              </text>
              <text x="15" y="120" fontWeight="500">
                Última Medición:
              </text>
              <text
                x="240"
                y="120"
                fontSize="18"
                textAnchor="end"
                fill="#2d3436"
                fontWeight="600"
              >
                {ultimoChequeoCantidad
                  ? `${ultimoChequeoCantidad.cantidad.toLocaleString()} Bbl 
                    `
                  : "0"}
              </text>
              <text
                x="240"
                y="135"
                fontSize="18"
                textAnchor="end"
                fill="#2d3436"
                // fontWeight="600"
              >
                {ultimoChequeoCantidad &&
                  `Hace ${
                    (Date.now() -
                      new Date(ultimoChequeoCantidad.fechaChequeo).getTime()) /
                      (1000 * 60 * 60) <
                    1
                      ? `${(
                          (Date.now() -
                            new Date(
                              ultimoChequeoCantidad.fechaChequeo
                            ).getTime()) /
                          (1000 * 60)
                        ).toFixed(0)} min`
                      : `${(
                          (Date.now() -
                            new Date(
                              ultimoChequeoCantidad.fechaChequeo
                            ).getTime()) /
                          (1000 * 60 * 60)
                        ).toFixed(1)} h`
                  }`}
              </text>
            </g>
          </g>
        </g>

        {/* Definición de sombra (agregar en <defs>) */}
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="2"
              dy="2"
              stdDeviation="2"
              floodColor="rgba(0,0,0,0.1)"
            />
          </filter>
        </defs>
        {/* <text x="10" y="280" fontSize="18">
          Cantidad estimada:{" "}
          {(
            totalRecepcion +
            totalRefinacionSalida -
            totalRefinacion -
            totalDespacho
          ).toFixed(2)}{" "}
          Bbl
        </text>
        <text x="10" y="300" fontSize="18">
          Cantidad chequo:{" "}
          {ultimosChequeosPorRefinacion?.[0]?.cantidad || "No disponible"} Bbl
          Cantidad: {totalRecepcion - totalRefinacion} Bbl
        </text> */}
        {/* {isLoading && (
          <rect x="50" y="150" width="10" height="150" fill="rgb(255, 0, 0)">
            <animate
              attributeName="y"
              from="150"
              to="50"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </rect>
        )} */}
        {isLoadingRecepcion ? (
          <>
            <g transform="matrix(.25 0 0 0.306621 55 27.2831)">
              <g transform="matrix(.122101 0 0 0.122101-122.210883-91.867315)">
                <path
                  d="M1819.894,1641.836c0,150.278-127.748,272.544-284.778,272.544-148.699,0-271.146-109.637-283.706-248.882-.712-7.799-1.072-15.692-1.072-23.662c0-201.695,207.023-420.909,270.468-483.29c3.792-3.724,8.871-5.782,14.311-5.782s10.518,2.059,14.311,5.782c15.512,15.254,39.603,39.877,67.16,71.33c85.141,97.197,203.306,259.58,203.306,411.96Z"
                  fill={fillColor}
                />
                <ellipse
                  rx={204.106}
                  ry={16.73}
                  transform="translate(1535.12 1973.27)"
                  fill="#cecece"
                />
                <path d="M1819.894,1641.836c0,150.278-127.748,272.544-284.778,272.544-148.699,0-271.146-109.637-283.706-248.882c34.79,104.781,137.417,180.907,258.285,180.907c149.411,0,270.965-116.32,270.965-259.306c0-128.092-87.759-263.613-164.074-357.224c85.143,97.198,203.308,259.581,203.308,411.961Z" />
                <path
                  d="M1406.884,1496.68c3.588-13.747,7.915-27.175,12.748-40.075c5.894-15.733-1.436-33.192-17.04-40.753v0c-16.712-8.099-37.164-2.119-46.208,13.555-7.492,12.985-14.55,26.251-21.229,39.82l71.729,27.453Z"
                  fill="#fff"
                />
                <path
                  d="M1322.707,1495.822c-7.537,16.938-14.568,34.338-21.191,52.234-19.547,52.819-20.812,113.705,6.792,163.136c11.476,20.551,28.778,39.419,51.887,46.866s52.32.297,63.889-20.207c7.15-12.672,6.725-28.149,2.911-42.075-3.815-13.926-10.728-26.866-16.226-40.269-17.252-42.057-17.854-88.993-9.463-133.946l-78.599-25.739Z"
                  fill="#fff"
                />
              </g>
              <animate
                attributeName="opacity"
                values="1;0;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </g>
            <g transform="translate(-30, 20)">
              <ValvulaAbierda />
            </g>
            {/* <g transform="matrix(.075615 0 0 .075615 -80 -98)">
              <PocisionAbierta />
            </g> */}
          </>
        ) : (
          // <g transform="matrix(.075615 0 0 .075615 -80 -98)">
          //   <PocisionCerrada />
          // </g>
          <g transform="translate(-30, 20)">
            <ValvulaCerrada />
          </g>
        )}
        {isLoadingDespacho ? (
          // (isLoadingRefinacion || isLoadingRecepcion) &&
          // tanque.almacenamientoMateriaPrimaria ? (
          <>
            <g transform="matrix(.25 0 0 0.306621 270 280)">
              <g transform="matrix(.122101 0 0 0.122101-122.210883-91.867315)">
                <path
                  d="M1819.894,1641.836c0,150.278-127.748,272.544-284.778,272.544-148.699,0-271.146-109.637-283.706-248.882-.712-7.799-1.072-15.692-1.072-23.662c0-201.695,207.023-420.909,270.468-483.29c3.792-3.724,8.871-5.782,14.311-5.782s10.518,2.059,14.311,5.782c15.512,15.254,39.603,39.877,67.16,71.33c85.141,97.197,203.306,259.58,203.306,411.96Z"
                  fill={fillColor}
                />
                <ellipse
                  rx={204.106}
                  ry={16.73}
                  transform="translate(1535.12 1973.27)"
                  fill="#cecece"
                />
                <path d="M1819.894,1641.836c0,150.278-127.748,272.544-284.778,272.544-148.699,0-271.146-109.637-283.706-248.882c34.79,104.781,137.417,180.907,258.285,180.907c149.411,0,270.965-116.32,270.965-259.306c0-128.092-87.759-263.613-164.074-357.224c85.143,97.198,203.308,259.581,203.308,411.961Z" />
                <path
                  d="M1406.884,1496.68c3.588-13.747,7.915-27.175,12.748-40.075c5.894-15.733-1.436-33.192-17.04-40.753v0c-16.712-8.099-37.164-2.119-46.208,13.555-7.492,12.985-14.55,26.251-21.229,39.82l71.729,27.453Z"
                  fill="#fff"
                />
                <path
                  d="M1322.707,1495.822c-7.537,16.938-14.568,34.338-21.191,52.234-19.547,52.819-20.812,113.705,6.792,163.136c11.476,20.551,28.778,39.419,51.887,46.866s52.32.297,63.889-20.207c7.15-12.672,6.725-28.149,2.911-42.075-3.815-13.926-10.728-26.866-16.226-40.269-17.252-42.057-17.854-88.993-9.463-133.946l-78.599-25.739Z"
                  fill="#fff"
                />
              </g>
              <animate
                attributeName="opacity"
                values="1;0;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </g>
            {/* <g transform="matrix(.075615 0 0 .075615 100 -20)">
              <PocisionAbierta />
            </g> */}
            <g transform="translate(140, 20)">
              <ValvulaAbierda />
            </g>
          </>
        ) : (
          // <g transform="matrix(.075615 0 0 .075615 100 -20)">
          //   <PocisionCerrada />
          // </g>
          <g transform="translate(140, 20)">
            <ValvulaCerrada />
          </g>
        )}
      </svg>

      {/* Animación simple al cambiar el "d" del path */}
      <style jsx>{`
        .fill-animate {
          transition: d 2s ease-in-out;
        }
      `}</style>
      <style jsx>{`
        .fill-animate {
          transition: d 2s ease-in-out;
        }
        @keyframes blink {
          to {
            visibility: hidden;
          }
        }
      `}</style>
    </>
  );
};

export default ModeladoRefineriaTanque;
