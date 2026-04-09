// src/routes/user.routes.js

const express = require('express');
const router = express.Router();
const { UserService } = require('../services/user');
const { UserRole } = require('../generated/prisma');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const {generateJwtToken} = require('../utils/helpers');

/**
 * Create a new user
 * POST /users
 */
router.post('/register', async (req, res) => {
  try {

  // validate input
    if (!req.body.name || !req.body.phone || !req.body.role || !req.body.password) {
      return res.status(400).json({ error: 'Name, phone, role, and password are required' });
    }

    if(!UserRole.hasOwnProperty(req.body.role.toUpperCase())) {
      const validRoles = Object.keys(UserRole).join(', ');
      return res.status(400).json({ error: `Role must be one of: ${validRoles}` });
    }

    const checkIfUserExists = await UserService.getUserByPhone(req.body.phone);
    if (checkIfUserExists) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userPayload = {
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      password: hashedPassword
    };

    const user = await UserService.createUser(userPayload);

    const tokenPayload = {
      id: user.id,
      role: user.role,
    };
    const token = generateJwtToken(tokenPayload, '7d');

    const { password, ...userWithoutPassword } = user; // Exclude password from response

    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!req.body.phone || !req.body.password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const user = await UserService.getUserByPhone(req.body.phone);
    if (!user) {
      return res.status(400).json({ error: 'Invalid phone or password' });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid phone or password' });
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
    };
    const token = generateJwtToken(tokenPayload, '7d');

    const { password, ...userWithoutPassword } = user; // Exclude password from response

    return res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user by ID
 * GET /users/:id
 */
/**
 * Get user by phone
 * GET /users/phone/:phone
 */
// router.get('/phone/:phone', async (req, res) => {
//   try {
//     const user = await UserService.getUserByPhone(req.params.phone);
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

/**
 * Get users by role
 * GET /users/role/:role
 */
// router.get('/role/:role', async (req, res) => {
//   try {
//     const users = await UserService.getUsersByRole(req.params.role);
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.get('/', authenticate, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userWithoutPassword = { ...user, password: undefined }; // Exclude password from response

    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;