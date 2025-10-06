const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');

// Validation middleware
const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
];

// Submit contact form
router.post('/', contactValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const contact = new Contact(req.body);
    await contact.save();

    res.status(201).json({
      status: 'success',
      message: 'Contact message sent successfully',
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get all contact messages
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({
      status: 'success',
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

module.exports = router;
