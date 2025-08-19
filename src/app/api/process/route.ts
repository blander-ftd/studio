
import { NextResponse } from 'next/server';
import { extractData, type ExtractDataInput } from '@/ai/flows/extract-data-flow';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body: ExtractDataInput = await request.json();
    const { uploadedBy, ...extractDataInput } = body;
    
    // Call the Genkit flow
    const processedData = await extractData(extractDataInput);

    console.log('Data from Gemini:', JSON.stringify(processedData, null, 2));

    // Save the processed data to Firestore only in production
    if (process.env.NODE_ENV === 'production' && processedData) {
      const { general_data, promotions } = processedData;
      await dbAdmin.collection('processed_files').add({
        ...general_data,
        ...promotions,
        uploaded_by: uploadedBy,
        created_time: FieldValue.serverTimestamp(),
      });
    } else if (processedData) {
      const { general_data, promotions } = processedData;
      const firebaseData = {
        ...general_data,
        ...promotions,
        uploaded_by: uploadedBy,
        created_time: new Date(),
      };
      console.log('Firebase data (local):', JSON.stringify(firebaseData, null, 2));
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
