import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // The URL of your external Google Cloud Run function
    const externalUrl = 'https://transfer-argentina-function-582538203517.us-central1.run.app';
    
    // Forward the request body to the external function
    const body = await request.json();

    const externalResponse = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!externalResponse.ok) {
      // If the external function returns an error, pass it along
      const errorText = await externalResponse.text();
      console.error(`External function error: ${externalResponse.status} ${externalResponse.statusText}`, errorText);
      return new NextResponse(errorText, { status: externalResponse.status });
    }

    const data = await externalResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in proxy POST route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const externalUrl = 'https://transfer-argentina-function-582538203517.us-central1.run.app';
    const externalResponse = await fetch(externalUrl);

     if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error(`External function GET error: ${externalResponse.status} ${externalResponse.statusText}`, {
        errorBody: errorText,
      });
      return new NextResponse(errorText, { status: externalResponse.status });
    }

    const data = await externalResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in proxy GET route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
