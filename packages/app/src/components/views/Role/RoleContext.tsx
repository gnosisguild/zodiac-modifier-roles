import React, { PropsWithChildren, Reducer, useEffect, useMemo, useReducer } from "react"
import { FuncParams, Role, Target } from "../../../typings/role"
import { getRoleId } from "./RoleMenu"
import { useRootSelector } from "../../../store"
import { getRoles } from "../../../store/main/selectors"

export interface RoleContextState {
  id: string
  activeTarget?: string
  role?: Role
  members: {
    list: string[]
    add: string[]
    remove: string[]
  }
  targets: {
    list: Target[]
    add: Target[]
    remove: string[]
  }

  getActiveRole(): Target
}

enum RoleActionType {
  ADD_MEMBER,
  ADD_TARGET,
  REMOVE_MEMBER,
  REMOVE_TARGET,
  SET_ACTIVE_TARGET,
  SET_FUNC_PARAMS,
  RESET_STATE,
}

interface RoleAction {
  type: RoleActionType
  payload: any
}

type RemoveTargetPayload = { target: Target; remove?: boolean }

type RemoveMemberPayload = { member: string; remove?: boolean }

type SetFuncParamsPayload = { targetId: string; funcParams: FuncParams }

function handleRemoveTarget(state: RoleContextState, payload: RemoveTargetPayload): RoleContextState {
  const { target, remove = true } = payload

  if (state.activeTarget === target.id) {
    return handleRemoveTarget({ ...state, activeTarget: undefined }, payload)
  }

  if (!remove) {
    // Remove from delete queue
    return {
      ...state,
      targets: { ...state.targets, remove: state.targets.remove.filter((_target) => _target !== target.address) },
    }
  }
  if (state.targets.add.find((_target) => _target.address === target.address)) {
    return {
      ...state,
      targets: { ...state.targets, add: state.targets.add.filter((_target) => _target.address !== target.address) },
    }
  }
  if (state.targets.remove.includes(target.address)) {
    // Already in queue
    return state
  }

  return { ...state, targets: { ...state.targets, remove: [...state.targets.remove, target.address] } }
}

function handleAddTarget(state: RoleContextState, target: Target): RoleContextState {
  const currentTarget =
    state.targets.add.find((_target) => target.address.toLowerCase() === _target.address.toLowerCase()) ||
    state.targets.list.find((_target) => target.address.toLowerCase() === _target.address.toLowerCase())
  if (currentTarget) {
    return { ...state, activeTarget: currentTarget.id }
  }
  return {
    ...state,
    activeTarget: target.id,
    targets: { ...state.targets, add: [...state.targets.add, { ...target, address: target.address.toLowerCase() }] },
  }
}

const handleRemoveMember = (state: RoleContextState, payload: RemoveMemberPayload): RoleContextState => {
  const { member, remove = true } = payload
  if (!remove) {
    // Remove from delete queue
    return {
      ...state,
      members: { ...state.members, remove: state.members.remove.filter((_member) => _member !== member) },
    }
  }
  if (state.members.add.includes(member)) {
    return {
      ...state,
      members: { ...state.members, add: state.members.add.filter((_member) => _member !== member) },
    }
  }
  if (state.members.remove.includes(member)) {
    // Already in queue
    return state
  }
  return { ...state, members: { ...state.members, remove: [...state.members.remove, member] } }
}

function handleFuncParams(state: RoleContextState, payload: SetFuncParamsPayload): RoleContextState {
  const replaceValue = (targets: Target[]) => {
    return targets.map((target) => {
      if (target.id === payload.targetId) {
        return { ...target, funcParams: payload.funcParams }
      }
      return target
    })
  }

  if (state.targets.list.find((target) => target.id === payload.targetId)) {
    return { ...state, targets: { ...state.targets, list: replaceValue(state.targets.list) } }
  }
  return { ...state, targets: { ...state.targets, add: replaceValue(state.targets.add) } }
}

function handleAddMember(state: RoleContextState, payload: string): RoleContextState {
  if (state.members.add.includes(payload.toLowerCase()) || state.members.list.includes(payload.toLowerCase())) {
    return state
  }
  return { ...state, members: { ...state.members, add: [...state.members.add, payload.toLowerCase()] } }
}

