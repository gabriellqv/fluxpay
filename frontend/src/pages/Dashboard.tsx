import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Bell, Wallet } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Skeleton, EmptyState } from '../components/ui';
import type { Transaction, TransactionHistory, Notification } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<TransactionHistory | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [historyResponse, notificationsResponse] = await Promise.all([
          api.get<TransactionHistory>('/v1/transactions/history?limit=5'),
          api.get<Notification[]>('/v1/notifications/unread-count'),
        ]);
        setHistory(historyResponse.data);
        setNotifications(notificationsResponse.data);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const latestTransactions = history?.data || [];
  const unreadCount = Array.isArray(notifications) ? notifications.length : 0;

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, {user?.name}</p>
        </div>
        <a
          href="/notifications"
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-xs font-medium text-white">
              {unreadCount}
            </span>
          ) : null}
        </a>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary-600 text-white">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary-100" />
            <div>
              <p className="text-sm text-primary-100">Balance</p>
              {isLoading ? (
                <Skeleton className="h-8 w-32 bg-primary-400" />
              ) : (
                <p className="text-2xl font-bold">
                  {user?.balance.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ArrowUpRight className="h-8 w-8 text-danger-500" />
            <div>
              <p className="text-sm text-slate-500">Sent</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">
                  {history?.meta.total || 0}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ArrowDownLeft className="h-8 w-8 text-success-500" />
            <div>
              <p className="text-sm text-slate-500">Received</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">
                  {history?.meta.total || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Latest transactions
          </h2>
          <a
            href="/history"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            View all
          </a>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : latestTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Send money to someone to see your first transaction here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {latestTransactions.map((transaction: Transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === 'SENT' ? (
                    <ArrowUpRight className="h-5 w-5 text-danger-500" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-success-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {transaction.type === 'SENT'
                        ? 'Sent to'
                        : 'Received from'}{' '}
                      {transaction.counterparty.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        'pt-BR',
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-medium ${
                    transaction.type === 'SENT'
                      ? 'text-danger-600'
                      : 'text-success-600'
                  }`}
                >
                  {transaction.type === 'SENT' ? '-' : '+'}
                  {transaction.amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
