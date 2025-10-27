"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { balanceSchema } from "@/libs/zods";
import { createBalance, updateBalance } from "@/app/api/balanceService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";
import { InputNumber } from "primereact/inputnumber";
import { truncateText } from "@/utils/funcionesUtiles";
import { MultiSelect } from "primereact/multiselect";

import { ProgressSpinner } from "primereact/progressspinner";
import { Calendar } from "primereact/calendar";
import { useRefineryData } from "@/hooks/useRefineryData";
import { handleFormError } from "@/utils/errorHandlers";
import { Balance } from "@/libs/interfaces";

type FormData = z.infer<typeof balanceSchema>;

interface BalanceFormProps {
  balance: Balance | null; // Cambiado a Balance para reflejar la interfaz correcta
  hideBalanceFormDialog: () => void;
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
  setBalance: (balance: Balance) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estatusValues = ["true", "false"];
const tipoValues = ["Cliente", "Proveedor"]; // Valores para el campo "tipo"

const BalanceForm = ({
  balance,
  hideBalanceFormDialog,
  balances,
  setBalances,
  showToast,
  toast,
}: BalanceFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { contratos, loading } = useRefineryData(activeRefineria?.id || "");

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(balanceSchema),
  });
  console.log("Errors:", errors);

  useEffect(() => {
    // Es crucial esperar a que tanto 'balance' para editar como la lista 'contratos' estén cargados.
    if (balance && contratos.length > 0) {
      // 1. REHIDRATAR LOS DATOS DE LOS CONTRATOS
      // Usa los IDs de los contratos en 'balance' para encontrar los objetos completos en la lista 'contratos'.

      // Para Contratos de Venta
      if (balance.contratosVentas && balance.contratosVentas.length > 0) {
        const ventaIds = new Set(balance.contratosVentas.map((c) => c.id));
        const fullVentaContracts = contratos.filter((c) => ventaIds.has(c.id));
        setValue("contratosVentas", fullVentaContracts as any[]); // Asegura que se establezca como un arreglo
      } else {
        setValue("contratosVentas", []); // Asegura que se limpie si no hay contratos
      }

      // Para Contratos de Compra (hacemos lo mismo por consistencia)
      if (balance.contratosCompras && balance.contratosCompras.length > 0) {
        const compraIds = new Set(balance.contratosCompras.map((c) => c.id));
        const fullCompraContracts = contratos.filter((c) =>
          compraIds.has(c.id)
        );
        setValue("contratosCompras", fullCompraContracts as any[]);
      } else {
        setValue("contratosCompras", []);
      }

      // 2. ESTABLECER EL RESTO DE LOS CAMPOS
      // Itera sobre las demás propiedades del balance y establécelas.
      (Object.keys(balance) as (keyof FormData)[]).forEach((key) => {
        // Evitamos sobreescribir los campos de contratos que ya manejamos
        if (
          key !== "contratosVentas" &&
          key !== "contratosCompras" &&
          key in balance
        ) {
          if (balance[key as keyof Balance] !== undefined) {
            setValue(key, balance[key as keyof Balance] as any);
          }
        }
      });
    }
  }, [balance, contratos, setValue]); // <-- MUY IMPORTANTE: añade 'contratos' al array de dependencias

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const contratosComprasIds = (data.contratosCompras || []).map((c) => c.id);
    const contratosVentasIds = (data.contratosVentas || []).map((c) => c.id);

    const payload = {
      ...data,
      contratosCompras: contratosComprasIds,
      contratosVentas: contratosVentasIds,
      idRefineria: activeRefineria?.id,
    };
    try {
      if (balance) {
        const updatedBalance = await updateBalance(balance.id, payload);
        const updatedBalances = balances.map((t) =>
          t.id === updatedBalance.id ? updatedBalance : t
        );
        setBalances(updatedBalances);
        showToast("success", "Éxito", "Balance actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newBalance = await createBalance(payload);
        setBalances([newBalance, ...balances]);
        showToast("success", "Éxito", "Balance creado");
      }
      hideBalanceFormDialog();
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      setSubmitting(false); // Desactivar el estado de envío
    }
  };
  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }
  console.log("values:", watch());
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {balance ? "Modificar Balance" : "Crear Balance"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Fecha Inicio */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2 text-primary"></i>
                  Fecha Inicio
                </label>
                <Controller
                  name="fechaInicio"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      value={field.value ? new Date(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      showIcon
                      dateFormat="dd/mm/yy"
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.fechaInicio && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.fechaInicio.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Fecha Fin */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2 text-primary"></i>
                  Fecha Fin
                </label>
                <Controller
                  name="fechaFin"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      value={field.value ? new Date(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      showIcon
                      dateFormat="dd/mm/yy"
                      className="w-full"
                      locale="es"
                    />
                  )}
                />
                {errors.fechaFin && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.fechaFin.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Contratos de Compra (Selección múltiple) */}
            <div className="col-12 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-file-contract mr-2 text-green-500"></i>
                  Contratos de Compra
                </label>
                <Controller
                  name="contratosCompras"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiSelect
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={contratos
                        .filter(
                          (c) =>
                            c.tipoContrato === "Compra" &&
                            (!c.idBalance || // Mostrar si no tiene idBalance
                              (balance && c.idBalance === balance.id)) // O si pertenece al balance actual
                        )
                        .map((contrato) => ({
                          label: `${contrato.numeroContrato} - ${truncateText(
                            contrato.descripcion || "Sin descripción",
                            30
                          )}`,
                          value: contrato,
                        }))}
                      optionLabel="label" // <-- Agrega esto
                      placeholder="Seleccionar contratos de compra"
                      className={classNames("w-full", {
                        "p-invalid": fieldState.error,
                      })}
                      display="chip"
                      selectionLimit={10}
                      filter
                    />
                  )}
                />
                {errors.contratosCompras && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.contratosCompras.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Contratos de Venta (Selección múltiple) */}
            <div className="col-12 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-file-contract mr-2 text-orange-500"></i>
                  Contratos de Venta
                </label>
                <Controller
                  name="contratosVentas"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiSelect
                      value={field.value} // Usar el valor del campo directamente
                      onChange={(e) => field.onChange(e.value)}
                      options={contratos
                        .filter(
                          (c) =>
                            c.tipoContrato === "Venta" &&
                            (!c.idBalance || // Mostrar si no tiene idBalance
                              (balance && c.idBalance === balance.id)) // O si pertenece al balance actual
                        )
                        .map((contrato) => ({
                          label: `${contrato.numeroContrato} - ${truncateText(
                            contrato.descripcion || "Sin descripción",
                            30
                          )}`,
                          value: contrato,
                        }))}
                      optionLabel="label"
                      placeholder="Seleccionar contratos de venta"
                      className={classNames("w-full", {
                        "p-invalid": fieldState.error,
                      })}
                      display="chip"
                      selectionLimit={10}
                      filter
                    />
                  )}
                />
                {errors.contratosVentas && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.contratosVentas.message}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={balance ? "Modificar Balance" : "Crear Balance"}
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideBalanceFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default BalanceForm;
