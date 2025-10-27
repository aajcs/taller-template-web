import { Button } from "primereact/button";
import { Card } from "primereact/card";

interface ChequeoCalidadCardProps {
  chequeoCalidad: any;
  hideChequeoCalidadCardDialog: () => void;
}

const ChequeoCalidadCard = ({
  chequeoCalidad,
  hideChequeoCalidadCardDialog,
}: ChequeoCalidadCardProps) => {
  return (
    <div className="text-white">
      <p>
        <strong>Tanque:</strong> {chequeoCalidad.idTanque?.nombre}
      </p>
      <p>
        <strong>Torre:</strong> {chequeoCalidad.idTorre?.nombre}
      </p>
      <p>
        <strong>Fecha de Chequeo:</strong>{" "}
        {new Date(chequeoCalidad.fechaChequeo).toLocaleDateString()}
      </p>
      <p>
        <strong>Gravedad API:</strong> {chequeoCalidad.gravedadAPI}
      </p>
      <p>
        <strong>Azufre:</strong> {chequeoCalidad.azufre}
      </p>
      <p>
        <strong>Viscosidad:</strong> {chequeoCalidad.viscosidad}
      </p>
      <p>
        <strong>Densidad:</strong> {chequeoCalidad.densidad}
      </p>
      <p>
        <strong>Contenido de Agua:</strong> {chequeoCalidad.contenidoAgua}
      </p>
      <p>
        <strong>Contenido de Plomo:</strong> {chequeoCalidad.contenidoPlomo}
      </p>
      <p>
        <strong>Octanaje:</strong> {chequeoCalidad.octanaje}
      </p>
      <p>
        <strong>Temperatura:</strong> {chequeoCalidad.temperatura}
      </p>
      <p>
        <strong>Estado:</strong> {chequeoCalidad.estado ? "Activo" : "Inactivo"}
      </p>
    </div>
  );
};

export default ChequeoCalidadCard;
