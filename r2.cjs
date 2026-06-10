const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const ENDPOINT = process.env.R2_ENDPOINT
const PUBLIC_URL = process.env.R2_PUBLIC_URL
const BUCKET_NAME = process.env.R2_BUCKET_NAME

const s3Client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

/**
 * Uploads a file buffer to Cloudflare R2 and returns the public URL.
 * @param {Buffer} fileBuffer - The file contents as a Buffer.
 * @param {string} fileName - The desired name of the file in the bucket.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
const uploadFileToR2 = async (fileBuffer, fileName, mimeType) => {
  try {
    // Create a unique filename to prevent overwrites
    const uniqueFileName = `${Date.now()}-${fileName}`

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mimeType,
    }

    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    // Return the public URL
    return `${PUBLIC_URL}/${uniqueFileName}`
  } catch (error) {
    console.error('[R2] Upload failed:', error)
    throw new Error('Failed to upload attachment to R2')
  }
}

module.exports = {
  uploadFileToR2
}
