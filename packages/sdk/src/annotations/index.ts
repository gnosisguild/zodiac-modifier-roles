import { fetchRole } from "../fetchRole"
import { ChainId, Annotation } from "../types"
import { groupBy } from "../utils/groupBy"

import { encodePost } from "./poster"
import { UpdateAnnotationsPost } from "./types"

type Options = {
  address: string
  /**  The mode to use for updating the set of members of the role:
   *  - "replace": The role will have only the passed members, meaning that all other current members will be removed from the role
   *  - "extend": The role will keep its current members and will additionally get the passed members
   *  - "remove": All passed members will be removed from the role
   */
  mode: "replace" | "extend" | "remove"
} & (
  | {
      currentAnnotations: Annotation[]
    }
  | { chainId: ChainId }
)

export const applyAnnotations = async (
  roleKey: string,
  annotations: Annotation[],
  options: Options
) => {
  const { address, mode } = options

  let currentAnnotations =
    "currentAnnotations" in options && options.currentAnnotations

  if (!currentAnnotations) {
    if ("chainId" in options && options.chainId) {
      const role = await fetchRole({
        chainId: options.chainId,
        address: address,
        roleKey,
      })
      if (!role) {
        throw new Error(`Role ${roleKey} not found on chain ${options.chainId}`)
      }
      currentAnnotations = role.annotations
    } else {
      throw new Error(
        "Either `currentAnnotations` or `chainId` must be specified"
      )
    }
  }

  let updatePost: UpdateAnnotationsPost
  switch (mode) {
    case "replace":
      updatePost = replaceAnnotations(currentAnnotations, annotations)
      break
    case "extend":
      updatePost = extendAnnotations(currentAnnotations, annotations)
      break
    case "remove":
      updatePost = removeAnnotations(currentAnnotations, annotations)
      break
    default:
      throw new Error(`Invalid mode: ${options.mode}`)
  }

  return isEmptyPost(updatePost)
    ? []
    : [
        encodePost(
          JSON.stringify({
            rolesMod: address,
            roleKey,
            ...updatePost,
          })
        ),
      ]
}

const replaceAnnotations = (
  current: Annotation[],
  next: Annotation[]
): UpdateAnnotationsPost => {
  const removeAnnotations = current
    .map((annotation) => annotation.uri)
    .filter((uri) => !next.some((nextAnnotation) => nextAnnotation.uri === uri))

  const toAdd = next.filter(
    (annotation) =>
      !current.some(
        (currentAnnotation) =>
          currentAnnotation.uri === annotation.uri &&
          currentAnnotation.schema === annotation.schema
      )
  )

  return {
    removeAnnotations,
    addAnnotations: groupAnnotations(toAdd),
  }
}

const extendAnnotations = (
  current: Annotation[],
  add: Annotation[]
): UpdateAnnotationsPost => {
  const toAdd = add.filter(
    ({ uri, schema }) =>
      !current.some(
        (annotation) => annotation.uri === uri && annotation.schema === schema
      )
  )
  return {
    addAnnotations: groupAnnotations(toAdd),
  }
}

const removeAnnotations = (
  current: Annotation[],
  remove: Annotation[]
): UpdateAnnotationsPost => {
  return {
    removeAnnotations: remove
      .map((annotation) => annotation.uri)
      .filter((uri) => current.some((annotation) => annotation.uri === uri)),
  }
}

const groupAnnotations = (annotations: Annotation[]) =>
  Object.entries(groupBy(annotations, (annotation) => annotation.schema)).map(
    ([schema, annotations]) => ({
      schema,
      uris: annotations.map((annotation) => annotation.uri),
    })
  )

const isEmptyPost = (post: UpdateAnnotationsPost) =>
  (!post.addAnnotations || post.addAnnotations.length === 0) &&
  (!post.removeAnnotations || post.removeAnnotations.length === 0)
