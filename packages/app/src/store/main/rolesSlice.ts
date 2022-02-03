import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RolesAppState } from "./models"
import * as subgraph from "../../services/subgraph"
import { RootState } from ".."
import { ethers } from "ethers"
import * as rolesModifierContract from "../../services/rolesModifierContract"

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

export const fetchRoles = createAsyncThunk("roles/fetchRoles", async (_, thunkAPI) => {
  const state = thunkAPI.getState() as RootState
  const rolesModifierAddress = state.rolesApp.rolesModifierAddress
  if (rolesModifierAddress && ethers.utils.isAddress(rolesModifierAddress)) {
    return await subgraph.fetchRoles(rolesModifierAddress)
  } else {
    return []
  }
})
