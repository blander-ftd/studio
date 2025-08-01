
import { NextResponse } from 'next/server';
import { extractData, type ExtractDataInput } from '@/ai/flows/extract-data-flow';

export async function POST(request: Request) {
  try {
    const body: ExtractDataInput = await request.json();
    
    // Call the Genkit flow
    const processedData = await extractData(body);

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error('Error in processing route:', error);
    
    const errorMessage = error.message || 'An unknown error occurred';
    const errorStack = error.stack || 'No stack trace available';

    // Log the full error for debugging
    console.error(`Error processing file: ${errorMessage}`, {
      stack: errorStack,
      details: error.cause // Genkit often includes more details in the cause property
    });

    return new NextResponse(
        JSON.stringify({ 
            message: 'Internal Server Error during file processing.', 
            error: errorMessage,
        }), 
        { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
  }
}

export async function GET() {
    return NextResponse.json({ message: "This endpoint is for processing files via POST request." });
}
