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
  options?: ExecutionOptions;
}

export interface AllowFunction {
  targetAddress: string;
  functionSig: string;
  params?: (ScopeParam | undefined)[];
  options?: ExecutionOptions;
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
