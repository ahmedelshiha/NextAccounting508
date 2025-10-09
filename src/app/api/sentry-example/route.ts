export async function GET(request: Request) {
  const redirectUrl = new URL('/api/sentry-check', request.url)
  return Response.redirect(redirectUrl, 307)
}
