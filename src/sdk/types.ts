export interface RolePreset {
  network: number;
  allowTargets: AllowTarget[]; // allows all calls to targets
  allowFunctions: AllowFunction[]; // allows calls to specific functions, optionally with parameter scoping
}

export enum ExecutionOptions {
  None,
  Send,
  DelegateCall,
  Both,
}

export interface AllowTarget {
  targetAddress: string;
  executionOption?: ExecutionOptions;
}

export interface AllowFunction {
  targetAddresses: string[];
  functionSig: string;
  params?: (ScopeParam | undefined)[];
  executionOption?: ExecutionOptions;
}

export enum ParameterType {
  Static,
  Dynamic,
  Dynamic32,
}

export enum Comparison {
  EqualTo,
  GreaterThan,
  LessThan,
  OneOf,
}

export interface ScopeParam {
  type: ParameterType;
  comparison: Comparison;
  value: string | string[];
}
