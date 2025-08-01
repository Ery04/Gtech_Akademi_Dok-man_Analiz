#!/bin/bash

echo "Doküman NLP Platformu Başlatılıyor..."
echo

echo "1. Bağımlılıklar yükleniyor..."
npm run install-all

echo
echo "2. Uygulama başlatılıyor..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo

npm run dev 