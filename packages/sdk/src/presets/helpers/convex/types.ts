import pools from "./pools"

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type Pool = ArrayElement<typeof pools>
