import { CommandDefinition } from '@utils/types';

export class CommandParser {
  private commands: Map<string, CommandDefinition>;

  constructor() {
    this.commands = new Map();
  }

  registerCommand(definition: CommandDefinition) {
    this.commands.set(definition.name.toLowerCase(), definition);
  }

  parse(input: string): {
    command: string;
    id?: string;
    flags: Record<string, string | number | boolean | Date>;
  } {
    const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (!parts || parts.length === 0) {
      throw new Error('Invalid command format');
    }

    const command = parts[0].toLowerCase();
    const definition = this.commands.get(command);

    if (!definition) {
      throw new Error(`Unknown command: ${command}`);
    }

    let currentIndex = 1;
    const flags: Record<string, string | number | boolean | Date> = {};

    if (definition.hasId) {
      if (parts.length < 2) {
        throw new Error(`Command ${command} requires an ID`);
      }
      const id = parts[1];
      currentIndex = 2;
      flags.id = id;
    }

    while (currentIndex < parts.length) {
      const flag = parts[currentIndex];
      if (!flag.startsWith('-')) {
        throw new Error(`Invalid flag format at: ${flag}`);
      }

      const flagName = flag.slice(1);
      const flagDef = definition.flags.find(
        f => f.name === flagName || f.alias === flagName
      );

      if (!flagDef) {
        throw new Error(`Unknown flag: ${flagName}`);
      }

      currentIndex++;
      if (currentIndex >= parts.length) {
        throw new Error(`Missing value for flag: ${flagName}`);
      }

      const value = parts[currentIndex].replace(/^"(.*)"$/, '$1');

      switch (flagDef.type) {
        case 'number': {
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`Invalid number for flag ${flagName}: ${value}`);
          }
          flags[flagDef.name] = num;
          break;
        }
        case 'date': {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date for flag ${flagName}: ${value}`);
          }
          flags[flagDef.name] = date;
          break;
        }
        case 'boolean': {
          flags[flagDef.name] = value.toLowerCase() === 'true';
          break;
        }
        default: {
          flags[flagDef.name] = value;
        }
      }

      currentIndex++;
    }

    for (const flagDef of definition.flags) {
      if (flagDef.required && !(flagDef.name in flags)) {
        throw new Error(`Missing required flag: ${flagDef.name}`);
      }
    }

    return {
      command,
      ...(flags.id ? { id: flags.id as string } : {}),
      flags: Object.fromEntries(
        Object.entries(flags).filter(([key]) => key !== 'id')
      )
    };
  }
}

export const diaryCommands: CommandDefinition[] = [
  {
    name: 'add',
    flags: [
      { name: 'desc', type: 'string', required: true },
      { name: 'cost', type: 'number', required: true },
      { name: 'cat', type: 'string', required: false },
      { name: 'date', type: 'date', required: false }
    ]
  },
  {
    name: 'update',
    hasId: true,
    flags: [
      { name: 'desc', type: 'string', required: false },
      { name: 'cost', type: 'number', required: false },
      { name: 'cat', type: 'string', required: false }
    ]
  },
  {
    name: 'delete',
    hasId: true,
    flags: []
  },
  {
    name: 'report',
    flags: [
      { name: 'from', type: 'date', required: true },
      { name: 'to', type: 'date', required: false },
      { name: 'export', type: 'boolean', required: false }
    ]
  },
  {
    name: 'daylog',
    flags: [
      { name: 'stars', type: 'number', required: true },
      { name: 'text', type: 'string', required: true },
      { name: 'date', type: 'date', required: false }
    ]
  }
];
