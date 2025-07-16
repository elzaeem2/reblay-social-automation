# Social Media Automation

تطبيق لأتمتة الردود على وسائل التواصل الاجتماعي باستخدام Node.js وExpress وGoogle Gemini وMongoDB.

## الميزات

- التكامل مع Facebook/Instagram
- الرد التلقائي على الرسائل باستخدام Google Gemini
- إدارة المنتجات والطلبات
- واجهة مستخدم بسيطة

## 🚀 روابط النشر المباشر

### 🔗 خيارات النشر السريع:

1. **Render.com** (الأفضل للإنتاج):
   - انقر هنا: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/elzaeem2/reblay-social-automation)

2. **Glitch.com** (سريع وسهل):
   - انقر هنا: [Import to Glitch](https://glitch.com/edit/#!/import/github/elzaeem2/reblay-social-automation)

3. **Replit** (للتطوير والاختبار):
   - انقر هنا: [Open in Replit](https://replit.com/github/elzaeem2/reblay-social-automation)

4. **CodeSandbox** (للمعاينة السريعة):
   - انقر هنا: [Open in CodeSandbox](https://codesandbox.io/s/github/elzaeem2/reblay-social-automation)

## كيفية الاستخدام

1. قم بتسجيل الدخول باستخدام حساب Facebook
2. اربط صفحة Facebook أو حساب Instagram الخاص بك
3. قم بإعداد الردود التلقائية
4. أضف منتجاتك وابدأ في استقبال الطلبات

## هيكل المشروع

- `server.js`: نقطة الدخول الرئيسية للتطبيق
- `utils/dataStore.js`: طبقة الوصول إلى البيانات
- `utils/mongodb.js`: وحدة الاتصال بقاعدة بيانات MongoDB
- `utils/migrateToMongoDB.js`: أداة لترحيل البيانات من الملفات المحلية إلى MongoDB
- `public/`: الملفات الثابتة للواجهة الأمامية
- `routes/`: مسارات API

## التشغيل المحلي

1. قم بتثبيت التبعيات:
   ```
   npm install
   ```

2. قم بإنشاء ملف `.env` وأضف المتغيرات المطلوبة

3. قم بتشغيل التطبيق:
   ```
   npm start
   ```

## النشر على Render.com

1. قم بإنشاء حساب على [Render.com](https://render.com)
2. قم بربط حسابك بـ GitHub
3. قم بإنشاء خدمة Web Service جديدة:
   - اختر مستودع GitHub الخاص بك
   - اختر نوع الخدمة: Web Service
   - اختر البيئة: Node
   - أمر البدء: `npm start`
   - اضبط متغيرات البيئة (نفس المتغيرات في ملف `.env`)
4. انقر على "Create Web Service"
5. انتظر حتى يتم نشر التطبيق
6. قم بتحديث متغير `REDIRECT_URI` ليشير إلى عنوان URL الجديد
7. قم بتحديث إعدادات Facebook لاستخدام عنوان URL الجديد

## ملاحظات هامة

- في بيئة الإنتاج، يتم استخدام MongoDB لتخزين البيانات
- في بيئة التطوير المحلية، يمكن استخدام الملفات المحلية
- تأكد من تحديث متغيرات البيئة في ملف `.env`
- تأكد من تحديث عنوان إعادة التوجيه في إعدادات OAuth لـ Facebook/Instagram
- ملف `render.yaml` يحتوي على تكوين الخدمة لـ Render.com
