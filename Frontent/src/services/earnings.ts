import { api } from './api';
import {
  EarningsSummary,
  EarningsTransactionsResponse,
  MonthlyEarnings
} from '../types/earnings.types';

export const earningsService = {
  async getEarningsSummary(): Promise<EarningsSummary> {
    const response = await api.get('/owner/earnings-summary');
    return response.data;
  },

  async getEarningsTransactions(
    limit: number = 50,
    offset: number = 0,
    isPaid?: boolean
  ): Promise<EarningsTransactionsResponse> {
    const params: any = { limit, offset };
    if (isPaid !== undefined) {
      params.is_paid = isPaid;
    }
    const response = await api.get('/owner/earnings-transactions', { params });
    return response.data;
  },

  async getMonthlyEarnings(): Promise<MonthlyEarnings[]> {
    const response = await api.get('/owner/earnings-monthly');
    return response.data;
  }
};
