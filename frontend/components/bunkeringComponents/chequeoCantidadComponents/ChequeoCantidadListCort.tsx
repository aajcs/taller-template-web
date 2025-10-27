"use client";
import React, { useRef, useState } from "react";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

import { ChequeoCantidad } from "@/libs/interfaces";
import { formatDateFH } from "@/utils/dateUtils";

interface ChequeoCantidadListCortProps {
  chequeoCantidad: any;
}

const ChequeoCantidadListCort = ({
  chequeoCantidad,
}: ChequeoCantidadListCortProps) => {
  const dt = useRef(null);

  return (
    <div className="">
      <DataTable
        ref={dt}
        value={chequeoCantidad}
        rows={10}
        emptyMessage="No hay chequeoCantidads disponibles"
        rowClassName={() => "animated-row"}
        size="small"
      >
        <Column field="operador" header="Operador" sortable />
        <Column
          field="fechaChequeo"
          header="Fecha de Chequeo"
          body={(rowData: ChequeoCantidad) =>
            formatDateFH(rowData.fechaChequeo)
          }
        />
        <Column
          field="cantidad"
          header="Cantidad"
          sortable
          body={(rowData: ChequeoCantidad) =>
            ` ${Number(rowData.cantidad).toLocaleString("de-DE")} Bbl`
          }
        />

        <Column
          field="idProducto.nombre"
          header="Nombre del Producto"
          sortable
        />
        <Column field="idTanque.nombre" header="Nombre del Tanque" sortable />
        <Column field="idTorre.nombre" header="Nombre de la Torre" sortable />

        <Column
          field="updatedAt"
          header="Última Actualización"
          body={(rowData: ChequeoCantidad) => formatDateFH(rowData.updatedAt)}
        />
      </DataTable>
    </div>
  );
};

export default ChequeoCantidadListCort;
