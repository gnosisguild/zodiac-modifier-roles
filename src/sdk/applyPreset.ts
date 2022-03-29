import { Contract, providers } from "ethers";

import {
  AllowFunction,
  Comparison,
  ExecutionOptions,
  ParameterType,
  RolePreset,
  ScopeParam,
} from "./types";

// TODO get the abi from build/artifacts/contracts/Roles.sol/Roles.json
const rolesABI = "TODO";

/**
 * Updates a role, setting all permissions of the given preset
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset: Permissions preset to apply
 */
const applyPreset = async (
  /// address of the roles modifier
  address: string,
  roleId: number,
  preset: RolePreset,
  provider: providers.JsonRpcProvider
): Promise<void> => {
  const contract = new Contract(address, rolesABI, provider);

  // why is the network coming from the preset?
  // I expect it to come from some sort of provider instead
  // either injected or via .env config

  // Should we do sanity checks on the config?

  await makeAllowTargetCalls(roleId, preset, contract);

  await makeScopeTargetCalls(roleId, preset, contract);

  await makeScopeAllowFunctionCalls(roleId, preset, contract);

  await makeScopeSignatureCalls(roleId, preset, contract);

  await makeScopeParameterCalls(roleId, preset, contract);

  await makeScopeParameterAsOneOfCalls(roleId, preset, contract);
};

async function makeAllowTargetCalls(
  roleId: number,
  preset: RolePreset,
  roles: Contract
) {
  for (let i = 0; i < preset.allowTargets.length; i++) {
    const { targetAddress, options } = preset.allowTargets[i];
    await roles.allowTarget(roleId, targetAddress, options);
  }
}

async function makeScopeTargetCalls(
  roleId: number,
  preset: RolePreset,
  roles: Contract
) {
  // Every single function scoping, either: functionAllow, functionScope, parameterScope and parameterScopeAsOneOf
  // requires a preceding scopeTarget

  for (let i = 0; i < preset.allowFunctions.length; i++) {
    const { targetAddress } = preset.allowTargets[i];
    await roles.scopeTarget(roleId, targetAddress);
  }
}

async function makeScopeAllowFunctionCalls(
  roleId: number,
  preset: RolePreset,
  roles: Contract
) {
  for (let i = 0; i < preset.allowFunctions.length; i++) {
    const allowFunction = preset.allowFunctions[i];
    if (isScopeAllowFunctionCall(allowFunction)) {
      const {
        targetAddress,
        functionSig,
        options = ExecutionOptions.None,
      } = preset.allowFunctions[i];
      roles.scopeAllowFunction(roleId, targetAddress, functionSig, options);
    }
  }
}

async function makeScopeSignatureCalls(
  roleId: number,
  preset: RolePreset,
  roles: Contract
) {
  for (let i = 0; i < preset.allowFunctions.length; i++) {
    const allowFunction = preset.allowFunctions[i];
    if (isScopeSignatureCall(allowFunction)) {
      const {
        targetAddress,
        functionSig,
        options = ExecutionOptions.None,
      } = preset.allowFunctions[i];

      // Note we exclude oneOf parameters. These will be set independently later
      const params = (allowFunction.params as ScopeParam[]).map((param) =>
        param?.comparison !== Comparison.OneOf ? param : undefined
      );

      // extract arguments
      const isParamScoped = params.map((entry) => Boolean(entry));
      const paramType = params.map(
        (entry) => entry?.type || ParameterType.Static
      );
      const paramComp = params.map(
        (entry) => entry?.comparison || Comparison.EqualTo
      );

      const compValue = params.map((entry) => entry?.value || "0x");

      roles.scopeFunction(
        roleId,
        targetAddress,
        functionSig,
        isParamScoped,
        paramType,
        paramComp,
        compValue,
        options
      );
    }
  }
}

async function makeScopeParameterCalls(
  roleId: number,
  preset: RolePreset,
  roles: Contract
) {
  for (let i = 0; i < preset.allowFunctions.length; i++) {
    const allowFunction = preset.allowFunctions[i];
    if (isScopeParameterCall(allowFunction)) {
      const { targetAddress, functionSig, options } = preset.allowFunctions[i];

      // Note we exclude oneOf parameters. These will be set independently later
      const paramIndex = (
        allowFunction.params as (ScopeParam | undefined)[]
      ).findIndex((param) => param && param.comparison !== Comparison.OneOf);

      const param = (allowFunction.params as ScopeParam[])[paramIndex];

      if (options) {
        roles.scopeFunctionExecutionOptions(
          roleId,
          targetAddress,
          functionSig,
          options
        );
      }

      roles.scopeParameter(
        roleId,
        targetAddress,
        functionSig,
        paramIndex,
        param.type,
        param.comparison,
        param.value
      );
    }
  }
}

async function makeScopeParameterAsOneOfCalls(
  roleId: number,
  preset: RolePreset,
  roles: Contract
) {
  for (let i = 0; i < preset.allowFunctions.length; i++) {
    const allowFunction = preset.allowFunctions[i];

    const { targetAddress, functionSig, options } = preset.allowFunctions[i];

    // here we go over every single parameter that was scoped as oneOf, and we set it
    const paramIndex = (
      allowFunction.params as (ScopeParam | undefined)[]
    ).findIndex((param) => param?.comparison === Comparison.OneOf);

    if (paramIndex !== -1) {
      const param = (allowFunction.params as ScopeParam[])[paramIndex];

      if (options) {
        roles.scopeFunctionExecutionOptions(
          roleId,
          targetAddress,
          functionSig,
          options
        );
      }

      roles.scopeParameterAsOneOf(
        roleId,
        targetAddress,
        functionSig,
        paramIndex,
        param.type,
        param.comparison,
        param.value
      );
    }
  }
}

function isScopeAllowFunctionCall(allowFunction: AllowFunction): boolean {
  const { scopedCount, scopedOneOfCount } = countParams(allowFunction);

  return scopedCount + scopedOneOfCount === 0;
}

function isScopeSignatureCall(allowFunction: AllowFunction): boolean {
  const { scopedCount } = countParams(allowFunction);

  return scopedCount > 1;
}

function isScopeParameterCall(allowFunction: AllowFunction): boolean {
  const { scopedCount } = countParams(allowFunction);
  return scopedCount === 1;
}

function countParams(allowFunction: AllowFunction) {
  const scopedParams = (allowFunction.params || []).filter((entry) =>
    Boolean(entry)
  ) as ScopeParam[];

  return {
    scopedCount: scopedParams.filter(
      (entry) => entry.comparison !== Comparison.OneOf
    ).length,
    scopedOneOfCount: scopedParams.filter(
      (entry) => entry.comparison === Comparison.OneOf
    ).length,
  };
}
