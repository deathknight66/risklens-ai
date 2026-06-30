import { NextResponse } from 'next/server';

/**
 * Handles the redirect from the IdP.
 * Since NextAuth CredentialsProvider requires a POST request,
 * we return an HTML page that automatically POSTs the token to NextAuth.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  // Create an auto-submitting form
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSO Authentication...</title>
        <style>
          body { background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
          .loader { border: 3px solid #1e293b; border-top: 3px solid #6366f1; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <div class="loader"></div>
          <p style="margin-top: 16px; color: #94a3b8;">Completing SSO login...</p>
        </div>
        <form id="ssoForm" action="/api/auth/callback/credentials" method="POST">
          <input type="hidden" name="sso_token" value="${token}" />
          <!-- CSRF token is required by NextAuth, but we can pass it if we fetch it, or bypass it if NextAuth allows -->
        </form>
        <script>
          // NextAuth requires CSRF token for POST requests
          fetch('/api/auth/csrf')
            .then(res => res.json())
            .then(data => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'csrfToken';
              input.value = data.csrfToken;
              document.getElementById('ssoForm').appendChild(input);
              document.getElementById('ssoForm').submit();
            });
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
