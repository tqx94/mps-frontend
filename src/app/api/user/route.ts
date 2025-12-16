import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const userData = await request.json();
    return NextResponse.json({ message: 'User created', data: userData });
}