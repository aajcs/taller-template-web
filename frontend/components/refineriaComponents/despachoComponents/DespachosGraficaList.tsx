"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Nullable } from "primereact/ts-helpers";
import { useRefineriaStore } from "@/store/refineriaStore";
import { useRefineryData } from "@/hooks/useRefineryData";
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  parseISO,
} from "date-fns";
import { Despacho } from "@/libs/interfaces/despachoInterface";
import { Skeleton } from "primereact/skeleton"; // añadido

// Paleta fallback
const FALLBACK_COLORS = [
  "#1E88E5",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
  "#E53935",
  "#00ACC1",
  "#6D4C41",
  "#5E35B1",
  "#546E7A",
];

const normalizeHexColor = (raw?: string, fallback = "#1E88E5") => {
  if (!raw) return fallback;
  let v = raw.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return fallback;
  return v.toUpperCase();
};

// Obtiene una fecha representativa de un despacho
const getDespachoDateISO = (d: Despacho | any): string =>
  d.fechaFinDespacho ||
  d.fechaInicioDespacho ||
  d.fechaDespacho ||
  d.fechaFin ||
  d.fechaInicio ||
  d.fechaSalida ||
  d.fechaLlegada ||
  d.createdAt ||
  new Date().toISOString();

// Controles de filtro
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
    setFilterType: (v: any) => void;
    customRange: Nullable<(Date | null)[]>;
    setCustomRange: (v: any) => void;
    selectedDay: Nullable<Date>;
    setSelectedDay: (v: any) => void;
    selectedMonth: Nullable<Date>;
    setSelectedMonth: (v: any) => void;
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
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <Dropdown
          value={filterType}
          options={filterOptions}
          onChange={(e) => setFilterType(e.value)}
          placeholder="Filtro"
          className="w-full md:w-5"
        />
        {filterType === "custom" && (
          <Calendar
            value={customRange}
            onChange={(e) => setCustomRange(e.value)}
            selectionMode="range"
            readOnlyInput
            hideOnRangeSelection
          />
        )}
        {filterType === "day" && (
          <Calendar
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.value)}
            selectionMode="single"
            placeholder="Selecciona un día"
          />
        )}
        {filterType === "month" && (
          <Calendar
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.value)}
            view="month"
            dateFormat="mm/yy"
            placeholder="Selecciona mes"
          />
        )}
      </div>
    );
  }
);

