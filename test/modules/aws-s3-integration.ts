import config from '../../src/config';
import * as iasql from '../../src/services/iasql';
import {
  getPrefix,
  runQuery,
  runInstall,
  runUninstall,
  runApply,
  finish,
  execComposeUp,
  execComposeDown,
  runSync,
} from '../helpers';

const prefix = getPrefix();
const dbAlias = 's3test';
const s3Name = `${prefix}${dbAlias}`;
const apply = runApply.bind(null, dbAlias);
const sync = runSync.bind(null, dbAlias);
const query = runQuery.bind(null, dbAlias);
const install = runInstall.bind(null, dbAlias);
const uninstall = runUninstall.bind(null, dbAlias);
const modules = ['aws_s3'];
const nonDefaultRegion = 'us-east-1';

const policyJSON = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'SamplePolicy',
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: ['arn:aws:s3:::' + s3Name + '/*'],
    },
  ],
};
const policyDocument = JSON.stringify(policyJSON);
policyJSON.Statement[0].Sid = 'UpdatePolicy';
const newPolicyDocument = JSON.stringify(policyJSON);

const updatedPolicyJSON = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'SamplePolicy',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::' + s3Name + '/*',
    },
  ],
};

const bucketContent = JSON.stringify({
  name: 'Iasql',
  value: 'Hello world!',
});

const updatedPolicyDocument = JSON.stringify(updatedPolicyJSON);
updatedPolicyJSON.Statement[0].Sid = 'UpdatePolicy';
const updatedNewPolicyDocument = JSON.stringify(updatedPolicyJSON);

jest.setTimeout(360000);
beforeAll(async () => await execComposeUp());
afterAll(async () => await execComposeDown());

describe('S3 Integration Testing', () => {
  it('creates a new test db', done =>
    void iasql.connect(dbAlias, 'not-needed', 'not-needed').then(...finish(done)));

  it('installs the aws_account module', install(['aws_account']));

  it(
    'inserts aws credentials',
    query(
      `
    INSERT INTO aws_credentials (access_key_id, secret_access_key)
    VALUES ('${process.env.AWS_ACCESS_KEY_ID}', '${process.env.AWS_SECRET_ACCESS_KEY}')
  `,
      undefined,
      false,
    ),
  );

  it('syncs the regions', sync());

  it(
    'sets the default region',
    query(`
    UPDATE aws_regions SET is_default = TRUE WHERE region = '${process.env.AWS_REGION}';
  `),
  );

  it('installs the s3 module', install(modules));

  it(
    'adds a new s3 bucket',
    query(`  
    INSERT INTO bucket (name)
    VALUES ('${s3Name}');
  `),
  );

  it('undo changes', sync());

  it(
    'check bucket insertion',
    query(
      `
    SELECT *
    FROM bucket 
    WHERE name = '${s3Name}';
  `,
      (res: any[]) => expect(res.length).toBe(0),
    ),
  );

  it(
    'adds a new s3 bucket',
    query(`  
    INSERT INTO bucket (name, policy_document)
    VALUES ('${s3Name}', '${policyDocument}');
  `),
  );

  it('applies the s3 bucket change', apply());

  it(
    'check s3 insertion',
    query(
      `
    SELECT *
    FROM bucket 
    WHERE name = '${s3Name}';
  `,
      (res: any[]) => expect(res.length).toBe(1),
    ),
  );

  it(
    'inserts content into bucket object',
    query(
      `INSERT INTO bucket_object (bucket_name, key, region) VALUES ('${s3Name}', 'fake_bucket', '${process.env.AWS_REGION}')`,
    ),
  );
  it('applies the s3 object removal', apply());

  it(
    'check fake object deletion',
    query(
      `
    SELECT *
    FROM bucket_object 
    WHERE bucket_name = '${s3Name}' AND key='fake_bucket';
  `,
      (res: any[]) => expect(res.length).toBe(0),
    ),
  );

  it(
    'adds content to bucket',
    query(
      `SELECT * FROM s3_upload_object('${s3Name}', 'iasql_message', '${bucketContent}', 'application/json')`,
      (res: any[]) => expect(res[0].status).toStrictEqual('OK'),
    ),
  );
  it(
    'adds new content to bucket',
    query(
      `SELECT * FROM s3_upload_object('${s3Name}', 'iasql_message_1', '${bucketContent}', 'application/json')`,
      (res: any[]) => expect(res[0].status).toStrictEqual('OK'),
    ),
  );

  it(
    'check object insertion',
    query(
      `
    SELECT *
    FROM bucket_object 
    WHERE bucket_name = '${s3Name}';
  `,
      (res: any[]) => expect(res.length).toBe(2),
    ),
  );

  it(
    'deletes one object of the bucket',
    query(`
    DELETE FROM bucket_object WHERE bucket_name = '${s3Name}' AND key='iasql_message';
  `),
  );

  it('applies the s3 object removal', apply());

  it(
    'check object deletion',
    query(
      `
    SELECT *
    FROM bucket_object 
    WHERE bucket_name = '${s3Name}' AND key='iasql_message';
  `,
      (res: any[]) => expect(res.length).toBe(0),
    ),
  );
  it(
    'check object deletion',
    query(
      `
    SELECT *
    FROM bucket_object 
    WHERE bucket_name = '${s3Name}' AND key='iasql_message_1';
  `,
      (res: any[]) => expect(res.length).toBe(1),
    ),
  );

  it(
    'gets current bucket policy document',
    query(
      `
    SELECT * FROM bucket WHERE name = '${s3Name}';
    `,
      (res: any[]) => expect(res[0].policy_document).toStrictEqual(JSON.parse(updatedPolicyDocument)),
    ),
  );

  it(
    'updates the bucket timestamp',
    query(`
    UPDATE bucket SET created_at = '1984-01-01T00:00:00' WHERE name = '${s3Name}';
  `),
  );

  it('applies the s3 bucket update', apply());

  it(
    'check s3 bucket timestamp is reverted',
    query(
      `
    SELECT *
    FROM bucket 
    WHERE name='${s3Name}' AND created_at = '1984-01-01T00:00:00';
  `,
      (res: any[]) => expect(res.length).toBe(0),
    ),
  );

  it(
    'check s3 bucket does still exist',
    query(
      `
    SELECT *
    FROM bucket 
    WHERE name = '${s3Name}';
  `,
      (res: any[]) => expect(res.length).toBe(1),
    ),
  );

  it('cleans the bucket', query(`DELETE FROM bucket_object WHERE bucket_name='${s3Name}'`));

  it(
    'check no s3 objects still exist',
    query(
      `
    SELECT *
    FROM bucket_object 
    WHERE bucket_name = '${s3Name}';
  `,
      (res: any[]) => expect(res.length).toBe(0),
    ),
  );

  describe('S3 bucket policy integration testing', () => {
    it(
      'gets current bucket policy',
      query(
        `
    SELECT policy_document FROM bucket
    WHERE name = '${s3Name}';
    `,
        (res: any[]) => {
          expect(res.length).toBe(1);
          expect(res[0].policyDocument).toBe(undefined);
        },
      ),
    );

    it(
      'updates the bucket policy',
      query(`
    UPDATE bucket SET policy_document='${newPolicyDocument}' WHERE name = '${s3Name}';
    `),
    );
    it('applies the s3 bucket policy update', apply());

    it(
      'gets current bucket policy with updated document',
      query(
        `
    SELECT * FROM bucket WHERE name = '${s3Name}';
    `,
        (res: any[]) => expect(res[0].policy_document).toStrictEqual(JSON.parse(updatedNewPolicyDocument)),
      ),
    );
  });

  it('should fail when changing the region', () => {
    try {
      query(`
      UPDATE bucket SET region='${nonDefaultRegion}' WHERE name = '${s3Name}';
      `);
    } catch (e) {
      expect(e).toBeTruthy;
    }
  });

  it('should fail when changing the name', () => {
    try {
      query(`
      UPDATE bucket SET name='${nonDefaultRegion}' WHERE name = '${s3Name}';
      `);
    } catch (e) {
      expect(e).toBeTruthy;
    }
  });

  it('uninstalls the s3 module', uninstall(modules));

  it('installs the s3 module', install(modules));

  it(
    'deletes the s3 bucket',
    query(`
    DELETE FROM bucket WHERE name = '${s3Name}';
  `),
  );

  it('applies the s3 bucket removal', apply());

  it(
    'check s3 removal',
    query(
      `
    SELECT *
    FROM bucket 
    WHERE name = '${s3Name}';
  `,
      (res: any[]) => expect(res.length).toBe(0),
    ),
  );

  it('deletes the test db', done => void iasql.disconnect(dbAlias, 'not-needed').then(...finish(done)));
});

describe('S3 install/uninstall', () => {
  it('creates a new test db', done =>
    void iasql.connect(dbAlias, 'not-needed', 'not-needed').then(...finish(done)));

  it('installs the aws_account module', install(['aws_account']));

  it(
    'inserts aws credentials',
    query(
      `
    INSERT INTO aws_credentials (access_key_id, secret_access_key)
    VALUES ('${process.env.AWS_ACCESS_KEY_ID}', '${process.env.AWS_SECRET_ACCESS_KEY}')
  `,
      undefined,
      false,
    ),
  );

  it('syncs the regions', sync());

  it(
    'sets the default region',
    query(`
    UPDATE aws_regions SET is_default = TRUE WHERE region = 'us-east-1';
  `),
  );

  it(
    'installs the S3 module and confirms one table is created',
    query(
      `
    select * from iasql_install('aws_s3');
  `,
      (res: any[]) => {
        expect(res.length).toBe(2);
      },
    ),
  );

  it(
    'uninstalls the S3 module and confirms one table is removed',
    query(
      `
    select * from iasql_uninstall('aws_s3');
  `,
      (res: any[]) => {
        expect(res.length).toBe(2);
      },
    ),
  );

  it('installs all modules', done =>
    void iasql.install([], dbAlias, config.db.user, true).then(...finish(done)));

  it('uninstalls the S3 module', uninstall(['aws_s3']));

  it('installs the S3 module', install(['aws_s3']));

  it('deletes the test db', done => void iasql.disconnect(dbAlias, 'not-needed').then(...finish(done)));
});
