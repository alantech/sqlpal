import { Knex, knex } from 'knex';
import { NextApiRequest, NextApiResponse } from 'next';
import { QueryResult } from 'pg';
import { ParsedQuery, SQLDialect, SQLSurveyor } from 'sql-surveyor';

enum KnexClient {
  MYSQL = 'mysql',
  TSQL = 'mssql',
  PLpgSQL = 'pg',
}

async function run(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'run',
    meta: req.body,
  });
  const execTime = 15 * 60 * 1000; // 15 minutes ought to be enough for anyone ;)
  const t1 = Date.now();
  try {
    const output = await until(
      (async () => {
        const { connString, sql, dialect } = req.body;
        const out = await runSql(sql, connString, dialect);
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

async function runSql(sql: string, connectionString: string, dialect: keyof typeof SQLDialect) {
  const out: any = [];
  const surveyor = new SQLSurveyor(SQLDialect[dialect] ?? SQLDialect.PLpgSQL);
  const client = getDbClient(connectionString, dialect);
  if (SQLDialect[dialect] === SQLDialect.TSQL) {
    try {
      const queryRes = await client.raw(sql);
      out.push({
        statement: sql,
        queryRes,
      });
    } catch (e) {
      throw e;
    } finally {
      await client.destroy();
    }
  } else {
    const parsedSql = surveyor.survey(sql);
    const stmts = Object.values(parsedSql?.parsedQueries ?? {}).map((q: ParsedQuery) => q.query);
    for (const stmt of stmts) {
      try {
        const queryRes = await client.raw(stmt);
        out.push({
          statement: stmt,
          queryRes,
        });
      } catch (e) {
        throw e;
      }
    }
    try {
      await client?.destroy();
    } catch (e) {
      console.error(e);
    }
  }
  switch (KnexClient[dialect as keyof typeof KnexClient]) {
    case KnexClient.PLpgSQL: {
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
    case KnexClient.MYSQL: {
      return out.map((t: { statement: any; queryRes: any }) => {
        const [result, fields] = t.queryRes;
        if (
          !!result &&
          result.affectedRows !== undefined &&
          result.affectedRows !== null &&
          typeof result.affectedRows === 'number'
        ) {
          return { statement: t.statement, affected_records: result.affectedRows };
        } else if (!!result && result.length > 0 && typeof result[0] === 'object') {
          return {
            statement: t.statement,
            result,
            types: Object.fromEntries(fields.map((f: any) => [f.name, f.type])),
          };
        } else {
          return { statement: t.statement, error: `unexpected result: ${JSON.stringify(t.queryRes)}` }; // TODO: Error this out
        }
      });
    }
    case KnexClient.TSQL: {
      return out.map((t: { statement: any; queryRes: any }) => {
        const result = t.queryRes;
        if (!!result && Array.isArray(result) && !t.statement.includes('SELECT') && result.length === 0) {
          // todo: improve this
          return { statement: t.statement, affected_records: 'unknown' };
        } else if (!!result) {
          return { statement: t.statement, result };
        } else {
          return { statement: t.statement, error: `unexpected result: ${JSON.stringify(t.queryRes)}` }; // TODO: Error this out
        }
      });
    }
    default: {
      return out;
    }
  }
}

function isString(obj: unknown): obj is string {
  return typeof obj === 'string';
}

export function getDbClient(
  connectionString: string,
  dialect: keyof typeof SQLDialect,
): Knex<any, unknown[]> {
  const dbId = connectionString.split('/').pop()?.split('?')[0];
  const username = connectionString.split('/')[2].split(':')[0];
  const password = connectionString.split('/')[2].split(':')[1].split('@')[0];
  const host = connectionString.split('/')[2].split(':')[1].split('@')[1];
  const ssl = connectionString.includes('sslmode=require');
  return knex({
    client: KnexClient[dialect as keyof typeof KnexClient],
    connection: {
      database: dbId,
      user: username,
      password,
      host,
      ssl,
    },
  });
}

export default run;
