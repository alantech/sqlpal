import { useState, useEffect } from 'react';

import Connect from './Connect';
import { DatabaseManagement } from './DatabaseManagement/DatabaseManagement';
import Disconnect from './Disconnect';
import EmptyState from './EmptyState';
import Loader from './Loader/Loader';
import Navbar from './Navbar';
import Query from './Query';
import SmallViewport from './SmallViewport';
import { align, Button, HBox } from './common';
import ErrorDialog from './common/ErrorDialog';
import { ActionType, useAppContext } from './providers/AppProvider';
import { useAuth } from '../hooks/useAuth';
import { CircleStackIcon, PlusSmallIcon } from '@heroicons/react/24/outline';

export default function Main() {
  const {
    dispatch,
    connString,
    schema,
    dialect,
    error: appError,
    shouldShowDisconnect,
    shouldShowConnect,
    latestVersion,
  } = useAppContext();
  const { user, token } = useAuth();
  const MIN_WIDTH = 640; // measure in px
  let innerWidth = 1024; // Server-side default
  const [isSmallViewport, showSmallViewport] = useState(innerWidth < MIN_WIDTH);

  useEffect(() => {
    if (innerWidth !== window.innerWidth) {
      innerWidth = window.innerWidth;
      showSmallViewport(innerWidth < MIN_WIDTH);
    }
    if (token && !latestVersion) {
      // Dispatch initial load
      dispatch({ token: token ?? '', action: ActionType.InitialLoad });

      // Set initial theme config
      if (!('theme' in localStorage)) {
        localStorage.setItem(
          'theme',
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        );
      }
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      dispatch({
        action: ActionType.SelectAppTheme,
        data: { theme: localStorage.getItem('theme') },
      });
    }
  }, [dispatch, token, latestVersion]);

  useEffect(() => {
    if (connString && dialect && !Object.keys(schema ?? {}).length) {
      dispatch({
        action: ActionType.SetDBConfig,
        data: { connString, dialect },
      });
    }
  }, [connString, schema, dialect, dispatch]);

  return (
    <>
      {/* Modals */}
      {isSmallViewport && (
        <SmallViewport showSmallViewport={showSmallViewport} />
      )}
      {appError && <ErrorDialog />}
      {token && shouldShowConnect && <Connect />}
      {token && shouldShowDisconnect && <Disconnect />}
      <Navbar userPic={user?.picture ?? '' /* TODO: Default pic? */} />
      {(() => {
        if (
          !latestVersion ||
          (connString && dialect && !Object.keys(schema ?? {}).length)
        ) {
          return <Loader />;
        } else {
          return <>
            <main>
              {!connString ? (
                <div className="max-w-full mx-auto pt-4 sm:px-4 lg:px-6">
                  <EmptyState>
                    <p>No connected databases</p>
                    <HBox customStyles="mt-2">
                      <Button
                        look="iasql"
                        onClick={() => {
                          dispatch({
                            action: ActionType.ShowConnect,
                            data: { showConnect: true },
                          });
                        }}
                      >
                        <HBox alignment={align.around}>
                          <CircleStackIcon
                            className="w-5 h-5"
                            aria-hidden="true"
                          />
                          <PlusSmallIcon
                            className="w-5 h-5 mr-1 "
                            aria-hidden="true"
                          />
                          Connect database
                        </HBox>
                      </Button>
                    </HBox>
                  </EmptyState>
                </div>
              ) : (
                <>
                  <div className="max-w-full mx-auto pt-4 sm:px-4 lg:px-6">
                    <DatabaseManagement />
                  </div>
                  <div className="max-w-full mx-auto py-2 sm:px-4 lg:px-6">
                    <Query />
                  </div>
                </>
              )}
            </main>
          </>;
        }
      })()}
    </>
  );
}
