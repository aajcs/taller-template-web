import React from "react";

interface ReportTableProps {
  columns: { field: string; header: string }[];
  data: any[];
}

const ReportTable: React.FC<ReportTableProps> = ({ columns, data }) => (
  <div className="overflow-x-auto mt-4" style={{ maxWidth: "1200px", margin: "0 auto" }}>
    <table className="min-w-[900px] w-full text-sm border border-200">
      <thead>
        <tr className="bg-blue-50 text-blue-900">
          {columns.map(col => (
            <th key={col.field} className="p-2 border-b">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-blue-50">
            {columns.map(col => (
              <td key={col.field} className="p-2 border-b">{row[col.field]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ReportTable;