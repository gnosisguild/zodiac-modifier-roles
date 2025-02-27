import {
  distributeArrayElements,
  distributeArrayToLeaves,
} from "./distributeArrayElements"
import { RowValue } from "./types"

describe("distributeArrayElements", () => {
  it("turns a primitive array into 2 columns, one for the index and one for the value", () => {
    const values = { limits: ["1000000000000000000", "-2577523341", "0"] }

    const current = {
      limits: {
        children: [
          {
            span: 1,
            value: "1000000000000000000",
          },
          {
            span: 1,
            value: "-2577523341",
          },
          {
            span: 1,
            value: "0",
          },
        ],
        span: 3,
      },
    }

    expect(distributeArrayElements(values)).toEqual({
      limits: {
        indices: {
          children: [
            { value: 0, span: 1 },
            { value: 1, span: 1 },
            { value: 2, span: 1 },
          ],
          span: 3,
        },
        values: {
          children: [
            { value: "1000000000000000000", span: 1 },
            { value: "-2577523341", span: 1 },
            { value: "0", span: 1 },
          ],
          span: 3,
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

    expect(distributeArrayElements(values)).toEqual({
      swaps: {
        indices: {
          children: [
            { value: 0, span: 1 },
            { value: 1, span: 1 },
            { value: 2, span: 1 },
          ],
          span: 3,
        },
        values: {
          poolId: {
            children: [
              {
                value:
                  "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
                span: 1,
              },
              {
                value:
                  "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
                span: 1,
              },
              {
                value:
                  "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
                span: 1,
              },
            ],
            span: 3,
          },
          assetInIndex: {
            children: [
              { value: "0", span: 1 },
              { value: "0", span: 1 },
              { value: "2", span: 1 },
            ],
            span: 3,
          },
          assetOutIndex: {
            children: [
              { value: "1", span: 1 },
              { value: "2", span: 1 },
              { value: "1", span: 1 },
            ],
            span: 3,
          },
          amount: {
            children: [
              { value: "500000000000000000", span: 1 },
              { value: "500000000000000000", span: 1 },
              { value: "0", span: 1 },
            ],
            span: 3,
          },
          userData: {
            children: [
              { value: "0x", span: 1 },
              { value: "0x", span: 1 },
              { value: "0x", span: 1 },
            ],
            span: 3,
          },
        },
      },
    })
  })

  it("handles nested arrays", () => {
    const values = {
      a: [[{ x: 0 }, { x: 1 }], [{ x: 3 }]],
    }

    expect(distributeArrayElements(values)).toEqual({
      a: {
        indices: {
          children: [
            { value: 0, span: 2 },
            { value: 1, span: 1 },
          ],
          span: 3,
        },
        values: {
          indices: {
            children: [
              {
                children: [
                  { value: 0, span: 1 },
                  { value: 1, span: 1 },
                ],
                span: 2,
              },
              { children: [{ value: 0, span: 1 }], span: 1 },
            ],
            span: 3,
          },
          values: {
            x: {
              children: [
                {
                  children: [
                    { value: 0, span: 1 },
                    { value: 1, span: 1 },
                  ],
                  span: 2,
                },
                { children: [{ value: 3, span: 1 }], span: 1 },
              ],
              span: 3,
            },
          },
        },
      },
    })
  })
})

describe("distributeArrayToLeaves", () => {
  it("transforms an array of objects into an object of arrays", () => {
    const input = [
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
      { id: 3, name: "Charlie", age: 35 },
    ]

    const expectedOutput = {
      age: {
        children: [
          {
            span: 1,
            value: 30,
          },
          {
            span: 1,
            value: 25,
          },
          {
            span: 1,
            value: 35,
          },
        ],
        span: 3,
      },
      id: {
        children: [
          {
            span: 1,
            value: 1,
          },
          {
            span: 1,
            value: 2,
          },
          {
            span: 1,
            value: 3,
          },
        ],
        span: 3,
      },
      name: {
        children: [
          {
            span: 1,
            value: "Alice",
          },
          {
            span: 1,
            value: "Bob",
          },
          {
            span: 1,
            value: "Charlie",
          },
        ],
        span: 3,
      },
    }

    expect(distributeArrayToLeaves(input)).toEqual(expectedOutput)
  })

  it("handles nested arrays", () => {
    // Example usage:
    const input: RowValue[] = [
      {
        name: "Alice",
        tags: {
          indices: {
            children: [
              { value: 0, span: 1 },
              { value: 1, span: 1 },
            ],
            span: 2,
          },
          values: {
            children: [
              { value: "student", span: 1 },
              { value: "senior", span: 1 },
            ],
            span: 2,
          },
        },
      },
      {
        name: "Bob",
        tags: {
          indices: { children: [{ value: 0, span: 1 }], span: 1 },
          values: { children: [{ value: "student", span: 1 }], span: 1 },
        },
      },
    ]

    const expectedOutput = {
      name: {
        children: [
          {
            span: 1,
            value: "Alice",
          },
          {
            span: 1,
            value: "Bob",
          },
        ],
        span: 2,
      },
      tags: {
        indices: {
          children: [
            {
              children: [
                {
                  span: 1,
                  value: 0,
                },
                {
                  span: 1,
                  value: 1,
                },
              ],
              span: 2,
            },
            {
              children: [
                {
                  span: 1,
                  value: 0,
                },
              ],
              span: 1,
            },
          ],
          span: 3,
        },
        values: {
          children: [
            {
              children: [
                {
                  span: 1,
                  value: "student",
                },
                {
                  span: 1,
                  value: "senior",
                },
              ],
              span: 2,
            },
            {
              children: [
                {
                  span: 1,
                  value: "student",
                },
              ],
              span: 1,
            },
          ],
          span: 3,
        },
      },
    }

    expect(distributeArrayToLeaves(input)).toEqual(expectedOutput)
  })

  it("uses the max span for structs with nested arrays", () => {
    const input = [
      {
        x: {
          indices: { children: [{ value: 0, span: 1 }], span: 1 },
          values: { children: [{ value: 1, span: 1 }], span: 1 },
        },
        y: {
          indices: {
            children: [
              { value: 0, span: 1 },
              { value: 1, span: 1 },
            ],
            span: 2,
          },
          values: {
            children: [
              { value: 1, span: 1 },
              { value: 2, span: 1 },
            ],
            span: 2,
          },
        },
      },
    ]
    const expectedValue = {
      x: {
        indices: {
          children: [
            {
              children: [
                {
                  span: 1,
                  value: 0,
                },
              ],
              span: 1,
            },
          ],
          span: 2,
        },
        values: {
          children: [
            {
              children: [
                {
                  span: 1,
                  value: 1,
                },
              ],
              span: 1,
            },
          ],
          span: 2,
        },
      },
      y: {
        indices: {
          children: [
            {
              children: [
                {
                  span: 1,
                  value: 0,
                },
                {
                  span: 1,
                  value: 1,
                },
              ],
              span: 2,
            },
          ],
          span: 2,
        },
        values: {
          children: [
            {
              children: [
                {
                  span: 1,
                  value: 1,
                },
                {
                  span: 1,
                  value: 2,
                },
              ],
              span: 2,
            },
          ],
          span: 2,
        },
      },
    }
    expect(distributeArrayToLeaves(input)).toEqual(expectedValue)
  })
})
