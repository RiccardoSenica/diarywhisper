import prisma from '@prisma/prisma';
import { z } from 'zod';
import { ShortcutsResponse } from '../types';
import { CommandParser, expenseCommands } from './../commandParser';
import { Category, Expense } from '@prisma/client';

const ExpenseSchema = z.object({
  description: z.string().min(1),
  cost: z.number().positive(),
  categoryName: z.string()  // Category is required in your schema
});

type ExpenseType = z.infer<typeof ExpenseSchema>;

const createOrGetCategory = async (name: string) => {
  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name }
  });
  return category;
};

const createExpense = async (data: ExpenseType) => {
  // Category is required, so we always create/get it
  const category = await createOrGetCategory(data.categoryName);

  const newExpense = await prisma.expense.create({
    data: {
      description: data.description,
      cost: data.cost,
      categoryId: category.id,
      deleted: false  // Explicit set as per your schema
    },
    include: {
      category: true
    }
  });

  return newExpense;
};

const updateExpense = async (id: string, data: Partial<ExpenseType>) => {
  let categoryId = undefined;
  
  if (data.categoryName) {
    const category = await createOrGetCategory(data.categoryName);
    categoryId = category.id;
  }

  const updatedExpense = await prisma.expense.update({
    where: { 
      id,
      deleted: false  // Only update non-deleted expenses
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.cost && { cost: data.cost }),
      ...(categoryId && { categoryId })
    },
    include: {
      category: true
    }
  });

  return updatedExpense;
};

const deleteExpense = async (id: string) => {
  // Soft delete as per your schema
  await prisma.expense.update({
    where: { 
      id,
      deleted: false  // Prevent re-deleting
    },
    data: {
      deleted: true
    }
  });
};

const formatExpenseResponse = (expense: Expense & {category: Category}) => ({
  id: expense.id,
  description: expense.description,
  cost: expense.cost,
  category: expense.category.name,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt
});

export async function expenseCommand(
  parameters: Record<string, string> | undefined
): Promise<ShortcutsResponse> {
  try {
    if (!parameters || !parameters['instruction']) {
      return {
        success: false,
        message: 'Message parameter is missing.'
      };
    }

    const parser = new CommandParser();
    expenseCommands.forEach(cmd => parser.registerCommand(cmd));

    const parsedCommand = parser.parse(parameters['instruction']);

    switch (parsedCommand.command) {
      case 'add': {
        if (!parsedCommand.flags.cat) {
          return {
            success: false,
            message: 'Category is required'
          };
        }

        const expense = await createExpense({
          description: parsedCommand.flags.desc as string,
          cost: parsedCommand.flags.cost as number,
          categoryName: parsedCommand.flags.cat as string
        });

        const formatted = formatExpenseResponse(expense);
        return {
          success: true,
          message: `Added expense: ${formatted.description} (${formatted.cost.toFixed(2)}€) in category ${formatted.category}`,
          data: formatted
        };
      }

      case 'update': {
        if (!parsedCommand.id) {
          return {
            success: false,
            message: 'Expense ID is required for update'
          };
        }

        const updateData: Partial<ExpenseType> = {};
        if (parsedCommand.flags.desc) updateData.description = parsedCommand.flags.desc as string;
        if (parsedCommand.flags.cost) updateData.cost = parsedCommand.flags.cost as number;
        if (parsedCommand.flags.cat) updateData.categoryName = parsedCommand.flags.cat as string;

        const expense = await updateExpense(parsedCommand.id, updateData);
        const formatted = formatExpenseResponse(expense);
        
        return {
          success: true,
          message: `Updated expense: ${formatted.description} (${formatted.cost.toFixed(2)}€) in category ${formatted.category}`,
          data: formatted
        };
      }

      case 'delete': {
        if (!parsedCommand.id) {
          return {
            success: false,
            message: 'Expense ID is required for deletion'
          };
        }

        await deleteExpense(parsedCommand.id);
        return {
          success: true,
          message: `Deleted expense with ID: ${parsedCommand.id}`
        };
      }

      default:
        return {
          success: false,
          message: `Unknown command: ${parsedCommand.command}`
        };
    }
  } catch (error) {
    console.error('Error processing expense command:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return {
          success: false,
          message: 'Expense not found or already deleted'
        };
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}