// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.21 <0.9.0;

import "../../common/AbiDecoder.sol";
import {Encoding, Layout, LayoutFlat, Payload} from "../../types/Condition.sol";

/**
 * @title EIP712Encoder - Encodes and hashes EIP-712 typed structured data
 *
 * @author gnosisguild
 */
library EIP712Encoder {
    struct Types {
        LayoutFlat[] layout;
        bytes32[] typeHashes;
    }

    /**
     * @dev Layout with index for typeHashes lookup. Memory-compatible with Layout
     *      when cast, since index is stored after inlined. This keeps the core Layout
     *      struct clean of EIP712-specific concerns.
     */
    struct LayoutWithIndex {
        Encoding encoding;
        LayoutWithIndex[] children;
        uint256 leadingBytes;
        bool inlined;
        uint256 index;
    }

    /**
     * @dev Computes the hash of an EIP-712 message.
     * @param domain  The encoded domain data.
     * @param message The encoded message data.
     * @param types   Type definitions for domain and message
     *                (domain at 0) (message at 0).
     */
    function hashTypedMessage(
        bytes calldata domain,
        bytes calldata message,
        Types calldata types
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
     * @param types Type definitions for the domain.
     */
    function hashTypedDomain(
        bytes calldata data,
        Types calldata types
    ) internal pure returns (bytes32) {
        return _hashStruct(data, types, 0);
    }

    /**
     * @dev Struct hashing entrypoint.
     *
     * @param data  Encoded structure data.
     * @param types Type definitions.
     * @param index Type definition entrypoint.
     */
    function _hashStruct(
        bytes calldata data,
        Types calldata types,
        uint256 index
    ) private pure returns (bytes32) {
        LayoutWithIndex memory layoutWithIndex = _toTree(types.layout, index);
        Payload memory payload = AbiDecoder
            .inspect(data, _cast(layoutWithIndex))
            .children[0];

        return _hashBlock(data, types, layoutWithIndex.children[0], payload);
    }

    /**
     * @dev Hashes a Tuple or Array block.
     *
     * @param data     Encoded input data.
     * @param types    Type definitions.
     * @param layout   The layout node (with index for typeHashes lookup).
     * @param _block   The block's location and size in calldata.
     */
    function _hashBlock(
        bytes calldata data,
        Types calldata types,
        LayoutWithIndex memory layout,
        Payload memory _block
    ) private pure returns (bytes32) {
        bytes32[] memory result = new bytes32[](_block.children.length);

        for (uint256 i = 0; i < _block.children.length; i++) {
            result[i] = _encodeField(
                data,
                types,
                layout.children[layout.encoding == Encoding.Array ? 0 : i],
                _block.children[i]
            );
        }

        return
            keccak256(
                types.typeHashes[layout.index] != bytes32(0)
                    ? abi.encodePacked(types.typeHashes[layout.index], result)
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
     * @param types  Type definitions.
     * @param layout The layout node for this field.
     * @param field  The field's location and size in calldata.
     */
    function _encodeField(
        bytes calldata data,
        Types calldata types,
        LayoutWithIndex memory layout,
        Payload memory field
    ) private pure returns (bytes32) {
        Encoding encoding = layout.encoding;
        if (encoding == Encoding.Static) {
            return bytes32(data[field.location:]);
        } else if (encoding == Encoding.Dynamic) {
            return _hashDynamic(data, field);
        } else {
            return _hashBlock(data, types, layout, field);
        }
    }

    /**
     * @dev Builds a LayoutWithIndex tree from flat layout.
     */
    function _toTree(
        LayoutFlat[] calldata flatLayout,
        uint256 index
    ) private pure returns (LayoutWithIndex memory layout) {
        layout.encoding = flatLayout[index].encoding;
        layout.index = index;

        // Count children (nodes where parent == index)
        uint256 childCount = 0;
        uint256 len = flatLayout.length;
        for (uint256 i = index + 1; i < len; ++i) {
            if (flatLayout[i].parent == index) {
                ++childCount;
            }
        }

        if (childCount > 0) {
            layout.children = new LayoutWithIndex[](childCount);
            uint256 childIndex = 0;
            for (uint256 i = index + 1; childIndex < childCount; ++i) {
                if (flatLayout[i].parent == index) {
                    layout.children[childIndex++] = _toTree(flatLayout, i);
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
        LayoutWithIndex memory layout
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
     * @dev Casts LayoutWithIndex to Layout. Safe because Layout fields are
     *      at the same memory offsets (index is last and ignored).
     */
    function _cast(
        LayoutWithIndex memory layoutWithIndex
    ) private pure returns (Layout memory layout) {
        assembly {
            layout := layoutWithIndex
        }
    }
}
