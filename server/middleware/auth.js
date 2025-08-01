const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Token'ı header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token yoksa hata döndür
    if (!token) {
      return res.status(401).json({
        error: 'Yetkilendirme hatası',
        message: 'Token bulunamadı. Lütfen giriş yapın.'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Yetkilendirme hatası',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    // Kullanıcıyı request'e ekle
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Yetkilendirme hatası',
        message: 'Geçersiz token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Yetkilendirme hatası',
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Yetkilendirme işlemi sırasında bir hata oluştu.'
    });
  }
};

// Opsiyonel auth - token varsa kullanıcıyı ekle, yoksa devam et
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Hata durumunda sessizce devam et
    next();
  }
};

module.exports = { protect, optionalAuth }; 