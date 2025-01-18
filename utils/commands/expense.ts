import prisma from '@prisma/prisma';
import { ExpenseSchema, ExpenseType, ShortcutsResponse } from '../types';

export const createExpense = async (expense: ExpenseType) => {
  const newExpense = await prisma.expense.create({
    data: {
      description: expense.description,
      cost: expense.cost,
      categoryId: ''
    }
  });

  return newExpense;
};

export async function expenseCommand(
  parameters: Record<string, string> | undefined
): Promise<ShortcutsResponse> {
  try {
    if (!parameters || !parameters['message']) {
      return {
        success: false,
        message: 'Message parameter is missing.'
      };
    }

    const commandElements = parameters['message'].split(' ');

    if (commandElements.length != 3) {
      return {
        success: false,
        message: 'Message format not valid.'
      };
    }

    const parsedCommand = ExpenseSchema.safeParse({
      description: commandElements[1],
      cost: commandElements[2]
    });

    if (parsedCommand.error) {
      return {
        success: false,
        message: 'Message format not valid.'
      };
    }

    if (commandElements[0] === 'add') {
      await createExpense(parsedCommand.data);
    }

    return {
      success: true,
      message: `${parsedCommand.data.description} registered as .`
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'An error occurred.'
    };
  }
}
