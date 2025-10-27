import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { corteRefinacionSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRefineriaStore } from "@/store/refineriaStore";

import { InputNumber } from "primereact/inputnumber";

import { Calendar } from "primereact/calendar";
import { CorteRefinacion } from "@/libs/interfaces";
import { ProgressSpinner } from "primereact/progressspinner";

import { InputTextarea } from "primereact/inputtextarea";
import {
  createCorteRefinacion,
  updateCorteRefinacion,
} from "@/app/api/corteRefinacionService";
import CustomCalendar from "@/components/common/CustomCalendar";
import { handleFormError } from "@/utils/errorHandlers";
import { useByRefineryData } from "@/hooks/useByRefineryData";

type FormData = z.infer<typeof corteRefinacionSchema>;

interface CorteRefinacionFormProps {
  corteRefinacion: CorteRefinacion | null;
  hideCorteRefinacionFormDialog: () => void;
  corteRefinacions: CorteRefinacion[];
  setCorteRefinacions: (corteRefinacions: CorteRefinacion[]) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const CorteRefinacionForm = ({
  corteRefinacion,
  toast,
  hideCorteRefinacionFormDialog,
  corteRefinacions,
  setCorteRefinacions,
  showToast,
}: CorteRefinacionFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const { productos = [], loading, tanques = [], torresDestilacions = [] } = useByRefineryData(
    activeRefineria?.id || ""
  );
  const calendarRef = useRef<Calendar>(null);

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(corteRefinacionSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (corteRefinacion) {
      Object.keys(corteRefinacion).forEach((key) =>
        setValue(
          key as keyof FormData,
          corteRefinacion[key as keyof CorteRefinacion] as any
        )
      );
    }
  }, [corteRefinacion, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (!activeRefineria) throw new Error("No hay refinería activa");

      const corteTorre = torresDestilacions.map((torre, torreIndex) => {
        // Combinar materiales torre + materias primas
        const materiasPrimas = productos.filter(
          (p) => p.tipoMaterial === "Materia Prima"
        );
        const materialesCompletos = [
          ...torre.material,
          ...materiasPrimas
            .filter(
              (mp) => !torre.material.some((m) => m.idProducto?.id === mp.id)
            )
            .map((mp) => ({
              id: mp.id,
              idProducto: { id: mp.id },
              tipoMaterial: "Materia Prima",
            })),
        ];

        const detalles = materialesCompletos
          .map((material, materialIndex) => {
            const cantidad = watch(
              `corteTorre.${torreIndex}.detalles.${materialIndex}.cantidad`
            );
            const idTanque = watch(
              `corteTorre.${torreIndex}.detalles.${materialIndex}.idTanque`
            );

            if (!cantidad || cantidad <= 0) return null;

            return {
              idProducto: material.idProducto?.id,
              idTanque: idTanque?.id,
              cantidad,
            };
          })
          .filter((detalle) => detalle !== null);

        return {
          idTorre: torre.id,
          detalles,
        };
      });

      const payload = {
        idRefineria: activeRefineria.id,
        corteTorre,
        fechaCorte: new Date(data.fechaCorte).toISOString(),
        observacion: data.observacion,
      };

      if (corteRefinacion) {
        const updated = await updateCorteRefinacion(
          corteRefinacion.id,
          payload
        );
        const updatedList = corteRefinacions.map((c) =>
          c.id === updated.id ? updated : c
        );
        setCorteRefinacions(updatedList);
        showToast("success", "Éxito", "Corte actualizado correctamente");
      } else {
        const created = await createCorteRefinacion(payload);
        setCorteRefinacions([...corteRefinacions, created]);
        showToast("success", "Éxito", "Corte creado correctamente");
      }

      hideCorteRefinacionFormDialog();
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      setSubmitting(false);
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

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {corteRefinacion
                  ? "Modificar Corte de Refinación"
                  : "Crear Corte de Refinación"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Torres de Destilación */}
            <div className="col-12">
              {torresDestilacions.map((torre, torreIndex) => {
                const materiasPrimas = productos.filter(
                  (p) => p.tipoMaterial === "Materia Prima"
                );

                // 2. Combinar materiales de la torre + materias primas
                const materialesCompletos = [
                  ...torre.material,
                  ...materiasPrimas
                    .filter(
                      (mp) =>
                        !torre.material.some((m) => m.idProducto?.id === mp.id)
                    )
                    .map((mp) => ({
                      id: mp.id,
                      idProducto: { id: mp.id },
                      tipoMaterial: "Materia Prima",
                    })),
                ];

                return (
                  <div key={torre.id} className="mb-4">
                    <h4 className="text-lg font-semibold text-800 mb-3">
                      {torre.nombre}
                    </h4>

                    {/* Productos asociados a la torre */}
                    {materialesCompletos.map((material, materialIndex) => {
                      const producto = productos.find(
                        (p) => p.id === material.idProducto?.id
                      );

                      return (
                        <div
                          key={material.idProducto?.id}
                          className="grid mb-3"
                        >
                          {/* Producto */}
                          <div className="col-12 md:col-6 lg:col-4">
                            <div className="p-2 bg-white border-round shadow-1 surface-card">
                              <label className="block font-medium text-900 mb-3 flex align-items-center">
                                <i className="pi pi-box mr-2 text-primary"></i>
                                {producto?.nombre}
                              </label>
                            </div>
                          </div>

                          {/* Tanque */}
                          <div className="col-12 md:col-6 lg:col-4">
                            <div className="p-2 bg-white border-round shadow-1 surface-card">
                              <label className="block font-medium text-900 mb-3 flex align-items-center">
                                <i className="pi pi-box mr-2 text-primary"></i>
                                Tanque
                              </label>
                              <Dropdown
                                id={`corteTorre.${torreIndex}.detalles.${materialIndex}.idTanque`}
                                value={watch(
                                  `corteTorre.${torreIndex}.detalles.${materialIndex}.idTanque`
                                )}
                                onChange={(e) =>
                                  setValue(
                                    `corteTorre.${torreIndex}.detalles.${materialIndex}.idTanque`,
                                    e.value
                                  )
                                }
                                options={tanques
                                  .filter(
                                    (tanque) =>
                                      tanque.idProducto?.id ===
                                      material.idProducto?.id
                                  )
                                  .map((tanque) => ({
                                    label: tanque.nombre,
                                    value: {
                                      id: tanque.id,
                                      nombre: tanque.nombre,
                                      _id: tanque.id,
                                    },
                                  }))}
                                placeholder="Seleccionar un tanque"
                                className={classNames("w-full", {
                                  "p-invalid":
                                    errors.corteTorre?.[torreIndex]?.detalles?.[
                                      materialIndex
                                    ]?.idTanque,
                                })}
                              />
                              {errors.corteTorre?.[torreIndex]?.detalles?.[
                                materialIndex
                              ]?.idTanque && (
                                <small className="p-error block mt-2 flex align-items-center">
                                  <i className="pi pi-exclamation-circle mr-2"></i>
                                  {
                                    errors?.corteTorre[torreIndex]?.detalles?.[
                                      materialIndex
                                    ]?.idTanque?.message
                                  }
                                </small>
                              )}
                            </div>
                          </div>

                          {/* Cantidad */}
                          <div className="col-12 md:col-6 lg:col-4">
                            <div className="p-2 bg-white border-round shadow-1 surface-card">
                              <label className="block font-medium text-900 mb-3 flex align-items-center">
                                <i className="pi pi-sort-numeric-up mr-2 text-primary"></i>
                                Cantidad
                              </label>
                              <Controller
                                name={`corteTorre.${torreIndex}.detalles.${materialIndex}.cantidad`}
                                control={control}
                                defaultValue={0}
                                render={({ field }) => (
                                  <InputNumber
                                    id={`cantidad-${material.idProducto?.id}`}
                                    defaultValue={field.value ?? 0} // valor inicial por defecto
                                    value={field.value}
                                    onValueChange={(e) =>
                                      field.onChange(e.value)
                                    }
                                    className={classNames("w-full", {
                                      "p-invalid":
                                        errors.corteTorre?.[torreIndex]
                                          ?.detalles?.[materialIndex]?.cantidad,
                                    })}
                                    min={0}
                                  />
                                )}
                              />
                              {errors.corteTorre?.[torreIndex]?.detalles?.[
                                materialIndex
                              ]?.cantidad && (
                                <small className="p-error block mt-2 flex align-items-center">
                                  <i className="pi pi-exclamation-circle mr-2"></i>
                                  {
                                    errors?.corteTorre?.[torreIndex]
                                      ?.detalles?.[materialIndex]?.cantidad
                                      ?.message
                                  }
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* Fecha de Corte */}
            {/* <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2 text-primary"></i>
                  Fecha de Corte
                </label>
                <Controller
                  name="fechaCorte"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <CustomCalendar
                        {...field}
                        name="fechaCorte"
                        control={control}
                        setValue={setValue}
                        calendarRef={calendarRef}
                        isFieldEnabled={false}
                        value={
                          field.value
                            ? new Date(field.value as string | Date)
                            : null
                        }
                        onChange={field.onChange}
                      />

                      {fieldState.error && (
                        <small className="p-error block mt-2 flex align-items-center">
                          <i className="pi pi-exclamation-circle mr-2"></i>
                          {fieldState.error.message}
                        </small>
                      )}
                    </>
                  )}
                />
                {errors.fechaCorte && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.fechaCorte.message}
                  </small>
                )}
              </div>
            </div> */}
            {/* Campo: Fecha de Corte */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2 text-primary"></i>
                  Fecha de Corte
                </label>
                <Controller
                  name="fechaCorte"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <CustomCalendar
                        {...field}
                        name="fechaCorte"
                        control={control}
                        setValue={setValue}
                        calendarRef={calendarRef}
                        isFieldEnabled={false}
                        value={
                          field.value
                            ? new Date(field.value as string | Date)
                            : null
                        }
                        onChange={field.onChange}
                      />

                      {fieldState.error && (
                        <small className="p-error block mt-2 flex align-items-center">
                          <i className="pi pi-exclamation-circle mr-2"></i>
                          {fieldState.error.message}
                        </small>
                      )}
                    </>
                  )}
                />
                {errors.fechaCorte && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.fechaCorte.message}
                  </small>
                )}
              </div>
            </div>

            {/* Observación */}
            <div className="col-12 md:col-6 lg:col-4">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-pencil mr-2 text-primary"></i>
                  Observación
                </label>
                <InputTextarea
                  id="observacion"
                  value={watch("observacion")}
                  {...register("observacion")}
                  className={classNames("w-full", {
                    "p-invalid": errors.observacion,
                  })}
                />
                {errors.observacion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.observacion.message}
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
              label={
                corteRefinacion
                  ? "Modificar Corte de Refinación"
                  : "Crear Corte de Refinación"
              }
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideCorteRefinacionFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CorteRefinacionForm;
