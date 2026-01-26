const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rag_project_docs', // Tên thư mục trên Cloud
    allowedFormats: ['pdf'],
    resource_type: 'raw' // Quan trọng: Để giữ nguyên định dạng PDF gốc
  }
});

module.exports = { storage };