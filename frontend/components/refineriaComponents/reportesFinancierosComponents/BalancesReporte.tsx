import React, { useState, useEffect } from "react";
import { getBalances, obtenerBalancesPorRefineria } from "@/app/api/balanceService";
import { useRefineriaStore } from "@/store/refineriaStore";
import ReportCard from "./ReportCard";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportPDFButton from "./ReportPDFButton";


interface BalancesReporteProps {
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  renderPDFButton?: (data: any[]) => React.ReactNode;
}

const BalancesReporte: React.FC<BalancesReporteProps> = ({ fechaInicio, fechaFin, renderPDFButton }) => {
  const { activeRefineria } = useRefineriaStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      setLoading(true);
      let balances = [];
      if (activeRefineria?.id) {
        const res = await obtenerBalancesPorRefineria(activeRefineria.id);
        balances = res.balances || res || [];
      } else {
        const res = await getBalances();
        balances = res.balances || res || [];
      }
      // Filtrar por fecha de inicio y fin usando los campos correctos
      if (fechaInicio) {
        balances = balances.filter((b: any) => b.fechaInicio && new Date(b.fechaInicio) >= fechaInicio);
      }
      if (fechaFin) {
        balances = balances.filter((b: any) => b.fechaFin && new Date(b.fechaFin) <= fechaFin);
      }
      setData(balances);
      setLoading(false);
    };
    fetchBalances();
  }, [activeRefineria, fechaInicio, fechaFin]);

  const columns = [
    { field: "numeroBalance", header: "N° Balance" },
    { field: "fechaInicio", header: "Fecha Inicio" },
    { field: "fechaFin", header: "Fecha Fin" },
    { field: "totalBarrilesCompra", header: "Total Barriles Compra (bbls)" },
    { field: "totalBarrilesVenta", header: "Total Barriles Venta (bbls)" },
    { field: "diferenciaBarriles", header: "Diferencia Barriles (%)" },
    { field: "totalCompras", header: "Total Compras" },
    { field: "totalVentas", header: "Total Ventas" },
    { field: "ganancia", header: "Ganancia" },
    { field: "perdida", header: "Pérdida" },
  ];

  const getCellValue = (row: any, field: string) => {
    return field.split(".").reduce((acc, curr) => acc && acc[curr], row) ?? "";
  };

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card surface-50 p-4 border-round shadow-2xl">
          <h2 className="mb-4 text-2xl font-bold text-center text-primary">Reporte de Balances</h2>
          <ReportTable
            columns={columns}
            data={data.map(row => {
              const formatted: any = {};
              columns.forEach(col => {
                let value = getCellValue(row, col.field);
                if (col.field === "fechaInicio" && value) value = new Date(value).toLocaleDateString();
                if (col.field === "fechaFin" && value) value = new Date(value).toLocaleDateString();
                if (col.field === "totalBarrilesCompra" && value != null) value = `${Number(value).toLocaleString("de-DE")}`;
                if (col.field === "totalBarrilesVenta" && value != null) value = `${Number(value).toLocaleString("de-DE")}`;
                if (col.field === "diferenciaBarriles") {
                  if (row.totalBarrilesCompra != null && row.totalBarrilesVenta != null && row.totalBarrilesCompra > 0) {
                    const diferencia = row.totalBarrilesVenta - row.totalBarrilesCompra;
                    const porcentaje = (diferencia / row.totalBarrilesCompra) * 100;
                    value = `${porcentaje.toFixed(2)}%`;
                  } else {
                    value = "-";
                  }
                }
                if (["totalCompras", "totalVentas", "ganancia", "perdida"].includes(col.field) && value != null)
                  value = `$${Number(value).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                formatted[col.field] = value;
              });
              return formatted;
            })}
          />
          {renderPDFButton && renderPDFButton(data)}
        </div>
      </div>
    </div>
  );
};

export default BalancesReporte;
