import React, { useState } from 'react';
import { documentsAPI } from '../../services/api';
import { Search, FileText, File, Calendar, Eye, FileSearch, Tag, X } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const validateSearchQuery = (query) => {
    // Sadece harf, rakam, boşluk ve Türkçe karakterlere izin ver
    const validPattern = /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]+$/;
    return validPattern.test(query);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Real-time validation
    if (value && !validateSearchQuery(value)) {
      setSearchError('Sadece harf, rakam ve boşluk kullanabilirsiniz');
    } else {
      setSearchError('');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Lütfen bir arama sorgusu girin', { duration: 8000 });
      return;
    }

    // Sadece kelime karakterlerine izin ver
    if (!validateSearchQuery(query)) {
      toast.error('Arama sorgusu sadece harf, rakam ve boşluk içerebilir. Özel karakterler kullanılamaz.', { duration: 8000 });
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const response = await documentsAPI.search(query.trim());
      setResults(response.data.data.results);
      
      if (response.data.data.results.length === 0) {
        toast.info('Arama sonucu bulunamadı');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Arama sırasında bir hata oluştu', { duration: 8000 });
    } finally {
      setSearching(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'docx':
        return <File className="w-6 h-6 text-blue-500" />;
      case 'txt':
        return <FileText className="w-6 h-6 text-gray-500" />;
      default:
        return <File className="w-6 h-6 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Doküman Arama
        </h1>
        <p className="text-gray-600">
          Dokümanlarınızda doğal dil ile arama yapın
        </p>
      </div>

      {/* Search form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Arama Sorgusu
            </label>
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={handleSearchInputChange}
                  placeholder="Örnek: makine öğrenimi, veri analizi, yapay zeka..."
                  className={`input-field pl-10 ${searchError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={searching}
                />
              </div>
              {searchError && (
                <div className="text-red-600 text-sm flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {searchError}
                </div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={searching || !query.trim() || searchError}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Aranıyor...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Search className="w-4 h-4 mr-2" />
                Ara
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Search results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Arama Sonuçları
            </h2>
            {results.length > 0 && (
              <span className="text-sm text-gray-500">
                {results.length} sonuç bulundu
              </span>
            )}
          </div>

          {searching ? (
            <LoadingSpinner text="Aranıyor..." />
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sonuç bulunamadı
              </h3>
              <p className="text-gray-600">
                "{query}" için arama sonucu bulunamadı. Farklı anahtar kelimeler deneyin.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((doc) => (
                <div key={doc._id} className="card">
                  <div className="flex items-start space-x-4">
                    {getFileIcon(doc.fileType)}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {doc.fileName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(doc.uploadDate)}
                        </span>
                        <span className="uppercase">{doc.fileType}</span>
                        {doc.similarity && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            Benzerlik: {Math.round(doc.similarity * 100)}%
                          </span>
                        )}
                      </div>
                      
                      {/* Content preview */}
                      {doc.contentText && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {highlightText(doc.contentText.substring(0, 200) + '...', query)}
                          </p>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => window.open(`/dashboard/document/${doc._id}`, '_blank')}
                          className="btn-secondary flex items-center text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Görüntüle
                        </button>
                        
                        <button
                          onClick={async () => {
                            try {
                              const response = await documentsAPI.getSummary(doc._id);
                              toast.success('Özet alındı!');
                              // You could show the summary in a modal or navigate to detail page
                            } catch (error) {
                              toast.error('Özet alınırken hata oluştu');
                            }
                          }}
                          className="btn-secondary flex items-center text-sm"
                        >
                          <FileSearch className="w-4 h-4 mr-1" />
                          Özet
                        </button>
                        
                        <button
                          onClick={async () => {
                            try {
                              const response = await documentsAPI.getKeywords(doc._id);
                              toast.success('Anahtar kelimeler alındı!');
                              // You could show the keywords in a modal or navigate to detail page
                            } catch (error) {
                              toast.error('Anahtar kelimeler alınırken hata oluştu');
                            }
                          }}
                          className="btn-secondary flex items-center text-sm"
                        >
                          <Tag className="w-4 h-4 mr-1" />
                          Anahtar Kelimeler
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search tips */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-4">Arama İpuçları:</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Doğal Dil Arama</h4>
            <ul className="space-y-1">
              <li>• "Makine öğrenimi nedir?" gibi sorular sorabilirsiniz</li>
              <li>• "Veri analizi teknikleri" gibi konular arayabilirsiniz</li>
              <li>• Tam cümleler veya anahtar kelimeler kullanabilirsiniz</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Semantik Arama</h4>
            <ul className="space-y-1">
              <li>• Benzer anlamlı kelimeler de bulunur</li>
              <li>• "AI" aradığınızda "yapay zeka" da bulunur</li>
              <li>• Bağlam bazlı sonuçlar alırsınız</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSearch; 