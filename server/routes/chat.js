/**
 * Chat route — proxies messages to Google Gemini API
 * POST /api/chat
 */
const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    let reply =
      'AI-powered guidance is coming in Beta! For now please explore the recommended resources in your learning path for project help.';

    if (lastMessage.includes('react')) {
      reply =
        'React is a JavaScript library for building interactive UIs. Start with components and props, then move to hooks and state management. Full AI guidance coming in Beta.';
    } else if (lastMessage.includes('node') || lastMessage.includes('express')) {
      reply =
        'Node.js and Express are great for REST APIs. Focus on routes, middleware, and async/await. Full AI guidance coming in Beta.';
    } else if (lastMessage.includes('mongodb') || lastMessage.includes('database')) {
      reply =
        'Design your Mongoose schemas before writing routes. Think about relationships between collections first. Full AI guidance coming in Beta.';
    } else if (lastMessage.includes('error') || lastMessage.includes('bug')) {
      reply =
        'Read the error message carefully, check browser console and server terminal, then add console.log to trace the issue. Full AI guidance coming in Beta.';
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat route error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
