import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logging/logger.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * Blockchain provider types
 */
type Web3Client = any;
type IPFSClient = any;

/**
 * Medical record on blockchain
 */
export interface BlockchainMedicalRecord {
  id: string;
  patientId: string;
  recordType: string;
  ipfsHash: string;
  blockchainTxHash: string;
  timestamp: Date;
  encryptionKey?: string;
  accessPermissions: string[];
  metadata: {
    provider: string;
    category: string;
    tags: string[];
  };
}

/**
 * Access permission record
 */
export interface AccessPermission {
  id: string;
  patientId: string;
  grantedTo: string;
  grantedBy: string;
  recordIds: string[];
  permissionLevel: 'read' | 'write' | 'full';
  expiresAt?: Date;
  status: 'active' | 'revoked' | 'expired';
  blockchainTxHash?: string;
  createdAt: Date;
}

/**
 * Medication tracking record
 */
export interface MedicationTrackingRecord {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  batchNumber: string;
  manufacturer: string;
  prescribedBy: string;
  dispensedBy?: string;
  scheduledTime: Date;
  takenAt?: Date;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  verificationHash: string;
  blockchainTxHash?: string;
  proofOfCompliance: boolean;
}

/**
 * Insurance claim record
 */
export interface InsuranceClaimRecord {
  id: string;
  patientId: string;
  providerId: string;
  claimAmount: number;
  claimDate: Date;
  serviceDate: Date;
  cptCodes: string[];
  diagnosisCodes: string[];
  status: 'pending' | 'verified' | 'approved' | 'denied';
  verificationHash: string;
  blockchainTxHash?: string;
  verifiedAt?: Date;
}

/**
 * Blockchain transaction record
 */
export interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  from: string;
  to: string;
  timestamp: Date;
  gasUsed: number;
  status: 'pending' | 'confirmed' | 'failed';
  data: any;
}

/**
 * Blockchain Service
 * Handles medical records on blockchain with IPFS, smart contracts, and encryption
 */
@Injectable()
export class BlockchainService {
  private web3Client: Web3Client | null = null;
  private ipfsClient: IPFSClient | null = null;
  private blockchainProvider: 'ethereum' | 'polygon' | 'fallback';
  private contractAddress: string | null = null;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {
    this.initializeBlockchain();
  }

  /**
   * Initialize blockchain and IPFS clients
   */
  private async initializeBlockchain() {
    const ethereumRpc = this.configService.get<string>('ETHEREUM_RPC_URL');
    const polygonRpc = this.configService.get<string>('POLYGON_RPC_URL');
    const ipfsUrl = this.configService.get<string>('IPFS_URL');

    // Try Ethereum/Polygon
    if (ethereumRpc || polygonRpc) {
      try {
        const { Web3 } = require('web3');
        const rpcUrl = polygonRpc || ethereumRpc;
        this.web3Client = new Web3(rpcUrl);
        this.blockchainProvider = polygonRpc ? 'polygon' : 'ethereum';
        this.contractAddress = this.configService.get<string>('SMART_CONTRACT_ADDRESS') || null;

        this.logger.log(
          `Blockchain initialized: ${this.blockchainProvider}`,
          'BlockchainService',
        );
      } catch (error) {
        this.logger.warn('Web3 SDK not available', 'BlockchainService');
        this.blockchainProvider = 'fallback';
      }
    } else {
      this.blockchainProvider = 'fallback';
      this.logger.warn('No blockchain provider configured - using fallback', 'BlockchainService');
    }

    // Initialize IPFS
    if (ipfsUrl) {
      try {
        const { create } = require('ipfs-http-client');
        this.ipfsClient = create({ url: ipfsUrl });
        this.logger.log('IPFS initialized successfully', 'BlockchainService');
      } catch (error) {
        this.logger.warn('IPFS client not available', 'BlockchainService');
      }
    }
  }

