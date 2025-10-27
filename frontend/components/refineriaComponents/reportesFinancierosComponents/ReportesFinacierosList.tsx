import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAbonos } from "@/app/api/abonoService";
import { getCuentas } from "@/app/api/cuentaService";
import { getContratos } from "@/app/api/contratoService";
import { useRefineriaStore } from "@/store/refineriaStore";
import ReportCard from "./ReportCard";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportPDFButton from "./ReportPDFButton";
import { Calendar } from "primereact/calendar";
import AbonosPorMesTemplate from "@/components/pdf/templates/AbonosPorMesTemplate";
import CuentasPendientesTemplate from "@/components/pdf/templates/CuentasPendientesTemplate";
import { PDFViewer } from "@react-pdf/renderer";
import ContratosReporteTemplate from "@/components/pdf/templates/ContratosReporteTemplate";
import ContactosReporteTemplate from "@/components/pdf/templates/ContactosReporteTemplate";
import { getContactos } from "@/app/api/contactoService";
import BalancesReporte from "./BalancesReporte";
import BalancesReportePDF from "@/components/pdf/templates/BalancesReportePDF";

// --- Configuración de reportes ---
// --- Opciones de contratos ---
const ESTADO_CONTRATO_OPTIONS = [
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
];

const TIPO_CONTRATO_OPTIONS = [
  { label: "Compra", value: "Compra" },
  { label: "Venta", value: "Venta" },
];

const ESTADO_ENTREGA_OPTIONS = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "En Tránsito", value: "En Tránsito" },
  { label: "Entregado", value: "Entregado" },
  { label: "Cancelado", value: "Cancelado" },
];

const REPORTES = [
  {
    key: "balances",
    label: "Balances",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="3" fill="#a21caf" />
        <rect x="7" y="2" width="2" height="6" rx="1" fill="#e879f9" />
        <rect x="15" y="2" width="2" height="6" rx="1" fill="#e879f9" />
        <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="15" width="6" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-purple-50",
  },
  {
    key: "contratos",
    label: "Contratos",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#f59e42" />
        <rect x="8" y="8" width="8" height="2" rx="1" fill="#fff" />
        <rect x="8" y="12" width="8" height="2" rx="1" fill="#fff" />
        <rect x="8" y="16" width="5" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-orange-50",
  },
  {
    key: "contactos",
    label: "Contactos",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#10b981" />
        <rect x="8" y="8" width="8" height="2" rx="1" fill="#fff" />
        <rect x="8" y="12" width="8" height="2" rx="1" fill="#fff" />
        <rect x="8" y="16" width="5" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-green-50",
  },
  {
    key: "abonos",
    label: "Abonos",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="3" fill="#2563eb" />
        <rect x="7" y="2" width="2" height="6" rx="1" fill="#60a5fa" />
        <rect x="15" y="2" width="2" height="6" rx="1" fill="#60a5fa" />
        <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="15" width="6" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-blue-50",
  },
  {
    key: "cuentasPendientes",
    label: "Cuentas Pendientes",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="12" rx="3" fill="#e11d48" />
        <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="15" width="6" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-pink-50",
  },
];

const TIPO_ABONO_OPTIONS = [
  { label: "Ingresos", value: "Cuentas por Cobrar" },
  { label: "Egresos", value: "Cuentas por Pagar" },
];

const TIPO_OPERACION_OPTIONS = [
  { label: "Efectivo", value: "Efectivo" },
  { label: "Cheque", value: "Cheque" },
  { label: "Deposito", value: "Deposito" },
];

const TIPO_CUENTA_OPTIONS = [
  { label: "Cuentas por Pagar", value: "Cuentas por Pagar" },
  { label: "Cuentas por Cobrar", value: "Cuentas por Cobrar" },
];

