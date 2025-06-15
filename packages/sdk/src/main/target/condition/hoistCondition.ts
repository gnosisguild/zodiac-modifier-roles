import { Operator, ParameterType, Condition } from "zodiac-roles-deployments"

import { normalizeConditionNext as normalizeCondition } from "./normalizeConditionNext"

/**
 * Represents a node in the condition tree with its path from the root
 */
export interface ConditionNode {
  condition: Condition
  path: number[] // indices from root to this node
}

/**
 * Pull logical operators (AND/OR) up the tree from MATCHES nodes.
 * Tries to do the reverse of what is done by pushDownNode in normalizeConditionDeprecated
 *
 * @param condition The condition tree to transform
 */

export const hoistCondition = (condition: Condition): Condition => {
  while (true) {
    condition = normalizeCondition(condition)
    // Get all nodes in the current tree
    const nodes = allNodes(condition)

    // Try to pull up each node
    let nextVariant
    for (const node of nodes) {
      nextVariant = tryHoistNode(condition, node.path)
      if (nextVariant) break
    }

    if (!nextVariant) {
      return condition as any
    }
    condition = nextVariant
  }
}

/**
 * Pulls top level ORs up the tree from MATCHES nodes.
 * It pulls only one at a time, and returns an array of possibilities
 * It also tries to reverse whats done by normalizeConditionDeprecated
 *
 * @param condition The condition tree to transform
 */
export const hoistTopOrs = (condition: Condition): Condition[] => {
  if (
    condition.operator !== Operator.Matches ||
    condition.paramType !== ParameterType.Calldata
  ) {
    return [condition]
  }

  const result = (condition.children || [])
    .map((child, index) =>
      child.operator == Operator.Or ? tryHoistNode(condition, [index]) : null
    )
    .filter((c) => !!c)

  return result.length > 0 ? result : [condition]
}

/**
 * Try to pull up a specific node in the condition tree.
 * Returns the transformed tree if pull-up is possible, null otherwise.
 *
 * @param root The root of the condition tree
 * @param nodePath Path to the node to try pulling up
 */
function tryHoistNode(root: Condition, nodePath: number[]): Condition | null {
  if (nodePath.length === 0) {
    return null // Can't pull up the root
  }

  // Get the target node
  const targetNode = nodeAtPath(root, nodePath)
  if (!targetNode) {
    return null
  }

  // Check if target is a logical operator (AND/OR)
  if (
    targetNode.paramType !== ParameterType.None ||
    (targetNode.operator !== Operator.And &&
      targetNode.operator !== Operator.Or) ||
    !targetNode.children ||
    targetNode.children.length === 0
  ) {
    return null
  }

  // Get the parent node
  const parentPath = nodePath.slice(0, -1)
  const parent = parentPath.length === 0 ? root : nodeAtPath(root, parentPath)

  if (!parent) {
    return null
  }

  // Check if parent is a MATCHES node
  if (parent.operator !== Operator.Matches) {
    return null
  }

  const targetIndex = nodePath[nodePath.length - 1]

  // Create the pulled-up structure
  const pulledUpBranches = targetNode.children.map((branch) => ({
    ...parent,
    children: parent.children!.map((child, i) =>
      i === targetIndex ? branch : child
    ),
  }))

  const pulledUpNode: Condition = {
    paramType: ParameterType.None,
    operator: targetNode.operator,
    children: pulledUpBranches,
  }

  // Rebuild the tree with the pulled-up node
  return replaceNode(root, parentPath, pulledUpNode)
}

/**
 * Helper function to replace a node at a specific path in the tree
 */
function replaceNode(
  root: Condition,
  path: number[],
  replacement: Condition
): Condition {
  if (path.length === 0) {
    return replacement
  }

  const [index, ...restPath] = path

  if (!root.children || index >= root.children.length) {
    return root
  }

  const newChildren = [...root.children]
  newChildren[index] = replaceNode(root.children[index], restPath, replacement)

  return {
    ...root,
    children: newChildren,
  }
}

/**
 * Get all nodes from a condition tree with their paths
 */
function allNodes(root: Condition): ConditionNode[] {
  const nodes: ConditionNode[] = []
  const queue: ConditionNode[] = [{ condition: root, path: [] }]

  while (queue.length > 0) {
    const current = queue.shift()!
    nodes.push(current)

    if (current.condition.children) {
      current.condition.children.forEach((child, index) => {
        queue.push({
          condition: child,
          path: [...current.path, index],
        })
      })
    }
  }

  return nodes.reverse()
}

/**
 * Get a node at a specific path in the condition tree
 * Returns null if the path is invalid
 */
function nodeAtPath(root: Condition, path: number[]): Condition | null {
  let current: Condition = root

  for (const index of path) {
    if (!current.children || index >= current.children.length) {
      return null
    }
    current = current.children[index]
  }

  return current
}
