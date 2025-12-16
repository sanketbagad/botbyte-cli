import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const searchParams = request.nextUrl.searchParams;
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${backendUrl}/api/auth/${pathStr}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process auth request' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const body = await request.json().catch(() => ({}));
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${backendUrl}/api/auth/${pathStr}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process auth request' },
      { status: 500 }
    );
  }
}
