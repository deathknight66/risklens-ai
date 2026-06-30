import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const successUrl = searchParams.get('success');

  if (!successUrl) {
    return NextResponse.json({ error: 'Missing success URL' }, { status: 400 });
  }

  // In a real flow, Stripe redirects back. We simulate that by just redirecting back immediately.
  // The webhook is also firing in the background.
  return NextResponse.redirect(successUrl);
}