// --- Animaciones ---
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: 30, transition: { duration: 0.25, ease: "easeIn" } },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const ReportesFinancierosList: React.FC = () => {
  const { activeRefineria } = useRefineriaStore();
  const [reporteSeleccionado, setReporteSeleccionado] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filtros generales
  const [filtros, setFiltros] = useState<any>({
    tipoAbono: "Cuentas por Pagar",
    tipoOperacion: "",
    proveedor: "",
    tipoCuenta: "Cuentas por Pagar",
    estadoContrato: "",
    tipoContrato: "",
    estadoEntrega: "",
    fechaInicio: null,
    fechaFin: null,
    tipoContacto: "",
    estadoContacto: "",
  });

  // Opciones dinámicas
  const [proveedores, setProveedores] = useState<{ label: string; value: string }[]>([]);
  const [clientes, setClientes] = useState<{ label: string; value: string }[]>([]);

  // Data de reporte
  const [data, setData] = useState<never[]>([]);
  const [resumen, setResumen] = useState<any[]>([]);
  const [pdfDoc, setPdfDoc] = useState<React.ReactElement | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");

  // --- Cargar proveedores/clientes para filtros ---
  useEffect(() => {
    const cargarProveedores = async () => {
      const abonosDB = await getAbonos();
      const abonos = abonosDB.abonos || [];
      const map = new Map<string, { label: string; value: string }>();
      abonos.forEach((abono: any) => {
        if (
          abono.idRefineria?.id === activeRefineria?.id &&
          abono.idContrato?.idContacto?.id &&
          abono.idContrato?.idContacto?.nombre
        ) {
          map.set(abono.idContrato.idContacto.id, {
            label: abono.idContrato.idContacto.nombre,
            value: abono.idContrato.idContacto.id,
          });
        }
      });
      setProveedores(Array.from(map.values()));
    };
    cargarProveedores();
  }, [activeRefineria]);

  useEffect(() => {
    const cargarClientes = async () => {
      const cuentasDB = await getCuentas();
      const cuentas = cuentasDB.cuentas || [];
      const map = new Map<string, { label: string; value: string }>();
      cuentas.forEach((cuenta: any) => {
        if (
          cuenta.idRefineria?.id === activeRefineria?.id &&
          cuenta.idContacto?.id &&
          cuenta.idContacto?.nombre
        ) {
          map.set(cuenta.idContacto.id, {
            label: cuenta.idContacto.nombre,
            value: cuenta.idContacto.id,
          });
        }
      });
      setClientes(Array.from(map.values()));
    };
    cargarClientes();
  }, [activeRefineria]);

  // --- Lógica de búsqueda de reportes ---
  const handleBuscar = async () => {
    setLoading(true);
  if (reporteSeleccionado === "abonos") {
      // ...código existente de abonos...
      const abonosDB = await getAbonos();
      let abonos = abonosDB.abonos || [];
      abonos = abonos.filter(
        (abono: any) =>
          abono.idRefineria?.id === activeRefineria?.id &&
          (!filtros.tipoAbono || abono.tipoAbono === filtros.tipoAbono) &&
          (!filtros.tipoOperacion || abono.tipoOperacion === filtros.tipoOperacion) &&
          (!filtros.proveedor || abono.idContrato?.idContacto?.id === filtros.proveedor) &&
          (!filtros.fechaInicio || new Date(abono.fecha) >= filtros.fechaInicio) &&
          (!filtros.fechaFin || new Date(abono.fecha) <= filtros.fechaFin)
      );
      setData(abonos);
      setResumen([
        { label: "Total Abonos", value: abonos.length },
        { label: "Total Monto", value: abonos.reduce((acc: number, ab: any) => acc + (ab.monto ?? 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) },
      ]);
      setPdfDoc(
        <AbonosPorMesTemplate
          data={{
            tipoAbono: filtros.tipoAbono,
            totalMonto: abonos.reduce((acc: number, ab: any) => acc + (ab.monto ?? 0), 0),
            cantidad: abonos.length,
            abonos,
          }}
          logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
          fechaInicio={filtros.fechaInicio ?? undefined}
          fechaFin={filtros.fechaFin ?? undefined}
          tipoAbono={filtros.tipoAbono}
        />
      );
      setPdfFileName(`ReporteAbonos_${filtros.fechaInicio?.toLocaleDateString() || ""}_${filtros.fechaFin?.toLocaleDateString() || ""}.pdf`);
    }
      if (reporteSeleccionado === "contactos") {
      const contactosDB = await getContactos();
      let contactos = contactosDB.contactos || [];
      contactos = contactos.filter((contacto: any) =>
        contacto.idRefineria?.id === activeRefineria?.id &&
        (!filtros.tipoContacto || contacto.tipo === filtros.tipoContacto)
      );
      setData(contactos);
      setResumen([
        { label: "Total Contactos", value: contactos.length },
      ]);
      setPdfDoc(
        <ContactosReporteTemplate
          data={contactos}
          logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
        />
      );
      setPdfFileName(`ReporteContactos_${new Date().toLocaleDateString()}.pdf`);
      }
    if (reporteSeleccionado === "cuentasPendientes") {
      // ...código existente de cuentas pendientes...
      const cuentasDB = await getCuentas();
      let cuentas = cuentasDB.cuentas || [];
      cuentas = cuentas.filter(
        (cuenta: any) =>
          cuenta.idRefineria?.id === activeRefineria?.id &&
          (!filtros.tipoCuenta || cuenta.tipoCuenta === filtros.tipoCuenta) &&
          (!filtros.cliente || cuenta.idContacto?.id === filtros.cliente) &&
          Number(cuenta.balancePendiente) > 0
      );
      setData(cuentas);
      setResumen([
        { label: "Total Cuentas", value: cuentas.length },
        { label: "Total Pendiente", value: cuentas.reduce((acc: number, c: any) => acc + Number(c.balancePendiente ?? 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) },
      ]);
      setPdfDoc(
        <CuentasPendientesTemplate
          data={{
            tipoCuenta: filtros.tipoCuenta,
            cuentas: cuentas,
            totalPendiente: cuentas.reduce((acc: number, c: any) => acc + Number(c.balancePendiente ?? 0), 0),
          }}
          logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
        />
      );
      setPdfFileName(`ReporteCuentasPendientes_${filtros.tipoCuenta}_${new Date().toLocaleDateString()}.pdf`);
    }
  if (reporteSeleccionado === "contratos") {
    const contratosDB = await getContratos();
      let contratos = contratosDB.contratos || [];
      contratos = contratos.filter(
        (contrato: any) =>
          contrato.idRefineria?.id === activeRefineria?.id &&
          (!filtros.proveedor || contrato.idContacto?.id === filtros.proveedor) &&
          (!filtros.estadoContrato || contrato.estadoContrato === filtros.estadoContrato) &&
          (!filtros.tipoContrato || contrato.tipoContrato === filtros.tipoContrato) &&
          (!filtros.estadoEntrega || contrato.estadoEntrega === filtros.estadoEntrega) &&
          (!filtros.fechaInicio || new Date(contrato.fechaInicio) >= filtros.fechaInicio) &&
          (!filtros.fechaFin || new Date(contrato.fechaFin) <= filtros.fechaFin)
      );
      setData(contratos);
      setResumen([
        { label: "Total Contratos", value: contratos.length },
        { label: "Monto Total", value: contratos.reduce((acc: number, c: any) => acc + (c.montoTotal ?? 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) },
      ]);
      setPdfDoc(
        <ContratosReporteTemplate data={contratos} />
      );
      setPdfFileName(
        `ReporteContratos_${filtros.fechaInicio ? filtros.fechaInicio.toLocaleDateString() : ""}_${filtros.fechaFin ? filtros.fechaFin.toLocaleDateString() : ""}.pdf`
      );
    }
    setShowPreview(true);
    setLoading(false);
  };

  // --- Columnas dinámicas para la tabla ---
  const getColumns = () => {
    if (reporteSeleccionado === "abonos") {
      return [
        { field: "fecha", header: "Fecha" },
        { field: "idContrato.numeroContrato", header: "Contrato" },
        { field: "idContrato.idContacto.nombre", header: "Proveedor/Cliente" },
        { field: "tipoOperacion", header: "Tipo Operación" },
        { field: "monto", header: "Monto" },
      ];
    }
      if (reporteSeleccionado === "contactos") {
        return [
          { field: "nombre", header: "Nombre" },
          { field: "tipo", header: "Tipo" },
          { field: "correo", header: "Correo" },
          { field: "telefono", header: "Teléfono" },
       
        ];
      }
    if (reporteSeleccionado === "cuentasPendientes") {
      return [
        { field: "fecha", header: "Fecha" },
        { field: "numeroContrato", header: "Contrato" },
        { field: "idContacto.nombre", header: "Proveedor/Cliente" },
        { field: "descripcion", header: "Descripción" },
        { field: "balancePendiente", header: "Monto Pendiente" },
      ];
    }
    if (reporteSeleccionado === "contratos") {
      return [
        { field: "numeroContrato", header: "Número" },
        { field: "idContacto.nombre", header: "Proveedor/Cliente" },
        { field: "tipoContrato", header: "Tipo" },
        { field: "estadoContrato", header: "Estado de Contrato" },
        { field: "estadoEntrega", header: "Estado de Entrega" },
        { field: "fechaInicio", header: "Fecha Inicio" },
        { field: "fechaFin", header: "Fecha Fin" },
        { field: "montoTotal", header: "Monto $" },
        { field: "saldoPendiente", header: "Saldo Pendiente $" },
        { field: "descripcion", header: "Descripción" },
      ];
    }
    return [];
  };

  // --- Render helpers para acceder a campos anidados ---
  const getCellValue = (row: any, field: string) => {
    return field.split(".").reduce((acc, curr) => acc && acc[curr], row) ?? "";
  };

  // --- RESET ---
  const handleVolver = () => {
    setReporteSeleccionado(null);
    setShowPreview(false);
    setData([]);
    setResumen([]);
    setPdfDoc(null);
    setPdfFileName("");
    setFiltros({
      tipoAbono: "Cuentas por Pagar",
      tipoOperacion: "",
      proveedor: "",
      tipoCuenta: "Cuentas por Pagar",
      fechaInicio: null,
      fechaFin: null,
    });
  };

  // --- Render ---
  return (
    <div className="grid">
      <div className="col-12">
    <motion.div
      className="card surface-50 p-4 border-round shadow-2xl"
    //  style={{ maxWidth: 1300, margin: "0 auto" }}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <motion.h2
        className="mb-4 text-2xl font-bold text-center text-primary"
        style={{ letterSpacing: 1 }}
        variants={fadeInUp}
      >
        Reportes Financieros
      </motion.h2>

      {/* Selección de reporte - tarjetas en una sola fila y todo el ancho */}
      <AnimatePresence mode="wait">
        {!reporteSeleccionado && (
          <motion.div
            className="mb-4"
            key="select-report"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            <h3 className="mb-4 text-lg font-semibold text-center text-primary">
              Selecciona un reporte
            </h3>
            <div
              className="flex flex-row gap-5 justify-center items-stretch w-full"
              style={{ flexWrap: "nowrap", overflowX: "auto", width: "100%" }}
            >
              {REPORTES.map((rep) => (
                <div key={rep.key} style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
                  <ReportCard
                    icon={rep.icon}
                    label={rep.label}
                    color={rep.color}
                    onClick={() => setReporteSeleccionado(rep.key)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros SIEMPRE visibles y resultados debajo */}
      <AnimatePresence mode="wait">
        {reporteSeleccionado && reporteSeleccionado !== "balances" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="filters"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
              <ReportFilters
                filtros={filtros}
                setFiltros={setFiltros}
                loading={loading}
                onBuscar={handleBuscar}
                onVolver={handleVolver}
                opciones={{
                  tipoAbono: reporteSeleccionado === "abonos" ? TIPO_ABONO_OPTIONS : undefined,
                  tipoOperacion: reporteSeleccionado === "abonos" ? TIPO_OPERACION_OPTIONS : undefined,
                  tipoCuenta: reporteSeleccionado === "cuentasPendientes" ? TIPO_CUENTA_OPTIONS : undefined,
                  proveedores: reporteSeleccionado === "abonos" || reporteSeleccionado === "contratos" ? proveedores : undefined,
                  clientes: reporteSeleccionado === "cuentasPendientes" ? clientes : undefined,
                  estadoContrato: reporteSeleccionado === "contratos" ? ESTADO_CONTRATO_OPTIONS : undefined,
                  tipoContrato: reporteSeleccionado === "contratos" ? TIPO_CONTRATO_OPTIONS : undefined,
                  estadoEntrega: reporteSeleccionado === "contratos" ? ESTADO_ENTREGA_OPTIONS : undefined,
                  tipoContacto: reporteSeleccionado === "contactos" ? [
                    { label: "Proveedor", value: "Proveedor" },
                    { label: "Cliente", value: "Cliente" },
                  ] : undefined,
                  estadoContacto: reporteSeleccionado === "contactos" ? [
                    { label: "Todos", value: "" },
                    { label: "Activo", value: "Activo" },
                    { label: "Inactivo", value: "Inactivo" },
                  ] : undefined,
                }}
              />
            
            {/* Resultados debajo de los filtros, si hay datos */}
            {showPreview && (
              <div className="mt-6">
                {/* Resumen */}
                {resumen.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border-round shadow-1 flex flex-wrap gap-4 justify-center">
                    {resumen.map((item, idx) => (
                      <div key={idx}>
                        <strong>{item.label}:</strong> {item.value}
                      </div>
                    ))}
                  </div>
                )}
                {/* Tabla */}
                <ReportTable
                  columns={getColumns()}
                  data={data.map((row: any) => {
                    const formatted: any = {};
                    getColumns().forEach(col => {
                      let value = getCellValue(row, col.field);
                      // Unificar formato: quitar $ de los valores y ponerlo solo en el header
                      if (reporteSeleccionado === "contratos") {
                        if (col.field === "saldoPendiente") {
                          value = row.montoPendiente;
                          value = value !== undefined && value !== null && !isNaN(Number(value)) ? Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-";
                        } else if (col.field === "montoTotal") {
                          value = row.montoTotal !== undefined && row.montoTotal !== null && !isNaN(Number(row.montoTotal)) ? Number(row.montoTotal).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-";
                        } else if (col.field === "fechaInicio" && value) {
                          value = value ? new Date(value).toLocaleDateString() : "-";
                        } else if (col.field === "fechaFin" && value) {
                          value = value ? new Date(value).toLocaleDateString() : "-";
                        }
                      } else {
                        if (col.field === "fecha") {
                          value = value ? new Date(value).toLocaleDateString() : "-";
                        }
                        if ((col.field === "monto" || col.field === "balancePendiente") && value !== undefined && value !== null && value !== "") {
                          value = !isNaN(Number(value)) ? Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 }) : value;
                        }
                      }
                      formatted[col.field] = value;
                    });
                    return formatted;
                  })}
                />
                {/* PDF y volver */}
                <div className="flex justify-center mt-4 gap-3">
                  {pdfDoc && (
                    <ReportPDFButton document={pdfDoc} fileName={pdfFileName} />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
        {reporteSeleccionado === "balances" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="balances-report"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            <div className="flex flex-wrap gap-4 justify-center mb-4">
              <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
                <label className="font-medium text-900" style={{ fontSize: 13 }}>Fecha Inicio</label>
                <Calendar
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros((f: any) => ({ ...f, fechaInicio: e.value as Date | null }))}
                  dateFormat="dd/mm/yy"
                  className="w-full p-inputtext-sm"
                  style={{ fontSize: 13, height: 36 }}
                  showIcon
                />
              </div>
              <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
                <label className="font-medium text-900" style={{ fontSize: 13 }}>Fecha Fin</label>
                <Calendar
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros((f: any) => ({ ...f, fechaFin: e.value as Date | null }))}
                  dateFormat="dd/mm/yy"
                  className="w-full p-inputtext-sm"
                  style={{ fontSize: 13, height: 36 }}
                  showIcon
                />
              </div>
              <div className="flex align-items-end gap-2">
                <button
                  className="p-button p-button-primary p-button-sm flex align-items-center gap-2"
                  style={{ minWidth: 110, fontWeight: 500, fontSize: 13, height: 32, padding: '6px 12px' }}
                  onClick={() => setShowPreview(true)}
                  disabled={loading}
                >
                  <i className="pi pi-eye"></i>
                  Buscar
                </button>
                <button
                  className="p-button p-button-sm flex align-items-center gap-2"
                  style={{ minWidth: 110, fontWeight: 500, fontSize: 13, height: 32, background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px' }}
                  onClick={handleVolver}
                  type="button"
                >
                  <i className="pi pi-arrow-left"></i>
                  Volver
                </button>
              </div>
            </div>
            {showPreview && (
              <BalancesReporte
                fechaInicio={filtros.fechaInicio}
                fechaFin={filtros.fechaFin}
                renderPDFButton={(data: any[]) =>
                  data && data.length > 0 ? (
                    <div className="flex justify-center mt-4 gap-3">
                      <ReportPDFButton
                        document={
                          <BalancesReportePDF
                            data={data}
                            refineryName={activeRefineria?.nombre || "Refinería"}
                          />
                        }
                        fileName={`ReporteBalances_${new Date().toLocaleDateString()}.pdf`}
                      />
                    </div>
                  ) : null
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

  {/* (Eliminado: bloque duplicado de resultados, ahora solo se muestra debajo de los filtros) */}
    </motion.div>
    </div>
    </div>
  );
};

export default ReportesFinancierosList;