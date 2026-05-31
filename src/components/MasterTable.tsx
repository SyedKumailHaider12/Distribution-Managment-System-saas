import React from 'react';
import Link from 'next/link';

interface Column {
  header: string;
  accessor: string;
}

interface Props {
  columns: Column[];
  data: any[];
  title: string;
}

export const MasterTable: React.FC<Props> = ({ columns, data, title }) => {
  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">{title}</h2>
      <table className="styled-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.accessor}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.accessor}>{row[col.accessor]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <Link href="#" className="btn-primary">Add New {title}</Link>
      </div>
    </div>
  );
};
