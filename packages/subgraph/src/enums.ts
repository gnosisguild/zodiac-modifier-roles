export enum ExecutionOptions {
  None = 0,
  Send = 1,
  DelegateCall = 2,
  Both = 3,
}

// ExecutionOptions[ExecutionOptions.None] does not work in AssemblyScript
// neither does { [ExecutionOptions.None]: "None", ... } :(
export const ExecutionOptionsKeys = ["None", "Send", "DelegateCall", "Both"]

export enum Clearance {
  None = 0,
  Target = 1,
  Function = 2,
}

export const ClearanceKeys = ["None", "Target", "Function"]

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
  //          ❓ children (only for paramType: Tuple / Array to describe their structure)
  //          ✅ compValue
  EqualTo = 16,
  GreaterThan = 17,
  LessThan = 18,
  SignedIntGreaterThan = 19,
  SignedIntLessThan = 20,
  Bitmask = 21,
  Custom = 22,
  WithinAllowance = 28,
  EtherWithinAllowance = 29,
  CallWithinAllowance = 30,
}
