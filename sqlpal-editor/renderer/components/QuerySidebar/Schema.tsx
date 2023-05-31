import {
  MdDataArray,
  MdDataObject,
  MdDateRange,
  MdNumbers,
  MdOutlineApps,
  MdOutlineToggleOff,
  MdTextFields,
  MdQuestionMark,
} from 'react-icons/md';
import { TbNetwork } from 'react-icons/tb';

import { TableIcon } from '@heroicons/react/outline';

import { Accordion, align, HBox, VBox } from '../common';
import { ActionType, useAppContext } from '../providers/AppProvider';

function getIconForDataType(dataType: string) {
  switch (dataType) {
    case 'boolean':
      return <MdOutlineToggleOff title={dataType} />;
    case 'smallint':
    case 'double precision':
    case 'integer':
      return <MdNumbers title={dataType} />;
    case 'character varying':
    case 'text':
      return <MdTextFields title={dataType} />;
    case 'json':
    case 'jsonb':
      return <MdDataObject title={dataType} />;
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return <MdDateRange title={dataType} />;
    case 'cidr':
      return <TbNetwork title={dataType} />;
    case 'ARRAY':
      return <MdDataArray title={dataType} />;
    case 'USER-DEFINED':
      return <MdOutlineApps title={dataType} />;
    default:
      return <MdQuestionMark title={dataType} />;
  }
}

export default function Schema({
  schema,
}: {
  schema: {
    [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
      recordCount?: number;
    };
  };
}) {
  const { dispatch } = useAppContext();
  const selectTableIcon = <TableIcon className='w-4 h-4 m-2' aria-hidden='true' />;
  const selectTable = (tableName: string) => {
    dispatch({
      action: ActionType.SelectTable,
      data: {
        tableName,
      },
    });
  };

  type columnMetadata = { dataType: string; isMandatory: boolean };

  return (
    <VBox customClasses='w-full bg-transparent dark:bg-gray-800' id='schema-tab'>
      {/* TODO: make this a component */}
      {Object.keys(schema ?? {}).map((tableName: string) => (
        <Accordion
          key={tableName}
          id={tableName}
          title={tableName}
          defaultOpen={false}
          action={
            !!schema[tableName].recordCount ? { icon: selectTableIcon, handler: selectTable } : undefined
          }
        >
          {Object.entries(schema[tableName])
            .filter(([col, _]) => col !== 'recordCount')
            .map(([col, meta]) => (
              <HBox
                key={col}
                customStyles={
                  (meta as columnMetadata).isMandatory
                    ? 'pl-8 grid grid-cols-12 gap-1 font-bold'
                    : 'pl-8 grid grid-cols-12 gap-1'
                }
              >
                <HBox customStyles={'col-span-1'}>
                  {getIconForDataType((meta as columnMetadata).dataType)}
                </HBox>
                <HBox alignment={align.start} customStyles={'col-span-11'}>
                  <p className='text-ellipsis overflow-hidden' title={col}>
                    {col}
                  </p>
                </HBox>
              </HBox>
            ))}
        </Accordion>
      ))}
    </VBox>
  );
}
