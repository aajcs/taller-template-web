import { Contrato } from "@/libs/interfaces";
import { formatDateSinAnoFH } from "@/utils/dateUtils";
import { MathJax } from "better-react-mathjax";
import { Tooltip } from "primereact/tooltip";
import { useMemo } from "react"; // Importa useMemo

interface Producto {
  producto: { id: string; nombre: string; color: string };
  cantidad: number;
  formula: string;
  precioUnitario: number;
  total: number;
  precioTransporte: number;
  totalTransporte: number;
  brent: number;
  convenio: number;
}

interface ModeladoBunkeringContratosSalesListProps {
  contrato: Contrato & { productos: Producto[] };
  tipo: string;
}

const ModeladoBunkeringContratosSalesCard = ({
  contrato,
  tipo,
}: ModeladoBunkeringContratosSalesListProps) => {
  const {
    totalCantidad,
    montoTotal,
    montoTransporte,
    montoPorBarril,
    brentTotal,
    convenioTotal,
  } = useMemo(() => {
    const _totalCantidad = contrato.productos.reduce(
      (acc, item) => acc + (item.cantidad ?? 0),
      0
    );

    const _montoTotal = contrato.productos.reduce(
      (acc, item) => acc + (item.total ?? 0),
      0
    );

    const _montoTransporte = contrato.productos.reduce(
      (acc, item) => acc + (item.totalTransporte ?? 0),
      0
    );

    const _montoPorBarril =
      _totalCantidad > 0
        ? (_montoTransporte + _montoTotal) / _totalCantidad
        : 0;

    const _brentTotal =
      contrato.productos.reduce((acc, item) => acc + (item.brent ?? 0), 0) /
      (contrato.productos.length || 1); // Evita división por cero
    const _convenioTotal =
      contrato.productos.reduce((acc, item) => acc + (item.convenio ?? 0), 0) /
      (contrato.productos.length || 1);

    return {
      totalCantidad: _totalCantidad,
      montoTotal: _montoTotal,
      montoTransporte: _montoTransporte,
      montoPorBarril: _montoPorBarril,
      brentTotal: _brentTotal,
      convenioTotal: _convenioTotal,
    };
  }, [contrato.productos]);

  return (
    <div>
      <div className="p-3 surface-card border-round shadow-2">
        <div className="flex justify-content-between align-items-start">
          <div className="flex flex-column">
            <span className="text-lg font-bold white-space-normal">
              {contrato.descripcion.toLocaleUpperCase()}
            </span>
            <span className="text-sm text-500 mt-1">
              {`(${contrato.idContacto.nombre})`}
            </span>
          </div>
          <div className="flex flex-column text-right">
            <span className="text-sm font-semibold">
              Nº: {contrato.numeroContrato}
            </span>
            <span className="text-xs text-green-500">
              Act-{formatDateSinAnoFH(contrato.updatedAt)}
            </span>
          </div>
        </div>
        <hr className="my-2" />
        <div className="text-sm">
          <span className="font-medium">Inicio:</span>{" "}
          {formatDateSinAnoFH(contrato.fechaInicio)}
          {" - "}
          <span className="font-medium">Fin:</span>{" "}
          {formatDateSinAnoFH(contrato.fechaFin)}
        </div>
        <hr className="my-2" />
        <div className="flex flex-column gap-2">
          {contrato.productos.map((productoContrato, index) => {
            const tooltipId = `tooltip-${productoContrato.producto.id}-${index}`; // ID único
            const precioTotalProducto = useMemo(
              () =>
                (productoContrato.precioUnitario +
                  productoContrato.precioTransporte) *
                productoContrato.cantidad,
              [
                productoContrato.precioUnitario,
                productoContrato.precioTransporte,
                productoContrato.cantidad,
              ]
            );
            const precioUnitarioTotal = useMemo(
              () =>
                productoContrato.precioUnitario +
                productoContrato.precioTransporte,
              [
                productoContrato.precioUnitario,
                productoContrato.precioTransporte,
              ]
            );

            return (
              <div
                key={productoContrato.producto.id}
                className={`flex align-items-center gap-2 ${tooltipId}`}
              >
                <Tooltip
                  target={`.${tooltipId}`}
                  mouseTrack
                  mouseTrackLeft={10}
                >
                  <div className="flex-grow-1">
                    <div className="flex justify-content-between  mt-1">
                      <span>
                        <MathJax>
                          {String.raw`\( \left( \frac{Cantidad}{${productoContrato.cantidad.toLocaleString(
                            "de-DE"
                          )} \text{ Bbl}} \right) \)`}
                        </MathJax>
                      </span>
                      <span className="">
                        <MathJax>
                          {String.raw`\( \left( \frac{Brent + Convenio + Transporte}{${productoContrato.brent?.toLocaleString(
                            "de-DE",
                            {
                              style: "currency",
                              currency: "USD",
                            }
                          )} + ${productoContrato.convenio?.toLocaleString(
                            "de-DE",
                            {
                              style: "currency",
                              currency: "USD",
                            }
                          )} + ${productoContrato.precioTransporte?.toLocaleString(
                            "de-DE",
                            {
                              style: "currency",
                              currency: "USD",
                            }
                          )}} = \frac{Precio Unitario}{${precioUnitarioTotal?.toLocaleString(
                            "de-DE",
                            {
                              style: "currency",
                              currency: "USD",
                            }
                          )}} \right) \) `}
                        </MathJax>
                      </span>
                      <span className="">
                        <MathJax>
                          {String.raw`\( \left( \frac{Total}{${precioTotalProducto.toLocaleString(
                            "de-DE",
                            {
                              style: "currency",
                              currency: "USD",
                            }
                          )}} \right) \) `}
                        </MathJax>
                      </span>
                    </div>
                  </div>
                </Tooltip>
                <span className="font-bold min-w-8rem">
                  {productoContrato.producto.nombre}
                </span>
                <div className="flex-grow-1">
                  <div className="flex justify-content-between text-xs mt-1">
                    <span></span>
                    <span className="text-green-800">
                      <MathJax>
                        {String.raw`\( \left( ${productoContrato.cantidad.toLocaleString(
                          "de-DE"
                        )} \text{ Bbl} \right) \times \left( ${precioUnitarioTotal?.toLocaleString(
                          "de-DE",
                          {
                            style: "currency",
                            currency: "USD",
                          }
                        )} \right) = \left( ${precioTotalProducto.toLocaleString(
                          "de-DE",
                          {
                            style: "currency",
                            currency: "USD",
                          }
                        )} \right) \) `}
                      </MathJax>
                    </span>
                    <span className="text-red-800"></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <hr className="my-2" />
        <div className="flex flex-column gap-2">
          <div className="flex align-items-center gap-2">
            <span className="font-bold min-w-8rem">
              <MathJax>
                {String.raw`\( MontoPorBarril = \frac{Monto Total}{Total Cantidad} = \frac{${(
                  montoTotal + montoTransporte
                ).toLocaleString("de-DE", {
                  style: "currency",
                  currency: "USD",
                })}}{${totalCantidad.toLocaleString(
                  "de-DE"
                )} \text{ Bbl}} = ${montoPorBarril.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "USD",
                })} \)`}
              </MathJax>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeladoBunkeringContratosSalesCard;
