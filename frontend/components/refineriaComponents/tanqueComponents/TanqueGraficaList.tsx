"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRefineriaStore } from "@/store/refineriaStore";
import { useRefineryData } from "@/hooks/useRefineryData";
import { Card } from "primereact/card";
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { MultiSelect } from "primereact/multiselect";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Nullable } from "primereact/ts-helpers";
import { useByRefineryData } from "@/hooks/useByRefineryData";
import { Skeleton } from "primereact/skeleton"; // añadido

// Componente memoizado para el gráfico de almacenamiento
const StorageBarChart = React.memo(
  ({ chequeoCantidads }: { chequeoCantidads: any[] }) => {
    // normalizar colores (hex 3 o 6 dígitos) y añadir '#'
    const normalizeHexColor = (raw?: string, fallback = "#66BB6A") => {
      if (!raw) return fallback;
      let v = raw.trim();
      if (!v.startsWith("#")) v = `#${v}`;
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return fallback;
      return v.toUpperCase();
    };

    const barChartData = useMemo(() => {
      // Mapear último chequeo por tanque (por fecha)
      const lastByTank: Record<
        string,
        { nombre: string; cantidad: number; color: string; fecha: string }
      > = {};

      chequeoCantidads.forEach((c) => {
        if (c.aplicar?.tipo !== "Tanque" || !c.aplicar.idReferencia) return;
        const id = c.aplicar.idReferencia.id;
        const nombre: string = c.aplicar.idReferencia.nombre || "";
        if (!nombre || nombre === "Desconocido") return; // excluir desconocidos
        const fecha: string = c.fechaChequeo;
        const cantidad: number = c.cantidad ?? 0;
        const color = normalizeHexColor(c.idProducto?.color);
        if (
          !lastByTank[id] ||
          new Date(fecha) > new Date(lastByTank[id].fecha)
        ) {
          lastByTank[id] = { nombre, cantidad, color, fecha };
        }
      });

      const dataArray = Object.values(lastByTank).sort(
        (a, b) => b.cantidad - a.cantidad
      ); // opcional: ordenar descendente

      return {
        labels: dataArray.map((d) => d.nombre),
        datasets: [
          {
            label: "Última Lectura (Bbl)",
            data: dataArray.map((d) => d.cantidad),
            backgroundColor: dataArray.map((d) => d.color),
          },
        ],
      };
    }, [chequeoCantidads]);

    const barChartOptions = useMemo(
      () => ({
        indexAxis: "x",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Tanques" } },
          y: { beginAtZero: true, title: { display: true, text: "Bbl" } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.parsed.y?.toLocaleString()} Bbl`,
            },
          },
        },
      }),
      []
    );

    if (!barChartData.labels.length) {
      return (
        <Card title="Última Lectura por Tanque" className="p-0 ">
          <div className="p-4 text-sm text-color-secondary">Sin lecturas.</div>
        </Card>
      );
    }

    return (
      <Card title="Última Lectura por Tanque" className="p-0 ">
        <div style={{ height: "300px" }}>
          <Chart
            type="bar"
            data={barChartData}
            options={barChartOptions}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Card>
    );
  }
);

// Componente memoizado para los controles de filtrado
const FilterControls = React.memo(
  ({
    filterType,
    setFilterType,
    customRange,
    setCustomRange,
    selectedDay,
    setSelectedDay,
    selectedMonth,
    setSelectedMonth,
  }: {
    filterType: string;
    setFilterType: (value: any) => void;
    customRange: Nullable<(Date | null)[]>;
    setCustomRange: (value: any) => void;
    selectedDay: Nullable<Date>;
    setSelectedDay: (value: any) => void;
    selectedMonth: Nullable<Date>;
    setSelectedMonth: (value: any) => void;
  }) => {
    const filterOptions = useMemo(
      () => [
        { label: "Día", value: "day" },
        { label: "Mes", value: "month" },
        { label: "Año", value: "year" },
        { label: "Personalizado", value: "custom" },
      ],
      []
    );

    return (
      <div className="flex flex-col md:flex-row items-start gap-3">
        <Dropdown
          value={filterType}
          options={filterOptions}
          onChange={(e) => setFilterType(e.value)}
          placeholder="Selecciona filtro"
          className="w-full md:w-6"
        />
        {filterType === "custom" && (
          <div className="mt-3 md:mt-0">
            <Calendar
              value={customRange}
              onChange={(e) => setCustomRange(e.value)}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
            />
          </div>
        )}
        {filterType === "day" && (
          <div className="mt-3 md:mt-0">
            <Calendar
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.value)}
              selectionMode="single"
              placeholder="Selecciona un día"
              className="w-full "
            />
          </div>
        )}
        {filterType === "month" && (
          <div className="mt-3 md:mt-0">
            <Calendar
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.value)}
              view="month"
              dateFormat="mm/yy"
              placeholder="Selecciona un mes"
            />
          </div>
        )}
      </div>
    );
  }
);

// Componente principal refactorizado
const TanqueGraficaList: React.FC = () => {
  const { activeRefineria } = useRefineriaStore();
  const { chequeoCantidads = [], loading } = useByRefineryData(
    activeRefineria?.id || ""
  ); // añadido loading

  // Skeleton components & staged reveal ---------------------------------
  const FiltersSkeleton = () => (
    <Card title="Nivel de Tanque" className="p-0 mb-3">
      <div className="p-3">
        <div className="grid formgrid">
          <div className="col-12 md:col-6 flex flex-column gap-2">
            <Skeleton height="2.5rem" borderRadius="8px" />
            <Skeleton height="2.5rem" borderRadius="8px" />
          </div>
          <div className="col-12 md:col-6 flex flex-column gap-2">
            <Skeleton height="2.5rem" borderRadius="8px" />
            <div className="flex gap-2">
              <Skeleton height="2.5rem" width="50%" borderRadius="8px" />
              <Skeleton height="2.5rem" width="50%" borderRadius="8px" />
            </div>
          </div>
        </div>
        <Skeleton height="260px" borderRadius="12px" className="mt-3" />
      </div>
    </Card>
  );

  const StorageSkeleton = () => (
    <Card title="Última Lectura por Tanque" className="p-0 ">
      <div className="p-3">
        <Skeleton height="300px" borderRadius="12px" />
      </div>
    </Card>
  );

  const [stage, setStage] = useState(0); // 0 filtros, 1 charts, 2 storage, 3 listo
  useEffect(() => {
    if (loading) {
      setStage(0);
      const t1 = setTimeout(() => setStage((s) => (s < 1 ? 1 : s)), 150);
      const t2 = setTimeout(() => setStage((s) => (s < 2 ? 2 : s)), 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setStage(3);
    }
  }, [loading]);

  // Filtrar chequeos aplicados a tanques y extraer tanques únicos
  const tanks = useMemo(() => {
    const map: Record<string, { nombre: string; color?: string }> = {};
    chequeoCantidads.forEach((c) => {
      if (c.aplicar.tipo === "Tanque" && c.aplicar.idReferencia) {
        const tanqueId = c.aplicar.idReferencia.id;
        const tanqueNombre = c.aplicar.idReferencia.nombre ?? "Desconocido";
        const color = c.idProducto?.color;
        map[tanqueId] = { nombre: tanqueNombre, color: color };
      }
    });
    return Object.entries(map).map(([id, data]) => ({
      id,
      nombre: data.nombre,
      color: data.color,
    }));
  }, [chequeoCantidads]);

  // Estados
  const [selectedTanks, setSelectedTanks] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<
    "day" | "week" | "month" | "quarter" | "semester" | "year" | "custom"
  >("day");
  const [customRange, setCustomRange] =
    useState<Nullable<(Date | null)[]>>(null);
  const [selectedDay, setSelectedDay] = useState<Nullable<Date>>(null);
  const [selectedMonth, setSelectedMonth] = useState<Nullable<Date>>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // Nueva lógica: seleccionar todos los tanques por defecto
  useEffect(() => {
    if (tanks.length && selectedTanks.length === 0) {
      setSelectedTanks(tanks.map((t) => t.id));
    }
  }, [tanks, selectedTanks.length]);

  // Efecto para establecer día por defecto
  useEffect(() => {
    if (filterType === "day" && !selectedDay) {
      setSelectedDay(new Date());
    }
  }, [filterType, selectedDay]);

  // Calcular rango de fechas
  useEffect(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (filterType) {
      case "day":
        if (selectedDay) {
          start = new Date(selectedDay);
          end = new Date(selectedDay);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          setDateRange([start, end]);
        }
        break;
      case "month":
        start = startOfMonth(selectedMonth || now);
        end = endOfMonth(selectedMonth || now);
        setDateRange([start, end]);
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        setDateRange([start, end]);
        break;
      case "custom":
        if (customRange && customRange[0] && customRange[1]) {
          start = new Date(customRange[0]);
          end = new Date(customRange[1]);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          setDateRange([start, end]);
        }
        break;
      default:
        setDateRange(null);
    }
  }, [filterType, selectedDay, customRange, selectedMonth]);

  // Datos filtrados para múltiples tanques (memoizado)
  const filteredData = useMemo(() => {
    if (selectedTanks.length === 0 || !dateRange) return {};

    const [startDate, endDate] = dateRange;
    const result: Record<
      string,
      { date: Date; cantidad: number; hora: string }[]
    > = {};

    selectedTanks.forEach((tankId) => {
      result[tankId] = [];
    });

    if (filterType === "day") {
      chequeoCantidads
        .filter(
          (c) =>
            c.aplicar.tipo === "Tanque" &&
            c.aplicar.idReferencia &&
            selectedTanks.includes(c.aplicar.idReferencia.id) &&
            parseISO(c.fechaChequeo) >= startDate &&
            parseISO(c.fechaChequeo) <= endDate
        )
        .forEach((c) => {
          const tankId = c.aplicar.idReferencia.id;
          const fecha = parseISO(c.fechaChequeo);
          result[tankId].push({
            date: fecha,
            cantidad: c.cantidad,
            hora: format(fecha, "HH:mm"),
          });
        });

      selectedTanks.forEach((tankId) => {
        result[tankId].sort((a, b) => a.date.getTime() - b.date.getTime());
      });
    } else {
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

      daysInRange.forEach((day) => {
        const chequeosDia = chequeoCantidads
          .filter(
            (c) =>
              c.aplicar.tipo === "Tanque" &&
              c.aplicar.idReferencia &&
              selectedTanks.includes(c.aplicar.idReferencia.id) &&
              isSameDay(parseISO(c.fechaChequeo), day)
          )
          .sort(
            (a, b) =>
              parseISO(b.fechaChequeo).getTime() -
              parseISO(a.fechaChequeo).getTime()
          );

        const byTank: Record<string, (typeof chequeosDia)[0]> = {};
        chequeosDia.forEach((c) => {
          const tankId = c.aplicar.idReferencia.id;
          if (!byTank[tankId]) byTank[tankId] = c;
        });

        Object.entries(byTank).forEach(([tankId, chequeo]) => {
          result[tankId].push({
            date: parseISO(chequeo.fechaChequeo),
            cantidad: chequeo.cantidad,
            hora: format(day, "dd/MM"),
          });
        });
      });

      selectedTanks.forEach((tankId) => {
        result[tankId].sort((a, b) => a.date.getTime() - b.date.getTime());
      });
    }

    return result;
  }, [chequeoCantidads, selectedTanks, filterType, dateRange]);

  // Configuración de gráficos para múltiples tanques
  const lineChartData = useMemo(() => {
    if (selectedTanks.length === 0) return { labels: [], datasets: [] };

    const datasets = selectedTanks.map((tankId, index) => {
      const tank = tanks.find((t) => t.id === tankId);
      const tankName = tank?.nombre || "Tanque";
      const color = `#${tank?.color}` || "#42A5F5";
      const tankData = filteredData[tankId] || [];
      const data = tankData.map((d) => d.cantidad);
      const labels = tankData.map((d) => d.hora);

      return {
        label: tankName,
        data,
        borderColor: color,
        tension: 0.4,
        fill: false,
        pointRadius: tankData.length > 30 ? 2 : 5,
      };
    });

    const firstTankId = selectedTanks.reduce((maxId, currId) => {
      const currLength = filteredData[currId]?.length || 0;
      const maxLength = filteredData[maxId]?.length || 0;
      return currLength > maxLength ? currId : maxId;
    }, selectedTanks[0]);

    const firstTankData = filteredData[firstTankId] || [];
    const labels = firstTankData.map((d) => d.hora);

    return { labels, datasets };
  }, [filteredData, selectedTanks, tanks]);

  const lineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Bbl" },
        },
        x: {
          title: {
            display: true,
            text: filterType === "day" ? "Hora del día" : "Fecha",
          },
        },
      },
      plugins: {
        legend: { position: "top", display: false },
        title: {
          display: false,
          text: "Nivel de Tanques",
        },
      },
    }),
    [filterType]
  );

  // Memoizar opciones de tanques
  const tankOptions = useMemo(
    () => tanks.map((t) => ({ label: t.nombre, value: t.id })),
    [tanks]
  );

  return (
    <div className="grid">
      <div className="col-12 md:col-6">
        {loading && stage >= 0 && stage < 3 ? (
          <FiltersSkeleton />
        ) : (
          <Card title="Nivel de Tanque" className="p-0 mb-3">
            <div>
              <div className="grid formgrid ">
                <div className="col-12 md:col-6 ">
                  <MultiSelect
                    value={selectedTanks}
                    options={tankOptions}
                    onChange={(e) => setSelectedTanks(e.value)}
                    placeholder="Selecciona tanques"
                    className="w-full "
                    display="chip"
                    selectionLimit={5}
                  />
                </div>
                <div className="col-12 md:col-6 ">
                  <FilterControls
                    filterType={filterType}
                    setFilterType={setFilterType}
                    customRange={customRange}
                    setCustomRange={setCustomRange}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                  />
                </div>
              </div>
              <Chart
                type="line"
                data={lineChartData}
                options={lineChartOptions}
                style={{ width: "100%", height: "260px" }}
              />
            </div>
          </Card>
        )}
      </div>
      <div className="col-12 md:col-6">
        {loading && stage >= 1 && stage < 3 ? (
          <StorageSkeleton />
        ) : (
          <StorageBarChart chequeoCantidads={chequeoCantidads} />
        )}
      </div>
    </div>
  );
};

export default TanqueGraficaList;
