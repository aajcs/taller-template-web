import React, { useRef } from "react";
import {
  CrudeToProductsResults,
  ProductsToCrudeResults,
  SimulationResults,
} from "@/types/simulador";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Message } from "primereact/message";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";

interface ResultsTableProps {
  results: SimulationResults | null;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  if (!results) return null;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (results.error) {
    return (
      <div className="p-4 flex justify-center">
        <Message
          severity="error"
          content={`Error en el cálculo: ${results.error}`}
        />
      </div>
    );
  }
  const generatePDF = async () => {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("resultados_simulacion.pdf");
  };
  const crudeToProductsResults = results as CrudeToProductsResults;
  const productsToCrudeResults = results as ProductsToCrudeResults;

  return (
    <div className="p-2">
      <div ref={pdfRef}>
        <h2 className="text-2xl font-bold text-primary mb-4">
          Resultados de la simulación
        </h2>

        <Panel
          header="Información del crudo procesado"
          className="shadow-3"
          toggleable
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            <div className="border-b pb-2">
              <p className="">
                <strong>Tipo:</strong> {results.crudeType}
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="">
                <strong>API:</strong> {results.crudeDetails.api}
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="">
                <strong>Azufre:</strong> {results.crudeDetails.sulfur}%
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="">
                <strong>Precio compra:</strong>{" "}
                {formatCurrency(results.crudeDetails.purchasePrice)}/bbl
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="">
                <strong>Transporte:</strong>{" "}
                {formatCurrency(results.crudeDetails.transportCost)}/bbl
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="">
                <strong>Operacional:</strong>{" "}
                {formatCurrency(results.crudeDetails.operationalCost)}/bbl
              </p>
            </div>

            <div className="col-span-2 md:col-span-3 text-center font-semibold text-lg text-blue-700 bg-blue-50 p-2 rounded-lg">
              <p>
                <strong>Cantidad:</strong> {formatNumber(results.crudeAmount)}{" "}
                bbl
              </p>
            </div>
            <div className="col-span-2 md:col-span-3 text-center font-semibold text-lg text-blue-700 bg-blue-50 p-2 rounded-lg">
              <p>
                <strong>Cantidad (días):</strong>{" "}
                {formatNumber(crudeToProductsResults.crudeAmountDays)} días
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          header="Resultados de producción"
          className="mt-4 shadow-3"
          toggleable
        >
          <DataTable
            value={Object.entries(crudeToProductsResults.production)
              .filter(([, amount]) => amount > 0)
              .map(([product, amount]) => {
                const unitPrice =
                  results.financials.productRevenues[
                    product as keyof typeof results.financials.productRevenues
                  ] / amount || 0;
                const bunker =
                  results.financials.productBunkerCosts[
                    product as keyof typeof results.financials.productBunkerCosts
                  ] / amount || 0;
                const transporte =
                  results.financials.productTransportCosts[
                    product as keyof typeof results.financials.productTransportCosts
                  ] / amount || 0;
                const revenue =
                  results.financials.productRevenues[
                    product as keyof typeof results.financials.productRevenues
                  ] +
                  results.financials.productBunkerCosts[
                    product as keyof typeof results.financials.productBunkerCosts
                  ] +
                  results.financials.productTransportCosts[
                    product as keyof typeof results.financials.productTransportCosts
                  ];
                return {
                  product,
                  amount,
                  unitPrice,
                  bunker,
                  transporte,
                  revenue,
                  yield: (amount / crudeToProductsResults.crudeAmount) * 100,
                };
              })}
            className="p-datatable-sm"
            rowClassName={() => "animated-row"}
            size="small"
          >
            <Column field="product" header="Producto" />
            <Column
              field="amount"
              header="Cantidad (bbl)"
              body={(rowData) => formatNumber(rowData.amount)}
            />
            <Column
              field="unitPrice"
              header="Precio unitario"
              body={(rowData) => formatCurrency(rowData.unitPrice)}
            />
            <Column
              field="bunker"
              header="Precio Bunker"
              body={(rowData) => formatCurrency(rowData.bunker)}
            />
            <Column
              field="transporte"
              header="Precio Transporte"
              body={(rowData) => formatCurrency(rowData.transporte)}
            />
            <Column
              field="revenue"
              header="Ingresos"
              body={(rowData) => formatCurrency(rowData.revenue)}
            />
            <Column
              field="yield"
              header="Rendimiento"
              body={(rowData) => `${rowData.yield.toFixed(1)}%`}
            />
          </DataTable>
        </Panel>
        <Panel
          header="Análisis Financiero"
          className="mt-4 shadow-3"
          toggleable
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Card title="Ingresos Totales" className="mr-4">
                <div className="text-xl text-green-600">
                  {formatCurrency(results.financials.totalIngresos)}
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCurrency(
                      results.financials.totalIngresos /
                        ((results as CrudeToProductsResults).crudeAmount ||
                          (results as ProductsToCrudeResults).requiredCrude)
                    )}{" "}
                    por barril de crudo
                  </p>
                </div>
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer">
                    Detalle de ingresos
                  </summary>
                  <ul className="pl-5 mt-1 space-y-1">
                    {Object.entries(results.financials.productRevenues).map(
                      ([product, revenue]) => (
                        <li key={product}>
                          {product}: {formatCurrency(revenue)}
                        </li>
                      )
                    )}
                    <li>
                      Transporte:
                      {formatCurrency(results.financials.totalTransportCosts)}
                    </li>
                    <li>
                      Bunker:{" "}
                      {formatCurrency(results.financials.totalBunkerCosts)}
                    </li>
                  </ul>
                </details>
              </Card>
            </div>
            <div>
              <Card title="Costos Totales" className="">
                <div className="text-xl text-red-600">
                  {formatCurrency(results.financials.costs.total)}
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCurrency(
                      results.financials.costs.total /
                        ((results as CrudeToProductsResults).crudeAmount ||
                          (results as ProductsToCrudeResults).requiredCrude)
                    )}{" "}
                    por barril de crudo
                  </p>
                </div>
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer">
                    Detalle de costos
                  </summary>
                  <ul className="pl-5 mt-1 space-y-1">
                    <li>
                      Compra crudo:{" "}
                      {formatCurrency(results.financials.costs.purchase)}
                    </li>
                    <li>
                      Transporte:{" "}
                      {formatCurrency(results.financials.costs.transport)}
                    </li>
                    <li>
                      Operacional:{" "}
                      {formatCurrency(results.financials.costs.operational)}
                    </li>
                  </ul>
                </details>
              </Card>
            </div>

            <Divider layout="vertical" />
            <div className="flex justify-content-center">
              <div className="p-4 pb-0 border-round shadow-2 bg-blue-50 w-full md:w-auto">
                {/* Utilidad Bruta */}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">
                    Utilidad Bruta:
                  </h4>
                  <p
                    className={`text-xl font-bold ${
                      results.financials.grossProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(results.financials.grossProfit)}
                  </p>
                </div>

                {/* Margen de Ganancia */}
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">
                    Margen de Ganancia:
                  </h4>
                  <p
                    className={`text-xl font-bold ${
                      results.financials.profitMargin >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {results.financials.profitMargin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <Button
        label="Exportar PDF"
        icon="pi pi-file-pdf"
        className="mt-3"
        onClick={generatePDF}
      />
    </div>
  );
}
