import { invariant } from "@epic-web/invariant"
import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community"
import { Row } from "./types"

/** Renders (nested) array elements as a lists. */
export class ArrayElementsRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLOListElement

  init(params: ICellRendererParams) {
    this.eGui = document.createElement("ol")
    this.eGui.setAttribute("start", "0")
    params.getValue
    invariant(Array.isArray(params.value), "Expected array")
    const items = params.value.map((item: any) => `<li>${item}</li>`)
    this.eGui.innerHTML = items.join("")
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    return false
  }
}

/** Renders array indices as a list, respecting the span of each element. */
export class ArrayIndicesRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLOListElement

  init(params: ICellRendererParams) {
    this.eGui = document.createElement("ol")
    this.eGui.setAttribute("start", "0")
    params.data.invariant(Array.isArray(params.value), "Expected array")
    const items = params.value.map((item: any) => `<li>${item}</li>`)
    this.eGui.innerHTML = items.join("")
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    return false
  }
}
