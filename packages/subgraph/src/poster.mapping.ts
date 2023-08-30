import { Address, Bytes, json, JSONValueKind, log, store } from "@graphprotocol/graph-ts"
import { NewPost } from "../generated/Poster/Poster"
import { getAnnotationId, getOrCreateAnnotation, getRoleId, getRolesModifier, getRolesModifierId } from "./helpers"

export function handleNewPost(event: NewPost): void {
  const tagParts = event.params.tag.toString().split("-")
  if (tagParts.length != 2) return

  const modifierAddress = Address.fromString(tagParts[0])
  const roleKey = Bytes.fromUTF8(tagParts[1])

  const rolesModifierId = getRolesModifierId(modifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  if (!rolesModifier.owner.equals(event.params.user)) {
    log.warning("RolesModifier {} is not owned by {}, annotation update post will be ignored", [
      rolesModifierId,
      event.params.user.toHexString(),
    ])
    return
  }

  const roleId = getRoleId(rolesModifierId, roleKey)

  const parsedJson = json.try_fromString(event.params.content)
  if (parsedJson.isError || parsedJson.value.kind != JSONValueKind.OBJECT) {
    log.warning("Failed to parse update annotation post: {}", [event.params.content])
    return
  }
  const parsedPost = parsedJson.value.toObject()
  const removeAnnotationsEntries =
    parsedPost.get("removeAnnotations") && parsedPost.get("removeAnnotations")!.kind == JSONValueKind.ARRAY
      ? parsedPost.get("removeAnnotations")!.toArray()
      : []
  const addAnnotationsEntries =
    parsedPost.get("addAnnotations") && parsedPost.get("addAnnotations")!.kind == JSONValueKind.ARRAY
      ? parsedPost.get("addAnnotations")!.toArray()
      : []

  for (let i = 0; i < removeAnnotationsEntries.length; i++) {
    const uri = removeAnnotationsEntries[i]
    if (uri.kind != JSONValueKind.STRING) {
      log.warning("Failed to parse uri of update annotation post remove entry #{}", [i.toString()])
      continue
    }
    const id = getAnnotationId(uri.toString(), roleId)
    store.remove("Annotation", id)
    log.info("Annotation #{} has been removed", [id])
  }

  for (let i = 0; i < addAnnotationsEntries.length; i++) {
    const entry = addAnnotationsEntries[i]
    if (entry.kind != JSONValueKind.OBJECT) {
      log.warning("Failed to parse update annotation post add entry #{}", [i.toString()])
      continue
    }
    const uris = addAnnotationsEntries[i].toObject().get("uris")
    const schema = addAnnotationsEntries[i].toObject().get("schema")
    if (!uris || uris.kind != JSONValueKind.ARRAY || !schema || schema.kind != JSONValueKind.STRING) {
      log.warning("Failed to parse update annotation post add entry #{}", [i.toString()])
      continue
    }

    const urisEntries = uris.toArray()
    for (let j = 0; j < urisEntries.length; j++) {
      const uriEntry = urisEntries[j]
      if (uriEntry.kind != JSONValueKind.STRING) {
        log.warning("Failed to parse uris of update annotation post add entry #{}", [i.toString()])
        continue
      }
      const annotation = getOrCreateAnnotation(uriEntry.toString(), roleId)
      annotation.schema = schema.toString()
      annotation.save()
      log.info("Annotation #{} has been added", [annotation.id])
    }
  }
}
