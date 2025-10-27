import React from "react";

interface ReportResumenProps {
  resumen: { label: string; value: string | number }[];
}

const ReportResumen: React.FC<ReportResumenProps> = ({ resumen }) => (
  <div className="mb-4 p-3 bg-blue-50 border-round shadow-1 flex flex-wrap gap-4 justify-center">
    {resumen.map((item, idx) => (
      <div key={idx}>
        <strong>{item.label}:</strong> {item.value}
      </div>
    ))}
  </div>
);

export default ReportResumen;