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
import { useRefineriaStore } from "@/store/refineriaStore";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { contactoBKSchema } from "@/libs/zods/contratoBKZod";
import { ContactoBK } from "@/libs/interfaces";
import {
  createContactoBK,
  updateContactoBK,
} from "@/app/api/bunkering/contactoBKService";

type FormData = z.infer<typeof contactoBKSchema>;

interface ContactoFormProps {
  contacto: any;
  hideContactoFormDialog: () => void;
  contactos: ContactoBK[];
  setContactos: (contactos: any[]) => void;
  setContacto: (contacto: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
}

const estatusValues = ["true", "false"];
const tipoValues = ["Cliente", "Proveedor"]; // Valores para el campo "tipo"

const ContactoForm = ({
  contacto,
  hideContactoFormDialog,
  contactos,
  setContactos,
  showToast,
}: ContactoFormProps) => {
  const { activeRefineria } = useRefineriaStore();
  const toast = useRef<Toast | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(contactoBKSchema),
  });

  useEffect(() => {
    if (contacto) {
      Object.keys(contacto).forEach((key) =>
        setValue(key as keyof FormData, contacto[key])
      );
    }
  }, [contacto, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (contacto) {
        const updatedContacto = await updateContactoBK(contacto.id, {
          ...data,
          idBunkering: activeRefineria?.id,
        });
        const updatedContactos = contactos.map((t) =>
          t.id === updatedContacto.id ? updatedContacto : t
        );
        setContactos(updatedContactos);
        showToast("success", "Éxito", "Contacto actualizado");
      } else {
        if (!activeRefineria)
          throw new Error("No se ha seleccionado una refinería");
        const newContacto = await createContactoBK({
          ...data,
          idBunkering: activeRefineria.id,
        });
        setContactos([...contactos, newContacto]);
        showToast("success", "Éxito", "Contacto creado");
      }
      hideContactoFormDialog();
    } catch (error) {
      console.error("Error al crear/modificar contacto:", error);
      showToast(
        "error",
        "Error",
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setSubmitting(false); // Desactivar el estado de envío
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-check-circle mr-3 text-primary text-3xl"></i>
                {contacto ? "Modificar Contacto" : "Crear Contacto"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Campo: Nombre */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-user mr-2 text-primary"></i>
                  Razon Social
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
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.nombre.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Identificación Fiscal */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-id-card mr-2 text-primary"></i>
                  NIT
                </label>
                <InputText
                  id="identificacionFiscal"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.identificacionFiscal,
                  })}
                  {...register("identificacionFiscal")}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = input.value.replace(/[^0-9-]/g, ""); // Elimina caracteres no válidos
                  }}
                />
                {errors.identificacionFiscal && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.identificacionFiscal.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Representante Legal */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-user-edit mr-2 text-primary"></i>
                  Representante Legal
                </label>
                <InputText
                  id="representanteLegal"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.representanteLegal,
                  })}
                  {...register("representanteLegal")}
                />
                {errors.representanteLegal && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.representanteLegal.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Teléfono */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-3 bg-white border-round shadow-1">
                <label className="block font-medium text-900 mb-2 flex align-items-center">
                  <i className="pi pi-phone text-primary mr-2"></i>
                  Teléfono
                </label>
                <Controller
                  name="telefono"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputNumber
                        id="telefono"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value ?? 0)}
                        useGrouping={false}
                        // min={1000000} // Mínimo 7 dígitos
                        // max={9999999999} // Máximo 10 dígitos
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                        })}
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
              </div>
            </div>

            {/* Campo: Correo */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-envelope mr-2 text-primary"></i>
                  Correo
                </label>
                <InputText
                  id="correo"
                  type="email"
                  className={classNames("w-full", {
                    "p-invalid": errors.correo,
                  })}
                  {...register("correo")}
                />
                {errors.correo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.correo.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Ciudad */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-globe mr-2 text-primary"></i>
                  Ciudad
                </label>
                <InputText
                  id="ciudad"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.ciudad,
                  })}
                  {...register("ciudad")}
                />
                {errors.ciudad && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.ciudad.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Dirección */}
            <div className="col-12 md:col-6 ">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-map-marker mr-2 text-primary"></i>
                  Dirección
                </label>
                <InputTextarea
                  id="direccion"
                  className={classNames("w-full", {
                    "p-invalid": errors.direccion,
                  })}
                  {...register("direccion")}
                />
                {errors.direccion && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.direccion.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Tipo */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-list mr-2 text-primary"></i>
                  Tipo
                </label>
                <Dropdown
                  id="tipo"
                  value={watch("tipo")}
                  onChange={(e) => setValue("tipo", e.value)}
                  options={tipoValues}
                  placeholder="Seleccionar"
                  className={classNames("w-full", { "p-invalid": errors.tipo })}
                />
                {errors.tipo && (
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.tipo.message}
                  </small>
                )}
              </div>
            </div>

            {/* Campo: Estado
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <div className="p-2 bg-white border-round shadow-1 surface-card">
                <label className="block font-medium text-900 mb-3 flex align-items-center">
                  <i className="pi pi-info-circle mr-2 text-primary"></i>
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
                  <small className="p-error block mt-2 flex align-items-center">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    {errors.estado.message}
                  </small>
                )}
              </div>
            </div> */}
          </div>

          {/* Botones */}
          <div className="col-12 flex justify-content-between align-items-center mt-3">
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? "pi pi-spinner pi-spin" : ""}
              label={contacto ? "Modificar Contacto" : "Crear Contacto"}
              className="w-auto"
            />

            <Button
              type="button"
              label="Salir"
              onClick={() => hideContactoFormDialog()}
              className="w-auto"
              severity="danger"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContactoForm;
