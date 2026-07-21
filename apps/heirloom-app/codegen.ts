import type { CodegenConfig } from '@graphql-codegen/cli';

// Types and typed documents generated from the API schema.
// Run `pnpm codegen` after any schema or query change.
const config: CodegenConfig = {
  schema: '../heirloom-api/schema.gql',
  documents: ['src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    './src/generated/': {
      preset: 'client',
    },
  },
};

export default config;
