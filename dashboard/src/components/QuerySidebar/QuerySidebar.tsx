import { Tab as ReactTab } from '@headlessui/react';

import { align, Tab, VBox } from '../common';
import { useAppContext } from '../providers/AppProvider';
import Schema from './Schema';

export default function QuerySidebar() {
  const { functions, installedModules } = useAppContext();
  return (
    <div className='h-50vh w-1/4 font-normal text-xs mr-2 overflow-auto' id='query-sidebar'>
      <Tab tabs={[{ title: 'Schema' }]} defaultIndex={0}>
        <VBox
          alignment={align.start}
          customClasses='h-sidebar bg-gray-100/20 dark:bg-gray-800 w-full overflow-auto'
        >
          <ReactTab.Panel className='w-full p-2 font-mono bg-gray-100/20 dark:bg-gray-800'>
            <div className='overflow-auto'>
              <Schema moduleData={installedModules} functionData={functions} />
            </div>
          </ReactTab.Panel>
        </VBox>
      </Tab>
    </div>
  );
}
