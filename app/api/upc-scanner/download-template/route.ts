import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get cookies to forward them for authentication
    const authCookie = req.cookies.get('optisage-token')?.value;
    
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the actual backend API with authentication
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}/upc-scanner/download-template`, {
      headers: {
        'Authorization': `Bearer ${authCookie}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from upstream API:', errorText);
      return NextResponse.json(
        { error: 'Failed to download template from API' },
        { status: response.status }
      );
    }
    
    // Get the file from the backend API
    const fileData = await response.arrayBuffer();
    
    // Return the file as a response
    return new NextResponse(fileData, {
      headers: {
        'Content-Disposition': 'attachment; filename="upc-template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    
  } catch (error) {
    console.error('Error proxying template download:', error);
    return NextResponse.json(
      { error: 'Failed to download template' },
      { status: 500 }
    );
  }
}
