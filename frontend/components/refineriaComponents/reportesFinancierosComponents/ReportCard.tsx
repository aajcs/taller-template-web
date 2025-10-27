import React from "react";
import { Card } from "primereact/card";

interface ReportCardProps {
  icon: React.ReactNode;
  label: string;
  color?: string;
  onClick: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon, label, color = "", onClick }) => (
  <Card
    className={`w-full max-w-18rem min-h-18rem border-round-xl shadow-2xl cursor-pointer transition-all duration-200 ${color}`}
    style={{
      border: "none",
      minWidth: 220,
      minHeight: 220,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
    onClick={onClick}
    title={label}
  >
    <div className="flex flex-column align-items-center justify-content-center gap-3">
      <div className="mb-2">{icon}</div>
  {/* Solo el label de arriba, se elimina el de abajo */}
    </div>
  </Card>
);

export default ReportCard;