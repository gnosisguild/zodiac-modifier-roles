// SPDX-License-Identifier: LGPL-3.0
pragma solidity >=0.8.21 <0.9.0;

import "../../common/AbiDecoder.sol";

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
            _inpectAndHashStruct(domain, types, 0),
            _inpectAndHashStruct(message, types, 1)
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
        return _inpectAndHashStruct(data, types, 0);
    }

    /**
     * @dev Struct hashing entrypoint.
     *
     * @param data  Encoded structure data.
     * @param types Type definitions.
     * @param index Type definition entrypoint.
     */
    function _inpectAndHashStruct(
        bytes calldata data,
        Types calldata types,
        uint256 index
    ) private pure returns (bytes32) {
        Payload memory payload = AbiDecoder
            .inspect(data, _toTree(types.layout, index))
            .children[0];

        return _hashBlock(data, types, payload);
    }

    /**
     * @dev Hashes a Tuple or Array block.
     *
     * @param data   Encoded input data.
     * @param types  Type definitions.
     * @param _block The block's location and size in calldata.
     */
    function _hashBlock(
        bytes calldata data,
        Types calldata types,
        Payload memory _block
    ) private pure returns (bytes32) {
        bytes32[] memory result = new bytes32[](_block.children.length);
        for (uint256 i = 0; i < _block.children.length; i++) {
            result[i] = _encodeField(data, types, _block.children[i]);
        }

        return
            keccak256(
                types.typeHashes[_block.typeIndex] != bytes32(0)
                    ? abi.encodePacked(
                        types.typeHashes[_block.typeIndex],
                        result
                    )
                    : abi.encodePacked(result)
            );
    }

    /**
     * @dev Hashes Dynamic field
     * @param data   Encoded input data.
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
     * @param data  Encoded input data.
     * @param types Type definitions
     * @param field The field's location and size in calldata.
     */
    function _encodeField(
        bytes calldata data,
        Types calldata types,
        Payload memory field
    ) private pure returns (bytes32) {
        Encoding encoding = types.layout[field.typeIndex].encoding;
        if (encoding == Encoding.Static) {
            return bytes32(data[field.location:]);
        } else if (encoding == Encoding.Dynamic) {
            return _hashDynamic(data, field);
        } else {
            return _hashBlock(data, types, field);
        }
    }

    function _toTree(
        LayoutFlat[] calldata flatLayout,
        uint256 index
    ) private pure returns (Layout memory layout) {
        layout.encoding = flatLayout[index].encoding;
        layout.index = index;
        if (flatLayout[index].fields.length > 0) {
            uint256[] memory fields = flatLayout[index].fields;
            layout.children = new Layout[](fields.length);
            for (uint256 i = 0; i < fields.length; i++) {
                layout.children[i] = _toTree(flatLayout, fields[i]);
            }
        }
    }
}
