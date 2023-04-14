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
  AbiEncoded = 5,
}

export const ParameterTypeKeys = ["None", "Static", "Dynamic", "Tuple", "Array", "AbiEncoded"]

export enum Operator {
  // 00:    EMPTY EXPRESSION (default, always passes)
  //          paramType: Static / Dynamic / Tuple / Array
  //          🚫 children
  //          ❓ children (only for paramType: Tuple / Array to describe their structure)
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
  EqualToAvatar = 15,
  // ------------------------------------------------------------
  // 16-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic / Tuple / Array / AbiEncoded
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

export const OperatorKeys = [
  "Pass", // 0

  "And", // 1
  "Or", // 2
  "Xor", // 3
  "Nor", // 4

  "Matches", // 5
  "ArraySome", // 6
  "ArrayEvery", // 7
  "ArraySubset", // 8
  "_Placeholder9", // 9
  "_Placeholder10", // 10
  "_Placeholder11", // 11
  "_Placeholder12", // 12
  "_Placeholder13", // 13
  "_Placeholder14", // 14

  "EqualToAvatar", // 15

  "EqualTo", // 16
  "GreaterThan", // 17
  "LessThan", // 18
  "SignedIntGreaterThan", // 19
  "SignedIntLessThan", // 20
  "Bitmask", // 21
  "Custom", // 22
  "_Placeholder23", // 23
  "_Placeholder24", // 24
  "_Placeholder25", // 25
  "_Placeholder26", // 26
  "_Placeholder27", // 27
  "WithinAllowance", // 28
  "EtherWithinAllowance", // 29
  "CallWithinAllowance", // 30
  "_Placeholder31", // 31
]
