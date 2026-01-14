import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser as we're handling multipart form data
  },
};

export async function GET(req: NextRequest) {
  try {
    // Get auth token from cookies
    const authCookie = req.cookies.get('optisage-token')?.value;

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters from the request
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query string for backend API
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const queryString = queryParams.toString();

    // Forward the request to the backend API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    const response = await fetch(`${baseUrl}/upc-scanner${queryString ? `?${queryString}` : ''}`, {
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
    console.error('Error fetching UPC scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UPC scans' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get auth token from cookies
    const authCookie = req.cookies.get('optisage-token')?.value;

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the content type to verify it's a multipart form
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Forward the request with its body and auth token to the backend API
    const formData = await req.formData();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    const response = await fetch(`${baseUrl}/upc-scanner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authCookie}`,
        // Don't set content-type as fetch will set it automatically with the correct boundary
      },
      body: formData,
    });

    // Get the response data
    const data = await response.json();

    // Return the API response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error uploading UPC scan:', error);
    return NextResponse.json(
      { error: 'Failed to upload UPC scan' },
      { status: 500 }
    );
  }
}