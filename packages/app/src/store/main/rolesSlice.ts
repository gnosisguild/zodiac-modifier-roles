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
    builder.addCase(addRoleMember.fulfilled, (state, action) => {
      state.transactionPending = false
      state.transactions.push(action.payload)
    })
    builder.addCase(addRoleMember.pending, (state, action) => {
      state.transactionPending = true
    })
    builder.addCase(addRoleMember.rejected, (state, action) => {
      state.transactionPending = false
      if (action.error != null && action.error.message != null) {
        state.transactionError = action.error.message
      } else {
        state.transactionError = "An unknown error occurred"
      }
    })
    builder.addCase(removeRoleMember.fulfilled, (state, action) => {
      state.transactionPending = false
      state.transactions.push(action.payload)
    })
    builder.addCase(removeRoleMember.pending, (state, action) => {
      state.transactionPending = true
    })
    builder.addCase(removeRoleMember.rejected, (state, action) => {
      state.transactionPending = false
      if (action.error != null && action.error.message != null) {
        state.transactionError = action.error.message
      } else {
        state.transactionError = "An unknown error occurred"
      }
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

export const addRoleMember = createAsyncThunk(
  "roles/addRoleMember",
  async (
    {
      roleId,
      memberAddress,
      provider,
    }: { roleId: string; memberAddress: string; provider: ethers.providers.JsonRpcProvider },
    thunkAPI,
  ) => {
    const state = thunkAPI.getState() as RootState
    const rolesModifierAddress = state.rolesApp.rolesModifierAddress

    if (rolesModifierAddress && ethers.utils.isAddress(rolesModifierAddress)) {
      const tx = await rolesModifierContract.addMember(provider, rolesModifierAddress, roleId, memberAddress)
      return tx
    }
  },
)

export const removeRoleMember = createAsyncThunk(
  "roles/removeRoleMember",
  async (
    {
      roleId,
      memberAddress,
      provider,
    }: { roleId: string; memberAddress: string; provider: ethers.providers.JsonRpcProvider },
    thunkAPI,
  ) => {
    const state = thunkAPI.getState() as RootState
    const rolesModifierAddress = state.rolesApp.rolesModifierAddress

    if (rolesModifierAddress && ethers.utils.isAddress(rolesModifierAddress)) {
      const tx = await rolesModifierContract.removeMember(provider, rolesModifierAddress, roleId, memberAddress)
      return tx
    }
  },
)