const roleReducer: Reducer<RoleContextState, RoleAction> = (state, action) => {
  switch (action.type) {
    case RoleActionType.ADD_MEMBER:
      return handleAddMember(state, action.payload)
    case RoleActionType.ADD_TARGET:
      return handleAddTarget(state, action.payload)
    case RoleActionType.REMOVE_TARGET:
      return handleRemoveTarget(state, action.payload)
    case RoleActionType.REMOVE_MEMBER:
      return handleRemoveMember(state, action.payload)
    case RoleActionType.SET_ACTIVE_TARGET:
      return { ...state, activeTarget: action.payload }
    case RoleActionType.SET_FUNC_PARAMS:
      return handleFuncParams(state, action.payload)
    case RoleActionType.RESET_STATE:
      return initReducerState(action.payload)
  }
}

interface RoleContextWrapProps {
  id: string
  role?: Role
}

interface RoleContextValue {
  state: RoleContextState

  addMember(payload: string): void

  setActiveTarget(payload: string): void

  addTarget(payload: Target): void

  removeMember(payload: RemoveMemberPayload): void

  removeTarget(payload: RemoveTargetPayload): void

  setFuncParams(payload: SetFuncParamsPayload): void

  reset(payload: RoleContextWrapProps): void
}

export const RoleContext = React.createContext<RoleContextValue>({
  state: {
    id: "",
    targets: { add: [], remove: [], list: [] },
    members: { add: [], remove: [], list: [] },
    getActiveRole: (): Target => ({} as Target),
  },
  addTarget() {},
  removeMember() {},
  removeTarget() {},
  addMember() {},
  setActiveTarget() {},
  setFuncParams() {},
  reset() {},
})

function initReducerState({ id, role }: RoleContextWrapProps): RoleContextState {
  return {
    id,
    role,
    members: {
      list: role?.members.map((member) => member.address) || [],
      add: [],
      remove: [],
    },
    targets: {
      list: role?.targets || [],
      add: [
        // {
        //   id: "0xd4A53dc48E991277fF15416ce3d702f02A6A8A8f",
        //   address: "0xd4A53dc48E991277fF15416ce3d702f02A6A8A8f",
        //   executionOptions: ExecutionOption.BOTH,
        // },
      ],
      remove: [],
    },
    getActiveRole(): Target {
      const inList = this.targets.list.find((target) => target.id === this.activeTarget)
      if (inList) {
        return inList
      }
      return this.targets.add.find((target) => target.id === this.activeTarget) as Target
    },
  }
}

export const RoleContextWrap = ({ id, role, children }: PropsWithChildren<RoleContextWrapProps>) => {
  const roles = useRootSelector(getRoles)

  const [state, dispatch] = useReducer(roleReducer, { id: getRoleId(id, roles), role }, initReducerState)

  const methods = useMemo((): Omit<RoleContextValue, "state"> => {
    return {
      addMember(payload: string) {
        return dispatch({ type: RoleActionType.ADD_MEMBER, payload })
      },
      addTarget(payload: Target) {
        return dispatch({ type: RoleActionType.ADD_TARGET, payload })
      },
      removeMember(payload: RemoveMemberPayload) {
        return dispatch({ type: RoleActionType.REMOVE_MEMBER, payload })
      },
      removeTarget(payload: RemoveTargetPayload) {
        return dispatch({ type: RoleActionType.REMOVE_TARGET, payload })
      },
      setActiveTarget(payload: string) {
        return dispatch({ type: RoleActionType.SET_ACTIVE_TARGET, payload })
      },
      setFuncParams(payload: SetFuncParamsPayload) {
        return dispatch({ type: RoleActionType.SET_FUNC_PARAMS, payload })
      },
      reset(payload: RoleContextWrapProps) {
        return dispatch({ type: RoleActionType.RESET_STATE, payload })
      },
    }
  }, [dispatch])

  useEffect(() => {
    methods.reset({ role, id: getRoleId(id, roles) })
  }, [id, methods, role, roles])

  const value: RoleContextValue = {
    state,
    ...methods,
  }
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
