import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsAPI } from '../../services/api';
import { 
  FileText, 
  File, 
  Calendar, 
  ArrowLeft,
  FileSearch,
  Tag,
  Copy,
  Download,
  Search,
  X,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentDetail = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [keywords, setKeywords] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getById(id);
      const doc = response.data.data.document;
      setDocument(doc);
      
      // Eğer dokümanda özet ve anahtar kelimeler varsa, onları yükle
      if (doc.summaryText) {
        setSummary(doc.summaryText);
      }
      if (doc.keywords && doc.keywords.length > 0) {
        setKeywords(doc.keywords);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Doküman yüklenirken bir hata oluştu', { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    try {
      setLoadingSummary(true);
      const response = await documentsAPI.getSummary(id);
      setSummary(response.data.data.summary);
      
      if (response.data.data.cached) {
        toast.success('Özet başarıyla yüklendi', { duration: 3000 });
      } else {
        toast.success('Özet başarıyla oluşturuldu', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error getting summary:', error);
      if (error.response?.status === 429) {
        toast.error('Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.', { duration: 8000 });
      } else {
        toast.error('Özet alınırken bir hata oluştu', { duration: 8000 });
      }
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGetKeywords = async () => {
    try {
      setLoadingKeywords(true);
      const response = await documentsAPI.getKeywords(id);
      setKeywords(response.data.data.keywords);
      
      if (response.data.data.cached) {
        toast.success('Anahtar kelimeler başarıyla yüklendi', { duration: 3000 });
      } else {
        toast.success('Anahtar kelimeler başarıyla çıkarıldı', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error getting keywords:', error);
      if (error.response?.status === 429) {
        toast.error('Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.', { duration: 8000 });
      } else {
        toast.error('Anahtar kelimeler alınırken bir hata oluştu', { duration: 8000 });
      }
    } finally {
      setLoadingKeywords(false);
    }
  };

  const validateSearchQuery = (query) => {
    // Sadece harf, rakam, boşluk ve Türkçe karakterlere izin ver
    const validPattern = /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]+$/;
    return validPattern.test(query);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Real-time validation
    if (value && !validateSearchQuery(value)) {
      setSearchError('Sadece harf, rakam ve boşluk kullanabilirsiniz');
    } else {
      setSearchError('');
    }
  };

  const handleSearchInDocument = async () => {
    if (!searchQuery.trim()) {
      toast.error('Lütfen bir arama sorgusu girin', { duration: 8000 });
      return;
    }

    // Sadece kelime karakterlerine izin ver
    if (!validateSearchQuery(searchQuery)) {
      toast.error('Arama sorgusu sadece harf, rakam ve boşluk içerebilir. Özel karakterler kullanılamaz.', { duration: 8000 });
      return;
    }

    try {
      setLoadingSearch(true);
      const response = await documentsAPI.searchInDocument(id, searchQuery);
      setSearchResults(response.data.data.results);
      toast.success(`${response.data.data.totalResults} sonuç bulundu`, { duration: 3000 });
    } catch (error) {
      console.error('Error searching in document:', error);
      if (error.response?.status === 429) {
        toast.error('Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.', { duration: 8000 });
      } else {
        toast.error('Arama yapılırken bir hata oluştu', { duration: 8000 });
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    setSearchError('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Panoya kopyalandı', { duration: 3000 });
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'docx':
        return <File className="w-8 h-8 text-blue-500" />;
      case 'txt':
        return <FileText className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <LoadingSpinner text="Doküman yükleniyor..." />;
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Doküman bulunamadı
        </h3>
        <p className="text-gray-600 mb-4">
          Belirtilen doküman bulunamadı veya erişim izniniz yok.
        </p>
        <Link to="/dashboard" className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dokümanlara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.fileName}</h1>
            <p className="text-gray-600">Doküman detayları ve analiz</p>
          </div>
        </div>
      </div>

      {/* Document info */}
      <div className="card">
        <div className="flex items-start space-x-4">
          {getFileIcon(document.fileType)}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {document.fileName}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Yüklenme: {formatDate(document.uploadDate)}</span>
              </div>
              <div>
                <span>Boyut: {formatFileSize(document.fileSize)}</span>
              </div>
              <div>
                <span>Tür: {document.fileType.toUpperCase()}</span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
                             <button
                 onClick={handleGetSummary}
                 disabled={loadingSummary}
                 className="btn-primary flex items-center disabled:opacity-50"
               >
                 <FileSearch className="w-4 h-4 mr-2" />
                 {loadingSummary ? 'İşleniyor...' : (summary ? 'Tekrar Özet Çıkar' : 'Özet Oluştur')}
               </button>
              
                             <button
                 onClick={handleGetKeywords}
                 disabled={loadingKeywords}
                 className="btn-secondary flex items-center disabled:opacity-50"
               >
                 <Tag className="w-4 h-4 mr-2" />
                 {loadingKeywords ? 'İşleniyor...' : (keywords && keywords.length > 0 ? 'Tekrar Anahtar Kelimeler Çıkar' : 'Anahtar Kelimeler')}
               </button>
              
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="btn-secondary flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Doküman İçinde Ara
              </button>
              
              <button
                onClick={() => copyToClipboard(document.contentText)}
                className="btn-secondary flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Metni Kopyala
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      {showSearch && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Doküman İçinde Arama
            </h3>
            <button
              onClick={clearSearch}
              className="btn-secondary flex items-center text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Temizle
            </button>
          </div>
          
                     <div className="space-y-2">
             <div className="flex gap-2">
               <input
                 type="text"
                 value={searchQuery}
                 onChange={handleSearchInputChange}
                 placeholder="Doğal dil ile arama yapın... (örn: 'yapay zeka hakkında bilgi')"
                 className={`input-field flex-1 ${searchError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                 onKeyPress={(e) => e.key === 'Enter' && handleSearchInDocument()}
               />
               <button
                 onClick={handleSearchInDocument}
                 disabled={loadingSearch || !searchQuery.trim() || searchError}
                 className="btn-primary flex items-center disabled:opacity-50"
               >
                 {loadingSearch ? (
                   <RefreshCw className="w-4 h-4 animate-spin" />
                 ) : (
                   <Search className="w-4 h-4" />
                 )}
               </button>
             </div>
             {searchError && (
               <div className="text-red-600 text-sm flex items-center">
                 <X className="w-4 h-4 mr-1" />
                 {searchError}
               </div>
             )}
           </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {searchResults.length} sonuç bulundu:
              </h4>
              {searchResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Önem: {result.importance}/10
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.text)}
                      className="btn-secondary flex items-center text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Kopyala
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{result.description}</p>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {result.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileSearch className="w-5 h-5 mr-2" />
              Özet
            </h3>
            <button
              onClick={() => copyToClipboard(summary)}
              className="btn-secondary flex items-center text-sm"
            >
              <Copy className="w-4 h-4 mr-1" />
              Kopyala
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {/* Keywords */}
      {keywords && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Anahtar Kelimeler
            </h3>
            <button
              onClick={() => copyToClipboard(keywords.join(', '))}
              className="btn-secondary flex items-center text-sm"
            >
              <Copy className="w-4 h-4 mr-1" />
              Kopyala
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Doküman İçeriği</h3>
          <div className="text-sm text-gray-500">
            {document.contentText?.length || 0} karakter
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <pre className="text-gray-700 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {document.contentText}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail; 