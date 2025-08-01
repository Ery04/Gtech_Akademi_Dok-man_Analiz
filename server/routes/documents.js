const express = require('express');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const fileService = require('../services/fileService');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Tüm route'lar için authentication gerekli
router.use(protect);

// Doküman yükleme
router.post('/upload', upload.single('document'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Dosya hatası',
        message: 'Lütfen bir dosya seçin.'
      });
    }

    const { originalname, buffer, size } = req.file;
    
    // Dosya türünü belirle
    const fileType = fileService.getFileTypeFromName(originalname);
    
    // Metin içeriğini çıkar
    const rawText = await fileService.extractTextFromFile(buffer, fileType);
    const cleanText = fileService.cleanText(rawText);
    
    // Metin uzunluğunu kontrol et
    fileService.validateTextLength(cleanText);
    
    // Dosya analizi
    const analysis = fileService.analyzeFileContent(cleanText);
    
    // Embedding oluştur
    const embedding = await geminiService.generateEmbedding(cleanText);
    
    // Dokümanı veritabanına kaydet
    const document = await Document.create({
      ownerId: req.user._id,
      fileName: fileService.sanitizeFileName(originalname),
      fileType,
      fileSize: size,
      contentText: cleanText,
      embedding,
      uploadDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Doküman başarıyla yüklendi.',
      data: {
        document: {
          id: document._id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: fileService.formatFileSize(document.fileSize),
          uploadDate: document.uploadDate,
          analysis
        }
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.message.includes('Desteklenmeyen dosya türü')) {
      return res.status(400).json({
        error: 'Dosya türü hatası',
        message: error.message
      });
    }
    
    if (error.message.includes('Dosya içeriği')) {
      return res.status(400).json({
        error: 'İçerik hatası',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Yükleme hatası',
      message: 'Doküman yüklenirken bir hata oluştu.'
    });
  }
});

// Kullanıcının dokümanlarını listele
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-uploadDate' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      select: '-contentText -embedding' // Büyük alanları çıkar, summaryText ve keywords dahil
    };

    const documents = await Document.paginate(
      { ownerId: req.user._id },
      options
    );

    res.json({
      success: true,
      data: {
        documents: documents.docs,
        pagination: {
          currentPage: documents.page,
          totalPages: documents.totalPages,
          totalDocs: documents.totalDocs,
          hasNextPage: documents.hasNextPage,
          hasPrevPage: documents.hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Dokümanlar listelenirken bir hata oluştu.'
    });
  }
});

// Tek doküman getir
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    }).select('-embedding');

    if (!document) {
      return res.status(404).json({
        error: 'Doküman bulunamadı',
        message: 'Belirtilen doküman bulunamadı veya erişim izniniz yok.'
      });
    }

    res.json({
      success: true,
      data: { document }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Doküman alınırken bir hata oluştu.'
    });
  }
});

// Doküman arama
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Arama hatası',
        message: 'Arama sorgusu gereklidir.'
      });
    }

    const searchQuery = query.trim();
    
    // Sorgu embedding'i oluştur
    const queryEmbedding = await geminiService.generateEmbedding(searchQuery);
    
    // Hem text search hem de semantic search yap
    const textResults = await Document.find({
      ownerId: req.user._id,
      $text: { $search: searchQuery }
    }).select('-embedding').limit(parseInt(limit));

    // Semantic search için tüm dokümanları al ve benzerlik hesapla
    const allDocuments = await Document.find({
      ownerId: req.user._id
    }).select('-embedding');

    const semanticResults = allDocuments
      .map(doc => ({
        document: doc,
        similarity: geminiService.calculateSimilarity(queryEmbedding, doc.embedding)
      }))
      .filter(result => result.similarity > 0.3) // Eşik değeri
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit))
      .map(result => ({
        ...result.document.toObject(),
        similarity: result.similarity
      }));

    // Sonuçları birleştir ve sırala
    const combinedResults = [...textResults, ...semanticResults];
    const uniqueResults = combinedResults.filter((doc, index, self) => 
      index === self.findIndex(d => d._id.toString() === doc._id.toString())
    );

    res.json({
      success: true,
      data: {
        results: uniqueResults.slice(0, parseInt(limit)),
        query: searchQuery,
        totalResults: uniqueResults.length
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Arama hatası',
      message: 'Arama işlemi sırasında bir hata oluştu.'
    });
  }
});

