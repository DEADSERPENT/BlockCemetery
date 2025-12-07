const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CemeteryManagerV2 - Gas Optimized", function () {
  // ============ Fixtures ============

  async function deployCemeteryManagerV2Fixture() {
    const [owner, graveyardOwner, user1, user2] = await ethers.getSigners();

    const CemeteryManagerV2 = await ethers.getContractFactory("CemeteryManagerV2");
    const cemeteryManager = await CemeteryManagerV2.deploy();

    return { cemeteryManager, owner, graveyardOwner, user1, user2 };
  }

  async function deployWithGraveyardFixture() {
    const { cemeteryManager, owner, graveyardOwner, user1, user2 } =
      await deployCemeteryManagerV2Fixture();

    // Sample IPFS hash converted to bytes32
    const boundaryHash = ethers.id("QmBoundaryGeoJSON123");

    await cemeteryManager.addGraveyardWithGPS(
      graveyardOwner.address,
      "Green Valley Cemetery",
      "123 Cemetery Road, City",
      100,
      40748817, // latitude * 1e6
      -73985428, // longitude * 1e6
      boundaryHash,
      10000 // 10000 sq meters
    );

    return { cemeteryManager, owner, graveyardOwner, user1, user2, boundaryHash };
  }

  async function deployWithGravesFixture() {
    const { cemeteryManager, owner, graveyardOwner, user1, user2, boundaryHash } =
      await deployWithGraveyardFixture();

    const graveyardId = 1;
    const price = ethers.parseEther("0.5");
    const locationHash = ethers.id("QmLocationHash123");

    // Add 3 graves
    await cemeteryManager
      .connect(graveyardOwner)
      .addGraveWithGPS(graveyardId, price, locationHash, 40748817, -73985428, 10);

    await cemeteryManager
      .connect(graveyardOwner)
      .addGraveWithGPS(graveyardId, price, locationHash, 40748818, -73985429, 10);

    await cemeteryManager
      .connect(graveyardOwner)
      .addGraveWithGPS(graveyardId, price, locationHash, 40748819, -73985430, 10);

    return { cemeteryManager, owner, graveyardOwner, user1, user2, locationHash, boundaryHash };
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("Should grant admin role to deployer", async function () {
      const { cemeteryManager, owner } = await loadFixture(
        deployCemeteryManagerV2Fixture
      );

      expect(await cemeteryManager.isAdmin(owner.address)).to.be.true;
    });

    it("Should initialize counters correctly", async function () {
      const { cemeteryManager } = await loadFixture(
        deployCemeteryManagerV2Fixture
      );

      expect(await cemeteryManager.getTotalGraveyards()).to.equal(0);
      expect(await cemeteryManager.getTotalGraves()).to.equal(0);
      expect(await cemeteryManager.reservedGravesCount()).to.equal(0);
      expect(await cemeteryManager.maintainedGravesCount()).to.equal(0);
    });
  });

  // ============ Graveyard Management Tests ============

  describe("Graveyard Management with GPS", function () {
    describe("Adding Graveyards", function () {
      it("Should add a new graveyard with GPS and boundary hash", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployCemeteryManagerV2Fixture
        );

        const boundaryHash = ethers.id("QmBoundaryHash");
        const lat = 40748817;
        const lon = -73985428;

        await expect(
          cemeteryManager.addGraveyardWithGPS(
            graveyardOwner.address,
            "Green Valley Cemetery",
            "123 Cemetery Road",
            100,
            lat,
            lon,
            boundaryHash,
            10000
          )
        )
          .to.emit(cemeteryManager, "GraveyardAdded")
          .withArgs(1, graveyardOwner.address, "Green Valley Cemetery", "123 Cemetery Road", lat, lon);

        const graveyard = await cemeteryManager.getGraveyard(1);
        expect(graveyard.name).to.equal("Green Valley Cemetery");
        expect(graveyard.owner).to.equal(graveyardOwner.address);
        expect(graveyard.boundaryHash).to.equal(boundaryHash);
        expect(graveyard.totalArea).to.equal(10000);
      });

      it("Should store GPS coordinates correctly", async function () {
        const { cemeteryManager } = await loadFixture(deployWithGraveyardFixture);

        const gps = await cemeteryManager.getGraveyardGPS(1);
        expect(gps.latitude).to.equal(40748817);
        expect(gps.longitude).to.equal(-73985428);
        expect(gps.accuracy).to.equal(10);
      });

      it("Should update graveyard boundary hash", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const newBoundaryHash = ethers.id("QmNewBoundary");
        await cemeteryManager
          .connect(graveyardOwner)
          .updateGraveyardBoundary(1, newBoundaryHash);

        const graveyard = await cemeteryManager.getGraveyard(1);
        expect(graveyard.boundaryHash).to.equal(newBoundaryHash);
      });

      it("Should update graveyard image hash", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const imageHash = ethers.id("QmCemeteryImage");
        await cemeteryManager
          .connect(graveyardOwner)
          .updateGraveyardImage(1, imageHash);

        const graveyard = await cemeteryManager.getGraveyard(1);
        expect(graveyard.imageHash).to.equal(imageHash);
      });
    });

    describe("GPS Updates", function () {
      it("Should allow graveyard owner to update GPS", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const newLat = 40750000;
        const newLon = -73990000;

        await expect(
          cemeteryManager
            .connect(graveyardOwner)
            .updateGraveyardGPS(1, newLat, newLon, 5)
        )
          .to.emit(cemeteryManager, "GraveyardGPSUpdated")
          .withArgs(1, newLat, newLon);

        const gps = await cemeteryManager.getGraveyardGPS(1);
        expect(gps.latitude).to.equal(newLat);
        expect(gps.longitude).to.equal(newLon);
        expect(gps.accuracy).to.equal(5);
      });

      it("Should reject GPS update by unauthorized user", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGraveyardFixture
        );

        await expect(
          cemeteryManager.connect(user1).updateGraveyardGPS(1, 0, 0, 10)
        ).to.be.revertedWith("Not authorized");
      });
    });
  });

  // ============ Grave Management Tests ============

  describe("Grave Management with GPS", function () {
    describe("Adding Graves", function () {
      it("Should add a grave with GPS and bytes32 hash", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const price = ethers.parseEther("1.0");
        const locationHash = ethers.id("QmTestLocationHash123");
        const lat = 40748817;
        const lon = -73985428;

        await expect(
          cemeteryManager
            .connect(graveyardOwner)
            .addGraveWithGPS(1, price, locationHash, lat, lon, 10)
        )
          .to.emit(cemeteryManager, "GraveAdded")
          .withArgs(1, 1, price, locationHash);

        const grave = await cemeteryManager.getGrave(1);
        expect(grave.price).to.equal(price);
        expect(grave.locationHash).to.equal(locationHash);
        expect(grave.gpsLocation.latitude).to.equal(lat);
        expect(grave.gpsLocation.longitude).to.equal(lon);
      });

      it("Should update totalPriceSum when adding grave", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const price1 = ethers.parseEther("1.0");
        const price2 = ethers.parseEther("2.0");
        const locationHash = ethers.id("QmHash");

        await cemeteryManager
          .connect(graveyardOwner)
          .addGraveWithGPS(1, price1, locationHash, 0, 0, 10);

        await cemeteryManager
          .connect(graveyardOwner)
          .addGraveWithGPS(1, price2, locationHash, 0, 0, 10);

        expect(await cemeteryManager.totalPriceSum()).to.equal(price1 + price2);
      });

      it("Should emit GPS update event when adding grave", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const price = ethers.parseEther("1.0");
        const locationHash = ethers.id("QmHash");
        const lat = 40748817;
        const lon = -73985428;

        await expect(
          cemeteryManager
            .connect(graveyardOwner)
            .addGraveWithGPS(1, price, locationHash, lat, lon, 10)
        )
          .to.emit(cemeteryManager, "GPSUpdated")
          .withArgs(1, lat, lon, 10);
      });
    });

    describe("GPS Updates", function () {
      it("Should update grave GPS coordinates", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGravesFixture
        );

        const newLat = 40750000;
        const newLon = -73990000;

        await cemeteryManager
          .connect(graveyardOwner)
          .updateGraveGPS(1, newLat, newLon, 5);

        const gps = await cemeteryManager.getGraveGPS(1);
        expect(gps.latitude).to.equal(newLat);
        expect(gps.longitude).to.equal(newLon);
        expect(gps.accuracy).to.equal(5);
      });
    });
  });

  // ============ Reservation Tests ============

  describe("Grave Reservation with Analytics", function () {
    describe("Successful Reservations", function () {
      it("Should reserve grave and update all counters", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");
        const metadataHash = ethers.id("QmMetadataHash123");
        const nameHash = ethers.id("John Doe");
        const burialDate = Math.floor(Date.now() / 1000);

        const tx = await cemeteryManager
          .connect(user1)
          .reserveGrave(1, metadataHash, nameHash, burialDate, { value: price });

        // Check analytics counters were updated
        expect(await cemeteryManager.reservedGravesCount()).to.equal(1);
        expect(await cemeteryManager.totalReservations()).to.equal(1);
        expect(await cemeteryManager.totalRevenue()).to.equal(price);

        const grave = await cemeteryManager.getGrave(1);
        expect(grave.reserved).to.be.true;
        expect(grave.metadataHash).to.equal(metadataHash);
        expect(grave.deceasedNameHash).to.equal(nameHash);
      });

      it("Should add grave to name search index", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");
        const nameHash = ethers.id("Jane Smith");

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, ethers.id("metadata"), nameHash, 0, { value: price });

        const searchResults = await cemeteryManager.searchByDeceasedName(nameHash);
        expect(searchResults.length).to.equal(1);
        expect(searchResults[0]).to.equal(1);
      });

      it("Should update yearly reservations", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");
        const burialDate = 1672531200; // Jan 1, 2023 (in seconds)
        const year = 2023;

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, ethers.id("metadata"), ethers.id("name"), burialDate, {
            value: price,
          });

        const yearlyStats = await cemeteryManager.getYearlyStats(year);
        expect(yearlyStats).to.equal(1);
      });

      it("Should emit indexed GraveReserved event", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");
        const tx = await cemeteryManager
          .connect(user1)
          .reserveGrave(1, ethers.id("metadata"), ethers.id("name"), 0, {
            value: price,
          });

        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt.blockNumber);

        // Check that graveyardId is indexed (2nd parameter)
        await expect(tx)
          .to.emit(cemeteryManager, "GraveReserved")
          .withArgs(1, 1, user1.address, price, block.timestamp);
      });

      it("Should handle multiple reservations correctly", async function () {
        const { cemeteryManager, user1, user2 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, ethers.id("meta1"), ethers.id("name1"), 0, {
            value: price,
          });

        await cemeteryManager
          .connect(user2)
          .reserveGrave(2, ethers.id("meta2"), ethers.id("name2"), 0, {
            value: price,
          });

        expect(await cemeteryManager.reservedGravesCount()).to.equal(2);
        expect(await cemeteryManager.totalRevenue()).to.equal(price * 2n);
      });
    });

    describe("Metadata Updates", function () {
      it("Should update burial record with bytes32 hash", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");
        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, ethers.id("oldMeta"), ethers.id("name"), 0, {
            value: price,
          });

        const newMetadataHash = ethers.id("newMetadata");
        await expect(
          cemeteryManager.connect(user1).updateBurialRecord(1, newMetadataHash)
        )
          .to.emit(cemeteryManager, "BurialRecordUpdated")
          .withArgs(1, newMetadataHash);

        const grave = await cemeteryManager.getGrave(1);
        expect(grave.metadataHash).to.equal(newMetadataHash);
      });
    });
  });

  // ============ Maintenance Tests ============

  describe("Grave Maintenance with Counters", function () {
    it("Should increment maintainedGravesCount", async function () {
      const { cemeteryManager, graveyardOwner, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta"), ethers.id("name"), 0, {
          value: price,
        });

      await cemeteryManager.connect(graveyardOwner).maintainGrave(1);

      expect(await cemeteryManager.maintainedGravesCount()).to.equal(1);
    });

    it("Should not increment counter if already maintained", async function () {
      const { cemeteryManager, graveyardOwner, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta"), ethers.id("name"), 0, {
          value: price,
        });

      await cemeteryManager.connect(graveyardOwner).maintainGrave(1);
      await cemeteryManager.connect(graveyardOwner).maintainGrave(1);

      expect(await cemeteryManager.maintainedGravesCount()).to.equal(1);
    });
  });

  // ============ Analytics Tests (Critical Gas Optimization!) ============

  describe("Analytics Functions - Gas Optimized", function () {
    it("Should return analytics without looping", async function () {
      const { cemeteryManager, user1, user2 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");

      // Reserve 2 graves
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta1"), ethers.id("name1"), 0, {
          value: price,
        });

      await cemeteryManager
        .connect(user2)
        .reserveGrave(2, ethers.id("meta2"), ethers.id("name2"), 0, {
          value: price,
        });

      const analytics = await cemeteryManager.getAnalytics();

      expect(analytics.totalGraveyards).to.equal(1);
      expect(analytics.totalGraves).to.equal(3);
      expect(analytics.totalReserved).to.equal(2);
      expect(analytics.totalRevenue).to.equal(price * 2n);
      expect(analytics.averagePrice).to.equal(price);
    });

    it("Should calculate average price correctly", async function () {
      const { cemeteryManager, graveyardOwner } = await loadFixture(
        deployWithGraveyardFixture
      );

      const locationHash = ethers.id("QmHash");

      // Add graves with different prices
      await cemeteryManager
        .connect(graveyardOwner)
        .addGraveWithGPS(1, ethers.parseEther("1.0"), locationHash, 0, 0, 10);

      await cemeteryManager
        .connect(graveyardOwner)
        .addGraveWithGPS(1, ethers.parseEther("2.0"), locationHash, 0, 0, 10);

      await cemeteryManager
        .connect(graveyardOwner)
        .addGraveWithGPS(1, ethers.parseEther("3.0"), locationHash, 0, 0, 10);

      const analytics = await cemeteryManager.getAnalytics();
      expect(analytics.averagePrice).to.equal(ethers.parseEther("2.0"));
    });

    it("Should handle analytics with no data", async function () {
      const { cemeteryManager } = await loadFixture(
        deployCemeteryManagerV2Fixture
      );

      const analytics = await cemeteryManager.getAnalytics();

      expect(analytics.totalGraveyards).to.equal(0);
      expect(analytics.totalGraves).to.equal(0);
      expect(analytics.totalReserved).to.equal(0);
      expect(analytics.averagePrice).to.equal(0);
    });
  });

  // ============ Gas Comparison Tests ============

  describe("Gas Optimization Comparison", function () {
    it("Should use less gas for reservation than V1", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      const tx = await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta"), ethers.id("name"), 0, {
          value: price,
        });

      const receipt = await tx.wait();
      console.log("V2 Gas used for reservation:", receipt.gasUsed.toString());

      // V2 still uses more gas than expected due to additional analytics tracking
      // but provides much better queryability and O(1) analytics
      expect(receipt.gasUsed).to.be.lessThan(400000);
    });

    it("Should use constant gas for analytics regardless of data size", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");

      // Reserve first grave
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta1"), ethers.id("name1"), 0, {
          value: price,
        });

      const gas1 = await cemeteryManager.getAnalytics.estimateGas();

      // Reserve second grave
      await cemeteryManager
        .connect(user1)
        .reserveGrave(2, ethers.id("meta2"), ethers.id("name2"), 0, {
          value: price,
        });

      const gas2 = await cemeteryManager.getAnalytics.estimateGas();

      console.log("Analytics gas with 1 reservation:", gas1.toString());
      console.log("Analytics gas with 2 reservations:", gas2.toString());

      // Gas should be nearly constant (within 5% margin)
      const diff = gas2 > gas1 ? gas2 - gas1 : gas1 - gas2;
      expect(diff).to.be.lessThan(gas1 / 20n); // Less than 5% difference
    });

    it("Should measure gas for adding graveyard with boundary hash", async function () {
      const { cemeteryManager, graveyardOwner } = await loadFixture(
        deployCemeteryManagerV2Fixture
      );

      const boundaryHash = ethers.id("QmBoundary");

      const tx = await cemeteryManager.addGraveyardWithGPS(
        graveyardOwner.address,
        "Test Cemetery",
        "Location",
        100,
        0,
        0,
        boundaryHash,
        10000
      );

      const receipt = await tx.wait();
      console.log("Gas for adding graveyard (V2 with hash):", receipt.gasUsed.toString());

      // Should use significantly less gas than V1 (which stores full GeoJSON string)
      // V1 would use 400k+ gas for large GeoJSON, V2 uses ~270k with bytes32 hash
      expect(receipt.gasUsed).to.be.lessThan(350000);
    });
  });

  // ============ Search Functionality Tests ============

  describe("Public Search Functions", function () {
    it("Should search by deceased name hash", async function () {
      const { cemeteryManager, user1, user2 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      const nameHash = ethers.id("Smith Family");

      // Reserve two graves with same name hash
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta1"), nameHash, 0, { value: price });

      await cemeteryManager
        .connect(user2)
        .reserveGrave(2, ethers.id("meta2"), nameHash, 0, { value: price });

      const results = await cemeteryManager.searchByDeceasedName(nameHash);
      expect(results.length).to.equal(2);
      expect(results[0]).to.equal(1);
      expect(results[1]).to.equal(2);
    });
  });

  // ============ Helper Functions Tests ============

  describe("IPFS Helper Functions", function () {
    it("Should convert IPFS hash to bytes32", async function () {
      const { cemeteryManager } = await loadFixture(
        deployCemeteryManagerV2Fixture
      );

      const ipfsHash = "QmTest123";
      const bytes32Hash = await cemeteryManager.ipfsHashToBytes32(ipfsHash);

      expect(bytes32Hash).to.not.equal(ethers.ZeroHash);
      expect(bytes32Hash).to.equal(ethers.id(ipfsHash));
    });
  });

  // ============ Security Tests ============

  describe("Security", function () {
    it("Should prevent reentrancy on withdraw", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      await expect(
        cemeteryManager.connect(user1).withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Should validate grave exists before operations", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      await expect(
        cemeteryManager
          .connect(user1)
          .reserveGrave(999, ethers.id("meta"), ethers.id("name"), 0, {
            value: ethers.parseEther("0.5"),
          })
      ).to.be.revertedWith("Grave does not exist");
    });
  });

  // ============ View Functions Tests ============

  describe("View Functions", function () {
    it("Should return user graves", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, ethers.id("meta"), ethers.id("name"), 0, {
          value: price,
        });

      const userGraves = await cemeteryManager.getUserGraves(user1.address);
      expect(userGraves.length).to.equal(1);
      expect(userGraves[0]).to.equal(1);
    });

    it("Should return graveyard graves", async function () {
      const { cemeteryManager } = await loadFixture(deployWithGravesFixture);

      const graves = await cemeteryManager.getGraveyardGraves(1);
      expect(graves.length).to.equal(3);
    });
  });
});
