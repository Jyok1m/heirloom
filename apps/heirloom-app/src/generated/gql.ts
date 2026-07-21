/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query TreeDetail($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n        notes\n      }\n      unions {\n        id\n        type\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n": typeof types.TreeDetailDocument,
    "\n  mutation CreatePersonM($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n": typeof types.CreatePersonMDocument,
    "\n  mutation UpdatePersonM($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.UpdatePersonMDocument,
    "\n  mutation DeletePersonM($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n": typeof types.DeletePersonMDocument,
    "\n  mutation CreateUnionM($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateUnionMDocument,
    "\n  mutation AddUnionPartnerM($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": typeof types.AddUnionPartnerMDocument,
    "\n  mutation AddUnionChildM($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n": typeof types.AddUnionChildMDocument,
    "\n  query Trees {\n    trees {\n      id\n      name\n      description\n      createdAt\n      persons {\n        id\n      }\n    }\n  }\n": typeof types.TreesDocument,
    "\n  mutation CreateTree($input: CreateTreeInput!) {\n    createTree(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.CreateTreeDocument,
    "\n  mutation UpdateTree($id: ID!, $input: UpdateTreeInput!) {\n    updateTree(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.UpdateTreeDocument,
    "\n  mutation DeleteTree($id: ID!) {\n    deleteTree(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteTreeDocument,
};
const documents: Documents = {
    "\n  query TreeDetail($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n        notes\n      }\n      unions {\n        id\n        type\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n": types.TreeDetailDocument,
    "\n  mutation CreatePersonM($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n": types.CreatePersonMDocument,
    "\n  mutation UpdatePersonM($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n": types.UpdatePersonMDocument,
    "\n  mutation DeletePersonM($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n": types.DeletePersonMDocument,
    "\n  mutation CreateUnionM($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n": types.CreateUnionMDocument,
    "\n  mutation AddUnionPartnerM($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": types.AddUnionPartnerMDocument,
    "\n  mutation AddUnionChildM($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n": types.AddUnionChildMDocument,
    "\n  query Trees {\n    trees {\n      id\n      name\n      description\n      createdAt\n      persons {\n        id\n      }\n    }\n  }\n": types.TreesDocument,
    "\n  mutation CreateTree($input: CreateTreeInput!) {\n    createTree(input: $input) {\n      id\n      name\n    }\n  }\n": types.CreateTreeDocument,
    "\n  mutation UpdateTree($id: ID!, $input: UpdateTreeInput!) {\n    updateTree(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": types.UpdateTreeDocument,
    "\n  mutation DeleteTree($id: ID!) {\n    deleteTree(id: $id) {\n      id\n    }\n  }\n": types.DeleteTreeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TreeDetail($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n        notes\n      }\n      unions {\n        id\n        type\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TreeDetail($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n        notes\n      }\n      unions {\n        id\n        type\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePersonM($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePersonM($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePersonM($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePersonM($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePersonM($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeletePersonM($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUnionM($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUnionM($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddUnionPartnerM($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddUnionPartnerM($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddUnionChildM($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddUnionChildM($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Trees {\n    trees {\n      id\n      name\n      description\n      createdAt\n      persons {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query Trees {\n    trees {\n      id\n      name\n      description\n      createdAt\n      persons {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTree($input: CreateTreeInput!) {\n    createTree(input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTree($input: CreateTreeInput!) {\n    createTree(input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTree($id: ID!, $input: UpdateTreeInput!) {\n    updateTree(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTree($id: ID!, $input: UpdateTreeInput!) {\n    updateTree(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTree($id: ID!) {\n    deleteTree(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteTree($id: ID!) {\n    deleteTree(id: $id) {\n      id\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;