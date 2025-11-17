import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'lauritalk',
  location: 'us-east1'
};

export const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';

export function createUser(dc) {
  return executeMutation(createUserRef(dc));
}

export const getTranslationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTranslations');
}
getTranslationsRef.operationName = 'GetTranslations';

export function getTranslations(dc) {
  return executeQuery(getTranslationsRef(dc));
}

export const createLexiconEntryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLexiconEntry', inputVars);
}
createLexiconEntryRef.operationName = 'CreateLexiconEntry';

export function createLexiconEntry(dcOrVars, vars) {
  return executeMutation(createLexiconEntryRef(dcOrVars, vars));
}

export const listSubscriptionTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSubscriptionTypes');
}
listSubscriptionTypesRef.operationName = 'ListSubscriptionTypes';

export function listSubscriptionTypes(dc) {
  return executeQuery(listSubscriptionTypesRef(dc));
}

