import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../../services/api';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from '../common/FileUpload';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await documentsAPI.upload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Doküman başarıyla yüklendi!');
      
      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Navigate to document list after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Dosya yüklenirken bir hata oluştu';
      toast.error(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Yeni Doküman Yükle
        </h1>
        <p className="text-gray-600">
          PDF, Word veya metin dosyalarınızı yükleyin ve analiz edin
        </p>
      </div>

      {/* Upload area */}
      <div className="card">
        <FileUpload
          onFileSelect={handleFileSelect}
          accept=".pdf,.docx,.txt"
          maxSize={10}
        />

        {/* Upload button */}
        {selectedFile && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Yükleniyor...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Dokümanı Yükle
                </div>
              )}
            </button>
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Yükleme ilerlemesi</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Desteklenen Formatlar</h3>
              <p className="text-sm text-gray-600 mt-1">
                PDF, Microsoft Word (.docx), ve düz metin (.txt) dosyaları
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Dosya Boyutu</h3>
              <p className="text-sm text-gray-600 mt-1">
                Maksimum 10MB boyutunda dosyalar kabul edilir
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-4">Yüklediğiniz dokümanlarla yapabilecekleriniz:</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Yükleme</h4>
            <p className="text-sm text-gray-600 mt-1">
              Dokümanlarınızı güvenli bir şekilde yükleyin
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Özetleme</h4>
            <p className="text-sm text-gray-600 mt-1">
              AI ile otomatik özet oluşturun
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Analiz</h4>
            <p className="text-sm text-gray-600 mt-1">
              Anahtar kelimeleri çıkarın
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 