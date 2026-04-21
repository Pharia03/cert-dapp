// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertVerifier
 * @notice Stores and verifies SHA-256 hashes of academic certificates on-chain
 * @dev Designed for the CN6035 coursework DApp submission
 */
contract CertVerifier {

    // ─────────────────────────────────────────────
    //  Data Structures
    // ─────────────────────────────────────────────

    struct Certificate {
        string  studentName;
        string  courseName;
        string  dateIssued;
        bytes32 documentHash;   // SHA-256 hash of the uploaded PDF
        bool    isRevoked;
        address issuedBy;       // address that stored this certificate
        uint256 timestamp;      // block timestamp of storage
    }

    // ─────────────────────────────────────────────
    //  State Variables
    // ─────────────────────────────────────────────

    address public owner;

    // certId → Certificate
    mapping(uint256 => Certificate) private _certificates;

    // documentHash → certId  (for quick lookup by hash)
    mapping(bytes32 => uint256) private _hashToCertId;

    uint256 private _certCount;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event CertificateStored(
        uint256 indexed certId,
        string  studentName,
        bytes32 documentHash,
        address indexed issuedBy
    );

    event CertificateRevoked(uint256 indexed certId, address indexed revokedBy);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CertVerifier: caller is not the owner");
        _;
    }

    modifier certExists(uint256 certId) {
        require(certId > 0 && certId <= _certCount, "CertVerifier: certificate does not exist");
        _;
    }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────
    //  Write Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Store a new certificate on-chain
     * @param studentName  Full name of the student
     * @param courseName   Name of the course/qualification
     * @param dateIssued   Issue date as a string (e.g. "2025-06-01")
     * @param documentHash SHA-256 hash of the certificate PDF (bytes32)
     * @return certId      The ID assigned to this certificate
     */
    function storeCertificate(
        string  calldata studentName,
        string  calldata courseName,
        string  calldata dateIssued,
        bytes32          documentHash
    ) external returns (uint256 certId) {
        require(bytes(studentName).length  > 0, "CertVerifier: student name required");
        require(bytes(courseName).length   > 0, "CertVerifier: course name required");
        require(bytes(dateIssued).length   > 0, "CertVerifier: date required");
        require(documentHash != bytes32(0),      "CertVerifier: hash cannot be empty");
        require(
            _hashToCertId[documentHash] == 0,
            "CertVerifier: certificate already exists"
        );

        unchecked { _certCount++; }
        certId = _certCount;

        _certificates[certId] = Certificate({
            studentName:  studentName,
            courseName:   courseName,
            dateIssued:   dateIssued,
            documentHash: documentHash,
            isRevoked:    false,
            issuedBy:     msg.sender,
            timestamp:    block.timestamp
        });

        _hashToCertId[documentHash] = certId;

        emit CertificateStored(certId, studentName, documentHash, msg.sender);
    }

    /**
     * @notice Revoke a certificate (owner only)
     * @param certId  ID of the certificate to revoke
     */
    function revokeCertificate(uint256 certId)
        external
        onlyOwner
        certExists(certId)
    {
        require(!_certificates[certId].isRevoked, "CertVerifier: already revoked");
        _certificates[certId].isRevoked = true;
        emit CertificateRevoked(certId, msg.sender);
    }

    // ─────────────────────────────────────────────
    //  Read / Verify Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Verify a document by its SHA-256 hash
     * @param documentHash  The hash to look up
     * @return exists       True if the hash is stored
     * @return isRevoked    True if the certificate was revoked
     * @return certId       The ID of the matching certificate (0 if none)
     */
    function verifyCertificate(bytes32 documentHash)
        external
        view
        returns (
            bool    exists,
            bool    isRevoked,
            uint256 certId
        )
    {
        certId = _hashToCertId[documentHash];
        if (certId == 0) {
            return (false, false, 0);
        }
        Certificate storage cert = _certificates[certId];
        return (true, cert.isRevoked, certId);
    }

    /**
     * @notice Get full details of a certificate by ID
     * @param certId  The certificate ID
     */
    function getCertificate(uint256 certId)
        external
        view
        certExists(certId)
        returns (
            string  memory studentName,
            string  memory courseName,
            string  memory dateIssued,
            bytes32        documentHash,
            bool           isRevoked,
            address        issuedBy,
            uint256        timestamp
        )
    {
        Certificate storage cert = _certificates[certId];
        return (
            cert.studentName,
            cert.courseName,
            cert.dateIssued,
            cert.documentHash,
            cert.isRevoked,
            cert.issuedBy,
            cert.timestamp
        );
    }

    /**
     * @notice Returns the total number of certificates stored
     */
    function getCertificateCount() external view returns (uint256) {
        return _certCount;
    }

    /**
     * @notice Transfer contract ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CertVerifier: zero address");
        owner = newOwner;
    }
}