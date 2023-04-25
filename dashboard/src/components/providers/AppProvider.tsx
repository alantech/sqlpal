import React, { useCallback, useContext, useReducer } from 'react';

import { ConfigInterface } from '@/config/config';
import * as DbActions from '@/services/dbApi';

import { useAppConfigContext } from './ConfigProvider';

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
  GetSuggestions = 'GetSuggestions',
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
    suggestions: { value: string; meta: string; score: number }[];
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
      tabsCopy.push({
        title: `Query-${state.editorTabsCreated}`,
        content: '',
        closable: true,
        suggestions: [],
      });
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
      tabsCopy.push({
        title: `Query-${state.editorTabsCreated}`,
        content: tabContent,
        closable: true,
        suggestions: [],
      });
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
    case ActionType.GetSuggestions: {
      const { suggestions, tabIdx } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy[tabIdx].suggestions = suggestions;
      return { ...state, editorTabs: tabsCopy };
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
  const { backendUrl, palServerUrl } = config?.engine;
  switch (payload.action) {
    case ActionType.SetConnStr: {
      const { connString } = payload.data;
      try {
        dispatch({ ...payload, data: { connString } });
      } catch (e: any) {
        const error = e.message ? e.message : `Unexpected error setting connection string`;
        dispatch({ ...payload, data: { error } });
        break;
      }
      try {
        await DbActions.discoverData(palServerUrl, connString);
      } catch (e) {
        console.log(`/discover failed with error: ${e}.`);
      }
      break;
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
      // add the query to the index
      if (queryRes && queryRes.length > 0) {
        try {
          await DbActions.addStatement(palServerUrl, queryRes[0].statement ?? '');
        } catch (e) {
          console.error(e);
        }
      }
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
      break;
    }
    case ActionType.GetSuggestions: {
      const { connString, query, tabIdx } = payload.data;
      if (!connString) break;
      let suggestions: any[] = [];
      try {
        console.log(`callig get suggestions `);
        const suggestionsRes = await DbActions.getSuggestions(palServerUrl, connString, query);
        console.log(`suggestions response? `);
        if (suggestionsRes['output_text']) {
          suggestions = [{ value: suggestionsRes['output_text'], meta: 'custom', score: 1000 }];
        }
      } catch (e: any) {
        // todo: handle error
        console.log('catching this error');
        console.error(e);
        suggestions = [];
      }
      dispatch({ ...payload, data: { suggestions, tabIdx } });
      break;
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
      { title: 'Getting started', content: gettingStarted, closable: true, suggestions: [] },
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
        suggestions: [],
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
