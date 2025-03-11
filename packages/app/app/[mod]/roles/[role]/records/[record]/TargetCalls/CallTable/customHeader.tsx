import { _HeaderComp, type IHeaderParams } from "ag-grid-community"

export interface ICustomHeaderParams {
  menuIcon: string
}

export class CustomHeader extends _HeaderComp {
  init(params: IHeaderParams) {
    super.init({ ...params, template })
  }

  refresh(params: IHeaderParams) {
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
    <div class="agx-header-cell-scoping"><button>ok</button></div>
  </div>`
