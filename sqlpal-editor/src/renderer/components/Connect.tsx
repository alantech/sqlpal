import { useState } from 'react';

import { LinkIcon } from '@heroicons/react/24/outline';

import { Input, Label, Step, VBox, Wizard } from './common';
import { ActionType, useAppContext } from './providers/AppProvider';

export default function Connect() {
  const { dispatch } = useAppContext();

  // Key should be `keyof typeof SQLDialect` from sql-surveyor
  const dialects = [
    {
      key: 'PLpgSQL',
      name: 'Postgres',
      protocol: 'postgresql',
    },
    {
      key: 'MYSQL',
      name: 'MySQL',
      protocol: 'mysql',
    },
    {
      key: 'TSQL',
      name: 'MS SQL Server',
      protocol: 'mssql',
    },
  ];

  const [connString, SetConnString] = useState(
    'postgresql://sqlpaluser:sqlpass@localhost:5432/sqlpal'
  );
  const [isValidConnString, SetIsValidConnString] = useState(true);
  const [stack, setStack] = useState(['addconn']);

  let nextEnabled = true;
  let backEnabled = false;
  let closeButtonEnabled = true;
  const current = stack[stack.length - 1];

  const onFinish = () => {
    dispatch({ action: ActionType.ShowConnect, data: { showConnect: false } });
    dispatch({
      action: ActionType.SetConnStr,
      data: {
        connString,
        dialect: dialects.find((d) => d.protocol === connString.split(':')[0])
          ?.key,
      },
    });
  };

  // Check relevant state per step to determine automatic actions to perform, such as deciding if
  // the Next button should be enabled or not
  switch (current) {
    case 'addconn':
      nextEnabled = !!connString && isValidConnString;
      closeButtonEnabled = true;
      break;
    default:
      nextEnabled = true;
      closeButtonEnabled = true;
      break;
  }

  return (
    <Wizard
      icon={<LinkIcon className="h-6 w-6 text-primary" aria-hidden="true" />}
      title={'Connect database'}
      start="addconn"
      stack={stack}
      setStack={setStack}
      nextEnabled={nextEnabled}
      onNext={() => {
        switch (current) {
          default:
            return 'addconn'; // Should never happen
        }
      }}
      backEnabled={backEnabled}
      closeable={closeButtonEnabled}
      onClose={() => {
        dispatch({
          action: ActionType.ShowConnect,
          data: { showConnect: false },
        });
      }}
    >
      <Step id="addconn" onFinish={onFinish}>
        <Label>
          <b>Let&apos;s connect a database</b>
        </Label>
        <form className="mb-10" noValidate onSubmit={onFinish}>
          <VBox>
            <Label htmlFor="conn-str">Database URL</Label>
            <Input
              required
              type="text"
              name="conn-str"
              value={connString}
              setValue={SetConnString}
              placeholder="[postgresql|mysql|mssql]://<your_user>:<your_password>@<your_host_ip>/<your_db>[?<param>=<value>&<param>=<value>...]"
              validator={
                /(postgresql|mysql|mssql)(\:\/\/.+\:.+@.+\/[A-Za-z\d\-\_]+)/g
              }
              validationErrorMessage="Please enter a valid database URL following the format: [postgresql|mysql|mssql]://<your_user>:<your_password>@<your_host_ip>/<your_db>[?<param>=<value>&<param>=<value>...]"
              setIsValid={SetIsValidConnString}
            />
          </VBox>
        </form>
      </Step>
    </Wizard>
  );
}
