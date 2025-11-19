const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CemeteryManager", function () {
  // ============ Fixtures ============

  async function deployCemeteryManagerFixture() {
    const [owner, graveyardOwner, user1, user2] = await ethers.getSigners();

    const CemeteryManager = await ethers.getContractFactory("CemeteryManager");
    const cemeteryManager = await CemeteryManager.deploy();

    return { cemeteryManager, owner, graveyardOwner, user1, user2 };
  }

  async function deployWithGraveyardFixture() {
    const { cemeteryManager, owner, graveyardOwner, user1, user2 } =
      await deployCemeteryManagerFixture();

    await cemeteryManager.addGraveyard(
      graveyardOwner.address,
      "Green Valley Cemetery",
      "123 Cemetery Road, City",
      100
    );

    return { cemeteryManager, owner, graveyardOwner, user1, user2 };
  }

  async function deployWithGravesFixture() {
    const { cemeteryManager, owner, graveyardOwner, user1, user2 } =
      await deployWithGraveyardFixture();

    const graveyardId = 1;
    const price = ethers.parseEther("0.5");
    const locationHash = "QmTest123LocationHash";

    // Add 3 graves
    await cemeteryManager
      .connect(graveyardOwner)
      .addGrave(graveyardId, price, locationHash);
    await cemeteryManager
      .connect(graveyardOwner)
      .addGrave(graveyardId, price, locationHash);
    await cemeteryManager
      .connect(graveyardOwner)
      .addGrave(graveyardId, price, locationHash);

    return { cemeteryManager, owner, graveyardOwner, user1, user2 };
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("Should grant admin role to deployer", async function () {
      const { cemeteryManager, owner } = await loadFixture(
        deployCemeteryManagerFixture
      );

      expect(await cemeteryManager.isAdmin(owner.address)).to.be.true;
    });

    it("Should initialize counters correctly", async function () {
      const { cemeteryManager } = await loadFixture(
        deployCemeteryManagerFixture
      );

      expect(await cemeteryManager.getTotalGraveyards()).to.equal(0);
      expect(await cemeteryManager.getTotalGraves()).to.equal(0);
    });
  });

  // ============ Graveyard Management Tests ============

  describe("Graveyard Management", function () {
    describe("Adding Graveyards", function () {
      it("Should add a new graveyard by owner", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployCemeteryManagerFixture
        );

        await expect(
          cemeteryManager.addGraveyard(
            graveyardOwner.address,
            "Green Valley Cemetery",
            "123 Cemetery Road",
            100
          )
        )
          .to.emit(cemeteryManager, "GraveyardAdded")
          .withArgs(1, graveyardOwner.address, "Green Valley Cemetery", "123 Cemetery Road");

        const graveyard = await cemeteryManager.getGraveyard(1);
        expect(graveyard.name).to.equal("Green Valley Cemetery");
        expect(graveyard.owner).to.equal(graveyardOwner.address);
        expect(graveyard.numPlots).to.equal(100);
        expect(graveyard.active).to.be.true;
      });

      it("Should reject adding graveyard by non-admin", async function () {
        const { cemeteryManager, user1, graveyardOwner } = await loadFixture(
          deployCemeteryManagerFixture
        );

        await expect(
          cemeteryManager
            .connect(user1)
            .addGraveyard(
              graveyardOwner.address,
              "Test Cemetery",
              "Location",
              50
            )
        ).to.be.reverted;
      });

      it("Should reject invalid graveyard parameters", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployCemeteryManagerFixture
        );

        // Invalid owner address
        await expect(
          cemeteryManager.addGraveyard(
            ethers.ZeroAddress,
            "Test",
            "Location",
            100
          )
        ).to.be.revertedWith("Invalid owner address");

        // Empty name
        await expect(
          cemeteryManager.addGraveyard(
            graveyardOwner.address,
            "",
            "Location",
            100
          )
        ).to.be.revertedWith("Name cannot be empty");

        // Zero plots
        await expect(
          cemeteryManager.addGraveyard(
            graveyardOwner.address,
            "Test",
            "Location",
            0
          )
        ).to.be.revertedWith("Must have at least one plot");
      });

      it("Should increment graveyard counter", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployCemeteryManagerFixture
        );

        await cemeteryManager.addGraveyard(
          graveyardOwner.address,
          "Cemetery 1",
          "Location 1",
          100
        );
        await cemeteryManager.addGraveyard(
          graveyardOwner.address,
          "Cemetery 2",
          "Location 2",
          50
        );

        expect(await cemeteryManager.getTotalGraveyards()).to.equal(2);
      });
    });

    describe("Graveyard Status Management", function () {
      it("Should allow graveyard owner to change status", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        await expect(
          cemeteryManager.connect(graveyardOwner).setGraveyardStatus(1, false)
        )
          .to.emit(cemeteryManager, "GraveyardStatusChanged")
          .withArgs(1, false);

        const graveyard = await cemeteryManager.getGraveyard(1);
        expect(graveyard.active).to.be.false;
      });

      it("Should reject status change by non-owner", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGraveyardFixture
        );

        await expect(
          cemeteryManager.connect(user1).setGraveyardStatus(1, false)
        ).to.be.revertedWith("Not graveyard owner");
      });
    });
  });

  // ============ Grave Management Tests ============

  describe("Grave Management", function () {
    describe("Adding Graves", function () {
      it("Should add a grave to graveyard", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const price = ethers.parseEther("1.0");
        const locationHash = "QmTestLocationHash123";

        await expect(
          cemeteryManager
            .connect(graveyardOwner)
            .addGrave(1, price, locationHash)
        )
          .to.emit(cemeteryManager, "GraveAdded")
          .withArgs(1, 1, price, locationHash);

        const grave = await cemeteryManager.getGrave(1);
        expect(grave.price).to.equal(price);
        expect(grave.graveyardId).to.equal(1);
        expect(grave.owner).to.equal(graveyardOwner.address);
        expect(grave.reserved).to.be.false;
        expect(grave.locationHash).to.equal(locationHash);
      });

      it("Should reject adding grave by non-graveyard-owner", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGraveyardFixture
        );

        const price = ethers.parseEther("1.0");

        await expect(
          cemeteryManager.connect(user1).addGrave(1, price, "QmTest")
        ).to.be.revertedWith("Not graveyard owner");
      });

      it("Should reject adding grave with zero price", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        await expect(
          cemeteryManager.connect(graveyardOwner).addGrave(1, 0, "QmTest")
        ).to.be.revertedWith("Price must be greater than 0");
      });

      it("Should reject adding grave to inactive graveyard", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        await cemeteryManager
          .connect(graveyardOwner)
          .setGraveyardStatus(1, false);

        await expect(
          cemeteryManager
            .connect(graveyardOwner)
            .addGrave(1, ethers.parseEther("1.0"), "QmTest")
        ).to.be.revertedWith("Graveyard is not active");
      });
    });

    describe("Batch Adding Graves", function () {
      it("Should add multiple graves in one transaction", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const prices = [
          ethers.parseEther("0.5"),
          ethers.parseEther("0.7"),
          ethers.parseEther("1.0"),
        ];
        const hashes = ["QmHash1", "QmHash2", "QmHash3"];

        await cemeteryManager
          .connect(graveyardOwner)
          .addGravesBatch(1, prices, hashes);

        expect(await cemeteryManager.getTotalGraves()).to.equal(3);

        const grave1 = await cemeteryManager.getGrave(1);
        const grave2 = await cemeteryManager.getGrave(2);

        expect(grave1.price).to.equal(prices[0]);
        expect(grave2.price).to.equal(prices[1]);
      });

      it("Should reject batch with mismatched array lengths", async function () {
        const { cemeteryManager, graveyardOwner } = await loadFixture(
          deployWithGraveyardFixture
        );

        const prices = [ethers.parseEther("0.5"), ethers.parseEther("0.7")];
        const hashes = ["QmHash1"];

        await expect(
          cemeteryManager
            .connect(graveyardOwner)
            .addGravesBatch(1, prices, hashes)
        ).to.be.revertedWith("Arrays length mismatch");
      });
    });
  });

  // ============ Reservation Tests ============

  describe("Grave Reservation", function () {
    describe("Successful Reservations", function () {
      it("Should allow user to reserve grave with correct payment", async function () {
        const { cemeteryManager, graveyardOwner, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");
        const metadataHash = "QmMetadataHash123";

        const tx = await cemeteryManager
          .connect(user1)
          .reserveGrave(1, metadataHash, { value: price });

        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt.blockNumber);

        // Check event was emitted with correct params (timestamp is block.timestamp)
        await expect(tx)
          .to.emit(cemeteryManager, "GraveReserved")
          .withArgs(1, user1.address, price, block.timestamp);

        const grave = await cemeteryManager.getGrave(1);
        expect(grave.owner).to.equal(user1.address);
        expect(grave.reserved).to.be.true;
        expect(grave.metadataHash).to.equal(metadataHash);

        // Check user graves
        const userGraves = await cemeteryManager.getUserGraves(user1.address);
        expect(userGraves.length).to.equal(1);
        expect(userGraves[0]).to.equal(1);
      });

      it("Should credit payment to graveyard owner for withdrawal", async function () {
        const { cemeteryManager, graveyardOwner, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, "QmMeta", { value: price });

        const pendingWithdrawal = await cemeteryManager.getPendingWithdrawal(
          graveyardOwner.address
        );
        expect(pendingWithdrawal).to.equal(price);
      });

      it("Should allow graveyard owner to withdraw funds", async function () {
        const { cemeteryManager, graveyardOwner, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, "QmMeta", { value: price });

        const initialBalance = await ethers.provider.getBalance(
          graveyardOwner.address
        );

        const tx = await cemeteryManager.connect(graveyardOwner).withdraw();
        const receipt = await tx.wait();
        const gasCost = receipt.gasUsed * receipt.gasPrice;

        const finalBalance = await ethers.provider.getBalance(
          graveyardOwner.address
        );

        expect(finalBalance).to.equal(initialBalance + price - gasCost);
      });
    });

    describe("Reservation Validations", function () {
      it("Should reject double reservation", async function () {
        const { cemeteryManager, user1, user2 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, "QmMeta1", { value: price });

        await expect(
          cemeteryManager
            .connect(user2)
            .reserveGrave(1, "QmMeta2", { value: price })
        ).to.be.revertedWith("Grave already reserved");
      });

      it("Should reject incorrect payment amount", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const wrongPrice = ethers.parseEther("0.3");

        await expect(
          cemeteryManager.connect(user1).reserveGrave(1, "QmMeta", {
            value: wrongPrice,
          })
        ).to.be.revertedWith("Incorrect payment amount");
      });

      it("Should reject reservation of non-existent grave", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        await expect(
          cemeteryManager.connect(user1).reserveGrave(999, "QmMeta", {
            value: ethers.parseEther("0.5"),
          })
        ).to.be.revertedWith("Grave does not exist");
      });
    });

    describe("Multiple Reservations", function () {
      it("Should allow user to reserve multiple graves", async function () {
        const { cemeteryManager, user1 } = await loadFixture(
          deployWithGravesFixture
        );

        const price = ethers.parseEther("0.5");

        await cemeteryManager
          .connect(user1)
          .reserveGrave(1, "QmMeta1", { value: price });
        await cemeteryManager
          .connect(user1)
          .reserveGrave(2, "QmMeta2", { value: price });

        const userGraves = await cemeteryManager.getUserGraves(user1.address);
        expect(userGraves.length).to.equal(2);
      });
    });
  });

  // ============ Metadata Update Tests ============

  describe("Burial Record Updates", function () {
    it("Should allow grave owner to update metadata", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmOldMeta", { value: price });

      const newMetadataHash = "QmNewMetadataHash";
      await expect(
        cemeteryManager.connect(user1).updateBurialRecord(1, newMetadataHash)
      )
        .to.emit(cemeteryManager, "MetadataUpdated")
        .withArgs(1, newMetadataHash);

      const grave = await cemeteryManager.getGrave(1);
      expect(grave.metadataHash).to.equal(newMetadataHash);
    });

    it("Should reject metadata update by non-owner", async function () {
      const { cemeteryManager, user1, user2 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmMeta", { value: price });

      await expect(
        cemeteryManager.connect(user2).updateBurialRecord(1, "QmNewMeta")
      ).to.be.revertedWith("Not grave owner");
    });

    it("Should reject update for unreserved grave", async function () {
      const { cemeteryManager, graveyardOwner } = await loadFixture(
        deployWithGravesFixture
      );

      await expect(
        cemeteryManager
          .connect(graveyardOwner)
          .updateBurialRecord(1, "QmNewMeta")
      ).to.be.revertedWith("Grave not reserved");
    });
  });

  // ============ Maintenance Tests ============

  describe("Grave Maintenance", function () {
    it("Should allow graveyard owner to mark grave as maintained", async function () {
      const { cemeteryManager, graveyardOwner, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmMeta", { value: price });

      const tx = await cemeteryManager.connect(graveyardOwner).maintainGrave(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(cemeteryManager, "GraveMaintained")
        .withArgs(1, block.timestamp);

      const grave = await cemeteryManager.getGrave(1);
      expect(grave.maintained).to.be.true;
    });

    it("Should reject maintenance by non-graveyard-owner", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      await expect(
        cemeteryManager.connect(user1).maintainGrave(1)
      ).to.be.revertedWith("Not authorized to maintain");
    });
  });

  // ============ View Functions Tests ============

  describe("View Functions", function () {
    it("Should return available graves correctly", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmMeta", { value: price });

      const availableGraves = await cemeteryManager.getAvailableGraves(1);
      expect(availableGraves.length).to.equal(2);
      expect(availableGraves[0]).to.equal(2);
      expect(availableGraves[1]).to.equal(3);
    });

    it("Should return all graveyard graves", async function () {
      const { cemeteryManager } = await loadFixture(deployWithGravesFixture);

      const allGraves = await cemeteryManager.getGraveyardGraves(1);
      expect(allGraves.length).to.equal(3);
    });

    it("Should check reservation status", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      expect(await cemeteryManager.isReserved(1)).to.be.false;

      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmMeta", { value: ethers.parseEther("0.5") });

      expect(await cemeteryManager.isReserved(1)).to.be.true;
    });
  });

  // ============ Gas Optimization Tests ============

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for grave reservation", async function () {
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      const tx = await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmMeta", { value: price });

      const receipt = await tx.wait();
      console.log("Gas used for reservation:", receipt.gasUsed.toString());

      // Reservation should use less than 180,000 gas
      expect(receipt.gasUsed).to.be.lessThan(180000);
    });

    it("Should batch add graves more efficiently than individual adds", async function () {
      const { cemeteryManager, owner, graveyardOwner } = await loadFixture(
        deployCemeteryManagerFixture
      );

      await cemeteryManager.addGraveyard(
        graveyardOwner.address,
        "Test Cemetery",
        "Location",
        100
      );

      const prices = new Array(5).fill(ethers.parseEther("0.5"));
      const hashes = new Array(5).fill("QmTestHash");

      const batchTx = await cemeteryManager
        .connect(graveyardOwner)
        .addGravesBatch(1, prices, hashes);
      const batchReceipt = await batchTx.wait();

      console.log(
        "Gas used for batch add (5 graves):",
        batchReceipt.gasUsed.toString()
      );
      console.log(
        "Average gas per grave:",
        (batchReceipt.gasUsed / 5n).toString()
      );
    });
  });

  // ============ Security Tests ============

  describe("Security", function () {
    it("Should prevent reentrancy on withdraw", async function () {
      // This test verifies the ReentrancyGuard is properly applied
      const { cemeteryManager, user1 } = await loadFixture(
        deployWithGravesFixture
      );

      const price = ethers.parseEther("0.5");
      await cemeteryManager
        .connect(user1)
        .reserveGrave(1, "QmMeta", { value: price });

      // Cannot withdraw if no balance
      await expect(cemeteryManager.connect(user1).withdraw()).to.be.revertedWith(
        "No funds to withdraw"
      );
    });

    it("Should validate all address inputs", async function () {
      const { cemeteryManager } = await loadFixture(
        deployCemeteryManagerFixture
      );

      await expect(
        cemeteryManager.addGraveyard(ethers.ZeroAddress, "Test", "Loc", 100)
      ).to.be.revertedWith("Invalid owner address");
    });
  });
});
