import React from 'react';

interface ExpiringListProps {
  items: string[];
}

export const ExpiringList: React.FC<ExpiringListProps> = ({ items }) => {
  return (
    <ul className="styled-table">
      {items.map((item, idx) => (
        <li key={idx} className="border border-[var(--border-glass)] p-2 rounded">
          {item}
        </li>
      ))}
    </ul>
  );
};
