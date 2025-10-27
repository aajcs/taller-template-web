// RUTA: /components/dashboards/sales/RevenueStream.tsx
import React, { useState, useEffect } from "react";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { ChartData, ChartOptions } from "chart.js";

const RevenueStream = () => {
  const [chartData, setChartData] = useState<ChartData<"pie">>({
    datasets: [],
  });
  const [chartOptions, setChartOptions] = useState<ChartOptions<"pie">>({});

  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const data: ChartData<"pie"> = {
      labels: ["Online", "Retail", "Partner"],
      datasets: [
        {
          data: [12, 32, 56],
          backgroundColor: [
            documentStyle.getPropertyValue("--indigo-500"),
            documentStyle.getPropertyValue("--teal-500"),
            documentStyle.getPropertyValue("--purple-500"),
          ],
          borderWidth: 0,
        },
      ],
    };
    const options: ChartOptions<"pie"> = {
      plugins: { legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false,
      cutout: 60,
    };

    setChartData(data);
    setChartOptions(options);
  }, []);

  return (
    <div className="card h-full">
      <div className="flex align-items-center justify-content-between mb-3">
        <h5 className="m-0">Revenue Stream</h5>
        <div className="flex align-items-center gap-2">
          <Button
            type="button"
            icon="pi pi-angle-left"
            rounded
            outlined
            className="p-button-plain h-2rem w-2rem p-0"
          ></Button>
          <Button
            type="button"
            icon="pi pi-angle-right"
            rounded
            outlined
            className="p-button-plain h-2rem w-2rem p-0"
          ></Button>
        </div>
      </div>
      <div className="flex flex-column align-items-center justify-content-center">
        <Chart
          type="doughnut"
          data={chartData}
          options={chartOptions}
          width="180"
          height="180"
          className="mb-5"
        ></Chart>
        <span className="font-bold mb-2">Total Revenue This Week</span>
        <span className="font-bold text-6xl mb-2">88k</span>
        <span className="font-bold mb-4 text-green-500">
          +21%
          <span className="text-color-secondary"> higher than last week</span>
        </span>
        <div className="flex align-items-center justify-content-center gap-3">
          <div className="flex align-items-center">
            <i className="pi pi-circle-on text-indigo-500"></i>
            <span className="text-color-secondary ml-2">Online</span>
          </div>
          <div className="flex align-items-center">
            <i className="pi pi-circle-on text-teal-500"></i>
            <span className="text-color-secondary ml-2">Retail</span>
          </div>
          <div className="flex align-items-center">
            <i className="pi pi-circle-on text-purple-500"></i>
            <span className="text-color-secondary ml-2">Partner</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueStream;
