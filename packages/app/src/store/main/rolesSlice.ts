import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RolesAppState } from "./models"
import * as subgraph from "../../services/subgraph"
import { Network } from "../../utils/networks"

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
    setTransactionPending(state, action: PayloadAction<boolean>) {
      state.transactionPending = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRoles.fulfilled, (state, action) => {
      state.roles = action.payload
    })
  },
})

export const { setRolesModifierAddress, setTransactionPending, resetTransactionError } = rolesAppSlice.actions

export const fetchRoles = createAsyncThunk(
  "roles/fetchRoles",
  ({ network, address }: { network: Network; address: string }) => {
    return subgraph.fetchRoles(network, address)
  },
)
