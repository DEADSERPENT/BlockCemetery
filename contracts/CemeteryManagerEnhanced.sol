// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CemeteryManagerEnhanced
 * @dev Enhanced cemetery management with GPS coordinates and advanced features
 * @notice Includes GPS tracking, analytics support, and public query capabilities
 */
contract CemeteryManagerEnhanced is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GRAVEYARD_MANAGER_ROLE = keccak256("GRAVEYARD_MANAGER_ROLE");
    bytes32 public constant PUBLIC_VIEWER_ROLE = keccak256("PUBLIC_VIEWER_ROLE");

    // ============ State Variables ============

    Counters.Counter private _graveyardIdCounter;
    Counters.Counter private _graveIdCounter;

    // Analytics tracking
    uint256 public totalReservations;
    uint256 public totalRevenue;

    // ============ Structs ============

    /**
     * @dev GPS Coordinates structure
     */
    struct GPSCoordinates {
        int256 latitude;   // Stored as integer (multiply by 1e6 for precision)
        int256 longitude;  // Stored as integer (multiply by 1e6 for precision)
        uint256 accuracy;  // GPS accuracy in meters
        uint256 timestamp; // When coordinates were recorded
    }

    /**
     * @dev Grave plot with GPS and enhanced metadata
     */
    struct Grave {
        uint256 id;
        uint256 graveyardId;
        address owner;
        uint256 price;
        bool reserved;
        bool maintained;
        string locationHash;     // IPFS hash
        string metadataHash;     // IPFS hash for burial records
        uint256 timestamp;
        GPSCoordinates gpsLocation;  // NEW: GPS coordinates
        string deceasedName;     // NEW: For public queries (encrypted)
        uint256 burialDate;      // NEW: Burial date
    }

    /**
     * @dev Cemetery/graveyard with GPS center point
     */
    struct Graveyard {
        uint256 id;
        address owner;
        string name;
        string location;
        uint256 numPlots;
        uint256[] graveIds;
        bool active;
        GPSCoordinates gpsCenterPoint;  // NEW: GPS center
        string boundary;         // NEW: GeoJSON polygon for boundary
        uint256 totalArea;       // NEW: Total area in sq meters
        string imageHash;        // NEW: IPFS hash for cemetery image
    }

    /**
     * @dev Analytics data structure
     */
    struct AnalyticsData {
        uint256 totalGraveyards;
        uint256 totalGraves;
        uint256 totalReserved;
        uint256 totalMaintained;
        uint256 totalRevenue;
        uint256 averagePrice;
    }

    // ============ Mappings ============

    mapping(uint256 => Grave) public graves;
    mapping(uint256 => Graveyard) public graveyards;
    mapping(address => uint256[]) public userGraves;
    mapping(uint256 => uint256) public graveToGraveyard;
    mapping(address => uint256) public pendingWithdrawals;

    // NEW: Public search capabilities
    mapping(bytes32 => uint256[]) private nameHashToGraveIds;
    mapping(uint256 => uint256) public yearlyReservations; // year => count
    mapping(uint256 => uint256) public monthlyRevenue; // YYYYMM => revenue

    // ============ Events ============

    event GraveyardAdded(
        uint256 indexed graveyardId,
        address indexed owner,
        string name,
        string location,
        int256 latitude,
        int256 longitude
    );

    event GPSUpdated(
        uint256 indexed graveId,
        int256 latitude,
        int256 longitude,
        uint256 accuracy
    );

    event GraveyardGPSUpdated(
        uint256 indexed graveyardId,
        int256 latitude,
        int256 longitude
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

    event BurialRecordUpdated(
        uint256 indexed graveId,
        string metadataHash
    );

    // ============ Constructor ============

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GRAVEYARD_MANAGER_ROLE, msg.sender);

        _graveyardIdCounter.increment();
        _graveIdCounter.increment();
    }

    // ============ Graveyard Management with GPS ============

    /**
     * @dev Add a new graveyard with GPS coordinates
     */
    function addGraveyardWithGPS(
        address _owner,
        string memory _name,
        string memory _location,
        uint256 _numPlots,
        int256 _latitude,
        int256 _longitude,
        string memory _boundary,
        uint256 _totalArea
    ) external onlyRole(ADMIN_ROLE) {
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_numPlots > 0, "Must have at least one plot");

        uint256 newGraveyardId = _graveyardIdCounter.current();

        GPSCoordinates memory gpsCenter = GPSCoordinates({
            latitude: _latitude,
            longitude: _longitude,
            accuracy: 10, // Default 10m accuracy
            timestamp: block.timestamp
        });

        graveyards[newGraveyardId] = Graveyard({
            id: newGraveyardId,
            owner: _owner,
            name: _name,
            location: _location,
            numPlots: _numPlots,
            graveIds: new uint256[](0),
            active: true,
            gpsCenterPoint: gpsCenter,
            boundary: _boundary,
            totalArea: _totalArea,
            imageHash: ""
        });

        _graveyardIdCounter.increment();

        emit GraveyardAdded(
            newGraveyardId,
            _owner,
            _name,
            _location,
            _latitude,
            _longitude
        );
    }

    /**
     * @dev Update graveyard GPS coordinates
     */
    function updateGraveyardGPS(
        uint256 _graveyardId,
        int256 _latitude,
        int256 _longitude,
        uint256 _accuracy
    ) external {
        Graveyard storage graveyard = graveyards[_graveyardId];
        require(graveyard.id != 0, "Graveyard does not exist");
        require(
            msg.sender == graveyard.owner || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        graveyard.gpsCenterPoint = GPSCoordinates({
            latitude: _latitude,
            longitude: _longitude,
            accuracy: _accuracy,
            timestamp: block.timestamp
        });

        emit GraveyardGPSUpdated(_graveyardId, _latitude, _longitude);
    }

    // ============ Grave Management with GPS ============

    /**
     * @dev Add a grave with GPS coordinates
     */
    function addGraveWithGPS(
        uint256 _graveyardId,
        uint256 _price,
        string memory _locationHash,
        int256 _latitude,
        int256 _longitude,
        uint256 _accuracy
    ) external {
        Graveyard storage graveyard = graveyards[_graveyardId];
        require(graveyard.id != 0, "Graveyard does not exist");
        require(
            msg.sender == graveyard.owner || hasRole(GRAVEYARD_MANAGER_ROLE, msg.sender),
            "Not graveyard owner or manager"
        );
        require(_price > 0, "Price must be greater than zero");
        require(graveyard.active, "Graveyard is not active");

        uint256 newGraveId = _graveIdCounter.current();

        GPSCoordinates memory gpsLoc = GPSCoordinates({
            latitude: _latitude,
            longitude: _longitude,
            accuracy: _accuracy,
            timestamp: block.timestamp
        });

        graves[newGraveId] = Grave({
            id: newGraveId,
            graveyardId: _graveyardId,
            owner: graveyard.owner,
            price: _price,
            reserved: false,
            maintained: false,
            locationHash: _locationHash,
            metadataHash: "",
            timestamp: 0,
            gpsLocation: gpsLoc,
            deceasedName: "",
            burialDate: 0
        });

        graveyard.graveIds.push(newGraveId);
        graveToGraveyard[newGraveId] = _graveyardId;
        _graveIdCounter.increment();

        emit GraveAdded(newGraveId, _graveyardId, _price, _locationHash);
        emit GPSUpdated(newGraveId, _latitude, _longitude, _accuracy);
    }

    /**
     * @dev Update grave GPS coordinates
     */
    function updateGraveGPS(
        uint256 _graveId,
        int256 _latitude,
        int256 _longitude,
        uint256 _accuracy
    ) external {
        Grave storage grave = graves[_graveId];
        require(grave.id != 0, "Grave does not exist");

        Graveyard storage graveyard = graveyards[grave.graveyardId];
        require(
            msg.sender == graveyard.owner || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        grave.gpsLocation = GPSCoordinates({
            latitude: _latitude,
            longitude: _longitude,
            accuracy: _accuracy,
            timestamp: block.timestamp
        });

        emit GPSUpdated(_graveId, _latitude, _longitude, _accuracy);
    }

    // ============ Public Query Functions ============

    /**
     * @dev Search graves by deceased name (returns encrypted name hash)
     */
    function searchByDeceasedName(bytes32 _nameHash)
        external
        view
        returns (uint256[] memory)
    {
        return nameHashToGraveIds[_nameHash];
    }

    /**
     * @dev Get grave GPS coordinates (public readable)
     */
    function getGraveGPS(uint256 _graveId)
        external
        view
        returns (
            int256 latitude,
            int256 longitude,
            uint256 accuracy,
            uint256 timestamp
        )
    {
        GPSCoordinates memory gps = graves[_graveId].gpsLocation;
        return (gps.latitude, gps.longitude, gps.accuracy, gps.timestamp);
    }

    /**
     * @dev Get graveyard GPS center
     */
    function getGraveyardGPS(uint256 _graveyardId)
        external
        view
        returns (
            int256 latitude,
            int256 longitude,
            uint256 accuracy,
            uint256 timestamp
        )
    {
        GPSCoordinates memory gps = graveyards[_graveyardId].gpsCenterPoint;
        return (gps.latitude, gps.longitude, gps.accuracy, gps.timestamp);
    }

    // ============ Analytics Functions ============

    /**
     * @dev Get comprehensive analytics data
     */
    function getAnalytics() external view returns (AnalyticsData memory) {
        uint256 totalGraveyardsCount = _graveyardIdCounter.current() - 1;
        uint256 totalGravesCount = _graveIdCounter.current() - 1;

        uint256 reservedCount = 0;
        uint256 maintainedCount = 0;
        uint256 totalPriceSum = 0;

        for (uint256 i = 1; i < _graveIdCounter.current(); i++) {
            if (graves[i].reserved) {
                reservedCount++;
            }
            if (graves[i].maintained) {
                maintainedCount++;
            }
            totalPriceSum += graves[i].price;
        }

        uint256 avgPrice = totalGravesCount > 0 ? totalPriceSum / totalGravesCount : 0;

        return AnalyticsData({
            totalGraveyards: totalGraveyardsCount,
            totalGraves: totalGravesCount,
            totalReserved: reservedCount,
            totalMaintained: maintainedCount,
            totalRevenue: totalRevenue,
            averagePrice: avgPrice
        });
    }

    /**
     * @dev Get yearly reservation statistics
     */
    function getYearlyStats(uint256 _year) external view returns (uint256) {
        return yearlyReservations[_year];
    }

    /**
     * @dev Get monthly revenue
     */
    function getMonthlyRevenue(uint256 _yearMonth) external view returns (uint256) {
        return monthlyRevenue[_yearMonth];
    }

    // ============ Existing Functions (maintained for compatibility) ============

    /**
     * @dev Check if address has admin role
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /**
     * @dev Get total number of graveyards
     */
    function getTotalGraveyards() external view returns (uint256) {
        return _graveyardIdCounter.current() - 1;
    }

    /**
     * @dev Get total number of graves
     */
    function getTotalGraves() external view returns (uint256) {
        return _graveIdCounter.current() - 1;
    }

    /**
     * @dev Get graveyard details
     */
    function getGraveyard(uint256 _graveyardId)
        external
        view
        returns (Graveyard memory)
    {
        return graveyards[_graveyardId];
    }

    /**
     * @dev Get grave details
     */
    function getGrave(uint256 _graveId)
        external
        view
        returns (Grave memory)
    {
        return graves[_graveId];
    }
}
