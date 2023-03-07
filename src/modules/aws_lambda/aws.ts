import {
  CreateFunctionCommandInput,
  FunctionConfiguration,
  Lambda,
  paginateListFunctions,
  waitUntilFunctionActiveV2,
  waitUntilFunctionUpdatedV2,
} from '@aws-sdk/client-lambda';

import { AWS, crudBuilder, paginateBuilder } from '../../services/aws_macros';

const innerCreateFunction = crudBuilder<Lambda, 'createFunction'>('createFunction', input => input);

/**
 * @internal
 */
export const createFunction = async (client: Lambda, input: CreateFunctionCommandInput) => {
  let counter = 0;
  do {
    try {
      return await innerCreateFunction(client, input);
    } catch (e: any) {
      if (e.message !== 'The role defined for the function cannot be assumed by Lambda.') break;
    }
    counter++;
    await new Promise(r => setTimeout(r, 5000));
  } while (counter <= 10);
};
/**
 * @internal
 */
export const getFunction = crudBuilder<Lambda, 'getFunction'>('getFunction', FunctionName => ({
  FunctionName,
}));

/**
 * @internal
 */
export const listFunctions = paginateBuilder<Lambda>(paginateListFunctions, 'Functions');

/**
 * @internal
 */
export const getFunctions = async (client: Lambda) => {
  const functions: FunctionConfiguration[] = await listFunctions(client);
  const out = [];
  for (const fn of functions) {
    const fnRes = await getFunction(client, fn.FunctionName);
    if (fnRes) out.push(fnRes);
  }
  return out;
};

/**
 * @internal
 */
export const deleteFunction = crudBuilder<Lambda, 'deleteFunction'>('deleteFunction', FunctionName => ({
  FunctionName,
}));

/**
 * @internal
 */
export const addFunctionTags = crudBuilder<Lambda, 'tagResource'>('tagResource', (Resource, Tags) => ({
  Resource,
  Tags,
}));

/**
 * @internal
 */
export const updateFunctionConfiguration = crudBuilder<Lambda, 'updateFunctionConfiguration'>(
  'updateFunctionConfiguration',
  input => input,
);

/**
 * @internal
 */
export const updateFunctionCode = crudBuilder<Lambda, 'updateFunctionCode'>(
  'updateFunctionCode',
  input => input,
);

/**
 * @internal
 */
export const listFunctionTags = crudBuilder<Lambda, 'listTags'>('listTags', Resource => ({ Resource }));

/**
 * @internal
 */
export const removeFunctionTags = crudBuilder<Lambda, 'untagResource'>(
  'untagResource',
  (Resource, TagKeys) => ({
    Resource,
    TagKeys,
  }),
);

/**
 * @internal
 */
export const waitUntilFunctionActive = (client: Lambda, FunctionName: string) => {
  return waitUntilFunctionActiveV2(
    {
      client,
      // all in seconds
      maxWaitTime: 300,
      minDelay: 1,
      maxDelay: 4,
    },
    { FunctionName },
  );
};

/**
 * @internal
 */
export const waitUntilFunctionUpdated = (client: Lambda, FunctionName: string) => {
  return waitUntilFunctionUpdatedV2(
    {
      client,
      // all in seconds
      maxWaitTime: 300,
      minDelay: 1,
      maxDelay: 4,
    },
    { FunctionName },
  );
};

/**
 * @internal
 */
export const invokeFunction = crudBuilder<Lambda, 'invoke'>('invoke', input => input);

export { AWS };
