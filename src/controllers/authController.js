const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Conductor = require('../models/Conductor');

exports.registerAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin username already exists' });
    }

    const admin = new Admin({ username, password, role: 'admin' });
    await admin.save();

    return res.status(201).json({ success: true, message: 'Admin registered successfully', admin: { username: admin.username } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, phone, password, role } = req.body;

    if (role === 'admin') {
      let admin = await Admin.findOne({ username });
      if (!admin) {
        // Seed default admin if none exists
        if (username === 'admin' && password === 'admin123') {
          admin = new Admin({ username, password, role: 'admin' });
          await admin.save();
        } else {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
      }

      if (admin.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }

      const token = jwt.sign(
        { id: admin._id, username: admin.username, role: 'admin' },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1d' }
      );

      return res.status(200).json({ success: true, token, role: 'admin' });
    } else if (role === 'conductor') {
      const conductor = await Conductor.findOne({ phone });
      if (!conductor || conductor.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid conductor credentials' });
      }

      const token = jwt.sign(
        { id: conductor._id, phone: conductor.phone, role: 'conductor', busId: conductor.busId },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1d' }
      );

      return res.status(200).json({ success: true, token, role: 'conductor' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role specified for login' });
    }
  } catch (error) {
    next(error);
  }
};
