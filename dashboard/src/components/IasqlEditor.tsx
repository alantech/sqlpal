import { forwardRef, useCallback, useEffect, useRef } from 'react';
import ReactAce, { IAceEditorProps } from 'react-ace/lib/ace';

import debounce from 'lodash/debounce';
import dynamic from 'next/dynamic';

import { useQueryParams } from '@/hooks/useQueryParams';

import QuerySidebar from './QuerySidebar/QuerySidebar';
import { HBox, align, VBox, Tab } from './common';
import { ActionType, useAppContext } from './providers/AppProvider';

const AceEdit = dynamic(
  async () => {
    require('ace-builds/src-noconflict/ace');
    const ace = await import('./AceEditor');
    require('ace-builds/src-noconflict/ext-language_tools');
    require('ace-builds/src-noconflict/theme-monokai');
    require('ace-builds/src-noconflict/mode-pgsql');
    require('ace-builds/src-noconflict/theme-tomorrow');
    return ace;
  },
  { ssr: false },
);

const ForwardRefEditor = forwardRef((props: IAceEditorProps, ref: any) => (
  <AceEdit props={props} editorRef={ref} />
));
ForwardRefEditor.displayName = 'ForwardRefEditor';

export default function IasqlEditor() {
  const {
    dispatch,
    isDarkMode,
    token,
    editorTabs,
    editorSelectedTab,
    forceRun,
    connString,
    schema,
    stmtsTable,
  } = useAppContext();
  const editorRef = useRef(null as null | ReactAce);
  const prevTabsLenRef = useRef(null as null | number);
  const queryParams = useQueryParams();

  // Handlers
  const getInitialQuery = useCallback((sql: string | null) => {
    let initialQuery = editorTabs?.[editorSelectedTab]?.content ?? 'SELECT * FROM iasql_help();';
    if (sql && sql.length > 0) initialQuery = sql;
    return initialQuery;
  }, []);

  const handleEditorContentUpdate = useCallback(
    (content: string) => {
      editorRef?.current?.editor.commands.on('afterExec', eventData => {
        handleAfterExec(eventData);
      });
      dispatch({ action: ActionType.EditContent, data: { content } });
    },
    [dispatch],
  );

  const handleQueryToRunUpdate = useCallback(
    (connString: string, tabIdx: number) => {
      const contentToBeRun = editorRef?.current?.editor?.getSelectedText()
        ? editorRef?.current?.editor?.getSelectedText()
        : editorRef?.current?.editor?.getValue();
      if (token && contentToBeRun) {
        dispatch({
          token,
          action: ActionType.RunSql,
          data: {
            content: contentToBeRun,
            tabIdx,
            connString,
          },
        });
      }
    },
    [dispatch, token],
  );

  const clearSuggestions = () => {
    const editor = editorRef.current?.editor;
    if (!!editor?.ghostText) {
      editor.setGhostText('', editor.getCursorPosition());
      editor.ghostText = '';
    }
    dispatch({ action: ActionType.ResetSuggestion, data: { tabIdx: editorSelectedTab } });
  };

  const onTabChange = (i: number) => {
    dispatch({
      action: ActionType.EditorSelectTab,
      data: { index: i === editorTabs.length - 1 ? i - 1 : i },
    });
  };

  const onTabClose = (i: number) => {
    dispatch({
      action: ActionType.EditorCloseTab,
      data: { index: i },
    });
  };

  // Set up initial query in editor content
  useEffect(() => {
    handleEditorContentUpdate(getInitialQuery(queryParams.get('sql')));
  }, [getInitialQuery, handleEditorContentUpdate, queryParams]);

  // Set up command to enable Ctrl-Enter runs
  const command = {
    name: 'Run SQL',
    bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
    exec: () => handleQueryToRunUpdate(connString, editorSelectedTab),
  };

  useEffect(() => {
    if (editorTabs?.[editorSelectedTab]?.isRunning) {
      editorRef?.current?.editor?.commands?.removeCommand(command);
    } else {
      editorRef?.current?.editor?.commands?.removeCommand(command);
      editorRef?.current?.editor?.commands?.addCommand(command);
    }
  }, [editorTabs, editorSelectedTab, editorRef.current]);

  // Set up editor theme
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = localStorage.getItem('theme') === 'dark';
      if (isDark && editorRef?.current?.editor?.getTheme() === 'ace/theme/tomorrow') {
        editorRef?.current?.editor?.setTheme('ace/theme/monokai');
      } else if (!isDark && editorRef?.current?.editor?.getTheme() === 'ace/theme/monokai') {
        editorRef?.current?.editor?.setTheme('ace/theme/tomorrow');
      }
    });
    observer.observe(root, { attributes: true });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      const isDark = event.matches;
      editorRef?.current?.editor?.setTheme(isDark ? 'ace/theme/monokai' : 'ace/theme/tomorrow');
    });
  }, []);

  useEffect(() => {
    if (editorRef?.current?.editor?.completers.length) {
      // Reset completers
      editorRef.current.editor.completers = [];
      // Add custom completer
      editorRef?.current?.editor?.completers?.push({
        getCompletions: (_editor: any, _session: any, _pos: any, _prefix: any, callback: any) => {
          const completions: any[] = [];
          // we can use session and pos here to decide what we are going to show
          const autoCompleteSqlPalKeywords = [
            // Table Names
            ...Object.keys(schema ?? {}).map(value => ({ value, meta: 'table', score: 200 })),
            // Column Names
            ...Object.entries(schema ?? [])
              .map(([tbl, val]) =>
                Object.keys(val).map((col, i) => ({
                  caption: `${tbl}.${col}`,
                  value: col,
                  meta: 'field',
                  score: 100 - i,
                })),
              )
              .flat(),
          ];
          autoCompleteSqlPalKeywords?.forEach(completion => {
            completions.push(completion);
          });
          callback(null, completions);
        },
      });
    }
  }, [schema, editorRef?.current?.editor]);

  useEffect(() => {
    if (editorTabs.length !== prevTabsLenRef.current) {
      dispatch({
        token,
        action: ActionType.EditorSelectTab,
        data: {
          index: editorTabs.length - 2 >= 0 ? editorTabs.length - 2 : 0,
          forceRun,
          editorTabs,
          connString,
        },
      });
    }
  }, [editorTabs, dispatch, forceRun, connString, token]);

  useEffect(() => {
    if (!prevTabsLenRef.current || prevTabsLenRef.current !== editorTabs.length) {
      prevTabsLenRef.current = editorTabs.length;
    }
  }, [editorTabs]);

  const handleAfterExec = debounce((eventData: any) => {
    if (eventData.command.name === 'insertstring') {
      dispatch({
        action: ActionType.ValidateContent,
        data: { content: editorRef?.current?.editor.getValue() },
      });
      // check if latest characters typed have been space, tab, or enter
      const lastChar = eventData.args;
      if (lastChar === ' ' || lastChar === '\t' || lastChar === '\n') return;

      const pos = editorRef?.current?.editor.getCursorPosition();
      const lines = editorRef?.current?.editor.session.doc.getAllLines() ?? [];
      let content;
      if (pos && typeof pos.row !== 'undefined' && typeof pos.column !== 'undefined')
        content = lines.slice(0, pos.row).join('\n') + '\n' + lines[pos.row].substring(0, pos.column) ?? '';
      else content = editorRef?.current?.editor.session.getValue() ?? '';
      // split in chunks and retrieve the last one
      const chunks = content.split(';');
      let finalText;
      if (chunks.length > 0) finalText = chunks[chunks.length - 1];
      if (finalText && finalText.length > 3) {
        dispatch({
          action: ActionType.GetSuggestions,
          data: { query: finalText, connString, tabIdx: editorSelectedTab },
        });
      }
    }
  }, 500);

  useEffect(() => {
    if (editorTabs[editorSelectedTab]?.suggestions?.length) {
      const suggestions = editorTabs[editorSelectedTab].suggestions;
      let editor = editorRef?.current?.editor;
      let shouldShow = !!suggestions.length;
      if (editor && shouldShow) {
        const currentPos = editor.getCursorPosition();
        const suggestionValue =
          suggestions.sort((a, b) => (a.score > b.score ? 1 : a.score < b.score ? -1 : 0))?.[0]?.value ?? '';
        editor.ghostText = suggestionValue;
        editor.setGhostText(`  ${suggestionValue}`, currentPos);
      }
    }
  }, [editorTabs]);

  useEffect(() => {
    // lets add a listener for the tab key
    let editor = editorRef?.current?.editor;
    if (editor) {
      editor.commands.addCommand({
        name: 'tabListener',
        bindKey: { win: 'Tab', mac: 'Tab' },
        exec: function () {
          if (!!editor?.ghostText) {
            // Check if it is a comment some we insert in the next line
            const currentPos = editor.getCursorPosition();
            const lineContent = editor?.session.getLine(currentPos.row) ?? '';
            // todo: generalize this to other comment types
            if (lineContent.startsWith('--')) {
              editor.insert(`\n${editor.ghostText ?? ''}`);
            } else {
              // todo: do not replace the whole line, but only the text before the cursor or define a range. How to calculate it?
              // replace the text before the cursor with the suggestion
              const range: any = { start: { row: currentPos.row, column: 0 }, end: currentPos };
              editor.session.replace(range, editor.ghostText);
            }
            clearSuggestions();
          } else if (editor) {
            editor.insert(' '.repeat(editor?.getOptions().tabSize ?? 2));
          }
        },
      });
    }
  }, [editorRef.current]);

  useEffect(() => {
    // lets add a listener for the escape key
    let editor = editorRef?.current?.editor;
    if (editor) {
      editor.commands.addCommand({
        name: 'escapeListener',
        bindKey: { win: 'Esc', mac: 'Esc' },
        exec: function () {
          if (!!editor?.ghostText) {
            editor.setGhostText('', editor.getCursorPosition());
            clearSuggestions();
          }
        },
      });
    }
  }, [editorRef.current]);

  useEffect(() => {
    const editor = editorRef?.current?.editor;
    if (editor) {
      const isPopupOpen = !!editor?.completer?.popup?.isOpen;
      const markerErrorClass = 'absolute border-b-2 border-dotted border-rose-500';
      const markerType = 'text';
      editor.session.clearAnnotations();
      // If there are no statements, we remove all markers
      if (!Object.keys(stmtsTable ?? {}).length) {
        const currentMarkers = editor.session.getMarkers(true);
        for (const m of Object.values(currentMarkers ?? {})) {
          editor.session.removeMarker(m.id);
        }
      }
      for (const stmt of Object.keys(stmtsTable ?? {})) {
        const parseError = stmtsTable?.[stmt];
        // Find the statement in the editor content.
        // The `find` method automatically selects the range, so we need to clear the selection and restore the cursor position
        const cursorPos = editor.getCursorPosition();
        const range = editor.find(stmt, {}, false);
        editor?.selection?.clearSelection();
        if (cursorPos) editor.moveCursorToPosition(cursorPos);
        // If we did not find the statement, we continue
        if (!range) continue;
        // Let's get current markers
        const currentMarkers = editor.session.getMarkers(true);
        const stmtMarker = Object.values(currentMarkers ?? {}).find(
          m =>
            m?.type === markerType &&
            m?.range?.start.row === range.start.row &&
            m?.range?.start.column === range.start.column &&
            m?.clazz === markerErrorClass,
        );
        // Now, if there's a parseError we need to add the annotation and the marker
        if (parseError) {
          if (!stmtMarker) editor.session.addMarker(range, markerErrorClass, markerType, true);
          editor.session.setAnnotations([
            ...editor.session.getAnnotations(),
            { row: range.start.row, type: 'error', text: stmtsTable?.[stmt] },
          ]);
        }
        // If theres no parseError but we have a marker, we remove it
        if (!parseError && stmtMarker) editor.session.removeMarker(stmtMarker.id);
      }
      // If the popup was open, we need to reopen it
      if (isPopupOpen) editor.completer?.showPopup(editor);
    }
  }, [stmtsTable]);

  return (
    <VBox customClasses='mb-3'>
      <HBox alignment={align.between}>
        <QuerySidebar />
        <VBox id='tabs-and-editor' customClasses='w-full' height='h-50vh'>
          <Tab
            tabs={editorTabs}
            defaultIndex={editorSelectedTab}
            onChange={onTabChange}
            selectedIndex={editorSelectedTab}
            onTabClose={onTabClose}
            isLoading={editorTabs.some(t => t.isRunning)}
          ></Tab>
          <ForwardRefEditor
            ref={editorRef}
            // `dark:` selector is not working here, I guess it is not compatible with AceEditor component
            className='border-none'
            width='100%'
            height='100%'
            name='iasql-editor'
            value={editorTabs[editorSelectedTab].content}
            onChange={handleEditorContentUpdate}
            mode='pgsql'
            setOptions={{
              showPrintMargin: false,
              useWorker: false,
              enableBasicAutocompletion: false,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              spellcheck: true,
              tabSize: 2,
              theme: isDarkMode ? 'ace/theme/monokai' : 'ace/theme/tomorrow',
            }}
          />
        </VBox>
      </HBox>
    </VBox>
  );
}
