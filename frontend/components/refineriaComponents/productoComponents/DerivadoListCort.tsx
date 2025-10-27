"use client";
import React, { useEffect, useRef, useState } from "react";

import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { useRefineriaStore } from "@/store/refineriaStore";
import { formatDateFH } from "@/utils/dateUtils";
import { Derivado } from "@/libs/interface";

interface DerivadoListCortProps {
  derivado: Derivado[];
}

const DerivadoListCort = ({ derivado }: DerivadoListCortProps) => {
  const dt = useRef(null);
  return (
    <div className="">
      <DataTable
        ref={dt}
        value={derivado}
        emptyMessage="No hay derivados disponibles"
      >
        <Column field="idProducto.nombre" header="Nombre del Producto" />
        <Column field="porcentaje" header="Porcentaje" />
        <Column field="posicion" header="Posicion" sortable />

        <Column
          field="estado"
          header="Estado"
          sortable
          style={{ width: "25%" }}
        />
      </DataTable>
    </div>
  );
};

export default DerivadoListCort;
