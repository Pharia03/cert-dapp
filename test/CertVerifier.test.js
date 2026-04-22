const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─────────────────────────────────────────────────────────────────────────────
//  CertVerifier — Unit Tests
//  Run with: npx hardhat test
// ─────────────────────────────────────────────────────────────────────────────

describe("CertVerifier", function () {

  let certVerifier;
  let owner;
  let otherUser;

  // Sample test data
  const studentName = "Jane Smith";
  const courseName  = "BSc Computer Science";
  const dateIssued  = "2025-06-01";
  const documentHash = ethers.utils.formatBytes32String("testhash123");
  const documentHash2 = ethers.utils.formatBytes32String("testhash456");

  // Deploy a fresh contract before every test
  beforeEach(async function () {
    [owner, otherUser] = await ethers.getSigners();
    const CertVerifier = await ethers.getContractFactory("CertVerifier");
    certVerifier = await CertVerifier.deploy();
    await certVerifier.deployed();
  });

  // ── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {

    it("Should set the deployer as owner", async function () {
      expect(await certVerifier.owner()).to.equal(owner.address);
    });

    it("Should start with zero certificates", async function () {
      expect(await certVerifier.getCertificateCount()).to.equal(0);
    });

  });

  // ── storeCertificate ───────────────────────────────────────────────────────
  describe("storeCertificate", function () {

    it("Should store a certificate and return certId of 1", async function () {
      const tx = await certVerifier.storeCertificate(
        studentName, courseName, dateIssued, documentHash
      );
      const receipt = await tx.wait();

      // Check the CertificateStored event was emitted
      const event = receipt.events.find(e => e.event === "CertificateStored");
      expect(event).to.not.be.undefined;
      expect(event.args.certId).to.equal(1);
      expect(event.args.studentName).to.equal(studentName);
    });

    it("Should increment certificate count after storing", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);
      expect(await certVerifier.getCertificateCount()).to.equal(1);

      await certVerifier.storeCertificate("Bob Jones", courseName, dateIssued, documentHash2);
      expect(await certVerifier.getCertificateCount()).to.equal(2);
    });

    it("Should reject duplicate document hashes", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);

      await expect(
        certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash)
      ).to.be.revertedWith("CertVerifier: certificate already exists");
    });

    it("Should reject an empty student name", async function () {
      await expect(
        certVerifier.storeCertificate("", courseName, dateIssued, documentHash)
      ).to.be.revertedWith("CertVerifier: student name required");
    });

    it("Should reject an empty course name", async function () {
      await expect(
        certVerifier.storeCertificate(studentName, "", dateIssued, documentHash)
      ).to.be.revertedWith("CertVerifier: course name required");
    });

    it("Should reject an empty date", async function () {
      await expect(
        certVerifier.storeCertificate(studentName, courseName, "", documentHash)
      ).to.be.revertedWith("CertVerifier: date required");
    });

    it("Should reject a zero bytes32 hash", async function () {
      await expect(
        certVerifier.storeCertificate(studentName, courseName, dateIssued, ethers.constants.HashZero)
      ).to.be.revertedWith("CertVerifier: hash cannot be empty");
    });

    it("Should allow two different users to store different certificates", async function () {
      await certVerifier.connect(owner).storeCertificate(
        studentName, courseName, dateIssued, documentHash
      );
      await certVerifier.connect(otherUser).storeCertificate(
        "Bob Jones", courseName, dateIssued, documentHash2
      );
      expect(await certVerifier.getCertificateCount()).to.equal(2);
    });

  });

  // ── verifyCertificate ──────────────────────────────────────────────────────
  describe("verifyCertificate", function () {

    it("Should return exists=true for a stored certificate", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);
      const [exists, isRevoked, certId] = await certVerifier.verifyCertificate(documentHash);

      expect(exists).to.equal(true);
      expect(isRevoked).to.equal(false);
      expect(certId).to.equal(1);
    });

    it("Should return exists=false for an unknown hash", async function () {
      const unknownHash = ethers.utils.formatBytes32String("unknownhash");
      const [exists, isRevoked, certId] = await certVerifier.verifyCertificate(unknownHash);

      expect(exists).to.equal(false);
      expect(isRevoked).to.equal(false);
      expect(certId).to.equal(0);
    });

    it("Should correctly identify a revoked certificate", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);
      await certVerifier.revokeCertificate(1);

      const [exists, isRevoked] = await certVerifier.verifyCertificate(documentHash);
      expect(exists).to.equal(true);
      expect(isRevoked).to.equal(true);
    });

  });

  // ── getCertificate ─────────────────────────────────────────────────────────
  describe("getCertificate", function () {

    it("Should return correct certificate details by ID", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);
      const [name, course, date, hash, revoked, issuedBy] = await certVerifier.getCertificate(1);

      expect(name).to.equal(studentName);
      expect(course).to.equal(courseName);
      expect(date).to.equal(dateIssued);
      expect(hash).to.equal(documentHash);
      expect(revoked).to.equal(false);
      expect(issuedBy).to.equal(owner.address);
    });

    it("Should revert for a non-existent certificate ID", async function () {
      await expect(
        certVerifier.getCertificate(99)
      ).to.be.revertedWith("CertVerifier: certificate does not exist");
    });

  });

  // ── revokeCertificate ──────────────────────────────────────────────────────
  describe("revokeCertificate", function () {

    it("Should allow the owner to revoke a certificate", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);
      const tx = await certVerifier.revokeCertificate(1);
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "CertificateRevoked");
      expect(event).to.not.be.undefined;
      expect(event.args.certId).to.equal(1);
    });

    it("Should prevent non-owners from revoking a certificate", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);

      await expect(
        certVerifier.connect(otherUser).revokeCertificate(1)
      ).to.be.revertedWith("CertVerifier: caller is not the owner");
    });

    it("Should prevent revoking an already-revoked certificate", async function () {
      await certVerifier.storeCertificate(studentName, courseName, dateIssued, documentHash);
      await certVerifier.revokeCertificate(1);

      await expect(
        certVerifier.revokeCertificate(1)
      ).to.be.revertedWith("CertVerifier: already revoked");
    });

    it("Should prevent revoking a non-existent certificate", async function () {
      await expect(
        certVerifier.revokeCertificate(99)
      ).to.be.revertedWith("CertVerifier: certificate does not exist");
    });

  });

  // ── transferOwnership ──────────────────────────────────────────────────────
  describe("transferOwnership", function () {

    it("Should allow the owner to transfer ownership", async function () {
      await certVerifier.transferOwnership(otherUser.address);
      expect(await certVerifier.owner()).to.equal(otherUser.address);
    });

    it("Should prevent non-owners from transferring ownership", async function () {
      await expect(
        certVerifier.connect(otherUser).transferOwnership(otherUser.address)
      ).to.be.revertedWith("CertVerifier: caller is not the owner");
    });

    it("Should reject transferring to the zero address", async function () {
      await expect(
        certVerifier.transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith("CertVerifier: zero address");
    });

  });

});