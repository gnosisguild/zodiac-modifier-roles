export const groupBy = <T, K extends keyof any>(
  arr: readonly T[],
  key: (i: T) => K
) =>
  arr.reduce((groups, item) => {
    ;(groups[key(item)] ||= []).push(item)
    return groups
  }, {} as Record<K, T[]>)
