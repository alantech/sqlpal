import { useState } from 'react';

import { LinkIcon } from '@heroicons/react/outline';

import { Combobox, Input, Label, Step, VBox, Wizard } from './common';
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
      name: 'SQL Server',
      protocol: 'mssql',
    },
  ];

  const [connStr, SetConnStr] = useState('postgres:sqlpass@localdb:5432/sqlpal');
  const [stack, setStack] = useState(['addconn']);
  const [selectedDialect, setSelectedDialect] = useState(dialects[0]);

  let nextEnabled = true;
  let backEnabled = false;
  let closeButtonEnabled = true;
  const current = stack[stack.length - 1];

  // Check relevant state per step to determine automatic actions to perform, such as deciding if
  // the Next button should be enabled or not
  switch (current) {
    case 'addconn':
      nextEnabled = !!connStr;
      closeButtonEnabled = true;
      break;
    default:
      nextEnabled = true;
      closeButtonEnabled = true;
      break;
  }

  return (
    <Wizard
      icon={<LinkIcon className='h-6 w-6 text-primary' aria-hidden='true' />}
      title={'Connect database'}
      start='addconn'
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
        dispatch({ action: ActionType.ShowConnect, data: { showConnect: false } });
        // if (newDb) dispatch({ action: ActionType.ResetNewDb });
      }}
    >
      <Step
        id='addconn'
        onFinish={() => {
          dispatch({ action: ActionType.ShowConnect, data: { showConnect: false } });
          dispatch({
            action: ActionType.SetDBConfig,
            data: { connString: `${selectedDialect.protocol}://${connStr}`, dialect: selectedDialect.key },
          });
        }}
      >
        <Label>
          <b>Let&apos;s connect a database</b>
        </Label>
        <form className='mb-10'>
          <VBox>
            {/* TODO: The `htmlFor` does not work with Combobox yet */}
            <Label htmlFor='db-dialect'>Database dialect</Label>
            {/* TODO: Remove this div wrapper somehow */}
            <div className='mt-1 flex rounded-md shadow-sm' style={{ zIndex: 999, maxHeight: '50em' }}>
              <Combobox
                data={dialects}
                value={selectedDialect}
                setValue={setSelectedDialect}
                accessProp='name'
              />
            </div>
            <Label htmlFor='conn-str'>Connection String</Label>
            <Input
              required
              type='text'
              name='conn-str'
              value={connStr}
              setValue={SetConnStr}
              placeholder='<your_user>:<your_password>@<your_host_ip>/<your_db>'
            />
          </VBox>
        </form>
      </Step>
    </Wizard>
  );
}
