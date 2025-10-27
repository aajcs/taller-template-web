// RUTA: /components/dashboards/sales/RecentSales.tsx
import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Demo } from "@/types";

interface RecentSalesProps {
  products: Demo.Product[];
  orderWeek: { name: string; code: string }[];
  selectedOrderWeek: { name: string; code: string };
  onWeekChange: (e: DropdownChangeEvent) => void;
}

const RecentSales = ({
  products,
  orderWeek,
  selectedOrderWeek,
  onWeekChange,
}: RecentSalesProps) => {
  const imageTemplate = (rowData: Demo.Product) => {
    return (
      <img
        src={`/demo/images/product/${rowData.image}`}
        alt={rowData.name}
        width="50px"
        className="shadow-4"
      />
    );
  };
  const nameTemplate = (rowData: Demo.Product) => <>{rowData.name}</>;
  const categoryTemplate = (data: Demo.Product) => <>{data.category}</>;
  const priceTemplate = (data: Demo.Product) => <td>{data.price}</td>;
  const bodyTemplate = () => (
    <Button
      type="button"
      icon="pi pi-search"
      className="p-button-text"
    ></Button>
  );

  return (
    <div className="card h-full">
      <div className="flex flex-wrap align-items-center justify-content-between mb-3 gap-3">
        <h5 className="m-0">Recent Sales</h5>
        <Dropdown
          options={orderWeek}
          value={selectedOrderWeek}
          onChange={onWeekChange}
          optionLabel="name"
          className="w-10rem"
        />
      </div>
      <DataTable value={products} rows={5} responsiveLayout="scroll">
        <Column body={imageTemplate} header="Image"></Column>
        <Column
          body={nameTemplate}
          field="name"
          header="Name"
          sortable
        ></Column>
        <Column
          body={categoryTemplate}
          field="category"
          header="Category"
          sortable
        ></Column>
        <Column
          body={priceTemplate}
          field="price"
          header="Price"
          sortable
        ></Column>
        <Column body={bodyTemplate}></Column>
      </DataTable>
    </div>
  );
};

export default RecentSales;
