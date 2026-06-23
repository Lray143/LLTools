const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3')
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
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    }

    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    return fileName
  } catch (error) {
    console.error('[R2] Upload failed:', error)
    throw new Error('Failed to upload attachment to R2')
  }
}

/**
 * Downloads a file from Cloudflare R2 and returns its stream or buffer.
 * @param {string} fileName - The name of the file in the bucket.
 * @returns {Promise<Buffer>} - The file buffer.
 */
const downloadFileFromR2 = async (fileName) => {
  try {
    const downloadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
    }
    const command = new GetObjectCommand(downloadParams)
    const response = await s3Client.send(command)
    // response.Body is a Readable stream in Node.js
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch (error) {
    console.error(`[R2] Download failed for ${fileName}:`, error)
    throw error
  }
}

/**
 * Calculates the total size of all objects in the bucket.
 * @returns {Promise<number>} - Total size in bytes.
 */
const getBucketSize = async () => {
  try {
    let totalSize = 0
    let isTruncated = true
    let continuationToken = undefined

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken
      })
      const response = await s3Client.send(command)
      if (response.Contents) {
        for (const item of response.Contents) {
          totalSize += item.Size || 0
        }
      }
      isTruncated = response.IsTruncated
      continuationToken = response.NextContinuationToken
    }
    return totalSize
  } catch (error) {
    console.error('[R2] Failed to get bucket size:', error)
    return 0
  }
}

/**
 * Deletes a file from Cloudflare R2.
 * @param {string} fileName - The name of the file to delete.
 */
const deleteFileFromR2 = async (fileName) => {
  if (!fileName) return
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName
    })
    await s3Client.send(command)
  } catch (error) {
    console.error(`[R2] Delete failed for ${fileName}:`, error)
  }
}

/**
 * Deletes all objects in the bucket (used for wiping data).
 */
const emptyBucket = async () => {
  try {
    let isTruncated = true
    let continuationToken = undefined

    while (isTruncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken
      })
      const response = await s3Client.send(listCommand)
      
      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key) await deleteFileFromR2(item.Key)
        }
      }
      isTruncated = response.IsTruncated
      continuationToken = response.NextContinuationToken
    }
  } catch (error) {
    console.error('[R2] Failed to empty bucket:', error)
  }
}

module.exports = {
  uploadFileToR2,
  downloadFileFromR2,
  getBucketSize,
  deleteFileFromR2,
  emptyBucket
}
