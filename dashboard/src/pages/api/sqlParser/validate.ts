import { RawStmt } from 'libpg-query';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'pgsql-parser';
import { inspect } from 'util';

import { validateStatement } from './validators';

export type Schema = {
  [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
    recordCount: number;
  };
};

async function validate(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'parse',
    meta: req.body,
  });
  const t1 = Date.now();
  const { content, schema } = req.body;
  // try to parse content
  let parsedContent: { RawStmt: RawStmt }[];
  try {
    parsedContent = parse(content);
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? 'Unknown error' });
  }
  console.log('Parsed content', {
    app: 'parse',
    meta: parsedContent,
  });
  // validate parsed content
  const rawStmt = parsedContent?.[0]?.RawStmt as RawStmt | undefined;
  let validationErr: string = '';
  try {
    if (rawStmt) validationErr = validateStatement(rawStmt, schema);
  } catch (e: any) {
    console.error('Error validating statement', {
      app: 'parse',
      meta: {
        error: e?.message ?? 'Unknown error',
        rawStmt: JSON.stringify(rawStmt),
      },
    });
  }
  const t2 = Date.now();
  console.log(`Total runtime took ${t2 - t1}`, {
    app: 'parse',
    meta: {
      t2,
      t1,
    },
  });
  if (validationErr) return res.status(400).json({ message: validationErr });
  return res.status(200).json(parsedContent);
}

export default validate;
