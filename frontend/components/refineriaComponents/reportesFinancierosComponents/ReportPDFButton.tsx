import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";

interface ReportPDFButtonProps {
  document: React.ReactElement;
  fileName: string;
}

const ReportPDFButton: React.FC<ReportPDFButtonProps> = ({ document, fileName }) => (
  <PDFDownloadLink
    document={document}
    fileName={fileName}
    className="p-button p-component p-button-success"
  >
    {({ loading }) => (loading ? <span>Generando PDF...</span> : <span>Descargar Reporte PDF</span>)}
  </PDFDownloadLink>
);

export default ReportPDFButton;