const admin = (req, res, next) => {
  console.log('Admin middleware - User:', req.user);
  console.log('Admin middleware - User role:', req.user?.role);
  
  if (!req.user) {
    console.log('Admin middleware - No user found');
    return res.status(401).json({
      error: 'Yetkilendirme hatası',
      message: 'Giriş yapmanız gerekiyor.'
    });
  }

  if (req.user.role !== 'admin') {
    console.log('Admin middleware - User is not admin, role:', req.user.role);
    return res.status(403).json({
      error: 'Erişim reddedildi',
      message: 'Bu işlem için admin yetkisi gerekiyor.'
    });
  }

  console.log('Admin middleware - User is admin, proceeding');
  next();
};

module.exports = { admin }; 