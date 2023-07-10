import { useState } from 'react';

import { PauseIcon } from '@heroicons/react/24/outline';

import { Button, Modal, Label, Spinner } from './common';
import { ActionType, useAppContext } from './providers/AppProvider';

export default function Disconnect() {
  const { dispatch, token, connString } = useAppContext();

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  return (
    <Modal
      title='Disconnect account and remove database'
      icon={<PauseIcon className='h-6 w-6 text-gray-600' aria-hidden='true' />}
      onClose={() => dispatch({ action: ActionType.ShowDisconnect, data: { show: false } })}
      closeable={!isDisconnecting}
    >
      {isDisconnecting ? (
        <>
          <Label>
            Disconnecting IaSQL database <b>{connString}</b>.
          </Label>
          <Spinner />
        </>
      ) : (
        <>
          <Label>
            Are you sure you want to disconnect the <b>{connString}</b> database?
          </Label>
          <Button
            id='disconnect-modal'
            onClick={() => {
              dispatch({
                action: ActionType.Disconnect,
                token,
              });
              setIsDisconnecting(true);
            }}
          >
            Disconnect
          </Button>
        </>
      )}
    </Modal>
  );
}
