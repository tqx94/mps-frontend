import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ 
        essage: 'Test endpoint is working!' });
}