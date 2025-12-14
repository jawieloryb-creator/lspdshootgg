require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

mongoose.connect(process.env.MONGO_URI);

const Officer = mongoose.model('Officer', new mongoose.Schema({
  discordId: String,
  discordUsername: String,
  rank: String,
  badgeNumber: String,
  status: { type: String, default: 'offline' }
}));

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify`);
});

app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${process.env.DISCORD_CLIENT_ID}&client_secret=${process.env.DISCORD_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}`
  });
  const token = await tokenRes.json();
  const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` }});
  const user = await userRes.json();
  req.session.user = user;

  let officer = await Officer.findOne({ discordId: user.id });
  if (!officer) await Officer.create({ discordId: user.id, discordUsername: user.username, rank: 'Cadet', badgeNumber: 'C-001' });

  res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(__dirname + '/views/dashboard.html');
});

app.get('/api/officers', async (req, res) => {
  res.json(await Officer.find());
});

app.post('/api/status', async (req, res) => {
  await Officer.findOneAndUpdate({ discordId: req.body.discordId }, { status: req.body.status });
  res.json({ ok: true });
});

app.listen(process.env.PORT, () => console.log('LSPD website running'));
