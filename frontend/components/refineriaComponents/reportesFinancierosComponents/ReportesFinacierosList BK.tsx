import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import AbonosPorMesTemplate from "@/components/pdf/templates/AbonosPorMesTemplate";
import CuentasPendientesTemplate from "@/components/pdf/templates/CuentasPendientesTemplate";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { getAbonos } from "@/app/api/abonoService";
import { getCuentas } from "@/app/api/cuentaService";
import { useRefineriaStore } from "@/store/refineriaStore";
import { motion, AnimatePresence } from "framer-motion";

// Tarjetas cuadradas con iconos modernos
const REPORTES = [
  {
    key: "abonosPorFecha",
    label: "Reporte de Abonos por Fecha",
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
    key: "abonosPorTipoOperacion",
    label: "Abonos por Tipo de Operación",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#059669" />
        <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    color: "bg-green-50",
  },
  {
    key: "abonosPorProveedor",
    label: "Abonos por Proveedor",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#f59e42" />
        <circle cx="12" cy="12" r="4" fill="#fff" />
        <rect x="10" y="16" width="4" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-orange-50",
  },
  {
    key: "cuentasPendientes",
    label: "Cuentas por Pagar / Cobrar Pendientes",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="12" rx="3" fill="#e11d48" />
        <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="15" width="6" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-pink-50",
  },
  {
    key: "cuentasPendientesPorProveedor",
    label: "Cuentas Pendientes por Proveedor/Cliente",
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#6366f1" />
        <circle cx="12" cy="12" r="4" fill="#fff" />
        <rect x="10" y="16" width="4" height="2" rx="1" fill="#fff" />
        <rect x="16" y="10" width="2" height="4" rx="1" fill="#fff" />
      </svg>
    ),
    color: "bg-indigo-50",
  },
];

