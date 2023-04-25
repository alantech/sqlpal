import React, { useCallback, useContext, useReducer } from 'react';

import * as semver from 'semver';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

import { ConfigInterface } from '@/config/config';
import * as DbActions from '@/services/dbApi';

import { useAppConfigContext } from './ConfigProvider';

const nameGenConfig = {
  dictionaries: [adjectives, colors, animals],
};

const AppContext = React.createContext({} as AppStore);

const useAppContext = () => {
  return useContext(AppContext);
};

export enum ActionType {
  InitialLoad = 'InitialLoad',
  Disconnect = 'Disconnect',
  RunSql = 'RunSql',
  DiscoverSchema = 'DiscoverSchema',
  SetConnStr = 'SetConnStr',
  EditContent = 'EditContent',
  RunningSql = 'RunningSql',
  ShowDisconnect = 'ShowDisconnect',
  ShowConnect = 'ShowConnect',
  ResetError = 'ResetError',
  SetError = 'SerError',
  EditorNewTab = 'EditorNewTab',
  EditorSelectTab = 'EditorSelectTab',
  SelectAppTheme = 'SelectAppTheme',
  EditorCloseTab = 'EditorCloseTab',
  SelectTable = 'SelectTable',
}

interface Payload {
  token?: string;
  action: ActionType;
  // TODO: ADD DATA TYPE!!!
  data?: any;
}

interface AppState {
  token?: string;
  // TODO: ADD DB TYPE!!!
  selectedDb: any;
  oldestVersion?: string;
  latestVersion?: string;
  connString: string;
  isRunningSql: boolean;
  databases: any[];
  error: string | null;
  newDb?: any;
  allModules: { [moduleName: string]: string[] };
  functions: {
    [moduleName: string]: {
      [functionName: string]: string;
    };
  };
  installedModules: {
    [moduleName: string]: {
      [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
        recordCount: number;
      };
    };
  };
  isDarkMode: boolean;
  shouldShowDisconnect: boolean;
  shouldShowConnect: boolean;
  editorTabsCreated: number;
  editorSelectedTab: number;
  editorTabs: {
    title: string;
    action?: () => void;
    className?: string;
    width?: string;
    content: string;
    queryRes?: any | null;
    closable?: boolean;
    isRunning?: boolean;
  }[];
  forceRun: boolean;
}

interface AppStore extends AppState {
  dispatch: (payload: Payload) => Promise<void>;
}

const gettingStarted = `-- Welcome to SQLPal! Steps to get started:

-- 1. Start writing your queries. Once the suggestion appears press tab to accept or esc to ignore.

-- 2. You can right comments too in order to get a suggestion for the next query.

-- Open as many tabs as you want in the top right corner and run queries on each of them.
-- If you have any questions, use the navbar to check the documentation or contact us!

-- Happy coding :)
`;

function discoverData(connString: string) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conn_str: connString }),
    credentials: 'include' as RequestCredentials,
  };
  const endpoint = process.env.AUTOCOMPLETE_ENDPOINT ?? 'http://localhost:5000/discover';
  //const endpoint = "http://192.168.2.38:5000/discover"

  fetch(endpoint, requestOptions)
    .then(response => response.json())
    .catch(error => {
      console.error('Error:', error);
    });
}

const reducer = (state: AppState, payload: Payload): AppState => {
  const { error } = payload?.data ?? { error: null };
  if (error) {
    return { ...state, error };
  }
  switch (payload.action) {
    case ActionType.InitialLoad: {
      const { token } = payload;
      const { initialDatabases, latestVersion, oldestVersion } = payload.data;
      return { ...state, databases: initialDatabases, latestVersion, oldestVersion, token };
    }
    case ActionType.Disconnect: {
      return { ...state, connString: '', shouldShowDisconnect: false };
    }
    case ActionType.EditContent: {
      const { content: editorContent } = payload.data;
      const relevantTab = state.editorTabs[state.editorSelectedTab];
      relevantTab.content = editorContent;
      return { ...state };
    }
    case ActionType.RunningSql: {
      const { isRunning, tabIdx } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy[tabIdx].isRunning = isRunning;
      return { ...state, editorTabs: tabsCopy };
    }
    case ActionType.RunSql: {
      const { queryRes, databases: runSqlUpdatedDbs, tabIdx } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy[tabIdx].queryRes = queryRes;
      if (runSqlUpdatedDbs !== null && runSqlUpdatedDbs !== undefined) {
        const current = runSqlUpdatedDbs.find((d: any) => d.alias === state.selectedDb.alias);
        return {
          ...state,
          databases: runSqlUpdatedDbs,
          selectedDb: current,
          editorTabs: tabsCopy,
          forceRun: false,
        };
      }

      // add the query to the index
      if (queryRes && queryRes.length > 0) {
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryRes[0].statement }),
          credentials: 'include' as RequestCredentials,
        };
        const endpoint = process.env.AUTOCOMPLETE_ENDPOINT ?? 'http://localhost:5000/add';

        fetch(endpoint, requestOptions)
          .then(response => response.json())
          .catch(error => {
            console.error('Error:', error);
          });
      }

      return { ...state, editorTabs: tabsCopy, forceRun: false };
    }

    case ActionType.ShowDisconnect: {
      const { show } = payload.data;
      return { ...state, shouldShowDisconnect: show };
    }
    case ActionType.ShowConnect: {
      const { showConnect } = payload.data;
      return { ...state, shouldShowConnect: showConnect };
    }
    case ActionType.ResetError: {
      return { ...state, error: null };
    }
    case ActionType.SetError: {
      const { error: customError } = payload.data;
      return { ...state, error: customError };
    }
    case ActionType.EditorNewTab: {
      const tabsCopy = [...state.editorTabs];
      const newTab = tabsCopy.pop();
      tabsCopy.push({ title: `Query-${state.editorTabsCreated}`, content: '', closable: true });
      if (newTab) tabsCopy.push(newTab);
      return { ...state, editorTabs: tabsCopy, editorTabsCreated: state.editorTabsCreated + 1 };
    }
    case ActionType.EditorSelectTab: {
      const { index } = payload.data;
      return { ...state, editorSelectedTab: index };
    }
    case ActionType.EditorCloseTab: {
      const { index } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy.splice(index, 1);
      return { ...state, editorTabs: tabsCopy };
    }
    case ActionType.SelectAppTheme: {
      const { theme } = payload.data;
      return { ...state, isDarkMode: theme === 'dark' };
    }
    case ActionType.SelectTable: {
      const { tableName } = payload.data;
      const tabsCopy = [...state.editorTabs];
      const newTab = tabsCopy.pop();
      const tabContent = `SELECT * FROM ${tableName};`;
      tabsCopy.push({ title: `Query-${state.editorTabsCreated}`, content: tabContent, closable: true });
      if (newTab) tabsCopy.push(newTab);
      return {
        ...state,
        editorTabs: tabsCopy,
        editorTabsCreated: state.editorTabsCreated + 1,
        forceRun: true,
      };
    }
    case ActionType.SetConnStr: {
      const { connString } = payload.data;
      return { ...state, connString };
    }
  }
  return state;
};

