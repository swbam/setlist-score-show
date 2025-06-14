export default async function handler(req: Request) {
  return new Response('Deprecated: use /cron/refresh-trending-views', { status: 200 });
}
