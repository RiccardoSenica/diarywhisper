import { ShortcutsResponse } from './types';
import { pingCommand } from './commands/ping';
import { expenseCommand } from './commands/expense';
import { CommandParser, expenseCommands } from './commandParser';

type CommandHandler = (
  parameters?: Record<string, string>
) => Promise<ShortcutsResponse>;

export class CommandRegistry {
  private commands: Map<string, CommandHandler>;
  private parser: CommandParser;

  constructor() {
    this.commands = new Map();
    this.parser = new CommandParser();
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    this.commands.set('ping', pingCommand);
    this.commands.set('expense', expenseCommand);
    
    expenseCommands.forEach(cmd => {
      this.parser.registerCommand(cmd);
    });
  }

  register(command: string, handler: CommandHandler) {
    this.commands.set(command.toLowerCase(), handler);
  }

  getCommand(command: string): CommandHandler | undefined {
    return this.commands.get(command.toLowerCase());
  }

  getParser(): CommandParser {
    return this.parser;
  }
}