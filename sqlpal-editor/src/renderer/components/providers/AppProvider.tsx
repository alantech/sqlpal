import React, { useCallback, useContext, useReducer } from 'react';

import { ConfigInterface } from '../../config/config';
import * as DbActions from '../../services/dbApi';

import { useAppConfigContext } from './ConfigProvider';

const AppContext = React.createContext({} as AppStore);

const useAppContext = () => {
  return useContext(AppContext);
};

// Following `sql-surveyor`'s convention
export type SQLDialects = 'PLpgSQL' | 'MYSQL' | 'TSQL';

export enum ActionType {
  InitialLoad = 'InitialLoad',
  Disconnect = 'Disconnect',
  RunSql = 'RunSql',
  DiscoverSchema = 'DiscoverSchema',
  SetDBConfig = 'SetDBConfig',
  EditContent = 'EditContent',
  ValidateContent = 'ValidateContent',
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
  ResetSuggestion = 'ResetSuggestion',
  Repair = 'Repair',
}

interface Payload {
  token?: string;
  action: ActionType;
  // TODO: ADD DATA TYPE!!!
  data?: any;
}

export type Schema = {
  [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
    recordCount?: number;
  };
};

interface AppState {
  token?: string;
  oldestVersion?: string;
  latestVersion?: string;
  connString: string;
  dialect: SQLDialects;
  isRunningSql: boolean;
  databases: any[];
  error: string | null;
  schema: Schema;
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
  parseErrorsByStmt?: {
    [stmt: string]: string;
  };
}

interface AppStore extends AppState {
  dispatch: (payload: Payload) => Promise<void>;
}

const generateInitialQuery = (dialect: SQLDialects, dbId?: string) => {
  const tableSchemaBasedOnDialect = {
    PLpgSQL: 'public',
    MYSQL: dbId ?? 'mysql',
    TSQL: 'dbo',
  };
  const columnInfoByTableQuery = getColumnInfoByTableQuery(tableSchemaBasedOnDialect[dialect]);
  const recordCountByTableQuery = getRecordCountByTableQuery(dialect, tableSchemaBasedOnDialect[dialect]);
  return `${columnInfoByTableQuery}; ${recordCountByTableQuery}`;
};

const getColumnInfoByTableQuery = (tableSchema: string) => `
  select c.table_name as table_name,
         c.ordinal_position as ordinal_position,
         c.column_name as column_name,
         c.data_type as data_type,
         c.is_nullable as is_nullable,
         c.column_default as column_default
  from information_schema.columns as c
  inner join information_schema.tables as t on c.table_name = t.table_name
  where t.table_schema = '${tableSchema}' and c.table_name != 'index_content'
  order by table_name, ordinal_position; 
`;

const getRecordCountByTableQuery = (dialect: string, tableSchema: string) => {
  switch (dialect) {
    case 'PLpgSQL':
      return `
        select
          t.table_name as table_name,
          (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', t.table_name), FALSE, TRUE, '')))[1]::text::int AS record_count
        from (select table_name from information_schema.tables where table_schema = '${tableSchema}') as t;
      `;
    case 'MYSQL':
      return `
        SELECT 
          TABLE_NAME AS table_name,
          SUM(TABLE_ROWS) as record_count
        FROM INFORMATION_SCHEMA.TABLES
        WHERE table_schema = '${tableSchema}' AND table_name != 'index_content'
        GROUP BY TABLE_NAME;
      `;
    case 'TSQL':
      return `
        SELECT
          o.NAME as table_name,
          i.rowcnt AS record_count
        FROM sysindexes AS i
        INNER JOIN sysobjects AS o ON i.id = o.id 
        WHERE i.indid < 2  AND OBJECTPROPERTY(o.id, 'IsMSShipped') = 0 AND o.name != 'index_content'
        ORDER BY o.NAME;`;
    default:
      return '';
  }
};

const generateAnalyzerQueriesForMysql = (dbId: string): string => {
  return `
    SELECT GROUP_CONCAT(concat('ANALYZE TABLE \`', table_name, '\`;') SEPARATOR '') AS O
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND table_name != 'dual'
      AND table_name != 'index_content'
      AND TABLE_SCHEMA = '${dbId}'`;
};

export const gettingStarted = `-- Welcome to SQLPal! Steps to get started:
 
-- 1. Start writing your queries. Once the suggestion appears press tab to accept or esc to ignore.

-- 2. You can right comments too in order to get a suggestion for the next query.

-- Open as many tabs as you want in the top right corner and run queries on each of them.
-- If you have any questions, use the navbar to check the documentation or contact us!

-- Happy coding :)
`;

