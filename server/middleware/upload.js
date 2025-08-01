const multer = require('multer');
const path = require('path');

// Desteklenen dosya türleri
const allowedFileTypes = ['pdf', 'docx', 'txt'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

// Dosya türü kontrolü
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedFileTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Desteklenmeyen dosya türü. Sadece ${allowedFileTypes.join(', ')} dosyaları kabul edilir.`), false);
  }
};

// Multer konfigürasyonu
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1 // Tek dosya
  }
});

// Hata yakalama middleware'i
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Dosya boyutu hatası',
        message: `Dosya boyutu ${maxFileSize / (1024 * 1024)}MB'dan küçük olmalıdır.`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Dosya sayısı hatası',
        message: 'Aynı anda sadece bir dosya yükleyebilirsiniz.'
      });
    }
  }
  
  if (error.message.includes('Desteklenmeyen dosya türü')) {
    return res.status(400).json({
      error: 'Dosya türü hatası',
      message: error.message
    });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({
    error: 'Dosya yükleme hatası',
    message: 'Dosya yüklenirken bir hata oluştu.'
  });
};

module.exports = { upload, handleUploadError }; 