import { CreateUserData, GetTranslationsData, CreateLexiconEntryData, CreateLexiconEntryVariables, ListSubscriptionTypesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useGetTranslations(options?: useDataConnectQueryOptions<GetTranslationsData>): UseDataConnectQueryResult<GetTranslationsData, undefined>;
export function useGetTranslations(dc: DataConnect, options?: useDataConnectQueryOptions<GetTranslationsData>): UseDataConnectQueryResult<GetTranslationsData, undefined>;

export function useCreateLexiconEntry(options?: useDataConnectMutationOptions<CreateLexiconEntryData, FirebaseError, CreateLexiconEntryVariables>): UseDataConnectMutationResult<CreateLexiconEntryData, CreateLexiconEntryVariables>;
export function useCreateLexiconEntry(dc: DataConnect, options?: useDataConnectMutationOptions<CreateLexiconEntryData, FirebaseError, CreateLexiconEntryVariables>): UseDataConnectMutationResult<CreateLexiconEntryData, CreateLexiconEntryVariables>;

export function useListSubscriptionTypes(options?: useDataConnectQueryOptions<ListSubscriptionTypesData>): UseDataConnectQueryResult<ListSubscriptionTypesData, undefined>;
export function useListSubscriptionTypes(dc: DataConnect, options?: useDataConnectQueryOptions<ListSubscriptionTypesData>): UseDataConnectQueryResult<ListSubscriptionTypesData, undefined>;
