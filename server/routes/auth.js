const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// JWT token oluşturma
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Gerekli alanları kontrol et
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Eksik bilgi',
        message: 'Kullanıcı adı, e-posta ve şifre gereklidir.'
      });
    }

    // Şifre uzunluğunu kontrol et
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Geçersiz şifre',
        message: 'Şifre en az 6 karakter olmalıdır.'
      });
    }

    // Kullanıcı adı ve e-posta benzersizliğini kontrol et
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          error: 'E-posta hatası',
          message: 'Bu e-posta adresi zaten kullanılıyor.'
        });
      } else {
        return res.status(400).json({
          error: 'Kullanıcı adı hatası',
          message: 'Bu kullanıcı adı zaten kullanılıyor.'
        });
      }
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      username,
      email,
      password
    });

    // Token oluştur
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Doğrulama hatası',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kayıt işlemi sırasında bir hata oluştu.'
    });
  }
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Gerekli alanları kontrol et
    if (!email || !password) {
      return res.status(400).json({
        error: 'Eksik bilgi',
        message: 'E-posta ve şifre gereklidir.'
      });
    }

    // Kullanıcıyı bul (şifreyi dahil et)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Giriş hatası',
        message: 'Geçersiz e-posta veya şifre.'
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Giriş hatası',
        message: 'Geçersiz e-posta veya şifre.'
      });
    }

    // Son giriş zamanını güncelle
    user.lastLogin = new Date();
    await user.save();

    // Token oluştur
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Giriş başarılı.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Giriş işlemi sırasında bir hata oluştu.'
    });
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı bilgileri alınırken bir hata oluştu.'
    });
  }
});

// Şifre değiştirme
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Eksik bilgi',
        message: 'Mevcut şifre ve yeni şifre gereklidir.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Geçersiz şifre',
        message: 'Yeni şifre en az 6 karakter olmalıdır.'
      });
    }

    // Kullanıcıyı şifre ile birlikte getir
    const user = await User.findById(req.user._id).select('+password');

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Şifre hatası',
        message: 'Mevcut şifre yanlış.'
      });
    }

    // Yeni şifreyi güncelle
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Şifre değiştirme işlemi sırasında bir hata oluştu.'
    });
  }
});

module.exports = router; 