
import { NextResponse } from 'next/server';
import { extractData, type ExtractDataInput } from '@/ai/flows/extract-data-flow';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body: ExtractDataInput = await request.json();
    
    // Call the Genkit flow
    const processedData = await extractData(body);

    // Save the processed data to Firestore
    if (processedData && processedData.products && processedData.products.length > 0) {
      await dbAdmin.collection("processed_files").add({
        products: processedData.products,
        created_time: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error('Error in processing route:', error);
    
    const errorMessage = error.message || 'An unknown error occurred';
    
    return NextResponse.json(
        { 
            message: 'Internal Server Error during file processing.', 
            error: errorMessage,
            details: error.cause || null
        }, 
        { 
            status: 500,
        }
    );
  }
}

export async function GET() {
    return NextResponse.json({ message: "This endpoint is for processing files via POST request." });
}
