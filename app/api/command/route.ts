import { ShortcutsHandler } from '@utils/handler';
import { RequestSchema } from '@utils/types';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.API_KEY) {
      throw new Error('API KEY  environment variable is not set');
    }

    const body = await req.json();

    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request format.',
          errors: result.error.errors
        },
        { status: 400 }
      );
    }

    const shortcutsHandler = new ShortcutsHandler();
    const isValid = shortcutsHandler.validateRequest(result.data);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.'
        },
        { status: 401 }
      );
    }

    const response = await shortcutsHandler.processCommand(
      result.data.command,
      result.data.parameters
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing shortcuts request:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request.'
      },
      { status: 500 }
    );
  }
}
