// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.21 <0.9.0;

import "../../common/AbiDecoder.sol";
import {Encoding, Layout, Payload} from "../../types/Condition.sol";

/// @dev Flat type node for calldata input. Extends LayoutFlat with typeHash.
struct TypeNodeFlat {
    uint256 parent;
    Encoding encoding;
    bytes32 typeHash;
}

/**
 * @dev Tree type node for memory. Memory-compatible with Layout when cast,
 *      since typeHash is stored after inlined.
 */
struct TypeNode {
    Encoding encoding;
    TypeNode[] children;
    uint256 leadingBytes;
    bool inlined;
    bytes32 typeHash;
}

/**
 * @title EIP712Encoder - Encodes and hashes EIP-712 typed structured data
 *
 * @author gnosisguild
 */
library EIP712Encoder {

    /**
     * @dev Computes the hash of an EIP-712 message.
     * @param domain  The encoded domain data.
     * @param message The encoded message data.
     * @param types   Flattened type nodes for domain and message.
     */
    function hashTypedMessage(
        bytes calldata domain,
        bytes calldata message,
        TypeNodeFlat[] calldata types
    ) internal pure returns (bytes32 result) {
        (bytes32 domainSeparator, bytes32 messageHash) = (
            _hashStruct(domain, types, 0),
            _hashStruct(message, types, 1)
        );

        assembly {
            let ptr := mload(0x40)
            mstore(ptr, hex"1901")
            mstore(add(ptr, 0x02), domainSeparator)
            mstore(add(ptr, 0x22), messageHash)
            result := keccak256(ptr, 0x42)
        }
    }

    /**
     * @dev Computes the hash of an EIP-712 domain.
     * @param data  The encoded domain data.
     * @param types Type nodes for the domain.
     */
    function hashTypedDomain(
        bytes calldata data,
        TypeNodeFlat[] calldata types
    ) internal pure returns (bytes32) {
        return _hashStruct(data, types, 0);
    }

    /**
     * @dev Struct hashing entrypoint.
     *
     * @param data  Encoded structure data.
     * @param types Type nodes.
     * @param index Type definition entrypoint.
     */
    function _hashStruct(
        bytes calldata data,
        TypeNodeFlat[] calldata types,
        uint256 index
    ) private pure returns (bytes32) {
        TypeNode memory layout = _toTree(types, index);
        Payload memory payload = AbiDecoder
            .inspect(data, _cast(layout))
            .children[0];

        return _hashBlock(data, layout.children[0], payload);
    }

    /**
     * @dev Hashes a Tuple or Array block.
     *
     * @param data     Encoded input data.
     * @param layout   The layout node (with typeHash for EIP-712 hashing).
     * @param _block   The block's location and size in calldata.
     */
    function _hashBlock(
        bytes calldata data,
        TypeNode memory layout,
        Payload memory _block
    ) private pure returns (bytes32) {
        bytes32[] memory result = new bytes32[](_block.children.length);

        for (uint256 i = 0; i < _block.children.length; i++) {
            result[i] = _encodeField(
                data,
                layout.children[layout.encoding == Encoding.Array ? 0 : i],
                _block.children[i]
            );
        }

        return
            keccak256(
                layout.typeHash != bytes32(0)
                    ? abi.encodePacked(layout.typeHash, result)
                    : abi.encodePacked(result)
            );
    }

    /**
     * @dev Hashes Dynamic field
     * @param data    Encoded input data.
     * @param dynamic The field's location and size in calldata.
     */
    function _hashDynamic(
        bytes calldata data,
        Payload memory dynamic
    ) private pure returns (bytes32) {
        uint256 left = dynamic.location + 32;
        uint256 length = uint256(bytes32(data[dynamic.location:]));
        return keccak256(data[left:left + length]);
    }

    /**
     * @dev Encodes (Static) or hashes (Dynamic, Block) a field
     * @param data   Encoded input data.
     * @param layout The layout node for this field.
     * @param field  The field's location and size in calldata.
     */
    function _encodeField(
        bytes calldata data,
        TypeNode memory layout,
        Payload memory field
    ) private pure returns (bytes32) {
        Encoding encoding = layout.encoding;
        if (encoding == Encoding.Static) {
            return bytes32(data[field.location:]);
        } else if (encoding == Encoding.Dynamic) {
            return _hashDynamic(data, field);
        } else {
            return _hashBlock(data, layout, field);
        }
    }

    /**
     * @dev Builds a TypeNode tree from TypeNodeFlat array.
     */
    function _toTree(
        TypeNodeFlat[] calldata types,
        uint256 index
    ) private pure returns (TypeNode memory layout) {
        layout.encoding = types[index].encoding;
        layout.typeHash = types[index].typeHash;

        // Count children (nodes where parent == index)
        uint256 childCount = 0;
        uint256 len = types.length;
        for (uint256 i = index + 1; i < len; ++i) {
            if (types[i].parent == index) {
                ++childCount;
            }
        }

        if (childCount > 0) {
            layout.children = new TypeNode[](childCount);
            uint256 childIndex = 0;
            for (uint256 i = index + 1; childIndex < childCount; ++i) {
                if (types[i].parent == index) {
                    layout.children[childIndex++] = _toTree(types, i);
                }
            }
        }

        // Compute inlined flag
        layout.inlined = _isInlined(layout);
    }

    /**
     * @dev Determines if a layout node should be inlined in ABI encoding.
     *      Dynamic, Array, and AbiEncoded are never inlined.
     *      Static is always inlined.
     *      Tuple is inlined only if all children are inlined.
     */
    function _isInlined(
        TypeNode memory layout
    ) private pure returns (bool) {
        Encoding encoding = layout.encoding;

        if (
            encoding == Encoding.Dynamic ||
            encoding == Encoding.Array ||
            encoding == Encoding.AbiEncoded
        ) {
            return false;
        }

        if (encoding == Encoding.Static) {
            return true;
        }

        // Tuple: inlined only if all children are inlined
        for (uint256 i = 0; i < layout.children.length; ++i) {
            if (!layout.children[i].inlined) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Casts TypeNode to Layout. Safe because Layout fields are
     *      at the same memory offsets (typeHash is last and ignored).
     */
    function _cast(
        TypeNode memory typeNode
    ) private pure returns (Layout memory layout) {
        assembly {
            layout := typeNode
        }
    }
}
