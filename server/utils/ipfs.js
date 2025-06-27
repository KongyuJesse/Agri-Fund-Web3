// server/utils/ipfs.js

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Validate required environment variables
if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
  throw new Error('Pinata API keys are not configured in environment variables');
}

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_API_SECRET;

/**
 * Verify Pinata API key permissions
 */
async function verifyPinataAuth() {
  try {
    const response = await axios.get(
      'https://api.pinata.cloud/data/testAuthentication',
      {
        httpsAgent,
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey
        }
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error('Pinata authentication failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Upload a single file to IPFS via Pinata
 * @param {object} file - Multer memoryStorage file object
 * @returns {object} - { ipfsHash, pinataUrl }
 */
async function uploadToIPFS(file) {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file object - missing buffer');
    }

    const authValid = await verifyPinataAuth();
    if (!authValid) {
      throw new Error('Invalid Pinata API credentials or insufficient permissions');
    }

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'upload',
      contentType: file.mimetype || 'application/octet-stream'
    });

    formData.append('pinataMetadata', JSON.stringify({
      name: file.originalname || 'uploaded_file',
      keyvalues: {
        uploadType: 'single_upload',
        timestamp: new Date().toISOString()
      }
    }));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        httpsAgent,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
          Accept: 'application/json'
        },
        timeout: 30000
      }
    );

    if (!response.data.IpfsHash) {
      throw new Error('Invalid response from Pinata - missing IPFS hash');
    }

    return {
      ipfsHash: response.data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('IPFS Upload Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Upload multiple files to IPFS via Pinata with directory structure
 * @param {Array} files - Array of multer memoryStorage file objects
 * @returns {Array<string>} - Array of accessible IPFS URLs
 */
async function uploadMultipleToIPFS(files) {
  try {
    const authValid = await verifyPinataAuth();
    if (!authValid) {
      throw new Error('Invalid Pinata API credentials or insufficient permissions');
    }

    const formData = new FormData();

    files.forEach(file => {
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        filepath: `uploads/${file.originalname}`
      });
    });

    formData.append('pinataMetadata', JSON.stringify({
      name: 'user_uploads',
      keyvalues: {
        uploadType: 'directory'
      }
    }));

    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 0,
      wrapWithDirectory: true
    }));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        httpsAgent,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey
        },
        timeout: 60000
      }
    );

    const baseHash = response.data.IpfsHash;

    return files.map(file => {
      const encodedName = encodeURIComponent(file.originalname);
      return `https://gateway.pinata.cloud/ipfs/${baseHash}/uploads/${encodedName}`;
    });
  } catch (error) {
    console.error('Batch IPFS Upload Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    throw new Error(`Batch IPFS upload failed: ${error.message}`);
  }
}

module.exports = {
  verifyPinataAuth,
  uploadToIPFS,
  uploadMultipleToIPFS
};
