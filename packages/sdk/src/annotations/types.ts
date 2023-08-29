export interface UpdateAnnotationsPost {
  addAnnotations?: {
    uris: string[]
    schema: string
  }[]
  removeAnnotations?: string[] // referenced by `uri` field
}
