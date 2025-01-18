import { Category, Expense } from '@prisma/client';
import { z } from 'zod';

interface Flag {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  alias?: string;
}

export interface CommandDefinition {
  name: string;
  flags: Flag[];
  hasId?: boolean;
}

export const RequestSchema = z.object({
  command: z.string(),
  parameters: z.record(z.string()).optional(),
  apiKey: z.string()
});

export type ShortcutsRequest = z.infer<typeof RequestSchema>;

export interface ShortcutsResponse {
  success: boolean;
  message: string;
  data?: unknown;
  action?: {
    type: 'notification' | 'openUrl' | 'runShortcut' | 'wait';
    payload: unknown;
  };
}

const ExpenseSchema = z.object({
  description: z.string().min(1),
  cost: z.number().positive(),
  categoryName: z.string()
});

export type ExpenseType = z.infer<typeof ExpenseSchema>;

export interface ReportData {
  expenses: (Expense & { category: Category })[];
  summary: {
    totalExpenses: number;
    byCategory: {
      category: string;
      total: number;
      count: number;
    }[];
  };
  dateRange: {
    from: Date;
    to: Date;
  };
}
