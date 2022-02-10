import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RolesAppState } from "./models"
import * as subgraph from "../../services/subgraph"

const rolesAppInitialState: RolesAppState = {
  roles: [],
  rolesModifierAddress: "",
  transactions: [],
  transactionPending: false,
  transactionError: "",
}

export const rolesAppSlice = createSlice({
  name: "roles",
  initialState: rolesAppInitialState,
  reducers: {
    setRolesModifierAddress(state, action: PayloadAction<string>) {
      state.rolesModifierAddress = action.payload
    },
    resetTransactionError(state) {
      state.transactionError = ""
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRoles.fulfilled, (state, action) => {
      state.roles = action.payload
    })
  },
})

export const { setRolesModifierAddress, resetTransactionError } = rolesAppSlice.actions

export const fetchRoles = createAsyncThunk("roles/fetchRoles", (address: string) => {
  return subgraph.fetchRoles(address)
})
