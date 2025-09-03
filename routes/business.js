const express = require('express');
const router = express.Router();
const businessService = require('../services/business');

// Business Management Routes
router.get('/businesses', async (req, res) => {
  try {
    const businesses = await businessService.getAllBusinesses();
    res.json(businesses);
  } catch (error) {
    console.error('Error getting businesses:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await businessService.getBusinessWithConfigAndTones(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({ error: 'Failed to get business' });
  }
});

router.post('/businesses', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    
    const business = await businessService.createBusiness({ name, description });
    res.status(201).json(business);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

router.put('/businesses/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    
    const business = await businessService.updateBusiness(req.params.id, { name, description, status });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await businessService.deleteBusiness(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

// WhatsApp Configuration Routes
router.post('/businesses/:businessId/whatsapp-config', async (req, res) => {
  try {
    const { phone_number_id, access_token, verify_token, webhook_url } = req.body;
    if (!phone_number_id || !access_token) {
      return res.status(400).json({ error: 'Phone number ID and access token are required' });
    }
    
    const config = await businessService.createWhatsAppConfig({
      business_id: req.params.businessId,
      phone_number_id,
      access_token,
      verify_token,
      webhook_url
    });
    res.status(201).json(config);
  } catch (error) {
    console.error('Error creating WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to create WhatsApp configuration' });
  }
});

router.put('/whatsapp-config/:id', async (req, res) => {
  try {
    const { phone_number_id, access_token, verify_token, webhook_url, status } = req.body;
    if (!phone_number_id || !access_token) {
      return res.status(400).json({ error: 'Phone number ID and access token are required' });
    }
    
    const config = await businessService.updateWhatsAppConfig(req.params.id, {
      phone_number_id,
      access_token,
      verify_token,
      webhook_url,
      status
    });
    if (!config) {
      return res.status(404).json({ error: 'WhatsApp configuration not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to update WhatsApp configuration' });
  }
});

router.delete('/whatsapp-config/:id', async (req, res) => {
  try {
    const config = await businessService.deleteWhatsAppConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'WhatsApp configuration not found' });
    }
    res.json({ message: 'WhatsApp configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to delete WhatsApp configuration' });
  }
});

// Business Tone Routes
router.get('/businesses/:businessId/tones', async (req, res) => {
  try {
    const tones = await businessService.getBusinessTones(req.params.businessId);
    res.json(tones);
  } catch (error) {
    console.error('Error getting business tones:', error);
    res.status(500).json({ error: 'Failed to get business tones' });
  }
});

router.post('/businesses/:businessId/tones', async (req, res) => {
  try {
    const { name, description, tone_instructions, is_default } = req.body;
    if (!name || !tone_instructions) {
      return res.status(400).json({ error: 'Tone name and instructions are required' });
    }
    
    const tone = await businessService.createBusinessTone({
      business_id: req.params.businessId,
      name,
      description,
      tone_instructions,
      is_default: is_default || false
    });
    res.status(201).json(tone);
  } catch (error) {
    console.error('Error creating business tone:', error);
    res.status(500).json({ error: 'Failed to create business tone' });
  }
});

router.put('/tones/:id', async (req, res) => {
  try {
    const { name, description, tone_instructions, is_default, business_id } = req.body;
    if (!name || !tone_instructions) {
      return res.status(400).json({ error: 'Tone name and instructions are required' });
    }
    
    const tone = await businessService.updateBusinessTone(req.params.id, {
      name,
      description,
      tone_instructions,
      is_default: is_default || false,
      business_id
    });
    if (!tone) {
      return res.status(404).json({ error: 'Business tone not found' });
    }
    res.json(tone);
  } catch (error) {
    console.error('Error updating business tone:', error);
    res.status(500).json({ error: 'Failed to update business tone' });
  }
});

router.delete('/tones/:id', async (req, res) => {
  try {
    const tone = await businessService.deleteBusinessTone(req.params.id);
    if (!tone) {
      return res.status(404).json({ error: 'Business tone not found' });
    }
    res.json({ message: 'Business tone deleted successfully' });
  } catch (error) {
    console.error('Error deleting business tone:', error);
    res.status(500).json({ error: 'Failed to delete business tone' });
  }
});

module.exports = router; 