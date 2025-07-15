# دليل النشر الشامل

هذا الدليل يشرح كيفية نشر تطبيق Social Media Automation على منصات مختلفة.

## المتطلبات المسبقة

1. **حساب MongoDB Atlas** مع قاعدة بيانات مُعدة
2. **تطبيق Facebook Developer** مع المفاتيح المطلوبة
3. **مفتاح Google Gemini API**
4. **حساب على منصة الاستضافة المختارة**

## متغيرات البيئة المطلوبة

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-session-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_VERIFY_TOKEN=your-webhook-verify-token
GEMINI_API_KEY=your-gemini-api-key
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
MONGODB_URI=your-mongodb-connection-string
REDIRECT_URI=https://your-app-domain/api/oauth/callback
```

## خيارات النشر

### 1. النشر على Render.com

#### الطريقة الأولى: استخدام Blueprint (موصى بها)
1. ادفع الكود إلى GitHub
2. انتقل إلى [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
3. انقر على "New Blueprint Instance"
4. اختر مستودع GitHub الخاص بك
5. انقر على "Apply"

#### الطريقة الثانية: النشر اليدوي
1. انتقل إلى [render.com](https://render.com)
2. انقر على "New" > "Web Service"
3. اختر "Build and deploy from a Git repository"
4. اختر مستودعك
5. قم بتكوين الإعدادات:
   - Name: social-media-automation
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. أضف متغيرات البيئة
7. انقر على "Create Web Service"

### 2. النشر على Glitch.com

1. انتقل إلى [glitch.com](https://glitch.com)
2. انقر على "New Project" > "hello-express"
3. احذف الملفات الافتراضية
4. ارفع ملفات مشروعك
5. انقر على اسم المشروع > "Settings" > ".env"
6. أضف متغيرات البيئة
7. التطبيق سيعمل تلقائياً

### 3. النشر على Heroku

1. قم بتثبيت Heroku CLI
2. سجل الدخول: `heroku login`
3. أنشئ تطبيقاً: `heroku create your-app-name`
4. أضف متغيرات البيئة: `heroku config:set KEY=VALUE`
5. ادفع الكود: `git push heroku main`

## بعد النشر

### 1. تحديث إعدادات Facebook

1. انتقل إلى [developers.facebook.com](https://developers.facebook.com)
2. اختر تطبيقك
3. انتقل إلى "Settings" > "Basic"
4. أضف نطاق التطبيق في "App Domains"
5. انتقل إلى "Facebook Login" > "Settings"
6. أضف رابط إعادة التوجيه في "Valid OAuth Redirect URIs"
7. انتقل إلى "Webhooks"
8. قم بتحديث "Callback URL"

### 2. ترحيل البيانات

إذا كان لديك بيانات محلية، قم بترحيلها:
```bash
npm run migrate
```

### 3. اختبار التطبيق

1. افتح رابط التطبيق
2. تأكد من تحميل الصفحة الرئيسية
3. اختبر تسجيل الدخول
4. اختبر الاتصال بـ Facebook
5. اختبر إضافة منتج
6. اختبر إرسال رسالة

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

1. **خطأ في الاتصال بقاعدة البيانات**
   - تحقق من صحة رابط MongoDB
   - تأكد من أن عنوان IP مسموح في MongoDB Atlas

2. **خطأ في تسجيل الدخول بـ Facebook**
   - تحقق من صحة REDIRECT_URI
   - تأكد من تحديث إعدادات Facebook

3. **خطأ في Gemini API**
   - تحقق من صحة GEMINI_API_KEY
   - تأكد من تفعيل API في Google Cloud Console

4. **التطبيق لا يبدأ**
   - تحقق من سجلات الخطأ
   - تأكد من وجود جميع متغيرات البيئة
   - قم بتشغيل `npm run test` للتحقق

## الأمان

1. **لا تشارك ملف .env**
2. **استخدم كلمات مرور قوية**
3. **قم بتحديث التبعيات بانتظام**
4. **راقب سجلات التطبيق**
5. **استخدم HTTPS في الإنتاج**

## الصيانة

1. **راقب استخدام قاعدة البيانات**
2. **تحقق من سجلات الأخطاء بانتظام**
3. **قم بعمل نسخ احتياطية من البيانات**
4. **حدث التبعيات عند الحاجة**
5. **راقب أداء التطبيق**
