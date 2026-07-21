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
    "\n  query TreeCanvas($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n      }\n      unions {\n        id\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n": typeof types.TreeCanvasDocument,
    "\n  query PersonDetail($id: ID!) {\n    person(id: $id) {\n      id\n      treeId\n      firstName\n      lastName\n      namePrefix\n      nameSuffix\n      nickname\n      sex\n      notes\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n      media {\n        id\n        type\n        filePath\n        mimeType\n        title\n        links {\n          id\n          personId\n        }\n      }\n      unions {\n        id\n        type\n        notes\n        partners {\n          id\n          firstName\n          lastName\n        }\n        children {\n          personId\n          pedigree\n          person {\n            id\n            firstName\n            lastName\n          }\n        }\n      }\n      parentUnions {\n        id\n        partners {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.PersonDetailDocument,
    "\n  query UnionDetail($id: ID!) {\n    union(id: $id) {\n      id\n      treeId\n      type\n      notes\n      partners {\n        id\n        firstName\n        lastName\n      }\n      children {\n        personId\n        pedigree\n        person {\n          id\n          firstName\n          lastName\n        }\n      }\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n    }\n  }\n": typeof types.UnionDetailDocument,
    "\n  query TreeSources($id: ID!) {\n    tree(id: $id) {\n      id\n      sources {\n        id\n        title\n        author\n        publication\n        repository\n        notes\n      }\n    }\n  }\n": typeof types.TreeSourcesDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n": typeof types.CreatePersonDocument,
    "\n  mutation UpdatePerson($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.UpdatePersonDocument,
    "\n  mutation DeletePerson($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n": typeof types.DeletePersonDocument,
    "\n  mutation CreateUnion($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateUnionDocument,
    "\n  mutation UpdateUnion($id: ID!, $input: UpdateUnionInput!) {\n    updateUnion(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateUnionDocument,
    "\n  mutation DeleteUnion($id: ID!) {\n    deleteUnion(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteUnionDocument,
    "\n  mutation AddUnionPartner($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": typeof types.AddUnionPartnerDocument,
    "\n  mutation RemoveUnionPartner($unionId: ID!, $personId: ID!) {\n    removeUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": typeof types.RemoveUnionPartnerDocument,
    "\n  mutation AddUnionChild($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n": typeof types.AddUnionChildDocument,
    "\n  mutation RemoveUnionChild($unionId: ID!, $personId: ID!) {\n    removeUnionChild(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": typeof types.RemoveUnionChildDocument,
    "\n  mutation SetUnionChildPedigree(\n    $unionId: ID!\n    $personId: ID!\n    $pedigree: Pedigree!\n  ) {\n    setUnionChildPedigree(\n      unionId: $unionId\n      personId: $personId\n      pedigree: $pedigree\n    ) {\n      id\n    }\n  }\n": typeof types.SetUnionChildPedigreeDocument,
    "\n  mutation CreateEvent($input: CreateEventInput!) {\n    createEvent(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEventDocument,
    "\n  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {\n    updateEvent(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEventDocument,
    "\n  mutation DeleteEvent($id: ID!) {\n    deleteEvent(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteEventDocument,
    "\n  mutation CreateSource($input: CreateSourceInput!) {\n    createSource(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateSourceDocument,
    "\n  mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {\n    updateSource(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateSourceDocument,
    "\n  mutation DeleteSource($id: ID!) {\n    deleteSource(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteSourceDocument,
    "\n  mutation CreateCitation($input: CreateCitationInput!) {\n    createCitation(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateCitationDocument,
    "\n  mutation DeleteCitation($id: ID!) {\n    deleteCitation(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteCitationDocument,
    "\n  mutation LinkMedia($input: LinkMediaInput!) {\n    linkMedia(input: $input) {\n      id\n    }\n  }\n": typeof types.LinkMediaDocument,
    "\n  mutation UnlinkMedia($id: ID!) {\n    unlinkMedia(id: $id) {\n      id\n    }\n  }\n": typeof types.UnlinkMediaDocument,
    "\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteMediaDocument,
    "\n  query Trees {\n    trees {\n      id\n      name\n      description\n      createdAt\n      persons {\n        id\n      }\n    }\n  }\n": typeof types.TreesDocument,
    "\n  mutation CreateTree($input: CreateTreeInput!) {\n    createTree(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.CreateTreeDocument,
    "\n  mutation UpdateTree($id: ID!, $input: UpdateTreeInput!) {\n    updateTree(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.UpdateTreeDocument,
    "\n  mutation DeleteTree($id: ID!) {\n    deleteTree(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteTreeDocument,
};
const documents: Documents = {
    "\n  query TreeCanvas($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n      }\n      unions {\n        id\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n": types.TreeCanvasDocument,
    "\n  query PersonDetail($id: ID!) {\n    person(id: $id) {\n      id\n      treeId\n      firstName\n      lastName\n      namePrefix\n      nameSuffix\n      nickname\n      sex\n      notes\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n      media {\n        id\n        type\n        filePath\n        mimeType\n        title\n        links {\n          id\n          personId\n        }\n      }\n      unions {\n        id\n        type\n        notes\n        partners {\n          id\n          firstName\n          lastName\n        }\n        children {\n          personId\n          pedigree\n          person {\n            id\n            firstName\n            lastName\n          }\n        }\n      }\n      parentUnions {\n        id\n        partners {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.PersonDetailDocument,
    "\n  query UnionDetail($id: ID!) {\n    union(id: $id) {\n      id\n      treeId\n      type\n      notes\n      partners {\n        id\n        firstName\n        lastName\n      }\n      children {\n        personId\n        pedigree\n        person {\n          id\n          firstName\n          lastName\n        }\n      }\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n    }\n  }\n": types.UnionDetailDocument,
    "\n  query TreeSources($id: ID!) {\n    tree(id: $id) {\n      id\n      sources {\n        id\n        title\n        author\n        publication\n        repository\n        notes\n      }\n    }\n  }\n": types.TreeSourcesDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n": types.CreatePersonDocument,
    "\n  mutation UpdatePerson($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n": types.UpdatePersonDocument,
    "\n  mutation DeletePerson($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n": types.DeletePersonDocument,
    "\n  mutation CreateUnion($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n": types.CreateUnionDocument,
    "\n  mutation UpdateUnion($id: ID!, $input: UpdateUnionInput!) {\n    updateUnion(id: $id, input: $input) {\n      id\n    }\n  }\n": types.UpdateUnionDocument,
    "\n  mutation DeleteUnion($id: ID!) {\n    deleteUnion(id: $id) {\n      id\n    }\n  }\n": types.DeleteUnionDocument,
    "\n  mutation AddUnionPartner($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": types.AddUnionPartnerDocument,
    "\n  mutation RemoveUnionPartner($unionId: ID!, $personId: ID!) {\n    removeUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": types.RemoveUnionPartnerDocument,
    "\n  mutation AddUnionChild($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n": types.AddUnionChildDocument,
    "\n  mutation RemoveUnionChild($unionId: ID!, $personId: ID!) {\n    removeUnionChild(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n": types.RemoveUnionChildDocument,
    "\n  mutation SetUnionChildPedigree(\n    $unionId: ID!\n    $personId: ID!\n    $pedigree: Pedigree!\n  ) {\n    setUnionChildPedigree(\n      unionId: $unionId\n      personId: $personId\n      pedigree: $pedigree\n    ) {\n      id\n    }\n  }\n": types.SetUnionChildPedigreeDocument,
    "\n  mutation CreateEvent($input: CreateEventInput!) {\n    createEvent(input: $input) {\n      id\n    }\n  }\n": types.CreateEventDocument,
    "\n  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {\n    updateEvent(id: $id, input: $input) {\n      id\n    }\n  }\n": types.UpdateEventDocument,
    "\n  mutation DeleteEvent($id: ID!) {\n    deleteEvent(id: $id) {\n      id\n    }\n  }\n": types.DeleteEventDocument,
    "\n  mutation CreateSource($input: CreateSourceInput!) {\n    createSource(input: $input) {\n      id\n    }\n  }\n": types.CreateSourceDocument,
    "\n  mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {\n    updateSource(id: $id, input: $input) {\n      id\n    }\n  }\n": types.UpdateSourceDocument,
    "\n  mutation DeleteSource($id: ID!) {\n    deleteSource(id: $id) {\n      id\n    }\n  }\n": types.DeleteSourceDocument,
    "\n  mutation CreateCitation($input: CreateCitationInput!) {\n    createCitation(input: $input) {\n      id\n    }\n  }\n": types.CreateCitationDocument,
    "\n  mutation DeleteCitation($id: ID!) {\n    deleteCitation(id: $id) {\n      id\n    }\n  }\n": types.DeleteCitationDocument,
    "\n  mutation LinkMedia($input: LinkMediaInput!) {\n    linkMedia(input: $input) {\n      id\n    }\n  }\n": types.LinkMediaDocument,
    "\n  mutation UnlinkMedia($id: ID!) {\n    unlinkMedia(id: $id) {\n      id\n    }\n  }\n": types.UnlinkMediaDocument,
    "\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      id\n    }\n  }\n": types.DeleteMediaDocument,
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
export function graphql(source: "\n  query TreeCanvas($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n      }\n      unions {\n        id\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TreeCanvas($id: ID!) {\n    tree(id: $id) {\n      id\n      name\n      persons {\n        id\n        firstName\n        lastName\n        sex\n      }\n      unions {\n        id\n        partners {\n          id\n        }\n        children {\n          person {\n            id\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PersonDetail($id: ID!) {\n    person(id: $id) {\n      id\n      treeId\n      firstName\n      lastName\n      namePrefix\n      nameSuffix\n      nickname\n      sex\n      notes\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n      media {\n        id\n        type\n        filePath\n        mimeType\n        title\n        links {\n          id\n          personId\n        }\n      }\n      unions {\n        id\n        type\n        notes\n        partners {\n          id\n          firstName\n          lastName\n        }\n        children {\n          personId\n          pedigree\n          person {\n            id\n            firstName\n            lastName\n          }\n        }\n      }\n      parentUnions {\n        id\n        partners {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query PersonDetail($id: ID!) {\n    person(id: $id) {\n      id\n      treeId\n      firstName\n      lastName\n      namePrefix\n      nameSuffix\n      nickname\n      sex\n      notes\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n      media {\n        id\n        type\n        filePath\n        mimeType\n        title\n        links {\n          id\n          personId\n        }\n      }\n      unions {\n        id\n        type\n        notes\n        partners {\n          id\n          firstName\n          lastName\n        }\n        children {\n          personId\n          pedigree\n          person {\n            id\n            firstName\n            lastName\n          }\n        }\n      }\n      parentUnions {\n        id\n        partners {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UnionDetail($id: ID!) {\n    union(id: $id) {\n      id\n      treeId\n      type\n      notes\n      partners {\n        id\n        firstName\n        lastName\n      }\n      children {\n        personId\n        pedigree\n        person {\n          id\n          firstName\n          lastName\n        }\n      }\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query UnionDetail($id: ID!) {\n    union(id: $id) {\n      id\n      treeId\n      type\n      notes\n      partners {\n        id\n        firstName\n        lastName\n      }\n      children {\n        personId\n        pedigree\n        person {\n          id\n          firstName\n          lastName\n        }\n      }\n      events {\n        id\n        type\n        description\n        dateValue\n        dateSort\n        place\n        notes\n        citations {\n          id\n          page\n          quality\n          source {\n            id\n            title\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TreeSources($id: ID!) {\n    tree(id: $id) {\n      id\n      sources {\n        id\n        title\n        author\n        publication\n        repository\n        notes\n      }\n    }\n  }\n"): (typeof documents)["\n  query TreeSources($id: ID!) {\n    tree(id: $id) {\n      id\n      sources {\n        id\n        title\n        author\n        publication\n        repository\n        notes\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePerson($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePerson($id: ID!, $input: UpdatePersonInput!) {\n    updatePerson(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePerson($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeletePerson($id: ID!) {\n    deletePerson(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUnion($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUnion($input: CreateUnionInput!) {\n    createUnion(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUnion($id: ID!, $input: UpdateUnionInput!) {\n    updateUnion(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUnion($id: ID!, $input: UpdateUnionInput!) {\n    updateUnion(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteUnion($id: ID!) {\n    deleteUnion(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteUnion($id: ID!) {\n    deleteUnion(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddUnionPartner($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddUnionPartner($unionId: ID!, $personId: ID!) {\n    addUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveUnionPartner($unionId: ID!, $personId: ID!) {\n    removeUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveUnionPartner($unionId: ID!, $personId: ID!) {\n    removeUnionPartner(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddUnionChild($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddUnionChild($input: UnionChildInput!) {\n    addUnionChild(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveUnionChild($unionId: ID!, $personId: ID!) {\n    removeUnionChild(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveUnionChild($unionId: ID!, $personId: ID!) {\n    removeUnionChild(unionId: $unionId, personId: $personId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetUnionChildPedigree(\n    $unionId: ID!\n    $personId: ID!\n    $pedigree: Pedigree!\n  ) {\n    setUnionChildPedigree(\n      unionId: $unionId\n      personId: $personId\n      pedigree: $pedigree\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation SetUnionChildPedigree(\n    $unionId: ID!\n    $personId: ID!\n    $pedigree: Pedigree!\n  ) {\n    setUnionChildPedigree(\n      unionId: $unionId\n      personId: $personId\n      pedigree: $pedigree\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEvent($input: CreateEventInput!) {\n    createEvent(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEvent($input: CreateEventInput!) {\n    createEvent(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {\n    updateEvent(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {\n    updateEvent(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEvent($id: ID!) {\n    deleteEvent(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteEvent($id: ID!) {\n    deleteEvent(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSource($input: CreateSourceInput!) {\n    createSource(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSource($input: CreateSourceInput!) {\n    createSource(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {\n    updateSource(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {\n    updateSource(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteSource($id: ID!) {\n    deleteSource(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteSource($id: ID!) {\n    deleteSource(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCitation($input: CreateCitationInput!) {\n    createCitation(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCitation($input: CreateCitationInput!) {\n    createCitation(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCitation($id: ID!) {\n    deleteCitation(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteCitation($id: ID!) {\n    deleteCitation(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LinkMedia($input: LinkMediaInput!) {\n    linkMedia(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation LinkMedia($input: LinkMediaInput!) {\n    linkMedia(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnlinkMedia($id: ID!) {\n    unlinkMedia(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UnlinkMedia($id: ID!) {\n    unlinkMedia(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      id\n    }\n  }\n"];
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