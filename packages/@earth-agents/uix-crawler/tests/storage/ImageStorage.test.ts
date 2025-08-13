import { ImageStorage } from '../../src/storage/ImageStorage';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ImageStorage', () => {
  let storage: ImageStorage;
  const testDir = path.join(__dirname, '../../tmp/test-images');

  beforeEach(async () => {
    storage = new ImageStorage(`file://${testDir}`);
    await storage.initialize();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('initialization', () => {
    it('should create local directory on initialize', async () => {
      const customPath = path.join(__dirname, '../../tmp/custom-images');
      const customStorage = new ImageStorage(`file://${customPath}`);
      
      await customStorage.initialize();
      
      const dirExists = await fs.access(customPath).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
      
      // Clean up
      await fs.rm(customPath, { recursive: true, force: true });
    });

    it('should handle cloud storage initialization', async () => {
      const cloudStorage = new ImageStorage('s3://my-bucket/images');
      await expect(cloudStorage.initialize()).resolves.not.toThrow();
    });
  });

  describe('upload operations', () => {
    it('should upload base64 image data', async () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const url = await storage.upload(base64Data, 'test-image');
      
      expect(url).toMatch(/^file:\/\/.+test-image-.+\.png$/);
      
      // Verify file exists
      const filePath = url.replace('file://', '');
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should upload raw buffer data', async () => {
      const buffer = Buffer.from('test image data');
      const bufferString = buffer.toString();
      
      const url = await storage.upload(bufferString, 'buffer-test');
      
      expect(url).toMatch(/^file:\/\/.+buffer-test-.+\.png$/);
    });

    it('should generate unique filenames', async () => {
      const data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const url1 = await storage.upload(data, 'duplicate');
      const url2 = await storage.upload(data, 'duplicate');
      
      expect(url1).not.toBe(url2);
    });

    it('should handle cloud storage upload', async () => {
      const cloudStorage = new ImageStorage('s3://my-bucket/images');
      await cloudStorage.initialize();
      
      const url = await cloudStorage.upload('test-data', 'cloud-test');
      expect(url).toMatch(/^https:\/\/uix-screenshots\.s3\.amazonaws\.com\//);
    });
  });

  describe('download operations', () => {
    it('should download local file', async () => {
      const data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const url = await storage.upload(data, 'download-test');
      
      const downloaded = await storage.download(url);
      
      expect(downloaded).toBeInstanceOf(Buffer);
      expect(downloaded.length).toBeGreaterThan(0);
    });

    it('should handle data URL download', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const downloaded = await storage.download(dataUrl);
      
      expect(downloaded).toBeInstanceOf(Buffer);
    });

    it('should throw error for cloud download (not implemented)', async () => {
      await expect(storage.download('https://example.com/image.png'))
        .rejects.toThrow('Cloud download not implemented');
    });
  });

  describe('delete operations', () => {
    it('should delete local file', async () => {
      const data = 'test-data';
      const url = await storage.upload(data, 'delete-test');
      
      await storage.delete(url);
      
      const filePath = url.replace('file://', '');
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should handle cloud delete', async () => {
      await expect(storage.delete('https://example.com/image.png'))
        .resolves.not.toThrow();
    });
  });

  describe('batch operations', () => {
    it('should batch upload multiple images', async () => {
      const images = [
        { data: 'data1', name: 'batch1' },
        { data: 'data2', name: 'batch2' },
        { data: 'data3', name: 'batch3' }
      ];
      
      const urls = await storage.batchUpload(images);
      
      expect(urls).toHaveLength(3);
      urls.forEach(url => {
        expect(url).toMatch(/^file:\/\/.+batch\d-.+\.png$/);
      });
    });
  });

  describe('cleanup operations', () => {
    it('should clean up old images', async () => {
      // Create some test files
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago
      const newDate = new Date();
      
      const url1 = await storage.upload('old-data', 'old-image');
      const url2 = await storage.upload('new-data', 'new-image');
      
      // Manually change the modification time of the old file
      const oldPath = url1.replace('file://', '');
      await fs.utimes(oldPath, oldDate, oldDate);
      
      // Clean up files older than 1 day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const deletedCount = await storage.cleanup(oneDayAgo);
      
      expect(deletedCount).toBe(1);
      
      // Verify old file is deleted, new file remains
      const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
      const newPath = url2.replace('file://', '');
      const newExists = await fs.access(newPath).then(() => true).catch(() => false);
      
      expect(oldExists).toBe(false);
      expect(newExists).toBe(true);
    });
  });

  describe('storage statistics', () => {
    it('should return storage stats', async () => {
      await storage.upload('data1', 'stats-test1');
      await storage.upload('data2', 'stats-test2');
      
      const stats = await storage.getStorageStats();
      
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestFile).toBeInstanceOf(Date);
      expect(stats.newestFile).toBeInstanceOf(Date);
    });

    it('should return empty stats for cloud storage', async () => {
      const cloudStorage = new ImageStorage('s3://my-bucket/images');
      await cloudStorage.initialize();
      
      const stats = await cloudStorage.getStorageStats();
      
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestFile).toBeNull();
      expect(stats.newestFile).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should generate thumbnails (mock)', async () => {
      const thumbnail = await storage.generateThumbnail('https://example.com/image.png', 150, 100);
      // Mock implementation just returns the original URL
      expect(thumbnail).toBe('https://example.com/image.png');
    });

    it('should optimize images (mock)', async () => {
      const optimized = await storage.optimizeImage('https://example.com/image.png', 75);
      // Mock implementation just returns the original URL
      expect(optimized).toBe('https://example.com/image.png');
    });

    it('should get image metadata (mock)', async () => {
      const metadata = await storage.getImageMetadata('https://example.com/image.png');
      
      expect(metadata).toEqual({
        width: 1920,
        height: 1080,
        format: 'png',
        size: 1024 * 1024
      });
    });
  });
});