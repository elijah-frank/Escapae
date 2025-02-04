const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'highscores.json');

// Helper functions
function loadHighScores() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading high scores:", err);
    return {};
  }
}

function saveHighScores(scores) {
  try {
    const tempFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(scores, null, 2));
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error("Error saving high scores:", err);
    // Attempt to restore from backup if exists
    if (fs.existsSync(DATA_FILE + '.backup')) {
      fs.copyFileSync(DATA_FILE + '.backup', DATA_FILE);
    }
  }
}

const app = express();
const corsOptions = {
    origin: 'http://your-domain.com',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// GET high score for a specified game (default "escapae")
app.get('/api/highscore', (req, res) => {
  const game = req.query.game || 'escapae';
  const scores = loadHighScores();
  const score = scores[game] || 0;
  res.json({ game, highScore: score });
});

// POST new score. If the posted score is higher than the current score, update it.
app.post('/api/highscore', (req, res) => {
  const game = req.body.game || 'escapae';
  const score = req.body.score;
  if (typeof score !== 'number') {
    return res.status(400).json({ error: 'Score must be a number.' });
  }
  const scores = loadHighScores();
  if (!scores[game] || score > scores[game]) {
    scores[game] = score;
    saveHighScores(scores);
  }
  res.json({ game, highScore: scores[game] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`High Score backend listening on port ${PORT}`);
}); 