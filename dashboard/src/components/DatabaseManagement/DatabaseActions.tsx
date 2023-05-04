import { ActionType, useAppContext } from '@/components/providers/AppProvider';
import { PauseIcon, PlayIcon } from '@heroicons/react/solid';

import { align, Button, HBox } from '../common';

export function DatabaseActions() {
  const { editorSelectedTab, editorTabs, connString, dispatch, token } = useAppContext();

  const handleDisconnect = () => {
    dispatch({ action: ActionType.ShowDisconnect, data: { show: true } });
  };

  const handleRunSql = (connString: string, content: string, tabIdx: number) => {
    if (token) {
      dispatch({
        token,
        action: ActionType.RunSql,
        data: { connString, content, tabIdx },
      });
    }
  };

  return (
    <HBox alignment={align.end}>
      <HBox width='auto'>
        <Button look='outline' color='secondary' onClick={handleDisconnect}>
          <PauseIcon className='mr-1 h-4 w-4' aria-hidden='true' />
          Disconnect
        </Button>
      </HBox>
      <HBox width='auto' customStyles='ml-2'>
        <Button
          look='iasql'
          onClick={() =>
            handleRunSql(connString, editorTabs?.[editorSelectedTab]?.content, editorSelectedTab)
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
