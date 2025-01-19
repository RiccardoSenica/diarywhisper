import { Prisma } from '@prisma/client';
import prisma from '@prisma/prisma';
import { ShortcutsResponse } from '@utils/types';

export async function processDayLog(
  text: string,
  date?: Date
): Promise<ShortcutsResponse> {
  try {
    const normalizedDate = new Date(date || new Date());
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const newComment: Prisma.JsonObject = {
      text,
      timestamp: new Date().toISOString()
    };

    const existingLog = await prisma.dayLog.findUnique({
      where: {
        date: normalizedDate
      }
    });

    if (existingLog) {
      let existingComments: Prisma.JsonArray = [];

      if (Array.isArray(existingLog.comments)) {
        existingComments = existingLog.comments as Prisma.JsonArray;
      }

      const updatedLog = await prisma.dayLog.update({
        where: {
          id: existingLog.id
        },
        data: {
          comments: [...existingComments, newComment]
        }
      });

      return {
        success: true,
        message: `Added comment to existing log for ${normalizedDate.toLocaleDateString()}`,
        data: updatedLog
      };
    } else {
      const newLog = await prisma.dayLog.create({
        data: {
          date: normalizedDate,
          comments: [newComment]
        }
      });

      return {
        success: true,
        message: `Created new log for ${normalizedDate.toLocaleDateString()}`,
        data: newLog
      };
    }
  } catch (error) {
    console.error('Error processing daylog:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to process daylog'
    };
  }
}
