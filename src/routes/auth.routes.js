import { Router } from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

const r = Router();

r.post('/signup', async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    console.log('Signup attempt:', email);
    if (!email || !password || !username) return res.status(400).json({ error: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email in use' });
    const ph = await argon2.hash(password);
    const user = await User.create({ email, passwordHash: ph });
    const profile = await Profile.create({ userId: user._id, username });
    const token = jwt.sign({ sub: profile._id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('New user signed up:', email);
    res.json({ user: { id: profile._id, email, username }, session: { token } });
  } catch (e) { next(e); }
});

r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const profile = await Profile.findOne({ userId: user._id });
    const token = jwt.sign({ sub: profile._id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('User logged in:', email);
    res.json({ user: { id: profile._id, email, username: profile.username }, session: { token } });
  } catch (e) { next(e); }
});

r.post('/logout', (req, res) => res.json({ success: true }));
r.get('/session', (req, res) => res.json({ user: null, session: null }));
r.post('/reset-password', (req, res) => res.json({ success: true }));

export default r;
