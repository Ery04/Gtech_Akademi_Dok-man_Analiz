const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

class FileService {
  // PDF dosyasından metin çıkarma
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parse error:', error);
      throw new Error('PDF dosyasından metin çıkarılamadı. Dosyanın metin içerikli olduğundan emin olun.');
    }
  }

  // Word dosyasından metin çıkarma
  async extractTextFromDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX parse error:', error);
      throw new Error('Word dosyasından metin çıkarılamadı.');
    }
  }

  // TXT dosyasından metin çıkarma
  extractTextFromTxt(buffer) {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('TXT parse error:', error);
      throw new Error('Metin dosyasından içerik çıkarılamadı.');
    }
  }

  // Dosya türüne göre metin çıkarma
  async extractTextFromFile(buffer, fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return await this.extractTextFromPDF(buffer);
      case 'docx':
        return await this.extractTextFromDocx(buffer);
      case 'txt':
        return this.extractTextFromTxt(buffer);
      default:
        throw new Error(`Desteklenmeyen dosya türü: ${fileType}`);
    }
  }

  // Dosya türünü dosya adından belirleme
  getFileTypeFromName(fileName) {
    const extension = path.extname(fileName).toLowerCase().substring(1);
    const supportedTypes = ['pdf', 'docx', 'txt'];
    
    if (!supportedTypes.includes(extension)) {
      throw new Error(`Desteklenmeyen dosya türü: ${extension}`);
    }
    
    return extension;
  }

  // Dosya boyutunu formatlama
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Metin temizleme ve normalleştirme
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa çevir
      .replace(/\n+/g, '\n') // Birden fazla satır sonunu tek satır sonuna çevir
      .trim(); // Başındaki ve sonundaki boşlukları kaldır
  }

  // Metin uzunluğunu kontrol etme
  validateTextLength(text, maxLength = 1000000) {
    if (!text) {
      throw new Error('Dosya içeriği boş olamaz.');
    }
    
    if (text.length > maxLength) {
      throw new Error(`Dosya içeriği çok büyük. Maksimum ${maxLength} karakter olmalıdır.`);
    }
    
    return true;
  }

  // Dosya adını güvenli hale getirme
  sanitizeFileName(fileName) {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Özel karakterleri _ ile değiştir
      .replace(/_+/g, '_') // Birden fazla _'yi tek _'ye çevir
      .substring(0, 255); // Maksimum uzunluk
  }

  // Dosya içeriğini analiz etme
  analyzeFileContent(text) {
    const analysis = {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      lineCount: text.split('\n').length,
      paragraphCount: text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length,
      averageWordLength: 0,
      readingTime: 0
    };

    // Ortalama kelime uzunluğu
    const words = text.split(/\s+/).filter(word => word.length > 0);
    if (words.length > 0) {
      const totalLength = words.reduce((sum, word) => sum + word.length, 0);
      analysis.averageWordLength = (totalLength / words.length).toFixed(2);
    }

    // Tahmini okuma süresi (dakika)
    analysis.readingTime = Math.ceil(analysis.wordCount / 200); // Ortalama 200 kelime/dakika

    return analysis;
  }
}

module.exports = new FileService(); 