const TIPO_ABONO_OPTIONS = [
  { label: "Abonos de Ingresos", value: "Cuentas por Cobrar" },
  { label: "Abonos de Egresos", value: "Cuentas por Pagar" },
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

const fetchProveedores = async () => {
  const abonosDB = await getAbonos();
  const abonos = abonosDB.abonos || [];
  const proveedoresMap = new Map<string, { label: string; value: string }>();
  abonos.forEach((abono: any) => {
    if (
      abono.idRefineria?.id === useRefineriaStore.getState().activeRefineria?.id &&
      abono.idContrato?.idContacto?.id &&
      abono.idContrato?.idContacto?.nombre
    ) {
      proveedoresMap.set(abono.idContrato.idContacto.id, {
        label: abono.idContrato.idContacto.nombre,
        value: abono.idContrato.idContacto.id,
      });
    }
  });
  return Array.from(proveedoresMap.values());
};

interface ReportesFinacierosListProps {
  tipoReporte: string;
}

// Animaciones Framer Motion
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

const ReportesFinacierosList: React.FC<ReportesFinacierosListProps> = ({ tipoReporte }) => {
  const { activeRefineria } = useRefineriaStore();
  const [reporteSeleccionado, setReporteSeleccionado] = useState<string | null>(null);

  // Estados comunes
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [tipoAbono, setTipoAbono] = useState<string>("Cuentas por Pagar");
  const [tipoOperacion, setTipoOperacion] = useState<string>("Efectivo");
  const [proveedor, setProveedor] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<any>(null);

  // Para cuentas pendientes
  const [cuentasPendientes, setCuentasPendientes] = useState<any[]>([]);
  const [tipoCuentaPendiente, setTipoCuentaPendiente] = useState<string>("Cuentas por Pagar");
  const [totalPendiente, setTotalPendiente] = useState<number>(0);

  // Para cuentas pendientes por proveedor/cliente
  const [pendienteProveedor, setPendienteProveedor] = useState<string | null>(null);
  const [pendienteProveedores, setPendienteProveedores] = useState<{ label: string; value: string }[]>([]);

  // Visualización previa
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const cargarProveedores = async () => {
      const lista = await fetchProveedores();
      setProveedores(lista);
    };
    cargarProveedores();
  }, []);

  // Cargar proveedores/clientes para cuentas pendientes según tipo de cuenta
  useEffect(() => {
    const cargarPendienteProveedores = async () => {
      const cuentasDB = await getCuentas();
      const cuentas = cuentasDB.cuentas || [];
      const map = new Map<string, { label: string; value: string }>();
      cuentas.forEach((cuenta: any) => {
        if (
          cuenta.idRefineria?.id === activeRefineria?.id &&
          cuenta.tipoCuenta === tipoCuentaPendiente &&
          cuenta.idContacto?.id &&
          cuenta.idContacto?.nombre
        ) {
          map.set(cuenta.idContacto.id, {
            label: cuenta.idContacto.nombre,
            value: cuenta.idContacto.id,
          });
        }
      });
      setPendienteProveedores(Array.from(map.values()));
    };
    if (reporteSeleccionado === "cuentasPendientesPorProveedor" && tipoCuentaPendiente) {
      cargarPendienteProveedores();
      setPendienteProveedor(null);
    }
    // eslint-disable-next-line
  }, [reporteSeleccionado, tipoCuentaPendiente, activeRefineria]);

  // --- TITULO DINÁMICO ---
  const tituloReporte =
    reporteSeleccionado
      ? REPORTES.find(r => r.key === reporteSeleccionado)?.label || tipoReporte
      : tipoReporte;

  // --- HANDLERS ---
  const handleGenerarReporte = async () => {
    setLoading(true);
    try {
      const abonosDB = await getAbonos();
      let abonos = abonosDB.abonos || [];
      abonos = abonos.filter(
        (abono: any) =>
          abono.idRefineria?.id === activeRefineria?.id &&
          abono.tipoAbono === tipoAbono &&
          (!fechaInicio || new Date(abono.fecha) >= fechaInicio) &&
          (!fechaFin || new Date(abono.fecha) <= fechaFin)
      );
      setReporteData({
        tipoAbono,
        totalMonto: abonos.reduce((acc: number, ab: any) => acc + (ab.monto ?? 0), 0),
        cantidad: abonos.length,
        abonos,
      });
      setShowPreview(true);
    } catch (e) {
      setReporteData(null);
    }
    setLoading(false);
  };

  const handleGenerarReportePorTipoOperacion = async () => {
    setLoading(true);
    try {
      const abonosDB = await getAbonos();
      let abonos = abonosDB.abonos || [];
      abonos = abonos.filter(
        (abono: any) =>
          abono.idRefineria?.id === activeRefineria?.id &&
          abono.tipoAbono === tipoAbono &&
          abono.tipoOperacion === tipoOperacion &&
          (!fechaInicio || new Date(abono.fecha) >= fechaInicio) &&
          (!fechaFin || new Date(abono.fecha) <= fechaFin)
      );
      setReporteData({
        tipoAbono,
        tipoOperacion,
        totalMonto: abonos.reduce((acc: number, ab: any) => acc + (ab.monto ?? 0), 0),
        cantidad: abonos.length,
        abonos,
      });
      setShowPreview(true);
    } catch (e) {
      setReporteData(null);
    }
    setLoading(false);
  };

  const handleGenerarReportePorProveedor = async () => {
    setLoading(true);
    try {
      const abonosDB = await getAbonos();
      let abonos = abonosDB.abonos || [];
      abonos = abonos.filter(
        (abono: any) =>
          abono.idRefineria?.id === activeRefineria?.id &&
          abono.tipoAbono === tipoAbono &&
          (!fechaInicio || new Date(abono.fecha) >= fechaInicio) &&
          (!fechaFin || new Date(abono.fecha) <= fechaFin) &&
          (!proveedor || abono.idContrato?.idContacto?.id === proveedor)
      );
      setReporteData({
        tipoAbono,
        proveedor,
        totalMonto: abonos.reduce((acc: number, ab: any) => acc + (ab.monto ?? 0), 0),
        cantidad: abonos.length,
        abonos,
      });
      setShowPreview(true);
    } catch (e) {
      setReporteData(null);
    }
    setLoading(false);
  };

  const handleGenerarCuentasPendientes = async () => {
    setLoading(true);
    try {
      const cuentasDB = await getCuentas();
      let cuentas = cuentasDB.cuentas || [];
      cuentas = cuentas.filter(
        (cuenta: any) =>
          cuenta.idRefineria?.id === activeRefineria?.id &&
          cuenta.tipoCuenta === tipoCuentaPendiente &&
          Number(cuenta.balancePendiente) > 0
      );
      setCuentasPendientes(cuentas);
      setTotalPendiente(
        cuentas.reduce((acc: number, c: any) => acc + Number(c.balancePendiente ?? 0), 0)
      );
      setShowPreview(true);
    } catch (e) {
      setCuentasPendientes([]);
      setTotalPendiente(0);
    }
    setLoading(false);
  };

  // Nuevo handler para cuentas pendientes por proveedor/cliente
  const handleGenerarCuentasPendientesPorProveedor = async () => {
    setLoading(true);
    try {
      const cuentasDB = await getCuentas();
      let cuentas = cuentasDB.cuentas || [];
      cuentas = cuentas.filter(
        (cuenta: any) =>
          cuenta.idRefineria?.id === activeRefineria?.id &&
          cuenta.tipoCuenta === tipoCuentaPendiente &&
          Number(cuenta.balancePendiente) > 0 &&
          (!pendienteProveedor || cuenta.idContacto?.id === pendienteProveedor)
      );
      setCuentasPendientes(cuentas);
      setTotalPendiente(
        cuentas.reduce((acc: number, c: any) => acc + Number(c.balancePendiente ?? 0), 0)
      );
      setShowPreview(true);
    } catch (e) {
      setCuentasPendientes([]);
      setTotalPendiente(0);
    }
    setLoading(false);
  };

  // --- RESET ---
  const handleVolver = () => {
    setReporteSeleccionado(null);
    setReporteData(null);
    setFechaInicio(null);
    setFechaFin(null);
    setProveedor(null);
    setCuentasPendientes([]);
    setShowPreview(false);
    setPendienteProveedor(null);
  };

  // --- TABLAS DE VISTA PREVIA ---
  const renderAbonosTable = (data: any) => (
    <motion.div
      className="overflow-x-auto mt-4"
      style={{ maxWidth: "1200px", margin: "0 auto" }}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
    >
      <table className="min-w-[900px] w-full text-sm border border-200">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
            <th className="p-2 border-b">Fecha</th>
            <th className="p-2 border-b">Contrato</th>
            <th className="p-2 border-b">Proveedor/Cliente</th>
            <th className="p-2 border-b">Tipo Operación</th>
            <th className="p-2 border-b">Monto</th>
          </tr>
        </thead>
        <tbody>
          {data.abonos.map((ab: any, idx: number) => (
            <motion.tr
              key={idx}
              className="hover:bg-blue-50"
              whileHover={{ scale: 1.01, backgroundColor: "#dbeafe" }}
              transition={{ type: "spring", stiffness: 250 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <td className="p-2 border-b">{ab.fecha ? new Date(ab.fecha).toLocaleDateString() : ""}</td>
              <td className="p-2 border-b">{ab.idContrato?.numeroContrato || ""}</td>
              <td className="p-2 border-b">{ab.idContrato?.idContacto?.nombre || ""}</td>
              <td className="p-2 border-b">{ab.tipoOperacion}</td>
              <td className="p-2 border-b">${ab.monto?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </motion.tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-blue-100">
            <td className="p-2 border-t" colSpan={4}>Total</td>
            <td className="p-2 border-t">${data.totalMonto?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
    </motion.div>
  );

  const renderCuentasPendientesTable = (cuentas: any[], total: number) => (
    <motion.div
      className="overflow-x-auto mt-4"
      style={{ maxWidth: "1200px", margin: "0 auto" }}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
    >
      <table className="min-w-[900px] w-full text-sm border border-200">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
            <th className="p-2 border-b">Fecha</th>
            <th className="p-2 border-b">Contrato</th>
            <th className="p-2 border-b">Proveedor/Cliente</th>
            <th className="p-2 border-b">Descripción</th>
            <th className="p-2 border-b">Monto Pendiente</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map((cuenta: any, idx: number) => (
            <motion.tr
              key={idx}
              className="hover:bg-blue-50"
              whileHover={{ scale: 1.01, backgroundColor: "#dbeafe" }}
              transition={{ type: "spring", stiffness: 250 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <td className="p-2 border-b">{cuenta.fecha ? new Date(cuenta.fecha).toLocaleDateString() : ""}</td>
              <td className="p-2 border-b">{cuenta.numeroContrato || cuenta.idContrato?.numeroContrato || ""}</td>
              <td className="p-2 border-b">{cuenta.idContacto?.nombre || ""}</td>
              <td className="p-2 border-b">{cuenta.descripcion || ""}</td>
              <td className="p-2 border-b">${Number(cuenta.balancePendiente).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </motion.tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-blue-100">
            <td className="p-2 border-t" colSpan={4}>Total</td>
            <td className="p-2 border-t">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
    </motion.div>
  );

  // --- RENDER ---
  return (
    <motion.div
      className="card surface-50 p-4 border-round shadow-2xl"
      style={{ maxWidth: 1300, margin: "0 auto" }}
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
        {tituloReporte}
      </motion.h2>

      {/* Selección de reporte con tarjetas cuadradas */}
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
            <div className="grid grid-nogutter sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {REPORTES.map((rep) => (
                <motion.div
                  key={rep.key}
                  className="flex justify-center"
                  whileHover={{ scale: 1.04, boxShadow: "0 6px 32px #2563eb22" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card
                    className={`w-full max-w-18rem min-h-18rem border-round-xl shadow-2xl cursor-pointer transition-all duration-200 ${rep.color}`}
                    style={{
                      border: "none",
                      minWidth: 220,
                      minHeight: 220,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      setReporteSeleccionado(rep.key);
                      setReporteData(null);
                      setFechaInicio(null);
                      setFechaFin(null);
                      setProveedor(null);
                      setCuentasPendientes([]);
                      setShowPreview(false);
                      setPendienteProveedor(null);
                    }}
                    title={rep.label}
                  >
                    <div className="flex flex-column align-items-center justify-content-center gap-3">
                      <div className="mb-2">{rep.icon}</div>
                      <span className="font-bold text-lg text-900 text-center" style={{ minHeight: 48 }}>
                        {rep.label}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario para el reporte de abonos por fecha */}
      <AnimatePresence mode="wait">
        {reporteSeleccionado === "abonosPorFecha" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="abonosPorFecha"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            {!showPreview ? (
              <>
                <div className="flex flex-wrap gap-4 justify-center mb-4">
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Tipo de Abono</label>
                    <Dropdown
                      value={tipoAbono}
                      options={TIPO_ABONO_OPTIONS}
                      onChange={(e) => setTipoAbono(e.value)}
                      placeholder="Seleccione tipo de abono"
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Fecha Inicio</label>
                    <Calendar
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.value as Date)}
                      dateFormat="yy-mm-dd"
                      showIcon
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Fecha Fin</label>
                    <Calendar
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.value as Date)}
                      dateFormat="yy-mm-dd"
                      showIcon
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 justify-center mb-4">
                  <div className="flex gap-3 justify-center">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        label="Visualizar Reporte"
                        icon="pi pi-eye"
                        className="p-button-raised p-button-primary"
                        style={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
                        onClick={handleGenerarReporte}
                        loading={loading}
                        disabled={!fechaInicio || !fechaFin}
                      />
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {reporteData && renderAbonosTable(reporteData)}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <PDFDownloadLink
                        document={
                          <AbonosPorMesTemplate
                            data={reporteData}
                            logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
                            fechaInicio={fechaInicio ?? undefined}
                            fechaFin={fechaFin ?? undefined}
                            tipoAbono={tipoAbono}
                          />
                        }
                        fileName={`ReporteAbonos_${fechaInicio?.toLocaleDateString()}_${fechaFin?.toLocaleDateString()}.pdf`}
                        className="p-button p-component p-button-success"
                      >
                        {({ loading }) => (
                          <span>{loading ? "Generando PDF..." : "Descargar Reporte PDF"}</span>
                        )}
                      </PDFDownloadLink>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario para el reporte de abonos por tipo de operación */}
      <AnimatePresence mode="wait">
        {reporteSeleccionado === "abonosPorTipoOperacion" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="abonosPorTipoOperacion"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            {!showPreview ? (
              <>
                <div className="flex flex-wrap gap-4 justify-center mb-4">
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Tipo de Abono</label>
                    <Dropdown
                      value={tipoAbono}
                      options={TIPO_ABONO_OPTIONS}
                      onChange={(e) => setTipoAbono(e.value)}
                      placeholder="Seleccione tipo de abono"
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Tipo de Operación</label>
                    <Dropdown
                      value={tipoOperacion}
                      options={TIPO_OPERACION_OPTIONS}
                      onChange={(e) => setTipoOperacion(e.value)}
                      placeholder="Seleccione tipo de operación"
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Fecha Inicio</label>
                    <Calendar
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.value as Date)}
                      dateFormat="yy-mm-dd"
                      showIcon
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Fecha Fin</label>
                    <Calendar
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.value as Date)}
                      dateFormat="yy-mm-dd"
                      showIcon
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 justify-center mb-4">
                  <div className="flex gap-3 justify-center">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        label="Visualizar Reporte"
                        icon="pi pi-eye"
                        className="p-button-raised p-button-primary"
                        style={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
                        onClick={handleGenerarReportePorTipoOperacion}
                        loading={loading}
                        disabled={!fechaInicio || !fechaFin}
                      />
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {reporteData && renderAbonosTable(reporteData)}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <PDFDownloadLink
                        document={
                          <AbonosPorMesTemplate
                            data={reporteData}
                            logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
                            fechaInicio={fechaInicio ?? undefined}
                            fechaFin={fechaFin ?? undefined}
                            tipoAbono={tipoAbono}
                          />
                        }
                        fileName={`ReporteAbonosPorOperacion_${tipoOperacion}_${fechaInicio?.toLocaleDateString()}_${fechaFin?.toLocaleDateString()}.pdf`}
                        className="p-button p-component p-button-success"
                      >
                        {({ loading }) =>
                          loading ? <span>Generando PDF...</span> : <span>Descargar Reporte PDF</span>
                        }
                      </PDFDownloadLink>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario para el reporte de abonos por proveedor */}
      <AnimatePresence mode="wait">
        {reporteSeleccionado === "abonosPorProveedor" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="abonosPorProveedor"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            {!showPreview ? (
              <>
                <div className="flex flex-wrap gap-4 justify-center mb-4">
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Proveedor</label>
                    <Dropdown
                      value={proveedor}
                      options={proveedores}
                      onChange={(e) => setProveedor(e.value)}
                      placeholder="Seleccione un proveedor"
                      className="w-full"
                      filter
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Tipo de Abono</label>
                    <Dropdown
                      value={tipoAbono}
                      options={TIPO_ABONO_OPTIONS}
                      onChange={(e) => setTipoAbono(e.value)}
                      placeholder="Seleccione tipo de abono"
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Fecha Inicio</label>
                    <Calendar
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.value as Date)}
                      dateFormat="yy-mm-dd"
                      showIcon
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Fecha Fin</label>
                    <Calendar
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.value as Date)}
                      dateFormat="yy-mm-dd"
                      showIcon
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 justify-center mb-4">
                  <div className="flex gap-3 justify-center">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        label="Visualizar Reporte"
                        icon="pi pi-eye"
                        className="p-button-raised p-button-primary"
                        style={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
                        onClick={handleGenerarReportePorProveedor}
                        loading={loading}
                        disabled={!fechaInicio || !fechaFin || !proveedor}
                      />
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {reporteData && renderAbonosTable(reporteData)}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <PDFDownloadLink
                        document={
                          <AbonosPorMesTemplate
                            data={reporteData}
                            logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
                            fechaInicio={fechaInicio ?? undefined}
                            fechaFin={fechaFin ?? undefined}
                            tipoAbono={tipoAbono}
                          />
                        }
                        fileName={`ReporteAbonosPorProveedor_${proveedor}_${fechaInicio?.toLocaleDateString()}_${fechaFin?.toLocaleDateString()}.pdf`}
                        className="p-button p-component p-button-success"
                      >
                        {({ loading }) =>
                          loading ? <span>Generando PDF...</span> : <span>Descargar Reporte PDF</span>
                        }
                      </PDFDownloadLink>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario para el reporte de cuentas pendientes */}
      <AnimatePresence mode="wait">
        {reporteSeleccionado === "cuentasPendientes" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="cuentasPendientes"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            {!showPreview ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-center text-primary">
                  Reporte de {tipoCuentaPendiente} Pendientes
                </h3>
                <div className="flex flex-wrap gap-4 justify-center mb-4">
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Tipo de Cuenta</label>
                    <Dropdown
                      value={tipoCuentaPendiente}
                      options={TIPO_CUENTA_OPTIONS}
                      onChange={(e) => setTipoCuentaPendiente(e.value)}
                      placeholder="Seleccione tipo de cuenta"
                      className="w-full"
                    />
                  </div>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      label="Visualizar Reporte"
                      icon="pi pi-eye"
                      className="p-button-raised p-button-primary"
                      style={{ minWidth: 220, fontWeight: 600, fontSize: 16, alignSelf: "end" }}
                      onClick={handleGenerarCuentasPendientes}
                      loading={loading}
                    />
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      label="Volver"
                      icon="pi pi-times"
                      className="p-button-raised"
                      style={{
                        minWidth: 120,
                        background: "#22c55e",
                        border: "none",
                        color: "#fff",
                        alignSelf: "end",
                      }}
                      onClick={handleVolver}
                    />
                  </motion.div>
                </div>
              </>
            ) : (
              <>
                {cuentasPendientes.length > 0 && renderCuentasPendientesTable(cuentasPendientes, totalPendiente)}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <PDFDownloadLink
                        document={
                          <CuentasPendientesTemplate
                            data={{
                              tipoCuenta: tipoCuentaPendiente,
                              cuentas: cuentasPendientes,
                              totalPendiente: totalPendiente,
                            }}
                            logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
                          />
                        }
                        fileName={`ReporteCuentasPendientes_${tipoCuentaPendiente}_${new Date().toLocaleDateString()}.pdf`}
                        className="p-button p-component p-button-success"
                      >
                        {({ loading }) =>
                          loading ? <span>Generando PDF...</span> : <span>Descargar Reporte PDF</span>
                        }
                      </PDFDownloadLink>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario para el reporte de cuentas pendientes por proveedor/cliente */}
      <AnimatePresence mode="wait">
        {reporteSeleccionado === "cuentasPendientesPorProveedor" && (
          <motion.div
            className="mb-4 p-3 bg-white border-round shadow-1"
            key="cuentasPendientesPorProveedor"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
          >
            {!showPreview ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-center text-primary">
                  Reporte de {tipoCuentaPendiente} Pendientes por {tipoCuentaPendiente === "Cuentas por Pagar" ? "Proveedor" : "Cliente"}
                </h3>
                <div className="flex flex-wrap gap-4 justify-center mb-4">
                  <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                    <label className="font-medium text-900">Tipo de Cuenta</label>
                    <Dropdown
                      value={tipoCuentaPendiente}
                      options={TIPO_CUENTA_OPTIONS}
                      onChange={(e) => setTipoCuentaPendiente(e.value)}
                      placeholder="Seleccione tipo de cuenta"
                      className="w-full"
                    />
                  </div>
                  {tipoCuentaPendiente && (
                    <div className="flex flex-column gap-2" style={{ minWidth: 180 }}>
                      <label className="font-medium text-900">
                        {tipoCuentaPendiente === "Cuentas por Pagar" ? "Proveedor" : "Cliente"}
                      </label>
                      <Dropdown
                        value={pendienteProveedor}
                        options={pendienteProveedores}
                        onChange={(e) => setPendienteProveedor(e.value)}
                        placeholder={`Seleccione un ${tipoCuentaPendiente === "Cuentas por Pagar" ? "proveedor" : "cliente"}`}
                        className="w-full"
                        filter
                        disabled={pendienteProveedores.length === 0}
                      />
                    </div>
                  )}
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      label="Visualizar Reporte"
                      icon="pi pi-eye"
                      className="p-button-raised p-button-primary"
                      style={{ minWidth: 220, fontWeight: 600, fontSize: 16, alignSelf: "end" }}
                      onClick={handleGenerarCuentasPendientesPorProveedor}
                      loading={loading}
                      disabled={!tipoCuentaPendiente}
                    />
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      label="Volver"
                      icon="pi pi-times"
                      className="p-button-raised"
                      style={{
                        minWidth: 120,
                        background: "#22c55e",
                        border: "none",
                        color: "#fff",
                        alignSelf: "end",
                      }}
                      onClick={handleVolver}
                    />
                  </motion.div>
                </div>
              </>
            ) : (
              <>
                {/* Resumen financiero del proveedor/cliente */}
                {pendienteProveedor && cuentasPendientes.length > 0 && (
                  <motion.div
                    className="mb-4 p-3 bg-blue-50 border-round shadow-1 flex flex-wrap gap-4 justify-center"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={fadeInUp}
                  >
                    <div>
                      <strong>{tipoCuentaPendiente === "Cuentas por Pagar" ? "Proveedor" : "Cliente"}:</strong>{" "}
                      {cuentasPendientes[0]?.idContacto?.nombre}
                    </div>
                    <div>
                      <strong>Total Cuentas:</strong> {cuentasPendientes.length}
                    </div>
                    <div>
                      <strong>Total Pendiente:</strong> ${totalPendiente.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </motion.div>
                )}
                {/* Mostrar la tabla SIEMPRE que existan cuentas */}
                {cuentasPendientes.length > 0 ? (
                  renderCuentasPendientesTable(cuentasPendientes, totalPendiente)
                ) : (
                  <motion.div
                    className="text-center text-900 font-medium my-4"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={fadeInUp}
                  >
                    No existen cuentas pendientes para el filtro seleccionado.
                  </motion.div>
                )}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <PDFDownloadLink
                        document={
                          <CuentasPendientesTemplate
                            data={{
                              tipoCuenta: tipoCuentaPendiente,
                              cuentas: cuentasPendientes,
                              totalPendiente: totalPendiente,
                            }}
                            logoUrl={activeRefineria?.img || "/layout/images/avatarHombre.png"}
                          />
                        }
                        fileName={`ReporteCuentasPendientesPorProveedor_${tipoCuentaPendiente}_${pendienteProveedor || "Todos"}_${new Date().toLocaleDateString()}.pdf`}
                        className="p-button p-component p-button-success"
                      >
                        {({ loading }) =>
                          loading ? <span>Generando PDF...</span> : <span>Descargar Reporte PDF</span>
                        }
                      </PDFDownloadLink>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
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
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReportesFinacierosList;