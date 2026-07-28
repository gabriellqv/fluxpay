interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}

const variants = {
  success: 'bg-success-50 text-success-700 border-success-200',
  error: 'bg-danger-50 text-danger-700 border-danger-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  info: 'bg-primary-50 text-primary-700 border-primary-200',
};

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]}`}>
      {children}
    </div>
  );
}
