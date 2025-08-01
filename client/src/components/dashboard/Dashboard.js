import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentList from './DocumentList';
import DocumentUpload from './DocumentUpload';
import DocumentDetail from './DocumentDetail';
import UserManagement from '../admin/UserManagement';

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Routes>
        <Route path="/" element={<DocumentList />} />
        <Route path="/upload" element={<DocumentUpload />} />
        <Route path="/document/:id" element={<DocumentDetail />} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </div>
  );
};

export default Dashboard; 