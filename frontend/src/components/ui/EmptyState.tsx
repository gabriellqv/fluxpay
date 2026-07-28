import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="mb-4 h-12 w-12 text-slate-400" />
      <h3 className="text-lg font-medium text-slate-800">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
