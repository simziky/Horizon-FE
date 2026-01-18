import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
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
    
    const response = await fetch(`${baseUrl}/upc-scanner/${scanId}`, {
      method: 'DELETE',
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
        { status: 200, message: 'Scan deleted successfully', data: null },
        { status: 200 }
      );
    }
    
    // Parse JSON if response has content
    const data = text ? JSON.parse(text) : null;

    // Return the API response
    return NextResponse.json(data || { status: 200, message: 'Scan deleted successfully' }, { status: response.status });
  } catch (error) {
    console.error('Error deleting UPC scan:', error);
    return NextResponse.json(
      { error: 'Failed to delete UPC scan' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    // Await params since it's a Promise in Next.js 15+
    const { scanId } = await params;
    
    // Get auth token from cookies
    const authCookie = request.cookies.get('optisage-token')?.value;

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the backend API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
    
    console.log(`Fetching from: ${baseUrl}/upc-scanner/${scanId}`);
    const response = await fetch(`${baseUrl}/upc-scanner/${scanId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authCookie}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is ok
    if (!response.ok) {
      return NextResponse.json(
        { error: `Server responded with status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the API response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching scan details:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan details" },
      { status: 500 }
    );
  }
}