// Doküman özetleme
router.post('/:id/summary', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        error: 'Doküman bulunamadı',
        message: 'Belirtilen doküman bulunamadı veya erişim izniniz yok.'
      });
    }

    // Eğer özet zaten varsa, onu döndür
    if (document.summaryText) {
      return res.json({
        success: true,
        data: {
          summary: document.summaryText,
          cached: true
        }
      });
    }

    // Yeni özet oluştur
    const summary = await geminiService.summarizeText(document.contentText);
    
    // Özeti veritabanına kaydet
    document.summaryText = summary;
    document.lastProcessed = new Date();
    await document.save();

    res.json({
      success: true,
      data: {
        summary,
        cached: false
      }
    });

  } catch (error) {
    console.error('Summary error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // API key hatası kontrolü
    if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
      return res.status(500).json({
        error: 'API Anahtarı Hatası',
        message: 'Gemini API anahtarı geçersiz veya eksik. Lütfen sistem yöneticisi ile iletişime geçin.'
      });
    }
    
    // Rate limit hatası kontrolü
    if (error.message.includes('rate') || error.message.includes('quota')) {
      return res.status(429).json({
        error: 'Rate Limit Hatası',
        message: 'API istek limiti aşıldı. Lütfen bir süre bekleyip tekrar deneyin.'
      });
    }
    
    res.status(500).json({
      error: 'Özetleme hatası',
      message: `Doküman özetlenirken bir hata oluştu: ${error.message}`
    });
  }
});

// Doküman içinde arama
router.post('/:id/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Arama sorgusu gerekli',
        message: 'Lütfen bir arama sorgusu girin.'
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        error: 'Doküman bulunamadı',
        message: 'Belirtilen doküman bulunamadı veya erişim izniniz yok.'
      });
    }

    // Doküman içinde arama yap
    const searchResults = await geminiService.searchInDocument(
      document.contentText, 
      query.trim()
    );

    res.json({
      success: true,
      data: {
        results: searchResults,
        query: query.trim(),
        totalResults: searchResults.length
      }
    });

  } catch (error) {
    console.error('Document search error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Arama hatası',
      message: `Doküman içinde arama yapılırken bir hata oluştu: ${error.message}`
    });
  }
});

// Anahtar kelime çıkarma
router.post('/:id/keywords', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        error: 'Doküman bulunamadı',
        message: 'Belirtilen doküman bulunamadı veya erişim izniniz yok.'
      });
    }

    // Eğer anahtar kelimeler zaten varsa, onları döndür
    if (document.keywords && document.keywords.length > 0) {
      return res.json({
        success: true,
        data: {
          keywords: document.keywords,
          cached: true
        }
      });
    }

    // Yeni anahtar kelimeler çıkar
    const keywords = await geminiService.extractKeywords(document.contentText);
    
    // Anahtar kelimeleri veritabanına kaydet
    document.keywords = keywords;
    document.lastProcessed = new Date();
    await document.save();

    res.json({
      success: true,
      data: {
        keywords,
        cached: false
      }
    });

  } catch (error) {
    console.error('Keywords error:', error);
    res.status(500).json({
      error: 'Anahtar kelime hatası',
      message: 'Anahtar kelimeler çıkarılırken bir hata oluştu.'
    });
  }
});

// Doküman silme
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        error: 'Doküman bulunamadı',
        message: 'Belirtilen doküman bulunamadı veya erişim izniniz yok.'
      });
    }

    res.json({
      success: true,
      message: 'Doküman başarıyla silindi.'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Silme hatası',
      message: 'Doküman silinirken bir hata oluştu.'
    });
  }
});

module.exports = router; 