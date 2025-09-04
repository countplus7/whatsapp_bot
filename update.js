const fs = require('fs');
let content = fs.readFileSync('services/business.js', 'utf8');

// Update getWhatsAppConfigByBusinessId
content = content.replace(
  'SELECT * FROM whatsapp_configs WHERE business_id = \ AND status = \',
  'SELECT * FROM whatsapp_configs WHERE business_id = \'
);
content = content.replace(
  '[businessId, \"active\"]',
  '[businessId]'
);

// Update getWhatsAppConfigByPhoneNumber  
content = content.replace(
  'SELECT wc.*, b.name as business_name FROM whatsapp_configs wc JOIN businesses b ON wc.business_id = b.id WHERE wc.phone_number_id = \ AND wc.status = \',
  'SELECT wc.*, b.name as business_name FROM whatsapp_configs wc JOIN businesses b ON wc.business_id = b.id WHERE wc.phone_number_id = \'
);
content = content.replace(
  '[phoneNumberId, \"active\"]',
  '[phoneNumberId]'
);

fs.writeFileSync('services/business.js', content);
console.log('Updated WhatsApp config queries to remove status field');
