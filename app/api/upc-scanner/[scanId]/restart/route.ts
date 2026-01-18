import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    // Get auth token from cookies
    const authCookie = req.cookies.get('optisage-token')?.value;

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Await params since it's a Promise in Next.js 15+
    const { scanId } = await params;
    
    // Forward the request to the backend API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    const response = await fetch(`${baseUrl}/upc-scanner/${scanId}/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authCookie}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is empty before parsing
    const text = await response.text();
    
    // Handle empty response
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { status: 200, message: 'Scan restart initiated', data: null },
        { status: 200 }
      );
    }
    
    // Parse JSON if response has content
    const data = text ? JSON.parse(text) : null;

    // Return the API response
    return NextResponse.json(data || { status: 200, message: 'Scan restart initiated' }, { status: response.status });
  } catch (error) {
    console.error('Error restarting UPC scan:', error);
    return NextResponse.json(
      { error: 'Failed to restart UPC scan' },
      { status: 500 }
    );
  }
}