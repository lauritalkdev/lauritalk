# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetTranslations*](#gettranslations)
  - [*ListSubscriptionTypes*](#listsubscriptiontypes)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*CreateLexiconEntry*](#createlexiconentry)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetTranslations
You can execute the `GetTranslations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTranslations(): QueryPromise<GetTranslationsData, undefined>;

interface GetTranslationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetTranslationsData, undefined>;
}
export const getTranslationsRef: GetTranslationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTranslations(dc: DataConnect): QueryPromise<GetTranslationsData, undefined>;

interface GetTranslationsRef {
  ...
  (dc: DataConnect): QueryRef<GetTranslationsData, undefined>;
}
export const getTranslationsRef: GetTranslationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTranslationsRef:
```typescript
const name = getTranslationsRef.operationName;
console.log(name);
```

### Variables
The `GetTranslations` query has no variables.
### Return Type
Recall that executing the `GetTranslations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTranslationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTranslationsData {
  translations: ({
    id: UUIDString;
    sourceText: string;
    targetText: string;
    sourceLanguage: string;
    targetLanguage: string;
  } & Translation_Key)[];
}
```
### Using `GetTranslations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTranslations } from '@dataconnect/generated';


// Call the `getTranslations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTranslations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTranslations(dataConnect);

console.log(data.translations);

// Or, you can use the `Promise` API.
getTranslations().then((response) => {
  const data = response.data;
  console.log(data.translations);
});
```

### Using `GetTranslations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTranslationsRef } from '@dataconnect/generated';


// Call the `getTranslationsRef()` function to get a reference to the query.
const ref = getTranslationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTranslationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.translations);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.translations);
});
```

## ListSubscriptionTypes
You can execute the `ListSubscriptionTypes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSubscriptionTypes(): QueryPromise<ListSubscriptionTypesData, undefined>;

interface ListSubscriptionTypesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSubscriptionTypesData, undefined>;
}
export const listSubscriptionTypesRef: ListSubscriptionTypesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSubscriptionTypes(dc: DataConnect): QueryPromise<ListSubscriptionTypesData, undefined>;

interface ListSubscriptionTypesRef {
  ...
  (dc: DataConnect): QueryRef<ListSubscriptionTypesData, undefined>;
}
export const listSubscriptionTypesRef: ListSubscriptionTypesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSubscriptionTypesRef:
```typescript
const name = listSubscriptionTypesRef.operationName;
console.log(name);
```

### Variables
The `ListSubscriptionTypes` query has no variables.
### Return Type
Recall that executing the `ListSubscriptionTypes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSubscriptionTypesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSubscriptionTypesData {
  subscriptionTypes: ({
    id: UUIDString;
    name: string;
    pricePerMonth: number;
    maxTranslationsPerMonth: number;
    hasPremiumFeatures: boolean;
  } & SubscriptionType_Key)[];
}
```
### Using `ListSubscriptionTypes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSubscriptionTypes } from '@dataconnect/generated';


// Call the `listSubscriptionTypes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSubscriptionTypes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSubscriptionTypes(dataConnect);

console.log(data.subscriptionTypes);

// Or, you can use the `Promise` API.
listSubscriptionTypes().then((response) => {
  const data = response.data;
  console.log(data.subscriptionTypes);
});
```

### Using `ListSubscriptionTypes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSubscriptionTypesRef } from '@dataconnect/generated';


// Call the `listSubscriptionTypesRef()` function to get a reference to the query.
const ref = listSubscriptionTypesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSubscriptionTypesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.subscriptionTypes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.subscriptionTypes);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## CreateLexiconEntry
You can execute the `CreateLexiconEntry` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createLexiconEntry(vars: CreateLexiconEntryVariables): MutationPromise<CreateLexiconEntryData, CreateLexiconEntryVariables>;

interface CreateLexiconEntryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLexiconEntryVariables): MutationRef<CreateLexiconEntryData, CreateLexiconEntryVariables>;
}
export const createLexiconEntryRef: CreateLexiconEntryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLexiconEntry(dc: DataConnect, vars: CreateLexiconEntryVariables): MutationPromise<CreateLexiconEntryData, CreateLexiconEntryVariables>;

interface CreateLexiconEntryRef {
  ...
  (dc: DataConnect, vars: CreateLexiconEntryVariables): MutationRef<CreateLexiconEntryData, CreateLexiconEntryVariables>;
}
export const createLexiconEntryRef: CreateLexiconEntryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLexiconEntryRef:
```typescript
const name = createLexiconEntryRef.operationName;
console.log(name);
```

### Variables
The `CreateLexiconEntry` mutation requires an argument of type `CreateLexiconEntryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateLexiconEntryVariables {
  term: string;
  customTranslation: string;
  sourceLanguage: string;
  targetLanguage: string;
}
```
### Return Type
Recall that executing the `CreateLexiconEntry` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLexiconEntryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateLexiconEntryData {
  lexiconEntry_insert: LexiconEntry_Key;
}
```
### Using `CreateLexiconEntry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLexiconEntry, CreateLexiconEntryVariables } from '@dataconnect/generated';

// The `CreateLexiconEntry` mutation requires an argument of type `CreateLexiconEntryVariables`:
const createLexiconEntryVars: CreateLexiconEntryVariables = {
  term: ..., 
  customTranslation: ..., 
  sourceLanguage: ..., 
  targetLanguage: ..., 
};

// Call the `createLexiconEntry()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLexiconEntry(createLexiconEntryVars);
// Variables can be defined inline as well.
const { data } = await createLexiconEntry({ term: ..., customTranslation: ..., sourceLanguage: ..., targetLanguage: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLexiconEntry(dataConnect, createLexiconEntryVars);

console.log(data.lexiconEntry_insert);

// Or, you can use the `Promise` API.
createLexiconEntry(createLexiconEntryVars).then((response) => {
  const data = response.data;
  console.log(data.lexiconEntry_insert);
});
```

### Using `CreateLexiconEntry`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLexiconEntryRef, CreateLexiconEntryVariables } from '@dataconnect/generated';

// The `CreateLexiconEntry` mutation requires an argument of type `CreateLexiconEntryVariables`:
const createLexiconEntryVars: CreateLexiconEntryVariables = {
  term: ..., 
  customTranslation: ..., 
  sourceLanguage: ..., 
  targetLanguage: ..., 
};

// Call the `createLexiconEntryRef()` function to get a reference to the mutation.
const ref = createLexiconEntryRef(createLexiconEntryVars);
// Variables can be defined inline as well.
const ref = createLexiconEntryRef({ term: ..., customTranslation: ..., sourceLanguage: ..., targetLanguage: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLexiconEntryRef(dataConnect, createLexiconEntryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lexiconEntry_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lexiconEntry_insert);
});
```

