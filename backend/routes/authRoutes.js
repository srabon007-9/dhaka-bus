const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendVerificationEmail } = require('../services/mailer');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_TTL_MS = 30 * 60 * 1000;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const makeVerificationToken = () => crypto.randomBytes(32).toString('hex');
const hashVerificationToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const resolveFrontendUrl = (req) => {
  const origin = req.get('origin');
  if (origin && /^https?:\/\//.test(origin)) {
    return origin.replace(/\/$/, '');
  }

  return (process.env.FRONTEND_URL || 'http://localhost').replace(/\/$/, '');
};

const issueVerification = async (user, req) => {
  const token = makeVerificationToken();
  const verification_token_hash = hashVerificationToken(token);
  const verification_expires_at = new Date(Date.now() + VERIFICATION_TTL_MS);

  await userModel.updateVerificationToken(user.id, verification_token_hash, verification_expires_at);

  const verificationUrl = `${resolveFrontendUrl(req)}/auth?verify=${token}`;
  const mail = await sendVerificationEmail({
    email: user.email,
    name: user.name,
    verificationUrl,
  });

  return {
    verificationUrl,
    emailDelivered: mail.delivered,
    fallbackUrl: mail.fallbackUrl,
  };
};

router.post('/register', async (req, res) => {
  try {
    const { password } = req.body;
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const existing = await userModel.getUserByEmail(email);
    if (existing) {
      if (!existing.email_verified_at) {
        const verification = await issueVerification(existing, req);
        return res.status(200).json({
          success: true,
          message: verification.emailDelivered
            ? 'This account is already registered. We sent a fresh verification email.'
            : 'This account is already registered. SMTP is not configured, so use the development verification link.',
          data: {
            user: await userModel.getUserById(existing.id),
            verificationRequired: true,
            emailDelivered: verification.emailDelivered,
            verificationUrl: verification.fallbackUrl || verification.verificationUrl,
          },
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Email already in use',
        verificationRequired: false,
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await userModel.createUser({
      name,
      email,
      password_hash,
      role: 'user',
    });

    const verification = await issueVerification({ id: result.insertId, name, email }, req);
    const user = await userModel.getUserById(result.insertId);

    return res.status(201).json({
      success: true,
      message: verification.emailDelivered
        ? 'Registration successful. Check your email to verify your account.'
        : 'Registration successful. SMTP is not configured, so use the development verification link.',
      data: {
        user,
        verificationRequired: true,
        emailDelivered: verification.emailDelivered,
        verificationUrl: verification.fallbackUrl || verification.verificationUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({
        success: false,
        message: 'Verify your email before signing in',
        verificationRequired: true,
        email,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'super-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          email_verified: true,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const tokenHash = hashVerificationToken(token);
    const user = await userModel.getUserByVerificationTokenHash(tokenHash);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid' });
    }

    if (user.email_verified_at) {
      return res.json({ success: true, message: 'Email is already verified' });
    }

    if (!user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification link has expired' });
    }

    await userModel.markEmailVerified(user.id);
    return res.json({ success: true, message: 'Email verified successfully. You can sign in now.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error verifying email', error: error.message });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for this email' });
    }

    if (user.email_verified_at) {
      return res.status(400).json({ success: false, message: 'This email is already verified' });
    }

    const verification = await issueVerification(user, req);
    return res.json({
      success: true,
      message: verification.emailDelivered
        ? 'Verification email sent'
        : 'SMTP is not configured, so use the development verification link.',
      data: {
        emailDelivered: verification.emailDelivered,
        verificationUrl: verification.fallbackUrl || verification.verificationUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error resending verification email', error: error.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await userModel.getUserById(req.user.id);
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
});

module.exports = router;
