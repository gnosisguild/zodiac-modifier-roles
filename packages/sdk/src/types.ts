import { BigNumber } from "ethers"

import SUBGRAPH from "./subgraph"

export type NetworkId = keyof typeof SUBGRAPH

export enum ExecutionOptions {
  None = 0,
  Send = 1,
  DelegateCall = 2,
  Both = 3,
}

export enum Clearance {
  None = 0,
  Target = 1,
  Function = 2,
}

export enum ParameterType {
  None = 0,
  Static = 1,
  Dynamic = 2,
  Tuple = 3,
  Array = 4,
  AbiEncoded = 5,
}

export enum Operator {
  // 00:    EMPTY EXPRESSION (default, always passes)
  //          paramType: Static / Dynamic / Tuple / Array
  //          ❓ children (only for paramType: Tuple / Array to describe their structure)
  //          🚫 compValue
  Pass = 0,
  // ------------------------------------------------------------
  // 01-04: LOGICAL EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  And = 1,
  Or = 2,
  Xor = 3,
  Nor = 4,
  // ------------------------------------------------------------
  // 05-14: COMPLEX EXPRESSIONS
  //          paramType: AbiEncoded / Tuple / Array,
  //          ✅ children
  //          🚫 compValue
  Matches = 5,
  ArraySome = 6,
  ArrayEvery = 7,
  ArraySubset = 8,
  // ------------------------------------------------------------
  // 15:    SPECIAL COMPARISON (without compValue)
  //          paramType: Static
  //          🚫 children
  //          🚫 compValue
  /* 15: */ EqualToAvatar,
  // ------------------------------------------------------------
  // 16-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic / Tuple / Array / AbiEncoded
  //          🚫 children
  //          ✅ compValue
  EqualTo = 16, // paramType: Static / Dynamic / Tuple / Array
  GreaterThan = 17, // paramType: Static
  LessThan = 18, // paramType: Static
  SignedIntGreaterThan = 19, // paramType: Static
  SignedIntLessThan = 20, // paramType: Static
  Bitmask = 21, // paramType: Static / Dynamic
  Custom = 22, // paramType: Static / Dynamic / Tuple / Array
  WithinAllowance = 28, // paramType: Static
  EtherWithinAllowance = 29, // paramType: None
  CallWithinAllowance = 30, // paramType: None
}

export interface Role {
  key: string
  members: string[]
  targets: Target[]
  allowances: Allowance[]
}

export interface Target {
  address: string
  clearance: Clearance
  executionOptions: ExecutionOptions
  functions: Function[]
}

export interface Function {
  selector: string
  executionOptions: ExecutionOptions
  wildcarded: boolean
  condition?: Condition
}

export interface Condition {
  paramType: ParameterType
  operator: Operator
  compValue?: string
  children?: Condition[]
}

export interface Allowance {
  key: string
  refillInterval: number
  refillAmount: BigNumber
  refillTimestamp: number
  maxBalance: BigNumber
  balance: BigNumber
}
