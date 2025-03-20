import { _HeaderComp, type IHeaderParams } from "ag-grid-community"
import { createRoot } from "react-dom/client"
import ColumnScoping from "./ColumnScoping"

export type CustomHeaderParams = IHeaderParams & {
  isWildcarded: boolean
  noScoping?: boolean
  disableScoping?: boolean
  scopingLabel?: string
}

export class CustomHeader extends _HeaderComp {
  init(params: CustomHeaderParams) {
    super.init({ ...params, template })
    const el = this.getGui().querySelector(".agx-header-cell-scoping")
    if (!el) throw new Error("agx-header-cell-scoping not found")
    const root = createRoot(el)

    if (params.noScoping) return

    const { field } = params.column.getColDef()
    if (!field) throw new Error("field required to render scoping")
    root.render(
      <ColumnScoping
        label={params.scopingLabel ?? "allow any"}
        isWildcarded={params.isWildcarded}
        disabled={params.disableScoping}
        onChange={(isWildcarded) =>
          params.context.onWildcardToggle(field, isWildcarded)
        }
      />
    )
  }

  refresh(params: CustomHeaderParams) {
    return super.refresh({ ...params, template })
  }
}

const template = `<div class="agx-header-cell-wrapper">
    <div class="ag-cell-label-container" role="presentation">
      <span data-ref="eMenu" class="ag-header-icon ag-header-cell-menu-button" aria-hidden="true"></span>
      <span data-ref="eFilterButton" class="ag-header-icon ag-header-cell-filter-button" aria-hidden="true"></span>
      <div data-ref="eLabel" class="ag-header-cell-label" role="presentation">
        <span data-ref="eText" class="ag-header-cell-text"></span>
        <span data-ref="eFilter" class="ag-header-icon ag-header-label-icon ag-filter-icon" aria-hidden="true"></span>
        <ag-sort-indicator data-ref="eSortIndicator"></ag-sort-indicator>
      </div>
    </div>
    <div class="agx-header-cell-scoping"></div>
  </div>`
