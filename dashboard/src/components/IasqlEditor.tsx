import { forwardRef, useCallback, useEffect, useRef } from 'react';
import React from 'react';
import ReactAce, { IAceEditorProps } from 'react-ace/lib/ace';

import dynamic from 'next/dynamic';

import useLocalStorage from '@/hooks/useLocalStorage';

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
  // Get global state
  const {
    dispatch,
    isDarkMode,
    token,
    editorTabs,
    editorSelectedTab,
    forceRun,
    connString,
    schema,
    parseErrorsByStmt,
    dialect,
  } = useAppContext();

  // Refs
  const editorRef = useRef(null as null | ReactAce);
  const prevTabsLenRef = useRef(null as null | number);
  const loadingDotsRef = useRef(null as null | NodeJS.Timeout);

  // Custom hooks
  const tabToAcceptLS = localStorage.getItem('tabToAccept');
  const isTabToAcceptEnabled = tabToAcceptLS === null ? true : tabToAcceptLS === 'true';
  const autoSuggestLS = localStorage.getItem('autoSuggest');
  const isAutoSuggestEnabled = autoSuggestLS === null ? true : autoSuggestLS === 'true';
  const [tabToAcceptSuggestions, setTabToAccept] = useLocalStorage('tabToAccept', isTabToAcceptEnabled);
  const [autoSuggest, setAutoSuggest] = useLocalStorage('autoSuggest', isAutoSuggestEnabled);

  /** TABS */
  // Tab on change handler
  const onTabChange = (i: number) => {
    dispatch({
      action: ActionType.EditorSelectTab,
      data: { index: i === editorTabs.length - 1 ? i - 1 : i },
    });
  };

  // Tab on close handler
  const onTabClose = (i: number) => {
    dispatch({
      action: ActionType.EditorCloseTab,
      data: { index: i },
    });
  };

  // Handle tab selection
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
          dialect,
        },
      });
    }
  }, [editorTabs, dispatch, forceRun, connString, token]);

  // Keep track of tab length
  useEffect(() => {
    if (!prevTabsLenRef.current || prevTabsLenRef.current !== editorTabs.length) {
      prevTabsLenRef.current = editorTabs.length;
    }
  }, [editorTabs]);

  /** EDITOR */

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

  // Set state for local storage values
  useEffect(() => {
    setTabToAccept(() => isTabToAcceptEnabled);
    setAutoSuggest(() => isAutoSuggestEnabled);
  }, []);

  // Set up editor command to enable `Ctrl-Enter` to run queries
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
            dialect,
          },
        });
      }
    },
    [dispatch, token],
  );

  // detect clicks on the editor
  const handleEditorClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target?.className?.includes('ace_error') && target?.className?.includes('ace_gutter-cell')) {
      clearSuggestions();
      // Interval to show loading dots
      const editor = editorRef?.current?.editor;
      if (editor) removeLoadingDots(editor);
      if (editor) loadingDotsRef.current = generateLoadingDots(editor, 'Repairing query');
      // iterate over all queries that may have an error
      if (parseErrorsByStmt) {
        for (let key in parseErrorsByStmt) {
          let value = parseErrorsByStmt[key];
          if (value) {
            // trigger the repair call
            dispatch({
              action: ActionType.Repair,
              data: {
                query: key,
                error: value,
                schema: schema,
                connString,
                tabIdx: editorSelectedTab,
                dialect,
              },
            });
          }
        }
      }
      editorRef?.current?.editor.session.clearAnnotations();
      const currentMarkers = editorRef?.current?.editor.session.getMarkers(true);
      for (const m of Object.values(currentMarkers ?? {})) {
        editorRef?.current?.editor.session.removeMarker(m.id);
      }
    }
    e.stopPropagation();
  };

  useEffect(() => {
    const command = {
      name: 'Run SQL',
      bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
      exec: () => handleQueryToRunUpdate(connString, editorSelectedTab),
    };
    if (editorTabs?.[editorSelectedTab]?.isRunning) {
      editorRef?.current?.editor?.commands?.removeCommand(command);
    } else {
      editorRef?.current?.editor?.commands?.removeCommand(command);
      editorRef?.current?.editor?.commands?.addCommand(command);
    }
  }, [editorTabs, editorSelectedTab, editorRef.current]);

  // Set up editor on change handler
  const handleEditorContentUpdate = useCallback(
    (content: string) => {
      dispatch({ action: ActionType.EditContent, data: { content } });
    },
    [dispatch],
  );

  // Validate editor content on change
  useEffect(() => {
    const debounceValidation = setTimeout(() => {
      dispatch({
        action: ActionType.ValidateContent,
        data: { content: editorRef?.current?.editor.getValue(), schema, dialect },
      });
    }, 1000);
    return () => clearTimeout(debounceValidation);
  }, [editorTabs[editorSelectedTab].content]);

  // Set up editor completers
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

  /** SUGGESTIONS */

  // Listen for editor changes to trigger suggestions if enabled
  useEffect(() => {
    const debounceSuggestions = setTimeout(() => {
      if (!editorRef?.current?.editor?.autoSuggestEnabled) return;
      maybeDispatchSuggestion();
    }, 1000);
    return () => clearTimeout(debounceSuggestions);
  }, [editorTabs[editorSelectedTab].content]);

  // Calculate context for auto complete and dispatch event to get suggestions if needed
  const maybeDispatchSuggestion = () => {
    const editor = editorRef?.current?.editor;
    const contextText = getContextForAutoComplete();
    if (contextText && contextText.length > 3) {
      // Interval to show loading dots
      if (editor && loadingDotsRef.current) removeLoadingDots(editor);
      if (editor) loadingDotsRef.current = generateLoadingDots(editor, 'Getting Suggestions');
      // Dispatch suggestion
      dispatch({
        action: ActionType.GetSuggestions,
        data: { query: contextText, connString, tabIdx: editorSelectedTab, schema, dialect },
      });
    }
  };

  // Calculate final text to be used for autocomplete
  const getContextForAutoComplete: () => string = () => {
    const editor = editorRef?.current?.editor;
    const pos = editor?.getCursorPosition();
    const lines = editor?.session.doc.getAllLines() ?? [];
    let content;
    if (pos && typeof pos.row !== 'undefined' && typeof pos.column !== 'undefined')
      content = lines.slice(0, pos.row).join('\n') + '\n' + lines[pos.row].substring(0, pos.column) ?? '';
    else content = editor?.session.getValue() ?? '';
    // split in chunks and retrieve the last one
    const chunks = content.split(';');
    let finalText = '';
    if (chunks.length > 0) finalText = chunks[chunks.length - 1];
    return finalText;
  };

  // Generate loading dots while getting suggestions
  const generateLoadingDots = (editor: any, message: string) => {
    return setInterval(() => {
      editor.ghostText =
        editor.ghostText && editor.ghostText.length < 3 ? editor.ghostText + '.' : `${message}.`;
      editor.setGhostText(`  ${editor.ghostText}`, editor.getCursorPosition());
    }, 500);
  };

  // Remove loading dots when suggestions are received
  const removeLoadingDots = (editor: any) => {
    if (loadingDotsRef.current) {
      clearInterval(loadingDotsRef.current);
      loadingDotsRef.current = null;
      editor.setGhostText('', editor.getCursorPosition());
      editor.ghostText = undefined;
    }
  };

  // Show suggestions as ghost text
  useEffect(() => {
    if (editorTabs[editorSelectedTab]?.suggestions) {
      const suggestions = editorTabs[editorSelectedTab].suggestions;
      let editor = editorRef?.current?.editor;
      let shouldShow = !!suggestions.length;
      if (editor && shouldShow) {
        const currentPos = editor.getCursorPosition();
        const suggestionValue =
          suggestions.sort((a, b) => (a.score > b.score ? 1 : a.score < b.score ? -1 : 0))?.[0]?.value ?? '';
        removeLoadingDots(editor);
        editor.ghostText = suggestionValue;
        editor.setGhostText(`  ${suggestionValue}`, currentPos);
      }
      if (editor && !shouldShow && loadingDotsRef.current) {
        removeLoadingDots(editor);
      }
    }
  }, [editorTabs]);

  // Handler to clear suggestions
  const clearSuggestions = () => {
    const editor = editorRef.current?.editor;
    if (!!editor?.ghostText) {
      removeLoadingDots(editor);
      editor.setGhostText('', editor.getCursorPosition());
      editor.ghostText = undefined;
    }
    dispatch({ action: ActionType.ResetSuggestion, data: { tabIdx: editorSelectedTab } });
  };

  // Accepting suggestions will insert the suggestion
  // It also handles the key binding for accepting suggestions depending on the local storage config.
  // If tabToAccept is enabled, suggestions will be accepted with tab, if not, will be accepted with ctrl+K
  useEffect(() => {
    function handleSuggestionAcceptance() {
      if (!!editor?.ghostText && !loadingDotsRef.current) {
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
    }
    let editor = editorRef?.current?.editor;
    if (editor && tabToAcceptSuggestions) {
      editor.commands.removeCommand('tabListener');
      editor.commands.addCommand({
        name: 'tabListener',
        bindKey: { win: 'Tab', mac: 'Tab' },
        exec: handleSuggestionAcceptance,
      });
    } else if (editor && !tabToAcceptSuggestions) {
      editor.commands.removeCommand('tabListener');
      editor.commands.addCommand({
        name: 'tabListener',
        bindKey: { win: 'Ctrl-K', mac: 'Cmd-K' },
        exec: handleSuggestionAcceptance,
      });
    }
  }, [tabToAcceptSuggestions, editorRef.current]);

  // Rejecting suggestions will remove the suggestions and clear the ghost text
  // It also handles the key binding for rejecting suggestions. It will always be ESC
  useEffect(() => {
    let editor = editorRef?.current?.editor;
    if (editor) {
      editor.commands.addCommand({
        name: 'escapeListener',
        bindKey: { win: 'Esc', mac: 'Esc' },
        exec: function () {
          if (!!editor?.ghostText) {
            removeLoadingDots(editor);
            clearSuggestions();
          }
        },
      });
    }
  }, [editorRef.current]);

  // If auto suggest is not enabled, we need to add a key binding to trigger the suggestions
  // It will be ctrl+space
  useEffect(() => {
    let editor = editorRef?.current?.editor;
    if (editor && autoSuggest) {
      editor.commands.removeCommand('autoSuggestListener');
      // lets abuse the editor object to store the autoSuggest
      editor.autoSuggestEnabled = autoSuggest;
    } else if (editor && !autoSuggest) {
      editor.commands.removeCommand('autoSuggestListener');
      editor.commands.addCommand({
        name: 'autoSuggestListener',
        bindKey: { win: 'Ctrl-Space', mac: 'Ctrl-Space' },
        exec: () => {
          maybeDispatchSuggestion();
        },
      });
      editor.autoSuggestEnabled = autoSuggest;
    }
  }, [autoSuggest, editorRef.current]);

  /** CONTENT VALIDATION */

  // This effect will be triggered when the editor content changes.
  // It will validate the content and show errors underlining the statements and adding annotations
  useEffect(() => {
    const editor = editorRef?.current?.editor;
    if (editor) {
      const isPopupOpen = !!editor?.completer?.popup?.isOpen;
      const markerErrorClass = 'absolute border-b-2 border-dotted border-rose-500';
      const markerType = 'text';
      let range: any;
      // Clean-up phase
      editor.session.clearAnnotations();
      const currentMarkers = editor.session.getMarkers(true);
      for (const m of Object.values(currentMarkers ?? {})) {
        editor.session.removeMarker(m.id);
      }
      for (const stmt of Object.keys(parseErrorsByStmt ?? {})) {
        const parseError = parseErrorsByStmt?.[stmt];
        // Find the statement in the editor content.
        // The `find` method automatically selects the range, so we need to clear the selection and restore the cursor position
        const cursorPos = editor.getCursorPosition();
        range = editor.find(stmt, {}, false);
        editor?.selection?.clearSelection();
        if (cursorPos) editor.moveCursorToPosition(cursorPos);
        // If we did not find the statement, we continue
        if (!range) continue;
        // Now, if there's a parseError we need to add the annotation and the marker
        if (parseError) {
          editor.session.addMarker(range, markerErrorClass, markerType, true);
          editor.session.setAnnotations([
            ...editor.session.getAnnotations(),
            { row: range.start.row, type: 'error', text: parseErrorsByStmt?.[stmt] },
            { row: range.start.row, type: 'info', text: '-- Click to repair --' },
          ]);
        }
      }
      // If the popup was open, we need to reopen it
      if (isPopupOpen) editor.completer?.showPopup(editor);
    }
  }, [parseErrorsByStmt]);

  return (
    <VBox customClasses='mb-3'>
      <HBox alignment={align.between}>
        <QuerySidebar />
        <VBox id='tabs-and-editor' customClasses='w-full' height='h-50vh' onClick={handleEditorClick}>
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
              tooltipFollowsMouse: false,
              theme: isDarkMode ? 'ace/theme/monokai' : 'ace/theme/tomorrow',
            }}
          />
        </VBox>
      </HBox>
    </VBox>
  );
}
