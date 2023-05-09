import { useState } from 'react';

import { LinkIcon } from '@heroicons/react/outline';

import { Input, Label, Step, VBox, Wizard } from './common';
import { ActionType, useAppContext } from './providers/AppProvider';

export default function Connect() {
  const { dispatch } = useAppContext();

  const [connStr, SetConnStr] = useState('postgres://postgres:sqlpass@localdb:5432/sqlpal');
  const [stack, setStack] = useState(['addconn']);

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
          dispatch({ action: ActionType.SetConnString, data: { connString: connStr } });
        }}
      >
        <Label>
          <b>Let&apos;s connect a database</b>
        </Label>
        <form className='mb-10'>
          <VBox>
            <Label htmlFor='conn-str'>Connection String</Label>
            <Input
              required
              type='text'
              name='conn-str'
              value={connStr}
              setValue={SetConnStr}
              placeholder='postgresql://postgres:sqlpass@<your_host_ip>/sqlpal'
            />
          </VBox>
        </form>
      </Step>
    </Wizard>
  );
}
