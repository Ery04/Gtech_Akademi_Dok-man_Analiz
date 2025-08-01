const express = require('express');
const User = require('../models/User');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

// Tüm route'lar için authentication ve admin yetkisi gerekli
router.use(protect);
router.use(admin);

// Tüm kullanıcıları listele
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Tüm kullanıcıları getir (admin kendini görmesin)
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments({ _id: { $ne: req.user._id } });
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDocs: totalUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcılar listelenirken bir hata oluştu.'
    });
  }
});

// Kullanıcı rolünü güncelle
router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    // Admin kendi rolünü değiştiremesin
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Rol değiştirme hatası',
        message: 'Kendi rolünüzü değiştiremezsiniz.'
      });
    }

    // Geçerli rol kontrolü
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Geçersiz rol',
        message: 'Rol sadece "user" veya "admin" olabilir.'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Belirtilen kullanıcı bulunamadı.'
      });
    }

    // Rolü güncelle
    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `Kullanıcının rolü başarıyla "${role}" olarak güncellendi.`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: 'Güncelleme hatası',
      message: 'Kullanıcı rolü güncellenirken bir hata oluştu.'
    });
  }
});

// Kullanıcı silme (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Admin kendini silemesin
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Silme hatası',
        message: 'Kendi hesabınızı silemezsiniz.'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Belirtilen kullanıcı bulunamadı.'
      });
    }

    // Kullanıcının dokümanlarını da sil
    await Document.deleteMany({ ownerId: userId });
    
    // Kullanıcıyı sil
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Kullanıcı ve tüm dokümanları başarıyla silindi.'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Silme hatası',
      message: 'Kullanıcı silinirken bir hata oluştu.'
    });
  }
});

// Kullanıcı istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // Son 7 günde kayıt olan kullanıcılar
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDocuments,
        adminUsers,
        newUsersThisWeek
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'İstatistikler alınırken bir hata oluştu.'
    });
  }
});

module.exports = router; 