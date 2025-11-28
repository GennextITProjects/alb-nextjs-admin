import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Express backend ko call karo
    const response = await fetch('http://localhost:3003/api/admin/adminLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Response banao
    const res = NextResponse.json(
      { 
        message: 'Login successful',
        token: data.token // Frontend localStorage ke liye
      },
      { status: 200 }
    );

    // Cookie mein token set karo (middleware ke liye)
    res.cookies.set('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}