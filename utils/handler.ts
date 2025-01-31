import { ShortcutsRequest, ShortcutsResponse } from './types';
import { CommandRegistry } from './registry';

export class ShortcutsHandler {
  private registry: CommandRegistry;

  constructor() {
    this.registry = new CommandRegistry();
  }

  validateRequest(req: ShortcutsRequest): boolean {
    try {
      const isValidUser = req.apiKey === process.env.API_KEY;
      return !!isValidUser;
    } catch (error) {
      console.error('Error validating request:', error);
      return false;
    }
  }

  async processCommand(
    command: string,
    parameters?: Record<string, string>
  ): Promise<ShortcutsResponse> {
    if (command === 'expense') {
      const handler = this.registry.getCommand(command);
      if (!handler) {
        return {
          success: false,
          message: `Unknown command: ${command}`
        };
      }

      return handler(parameters);
    }

    const handler = this.registry.getCommand(command);
    if (!handler) {
      return {
        success: false,
        message: `Unknown command: ${command}`
      };
    }

    try {
      return await handler(parameters);
    } catch (error) {
      console.error(`Error processing command ${command}:`, error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while processing your command'
      };
    }
  }
}
