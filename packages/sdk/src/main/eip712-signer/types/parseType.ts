export function parseType(type: string) {
  const isAtomic = isAtomicType(type)
  const isDynamic = isDynamicType(type)
  const isStruct = isStructType(type)
  const isArray = isArrayType(type)

  return {
    type: isArray ? type.split("[")[0] : type,
    isAtomic,
    isDynamic,
    isStruct,
    isArray,
    fixedLength: isArray ? Number(type.split("[")[1].slice(0, -1)) : 0,
  }
}

export function isNativeType(type: string): boolean {
  return isAtomicType(type) || isDynamicType(type)
}

export function isReferenceType(type: string): boolean {
  return isArrayType(type) || isStructType(type)
}

export function isAtomicType(type: string): boolean {
  return ATOMIC_TYPES[type] || false
}

export function isDynamicType(type: string): boolean {
  return DYNAMIC_TYPES[type] || false
}

export function isArrayType(type: string): boolean {
  return type.includes("[")
}

export function isStructType(type: string): boolean {
  return !isAtomicType(type) && !isDynamicType(type) && !isArrayType(type)
}

const ATOMIC_TYPES: Record<string, boolean> = Object.fromEntries(
  [
    // Static length types
    "bool",
    "address",
    "int8",
    "int16",
    "int32",
    "int64",
    "int128",
    "int256",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "uint128",
    "uint256",
    "bytes1",
    "bytes2",
    "bytes3",
    "bytes4",
    "bytes5",
    "bytes6",
    "bytes7",
    "bytes8",
    "bytes9",
    "bytes10",
    "bytes11",
    "bytes12",
    "bytes13",
    "bytes14",
    "bytes15",
    "bytes16",
    "bytes17",
    "bytes18",
    "bytes19",
    "bytes20",
    "bytes21",
    "bytes22",
    "bytes23",
    "bytes24",
    "bytes25",
    "bytes26",
    "bytes27",
    "bytes28",
    "bytes29",
    "bytes30",
    "bytes31",
    "bytes32",
  ].map((type) => [type, true])
)

const DYNAMIC_TYPES: Record<string, boolean> = {
  string: true,
  bytes: true,
}
