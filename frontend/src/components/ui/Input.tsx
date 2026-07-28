import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200'
              : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="mt-1 block text-xs text-danger-600">{error}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