const DespachosGraficaList: React.FC = () => {
  const { activeRefineria } = useRefineriaStore();
  const { despachos = [], loading } = useRefineryData(
    activeRefineria?.id || ""
  ); // incluye loading

  // Skeletons y staged reveal ---------------------------------
  const FiltersSkeleton = () => (
    <Card className="mb-3" title="Filtros">
      <div className="grid gap-3">
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
    </Card>
  );

  const KPIsSkeleton = () => (
    <div className="grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="col-12 md:col-3">
          <Card className="text-center" title={<span>&nbsp;</span>}>
            <Skeleton height="1.8rem" width="70%" className="mx-auto mb-2" />
            <Skeleton height="0.8rem" width="40%" className="mx-auto" />
          </Card>
        </div>
      ))}
    </div>
  );

  const ChartsSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="col-12 md:col-6">
          <Card className="p-0" title={<span>&nbsp;</span>}>
            <div className="p-3">
              <Skeleton height="260px" borderRadius="12px" />
            </div>
          </Card>
        </div>
      ))}
    </>
  );

  const [stage, setStage] = useState(0); // 0 filtros, 1 kpis, 2 charts, 3 done
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

  // Catalogo de tanques (únicos) excluyendo desconocidos
  const tanks = useMemo(() => {
    const map: Record<string, { nombre: string; color?: string }> = {};
    (despachos as Despacho[]).forEach((d) => {
      if (!d.idTanque) return;
      const id = d.idTanque.id;
      const nombre = d.idTanque.nombre;
      if (!id || !nombre || nombre === "Desconocido") return;
      const color = normalizeHexColor(
        d.idContratoItems?.producto?.color,
        undefined
      );
      map[id] = { nombre, color };
    });
    return Object.entries(map).map(([id, v]) => ({ id, ...v }));
  }, [despachos]);

  // Estado filtros
  const [selectedTanks, setSelectedTanks] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<
    "day" | "month" | "year" | "custom"
  >("day");
  const [customRange, setCustomRange] =
    useState<Nullable<(Date | null)[]>>(null);
  const [selectedDay, setSelectedDay] = useState<Nullable<Date>>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Nullable<Date>>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // Inicializar tanques seleccionados por defecto (top 5 volumen enviado)
  useEffect(() => {
    if (tanks.length && selectedTanks.length === 0) {
      const totals: Record<string, number> = {};
      (despachos as Despacho[]).forEach((d) => {
        const id = d.idTanque?.id;
        if (!id) return;
        totals[id] = (totals[id] || 0) + (d.cantidadEnviada || 0);
      });
      const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);
      setSelectedTanks(sorted);
    }
  }, [tanks, despachos, selectedTanks.length]);

  // Rango de fechas derivado
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
        if (customRange?.[0] && customRange?.[1]) {
          start = new Date(customRange[0]);
          end = new Date(customRange[1]);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          setDateRange([start, end]);
        }
        break;
    }
  }, [filterType, selectedDay, selectedMonth, customRange]);

  // Filtrar despachos según rango y tanques seleccionados
  const filteredDespachos = useMemo(() => {
    if (!dateRange) return [] as Despacho[];
    const [start, end] = dateRange;
    return (despachos as Despacho[]).filter((d) => {
      const iso = getDespachoDateISO(d);
      let fecha: Date;
      try {
        fecha = parseISO(iso);
        if (isNaN(fecha.getTime())) return false;
      } catch {
        return false;
      }
      if (fecha < start || fecha > end) return false;
      if (selectedTanks.length) {
        const id = d.idTanque?.id;
        if (!id || !selectedTanks.includes(id)) return false;
      }
      const nombre = d.idTanque?.nombre;
      if (!nombre || nombre === "Desconocido") return false;
      return true;
    });
  }, [despachos, dateRange, selectedTanks]);

  // KPIs
  const kpis = useMemo(() => {
    if (!filteredDespachos.length)
      return {
        totalEnviado: 0,
        totalDespachos: 0,
        promedioDiario: 0,
        tanqueTop: "-",
        ultimaFecha: "-",
      };
    const totalEnviado = filteredDespachos.reduce(
      (acc, d) => acc + (d.cantidadEnviada || 0),
      0
    );
    const totalDespachos = filteredDespachos.length;
    let days = 1;
    if (dateRange) {
      const diff = dateRange[1].getTime() - dateRange[0].getTime();
      days = Math.max(1, Math.round(diff / 86400000) + 1);
    }
    const promedioDiario = totalEnviado / days;
    const byTank: Record<string, { nombre: string; volumen: number }> = {};
    filteredDespachos.forEach((d) => {
      const id = d.idTanque?.id;
      const nombre = d.idTanque?.nombre || "";
      if (!id) return;
      if (!byTank[id]) byTank[id] = { nombre, volumen: 0 };
      byTank[id].volumen += d.cantidadEnviada || 0;
    });
    const tanqueTop = Object.values(byTank).sort(
      (a, b) => b.volumen - a.volumen
    )[0]?.nombre;
    const ultima = filteredDespachos
      .map((d) => parseISO(getDespachoDateISO(d)))
      .filter((dt) => !isNaN(dt.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      totalEnviado,
      totalDespachos,
      promedioDiario,
      tanqueTop: tanqueTop || "-",
      ultimaFecha: ultima ? format(ultima, "dd/MM/yyyy HH:mm") : "-",
    };
  }, [filteredDespachos, dateRange]);

  // Dataset: Enviado por tanque
  const enviadoPorTanqueData = useMemo(() => {
    const totals: Record<
      string,
      { nombre: string; volumen: number; color: string }
    > = {};
    filteredDespachos.forEach((d) => {
      const id = d.idTanque?.id;
      const nombre = d.idTanque?.nombre || "";
      if (!id || !nombre) return;
      if (!totals[id]) {
        totals[id] = {
          nombre,
          volumen: 0,
          color: normalizeHexColor(
            d.idContratoItems?.producto?.color,
            FALLBACK_COLORS[Object.keys(totals).length % FALLBACK_COLORS.length]
          ),
        };
      }
      totals[id].volumen += d.cantidadEnviada || 0;
    });
    const arr = Object.values(totals).sort((a, b) => b.volumen - a.volumen);
    return {
      labels: arr.map((t) => t.nombre),
      datasets: [
        {
          label: "Enviado (Bbl)",
          data: arr.map((t) => t.volumen),
          backgroundColor: arr.map((t) => t.color),
        },
      ],
    };
  }, [filteredDespachos]);

  // Dataset: Serie temporal (línea)
  const serieTemporalData = useMemo(() => {
    if (!dateRange) return { labels: [], datasets: [] };
    if (filterType === "day") {
      const hoursMap: Record<string, number> = {};
      filteredDespachos.forEach((d) => {
        const fecha = parseISO(getDespachoDateISO(d));
        if (isNaN(fecha.getTime())) return;
        const label = format(fecha, "HH:00");
        hoursMap[label] = (hoursMap[label] || 0) + (d.cantidadEnviada || 0);
      });
      const labels = Object.keys(hoursMap).sort();
      return {
        labels,
        datasets: [
          {
            label: "Enviado (Bbl)",
            data: labels.map((l) => hoursMap[l]),
            borderColor: FALLBACK_COLORS[0],
            tension: 0.3,
            fill: false,
          },
        ],
      };
    }
    const byDay: Record<string, number> = {};
    const [start, end] = dateRange;
    eachDayOfInterval({ start, end }).forEach((d) => {
      byDay[format(d, "dd/MM")] = 0;
    });
    filteredDespachos.forEach((d) => {
      const fecha = parseISO(getDespachoDateISO(d));
      if (isNaN(fecha.getTime())) return;
      const key = format(fecha, "dd/MM");
      if (byDay[key] !== undefined) byDay[key] += d.cantidadEnviada || 0;
    });
    const labels = Object.keys(byDay);
    return {
      labels,
      datasets: [
        {
          label: "Enviado (Bbl)",
          data: labels.map((l) => byDay[l]),
          borderColor: FALLBACK_COLORS[1],
          backgroundColor: FALLBACK_COLORS[1] + "33",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [filteredDespachos, dateRange, filterType]);

  // Dataset: Participación por producto
  const pieProductoData = useMemo(() => {
    const byProd: Record<string, { nombre: string; volumen: number }> = {};
    filteredDespachos.forEach((d) => {
      const prod = d.idContratoItems?.producto?.nombre || "Sin Producto";
      if (!byProd[prod]) byProd[prod] = { nombre: prod, volumen: 0 };
      byProd[prod].volumen += d.cantidadEnviada || 0;
    });
    const arr = Object.values(byProd).sort((a, b) => b.volumen - a.volumen);
    const colors = arr.map(
      (_, i) => FALLBACK_COLORS[i % FALLBACK_COLORS.length]
    );
    return {
      labels: arr.map((p) => p.nombre),
      datasets: [{ data: arr.map((p) => p.volumen), backgroundColor: colors }],
    };
  }, [filteredDespachos]);

  const tankOptions = useMemo(
    () => tanks.map((t) => ({ label: t.nombre, value: t.id })),
    [tanks]
  );

  return (
    <div className="grid relative">
      {loading && stage >= 0 && stage < 3 && (
        <div className="col-12">
          <FiltersSkeleton />
        </div>
      )}
      {!loading && (
        <div className="col-12">
          <Card className="mb-3" title="Filtros">
            <div className="grid gap-3">
              <div className="col-12 md:col-6">
                <MultiSelect
                  value={selectedTanks}
                  options={tankOptions}
                  onChange={(e) => setSelectedTanks(e.value)}
                  placeholder="Tanques"
                  className="w-full"
                  display="chip"
                  selectionLimit={8}
                />
              </div>
              <div className="col-12 md:col-6">
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
          </Card>
        </div>
      )}

      {loading && stage >= 1 && stage < 3 && (
        <div className="col-12">
          <KPIsSkeleton />
        </div>
      )}
      {!loading && (
        <div className="col-12">
          <div className="grid">
            <div className="col-12 md:col-3">
              <Card title="Total Enviado" className="text-center">
                <div className="text-2xl font-semibold">
                  {kpis.totalEnviado.toLocaleString()} Bbl
                </div>
              </Card>
            </div>
            <div className="col-12 md:col-3">
              <Card title="Despachos" className="text-center">
                <div className="text-2xl font-semibold">
                  {kpis.totalDespachos.toLocaleString()}
                </div>
              </Card>
            </div>
            <div className="col-12 md:col-3">
              <Card title="Prom. Diario" className="text-center">
                <div className="text-2xl font-semibold">
                  {kpis.promedioDiario.toFixed(2)} Bbl
                </div>
              </Card>
            </div>
            <div className="col-12 md:col-3">
              <Card title="Tanque Top" className="text-center">
                <div className="text-2xl font-semibold">{kpis.tanqueTop}</div>
                <div className="text-xs mt-2 text-color-secondary">
                  Última: {kpis.ultimaFecha}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {loading && stage >= 2 && stage < 3 && <ChartsSkeleton />}
      {!loading && (
        <>
          <div className="col-12 md:col-6">
            <Card title="Enviado por Tanque" className="p-0">
              <div style={{ height: 320 }}>
                {enviadoPorTanqueData.labels.length ? (
                  <Chart
                    type="bar"
                    data={enviadoPorTanqueData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Bbl" },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx: any) =>
                              `${ctx.parsed.y?.toLocaleString()} Bbl`,
                          },
                        },
                      },
                    }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="p-4 text-sm text-color-secondary">
                    Sin datos.
                  </div>
                )}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-6">
            <Card
              title={
                filterType === "day" ? "Enviado por Hora" : "Enviado Diario"
              }
              className="p-0"
            >
              <div style={{ height: 320 }}>
                {serieTemporalData.labels.length ? (
                  <Chart
                    type="line"
                    data={serieTemporalData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: "index", intersect: false },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Bbl" },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx: any) =>
                              `${ctx.parsed.y?.toLocaleString()} Bbl`,
                          },
                        },
                      },
                    }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="p-4 text-sm text-color-secondary">
                    Sin datos.
                  </div>
                )}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-6">
            <Card title="Participación por Producto" className="p-0">
              <div style={{ height: 320 }}>
                {pieProductoData.labels.length ? (
                  <Chart
                    type="pie"
                    data={pieProductoData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom" } },
                    }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="p-4 text-sm text-color-secondary">
                    Sin datos.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DespachosGraficaList;
