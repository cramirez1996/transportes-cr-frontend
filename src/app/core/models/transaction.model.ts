export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  CHECK = 'CHECK',
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  parent?: TransactionCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: Date;
  description: string;
  trip?: any;
  invoice?: any;
  vehicle?: any;
  driver?: any;
  customer?: any;
  supplier?: any;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  attachments?: string[];
  createdBy?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDto {
  type: TransactionType;
  categoryId: string;
  amount: number;
  date: Date;
  description: string;
  tripId?: string;
  invoiceId?: string;
  vehicleId?: string;
  driverId?: string;
  customerId?: string;
  supplierId?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  attachments?: string[];
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}

export interface CreateTransactionCategoryDto {
  name: string;
  type: TransactionType;
  parentId?: string;
}

export interface UpdateTransactionCategoryDto extends Partial<CreateTransactionCategoryDto> {}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  tripId?: string;
  vehicleId?: string;
  driverId?: string;
  customerId?: string;
  supplierId?: string;
  paymentMethod?: PaymentMethod;
}

export interface TransactionStatistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  totalTransactions: number;
}

export interface TransactionByCategory {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  total: number;
  count: number;
}
