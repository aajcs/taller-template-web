import { CorteRefinacion, TorreDestilacion } from "@/libs/interfaces";
import React from "react";

interface CalculoTorreDestilacionProps {
  torre: TorreDestilacion;
  corteRefinacion: CorteRefinacion[];
}

const CalculoTorreDestilacion = ({
  torre,
  corteRefinacion,
}: CalculoTorreDestilacionProps) => {
  // Filter details for the current tower

  const torreCorte = corteRefinacion
    ?.map((cr) => cr?.corteTorre)
    .flat()
    .find((corte) => corte?.idTorre?.id === torre.id);

  // Merge materials with details
  const mergedMaterials = torre.material.map((material) => {
    const detalle = torreCorte?.detalles.find(
      (d) => d.idProducto?.id === material.idProducto?.id
    );

    return {
      ...material,
      cantidad: detalle?.cantidad || 0,
    };
  });

  // Separate raw materials (Materia Prima)
  const rawMaterial = torreCorte?.detalles.find(
    (detalle) => detalle.idProducto?.tipoMaterial === "Materia Prima"
  );

  // Function to calculate production percentage
  const calculateProductionPercentage = (
    previousCorte: CorteRefinacion,
    currentCorte: CorteRefinacion
  ) => {
    const previousTotal = previousCorte.corteTorre[0]?.detalles.reduce(
      (sum, detalle) => sum + detalle.cantidad,
      0
    );
    const currentTotal = currentCorte.corteTorre[0]?.detalles.reduce(
      (sum, detalle) => sum + detalle.cantidad,
      0
    );

    if (previousTotal && currentTotal) {
      return ((currentTotal - previousTotal) / previousTotal) * 100;
    }
    return 0;
  };

  // Compare the last two cortes
  const sortedCortes = [...corteRefinacion].sort(
    (a, b) =>
      new Date(a.fechaCorte).getTime() - new Date(b.fechaCorte).getTime()
  );

  const productionPercentage =
    sortedCortes.length >= 2
      ? calculateProductionPercentage(
          sortedCortes[sortedCortes.length - 2],
          sortedCortes[sortedCortes.length - 1]
        )
      : null;

  return (
    <div>
      <h2>{torre.nombre}</h2>

      {/* Raw Material Card */}
      {rawMaterial && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3>Materia Prima</h3>
          <p>Producto: {rawMaterial.idProducto?.nombre || "Desconocido"}</p>
          <p>Cantidad: {rawMaterial.cantidad} bpd</p>
        </div>
      )}

      {/* Material Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {mergedMaterials.map((material, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              width: "200px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3>{material.idProducto?.nombre || "Material sin nombre"}</h3>
            <p>
              Estado:{" "}
              {material.estadoMaterial === "True" ? "Operativo" : "Inactivo"}
            </p>
            <p>Porcentaje: {material.porcentaje}%</p>
            <p>Cantidad: {material.cantidad} bpd</p>
          </div>
        ))}
      </div>

      {/* Production Percentage */}
      {productionPercentage !== null && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            border: "1px solid #4caf50",
            borderRadius: "8px",
            backgroundColor: "#e8f5e9",
          }}
        >
          <h3>Porcentaje de Producción</h3>
          <p>Cambio en la producción: {productionPercentage.toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default CalculoTorreDestilacion;
