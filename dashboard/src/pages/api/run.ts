import { NextApiRequest, NextApiResponse } from 'next';
import pg, { QueryResult } from 'pg';
import { parse, deparse } from 'pgsql-parser';

async function run(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'run',
    env: process.env.IASQL_ENV,
    meta: req.body,
  });
  const execTime = 15 * 60 * 1000; // 15 minutes ought to be enough for anyone ;)
  const t1 = Date.now();
  try {
    const output = await until(
      (async () => {
        const { connString, sql } = req.body;
        const out = await runSql(sql, connString, res);
        return out;
      })(),
      execTime - 100,
    );
    const t2 = Date.now();
    console.log(`Total runtime took ${t2 - t1}`, {
      app: 'run',
      meta: {
        t2,
        t1,
      },
      env: process.env.IASQL_ENV,
    });
    return res.status(200).json(output);
  } catch (e: any) {
    return res.status(401).json({ message: e?.message ?? 'Unknown error' });
  }
}

function until<T>(p: Promise<T>, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let finished: boolean = false;
    p.then((val: any) => {
      if (!finished) {
        finished = true;
        resolve(val);
      }
    }).catch((err: any) => {
      if (!finished) {
        finished = true;
        reject(err);
      }
    });
    setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error(`Timeout of ${timeout}ms reached`));
      }
    }, timeout);
  });
}

async function runSql(sql: string, connectionString: string, res: NextApiResponse) {
  const out: any = [];
  let connTemp;
  const stmts = parse(sql);
  for (const stmt of stmts) {
    const dbId = connectionString.split('/').pop();
    const username = connectionString.split('/')[2].split(':')[0];
    const password = connectionString.split('/')[2].split(':')[1].split('@')[0];
    const host = connectionString.split('/')[2].split(':')[1].split('@')[1];
    const ssl = connectionString.includes('sslmode=require');
    connTemp = new pg.Client({
      database: dbId,
      user: username,
      password,
      host,
      ssl,
    });
    // Based on https://node-postgres.com/apis/client#error
    connTemp.on('error', e => {
      console.error('Connection error', {
        app: 'run',
        env: process.env.IASQL_ENV,
        meta: {
          sql,
          error: e.message,
          stack: e.stack,
        },
      });
      res.status(500).json({
        error: `Connection interruption while executing query ${sql}`,
      });
    });
    await connTemp.connect();
    const deparsedStmt = deparse(stmt);
    try {
      const queryRes = await connTemp.query(deparsedStmt);
      out.push({
        statement: deparsedStmt,
        queryRes,
      });
    } catch (e) {
      throw e;
    } finally {
      await connTemp?.end();
    }
  }
  // Let's make this a bit easier to parse. Error -> error path, single table -> array of objects,
  // multiple tables -> array of array of objects
  return out.map((t: { statement: any; queryRes: QueryResult }) => {
    if (
      !!t.queryRes.rows &&
      t.queryRes.rows.length === 0 &&
      t.queryRes.command !== 'SELECT' &&
      typeof t.queryRes.rowCount === 'number'
    ) {
      return { statement: t.statement, affected_records: t.queryRes.rowCount };
    } else if (isString(t.queryRes)) {
      return { statement: t.statement, result: t.queryRes };
    } else if (!!t.queryRes.rows) {
      return {
        statement: t.statement,
        result: t.queryRes.rows,
        types: Object.fromEntries(t.queryRes.fields.map(f => [f.name, f.dataTypeID])),
      };
    } else {
      return { statement: t.statement, error: `unexpected result: ${t.queryRes}` }; // TODO: Error this out
    }
  });
}

function isString(obj: unknown): obj is string {
  return typeof obj === 'string';
}

export default run;
