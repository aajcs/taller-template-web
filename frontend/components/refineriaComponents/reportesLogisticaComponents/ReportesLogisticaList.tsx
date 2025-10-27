import React, { useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useRefineriaStore } from "@/store/refineriaStore";
import ReporteLogistisca from "@/components/pdf/templates/reportesLogisticaTemplate";
import { getRecepcionsFechas } from "@/app/api/recepcionService";

const ESTADOS_RECEPCION = [
  { label: "Todos", value: "TODOS" },
  { label: "Completado", value: "COMPLETADO" },
  { label: "En Refinería", value: "EN_REFINERIA" },
  { label: "En Tránsito", value: "EN_TRANSITO" },
];

const REPORTES = [
  {
    key: "recepciones",
    label: "Recepciones por fecha",
  },
];

interface ReportesLogisticaListProps {
  tipoReporte: string;
}

const ReportesLogisticaList: React.FC<ReportesLogisticaListProps> = ({
  tipoReporte,
}) => {
  const { activeRefineria } = useRefineriaStore();
  const [reporteSeleccionado, setReporteSeleccionado] = useState<string | null>(
    null
  );

  // Estados comunes
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [estadoRecepcion, setEstadoRecepcion] = useState<string>("TODOS");
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // --- HANDLER ---
  const handleGenerarReporteRecepciones = async () => {
    setLoading(true);
    try {
      const params: any = {
        fechaInicio: fechaInicio?.toISOString(),
        fechaFin: fechaFin?.toISOString(),
        estadoRecepcion: estadoRecepcion,
      };
      const data = await getRecepcionsFechas(params);

      // data es un array, no un objeto con .recepciones
      const recepcionesFiltradas = (data || []).filter((r: any) => {
        const refineriaId = r.idRefineria?.id;
        const activeId = activeRefineria?.id;

        return (
          refineriaId && activeId && String(refineriaId) === String(activeId)
        );
      });

      setReporteData(recepcionesFiltradas);
      setShowPreview(true);
    } catch (e) {
      setReporteData([]);
      setShowPreview(true);
    }
    setLoading(false);
  };

  // --- TABLA DE VISTA PREVIA ---
  const renderRecepcionesTable = (recepciones: any[]) => (
    <div
      className="overflow-x-auto mt-4"
      style={{ maxWidth: "1200px", margin: "0 auto" }}
    >
      <table className="min-w-[900px] w-full text-sm border border-200">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
            <th className="p-2 border-b">Fecha Llegada</th>
            <th className="p-2 border-b">Contrato N.</th>
            <th className="p-2 border-b">Proveedor/Cliente</th>
            <th className="p-2 border-b">Producto</th>
            <th className="p-2 border-b">Tanque</th>
            <th className="p-2 border-b">Línea</th>
            <th className="p-2 border-b">Chofer</th>
            <th className="p-2 border-b">Placa</th>
            <th className="p-2 border-b">Cantidad Recibida</th>
            <th className="p-2 border-b">Estado Recepción</th>
          </tr>
        </thead>
        <tbody>
          {recepciones.map((r: any, idx: number) => (
            <tr key={idx} className="hover:bg-blue-50">
              <td className="p-2 border-b">
                {r.fechaLlegada
                  ? new Date(r.fechaLlegada).toLocaleString()
                  : ""}
              </td>
              <td className="p-2 border-b">
                {r.idContrato?.numeroContrato || ""}
              </td>
              <td className="p-2 border-b">
                {r.idContrato?.idContacto?.nombre || ""}
              </td>
              <td className="p-2 border-b">
                {r.idContratoItems?.producto?.nombre ||
                  (Array.isArray(r.idContrato?.idItems) &&
                    r.idContrato.idItems[0]?.producto?.nombre) ||
                  ""}
              </td>

              <td className="p-2 border-b">{r.idTanque?.nombre || ""}</td>
              <td className="p-2 border-b">{r.idLinea?.nombre || ""}</td>
              <td className="p-2 border-b">{r.nombreChofer || ""}</td>
              <td className="p-2 border-b">{r.placa || ""}</td>
              <td className="p-2 border-b">{r.cantidadRecibida ?? ""}</td>
              <td className="p-2 border-b">{r.estadoRecepcion || ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-blue-100">
            <td className="p-2 border-t" colSpan={8}></td>
            <td className="p-2 border-t">
              {recepciones
                .reduce(
                  (acc: number, r: any) =>
                    acc + Number(r.cantidadRecibida ?? 0),
                  0
                )
                .toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                })}
            </td>
            <td className="p-2 border-t"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // --- RESET ---
  const handleVolver = () => {
    setReporteSeleccionado(null);
    setReporteData([]);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoRecepcion("TODOS");
    setShowPreview(false);
  };

  // --- RENDER ---
  return (
    <div
      className="card surface-50 p-4 border-round shadow-2xl"
      style={{ maxWidth: 1300, margin: "0 auto" }}
    >
      <h2
        className="mb-4 text-2xl font-bold text-center text-primary"
        style={{ letterSpacing: 1 }}
      >
        {tipoReporte}
      </h2>

      {/* Selección de reporte */}
      {!reporteSeleccionado && (
        <div className="mb-4">
          <h3 className="mb-4 text-lg font-semibold text-center text-primary">
            Selecciona un reporte
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {REPORTES.map((rep) => (
              <Button
                key={rep.key}
                label={rep.label}
                className="p-button-raised p-button-primary"
                style={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
                onClick={() => {
                  setReporteSeleccionado(rep.key);
                  setReporteData([]);
                  setFechaInicio(null);
                  setFechaFin(null);
                  setEstadoRecepcion("TODOS");
                  setShowPreview(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Formulario para el reporte de recepciones */}
      {reporteSeleccionado === "recepciones" && (
        <div className="mb-4 p-3 bg-white border-round shadow-1">
          {!showPreview ? (
            <>
              <div className="flex flex-wrap gap-4 justify-center mb-4">
                <div
                  className="flex flex-column gap-2"
                  style={{ minWidth: 180 }}
                >
                  <label className="font-medium text-900">Fecha Inicio</label>
                  <Calendar
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.value as Date)}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className="w-full"
                  />
                </div>
                <div
                  className="flex flex-column gap-2"
                  style={{ minWidth: 180 }}
                >
                  <label className="font-medium text-900">Fecha Fin</label>
                  <Calendar
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.value as Date)}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className="w-full"
                  />
                </div>
                <div
                  className="flex flex-column gap-2"
                  style={{ minWidth: 180 }}
                >
                  <label className="font-medium text-900">
                    Estado Recepción
                  </label>
                  <Dropdown
                    value={estadoRecepcion}
                    options={ESTADOS_RECEPCION}
                    onChange={(e) => setEstadoRecepcion(e.value)}
                    placeholder="Seleccione estado"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 justify-center mb-4">
                <div className="flex gap-3 justify-center">
                  <Button
                    label="Visualizar Reporte"
                    icon="pi pi-eye"
                    className="p-button-raised p-button-primary"
                    style={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
                    onClick={handleGenerarReporteRecepciones}
                    loading={loading}
                    disabled={!fechaInicio || !fechaFin}
                  />
                  <Button
                    label="Volver"
                    icon="pi pi-times"
                    className="p-button-raised"
                    style={{
                      minWidth: 120,
                      background: "#22c55e",
                      border: "none",
                      color: "#fff",
                    }}
                    onClick={handleVolver}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {reporteData && reporteData.length > 0 ? (
                <>
                  {renderRecepcionesTable(reporteData)}
                  <div className="flex justify-center mt-4">
                    <div className="flex gap-3">
                      <PDFDownloadLink
                        document={
                          <ReporteLogistisca
                            data={reporteData}
                            logoUrl={
                              activeRefineria?.img ||
                              "/layout/images/avatarHombre.png"
                            }
                          />
                        }
                        fileName={`ReporteRecepciones_${fechaInicio?.toLocaleDateString()}_${fechaFin?.toLocaleDateString()}_${estadoRecepcion}.pdf`}
                        className="p-button p-component p-button-success"
                      >
                        {({ loading }) =>
                          loading ? (
                            <span>Generando PDF...</span>
                          ) : (
                            <span>Descargar Reporte PDF</span>
                          )
                        }
                      </PDFDownloadLink>
                      <Button
                        label="Volver"
                        icon="pi pi-times"
                        className="p-button-raised"
                        style={{
                          minWidth: 120,
                          background: "#ef4444",
                          border: "none",
                          color: "#fff",
                        }}
                        onClick={() => setShowPreview(false)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 justify-center mt-4">
                  <span className="text-lg text-900 font-semibold mb-2">
                    No hay información para mostrar en este reporte.
                  </span>
                  <Button
                    label="Volver"
                    icon="pi pi-times"
                    className="p-button-raised"
                    style={{
                      minWidth: 120,
                      background: "#ef4444",
                      border: "none",
                      color: "#fff",
                    }}
                    onClick={() => setShowPreview(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportesLogisticaList;
