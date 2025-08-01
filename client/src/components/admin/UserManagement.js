import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
  Users, 
  Trash2, 
  Calendar, 
  Mail, 
  User,
  Shield,
  AlertTriangle,
  Edit
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ 
        page: currentPage, 
        limit: 10 
      });
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu', { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`"${username}" kullanıcısını ve tüm dokümanlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      setDeletingUser(userId);
      await adminAPI.deleteUser(userId);
      toast.success('Kullanıcı başarıyla silindi', { duration: 3000 });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Kullanıcı silinirken bir hata oluştu', { duration: 8000 });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleUpdateUserRole = async (userId, username, newRole) => {
    if (!window.confirm(`"${username}" kullanıcısının rolünü "${newRole === 'admin' ? 'Admin' : 'Kullanıcı'}" olarak değiştirmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setUpdatingUser(userId);
      await adminAPI.updateUserRole(userId, newRole);
      toast.success(`Kullanıcının rolü başarıyla "${newRole === 'admin' ? 'Admin' : 'Kullanıcı'}" olarak güncellendi`, { duration: 3000 });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Kullanıcı rolü güncellenirken bir hata oluştu', { duration: 8000 });
    } finally {
      setUpdatingUser(null);
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

  if (loading) {
    return <LoadingSpinner text="Kullanıcılar yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600">Sistem kullanıcılarını yönetin</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span className="text-sm text-gray-600">Admin Paneli</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <User className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Toplam Doküman</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Admin Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Bu Hafta Yeni</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisWeek}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Listesi</h2>
          <span className="text-sm text-gray-600">
            {users.length} kullanıcı gösteriliyor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Giriş
                </th>
                                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                   İşlemler
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.lastLogin)}
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                     <div className="flex items-center justify-center space-x-2">
                       {/* Rol Değiştirme Butonları */}
                       <div className="flex items-center space-x-1">
                         <button
                           onClick={() => handleUpdateUserRole(user._id, user.username, 'user')}
                           disabled={updatingUser === user._id || user.role === 'user'}
                           className={`px-2 py-1 text-xs rounded ${
                             user.role === 'user' 
                               ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                               : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                           } disabled:opacity-50`}
                           title="Kullanıcı yap"
                         >
                           Kullanıcı
                         </button>
                         <button
                           onClick={() => handleUpdateUserRole(user._id, user.username, 'admin')}
                           disabled={updatingUser === user._id || user.role === 'admin'}
                           className={`px-2 py-1 text-xs rounded ${
                             user.role === 'admin' 
                               ? 'bg-purple-100 text-purple-800 cursor-not-allowed' 
                               : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-800'
                           } disabled:opacity-50`}
                           title="Admin yap"
                         >
                           Admin
                         </button>
                       </div>
                       
                       {/* Silme Butonu */}
                       <button
                         onClick={() => handleDeleteUser(user._id, user.username)}
                         disabled={deletingUser === user._id || updatingUser === user._id}
                         className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center"
                         title="Kullanıcıyı sil"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                     
                     {/* Loading Indicator */}
                     {(updatingUser === user._id || deletingUser === user._id) && (
                       <div className="mt-1 text-xs text-gray-500">
                         {updatingUser === user._id ? 'Güncelleniyor...' : 'Siliniyor...'}
                       </div>
                     )}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
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
    </div>
  );
};

export default UserManagement; 