const validateSql = async (
  stmt: string,
  schema: Schema,
  dialect: SQLDialects,
): Promise<string> => {
  let validationErr = '';
  try {
    // const sqlParseRes = await fetch(`/api/sqlParser/validate`, {
    //   body: JSON.stringify({ content: stmt, schema, dialect }),
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // const sqlParseErr = await sqlParseRes.json();
    const sqlParseErr = await window.electron.editor.validate(stmt, schema as any, dialect);
    if (sqlParseErr.message) validationErr = sqlParseErr.message;
  } catch (e) {
    console.error(e);
  }
  return validationErr;
};

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
      // Reset editor tabs
      const tabsCopy = [...state.editorTabs].filter(t => t.title === 'Getting started' || t.title === '+');
      if (tabsCopy.length && tabsCopy[0] && tabsCopy[0].title === 'Getting started') {
        tabsCopy[0].content = gettingStarted;
        tabsCopy[0].queryRes = null;
        tabsCopy[0].suggestions = [];
      }
      return {
        ...state,
        connString: '',
        shouldShowDisconnect: false,
        editorTabs: tabsCopy,
        editorSelectedTab: 0,
        editorTabsCreated: 1,
      };
    }
    case ActionType.EditContent: {
      const { content } = payload.data;
      const relevantTab = state.editorTabs[state.editorSelectedTab];
      relevantTab.content = content;
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
        return {
          ...state,
          databases: runSqlUpdatedDbs,
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
    case ActionType.SetDBConfig: {
      const { connString, schema, dialect } = payload.data;
      return { ...state, connString, schema, dialect };
    }
    case ActionType.GetSuggestions: {
      const { suggestions, tabIdx } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy[tabIdx].suggestions = [...(suggestions ?? [])];
      return { ...state, editorTabs: tabsCopy };
    }
    case ActionType.Repair: {
      const { suggestions, query, tabIdx } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy[tabIdx].content = query;
      tabsCopy[tabIdx].suggestions = [...(suggestions ?? [])];
      return { ...state, editorTabs: tabsCopy };
    }
    case ActionType.ResetSuggestion: {
      const { tabIdx } = payload.data;
      const tabsCopy = [...state.editorTabs];
      tabsCopy[tabIdx].suggestions = [];
      return { ...state, editorTabs: tabsCopy };
    }
    case ActionType.ValidateContent: {
      const { parseErrorsByStmt } = payload.data;
      return { ...state, parseErrorsByStmt };
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
  const { url } = config?.server;
  switch (payload.action) {
    case ActionType.SetDBConfig: {
      const { connString, dialect } = payload.data;
      const schema: Schema = {};
      try {
        let schemaRes: any = undefined;
        const dbId = connString.split('/')?.pop()?.split('?')?.[0] ?? '';
        if (dialect === 'MYSQL') {
          const analyzerQueriesForMysqlGenerator = generateAnalyzerQueriesForMysql(dbId);
          const analyzerQueriesForMysqlRes = await DbActions.run(connString, analyzerQueriesForMysqlGenerator, dialect);
          await Promise.all(Object.entries(analyzerQueriesForMysqlRes?.[0]?.result?.[0] ?? {}).map(async ([_, v]) => {
            if (!!v && typeof v === 'string') {
              const queries = v.split(';');
              for (const q of queries) {
                if (q) await DbActions.run(connString, q, dialect);
              }
            }
          }));
        }
        const initialQuery = generateInitialQuery(dialect, dbId);
        schemaRes = await DbActions.run(connString, initialQuery, dialect);
        (schemaRes?.[0]?.result ?? []).forEach((row: any) => {
          // c.table_name, c.ordinal_position, c.column_name, c.data_type
          const tableName = row.table_name;
          const columnName = row.column_name;
          const dataType = row.data_type;
          let isMandatory = true;
          if (row.column_default !== null || row.is_nullable === 'YES') isMandatory = false;
          const recordCount =
            schemaRes?.[1]?.result?.find((r: any) => r.table_name === tableName)?.record_count ?? 0; // t.table as table_name, xpath('/row/c/text()' ...
          schema[tableName] = schema[tableName] || {};
          schema[tableName][columnName] = { dataType, isMandatory };
          schema[tableName]['recordCount'] = recordCount;
        });
        dispatch({ ...payload, data: { connString, schema, dialect } });
      } catch (e: any) {
        const error = e.message ? e.message : `Unexpected error setting connection string`;
        dispatch({ ...payload, data: { error } });
        break;
      }
      try {
        await DbActions.discoverData(url, connString, dialect, schema);
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
      const { content, tabIdx, connString, dialect } = payload.data;
      if (!connString) break;
      let queryRes: any = 'Invalid or empty response';
      let queryError: string = 'Unhandled error in SQL execution';
      dispatch({ action: ActionType.RunningSql, data: { isRunning: true, tabIdx } });
      try {
        if (token && content) {
          queryRes = await DbActions.run(connString, content, dialect);
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
          await DbActions.addStatement(url, connString, queryRes[0].statement ?? '', dialect);
        } catch (e) {
          console.error(e);
        }
      }
      break;
    }
    case ActionType.EditorSelectTab: {
      const { connString, forceRun, index, editorTabs, dialect } = payload.data;
      const contentToBeRun = editorTabs?.[index]?.content ?? '';
      if (token && forceRun && contentToBeRun && dialect) {
        middlewareReducer(config, dispatch, {
          token,
          action: ActionType.RunSql,
          data: {
            connString,
            content: contentToBeRun,
            tabIdx: index,
            dialect,
          },
        });
      }
      dispatch({ ...payload, data: { index } });
      break;
    }
    case ActionType.GetSuggestions: {
      const { connString, query, tabIdx, schema, dialect } = payload.data;
      if (!connString) break;
      let suggestions: any[] = [];
      try {
        const autocompleteRes: any = await DbActions.autocomplete(url, connString, query, dialect);
        if (autocompleteRes['suggestions'] && Array.isArray(autocompleteRes['suggestions'])) {
          // validate the suggestions and return the first valid one
          for (const suggestion of autocompleteRes['suggestions']) {
            const validationError = await validateSql(suggestion, schema, dialect);
            if (validationError) continue;
            else {
              suggestions = [{ value: suggestion, meta: 'custom', score: 1000 }];
              break;
            }
          }
        } else {
          suggestions = [];
        }
      } catch (e: any) {
        // todo: handle error
        console.error(e);
        suggestions = [];
      }
      dispatch({ ...payload, data: { suggestions, tabIdx } });
      break;
    }
    case ActionType.Repair: {
      const { connString, query, error, tabIdx, schema, dialect } = payload.data;
      if (!connString) break;
      let suggestions: any[] = [];
      try {
        const repairRes: any = await DbActions.repair(url, connString, query, error, dialect);
        if (repairRes['suggestions'] && Array.isArray(repairRes['suggestions'])) {
          // validate the suggestions and return the first valid one
          for (const suggestion of repairRes['suggestions']) {
            const validationError = await validateSql(suggestion, schema, dialect);
            if (validationError) continue;
            else {
              suggestions = [{ value: suggestion }];
              break;
            }
          }
        } else {
          suggestions = [];
        }
      } catch (e: any) {
        // todo: handle error
        console.error(e);
        suggestions = [];
      }
      dispatch({ ...payload, data: { suggestions, query, tabIdx } });
      break;
    }
    case ActionType.ValidateContent: {
      const { content, schema, dialect } = payload.data;
      const statements = content
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      const parseErrorsByStmt: { [stmt: string]: string } = {};
      for (const stmt of statements) {
        parseErrorsByStmt[stmt] = await validateSql(stmt, schema, dialect);
      }
      dispatch({ ...payload, data: { parseErrorsByStmt } });
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
    oldestVersion: undefined,
    latestVersion: undefined,
    isRunningSql: false,
    databases: [],
    error: null,
    schema: {},
    isDarkMode: false,
    shouldShowDisconnect: false,
    shouldShowConnect: false,
    connString: '',
    dialect: 'PLpgSQL',
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
        isDarkMode: state.isDarkMode,
        databases: state.databases,
        error: state.error,
        latestVersion: state.latestVersion,
        oldestVersion: state.oldestVersion,
        schema: state.schema,
        isRunningSql: state.isRunningSql,
        shouldShowDisconnect: state.shouldShowDisconnect,
        shouldShowConnect: state.shouldShowConnect,
        connString: state.connString,
        dialect: state.dialect,
        editorTabs: state.editorTabs,
        editorSelectedTab: state.editorSelectedTab,
        editorTabsCreated: state.editorTabsCreated,
        forceRun: state.forceRun,
        parseErrorsByStmt: state.parseErrorsByStmt,
        dispatch: customDispatch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export type { AppStore };
export { AppProvider, useAppContext };
