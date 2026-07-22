import { graphql } from '../../generated';

// Lean query feeding the 2D canvas (re-fetched on every mutation)
export const TREE_CANVAS = graphql(`
  query TreeCanvas($id: ID!) {
    tree(id: $id) {
      id
      name
      persons {
        id
        firstName
        lastName
        sex
        photoMediaId
        birthDate
        deceased
      }
      unions {
        id
        partners {
          id
        }
        children {
          person {
            id
          }
        }
      }
    }
  }
`);

// Full detail of one person, loaded when selected
export const PERSON_DETAIL = graphql(`
  query PersonDetail($id: ID!) {
    person(id: $id) {
      id
      treeId
      firstName
      lastName
      namePrefix
      nameSuffix
      nickname
      sex
      notes
      photoMediaId
      events {
        id
        type
        description
        dateValue
        dateSort
        place
        notes
        citations {
          id
          page
          quality
          source {
            id
            title
          }
        }
      }
      media {
        id
        type
        filePath
        mimeType
        title
        links {
          id
          personId
        }
      }
      unions {
        id
        type
        notes
        partners {
          id
          firstName
          lastName
        }
        children {
          personId
          pedigree
          person {
            id
            firstName
            lastName
          }
        }
      }
      parentUnions {
        id
        partners {
          id
          firstName
          lastName
        }
      }
    }
  }
`);

export const UNION_DETAIL = graphql(`
  query UnionDetail($id: ID!) {
    union(id: $id) {
      id
      treeId
      type
      notes
      partners {
        id
        firstName
        lastName
      }
      children {
        personId
        pedigree
        person {
          id
          firstName
          lastName
        }
      }
      events {
        id
        type
        description
        dateValue
        dateSort
        place
        notes
        citations {
          id
          page
          quality
          source {
            id
            title
          }
        }
      }
    }
  }
`);

export const TREE_SOURCES = graphql(`
  query TreeSources($id: ID!) {
    tree(id: $id) {
      id
      sources {
        id
        title
        author
        publication
        repository
        notes
      }
    }
  }
`);

// ------------------------------------------------------------------ persons
export const CREATE_PERSON = graphql(`
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      id
    }
  }
`);
export const UPDATE_PERSON = graphql(`
  mutation UpdatePerson($id: ID!, $input: UpdatePersonInput!) {
    updatePerson(id: $id, input: $input) {
      id
    }
  }
`);
export const DELETE_PERSON = graphql(`
  mutation DeletePerson($id: ID!) {
    deletePerson(id: $id) {
      id
    }
  }
`);

// ------------------------------------------------------------------ unions
export const CREATE_UNION = graphql(`
  mutation CreateUnion($input: CreateUnionInput!) {
    createUnion(input: $input) {
      id
    }
  }
`);
export const UPDATE_UNION = graphql(`
  mutation UpdateUnion($id: ID!, $input: UpdateUnionInput!) {
    updateUnion(id: $id, input: $input) {
      id
    }
  }
`);
export const DELETE_UNION = graphql(`
  mutation DeleteUnion($id: ID!) {
    deleteUnion(id: $id) {
      id
    }
  }
`);
export const ADD_PARTNER = graphql(`
  mutation AddUnionPartner($unionId: ID!, $personId: ID!) {
    addUnionPartner(unionId: $unionId, personId: $personId) {
      id
    }
  }
`);
export const REMOVE_PARTNER = graphql(`
  mutation RemoveUnionPartner($unionId: ID!, $personId: ID!) {
    removeUnionPartner(unionId: $unionId, personId: $personId) {
      id
    }
  }
`);
export const ADD_CHILD = graphql(`
  mutation AddUnionChild($input: UnionChildInput!) {
    addUnionChild(input: $input) {
      id
    }
  }
`);
export const REMOVE_CHILD = graphql(`
  mutation RemoveUnionChild($unionId: ID!, $personId: ID!) {
    removeUnionChild(unionId: $unionId, personId: $personId) {
      id
    }
  }
`);
export const SET_PEDIGREE = graphql(`
  mutation SetUnionChildPedigree(
    $unionId: ID!
    $personId: ID!
    $pedigree: Pedigree!
  ) {
    setUnionChildPedigree(
      unionId: $unionId
      personId: $personId
      pedigree: $pedigree
    ) {
      id
    }
  }
`);

// ------------------------------------------------------------------ events
export const CREATE_EVENT = graphql(`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
    }
  }
`);
export const UPDATE_EVENT = graphql(`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
    }
  }
`);
export const DELETE_EVENT = graphql(`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      id
    }
  }
`);

// ------------------------------------------------------------------ sources
export const CREATE_SOURCE = graphql(`
  mutation CreateSource($input: CreateSourceInput!) {
    createSource(input: $input) {
      id
    }
  }
`);
export const UPDATE_SOURCE = graphql(`
  mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {
    updateSource(id: $id, input: $input) {
      id
    }
  }
`);
export const DELETE_SOURCE = graphql(`
  mutation DeleteSource($id: ID!) {
    deleteSource(id: $id) {
      id
    }
  }
`);

// ------------------------------------------------------------------ citations
export const CREATE_CITATION = graphql(`
  mutation CreateCitation($input: CreateCitationInput!) {
    createCitation(input: $input) {
      id
    }
  }
`);
export const DELETE_CITATION = graphql(`
  mutation DeleteCitation($id: ID!) {
    deleteCitation(id: $id) {
      id
    }
  }
`);

// ------------------------------------------------------------------ media
export const LINK_MEDIA = graphql(`
  mutation LinkMedia($input: LinkMediaInput!) {
    linkMedia(input: $input) {
      id
    }
  }
`);
export const UNLINK_MEDIA = graphql(`
  mutation UnlinkMedia($id: ID!) {
    unlinkMedia(id: $id) {
      id
    }
  }
`);
export const DELETE_MEDIA = graphql(`
  mutation DeleteMedia($id: ID!) {
    deleteMedia(id: $id) {
      id
    }
  }
`);