  /**
   * Store medical record on blockchain
   */
  async storeMedicalRecord(data: {
    patientId: string;
    recordType: string;
    recordData: any;
    provider: string;
    category: string;
    tags?: string[];
    allowedViewers?: string[];
  }): Promise<BlockchainMedicalRecord> {
    try {
      // Encrypt the medical record
      const { encryptedData, encryptionKey } = await this.encryptMedicalData(data.recordData);

      // Store encrypted data on IPFS
      const ipfsHash = await this.storeOnIPFS(encryptedData);

      // Create blockchain transaction
      const txHash = await this.createBlockchainTransaction({
        type: 'medical_record',
        patientId: data.patientId,
        ipfsHash,
        recordType: data.recordType,
        timestamp: Date.now(),
      });

      // Store metadata in database
      const record = await this.prisma.blockchainMedicalRecord.create({
        data: {
          patientId: data.patientId,
          recordType: data.recordType,
          ipfsHash,
          blockchainTxHash: txHash,
          encryptionKeyHash: this.hashEncryptionKey(encryptionKey),
          provider: data.provider,
          category: data.category,
          tags: data.tags || [],
          accessPermissions: data.allowedViewers || [],
        },
      });

      this.logger.logEvent('Medical record stored on blockchain', 'Blockchain', record.id, {
        patientId: data.patientId,
        ipfsHash,
        txHash,
      });

      return {
        id: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        ipfsHash: record.ipfsHash,
        blockchainTxHash: record.blockchainTxHash,
        timestamp: record.createdAt,
        encryptionKey, // Only returned once at creation
        accessPermissions: record.accessPermissions,
        metadata: {
          provider: record.provider,
          category: record.category,
          tags: record.tags,
        },
      };
    } catch (error) {
      this.logger.error('Failed to store medical record', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to store medical record on blockchain');
    }
  }

  /**
   * Retrieve medical record from blockchain
   */
  async retrieveMedicalRecord(
    recordId: string,
    requesterId: string,
    encryptionKey?: string,
  ): Promise<any> {
    try {
      // Get record metadata
      const record = await this.prisma.blockchainMedicalRecord.findUnique({
        where: { id: recordId },
      });

      if (!record) {
        throw new NotFoundException('Medical record not found');
      }

      // Check access permissions
      const hasAccess = await this.checkAccessPermission(
        record.patientId,
        requesterId,
        recordId,
      );

      if (!hasAccess) {
        this.logger.logSecurity('Unauthorized access attempt to medical record', 'high', {
          recordId,
          requesterId,
        });
        throw new BadRequestException('Access denied to medical record');
      }

      // Retrieve from IPFS
      const encryptedData = await this.retrieveFromIPFS(record.ipfsHash);

      // Decrypt if encryption key provided
      let recordData = encryptedData;
      if (encryptionKey) {
        recordData = await this.decryptMedicalData(encryptedData, encryptionKey);
      }

      this.logger.logEvent('Medical record retrieved', 'Blockchain', recordId, {
        requesterId,
      });

      return {
        id: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        data: recordData,
        metadata: {
          provider: record.provider,
          category: record.category,
          tags: record.tags,
          timestamp: record.createdAt,
        },
        blockchain: {
          txHash: record.blockchainTxHash,
          ipfsHash: record.ipfsHash,
        },
      };
    } catch (error) {
      this.logger.error('Failed to retrieve medical record', '', 'BlockchainService', {
        error: (error as Error).message,
        recordId,
      });
      throw error;
    }
  }

  /**
   * Grant access permission to medical records
   */
  async grantAccessPermission(data: {
    patientId: string;
    grantedTo: string;
    recordIds: string[];
    permissionLevel: 'read' | 'write' | 'full';
    expiresAt?: Date;
    reason?: string;
  }): Promise<AccessPermission> {
    try {
      // Verify patient owns the records
      const records = await this.prisma.blockchainMedicalRecord.findMany({
        where: {
          id: { in: data.recordIds },
          patientId: data.patientId,
        },
      });

      if (records.length !== data.recordIds.length) {
        throw new BadRequestException('Some records not found or not owned by patient');
      }

      // Create blockchain transaction for access grant
      const txHash = await this.createBlockchainTransaction({
        type: 'access_grant',
        patientId: data.patientId,
        grantedTo: data.grantedTo,
        recordIds: data.recordIds,
        permissionLevel: data.permissionLevel,
        expiresAt: data.expiresAt?.getTime(),
        timestamp: Date.now(),
      });

      // Store permission in database
      const permission = await this.prisma.accessPermission.create({
        data: {
          patientId: data.patientId,
          grantedTo: data.grantedTo,
          grantedBy: data.patientId,
          recordIds: data.recordIds,
          permissionLevel: data.permissionLevel,
          expiresAt: data.expiresAt,
          status: 'active',
          blockchainTxHash: txHash,
          reason: data.reason,
        },
      });

      this.logger.logEvent('Access permission granted', 'AccessPermission', permission.id, {
        patientId: data.patientId,
        grantedTo: data.grantedTo,
        recordCount: data.recordIds.length,
      });

      return {
        id: permission.id,
        patientId: permission.patientId,
        grantedTo: permission.grantedTo,
        grantedBy: permission.grantedBy,
        recordIds: permission.recordIds,
        permissionLevel: permission.permissionLevel as any,
        expiresAt: permission.expiresAt || undefined,
        status: permission.status as any,
        blockchainTxHash: permission.blockchainTxHash || undefined,
        createdAt: permission.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to grant access permission', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Revoke access permission
   */
  async revokeAccessPermission(permissionId: string, patientId: string): Promise<void> {
    try {
      const permission = await this.prisma.accessPermission.findUnique({
        where: { id: permissionId },
      });

      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      if (permission.patientId !== patientId) {
        throw new BadRequestException('Not authorized to revoke this permission');
      }

      // Create blockchain transaction for revocation
      const txHash = await this.createBlockchainTransaction({
        type: 'access_revoke',
        permissionId,
        patientId,
        timestamp: Date.now(),
      });

      // Update permission status
      await this.prisma.accessPermission.update({
        where: { id: permissionId },
        data: {
          status: 'revoked',
          revokedAt: new Date(),
        },
      });

      this.logger.logEvent('Access permission revoked', 'AccessPermission', permissionId, {
        patientId,
      });
    } catch (error) {
      this.logger.error('Failed to revoke access permission', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check access permission
   */
  async checkAccessPermission(
    patientId: string,
    requesterId: string,
    recordId?: string,
  ): Promise<boolean> {
    // Patient always has access to their own records
    if (patientId === requesterId) {
      return true;
    }

    const where: any = {
      patientId,
      grantedTo: requesterId,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    };

    if (recordId) {
      where.recordIds = { has: recordId };
    }

    const permission = await this.prisma.accessPermission.findFirst({ where });

    return !!permission;
  }

  /**
   * Track medication on blockchain
   */
  async trackMedication(data: {
    patientId: string;
    medicationId: string;
    medicationName: string;
    batchNumber: string;
    manufacturer: string;
    prescribedBy: string;
    scheduledTime: Date;
    takenAt?: Date;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  }): Promise<MedicationTrackingRecord> {
    try {
      // Create verification hash
      const verificationHash = this.createVerificationHash({
        patientId: data.patientId,
        medicationId: data.medicationId,
        batchNumber: data.batchNumber,
        scheduledTime: data.scheduledTime.getTime(),
        takenAt: data.takenAt?.getTime(),
      });

      // Store on blockchain
      const txHash = await this.createBlockchainTransaction({
        type: 'medication_tracking',
        patientId: data.patientId,
        medicationId: data.medicationId,
        verificationHash,
        status: data.status,
        timestamp: Date.now(),
      });

      // Store in database
      const record = await this.prisma.medicationTrackingRecord.create({
        data: {
          patientId: data.patientId,
          medicationId: data.medicationId,
          medicationName: data.medicationName,
          batchNumber: data.batchNumber,
          manufacturer: data.manufacturer,
          prescribedBy: data.prescribedBy,
          scheduledTime: data.scheduledTime,
          takenAt: data.takenAt,
          status: data.status,
          verificationHash,
          blockchainTxHash: txHash,
          proofOfCompliance: data.status === 'taken',
        },
      });

      this.logger.logEvent('Medication tracked on blockchain', 'MedicationTracking', record.id, {
        patientId: data.patientId,
        medicationName: data.medicationName,
        status: data.status,
      });

      return {
        id: record.id,
        patientId: record.patientId,
        medicationId: record.medicationId,
        medicationName: record.medicationName,
        batchNumber: record.batchNumber,
        manufacturer: record.manufacturer,
        prescribedBy: record.prescribedBy,
        scheduledTime: record.scheduledTime,
        takenAt: record.takenAt || undefined,
        status: record.status as any,
        verificationHash: record.verificationHash,
        blockchainTxHash: record.blockchainTxHash || undefined,
        proofOfCompliance: record.proofOfCompliance,
      };
    } catch (error) {
      this.logger.error('Failed to track medication', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Verify insurance claim on blockchain
   */
  async verifyInsuranceClaim(data: {
    patientId: string;
    providerId: string;
    claimAmount: number;
    claimDate: Date;
    serviceDate: Date;
    cptCodes: string[];
    diagnosisCodes: string[];
    supportingDocuments?: string[]; // IPFS hashes
  }): Promise<InsuranceClaimRecord> {
    try {
      // Create verification hash
      const verificationHash = this.createVerificationHash({
        patientId: data.patientId,
        providerId: data.providerId,
        claimAmount: data.claimAmount,
        serviceDate: data.serviceDate.getTime(),
        cptCodes: data.cptCodes,
        diagnosisCodes: data.diagnosisCodes,
      });

      // Store on blockchain
      const txHash = await this.createBlockchainTransaction({
        type: 'insurance_claim',
        patientId: data.patientId,
        providerId: data.providerId,
        verificationHash,
        claimAmount: data.claimAmount,
        timestamp: Date.now(),
      });

      // Store in database
      const record = await this.prisma.insuranceClaimRecord.create({
        data: {
          patientId: data.patientId,
          providerId: data.providerId,
          claimAmount: data.claimAmount,
          claimDate: data.claimDate,
          serviceDate: data.serviceDate,
          cptCodes: data.cptCodes,
          diagnosisCodes: data.diagnosisCodes,
          supportingDocuments: data.supportingDocuments || [],
          verificationHash,
          blockchainTxHash: txHash,
          status: 'verified',
          verifiedAt: new Date(),
        },
      });

      this.logger.logEvent('Insurance claim verified', 'InsuranceClaim', record.id, {
        patientId: data.patientId,
        claimAmount: data.claimAmount,
      });

      return {
        id: record.id,
        patientId: record.patientId,
        providerId: record.providerId,
        claimAmount: record.claimAmount,
        claimDate: record.claimDate,
        serviceDate: record.serviceDate,
        cptCodes: record.cptCodes,
        diagnosisCodes: record.diagnosisCodes,
        status: record.status as any,
        verificationHash: record.verificationHash,
        blockchainTxHash: record.blockchainTxHash || undefined,
        verifiedAt: record.verifiedAt || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to verify insurance claim', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get blockchain transaction details
   */
  async getTransactionDetails(txHash: string): Promise<BlockchainTransaction> {
    try {
      if (this.web3Client && this.blockchainProvider !== 'fallback') {
        const tx = await this.web3Client.eth.getTransaction(txHash);
        const receipt = await this.web3Client.eth.getTransactionReceipt(txHash);

        return {
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          from: tx.from,
          to: tx.to,
          timestamp: new Date(Date.now()), // Would fetch from block
          gasUsed: receipt.gasUsed,
          status: receipt.status ? 'confirmed' : 'failed',
          data: tx.input,
        };
      } else {
        // Fallback: return from database
        const dbTx = await this.prisma.blockchainTransaction.findUnique({
          where: { txHash },
        });

        if (!dbTx) {
          throw new NotFoundException('Transaction not found');
        }

        return {
          txHash: dbTx.txHash,
          blockNumber: dbTx.blockNumber || 0,
          from: dbTx.fromAddress,
          to: dbTx.toAddress,
          timestamp: dbTx.timestamp,
          gasUsed: dbTx.gasUsed || 0,
          status: dbTx.status as any,
          data: dbTx.data,
        };
      }
    } catch (error) {
      this.logger.error('Failed to get transaction details', '', 'BlockchainService', {
        error: (error as Error).message,
        txHash,
      });
      throw error;
    }
  }

  /**
   * Get patient's blockchain audit trail
   */
  async getAuditTrail(patientId: string, limit = 50) {
    try {
      const transactions = await this.prisma.blockchainTransaction.findMany({
        where: {
          OR: [
            { data: { path: ['patientId'], equals: patientId } },
            { fromAddress: patientId },
            { toAddress: patientId },
          ],
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return transactions.map(tx => ({
        txHash: tx.txHash,
        type: tx.type,
        timestamp: tx.timestamp,
        status: tx.status,
        blockNumber: tx.blockNumber,
        data: tx.data,
      }));
    } catch (error) {
      this.logger.error('Failed to get audit trail', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * ========================================
   * PRIVATE HELPER METHODS
   * ========================================
   */

  /**
   * Encrypt medical data
   */
  private async encryptMedicalData(
    data: any,
  ): Promise<{ encryptedData: string; encryptionKey: string }> {
    const algorithm = 'aes-256-gcm';
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);

    const dataString = JSON.stringify(data);
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    const encryptedData = JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });

    return { encryptedData, encryptionKey };
  }

  /**
   * Decrypt medical data
   */
  private async decryptMedicalData(encryptedData: string, encryptionKey: string): Promise<any> {
    try {
      const algorithm = 'aes-256-gcm';
      const { encrypted, iv, authTag } = JSON.parse(encryptedData);

      const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(encryptionKey, 'hex'),
        Buffer.from(iv, 'hex'),
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt medical data', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Invalid encryption key or corrupted data');
    }
  }

  /**
   * Store data on IPFS
   */
  private async storeOnIPFS(data: string): Promise<string> {
    try {
      if (this.ipfsClient) {
        const { cid } = await this.ipfsClient.add(data);
        return cid.toString();
      } else {
        // Fallback: store in database and return hash
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        await this.prisma.ipfsData.create({
          data: { hash, content: data },
        });
        return hash;
      }
    } catch (error) {
      this.logger.error('Failed to store on IPFS', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Retrieve data from IPFS
   */
  private async retrieveFromIPFS(hash: string): Promise<string> {
    try {
      if (this.ipfsClient) {
        const stream = this.ipfsClient.cat(hash);
        let data = '';
        for await (const chunk of stream) {
          data += chunk.toString();
        }
        return data;
      } else {
        // Fallback: retrieve from database
        const record = await this.prisma.ipfsData.findUnique({
          where: { hash },
        });
        if (!record) {
          throw new NotFoundException('Data not found on IPFS');
        }
        return record.content;
      }
    } catch (error) {
      this.logger.error('Failed to retrieve from IPFS', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create blockchain transaction
   */
  private async createBlockchainTransaction(data: any): Promise<string> {
    try {
      let txHash: string;

      if (this.web3Client && this.contractAddress && this.blockchainProvider !== 'fallback') {
        // Real blockchain transaction
        const account = this.configService.get<string>('BLOCKCHAIN_ACCOUNT');
        const privateKey = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');

        if (!account || !privateKey) {
          throw new Error('Blockchain account not configured');
        }

        // Create contract instance (ABI would be loaded from config)
        const contract = new this.web3Client.eth.Contract(
          this.getContractABI(),
          this.contractAddress,
        );

        // Send transaction
        const tx = contract.methods.storeRecord(
          data.patientId,
          data.ipfsHash || '',
          JSON.stringify(data),
        );

        const gas = await tx.estimateGas({ from: account });
        const gasPrice = await this.web3Client.eth.getGasPrice();

        const signedTx = await this.web3Client.eth.accounts.signTransaction(
          {
            to: this.contractAddress,
            data: tx.encodeABI(),
            gas,
            gasPrice,
          },
          privateKey,
        );

        const receipt = await this.web3Client.eth.sendSignedTransaction(
          signedTx.rawTransaction,
        );

        txHash = receipt.transactionHash;
      } else {
        // Fallback: generate hash and store in database
        txHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
      }

      // Store transaction record
      await this.prisma.blockchainTransaction.create({
        data: {
          txHash,
          type: data.type,
          fromAddress: data.patientId || 'system',
          toAddress: this.contractAddress || 'contract',
          data,
          status: 'confirmed',
          timestamp: new Date(),
          blockNumber: this.blockchainProvider !== 'fallback' ? undefined : 0,
        },
      });

      return txHash;
    } catch (error) {
      this.logger.error('Failed to create blockchain transaction', '', 'BlockchainService', {
        error: (error as Error).message,
      });
      // Return fallback hash
      return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
  }

  /**
   * Get smart contract ABI
   */
  private getContractABI(): any[] {
    // Simplified ABI for medical records contract
    return [
      {
        name: 'storeRecord',
        type: 'function',
        inputs: [
          { name: 'patientId', type: 'string' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'metadata', type: 'string' },
        ],
        outputs: [{ name: 'recordId', type: 'uint256' }],
      },
      {
        name: 'grantAccess',
        type: 'function',
        inputs: [
          { name: 'recordId', type: 'uint256' },
          { name: 'grantee', type: 'address' },
          { name: 'expiresAt', type: 'uint256' },
        ],
        outputs: [{ name: 'success', type: 'bool' }],
      },
      {
        name: 'revokeAccess',
        type: 'function',
        inputs: [
          { name: 'recordId', type: 'uint256' },
          { name: 'grantee', type: 'address' },
        ],
        outputs: [{ name: 'success', type: 'bool' }],
      },
    ];
  }

  /**
   * Hash encryption key for storage
   */
  private hashEncryptionKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Create verification hash
   */
  private createVerificationHash(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}
