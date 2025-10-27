"use client";
import React, { useEffect, useState } from "react";
import { getRefineria } from "@/app/api/refineriaService";
import { useRouter } from "next/navigation";
import { useRefineriaStore } from "@/store/refineriaStore";

const RefineriasDashboard = () => {
  const [refineria, setRefineria] = useState<any>(null);
  const { activeRefineria, setActiveRefineria } = useRefineriaStore();
  const router = useRouter();

  useEffect(() => {
    const fetchRefineria = async () => {
      try {
        if (!activeRefineria) {
          return;
        }
        const dataRefineria = await getRefineria(activeRefineria.id);

        setRefineria(dataRefineria);
      } catch (error) {
        console.error("Error al obtener la refinería:", error);
      }
    };

    fetchRefineria();
  }, [activeRefineria]);

  const handleDivClick = (refineria: any) => {
    setActiveRefineria(refineria);
    router.push("/refineria");
  };

  return (
    <div className="grid">
      {/* <h1 className="text-4xl font-bold text-blue-500">{activeRefineriaId}</h1> */}

      {refineria ? (
        <div
          className="col-12 lg:col-6 xl:col-3 clickable"
          key={refineria.id}
          onClick={() => handleDivClick(refineria)}
        >
          <div className="card p-0 overflow-hidden flex flex-column">
            <div className="flex align-items-center p-3">
              <img
                src={refineria.img}
                alt={refineria.nombre}
                width={100}
                height={100}
                // className="w-40 h-40 object-cover rounded-lg"
              />
              {/* <i className="pi pi-users text-6xl text-blue-500"></i> */}
              <div className="ml-3">
                <span className="text-blue-500 block white-space-nowrap">
                  {refineria.ubicacion}
                </span>
                <span className="text-blue-500 block text-4xl font-bold">
                  {refineria.nombre}
                </span>
                <span className="text-blue-500 block white-space-nowrap">
                  {refineria.nit}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No hay refinerías disponibles</p>
      )}
    </div>
  );
};

export default RefineriasDashboard;
