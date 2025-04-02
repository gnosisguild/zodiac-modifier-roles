import { it, suite, expect } from "vitest"
import { diffAnnotations } from "./annotations"

suite("diffAnnotation", () => {
  it("returns empty diff", () => {
    const { minus, plus } = diffAnnotations({ roleKey: "0x01" })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(0)
  })

  it.todo("returns add annotations as plus")

  it.todo("returns remove annotations as minus")
})
