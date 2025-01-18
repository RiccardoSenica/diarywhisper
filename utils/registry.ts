import { ShortcutsResponse } from './types';
import { pingCommand } from './commands/ping';
import { expenseCommand } from './commands/expense';

type CommandHandler = (
  parameters?: Record<string, string>
) => Promise<ShortcutsResponse>;

export class CommandRegistry {
  private commands: Map<string, CommandHandler>;

  constructor() {
    this.commands = new Map();
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    this.register('ping', pingCommand);
    this.register('expense', expenseCommand);
  }

  register(command: string, handler: CommandHandler) {
    this.commands.set(command.toLowerCase(), handler);
  }

  getCommand(command: string): CommandHandler | undefined {
    return this.commands.get(command.toLowerCase());
  }
}
