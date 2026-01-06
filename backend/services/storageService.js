const fs = require("fs").promises;
const path = require("path");

class StorageService {
  constructor() {
    // For now, store files locally in uploads directory
    // Later, this can be updated to use Cloudflare R2 or AWS S3
    this.uploadDir = path.join(__dirname, "../uploads");
    this.voicesDir = path.join(this.uploadDir, "voices");
    this.audioDir = path.join(this.uploadDir, "audio");

    // Ensure directories exist
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.voicesDir, { recursive: true });
      await fs.mkdir(this.audioDir, { recursive: true });
      console.log("✅ Storage directories initialized");
    } catch (error) {
      console.error("Error creating directories:", error);
    }
  }

  /**
   * Upload a file to storage
   * @param {string} sourcePath - Path to the file to upload
   * @param {string} destinationPath - Destination path (e.g., 'voices/file.mp3')
   * @returns {Promise<string>} - URL to access the file
   */
  async uploadFile(sourcePath, destinationPath) {
    try {
      // Determine full destination path
      const fullDestPath = path.join(this.uploadDir, destinationPath);

      // Ensure destination directory exists
      const destDir = path.dirname(fullDestPath);
      await fs.mkdir(destDir, { recursive: true });

      // Copy file to destination
      await fs.copyFile(sourcePath, fullDestPath);

      // Return URL (in production, this would be a CDN URL)
      // For local development, return relative path
      const url = `/uploads/${destinationPath}`;

      console.log("✅ File uploaded:", url);
      return url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from storage
   * @param {string} fileUrl - URL or path to the file
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileUrl) {
    try {
      // Extract path from URL (remove /uploads/ prefix if present)
      const filePath = fileUrl.replace(/^\/uploads\//, "");
      const fullPath = path.join(this.uploadDir, filePath);

      // Check if file exists
      const exists = await this.fileExists(fileUrl);
      if (!exists) {
        console.warn("⚠️ File does not exist:", fullPath);
        return false;
      }

      // Delete file
      await fs.unlink(fullPath);
      console.log("✅ File deleted:", fullPath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in storage
   * @param {string} fileUrl - URL or path to the file
   * @returns {Promise<boolean>}
   */
  async fileExists(fileUrl) {
    try {
      const filePath = fileUrl.replace(/^\/uploads\//, "");
      const fullPath = path.join(this.uploadDir, filePath);

      await fs.access(fullPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param {string} fileUrl - URL or path to the file
   * @returns {Promise<number>}
   */
  async getFileSize(fileUrl) {
    try {
      const filePath = fileUrl.replace(/^\/uploads\//, "");
      const fullPath = path.join(this.uploadDir, filePath);

      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch (error) {
      console.error("Error getting file size:", error);
      return 0;
    }
  }

  /**
   * Check if storage service is configured
   * For local storage, always returns true
   * For cloud storage (R2/S3), would check credentials
   * @returns {boolean}
   */
  isConfigured() {
    return true; // Local storage is always available
  }
}

module.exports = new StorageService();
