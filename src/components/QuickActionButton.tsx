import React from 'react';

interface QuickActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`btn bg-[var(--accent-primary)] text-white px-4 py-2 rounded-md ${className ?? ''}`}
    >
      {children}
    </button>
  );
};
