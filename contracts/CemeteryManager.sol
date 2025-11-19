// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CemeteryManager
 * @dev Manages cemetery grave allocations, reservations, and payments on blockchain
 * @notice This contract provides transparent and immutable grave ownership records with role-based access control
 */
contract CemeteryManager is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GRAVEYARD_MANAGER_ROLE = keccak256("GRAVEYARD_MANAGER_ROLE");

    // ============ State Variables ============

    Counters.Counter private _graveyardIdCounter;
    Counters.Counter private _graveIdCounter;

    // ============ Structs ============

    /**
     * @dev Represents a grave plot with ownership and metadata
     */
    struct Grave {
        uint256 id;
        uint256 graveyardId;
        address owner;           // Current owner (graveyard owner if unreserved)
        uint256 price;           // Price in wei
        bool reserved;           // Reservation status
        bool maintained;         // Maintenance status
        string locationHash;     // IPFS hash for location metadata
        string metadataHash;     // IPFS hash for burial records
        uint256 timestamp;       // Reservation timestamp
    }

    /**
     * @dev Represents a cemetery/graveyard with multiple plots
     */
    struct Graveyard {
        uint256 id;
        address owner;           // Cemetery administrator
        string name;
        string location;
        uint256 numPlots;
        uint256[] graveIds;
        bool active;
    }

    // ============ Mappings ============

    mapping(uint256 => Grave) public graves;
    mapping(uint256 => Graveyard) public graveyards;
    mapping(address => uint256[]) public userGraves;
    mapping(uint256 => uint256) public graveToGraveyard;
    mapping(address => uint256) public pendingWithdrawals;

    // ============ Events ============

    event GraveyardAdded(
        uint256 indexed graveyardId,
        address indexed owner,
        string name,
        string location
    );

    event GraveyardStatusChanged(
        uint256 indexed graveyardId,
        bool active
    );

    event GraveAdded(
        uint256 indexed graveId,
        uint256 indexed graveyardId,
        uint256 price,
        string locationHash
    );

    event GraveReserved(
        uint256 indexed graveId,
        address indexed reservedBy,
        uint256 price,
        uint256 timestamp
    );

    event FeePaid(
        uint256 indexed graveId,
        address indexed payer,
        address indexed recipient,
        uint256 amount
    );

    event GraveMaintained(
        uint256 indexed graveId,
        uint256 timestamp
    );

    event MetadataUpdated(
        uint256 indexed graveId,
        string newMetadataHash
    );

    event FundsWithdrawn(
        address indexed owner,
        uint256 amount
    );

    // ============ Modifiers ============

    /**
     * @dev Ensures only graveyard owner can call function
     */
    modifier onlyGraveyardOwner(uint256 _graveyardId) {
        require(
            graveyards[_graveyardId].owner == msg.sender,
            "Not graveyard owner"
        );
        _;
    }

    /**
     * @dev Ensures only grave owner can call function
     */
    modifier onlyGraveOwner(uint256 _graveId) {
        require(
            graves[_graveId].owner == msg.sender,
            "Not grave owner"
        );
        _;
    }

    /**
     * @dev Ensures grave exists
     */
    modifier graveExists(uint256 _graveId) {
        require(graves[_graveId].id != 0, "Grave does not exist");
        _;
    }

    /**
     * @dev Ensures graveyard exists and is active
     */
    modifier graveyardActive(uint256 _graveyardId) {
        require(graveyards[_graveyardId].id != 0, "Graveyard does not exist");
        require(graveyards[_graveyardId].active, "Graveyard is not active");
        _;
    }

    // ============ Constructor ============

    constructor() {
        // Setup roles - deployer gets all roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GRAVEYARD_MANAGER_ROLE, msg.sender);

        // Initialize counters starting from 1 (0 is used to check existence)
        _graveyardIdCounter.increment();
        _graveIdCounter.increment();
    }

    // ============ Role Management Functions ============

    /**
     * @dev Grant admin role to an address (only admin)
     * @param account Address to grant admin role
     */
    function grantAdminRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
    }

    /**
     * @dev Grant graveyard manager role (only admin)
     * @param account Address to grant manager role
     */
    function grantGraveyardManagerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(GRAVEYARD_MANAGER_ROLE, account);
    }

    /**
     * @dev Revoke admin role (only admin)
     * @param account Address to revoke admin role from
     */
    function revokeAdminRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, account);
    }

    /**
     * @dev Check if address is admin
     * @param account Address to check
     * @return bool True if account has admin role
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /**
     * @dev Check if address is graveyard manager
     * @param account Address to check
     * @return bool True if account has manager role
     */
    function isGraveyardManager(address account) external view returns (bool) {
        return hasRole(GRAVEYARD_MANAGER_ROLE, account);
    }

    // ============ Graveyard Management Functions ============

    /**
     * @dev Add a new graveyard (only contract owner)
     * @param _owner Address of graveyard administrator
     * @param _name Name of the cemetery
     * @param _location Geographic location or address
     * @param _numPlots Total number of plots available
     */
    function addGraveyard(
        address _owner,
        string calldata _name,
        string calldata _location,
        uint256 _numPlots
    ) external onlyRole(ADMIN_ROLE) {
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_numPlots > 0, "Must have at least one plot");

        uint256 newGraveyardId = _graveyardIdCounter.current();
        _graveyardIdCounter.increment();

        graveyards[newGraveyardId] = Graveyard({
            id: newGraveyardId,
            owner: _owner,
            name: _name,
            location: _location,
            numPlots: _numPlots,
            graveIds: new uint256[](0),
            active: true
        });

        emit GraveyardAdded(newGraveyardId, _owner, _name, _location);
    }

    /**
     * @dev Pause or unpause a graveyard
     * @param _graveyardId ID of the graveyard
     * @param _active New active status
     */
    function setGraveyardStatus(
        uint256 _graveyardId,
        bool _active
    ) external onlyGraveyardOwner(_graveyardId) {
        graveyards[_graveyardId].active = _active;
        emit GraveyardStatusChanged(_graveyardId, _active);
    }

    // ============ Grave Management Functions ============

    /**
     * @dev Add a new grave plot to a graveyard
     * @param _graveyardId ID of the graveyard
     * @param _price Price in wei for the grave
     * @param _locationHash IPFS hash containing detailed location data
     */
    function addGrave(
        uint256 _graveyardId,
        uint256 _price,
        string calldata _locationHash
    ) external onlyGraveyardOwner(_graveyardId) graveyardActive(_graveyardId) {
        require(_price > 0, "Price must be greater than 0");
        require(
            graveyards[_graveyardId].graveIds.length < graveyards[_graveyardId].numPlots,
            "Graveyard is full"
        );

        uint256 newGraveId = _graveIdCounter.current();
        _graveIdCounter.increment();

        graves[newGraveId] = Grave({
            id: newGraveId,
            graveyardId: _graveyardId,
            owner: graveyards[_graveyardId].owner,
            price: _price,
            reserved: false,
            maintained: false,
            locationHash: _locationHash,
            metadataHash: "",
            timestamp: 0
        });

        graveyards[_graveyardId].graveIds.push(newGraveId);
        graveToGraveyard[newGraveId] = _graveyardId;

        emit GraveAdded(newGraveId, _graveyardId, _price, _locationHash);
    }

    /**
     * @dev Add multiple graves in a single transaction (gas optimization)
     * @param _graveyardId ID of the graveyard
     * @param _prices Array of prices for each grave
     * @param _locationHashes Array of IPFS hashes for location data
     */
    function addGravesBatch(
        uint256 _graveyardId,
        uint256[] calldata _prices,
        string[] calldata _locationHashes
    ) external onlyGraveyardOwner(_graveyardId) graveyardActive(_graveyardId) {
        require(
            _prices.length == _locationHashes.length,
            "Arrays length mismatch"
        );
        require(
            graveyards[_graveyardId].graveIds.length + _prices.length <=
            graveyards[_graveyardId].numPlots,
            "Would exceed graveyard capacity"
        );

        for (uint256 i = 0; i < _prices.length; i++) {
            require(_prices[i] > 0, "Price must be greater than 0");

            uint256 newGraveId = _graveIdCounter.current();
            _graveIdCounter.increment();

            graves[newGraveId] = Grave({
                id: newGraveId,
                graveyardId: _graveyardId,
                owner: graveyards[_graveyardId].owner,
                price: _prices[i],
                reserved: false,
                maintained: false,
                locationHash: _locationHashes[i],
                metadataHash: "",
                timestamp: 0
            });

            graveyards[_graveyardId].graveIds.push(newGraveId);
            graveToGraveyard[newGraveId] = _graveyardId;

            emit GraveAdded(newGraveId, _graveyardId, _prices[i], _locationHashes[i]);
        }
    }

    // ============ Reservation Functions ============

    /**
     * @dev Reserve a grave plot with payment
     * @param _graveId ID of the grave to reserve
     * @param _metadataHash IPFS hash containing burial metadata (encrypted)
     */
    function reserveGrave(
        uint256 _graveId,
        string calldata _metadataHash
    ) external payable nonReentrant graveExists(_graveId) {
        Grave storage grave = graves[_graveId];

        require(!grave.reserved, "Grave already reserved");
        require(msg.value == grave.price, "Incorrect payment amount");
        require(
            graveyards[grave.graveyardId].active,
            "Graveyard is not active"
        );

        // Update grave ownership and status
        address previousOwner = grave.owner;
        grave.owner = msg.sender;
        grave.reserved = true;
        grave.metadataHash = _metadataHash;
        grave.timestamp = block.timestamp;

        // Add to user's graves
        userGraves[msg.sender].push(_graveId);

        // Credit payment to graveyard owner (pull-over-push pattern)
        pendingWithdrawals[previousOwner] += msg.value;

        emit GraveReserved(_graveId, msg.sender, msg.value, block.timestamp);
        emit FeePaid(_graveId, msg.sender, previousOwner, msg.value);
    }

    /**
     * @dev Update burial metadata for a grave (owner only)
     * @param _graveId ID of the grave
     * @param _newMetadataHash New IPFS hash for metadata
     */
    function updateBurialRecord(
        uint256 _graveId,
        string calldata _newMetadataHash
    ) external graveExists(_graveId) onlyGraveOwner(_graveId) {
        require(graves[_graveId].reserved, "Grave not reserved");

        graves[_graveId].metadataHash = _newMetadataHash;

        emit MetadataUpdated(_graveId, _newMetadataHash);
    }

    // ============ Maintenance Functions ============

    /**
     * @dev Mark a grave as maintained (graveyard owner only)
     * @param _graveId ID of the grave
     */
    function maintainGrave(uint256 _graveId) external graveExists(_graveId) {
        uint256 graveyardId = graveToGraveyard[_graveId];
        require(
            graveyards[graveyardId].owner == msg.sender,
            "Not authorized to maintain"
        );

        graves[_graveId].maintained = true;

        emit GraveMaintained(_graveId, block.timestamp);
    }

    // ============ Payment Functions ============

    /**
     * @dev Withdraw accumulated funds (pull payment pattern)
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    // ============ View Functions ============

    /**
     * @dev Get grave details
     * @param _graveId ID of the grave
     * @return Grave struct
     */
    function getGrave(uint256 _graveId)
        external
        view
        graveExists(_graveId)
        returns (Grave memory)
    {
        return graves[_graveId];
    }

    /**
     * @dev Get graveyard details
     * @param _graveyardId ID of the graveyard
     * @return Graveyard struct
     */
    function getGraveyard(uint256 _graveyardId)
        external
        view
        returns (Graveyard memory)
    {
        require(graveyards[_graveyardId].id != 0, "Graveyard does not exist");
        return graveyards[_graveyardId];
    }

    /**
     * @dev Check if a grave is reserved
     * @param _graveId ID of the grave
     * @return bool reservation status
     */
    function isReserved(uint256 _graveId)
        external
        view
        graveExists(_graveId)
        returns (bool)
    {
        return graves[_graveId].reserved;
    }

    /**
     * @dev Get all graves owned by a user
     * @param _user Address of the user
     * @return Array of grave IDs
     */
    function getUserGraves(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userGraves[_user];
    }

    /**
     * @dev Get all graves in a graveyard
     * @param _graveyardId ID of the graveyard
     * @return Array of grave IDs
     */
    function getGraveyardGraves(uint256 _graveyardId)
        external
        view
        returns (uint256[] memory)
    {
        require(graveyards[_graveyardId].id != 0, "Graveyard does not exist");
        return graveyards[_graveyardId].graveIds;
    }

    /**
     * @dev Get available (unreserved) graves in a graveyard
     * @param _graveyardId ID of the graveyard
     * @return Array of available grave IDs
     */
    function getAvailableGraves(uint256 _graveyardId)
        external
        view
        returns (uint256[] memory)
    {
        require(graveyards[_graveyardId].id != 0, "Graveyard does not exist");

        uint256[] memory allGraves = graveyards[_graveyardId].graveIds;
        uint256 availableCount = 0;

        // Count available graves
        for (uint256 i = 0; i < allGraves.length; i++) {
            if (!graves[allGraves[i]].reserved) {
                availableCount++;
            }
        }

        // Create result array
        uint256[] memory availableGraves = new uint256[](availableCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allGraves.length; i++) {
            if (!graves[allGraves[i]].reserved) {
                availableGraves[index] = allGraves[i];
                index++;
            }
        }

        return availableGraves;
    }

    /**
     * @dev Get pending withdrawal amount for an address
     * @param _owner Address to check
     * @return Amount in wei
     */
    function getPendingWithdrawal(address _owner)
        external
        view
        returns (uint256)
    {
        return pendingWithdrawals[_owner];
    }

    /**
     * @dev Get total number of graveyards
     * @return Count of graveyards
     */
    function getTotalGraveyards() external view returns (uint256) {
        return _graveyardIdCounter.current() - 1;
    }

    /**
     * @dev Get total number of graves
     * @return Count of graves
     */
    function getTotalGraves() external view returns (uint256) {
        return _graveIdCounter.current() - 1;
    }
}