const middlewareReducer = async (
  config: ConfigInterface,
  dispatch: (payload: Payload) => void,
  payload: Payload,
) => {
  const { token } = payload;
  const { backendUrl } = config?.engine;
  switch (payload.action) {
    case ActionType.SetConnStr: {
      const { connString } = payload.data;
      try {
        discoverData(connString);
        dispatch({ ...payload, data: { connString } });
        break;
      } catch (e: any) {
        const error = e.message ? e.message : `Unexpected error setting connection string`;
        dispatch({ ...payload, data: { error } });
        break;
      }
    }
    case ActionType.InitialLoad: {
      try {
        dispatch({
          ...payload,
          data: {
            initialDatabases: [],
            oldestVersion: '0',
            latestVersion: '1',
          },
        });
        break;
      } catch (e: any) {
        const error = e.message ? e.message : `Unexpected error getting initial load`;
        dispatch({ ...payload, data: { error } });
        break;
      }
    }
    case ActionType.RunSql: {
      if (!token) {
        dispatch({ ...payload, data: { error: 'No auth token defined.' } });
        break;
      }
      const { content, tabIdx, connString } = payload.data;
      if (!connString) break;
      let queryRes: any = 'Invalid or empty response';
      let queryError: string = 'Unhandled error in SQL execution';
      dispatch({ action: ActionType.RunningSql, data: { isRunning: true, tabIdx } });
      try {
        if (token && content) {
          queryRes = await DbActions.run(backendUrl, connString, content);
        }
      } catch (e: any) {
        if (e.message) {
          queryError = e.message;
        }
        queryRes = queryError;
      }
      dispatch({ action: ActionType.RunningSql, data: { isRunning: false, tabIdx } });
      dispatch({ ...payload, data: { queryRes, databases: [], tabIdx } });
      break;
    }
    case ActionType.EditorSelectTab: {
      const { connString, forceRun, index, editorTabs } = payload.data;
      const contentToBeRun = editorTabs?.[index]?.content ?? '';
      if (token && forceRun && contentToBeRun) {
        middlewareReducer(config, dispatch, {
          token,
          action: ActionType.RunSql,
          data: {
            connString,
            content: contentToBeRun,
            tabIdx: index,
          },
        });
      }
    }
    default: {
      dispatch(payload);
    }
  }
};

const AppProvider = ({ children }: { children: any }) => {
  const { config } = useAppConfigContext();
  const initialState: AppState = {
    selectedDb: null,
    oldestVersion: undefined,
    latestVersion: undefined,
    isRunningSql: false,
    databases: [],
    error: null,
    allModules: {},
    functions: {},
    installedModules: {},
    isDarkMode: false,
    shouldShowDisconnect: false,
    shouldShowConnect: false,
    connString: '',
    editorSelectedTab: 0,
    editorTabsCreated: 1,
    editorTabs: [
      { title: 'Getting started', content: gettingStarted, closable: true },
      {
        title: '+',
        content: '',
        width: 'w-auto',
        className: 'px-4 border border-transparent',
        action: () => {
          dispatch({
            action: ActionType.EditorNewTab,
          });
        },
      },
    ],
    forceRun: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const customDispatch = useCallback(
    async (payload: Payload) => {
      middlewareReducer(config, dispatch, payload);
    },
    [config],
  );

  return (
    <AppContext.Provider
      value={{
        token: state.token,
        selectedDb: state.selectedDb,
        isDarkMode: state.isDarkMode,
        databases: state.databases,
        error: state.error,
        latestVersion: state.latestVersion,
        oldestVersion: state.oldestVersion,
        newDb: state.newDb,
        allModules: state.allModules,
        functions: state.functions,
        installedModules: state.installedModules,
        isRunningSql: state.isRunningSql,
        shouldShowDisconnect: state.shouldShowDisconnect,
        shouldShowConnect: state.shouldShowConnect,
        connString: state.connString,
        editorTabs: state.editorTabs,
        editorSelectedTab: state.editorSelectedTab,
        editorTabsCreated: state.editorTabsCreated,
        forceRun: state.forceRun,
        dispatch: customDispatch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export type { AppStore };
export { AppProvider, useAppContext };
