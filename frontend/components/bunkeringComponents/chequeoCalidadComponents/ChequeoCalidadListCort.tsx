"use client";
import React, { useRef, useState } from "react";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

import { formatDateFH } from "@/utils/dateUtils";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import ChequeoCalidadCard from "./ChequeoCalidadCard";
import { InputText } from "primereact/inputtext";
import { ChequeoCalidad } from "@/libs/interfaces";

interface ChequeoCalidadListCortProps {
  chequeoCalidad: any;
}

const ChequeoCalidadListCort = ({
  chequeoCalidad,
}: ChequeoCalidadListCortProps) => {
  const dt = useRef(null);
  const [chequeoCalidadCardDialog, setChequeoCalidadCardDialog] =
    useState(false);
  const [chequeoCalidadCard, setChequeoCalidadCard] =
    useState<ChequeoCalidad | null>(null);
  const actionCardTemplate = (rowData: any) => (
    <Button
      icon="pi pi-search"
      rounded
      // severity="success"
      className="mr-2"
      onClick={() => {
        setChequeoCalidadCardDialog(true);
        setChequeoCalidadCard(rowData);
        // setSubTablaDialog("ChequeoCalidad");
      }}
    />
  );
  return (
    <div className="">
      <DataTable
        ref={dt}
        value={chequeoCalidad}
        rows={10}
        emptyMessage="No hay chequeoCalidads disponibles"
        size="small"
        rowClassName={() => "animated-row"}
      >
        <Column body={actionCardTemplate} />

        <Column field="operador" header="Operador" sortable />
        <Column
          field="fechaChequeo"
          header="Fecha de Chequeo"
          body={(rowData: ChequeoCalidad) => formatDateFH(rowData.fechaChequeo)}
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
          body={(rowData: ChequeoCalidad) => formatDateFH(rowData.updatedAt)}
        />
      </DataTable>

      <Dialog
        visible={chequeoCalidadCardDialog}
        modal
        onHide={() => {
          if (!chequeoCalidadCardDialog) return;
          setChequeoCalidadCardDialog(false);
        }}
        position={"left"}
        content={({ hide }) => (
          <div
            className="flex flex-column px-8 py-5 gap-4"
            style={{
              borderRadius: "12px",
              backgroundImage:
                "radial-gradient(circle at left top, var(--primary-400), var(--primary-700))",
            }}
          >
            <ChequeoCalidadCard
              chequeoCalidad={chequeoCalidadCard}
              hideChequeoCalidadCardDialog={() =>
                setChequeoCalidadCardDialog(false)
              }
            />
            <div className="flex align-items-center gap-2">
              <Button
                label="Salir"
                onClick={(e) => hide(e)}
                text
                className="p-3 w-full text-white border-1 border-white-alpha-30 hover:bg-white-alpha-10"
              ></Button>
            </div>
          </div>
        )}
      ></Dialog>
    </div>
  );
};

export default ChequeoCalidadListCort;
