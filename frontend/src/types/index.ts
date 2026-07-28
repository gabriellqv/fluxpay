export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  balance: number;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Counterparty {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'SENT' | 'RECEIVED';
  createdAt: string;
  counterparty: Counterparty;
}

export interface TransactionHistory {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  transactionId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
