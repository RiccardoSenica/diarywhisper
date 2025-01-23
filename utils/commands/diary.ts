import { ExpenseType, ShortcutsResponse } from '@utils/types';
import { CommandParser, diaryCommands } from './helpers/commandParser';
import { Category, Expense } from '@prisma/client';
import { ExpenseReporter } from './report';
import {
  createExpense,
  deleteExpense,
  updateExpense
} from '@utils/commands/helpers/expense';
import { processDayLog } from '@utils/commands/helpers/dayLog';

const formatResponse = (expense: Expense & { category: Category }) => ({
  id: expense.id,
  description: expense.description,
  cost: expense.cost,
  category: expense.category.name,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt
});

export async function diaryCommand(
  parameters: Record<string, string> | undefined
): Promise<ShortcutsResponse> {
  try {
    if (!parameters || !parameters['instruction']) {
      return {
        success: false,
        message: 'Instruction parameter is missing.'
      };
    }

    const parser = new CommandParser();
    diaryCommands.forEach(cmd => parser.registerCommand(cmd));

    const parsedCommand = parser.parse(parameters['instruction']);

    switch (parsedCommand.command) {
      case 'add': {
        const categoryName =
          (parsedCommand.flags.cat as string) || process.env.DEFAULT_CATEGORY;
        if (!categoryName) {
          throw new Error('DEFAULT_CATEGORY environment variable is not set');
        }

        const expense = await createExpense({
          description: parsedCommand.flags.desc as string,
          cost: parsedCommand.flags.cost as number,
          date: (parsedCommand.flags.date as Date) || new Date(),
          categoryName
        });

        const formatted = formatResponse(expense);
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
        if (parsedCommand.flags.desc)
          updateData.description = parsedCommand.flags.desc as string;
        if (parsedCommand.flags.cost)
          updateData.cost = parsedCommand.flags.cost as number;
        if (parsedCommand.flags.cat)
          updateData.categoryName = parsedCommand.flags.cat as string;

        const expense = await updateExpense(parsedCommand.id, updateData);
        const formatted = formatResponse(expense);

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

      case 'report': {
        try {
          const reporter = new ExpenseReporter();
          const from = parsedCommand.flags.from as Date;
          const to = (parsedCommand.flags.to as Date) || new Date();
          const includeJson = (parsedCommand.flags.export as boolean) || false;

          await reporter.sendReport(from, to, includeJson);

          const formatDate = (date: Date) =>
            date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

          return {
            success: true,
            message: `Report sent for period: ${formatDate(from)} to ${formatDate(to)}`
          };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to generate report'
          };
        }
      }

      case 'daylog': {
        const stars = parsedCommand.flags.stars as number;
        const text = parsedCommand.flags.text as string;
        const date = (parsedCommand.flags.date as Date) || new Date();

        return processDayLog(stars, text, date);
      }

      default:
        return {
          success: false,
          message: `Unknown command: ${parsedCommand.command}`
        };
    }
  } catch (error) {
    console.error('Error processing expense command:', error);

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
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
