import { useEffect, useState } from "react";
import {
  format,
  parseISO,
  startOfDay,
  compareAsc,
  differenceInDays,
} from "date-fns";
import { CorteRefinacion, TorreDestilacion } from "@/libs/interfaces";

interface DailyPerformance {
  date: Date;
  rawMaterial: {
    totalUsed: number;
    tanks: Array<{
      id: string;
      name: string;
      product: string;
      initialQty: number;
      finalQty: number;
      consumed: number;
    }>;
  };
  derivatives: {
    totalProduced: number;
    expectedYield: number;
    actualYield: number;
    products: Array<{
      id: string;
      name: string;
      produced: number;
      expectedPercentage: number;
      actualPercentage: number;
      tanks: Array<{
        id: string;
        name: string;
        quantity: number;
      }>;
    }>;
  };
  efficiency: number;
}

interface RefineryDashboardProps {
  torre: TorreDestilacion;
  corteRefinacions: CorteRefinacion[];
}

export default function RefineryDashboard({
  torre,
  corteRefinacions,
}: RefineryDashboardProps) {
  const [performanceData, setPerformanceData] = useState<DailyPerformance[]>(
    []
  );

  useEffect(() => {
    const calculatePerformance = () => {
      const dailyMap = new Map<string, DailyPerformance>();
      const tankRegistry = new Map<
        string,
        {
          type: "materia-prima" | "derivado";
          productId: string;
          lastQuantity: number;
          lastDate: Date;
        }
      >();

      const sortedCortes = [...corteRefinacions].sort((a, b) =>
        compareAsc(parseISO(a.fechaCorte), parseISO(b.fechaCorte))
      );

      sortedCortes.forEach((corte) => {
        const corteDate = parseISO(corte.fechaCorte);
        const dayKey = format(startOfDay(corteDate), "yyyy-MM-dd");

        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            date: startOfDay(corteDate),
            rawMaterial: {
              totalUsed: 0,
              tanks: [],
            },
            derivatives: {
              totalProduced: 0,
              expectedYield: torre.material.reduce(
                (acc: number, m: any) =>
                  acc +
                  (m.idProducto.tipoMaterial === "Derivado" ? m.porcentaje : 0),
                0
              ),
              actualYield: 0,
              products: [],
            },
            efficiency: 0,
          });
        }

        const dailyData = dailyMap.get(dayKey)!;

        corte.corteTorre.forEach((corteTorre: any) => {
          corteTorre.detalles.forEach((detalle: any) => {
            const tankId = detalle.idTanque?._id;
            const tankName =
              detalle.idTanque?.nombre || "Tanque no identificado";
            const product = detalle.idProducto;
            const currentQty = detalle.cantidad;

            if (!tankId || !product) return;

            const tankType =
              product.tipoMaterial === "Materia Prima"
                ? "materia-prima"
                : "derivado";

            if (!tankRegistry.has(tankId)) {
              tankRegistry.set(tankId, {
                type: tankType,
                productId: product._id,
                lastQuantity: currentQty,
                lastDate: corteDate,
              });
            } else {
              const tankData = tankRegistry.get(tankId)!;
              const daysDiff = differenceInDays(corteDate, tankData.lastDate);

              // Calcular consumo/producción acumulado
              let processed = 0;
              if (tankType === "materia-prima") {
                processed = tankData.lastQuantity - currentQty;
              } else {
                processed = currentQty - tankData.lastQuantity;
              }

              if (processed > 0) {
                if (tankType === "materia-prima") {
                  dailyData.rawMaterial.totalUsed += processed;
                  dailyData.rawMaterial.tanks.push({
                    id: tankId,
                    name: tankName,
                    product: product.nombre,
                    initialQty: tankData.lastQuantity,
                    finalQty: currentQty,
                    consumed: processed,
                  });
                } else {
                  dailyData.derivatives.totalProduced += processed;
                  const productEntry = dailyData.derivatives.products.find(
                    (p) => p.id === product._id
                  );

                  if (productEntry) {
                    productEntry.produced += processed;
                  } else {
                    dailyData.derivatives.products.push({
                      id: product._id,
                      name: product.nombre,
                      produced: processed,
                      expectedPercentage:
                        torre.material.find(
                          (m: any) => m.idProducto._id === product._id
                        )?.porcentaje || 0,
                      actualPercentage: 0,
                      tanks: [
                        {
                          id: tankId,
                          name: tankName,
                          quantity: processed,
                        },
                      ],
                    });
                  }
                }

                // Actualizar últimos valores registrados
                tankData.lastQuantity = currentQty;
                tankData.lastDate = corteDate;
              }
            }
          });
        });
      });

      // Calcular porcentajes y eficiencia
      dailyMap.forEach((day) => {
        day.derivatives.products.forEach((product) => {
          product.actualPercentage =
            day.rawMaterial.totalUsed > 0
              ? (product.produced / day.rawMaterial.totalUsed) * 100
              : 0;
        });

        day.derivatives.actualYield = day.derivatives.products.reduce(
          (acc, product) => acc + product.actualPercentage,
          0
        );

        day.efficiency =
          day.derivatives.actualYield > 0
            ? (day.derivatives.actualYield / day.derivatives.expectedYield) *
              100
            : 0;
      });

      setPerformanceData(Array.from(dailyMap.values()));
    };

    calculatePerformance();
  }, [torre, corteRefinacions]);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">
        Dashboard de Rendimiento - {torre.nombre}
      </h1>

      {performanceData.map((day, i) => (
        <div key={i} className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 p-2 bg-blue-50 rounded">
            <h2 className="text-xl font-semibold">
              {format(day.date, "dd/MM/yyyy")}
            </h2>
            <div className="text-right">
              <p className="font-medium">
                Eficiencia del día: {day.efficiency.toFixed(1)}%
              </p>
              <p className="text-sm">
                MP Usada: {day.rawMaterial.totalUsed.toLocaleString()} bls |
                Derivados: {day.derivatives.totalProduced.toLocaleString()} bls
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sección Materia Prima */}
            <div className="p-3 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Consumo de Materia Prima</h3>
              {day.rawMaterial.tanks.map((tank, j) => (
                <div key={j} className="mb-2 p-2 bg-white rounded">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">{tank.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({tank.product})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-green-600">
                          +{tank.consumed.toLocaleString()} bls
                        </span>
                        <span className="mx-2">|</span>
                        <span>
                          {tank.finalQty.toLocaleString()} bls restantes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sección Derivados */}
            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-semibold mb-2">Producción de Derivados</h3>
              {day.derivatives.products.map((product, j) => (
                <div key={j} className="mb-2 p-2 bg-white rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        Esperado: {product.expectedPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          product.actualPercentage >= product.expectedPercentage
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.actualPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm">
                        {product.produced.toLocaleString()} bls
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
