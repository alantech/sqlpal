import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'pgsql-parser';

async function sqlParse(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'parse',
    meta: req.body,
  });
  const t1 = Date.now();
  const { content } = req.body;
  try {
    const output = parse(content);
    const t2 = Date.now();
    console.log(`Total runtime took ${t2 - t1}`, {
      app: 'parse',
      meta: {
        t2,
        t1,
      },
    });
    return res.status(200).json(output);
  } catch (e: any) {
    return res.status(401).json({ message: e?.message ?? 'Unknown error' });
  }
}

export default sqlParse;
