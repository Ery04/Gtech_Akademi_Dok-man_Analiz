import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  FileText,
  Upload,
  Users
} from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo ve ana menü */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
                             <span className="ml-2 text-xl font-bold text-gray-900">
                 Doküman Analiz
               </span>
            </div>
            
                         {/* Desktop menü */}
             <div className="hidden md:ml-6 md:flex md:space-x-8">
               <a
                 href="/dashboard"
                 className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
               >
                 Dokümanlarım
               </a>
               <a
                 href="/dashboard/upload"
                 className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
               >
                 <Upload className="h-4 w-4 inline mr-1" />
                 Yükle
               </a>
               {isAdmin && (
                 <a
                   href="/dashboard/users"
                   className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                 >
                   <Users className="h-4 w-4 inline mr-1" />
                   Kullanıcılar
                 </a>
               )}
             </div>
          </div>

          {/* Sağ taraf - kullanıcı menüsü */}
          <div className="flex items-center">
            {/* Desktop kullanıcı menüsü */}
            <div className="hidden md:ml-4 md:flex md:items-center">
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-2 text-gray-700">{user?.username}</span>
                </button>

                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{user?.username}</div>
                        <div className="text-gray-500">{user?.email}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menü butonu */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

             {/* Mobile menü */}
       {isMenuOpen && (
         <div className="md:hidden">
           <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
             <a
               href="/dashboard"
               className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
             >
               Dokümanlarım
             </a>
             <a
               href="/dashboard/upload"
               className="text-gray-500 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
             >
               <Upload className="h-4 w-4 inline mr-2" />
               Yükle
             </a>
             {isAdmin && (
               <a
                 href="/dashboard/users"
                 className="text-gray-500 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
               >
                 <Users className="h-4 w-4 inline mr-2" />
                 Kullanıcılar
               </a>
             )}
            <div className="border-t border-gray-200 pt-4">
              <div className="px-3 py-2 text-sm text-gray-700">
                <div className="font-medium">{user?.username}</div>
                <div className="text-gray-500">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 