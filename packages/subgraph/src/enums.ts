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
  //          paramType: Static / Dynamic
  //          🚫 children
  //          🚫 compValue
  Pass = 0,
  // ------------------------------------------------------------
  // 01-04: BOOLEAN EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  And = 1,
  Or = 2,
  Xor = 3,
  Nor = 4,
  // ------------------------------------------------------------
  // 05-16: COMPLEX EXPRESSIONS
  //          paramType: AbiEncoded / Tuple / Array,
  //          ✅ children
  //          🚫 compValue
  Matches = 5,
  ArraySome = 6,
  ArrayEvery = 7,
  ArraySubset = 8,

  // ------------------------------------------------------------
  // 16-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic / Tuple / Array / AbiEncoded
  //          🚫 children
  //          ✅ compValue
  EqualTo = 16,
  GreaterThan = 17,
  LessThan = 18,
  SignedIntGreaterThan = 19,
  SignedIntLessThan = 20,
  Bitmask = 21,

  WithinAllowance = 29,
  EtherWithinAllowance = 30,
  CallWithinAllowance = 31,
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
  "_ComplexPlaceholder9", // 9
  "_ComplexPlaceholder10", // 10
  "_ComplexPlaceholder11", // 11
  "_ComplexPlaceholder12", // 12
  "_ComplexPlaceholder13", // 13
  "_ComplexPlaceholder14", // 14
  "_ComplexPlaceholder15", // 15

  "EqualTo", // 16
  "GreaterThan", // 17
  "LessThan", // 18
  "SignedIntGreaterThan", // 19
  "SignedIntLessThan", // 20
  "Bitmask", // 21
  "_ComparisonPlaceholder22", // 22
  "_ComparisonPlaceholder23", // 23
  "_ComparisonPlaceholder24", // 24
  "_ComparisonPlaceholder25", // 25
  "_ComparisonPlaceholder26", // 26
  "_ComparisonPlaceholder27", // 27
  "_ComparisonPlaceholder28", // 28
  "WithinAllowance", // 29
  "EtherWithinAllowance", // 30
  "CallWithinAllowance", // 31
]
