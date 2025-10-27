import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";

interface ReportFiltersProps {
  filtros: any;
  setFiltros: (f: any) => void;
  opciones: {
    tipoAbono?: any[];
    tipoOperacion?: any[];
    tipoCuenta?: any[];
    proveedores?: any[];
    clientes?: any[];
    estatus?: any[];
    tipoContrato?: any[];
    estadoContrato?: any[];
    estadoEntrega?: any[];
    tipoContacto?: any[];
    estadoContacto?: any[];
  };
  onBuscar: () => void;
  onVolver: () => void;
  loading: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filtros,
  setFiltros,
  opciones,
  onBuscar,
  loading,
  onVolver,
}) => (
  <div className="flex flex-wrap gap-4 justify-center mb-4">
    {opciones.tipoContacto && (
      <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
        <label className="font-medium text-900">Tipo</label>
        <Dropdown
          value={filtros.tipoContacto}
          options={opciones.tipoContacto}
          onChange={e => setFiltros((f: any) => ({ ...f, tipoContacto: e.value }))}
          className="w-full p-inputtext-sm"
          style={{ fontSize: 13, height: 36 }}
        />
      </div>
    )}
    {opciones.tipoAbono && (
      <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
        <label className="font-medium text-900" style={{ fontSize: 13 }}>Tipo de Abono</label>
        <Dropdown
          value={filtros.tipoAbono}
          options={opciones.tipoAbono}
          onChange={e => setFiltros((f: any) => ({ ...f, tipoAbono: e.value }))}
          className="w-full p-inputtext-sm"
          style={{ fontSize: 13, height: 36 }}
        />
      </div>
    )}
    {opciones.tipoOperacion && (
      <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
        <label className="font-medium text-900" style={{ fontSize: 13 }}>Tipo de Operación</label>
        <Dropdown
          value={filtros.tipoOperacion}
          options={opciones.tipoOperacion}
          onChange={e => setFiltros((f: any) => ({ ...f, tipoOperacion: e.value }))}
          className="w-full p-inputtext-sm"
          style={{ fontSize: 13, height: 36 }}
        />
      </div>
    )}
    {opciones.tipoCuenta && (
  <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
        <label className="font-medium text-900">Tipo de Cuenta</label>
        <Dropdown
          value={filtros.tipoCuenta}
          options={opciones.tipoCuenta}
          onChange={e => setFiltros((f: any) => ({ ...f, tipoCuenta: e.value }))}
          className="w-full"
        />
      </div>
    )}
  {opciones.estadoContrato && (
    <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
      <label className="font-medium text-900" style={{ fontSize: 13 }}>Estado de Contrato</label>
      <Dropdown
        value={filtros.estadoContrato}
        options={opciones.estadoContrato}
        onChange={e => setFiltros((f: any) => ({ ...f, estadoContrato: e.value }))}
        className="w-full p-inputtext-sm"
        style={{ fontSize: 13, height: 36 }}
      />
    </div>
  )}
  {opciones.estadoEntrega && (
    <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
      <label className="font-medium text-900" style={{ fontSize: 13 }}>Estado de Entrega</label>
      <Dropdown
        value={filtros.estadoEntrega}
        options={opciones.estadoEntrega}
        onChange={e => setFiltros((f: any) => ({ ...f, estadoEntrega: e.value }))}
        className="w-full p-inputtext-sm"
        style={{ fontSize: 13, height: 36 }}
      />
    </div>
  )}
  {opciones.tipoContrato && (
    <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
      <label className="font-medium text-900" style={{ fontSize: 13 }}>Tipo de Contrato</label>
      <Dropdown
        value={filtros.tipoContrato}
        options={opciones.tipoContrato}
        onChange={e => setFiltros((f: any) => ({ ...f, tipoContrato: e.value }))}
        className="w-full p-inputtext-sm"
        style={{ fontSize: 13, height: 36 }}
      />
    </div>
  )}
  {opciones.proveedores && (
    <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
  <label className="font-medium text-900" style={{ fontSize: 13 }}>Proveedor / Cliente</label>
      <Dropdown
        value={filtros.proveedor}
        options={opciones.proveedores}
        onChange={e => setFiltros((f: any) => ({ ...f, proveedor: e.value }))}
        className="w-full p-inputtext-sm"
        style={{ fontSize: 13, height: 36 }}
        filter
      />
    </div>
  )}
    {opciones.clientes && (
  <div className="flex flex-column gap-2" style={{ minWidth: 170, maxWidth: 170 }}>
  <label className="font-medium text-900">Proveedor / Cliente</label>
        <Dropdown
          value={filtros.cliente}
          options={opciones.clientes}
          onChange={e => setFiltros((f: any) => ({ ...f, cliente: e.value }))}
          className="w-full"
          filter
        />
      </div>
    )}
    <div className="flex align-items-end gap-2">
        <Button
          icon="pi pi-eye"
          label={loading ? "Buscando..." : "Buscar"}
          className="p-button-primary p-button-sm"
          style={{ minWidth: 110, fontWeight: 500, fontSize: 13, height: 32, padding: '6px 12px' }}
          onClick={onBuscar}
          disabled={loading}
        />
        <Button
          icon="pi pi-arrow-left"
          label="Volver"
          className="p-button-sm"
          style={{ minWidth: 110, fontWeight: 500, fontSize: 13, height: 32, background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px' }}
          onClick={onVolver}
          type="button"
        />
    </div>
  </div>
);

export default ReportFilters;