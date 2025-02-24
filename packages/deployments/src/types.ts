import { chains } from "./chains"

export type ChainId = keyof typeof chains

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
  Calldata = 5,
  AbiEncoded = 6,
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
  Nor = 3,
  // ------------------------------------------------------------
  // 05-14: COMPLEX EXPRESSIONS
  //          paramType: Calldata / AbiEncoded / Tuple / Array,
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
  EqualToAvatar = 15,
  // ------------------------------------------------------------
  // 16-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic / Tuple / Array
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

export enum Status {
  Ok,
  /** Role not allowed to delegate call to target address */
  DelegateCallNotAllowed,
  /** Role not allowed to call target address */
  TargetAddressNotAllowed,
  /** Role not allowed to call this function on target address */
  FunctionNotAllowed,
  /** Role not allowed to send to target address */
  SendNotAllowed,
  /** Or condition not met */
  OrViolation,
  /** Nor condition not met */
  NorViolation,
  /** Parameter value is not equal to allowed */
  ParameterNotAllowed,
  /** Parameter value less than allowed */
  ParameterLessThanAllowed,
  /** Parameter value greater than maximum allowed by role */
  ParameterGreaterThanAllowed,
  /** Parameter value does not match */
  ParameterNotAMatch,
  /** Array elements do not meet allowed criteria for every element */
  NotEveryArrayElementPasses,
  /** Array elements do not meet allowed criteria for at least one element */
  NoArrayElementPasses,
  /** Parameter value not a subset of allowed */
  ParameterNotSubsetOfAllowed,
  /** Bitmask exceeded value length */
  BitmaskOverflow,
  /** Bitmask not an allowed value */
  BitmaskNotAllowed,
  CustomConditionViolation,
  AllowanceExceeded,
  CallAllowanceExceeded,
  EtherAllowanceExceeded,
}

export interface Role {
  key: `0x${string}`
  members: `0x${string}`[]
  targets: Target[]
  annotations: Annotation[]
  lastUpdate: number
}

export interface Target {
  address: `0x${string}`
  clearance: Clearance
  executionOptions: ExecutionOptions
  functions: Function[]
}

export interface Function {
  selector: `0x${string}`
  executionOptions: ExecutionOptions
  wildcarded: boolean
  condition?: Condition
}

export interface Condition {
  paramType: ParameterType
  operator: Operator
  compValue?: `0x${string}`
  children?: readonly Condition[]
}

export interface Allowance {
  key: `0x${string}`
  refill: bigint
  maxRefill: bigint
  period: bigint
  balance: bigint
  timestamp: bigint
}

export interface Annotation {
  /** The URI serves as ID for the annotation. An http get request will be made to fetch the targeted permissions. */
  uri: string
  /** The OpenAPI schema that describes the API endpoint at uri. */
  schema: string
}
