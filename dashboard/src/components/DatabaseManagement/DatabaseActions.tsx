import { ActionType, useAppContext } from '@/components/providers/AppProvider';
import { Menu } from '@headlessui/react';
import { CogIcon } from '@heroicons/react/outline';
import { PauseIcon, PlayIcon } from '@heroicons/react/solid';

import { align, Button, Dropdown, HBox, VBox } from '../common';

export function DatabaseActions() {
  const { editorSelectedTab, editorTabs, connString, dispatch, token } = useAppContext();

  const handleDisconnect = () => {
    dispatch({ action: ActionType.ShowDisconnect, data: { show: true } });
  };

  const handleRunSql = (db: any, content: string, tabIdx: number, connString?: string) => {
    if (token) {
      dispatch({
        token,
        action: ActionType.RunSql,
        data: { db, content, tabIdx, connString },
      });
    }
  };

  const buttonTitle = (
    <HBox alignment={align.start} id='database-settings'>
      <CogIcon className='mr-1 h-4 w-4' aria-hidden='true' />
      <span className='truncate'>Settings</span>
    </HBox>
  );

  return (
    <HBox alignment={align.end}>
      {/* <HBox customStyles='md:justify-end'>
        <Button look='outline' color='tertiary' onClick={handleDisconnect}>
          <PauseIcon className='mr-1 h-4 w-4' aria-hidden='true' />
          Disconnect
        </Button>
      </HBox> */}
      <HBox alignment={align.end}>
        <Button
          look='iasql'
          onClick={() =>
            handleRunSql(null, editorTabs?.[editorSelectedTab]?.content, editorSelectedTab, connString)
          }
          disabled={!connString || editorTabs?.[editorSelectedTab]?.isRunning}
        >
          <PlayIcon className='h-4 w-4 mr-1' aria-hidden='true' />
          Run query
        </Button>
      </HBox>
    </HBox>
  );
}
