import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI } from '../../services/api';
import { 
  FileText, 
  File, 
  Calendar, 
  Download, 
  Trash2,
  Upload,
  Eye,
  FileSearch,
  Tag,
  X
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);
  const [processingSummary, setProcessingSummary] = useState({});
  const [processingKeywords, setProcessingKeywords] = useState({});
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [currentPage]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getAll({ page: currentPage, limit: 10 });
      setDocuments(response.data.data.documents);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Dokümanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Bu dokümanı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await documentsAPI.delete(documentId);
      toast.success('Doküman başarıyla silindi');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Doküman silinirken bir hata oluştu');
    }
  };

  const handleGetSummary = async (documentId) => {
    try {
      setProcessingSummary(prev => ({ ...prev, [documentId]: true }));
      const response = await documentsAPI.getSummary(documentId);
      setSelectedDocument(response.data.data.summary);
      setShowSummary(true);
      setShowKeywords(false);
      
      if (response.data.data.cached) {
        toast.success('Özet başarıyla yüklendi');
      } else {
        toast.success('Özet başarıyla oluşturuldu');
      }
    } catch (error) {
      console.error('Error getting summary:', error);
      if (error.response?.status === 429) {
        toast.error('Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.');
      } else {
        toast.error('Özet alınırken bir hata oluştu');
      }
    } finally {
      setProcessingSummary(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const handleGetKeywords = async (documentId) => {
    try {
      setProcessingKeywords(prev => ({ ...prev, [documentId]: true }));
      const response = await documentsAPI.getKeywords(documentId);
      setSelectedDocument(response.data.data.keywords);
      setShowKeywords(true);
      setShowSummary(false);
      
      if (response.data.data.cached) {
        toast.success('Anahtar kelimeler başarıyla yüklendi');
      } else {
        toast.success('Anahtar kelimeler başarıyla çıkarıldı');
      }
    } catch (error) {
      console.error('Error getting keywords:', error);
      if (error.response?.status === 429) {
        toast.error('Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.');
      } else {
        toast.error('Anahtar kelimeler alınırken bir hata oluştu');
      }
    } finally {
      setProcessingKeywords(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(filterQuery.toLowerCase())
  );

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
    return <LoadingSpinner text="Dokümanlar yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-gray-900">Dokümanlarım</h1>
           <p className="text-gray-600">Yüklediğiniz dokümanları yönetin ve analiz edin</p>
         </div>
         <div className="flex space-x-3">
           <Link
             to="/dashboard/upload"
             className="btn-primary flex items-center"
           >
             <Upload className="w-4 h-4 mr-2" />
             Yeni Doküman
           </Link>
         </div>
       </div>

       {/* Filter Bar */}
       <div className="card">
         <div className="flex gap-2">
           <input
             type="text"
             value={filterQuery}
             onChange={(e) => setFilterQuery(e.target.value)}
             placeholder="Doküman adına göre filtrele..."
             className="input-field flex-1"
           />
           {filterQuery && (
             <button
               onClick={() => setFilterQuery('')}
               className="btn-secondary flex items-center"
             >
               <X className="w-4 h-4" />
             </button>
           )}
         </div>
       </div>

      {/* Doküman listesi */}
{filteredDocuments.length === 0 && documents.length === 0 ? (
  <div className="text-center py-12">
    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Henüz doküman yüklemediniz
    </h3>
    <p className="text-gray-600 mb-6">
      İlk dokümanınızı yükleyerek başlayın
    </p>
    <Link
      to="/dashboard/upload"
      className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition"
      aria-label="İlk dokümanı yükle"
    >
      <Upload className="w-5 h-5 flex-shrink-0" />
      İlk Dokümanı Yükle
    </Link>
  </div>
       ) : filteredDocuments.length === 0 && filterQuery ? (
         <div className="text-center py-12">
           <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-gray-900 mb-2">
             Arama sonucu bulunamadı
           </h3>
           <p className="text-gray-600 mb-6">
             "{filterQuery}" ile eşleşen doküman bulunamadı
           </p>
           <button
             onClick={() => setFilterQuery('')}
             className="btn-primary"
           >
             Filtreyi Temizle
           </button>
         </div>
       ) : (
         <div className="grid gap-6">
           {filteredDocuments.map((doc) => (
            <div key={doc._id} className="card">
              <div className="flex items-start justify-between">
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
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="uppercase">{doc.fileType}</span>
                    </div>
                    
                    {/* İşlem butonları */}
                    <div className="flex flex-wrap gap-2">
                       <Link
                         to={`/dashboard/document/${doc._id}`}
                         className="btn-secondary flex items-center text-sm"
                       >
                         <Eye className="w-4 h-4 mr-1" />
                         Görüntüle
                       </Link>
                       
                                               <button
                          onClick={() => handleGetSummary(doc._id)}
                          disabled={processingSummary[doc._id]}
                          className="btn-secondary flex items-center text-sm disabled:opacity-50"
                        >
                          <FileSearch className="w-4 h-4 mr-1" />
                          {processingSummary[doc._id] ? 'İşleniyor...' : (doc.summaryText ? 'Tekrar Özet' : 'Özet')}
                        </button>
                       
                                               <button
                          onClick={() => handleGetKeywords(doc._id)}
                          disabled={processingKeywords[doc._id]}
                          className="btn-secondary flex items-center text-sm disabled:opacity-50"
                        >
                          <Tag className="w-4 h-4 mr-1" />
                          {processingKeywords[doc._id] ? 'İşleniyor...' : (doc.keywords && doc.keywords.length > 0 ? 'Tekrar Anahtar Kelimeler' : 'Anahtar Kelimeler')}
                        </button>
                       
                       <button
                         onClick={() => handleDelete(doc._id)}
                         className="btn-danger flex items-center text-sm"
                       >
                         <Trash2 className="w-4 h-4 mr-1" />
                         Sil
                       </button>
                     </div>
                  </div>
                </div>
              </div>

              {/* Özet veya Anahtar Kelimeler */}
              {(showSummary || showKeywords) && selectedDocument && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {showSummary ? 'Özet' : 'Anahtar Kelimeler'}
                  </h4>
                  {showSummary ? (
                    <p className="text-gray-700">{selectedDocument}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) }

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="px-4 py-2 text-gray-700">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentList; 