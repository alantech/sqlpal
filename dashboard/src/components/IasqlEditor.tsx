import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import ReactAce, { IAceEditorProps } from 'react-ace/lib/ace';

import debounce from 'lodash/debounce';
import dynamic from 'next/dynamic';

import { useQueryParams } from '@/hooks/useQueryParams';

import QuerySidebar from './QuerySidebar/QuerySidebar';
import { HBox, align, VBox, Spinner, Tab } from './common';
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
    selectedDb,
    functions,
    token,
    editorTabs,
    editorSelectedTab,
    forceRun,
    connString,
  } = useAppContext();
  const editorRef = useRef(null as null | ReactAce);
  const prevTabsLenRef = useRef(null as null | number);
  const queryParams = useQueryParams();
  const [suggestions, setSuggestions] = useState([] as { value: string; meta: string; score: number }[]);

  // Handlers
  const getInitialQuery = useCallback((sql: string | null) => {
    let initialQuery = editorTabs?.[editorSelectedTab]?.content ?? 'SELECT * FROM iasql_help();';
    if (sql && sql.length > 0) initialQuery = sql;
    return initialQuery;
  }, []);

  const handleEditorContentUpdate = useCallback(
    (content: string, event: any) => {
      editorRef?.current?.editor.commands.on('afterExec', eventData => {
        // clean suggestions
        // todo: DRY this
        if (editorRef?.current?.editor?.suggestionNode) {
          editorRef.current.editor.renderer?.scroller?.removeChild(editorRef.current.editor.suggestionNode);
          editorRef.current.editor.suggestionNode = null;
        }
        handleAfterExec(eventData);
      });
      dispatch({ action: ActionType.EditContent, data: { content } });
    },
    [dispatch],
  );

  const handleQueryToRunUpdate = useCallback(
    (db: any, tabIdx: number, connString?: string) => {
      const contentToBeRun = editorRef?.current?.editor?.getSelectedText()
        ? editorRef?.current?.editor?.getSelectedText()
        : editorRef?.current?.editor?.getValue();
      if (token && contentToBeRun) {
        dispatch({
          token,
          action: ActionType.RunSql,
          data: {
            db,
            content: contentToBeRun,
            tabIdx,
            connString,
          },
        });
      }
    },
    [dispatch, token],
  );

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
    handleEditorContentUpdate(getInitialQuery(queryParams.get('sql')), null);
  }, [getInitialQuery, handleEditorContentUpdate, queryParams]);

  // Set up command to enable Ctrl-Enter runs
  const command = {
    name: 'Run SQL',
    bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
    exec: () => handleQueryToRunUpdate(selectedDb, editorSelectedTab, connString),
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
    // For now just reset completers
    if (editorRef?.current?.editor?.completers) editorRef.current.editor.completers = [];
  }, []);

  useEffect(() => {
    if (editorTabs.length !== prevTabsLenRef.current) {
      dispatch({
        token,
        action: ActionType.EditorSelectTab,
        data: {
          index: editorTabs.length - 2 >= 0 ? editorTabs.length - 2 : 0,
          forceRun,
          editorTabs,
          selectedDb,
        },
      });
    }
  }, [editorTabs, dispatch, forceRun, selectedDb, token]);

  useEffect(() => {
    if (!prevTabsLenRef.current || prevTabsLenRef.current !== editorTabs.length) {
      prevTabsLenRef.current = editorTabs.length;
    }
  }, [editorTabs]);

  const handleAfterExec = debounce((eventData: any) => {
    if (eventData.command.name === 'insertstring') {
      console.log('User typed a character: ' + eventData.args);

      // check if latest characters typed have been space, tab, or enter
      const lastChar = eventData.args;
      if (lastChar === ' ' || lastChar === '\t' || lastChar === '\n') return;

      const content = editorRef?.current?.editor.session.getValue() ?? '';
      const pos = editorRef?.current?.editor.getCursorPosition();

      const line = editorRef?.current?.editor.session.getLine(pos!.row) ?? '';

      // retrieve also the 2 previous lines
      const linesToRetrieve = 3;
      const lines = content.split('\n');
      let selectedLines: any[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(line)) {
          const startIndex = Math.max(0, i - linesToRetrieve + 1);
          const endIndex = i + 1;
          selectedLines = lines.slice(startIndex, endIndex);
          break;
        }
      }
      const finalText = selectedLines.length == 0 ? line : selectedLines.join('\n');
      if (finalText && finalText.length > 3) {
        // having the final text, call the sqlpal autocomplete to get a completion
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conn_str: connString, query: finalText }),
          credentials: 'include' as RequestCredentials,
        };
        const endpoint = process.env.AUTOCOMPLETE_ENDPOINT ?? 'http://localhost:5000/autocomplete';
        fetch(endpoint, requestOptions)
          .then(response => response.json())
          .then(response => {
            if (response['output_text']) {
              // check if response is a valid sql query
              const sg = [{ value: response['output_text'], meta: 'custom', score: 1000 }];
              setSuggestions(sg);
            }
          })
          .catch(error => console.error(error));
      }
    }
  }, 500);

  useEffect(() => {
    // keep loggers here while we debug more later
    let editor = editorRef?.current?.editor;
    let suggestionNode = editor?.suggestionNode;
    let shouldShow = !!suggestions.length;
    console.log(`new suggestions? ${shouldShow}`);
    let coord;
    if (editor) {
      console.log(editor.renderer.getScrollTop());
      const pos = editor.getCursorPosition();
      console.log(`pos: ${pos.row}, ${pos.column}`);
      coord = editor.renderer.textToScreenCoordinates(pos.row, pos.column);
      console.log(`coord: ${coord.pageX}, ${coord.pageY}`);
    }
    if (editor && shouldShow) {
      if (editor.suggestionNode) {
        editor.renderer.scroller.removeChild(editor.suggestionNode);
        editor.suggestionNode = null;
      }
      const suggestionValue =
        suggestions.sort((a, b) => (a.score > b.score ? 1 : a.score < b.score ? -1 : 0))?.[0]?.value ?? '';
      suggestionNode = editor.suggestionNode = document.createElement('div');
      suggestionNode.textContent = suggestionValue;
      suggestionNode.className = 'ace_suggestionMessage';
      suggestionNode.style.padding = '0 9px';
      suggestionNode.style.position = 'fixed';
      suggestionNode.style.top = `${coord?.pageY ?? 0}px`;
      suggestionNode.style.left = `${(coord?.pageX ?? 0) + 10}px`;
      suggestionNode.style.zIndex = 9;
      suggestionNode.style.opacity = 0.5;
      editor?.renderer?.scroller?.appendChild(suggestionNode);
    }
  }, [suggestions]);

  useEffect(() => {
    // lets add a listener for the tab key
    let editor = editorRef?.current?.editor;
    if (editor) {
      editor.commands.addCommand({
        name: 'tabListener',
        bindKey: { win: 'Tab', mac: 'Tab' },
        exec: function () {
          console.log(`executing tab listener`);
          if (editor?.suggestionNode) {
            // Check if it is a comment some we insert in the next line
            const pos = editor.getCursorPosition();
            const lineContent: string =
              (editor?.session as any)?.getTextRange({ start: { row: pos.row, column: 0 }, end: pos }) ?? '';
            // todo: generalize this to other comment types
            if (lineContent.startsWith('--')) {
              editor.insert(`\n${editor.suggestionNode.textContent ?? ''}`);
            } else {
              // todo: do not replace the whole line, but only the text before the cursor or define a range. How to calculate it?
              // replace the text before the cursor with the suggestion
              const range: any = { start: { row: pos.row, column: 0 }, end: pos };
              editor.session.replace(range, editor.suggestionNode.textContent);
            }
            editor.renderer?.scroller?.removeChild(editor?.suggestionNode);
            editor.suggestionNode = null;
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
          console.log(`executing esc listener`);
          if (editor?.suggestionNode) {
            editor.renderer?.scroller?.removeChild(editor?.suggestionNode);
            editor.suggestionNode = null;
          }
        },
      });
    }
  }, [editorRef.current]);

  return (
    <VBox customClasses='mb-3'>
      <HBox alignment={align.between}>
        {/* {!Object.keys(functions ?? {}).length ? <Spinner /> : <QuerySidebar />} */}
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
              enableLiveAutocompletion: false,
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
