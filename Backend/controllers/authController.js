// controllers/authController.js
// Contains the logic for registering and logging in users.
// Uses the existing `users` table: user_id, name, email, password_hash, role, created_at

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../config/db');

const SALT_ROUNDS = 10;

// Public registration can ONLY create Customer accounts. The role is decided
// here on the server and is never taken from the request. Admin accounts are
// not created through the app (see README / setup notes: promote a user in the DB).
const PUBLIC_REGISTRATION_ROLE = 'CUSTOMER';

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate required fields (role is NOT required - it is always CUSTOMER)
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }

    // 2. Refuse any attempt to pick another role (e.g. someone manually
    //    sending { "role": "ADMIN" }). Sending role "CUSTOMER" is harmless.
    if (role !== undefined && role !== PUBLIC_REGISTRATION_ROLE) {
      return res.status(403).json({ message: 'Public registration can only create Customer accounts.' });
    }

    // 3. Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // 4. Basic password length check
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 5. Prevent duplicate email registration
    const [existingUsers] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // 6. Hash the password (never store plain-text passwords)
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 7. Insert the new user (role always comes from the server-side constant)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, PUBLIC_REGISTRATION_ROLE]
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        user_id: result.insertId,
        name,
        email,
        role: PUBLIC_REGISTRATION_ROLE
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Something went wrong during registration.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    // 2. Find the user by email
    const [users] = await pool.query(
      'SELECT user_id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // 3. Compare the given password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 4. Generate JWT with user_id and role in the payload
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // 5. Return token and basic user info (never return password_hash)
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Something went wrong during login.' });
  }
}

module.exports = {
  register,
  login
};