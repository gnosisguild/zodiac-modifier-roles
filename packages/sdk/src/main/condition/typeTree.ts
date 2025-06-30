import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

export type TypeTree = {
  paramType: ParameterType
  children: TypeTree[]
}

export function typeTreeId(condition: Condition): string {
  return JSON.stringify(createTypeTree(condition))
  // return (
  //   "0x" +
  //   createHash("sha256")
  //     .update(JSON.stringify(createTypeTree(condition)))
  //     .digest("hex")
  // )
}

export function createTypeTree(condition: Condition): TypeTree | null {
  const atLeastOne = (): Condition[] => {
    if (!condition.children || condition.children.length == 0) {
      throw new Error("Expected populated children array")
    }

    return condition.children! as Condition[]
  }

  if (isLogical(condition)) {
    const [child] = atLeastOne()
    return createTypeTree(child)
  }

  if (isArray(condition)) {
    const [child] = atLeastOne()
    return {
      paramType: condition.paramType,
      children: [createTypeTree(child)!],
    }
  }

  if (isComplex(condition)) {
    const children = atLeastOne()

    return {
      paramType: condition.paramType,
      children: children.map(createTypeTree).filter((t) => !!t),
    }
  }

  if (isSimple(condition)) {
    return {
      paramType: condition.paramType,
      children: [],
    }
  }

  return null
}

export function isLogical({ operator }: { operator: Operator }) {
  return [Operator.And, Operator.Or, Operator.Nor].includes(operator)
}

export function isComplex({ paramType }: { paramType: ParameterType }) {
  return [
    ParameterType.AbiEncoded,
    ParameterType.Calldata,
    ParameterType.Array,
    ParameterType.Tuple,
  ].includes(paramType)
}

export function isSimple({ paramType }: { paramType: ParameterType }) {
  return [ParameterType.Dynamic, ParameterType.Static].includes(paramType)
}

export function isArray({ paramType }: { paramType: ParameterType }) {
  return paramType == ParameterType.Array
}
