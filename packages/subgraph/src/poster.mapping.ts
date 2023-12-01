import { Address, Bytes, json, JSONValueKind, log, store } from "@graphprotocol/graph-ts"
import { NewPost } from "../generated/Poster/Poster"
import { getAnnotationId, getOrCreateAnnotation, getRoleId, getRolesModifier, getRolesModifierId } from "./helpers"

export function handleNewPost(event: NewPost): void {
  // only listen for events with the tag keccak256("ROLES_PERMISSION_ANNOTATION")
  if (event.params.tag.toHexString() != "0xf8dcb30866f5e03a8ceb94d3a8bddff9952a5180ed69685773549bf21c526a1b") return

  const parsedJson = json.try_fromString(event.params.content)
  if (parsedJson.isError || parsedJson.value.kind != JSONValueKind.OBJECT) {
    log.warning("Failed to parse update annotation post: {}", [event.params.content])
    return
  }
  const parsedPost = parsedJson.value.toObject()

  const modifierAddress =
    parsedPost.get("rolesMod") && parsedPost.get("rolesMod")!.kind == JSONValueKind.STRING
      ? Address.fromString(parsedPost.get("rolesMod")!.toString())
      : null
  const roleKey =
    parsedPost.get("roleKey") && parsedPost.get("roleKey")!.kind == JSONValueKind.STRING
      ? Bytes.fromHexString(parsedPost.get("roleKey")!.toString())
      : null

  if (!modifierAddress || !roleKey) {
    log.warning("Invalid update annotation post: {}", [event.params.content])
    return
  }

  const rolesModifierId = getRolesModifierId(modifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.warning("RolesModifier #{} not found", [rolesModifierId])
    return
  }

  if (!rolesModifier.owner.equals(event.params.user)) {
    log.warning("RolesModifier #{} is not owned by {} but by {}", [
      rolesModifierId,
      event.params.user.toHexString(),
      rolesModifier.owner.toHexString(),
    ])
    return
  }

  const roleId = getRoleId(rolesModifierId, roleKey)

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
      const annotation = getOrCreateAnnotation(uriEntry.toString(), schema.toString(), roleId)
      log.info("Annotation #{} has been added", [annotation.id])
    }
  }
}
