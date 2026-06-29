'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Barcode, Camera, X } from 'lucide-react';

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
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scannerRef = useRef<any>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const startCamera = useCallback(async () => {
    setShowCamera(true);
    // Dynamically import html5-qrcode to avoid SSR issues
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Wait for the container to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!cameraContainerRef.current) return;
      
      const scanner = new Html5Qrcode('barcode-camera-reader');
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 80 } },
        (decodedText: string) => {
          if (onScan) onScan(decodedText);
          onChange(decodedText);
          stopCamera();
        },
        () => {} // ignore errors during scanning
      );
    } catch (err) {
      console.error('Camera scan error:', err);
      setShowCamera(false);
    }
  }, [onScan, onChange]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
    setShowCamera(false);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        className={`pl-10 pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => showCamera ? stopCamera() : startCamera()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        title={showCamera ? 'Close camera' : 'Scan with camera'}
      >
        {showCamera ? <X size={16} /> : <Camera size={16} />}
      </button>
      
      {showCamera && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
          <div className="p-2 flex items-center justify-between bg-slate-800">
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              Point camera at barcode
            </span>
            <button onClick={stopCamera} className="text-slate-400 hover:text-white p-1 rounded">
              <X size={14} />
            </button>
          </div>
          <div ref={cameraContainerRef} id="barcode-camera-reader" className="w-full" style={{ minHeight: 200 }} />
        </div>
      )}
    </div>
  );
}
