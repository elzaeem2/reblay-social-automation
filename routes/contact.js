const express = require('express');
const router = express.Router();
const DataStore = require('../utils/dataStore');
const auth = require('../utils/auth');

// Validation helper functions
const validateEmail = (email) => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  // Allow various phone formats: +964, 07xx, etc.
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Get contact information (Admin only)
router.get('/', auth.checkAdminSession, async (req, res) => {
  try {
    // Use a fixed admin ID for contact info
    const adminId = 'admin';
    const contactInfo = await DataStore.getContactInfo(adminId);
    res.json({
      success: true,
      data: contactInfo
    });
  } catch (error) {
    console.error('Error getting contact info:', error);
    console.error('Admin access attempt from session:', req.session);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات الاتصال'
    });
  }
});

// Update contact information (Admin only)
router.post('/', auth.checkAdminSession, async (req, res) => {
  try {
    console.log('Admin contact update request received:', req.body);
    console.log('Admin session check:', req.session.isAdmin);

    const { phone, address, supportEmail, whatsapp, workingHours } = req.body;

    // Validation
    const errors = [];

    if (supportEmail && !validateEmail(supportEmail)) {
      errors.push('البريد الإلكتروني غير صحيح');
    }

    if (phone && !validatePhone(phone)) {
      errors.push('رقم الهاتف غير صحيح');
    }

    if (whatsapp && !validatePhone(whatsapp)) {
      errors.push('رقم الواتساب غير صحيح');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors
      });
    }

    // Update contact information (Admin only)
    const adminId = 'admin';
    const updatedInfo = await DataStore.updateContactInfo(adminId, {
      phone: phone || '',
      address: address || '',
      supportEmail: supportEmail || '',
      whatsapp: whatsapp || '',
      workingHours: workingHours || ''
    });

    // Log admin action
    console.log('Admin updated contact info:', {
      adminSession: req.session.isAdmin,
      timestamp: new Date().toISOString(),
      updatedFields: Object.keys({ phone, address, supportEmail, whatsapp, workingHours })
    });

    res.json({
      success: true,
      message: 'تم تحديث معلومات الاتصال بنجاح',
      data: updatedInfo
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث معلومات الاتصال'
    });
  }
});

// Get public contact information (for use in privacy policy, etc.)
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For 'default' userId, get admin contact info or return default
    let contactInfo;
    if (userId === 'default') {
      try {
        // Try to get admin contact info first
        const adminId = 'admin';
        contactInfo = await DataStore.getContactInfo(adminId);

        // If admin hasn't set contact info yet, use defaults
        if (!contactInfo.supportEmail && !contactInfo.phone && !contactInfo.address) {
          contactInfo = {
            supportEmail: 'privacy@social-automation.com',
            phone: '+964 XXX XXX XXXX',
            address: 'بغداد، العراق',
            workingHours: 'الأحد - الخميس، 9:00 ص - 5:00 م'
          };
        }
      } catch (error) {
        // Fallback to default values
        contactInfo = {
          supportEmail: 'privacy@social-automation.com',
          phone: '+964 XXX XXX XXXX',
          address: 'بغداد، العراق',
          workingHours: 'الأحد - الخميس، 9:00 ص - 5:00 م'
        };
      }
    } else {
      contactInfo = await DataStore.getContactInfo(userId);
    }
    
    // Return only public information
    const publicInfo = {
      supportEmail: contactInfo.supportEmail,
      phone: contactInfo.phone,
      address: contactInfo.address,
      workingHours: contactInfo.workingHours
    };

    res.json({
      success: true,
      data: publicInfo
    });
  } catch (error) {
    console.error('Error getting public contact info:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات الاتصال'
    });
  }
});

module.exports = router;
