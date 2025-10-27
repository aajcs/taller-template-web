"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRouter } from "next/navigation";
import { InputNumber } from "primereact/inputnumber";
import {
  createBunkering,
  updateBunkering,
} from "@/app/api/bunkering/bunkeringService";
import { bunkeringSchema } from "@/libs/zods";

type FormData = z.infer<typeof bunkeringSchema>;

interface BunkeringFormProps {
  bunkering: any;
  hideBunkeringFormDialog: () => void;
  bunkerings: any[];
  setBunkerings: (bunkerings: any[]) => void;
}

const BunkeringForm = ({
  bunkering,
  hideBunkeringFormDialog,
  bunkerings,
  setBunkerings,
}: BunkeringFormProps) => {
  const toast = useRef<Toast | null>(null);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(bunkeringSchema),
  });

  useEffect(() => {
    if (bunkering) {
      setValue("nombre", bunkering.nombre);
      setValue("estado", bunkering.estado);
      // setValue("eliminado", bunkering.eliminado);
      setValue("ubicacion", bunkering.ubicacion);
      setValue("nit", bunkering.nit);
      setValue("img", bunkering.img);
      setValue("createdAt", bunkering.createdAt);
      setValue("updatedAt", bunkering.updatedAt);
      setValue("id", bunkering.id);
    }
  }, [bunkering, setValue]);

  const findIndexById = (id: string) => {
    let index = -1;
    for (let i = 0; i < bunkerings.length; i++) {
      if (bunkerings[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (bunkering) {
        // Actualizar la refinería en el backend
        const bunkeringActualizada = await updateBunkering(bunkering.id, data);

        // Encontrar el índice de la refinería actualizada en el arreglo local
        const index = findIndexById(bunkering.id);

        if (index !== -1) {
          // Crear una copia del arreglo de refinerías
          const Bunkerings = [...bunkerings];

          // Actualizar la refinería en la copia del arreglo
          Bunkerings[index] = bunkeringActualizada;

          // Actualizar el estado local con el nuevo arreglo
          setBunkerings(Bunkerings);

          // Mostrar notificación de éxito
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Bunkering Actualizada",
            life: 3000,
          });

          // Cerrar el diálogo del formulario
          hideBunkeringFormDialog();
        } else {
          // Mostrar notificación de error si no se encuentra la refinería
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo encontrar la refinería",
            life: 3000,
          });
        }
      } else {
        // Crear una nueva refinería
        const bunkeringCreada = await createBunkering(data);

        // Actualizar el estado local con la nueva refinería
        // setBunkerings([...bunkerings, bunkeringCreada]);

        // Mostrar notificación de éxito
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Bunkering Creada",
          life: 3000,
        });

        // Cerrar el diálogo del formulario
        // hideBunkeringFormDialog();
      }
    } catch (error) {
      // Mostrar notificación de error si algo falla
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al procesar la solicitud",
        life: 3000,
      });
      console.error("Error al procesar la solicitud:", error);
    } finally {
      // Redirigir después de que todo esté completo
      router.push("/todos-bunkering/list");
    }
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      {!bunkering && (
        <span className="text-900 text-xl font-bold mb-4 block">
          Crear Bunkering
        </span>
      )}
      <div className="grid">
        {!bunkering && (
          <div className="col-12 lg:col-2">
            <div className="text-900 font-medium text-xl mb-3">Bunkering</div>
            <p className="m-0 p-0 text-600 line-height-3 mr-3">
              Todos los campos son obligatorios.
            </p>
          </div>
        )}
        <div className="col-12 lg:col-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid formgrid p-fluid">
              <div className="field mb-4 col-12">
                <label htmlFor="nombre" className="font-medium text-900">
                  Nombre
                </label>
                <InputText
                  id="nombre"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.nombre,
                  })}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <small className="p-error">{errors.nombre.message}</small>
                )}
              </div>
              {/* 
              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="estado" className="font-medium text-900">
                  Estado
                </label>
                <Dropdown
                  id="estado"
                  value={watch("estado")}
                  onChange={(e) => setValue("estado", e.value)}
                  options={estatusValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.estado,
                  })}
                />
                {errors.estado && (
                  <small className="p-error">{errors.estado.message}</small>
                )}
              </div> */}
              {/* 
              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="eliminado" className="font-medium text-900">
                  Eliminado
                </label>
                <Dropdown
                  id="eliminado"
                  value={watch("eliminado")}
                  onChange={(e) => setValue("eliminado", e.value)}
                  options={estatusValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.eliminado,
                  })}
                />
                {errors.eliminado && (
                  <small className="p-error">{errors.eliminado.message}</small>
                )}
              </div> */}
              {/* Fila 2 */}

              <div className="field mb-4 col-12">
                <label htmlFor="ubicacion" className="font-medium text-900">
                  Ubicación
                </label>
                <InputText
                  id="ubicacion"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.ubicacion,
                  })}
                  {...register("ubicacion")}
                />
                {errors.ubicacion && (
                  <small className="p-error">{errors.ubicacion.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12">
                <label htmlFor="nit" className="font-medium text-900">
                  NIT
                </label>
                <InputText
                  id="nit"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.nit,
                  })}
                  {...register("nit")}
                />
                {errors.nit && (
                  <small className="p-error">{errors.nit.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12">
                <label htmlFor="img" className="font-medium text-900">
                  Imagen
                </label>
                <InputText
                  id="img"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.img,
                  })}
                  {...register("img")}
                />
                {errors.img && (
                  <small className="p-error">{errors.img.message}</small>
                )}
              </div>

              <div className="col-12">
                <Button
                  type="submit"
                  disabled={submitting} // Deshabilitar el botón mientras se envía
                  icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
                  label={bunkering ? "Modificar Bunkering" : "Crear Bunkering"}
                  className="w-auto mt-3"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BunkeringForm;
