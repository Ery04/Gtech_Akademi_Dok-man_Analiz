const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAPI() {
  try {
    console.log('=== Gemini API Test ===');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is missing!');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    console.log('✅ API initialized successfully');
    
    // Test simple request
    console.log('📤 Sending test request...');
    const result = await model.generateContent('Merhaba, bu bir test mesajıdır. Lütfen "Test başarılı" yanıtını ver.');
    const response = await result.response;
    
    console.log('📥 Response received:', response.text());
    console.log('✅ API test successful!');
    
    // Test summary functionality
    console.log('\n=== Summary Test ===');
    const testText = `
    Yapay zeka (AI), bilgisayarların insan benzeri düşünme ve öğrenme yeteneklerine sahip olmasını sağlayan teknolojidir. 
    Makine öğrenmesi, derin öğrenme ve doğal dil işleme gibi alt alanları içerir. 
    Günümüzde sağlık, eğitim, finans ve ulaşım gibi birçok sektörde kullanılmaktadır.
    `;
    
    const summaryPrompt = `
    Aşağıdaki metni Türkçe olarak özetle. Özet 100 kelimeyi geçmesin ve metnin ana fikirlerini içersin:
    
    ${testText}
    
    Özet:
    `;
    
    console.log('📤 Sending summary request...');
    const summaryResult = await model.generateContent(summaryPrompt);
    const summaryResponse = await summaryResult.response;
    
    console.log('📥 Summary generated:', summaryResponse.text().trim());
    console.log('✅ Summary test successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      code: error.code
    });
  }
}

testAPI(); 