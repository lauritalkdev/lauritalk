const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'lauritalk',
  location: 'us-east1'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const getTranslationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTranslations');
}
getTranslationsRef.operationName = 'GetTranslations';
exports.getTranslationsRef = getTranslationsRef;

exports.getTranslations = function getTranslations(dc) {
  return executeQuery(getTranslationsRef(dc));
};

const createLexiconEntryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLexiconEntry', inputVars);
}
createLexiconEntryRef.operationName = 'CreateLexiconEntry';
exports.createLexiconEntryRef = createLexiconEntryRef;

exports.createLexiconEntry = function createLexiconEntry(dcOrVars, vars) {
  return executeMutation(createLexiconEntryRef(dcOrVars, vars));
};

const listSubscriptionTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSubscriptionTypes');
}
listSubscriptionTypesRef.operationName = 'ListSubscriptionTypes';
exports.listSubscriptionTypesRef = listSubscriptionTypesRef;

exports.listSubscriptionTypes = function listSubscriptionTypes(dc) {
  return executeQuery(listSubscriptionTypesRef(dc));
};
