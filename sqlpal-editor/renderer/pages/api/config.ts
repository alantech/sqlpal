import { NextApiResponse } from 'next';

const handler = ({} = {}, res: NextApiResponse) => {
  res.status(200).json({
    sqlpalEnv: process.env.NODE_ENV === 'production' ? 'prod' : 'local',
    uid: 'uid',
    telemetry: process.env.SQLPAL_TELEMETRY ?? 'on',
  });
};

export default handler;
