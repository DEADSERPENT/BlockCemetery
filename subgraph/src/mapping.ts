/**
 * The Graph Mappings for CemeteryManagerV2
 * Processes blockchain events and builds the queryable database
 */

import {
  GraveyardAdded,
  GraveAdded,
  GraveReserved,
  GraveMaintained,
  GPSUpdated,
  GraveyardGPSUpdated,
  BurialRecordUpdated,
} from "../generated/CemeteryManagerV2/CemeteryManagerV2";
import {
  Graveyard,
  Grave,
  Reservation,
  GlobalStats,
  DailyStats,
  MonthlyStats,
  User,
  GPSUpdate,
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

/**
 * Handle new graveyard creation
 */
export function handleGraveyardAdded(event: GraveyardAdded): void {
  let graveyard = new Graveyard(event.params.graveyardId.toString());

  graveyard.owner = event.params.owner;
  graveyard.name = event.params.name;
  graveyard.location = event.params.location;
  graveyard.latitude = event.params.latitude;
  graveyard.longitude = event.params.longitude;
  graveyard.active = true;
  graveyard.numPlots = BigInt.fromI32(0);
  graveyard.reservedCount = BigInt.fromI32(0);
  graveyard.maintainedCount = BigInt.fromI32(0);
  graveyard.totalRevenue = BigInt.fromI32(0);
  graveyard.createdAt = event.block.timestamp;
  graveyard.updatedAt = event.block.timestamp;

  // These will be set later via update functions
  graveyard.gpsAccuracy = BigInt.fromI32(10);
  graveyard.gpsTimestamp = event.block.timestamp;
  graveyard.boundaryHash = Bytes.empty();

  graveyard.save();

  // Update global stats
  updateGlobalStats(event.block.timestamp);
}

/**
 * Handle new grave creation
 */
export function handleGraveAdded(event: GraveAdded): void {
  let grave = new Grave(event.params.graveId.toString());
  let graveyard = Graveyard.load(event.params.graveyardId.toString());

  if (graveyard) {
    grave.graveyard = graveyard.id;
    grave.owner = graveyard.owner;
  } else {
    // Fallback if graveyard not found (shouldn't happen)
    grave.graveyard = event.params.graveyardId.toString();
    grave.owner = Bytes.empty();
  }

  grave.price = event.params.price;
  grave.reserved = false;
  grave.maintained = false;
  grave.locationHash = event.params.locationHash;
  grave.latitude = BigInt.fromI32(0);
  grave.longitude = BigInt.fromI32(0);
  grave.gpsAccuracy = BigInt.fromI32(0);
  grave.gpsTimestamp = BigInt.fromI32(0);
  grave.createdAt = event.block.timestamp;
  grave.updatedAt = event.block.timestamp;

  grave.save();

  // Update global stats
  updateGlobalStats(event.block.timestamp);
}

/**
 * Handle grave reservation
 */
export function handleGraveReserved(event: GraveReserved): void {
  let grave = Grave.load(event.params.graveId.toString());

  if (grave) {
    // Update grave
    grave.owner = event.params.reservedBy;
    grave.reserved = true;
    grave.reservedAt = event.params.timestamp;
    grave.updatedAt = event.block.timestamp;
    grave.save();

    // Create reservation entity
    let reservation = new Reservation(event.params.graveId.toString());
    reservation.grave = grave.id;
    reservation.reservedBy = event.params.reservedBy;
    reservation.amount = event.params.price;
    reservation.timestamp = event.params.timestamp;
    reservation.transactionHash = event.transaction.hash;
    reservation.save();

    // Update graveyard stats
    let graveyard = Graveyard.load(event.params.graveyardId.toString());
    if (graveyard) {
      graveyard.reservedCount = graveyard.reservedCount.plus(BigInt.fromI32(1));
      graveyard.totalRevenue = graveyard.totalRevenue.plus(event.params.price);
      graveyard.updatedAt = event.block.timestamp;
      graveyard.save();
    }

    // Update user stats
    updateUserStats(event.params.reservedBy, event.params.price, event.block.timestamp);

    // Update daily stats
    updateDailyStats(event.block.timestamp, event.params.price, "reservation");

    // Update monthly stats
    updateMonthlyStats(event.block.timestamp, event.params.price, "reservation");

    // Update global stats
    updateGlobalStats(event.block.timestamp);
  }
}

/**
 * Handle grave maintenance
 */
export function handleGraveMaintained(event: GraveMaintained): void {
  let grave = Grave.load(event.params.graveId.toString());

  if (grave) {
    grave.maintained = true;
    grave.updatedAt = event.block.timestamp;
    grave.save();

    // Update graveyard stats
    if (grave.graveyard) {
      let graveyard = Graveyard.load(grave.graveyard);
      if (graveyard) {
        graveyard.maintainedCount = graveyard.maintainedCount.plus(BigInt.fromI32(1));
        graveyard.updatedAt = event.block.timestamp;
        graveyard.save();
      }
    }

    // Update daily stats
    updateDailyStats(event.block.timestamp, BigInt.fromI32(0), "maintenance");

    // Update monthly stats
    updateMonthlyStats(event.block.timestamp, BigInt.fromI32(0), "maintenance");

    // Update global stats
    updateGlobalStats(event.block.timestamp);
  }
}

/**
 * Handle grave GPS update
 */
export function handleGPSUpdated(event: GPSUpdated): void {
  let grave = Grave.load(event.params.graveId.toString());

  if (grave) {
    grave.latitude = event.params.latitude;
    grave.longitude = event.params.longitude;
    grave.gpsAccuracy = event.params.accuracy;
    grave.gpsTimestamp = event.block.timestamp;
    grave.updatedAt = event.block.timestamp;
    grave.save();
  }

  // Create GPS update record
  let gpsUpdate = new GPSUpdate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  gpsUpdate.graveId = event.params.graveId;
  gpsUpdate.latitude = event.params.latitude;
  gpsUpdate.longitude = event.params.longitude;
  gpsUpdate.accuracy = event.params.accuracy;
  gpsUpdate.timestamp = event.block.timestamp;
  gpsUpdate.transactionHash = event.transaction.hash;
  gpsUpdate.save();
}

/**
 * Handle graveyard GPS update
 */
export function handleGraveyardGPSUpdated(event: GraveyardGPSUpdated): void {
  let graveyard = Graveyard.load(event.params.graveyardId.toString());

  if (graveyard) {
    graveyard.latitude = event.params.latitude;
    graveyard.longitude = event.params.longitude;
    graveyard.gpsTimestamp = event.block.timestamp;
    graveyard.updatedAt = event.block.timestamp;
    graveyard.save();
  }

  // Create GPS update record
  let gpsUpdate = new GPSUpdate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  gpsUpdate.graveyardId = event.params.graveyardId;
  gpsUpdate.latitude = event.params.latitude;
  gpsUpdate.longitude = event.params.longitude;
  gpsUpdate.timestamp = event.block.timestamp;
  gpsUpdate.transactionHash = event.transaction.hash;
  gpsUpdate.save();
}

/**
 * Handle burial record update
 */
export function handleBurialRecordUpdated(event: BurialRecordUpdated): void {
  let grave = Grave.load(event.params.graveId.toString());

  if (grave) {
    grave.metadataHash = event.params.metadataHash;
    grave.updatedAt = event.block.timestamp;
    grave.save();
  }
}

/**
 * Update global statistics
 */
function updateGlobalStats(timestamp: BigInt): void {
  let stats = GlobalStats.load("1");

  if (!stats) {
    stats = new GlobalStats("1");
    stats.totalGraveyards = BigInt.fromI32(0);
    stats.totalGraves = BigInt.fromI32(0);
    stats.totalReserved = BigInt.fromI32(0);
    stats.totalMaintained = BigInt.fromI32(0);
    stats.totalRevenue = BigInt.fromI32(0);
    stats.averagePrice = BigInt.fromI32(0);
  }

  // Recalculate from aggregates
  // Note: In production, you'd increment these in respective handlers
  stats.updatedAt = timestamp;
  stats.save();
}

/**
 * Update user statistics
 */
function updateUserStats(
  userAddress: Bytes,
  amount: BigInt,
  timestamp: BigInt
): void {
  let user = User.load(userAddress.toHex());

  if (!user) {
    user = new User(userAddress.toHex());
    user.totalSpent = BigInt.fromI32(0);
    user.graveCount = BigInt.fromI32(0);
    user.createdAt = timestamp;
  }

  user.totalSpent = user.totalSpent.plus(amount);
  user.graveCount = user.graveCount.plus(BigInt.fromI32(1));
  user.lastActivity = timestamp;
  user.save();
}

/**
 * Update daily statistics
 */
function updateDailyStats(
  timestamp: BigInt,
  revenue: BigInt,
  type: string
): void {
  // Calculate day ID (YYYY-MM-DD format)
  let dayTimestamp = timestamp.toI32() - (timestamp.toI32() % 86400);
  let dayId = dayTimestamp.toString();

  let stats = DailyStats.load(dayId);

  if (!stats) {
    stats = new DailyStats(dayId);
    stats.date = BigInt.fromI32(dayTimestamp);
    stats.reservations = BigInt.fromI32(0);
    stats.revenue = BigInt.fromI32(0);
    stats.maintenances = BigInt.fromI32(0);
  }

  if (type == "reservation") {
    stats.reservations = stats.reservations.plus(BigInt.fromI32(1));
    stats.revenue = stats.revenue.plus(revenue);
  } else if (type == "maintenance") {
    stats.maintenances = stats.maintenances.plus(BigInt.fromI32(1));
  }

  stats.save();
}

/**
 * Update monthly statistics
 */
function updateMonthlyStats(
  timestamp: BigInt,
  revenue: BigInt,
  type: string
): void {
  // Calculate month ID (YYYY-MM format)
  // Simplified - assumes 30 days per month
  let monthTimestamp = timestamp.toI32() - (timestamp.toI32() % 2592000);
  let monthId = monthTimestamp.toString();

  let stats = MonthlyStats.load(monthId);

  if (!stats) {
    stats = new MonthlyStats(monthId);
    stats.month = BigInt.fromI32(monthTimestamp);
    stats.reservations = BigInt.fromI32(0);
    stats.revenue = BigInt.fromI32(0);
    stats.maintenances = BigInt.fromI32(0);
  }

  if (type == "reservation") {
    stats.reservations = stats.reservations.plus(BigInt.fromI32(1));
    stats.revenue = stats.revenue.plus(revenue);
  } else if (type == "maintenance") {
    stats.maintenances = stats.maintenances.plus(BigInt.fromI32(1));
  }

  stats.save();
}
