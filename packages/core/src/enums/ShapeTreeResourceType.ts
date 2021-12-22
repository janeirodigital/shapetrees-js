// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.enums
// import { ShapeTreeVocabulary } from '../vocabularies/ShapeTreeVocabulary';
// waiting on https://github.com/microsoft/TypeScript/issues/40793 to leverage ShapeTreeVocabulary

export enum ShapeTreeResourceType {

  CONTAINER = "http://www.w3.org/ns/shapetrees#CONTAINER", // ShapeTreeVocabulary.CONTAINER,
  RESOURCE = "http://www.w3.org/ns/shapetrees#RESOURCE", // ShapeTreeVocabulary.RESOURCE,
  NON_RDF = "http://www.w3.org/ns/shapetrees#NonRDFResource", // ShapeTreeVocabulary.NON_RDF_RESOURCE,
}
