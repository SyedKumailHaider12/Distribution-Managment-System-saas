'use client';

import { useState, useRef, useEffect } from 'react';
import { Barcode } from 'lucide-react';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (barcode: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function BarcodeInput({
  value,
  onChange,
  onScan,
  placeholder = 'Scan or enter barcode...',
  className = '',
  autoFocus = false,
}: BarcodeInputProps) {
  const [buffer, setBuffer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Clear timer on each keystroke
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Barcode scanners typically send Enter after scanning
    if (e.key === 'Enter' && buffer.length > 0) {
      e.preventDefault();
      if (onScan) {
        onScan(buffer);
      }
      setBuffer('');
      onChange('');
      return;
    }

    // Build buffer for rapid input detection (barcode scanner)
    if (e.key.length === 1) {
      const newBuffer = buffer + e.key;
      setBuffer(newBuffer);

      // Auto-submit if buffer gets long enough (typical barcode length)
      if (newBuffer.length >= 8) {
        timerRef.current = setTimeout(() => {
          if (onScan) {
            onScan(newBuffer);
          }
          setBuffer('');
          onChange('');
        }, 100);
      }
    }

    // Reset buffer after 100ms of no input (manual typing)
    timerRef.current = setTimeout(() => {
      setBuffer('');
    }, 100);
  };

  return (
    <div className="relative">
      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
      />
    </div>
  );
}
