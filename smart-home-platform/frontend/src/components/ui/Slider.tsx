import { InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
}

export default function Slider({ label, showValue, value, className = '', ...props }: SliderProps) {
  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {value}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        value={value}
        className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600 ${className}`}
        {...props}
      />
    </div>
  );
}
