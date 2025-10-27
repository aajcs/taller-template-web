import { Fragment, useEffect, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";

import {
  CrudeToProductsResults,
  ProductsToCrudeResults,
  SimulationResults,
  Product,
} from "@/types/simulador";
import { useRefineryPrecios } from "@/hooks/useRefineryPrecios";
import { Tag } from "primereact/tag";
import { getRefinerias } from "@/app/api/refineriaService";
import { TipoProducto } from "@/libs/interfaces";
import { calculateDerivatives } from "@/utils/refineryCalculations";
import ResultsTable from "./ResultsTable";
import SimulatorForm from "./SimulatorForm";

export default function Home() {
  const { loading, brent, oilDerivate } = useRefineryPrecios();

  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = async (data: {
    mode: "crudeToProducts" | "productsToCrude";
    crudeType: TipoProducto & { estado: string };
    desiredProducts: Partial<Record<Product, number>>;
    crudeAmount?: number;
  }) => {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if ("crudeAmount" in data) {
        const calculation = calculateDerivatives(
          data.crudeType,
          data.crudeAmount!
        );
        setResults(calculation as CrudeToProductsResults);
      }
      // else {
      //   const calculation = calculateRequiredCrude(
      //     data.crudeType,
      //     Object.fromEntries(
      //       Object.entries(data.desiredProducts!).map(([key, value]) => [
      //         key,
      //         value ?? 0,
      //       ])
      //     ) as Record<Product, number>,
      //     Object.fromEntries(
      //       Object.entries(data.productPrices).map(([key, value]) => [
      //         key,
      //         value ?? 0,
      //       ])
      //     ) as Record<Product, number>,
      //     data.crudeCosts
      //   );
      //   setResults((calculation as SimulationResults) || null);
      // }
    } catch (error) {
      console.error("Error en el cálculo:", error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };
  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <ProgressSpinner />
        {/* <p className="ml-3">Cargando datos...</p> */}
      </div>
    );
  }
  const renderResults = () => {
    if (isLoading) {
      return (
        <Card className="text-center">
          <div className="flex flex-column align-items-center gap-3">
            <ProgressSpinner
              style={{ width: "50px", height: "50px" }}
              strokeWidth="4"
              animationDuration=".5s"
            />
            <span className="text-color-secondary">
              Procesando simulación...
            </span>
          </div>
        </Card>
      );
    }

    if (results) {
      return <ResultsTable results={results} />;
    }

    return (
      <Card className="text-center">
        <div className="flex flex-column gap-2">
          <i
            className="pi pi-info-circle text-color-secondary"
            style={{ fontSize: "2rem" }}
          ></i>
          <p className="text-color-secondary">
            Ingresa los parámetros y haz clic en "Calcular" para ver los
            resultados
          </p>
          <small className="text-color-secondary">
            Puedes simular desde crudo a derivados o desde derivados a crudo
          </small>
        </div>
      </Card>
    );
  };
  const filteredDerivates = Object.entries(oilDerivate)
    .filter(([_, price]) => typeof price === "string" && parseFloat(price) > 0)
    .map(([type, price]) => ({
      name: type.toUpperCase(),
      value: `$${
        typeof price === "string" ? parseFloat(price).toFixed(2) : "0.00"
      }`,
    }));
  return (
    <div className="container ">
      <div className="p-fluid">
        {/* <div className="p-2 shadow-6 bg-gradient-to-r from-blue-600 to-blue-500 border-round-xl relative mb-6"> */}
        <div className="mb-2">
          <div className="marquee-container h-3rem">
            {/* Indicador de progreso */}
            <div
              className="marquee-progress"
              style={{ animationDuration: `${filteredDerivates.length * 5}s` }}
            />

            <div
              className="marquee-track gap-1"
              onMouseEnter={() => {
                const marqueeTrack = document.querySelector(".marquee-track");
                marqueeTrack?.classList.add("paused");
              }}
              onMouseLeave={() => {
                const marqueeTrack = document.querySelector(".marquee-track");
                marqueeTrack?.classList.remove("paused");
              }}
            >
              {[...Array(4)].map((_, copy) => (
                <Fragment key={copy}>
                  <Tag
                    value={`🛢️ Brent: $${brent.toFixed(2)}`}
                    severity="info"
                    className="marquee-item text-xl font-bold px-5 py-2 text-white border-1 border-blue-200 "
                    icon="pi pi-chart-line"
                  />

                  {filteredDerivates.map((item) => (
                    <Tag
                      key={`${item.name}_copy-${copy}`}
                      value={`⛽ ${item.name}: ${item.value}`}
                      severity="success"
                      className="marquee-item text-xl font-bold px-5 py-2 text-white border-1 border-blue-200 "
                      icon="pi pi-dollar"
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="grid formgrid row-gap-2 ">
          <div className="col-12 lg:col-6">
            <SimulatorForm
              onCalculate={handleCalculate}
              isLoading={isLoading}
            />
          </div>

          <div className="col-12 lg:col-6">{renderResults()}</div>
        </div>
      </div>
    </div>
  );
}
