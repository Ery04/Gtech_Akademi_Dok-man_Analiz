# Doküman Analiz Platformu

Modern web tabanlı doküman analiz platformu. PDF, Word ve metin dosyalarınızı yükleyip Google Gemini AI teknolojisi ile analiz edebilirsiniz.

## 🚀 Özellikler

### 📄 Doküman Yönetimi
- **Çoklu Format Desteği**: PDF, DOCX, TXT dosyaları
- **Güvenli Yükleme**: Maksimum 10MB dosya boyutu
- **Anında Filtreleme**: Doküman adına göre arama
- **Detaylı Görüntüleme**: Tam doküman içeriği

### 🤖 AI Destekli Analiz
- **Akıllı Özetleme**: Dokümanlarınızın özetini çıkarır
- **Anahtar Kelime Çıkarma**: Önemli terimleri belirler
- **Doğal Dil Arama**: Doküman içinde akıllı arama
- **Cache Sistemi**: Tekrar analiz maliyetini düşürür

### 👥 Kullanıcı Yönetimi
- **Güvenli Kimlik Doğrulama**: JWT tabanlı
- **Rol Tabanlı Erişim**: Admin ve kullanıcı rolleri
- **Admin Paneli**: Kullanıcı yönetimi ve istatistikler

### 🔍 Arama Özellikleri
- **Metin Arama**: MongoDB text search
- **Semantik Arama**: AI destekli anlam arama
- **Doküman İçi Arama**: Doğal dil sorguları

## 🛠️ Teknoloji Yığını

### Frontend
- **React.js 18** - Modern kullanıcı arayüzü
- **Tailwind CSS** - Responsive tasarım
- **React Router** - Sayfa yönlendirme
- **Axios** - HTTP istekleri
- **React Hot Toast** - Bildirimler

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL veritabanı
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File upload

### AI/ML
- **Google Gemini API** - Text analysis
- **Gemini 1.5 Pro** - LLM model

### Testing
- **Jest** - Test framework
- **Supertest** - API testing

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- MongoDB 5+
- Google Gemini API Key

### Adım 1: Repository'yi klonlayın
```bash
git clone <repository-url>
cd dokuman-analiz-platformu
```

### Adım 2: Backend kurulumu
```bash
cd server
npm install
```

### Adım 3: Environment variables
```bash
# server/.env dosyası oluşturun
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/document-analysis
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### Adım 4: Frontend kurulumu
```bash
cd ../client
npm install
```

### Adım 5: Uygulamayı başlatın
```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd client
npm start
```

## 🔧 Admin Hesabı Oluşturma

Admin hesabı oluşturmak için:

```bash
cd server
node create-admin.js
```

**Admin Giriş Bilgileri:**
- **E-posta:** admin@example.com
- **Şifre:** AdminPass123!

## 🧪 Test Çalıştırma

### Unit Testler
```bash
cd server
npm test
```

### Test Raporu Oluşturma
```bash
cd server
node run-tests.js
```

### Test Coverage
```bash
cd server
npm run test:coverage
```

## 📚 Dokümantasyon

### Kullanıcı Kılavuzu
- [Kullanıcı Kılavuzu](docs/user-guide.md) - Detaylı kullanım talimatları

### Teknik Dokümantasyon
- [Teknik Dokümantasyon](docs/technical-documentation.md) - Sistem mimarisi ve API
- [OpenAPI Specification](docs/openapi.yaml) - API dokümantasyonu

## 🔒 Güvenlik

### Authentication
- JWT tabanlı kimlik doğrulama
- bcrypt ile şifre hash'leme
- Role-based access control

### Authorization
- Kullanıcılar sadece kendi dokümanlarına erişebilir
- Admin middleware ile korunan endpoint'ler

### Rate Limiting
- API endpoint'leri için rate limiting
- Default: 100 istek/dakika

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Kullanıcı profili

### Documents
- `POST /api/documents/upload` - Doküman yükleme
- `GET /api/documents` - Doküman listesi
- `GET /api/documents/:id` - Doküman detayı
- `POST /api/documents/:id/summary` - Özet oluşturma
- `POST /api/documents/:id/keywords` - Anahtar kelime çıkarma
- `POST /api/documents/:id/search` - Doküman içi arama
- `DELETE /api/documents/:id` - Doküman silme

### Admin (Sadece Admin)
- `GET /api/admin/users` - Kullanıcı listesi
- `DELETE /api/admin/users/:id` - Kullanıcı silme
- `GET /api/admin/stats` - Sistem istatistikleri

## 🗄️ Veritabanı Şeması

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  createdAt: Date,
  lastLogin: Date
}
```

### Document Collection
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId (ref: User),
  fileName: String,
  fileType: String (enum: ['pdf', 'docx', 'txt']),
  fileSize: Number,
  contentText: String,
  summaryText: String,
  keywords: [String],
  uploadDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-production-secret
GEMINI_API_KEY=your-gemini-api-key
```

### Build
```bash
# Frontend build
cd client
npm run build

# Backend production
cd server
npm install --production
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Performans

### Optimizasyonlar
- MongoDB text indexes
- Response compression
- File size limits
- Cache strategy
- Pagination

### Monitoring
- Application logs
- Error tracking
- Performance metrics
- Database monitoring

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 Destek

Teknik destek için:
- Email: support@example.com
- GitHub Issues: [Issues](https://github.com/your-repo/issues)

## 🔄 Changelog

### v1.0.0 (2025-07-31)
- İlk sürüm
- Temel doküman yönetimi
- AI destekli analiz
- Admin paneli
- Kapsamlı test suite
- Detaylı dokümantasyon

---

**Geliştirici:** [Your Name]  
**Son Güncelleme:** 31 Temmuz 2025  
**Versiyon:** 1.0.0 