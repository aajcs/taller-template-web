import { Button } from "primereact/button";
import { Card } from "primereact/card";

interface ChequeoCantidadCardProps {
  chequeoCantidad: any;
  hideChequeoCantidadCardDialog: () => void;
}

const ChequeoCantidadCard = ({
  chequeoCantidad,
  hideChequeoCantidadCardDialog,
}: ChequeoCantidadCardProps) => {
  return (
    <div className="text-white">
      <p>
        <strong>Tanque:</strong> {chequeoCantidad.idTanque?.nombre}
      </p>
      <p>
        <strong>Torre:</strong> {chequeoCantidad.idTorre?.nombre}
      </p>
      <p>
        <strong>Fecha de Chequeo:</strong>{" "}
        {new Date(chequeoCantidad.fechaChequeo).toLocaleDateString()}
      </p>
      <p>
        <strong>Gravedad API:</strong> {chequeoCantidad.gravedadAPI}
      </p>
      <p>
        <strong>Azufre:</strong> {chequeoCantidad.azufre}
      </p>
      <p>
        <strong>Viscosidad:</strong> {chequeoCantidad.viscosidad}
      </p>
      <p>
        <strong>Densidad:</strong> {chequeoCantidad.densidad}
      </p>
      <p>
        <strong>Contenido de Agua:</strong> {chequeoCantidad.contenidoAgua}
      </p>
      <p>
        <strong>Contenido de Plomo:</strong> {chequeoCantidad.contenidoPlomo}
      </p>
      <p>
        <strong>Octanaje:</strong> {chequeoCantidad.octanaje}
      </p>
      <p>
        <strong>Temperatura:</strong> {chequeoCantidad.temperatura}
      </p>
      <p>
        <strong>Estado:</strong>{" "}
        {chequeoCantidad.estado ? "Activo" : "Inactivo"}
      </p>
    </div>
  );
};

export default ChequeoCantidadCard;
