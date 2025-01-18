import { z } from 'zod';

export interface ResponseType {
  success: boolean;
  message: string;
}

export const CommandSchema = z.object({
  message: z.string()
});

export type CommandType = z.infer<typeof CommandSchema>;
