interface Response {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: any[];
}

interface ErrorResponse {
  error: string;
}

const newResponse = (body: Response | ErrorResponse, status: number) =>
  new Response(JSON.stringify(body), { status });

export async function POST({ request }: { request: Request }) {
  try {
    const data = await request.json();

    const recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify';
    const requestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const requestBody = new URLSearchParams({
      secret: import.meta.env.RECAPTCHA_SECRET_KEY,
      response: data.recaptcha,
    });

    const response = await fetch(recaptchaURL, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody.toString(),
    });

    const responseData = (await response.json()) as Response;

    if (!responseData.success) {
      return newResponse({ error: 'Invalid reCAPTCHA response' }, 400);
    }
    return newResponse(responseData, 200);
  } catch (error) {
    if (error instanceof Error) {
      return newResponse({ error: error.message }, 500);
    }
    return newResponse({ error: 'An unknown error occurred' }, 500);
  }
}
