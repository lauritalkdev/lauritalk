# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateUser, useGetTranslations, useCreateLexiconEntry, useListSubscriptionTypes } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateUser();

const { data, isPending, isSuccess, isError, error } = useGetTranslations();

const { data, isPending, isSuccess, isError, error } = useCreateLexiconEntry(createLexiconEntryVars);

const { data, isPending, isSuccess, isError, error } = useListSubscriptionTypes();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, getTranslations, createLexiconEntry, listSubscriptionTypes } from '@dataconnect/generated';


// Operation CreateUser: 
const { data } = await CreateUser(dataConnect);

// Operation GetTranslations: 
const { data } = await GetTranslations(dataConnect);

// Operation CreateLexiconEntry:  For variables, look at type CreateLexiconEntryVars in ../index.d.ts
const { data } = await CreateLexiconEntry(dataConnect, createLexiconEntryVars);

// Operation ListSubscriptionTypes: 
const { data } = await ListSubscriptionTypes(dataConnect);


```