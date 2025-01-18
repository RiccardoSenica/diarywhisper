import { formatApiResponse } from '@utils/formatApiResponse';
import { STATUS_OK, STATUS_UNAUTHORIZED } from '@utils/statusCodes';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (
    !process.env.API_KEY ||
    request.headers.get('Authorization') !== `Bearer ${process.env.API_KEY}`
  ) {
    return formatApiResponse(STATUS_UNAUTHORIZED, 'Unauthorized');
  }

  return formatApiResponse(STATUS_OK, 'Ok');
}
