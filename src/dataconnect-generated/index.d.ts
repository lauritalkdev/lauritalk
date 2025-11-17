import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateLexiconEntryData {
  lexiconEntry_insert: LexiconEntry_Key;
}

export interface CreateLexiconEntryVariables {
  term: string;
  customTranslation: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface GetTranslationsData {
  translations: ({
    id: UUIDString;
    sourceText: string;
    targetText: string;
    sourceLanguage: string;
    targetLanguage: string;
  } & Translation_Key)[];
}

export interface LexiconEntry_Key {
  id: UUIDString;
  __typename?: 'LexiconEntry_Key';
}

export interface ListSubscriptionTypesData {
  subscriptionTypes: ({
    id: UUIDString;
    name: string;
    pricePerMonth: number;
    maxTranslationsPerMonth: number;
    hasPremiumFeatures: boolean;
  } & SubscriptionType_Key)[];
}

export interface SubscriptionType_Key {
  id: UUIDString;
  __typename?: 'SubscriptionType_Key';
}

export interface Translation_Key {
  id: UUIDString;
  __typename?: 'Translation_Key';
}

export interface UserSubscription_Key {
  id: UUIDString;
  __typename?: 'UserSubscription_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface GetTranslationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetTranslationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetTranslationsData, undefined>;
  operationName: string;
}
export const getTranslationsRef: GetTranslationsRef;

export function getTranslations(): QueryPromise<GetTranslationsData, undefined>;
export function getTranslations(dc: DataConnect): QueryPromise<GetTranslationsData, undefined>;

interface CreateLexiconEntryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLexiconEntryVariables): MutationRef<CreateLexiconEntryData, CreateLexiconEntryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLexiconEntryVariables): MutationRef<CreateLexiconEntryData, CreateLexiconEntryVariables>;
  operationName: string;
}
export const createLexiconEntryRef: CreateLexiconEntryRef;

export function createLexiconEntry(vars: CreateLexiconEntryVariables): MutationPromise<CreateLexiconEntryData, CreateLexiconEntryVariables>;
export function createLexiconEntry(dc: DataConnect, vars: CreateLexiconEntryVariables): MutationPromise<CreateLexiconEntryData, CreateLexiconEntryVariables>;

interface ListSubscriptionTypesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSubscriptionTypesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSubscriptionTypesData, undefined>;
  operationName: string;
}
export const listSubscriptionTypesRef: ListSubscriptionTypesRef;

export function listSubscriptionTypes(): QueryPromise<ListSubscriptionTypesData, undefined>;
export function listSubscriptionTypes(dc: DataConnect): QueryPromise<ListSubscriptionTypesData, undefined>;

