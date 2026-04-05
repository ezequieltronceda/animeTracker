'use client';

import { useState, useEffect } from 'react';

interface MaxEpisodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function MaxEpisodeInput({ value, onChange, onSubmit, onCancel }: MaxEpisodeInputProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(inputValue);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      onSubmit(inputValue);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="N°"
        className="w-16 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700"
        autoFocus
      />
    </div>
  );
}
