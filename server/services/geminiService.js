const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  // Metin özetleme
  async summarizeText(text, maxLength = 500) {
    try {
      console.log('Summarizing text with length:', text.length);
      
      if (!text || text.trim().length === 0) {
        throw new Error('Özetlenecek metin boş olamaz');
      }

      const prompt = `
        Aşağıdaki metni Türkçe olarak özetle. Özet ${maxLength} kelimeyi geçmesin ve metnin ana fikirlerini içersin:
        
        ${text}
        
        Özet:
      `;

      console.log('Sending request to Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();
      
      console.log('Summary generated successfully, length:', summary.length);
      return summary;
    } catch (error) {
      console.error('Gemini summarize error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`Metin özetlenirken bir hata oluştu: ${error.message}`);
    }
  }

  // Anahtar kelime çıkarma
  async extractKeywords(text, maxKeywords = 10) {
    try {
      const prompt = `
        Aşağıdaki metinden en önemli ${maxKeywords} anahtar kelimeyi veya kelime öbeğini çıkar. 
        Sadece anahtar kelimeleri virgülle ayırarak liste halinde ver, başka açıklama ekleme:
        
        ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const keywordsText = response.text().trim();
      
      // Anahtar kelimeleri temizle ve diziye çevir
      const keywords = keywordsText
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .slice(0, maxKeywords);

      return keywords;
    } catch (error) {
      console.error('Gemini keywords error:', error);
      throw new Error('Anahtar kelimeler çıkarılırken bir hata oluştu');
    }
  }

  // Semantik arama için embedding (basit vektör benzeri)
  async generateEmbedding(text) {
    try {
      // Gemini'nin embedding özelliği henüz tam olarak desteklenmediği için
      // basit bir hash-based embedding kullanıyoruz
      // Gerçek uygulamada Google'ın embedding API'si kullanılabilir
      
      const prompt = `
        Bu metni analiz et ve semantik özelliklerini belirle:
        ${text}
        
        Yanıt olarak sadece sayısal değerler ver (0-1 arası).
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Basit bir embedding simülasyonu
      // Gerçek uygulamada bu kısım Google'ın embedding API'si ile değiştirilmeli
      const textLength = text.length;
      const wordCount = text.split(/\s+/).length;
      const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size;
      
      return [
        Math.min(textLength / 10000, 1), // Normalize edilmiş uzunluk
        Math.min(wordCount / 1000, 1),   // Normalize edilmiş kelime sayısı
        Math.min(uniqueWords / 500, 1),  // Normalize edilmiş benzersiz kelime sayısı
        Math.random() * 0.1 + 0.9        // Rastgele varyasyon
      ];
    } catch (error) {
      console.error('Gemini embedding error:', error);
      // Hata durumunda basit bir embedding döndür
      return [0.5, 0.5, 0.5, 0.5];
    }
  }

  // Semantik benzerlik hesaplama
  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    // Kosinüs benzerliği hesaplama
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (norm1 * norm2);
  }

  // Metin analizi (genel)
  async analyzeText(text) {
    try {
      const prompt = `
        Bu metni analiz et ve şu bilgileri ver:
        1. Ana konu nedir?
        2. Metin türü nedir? (makale, rapor, e-posta, vb.)
        3. Anahtar kavramlar nelerdir?
        4. Metnin tonu nasıl? (resmi, samimi, teknik, vb.)
        
        Metin: ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new Error('Metin analizi sırasında bir hata oluştu');
    }
  }

  // Doküman içinde doğal dil arama
  async searchInDocument(documentText, searchQuery, maxResults = 5) {
    try {
      console.log('Searching in document with query:', searchQuery);
      
      if (!documentText || !searchQuery) {
        throw new Error('Doküman metni ve arama sorgusu gerekli');
      }

      const prompt = `
        Aşağıdaki doküman içinde "${searchQuery}" sorgusuyla ilgili bölümleri bul ve analiz et.
        
        Doküman:
        ${documentText}
        
        Sorgu: ${searchQuery}
        
        Yanıtını şu formatta ver:
        1. İlgili bölümlerin başlangıç ve bitiş pozisyonları (karakter sayısı olarak)
        2. Her bölüm için kısa açıklama
        3. Bulunan bölümlerin önem derecesi (1-10 arası)
        
        Format:
        BÖLÜM 1: [başlangıç]-[bitiş] - [açıklama] - Önem: [1-10]
        BÖLÜM 2: [başlangıç]-[bitiş] - [açıklama] - Önem: [1-10]
        ...
      `;

      console.log('Sending search request to Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const searchResults = response.text().trim();
      
      console.log('Search results generated successfully');
      return this.parseSearchResults(searchResults, documentText);
    } catch (error) {
      console.error('Gemini search error:', error);
      throw new Error(`Doküman içinde arama yapılırken bir hata oluştu: ${error.message}`);
    }
  }

  // Arama sonuçlarını parse et
  parseSearchResults(resultsText, documentText) {
    try {
      const lines = resultsText.split('\n').filter(line => line.trim());
      const parsedResults = [];

      for (const line of lines) {
        if (line.includes('BÖLÜM') && line.includes('-')) {
          const parts = line.split(' - ');
          if (parts.length >= 3) {
            const positionPart = parts[0].replace('BÖLÜM', '').trim();
            const positionMatch = positionPart.match(/(\d+)-(\d+)/);
            
            if (positionMatch) {
              const start = parseInt(positionMatch[1]);
              const end = parseInt(positionMatch[2]);
              const description = parts[1] || '';
              const importanceMatch = parts[2]?.match(/Önem:\s*(\d+)/);
              const importance = importanceMatch ? parseInt(importanceMatch[1]) : 5;

              // Metin parçasını al
              const textSnippet = documentText.substring(start, end);
              
              parsedResults.push({
                start,
                end,
                text: textSnippet,
                description,
                importance
              });
            }
          }
        }
      }

      // Önem derecesine göre sırala
      return parsedResults.sort((a, b) => b.importance - a.importance);
    } catch (error) {
      console.error('Error parsing search results:', error);
      return [];
    }
  }
}

module.exports = new GeminiService(); 