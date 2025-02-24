import {
  distributeArrayElements,
  distributeArrayToProperties,
  flattenNestedArray,
  totalNestedLength,
} from "./distributeArrayElements"

describe("distributeArrayElements", () => {
  it("turns a primitive array into 2 columns, one for the index and one for the value", () => {
    const values = { limits: ["1000000000000000000", "-2577523341", "0"] }
    const params = [
      {
        internalType: "int256[]",
        name: "limits",
        type: "int256[]",
      },
    ]
    expect(distributeArrayElements(values, params)).toEqual({
      limits: {
        indices: { elements: [0, 1, 2], span: [1, 1, 1] },
        values: {
          elements: ["1000000000000000000", "-2577523341", "0"],
          span: [1, 1, 1],
        },
      },
    })
  })

  it("pushes arrays down to the level of individual columns", () => {
    const values = {
      swaps: [
        {
          poolId:
            "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          assetInIndex: "0",
          assetOutIndex: "1",
          amount: "500000000000000000",
          userData: "0x",
        },
        {
          poolId:
            "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          assetInIndex: "0",
          assetOutIndex: "2",
          amount: "500000000000000000",
          userData: "0x",
        },
        {
          poolId:
            "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
          assetInIndex: "2",
          assetOutIndex: "1",
          amount: "0",
          userData: "0x",
        },
      ],
    }
    const params = [
      {
        components: [
          {
            internalType: "bytes32",
            name: "poolId",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "assetInIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "assetOutIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "userData",
            type: "bytes",
          },
        ],
        internalType: "struct IVault.BatchSwapStep[]",
        name: "swaps",
        type: "tuple[]",
      },
    ]
    expect(distributeArrayElements(values, params)).toEqual({
      swaps: {
        indices: { elements: [0, 1, 2], span: [1, 1, 1] },
        values: {
          poolId: {
            elements: [
              "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
              "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
              "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
            ],
            span: [1, 1, 1],
          },
          assetInIndex: {
            elements: ["0", "0", "2"],
            span: [1, 1, 1],
          },
          assetOutIndex: {
            elements: ["1", "2", "1"],
            span: [1, 1, 1],
          },
          amount: {
            elements: ["500000000000000000", "500000000000000000", "0"],
            span: [1, 1, 1],
          },
          userData: {
            elements: ["0x", "0x", "0x"],
            span: [1, 1, 1],
          },
        },
      },
    })
  })

  it("handles nested arrays", () => {
    const values = {
      a: [[{ x: 0 }, { x: 1 }], [{ x: 3 }]],
    }
    const params = [
      {
        components: [
          {
            internalType: "uint256",
            name: "x",
            type: "uint256",
          },
        ],
        internalType: "tuple[][]",
        name: "a",
        type: "tuple[][]",
      },
    ]
    expect(distributeArrayElements(values, params)).toEqual({
      a: {
        indices: { elements: [0, 1], span: [2, 1] },
        values: {
          indices: { elements: [0, 1, 0], span: [1, 1, 1] },
          values: {
            x: { elements: [0, 1, 3], span: [1, 1, 1] },
          },
        },
      },
    })
  })
})

describe("distributeArrayToProperties", () => {
  it("transforms an array of objects into an object of arrays", () => {
    const inputArray = [
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
      { id: 3, name: "Charlie", age: 35 },
    ]

    const expectedOutput = {
      id: [1, 2, 3],
      name: ["Alice", "Bob", "Charlie"],
      age: [30, 25, 35],
    }

    const result = distributeArrayToProperties(inputArray)
    expect(result).toEqual(expectedOutput)
  })
})

describe("flattenNestedArray", () => {
  it("flattens a nested array into elements, indices, and span", () => {
    const nestedArray = [[1, 2, 3], [4, 5], [6]]

    const expectedOutput = {
      elements: [1, 2, 3, 4, 5, 6],
      indices: [0, 1, 2],
      span: [3, 2, 1],
    }

    const result = flattenNestedArray(nestedArray)
    expect(result).toEqual(expectedOutput)
  })
})

describe("totalNestedLength", () => {
  it("returns the total length for a flat array", () => {
    const values = [1, 2, 3]
    expect(totalNestedLength(values)).toBe(3)
  })

  it("returns the max arraylength for an object with arrays", () => {
    const values = {
      a: [1, 2],
      b: [1, 2, 3],
    }
    expect(totalNestedLength(values)).toBe(3) // 1, 2, 3
  })

  it("returns the total length for a nested array", () => {
    const values = [[1, 2], [3, 4, 5], [6]]
    expect(totalNestedLength(values)).toBe(6)
  })

  it("returns the max total length for an array with nested objects", () => {
    const values = [
      { a: [1, 2], b: [1] },
      { a: [3], b: [2] },
    ]
    expect(totalNestedLength(values)).toBe(3) // 1, 2, 3
  })

  it("returns the max total length for a deeply nested structure", () => {
    const values = [{ a: [{ b: [1, 2] }, { b: [3, 4] }] }]
    expect(totalNestedLength(values)).toBe(4) // 1, 2, 3, 4
  })

  it("returns the total length for an empty array", () => {
    const values: any[] = []
    expect(totalNestedLength(values)).toBe(0)
  })
})
