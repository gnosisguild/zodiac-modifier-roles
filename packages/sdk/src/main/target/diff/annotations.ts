import { Annotation } from "zodiac-roles-deployments"

import { groupBy } from "../../groupBy"

import { Diff } from "./helpers"

export function diffAnnotations({
  roleKey,
  prev = [],
  next = [],
}: {
  roleKey: `0x${string}`
  prev?: Annotation[]
  next?: Annotation[]
}): Diff {
  const removeAnnotations = prev
    .map((annotation) => annotation.uri)
    .filter((uri) => !next.some((nextAnnotation) => nextAnnotation.uri === uri))

  const addAnnotations = groupAnnotations(
    next.filter(
      (annotation) =>
        !prev.some(
          (currentAnnotation) =>
            currentAnnotation.uri === annotation.uri &&
            currentAnnotation.schema === annotation.schema
        )
    )
  )

  return {
    minus:
      removeAnnotations.length > 0
        ? [
            {
              call: "postAnnotations",
              roleKey,
              body: { removeAnnotations },
            },
          ]
        : [],
    plus:
      addAnnotations.length > 0
        ? [
            {
              call: "postAnnotations",
              roleKey,
              body: { addAnnotations },
            },
          ]
        : [],
  }
}

const groupAnnotations = (annotations: readonly Annotation[]) =>
  Object.entries(groupBy(annotations, (annotation) => annotation.schema)).map(
    ([schema, annotations]) => ({
      schema,
      uris: annotations.map((annotation) => annotation.uri),
    })
  )
