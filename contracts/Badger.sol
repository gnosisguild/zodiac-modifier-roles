// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2021 PrimeDao

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@gnosis.pm/zodiac/contracts/core/Module.sol";

contract Badger is Module, ERC1155Upgradeable {
    /*
        libraries
    */
    using CountersUpgradeable for CountersUpgradeable.Counter;

    /*
        State variables
    */
    CountersUpgradeable.Counter counter;
    mapping(uint256 => TokenTier) public tokenTiers; // tokenId => TokenTier

    /*
        Structs
    */

    struct TokenTier {
        bool transferable;
    }

    /*
        Events
    */

    event TierChange(uint256 indexed tokenId, bool transferable);

    /*
        Modifiers
    */

    modifier isSameLength(
        address[] calldata accounts,
        uint256[] calldata tokenIds,
        uint256[] memory amounts
    ) {
        require(
            accounts.length == tokenIds.length &&
                tokenIds.length == amounts.length,
            "Input array mismatch"
        );
        _;
    }

    modifier isTier(uint256 tokenId) {
        require(tokenId <= counter.current(), "Tier does not exist");
        _;
    }

    modifier isValidTransfer(uint256 tokenId, address from) {
        require(
            tokenTiers[tokenId].transferable,
            "Transfer disabled for this tier"
        );
        _;
    }

    /*
        Constructor
    */

    constructor(address _owner, string memory _baseUri) {
        counter.increment();
        _setURI(_baseUri);
        bytes memory initializeParams = abi.encode(_owner);
        setUp(initializeParams);
    }

    /*
        Minting & burning
    */

    /**
     * @dev                 mints specified amount token(s) of specific id to specified account
     * @param account       beneficiary address
     * @param id            id of token, aka. tier
     * @param amount        units of token to be minted to beneficiary
     */
    function mint(
        address account,
        uint256 id,
        uint256 amount
    ) public onlyOwner {
        bytes memory data;

        _mint(account, id, amount, data);
    }

    /**
     * @dev                 burns specified amount token(s) of specific id from specified account
     * @param account       address of token holder
     * @param id            id of token, aka. tier
     * @param amount        units of token to be burnt from beneficiary
     */
    function burn(
        address account,
        uint256 id,
        uint256 amount
    ) public onlyOwner {
        _burn(account, id, amount);
    }

    /**
     * @dev                 mints to multiple addresses arbitrary units of tokens of ONE token id per address
     * @notice              example: mint 3 units of tokenId 1 to alice and 4 units of tokenId 2 to bob
     * @param accounts      list of beneficiary addresses
     * @param tokenIds      list of token ids (aka tiers)
     * @param amounts       list of mint amounts
     */
    function mintToMultiple(
        address[] calldata accounts,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) public onlyOwner isSameLength(accounts, tokenIds, amounts) {
        bytes memory data;

        for (uint256 i = 0; i < accounts.length; i++) {
            _mint(accounts[i], tokenIds[i], amounts[i], data);
        }
    }

    /**
     * @dev                 burns from multiple addresses arbitrary units of tokens of ONE token id per address
     *                      example: burn 3 units of tokenId 1 from alice and 4 units of tokenId 2 froms bob
     * @param accounts      list of token holder addresses
     * @param tokenIds      list of token ids (aka tiers)
     * @param amounts       list of burn amounts
     */
    function burnFromMultiple(
        address[] calldata accounts,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) public onlyOwner isSameLength(accounts, tokenIds, amounts) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _burn(accounts[i], tokenIds[i], amounts[i]);
        }
    }

    /*
        Transferring
    */

    /**
     * @dev                 transfers tokens from one address to another allowing custom data parameter
     * @notice              this is the standard transfer interface for ERC1155 tokens which contracts expect
     * @param from          address from which token will be transferred
     * @param to            recipient of address
     * @param id            id of token to be transferred
     * @param amount        amount of token to be transferred
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override isValidTransfer(id, from) {
        super.safeTransferFrom(from, to, id, amount, data);
    }

    /**
     * @dev                 batch transfers tokens from one address to another allowing custom data parameter
     * @notice              this is the standard transfer interface for ERC1155 tokens which contracts expect
     * @param from          address from which token will be transferred
     * @param to            recipient of address
     * @param ids           ids of token to be transferred
     * @param amounts       amounts of token to be transferred
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        for (uint8 i = 0; i < ids.length; i++) {
            require(
                tokenTiers[ids[i]].transferable,
                "Transfer disabled for this tier"
            );
        }
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /*
        Configuration
    */

    /**
     * @dev                 creates a new token tier
     * @param transferable  determines if tokens from specific tier should be transferable or not
     */
    function createTokenTier(bool transferable)
        public
        onlyOwner
        returns (uint256)
    {
        _createTokenTier(counter.current(), transferable);
        counter.increment();
        return counter.current() - 1;
    }

    /**
     * @dev                 updates transferability for a given token id (tier)
     * @param tokenId       tokenId for which transferability should be updated
     * @param transferable  determines whether tokens from tier should be transferable or not
     */
    function updateTransferableStatus(uint256 tokenId, bool transferable)
        public
        onlyOwner
        isTier(tokenId)
    {
        tokenTiers[tokenId].transferable = transferable;
        emit TierChange(tokenId, transferable);
    }

    /*
        Queries
    */

    /*
        Internal functions
    */

    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override isTier(id) {
        super._mint(account, id, amount, data);
    }

    function _burn(
        address account,
        uint256 id,
        uint256 amount
    ) internal override isTier(id) {
        super._burn(account, id, amount);
    }

    function _createTokenTier(uint256 tokenId, bool transferable) internal {
        tokenTiers[tokenId] = TokenTier(transferable);
        emit TierChange(tokenId, transferable);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param initializeParams Parameters of initialization encoded
    function setUp(bytes memory initializeParams) public override initializer {
        __Ownable_init();
        address _owner = abi.decode(initializeParams, (address));

        setAvatar(_owner);
        setTarget(_owner);
    }
}
