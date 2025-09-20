import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secretHeader = req.headers['x-cron-secret'];
  const secret = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;

  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const host = req.headers.host;
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    if (!host) {
      // If host is not available, still respond success but note the limitation
      return res.status(200).json({ success: true, message: 'Cron verified but no host header present to invoke internal jobs.' });
    }

    const baseUrl = `${forwardedProto}://${host}`;
    const rescanUrl = `${baseUrl}/api/cron/rescan-attachments`;

    const resp = await fetch(rescanUrl, {
      method: 'POST',
      headers: { 'x-cron-secret': secret },
    });

    let body = null;
    try {
      body = await resp.json();
    } catch (err) {
      body = null;
    }

    return res.status(200).json({ success: true, message: 'Cron executed', rescanStatus: resp.status, rescanBody: body });
  } catch (error) {
    // avoid leaking details
    return res.status(500).json({ error: 'Cron job failed to execute' });
  }
}
