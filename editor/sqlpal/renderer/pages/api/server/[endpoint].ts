import config from '@/server-config';
import { NextApiRequest, NextApiResponse } from 'next';

async function serverCall(req: NextApiRequest, res: NextApiResponse) {
  const {endpoint} = req.query;
  console.log('Handling request', {
    app: 'server call',
    meta: req.body,
  });
  const t1 = Date.now();
  try {
    const response = await fetch(`${config.server?.url}/${endpoint}`, {
      method: req.method,
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });
    const output = await response.json();
    const t2 = Date.now();
    console.log(`Total runtime took ${t2 - t1}`, {
      app: 'server call',
      meta: {
        t2,
        t1,
      },
    });
    return res.status(200).json(output);
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? 'Unknown error' });
  }
}

export default serverCall;