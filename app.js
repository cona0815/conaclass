class BigTwoScorekeeper {
  constructor() {
    this.players = [];
    this.rounds = [];
    this.initializeElements();
    this.setupEventListeners();
    this.loadFromLocalStorage();
  }

  initializeElements() {
    this.playerNameInput = document.getElementById('playerNameInput');
    this.addPlayerBtn = document.getElementById('addPlayerBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.scoreTable = document.getElementById('scoreTable');
    this.headerRow = document.getElementById('headerRow');
    this.scoreBody = document.getElementById('scoreBody');
    this.addRoundBtn = document.getElementById('addRoundBtn');
  }

  setupEventListeners() {
    this.addPlayerBtn.addEventListener('click', () => this.addPlayer());
    this.resetBtn.addEventListener('click', () => this.resetGame());
    this.addRoundBtn.addEventListener('click', () => this.addNewRound());
    this.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addPlayer();
    });
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem('bigTwoData');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.players = data.players;
      this.rounds = data.rounds;
      this.updateDisplay();
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('bigTwoData', JSON.stringify({
      players: this.players,
      rounds: this.rounds
    }));
  }

  addPlayer() {
    const name = this.playerNameInput.value.trim();
    if (!name) return;
    
    if (this.players.length >= 4) {
      alert('最多只能有 4 位玩家！');
      return;
    }

    if (this.players.some(p => p.name === name)) {
      alert('玩家名稱已存在！');
      return;
    }

    this.players.push({ name });
    this.playerNameInput.value = '';
    this.updateDisplay();
    this.saveToLocalStorage();
  }

  updateDisplay() {
    this.updateHeader();
    this.updateScoreRows();
  }

  updateHeader() {
    this.headerRow.innerHTML = '<th>玩家</th>';
    this.rounds.forEach((_, index) => {
      const th = document.createElement('th');
      th.textContent = `第 ${index + 1} 局`;
      this.headerRow.appendChild(th);
    });
    if (this.rounds.length > 0) {
      const th = document.createElement('th');
      th.textContent = '總分';
      this.headerRow.appendChild(th);
    }
  }

  updateScoreRows() {
    this.scoreBody.innerHTML = '';
    this.players.forEach((player, playerIndex) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.textContent = player.name;
      row.appendChild(nameCell);

      this.rounds.forEach((round, roundIndex) => {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'score-input';
        input.value = round[playerIndex] || '';
        
        input.addEventListener('change', (e) => {
          this.updateScore(roundIndex, playerIndex, parseInt(e.target.value) || 0);
        });
        
        cell.appendChild(input);
        
        // Add styles based on whether this is a winning or losing score
        if (round[playerIndex] !== undefined) {
          if (this.isWinner(round, playerIndex)) {
            cell.classList.add('winning-score');
          } else {
            cell.classList.add('losing-score');
          }
        }
        
        row.appendChild(cell);
      });

      if (this.rounds.length > 0) {
        const totalCell = document.createElement('td');
        totalCell.textContent = this.calculatePlayerTotal(playerIndex);
        totalCell.classList.add('total-score');
        row.appendChild(totalCell);
      }

      this.scoreBody.appendChild(row);
    });
  }

  isWinner(round, playerIndex) {
    if (round[playerIndex] === undefined) return false;
    return round[playerIndex] > 0;
  }

  updateScore(roundIndex, playerIndex, score) {
    this.rounds[roundIndex] = this.rounds[roundIndex] || {};
    
    // Ensure the score is negative for first three entries, positive for the last
    const filledScores = Object.values(this.rounds[roundIndex]).filter(s => s !== undefined);
    if (filledScores.length < 3) {
      // First three entries should be negative
      score = Math.abs(score) * -1;
    } else {
      // Last entry should be positive
      score = Math.abs(score);
    }
    
    this.rounds[roundIndex][playerIndex] = score;
    
    // Auto-calculate winner if three scores are entered
    const roundScores = this.rounds[roundIndex];
    const currentFilledScores = Object.values(roundScores).filter(s => s !== undefined);
    
    if (currentFilledScores.length === 3) {
      // Find the player without a score
      const missingPlayerIndex = this.players.findIndex((_, idx) => 
        roundScores[idx] === undefined
      );
      
      if (missingPlayerIndex !== -1) {
        // Set their score as the negative sum of other scores
        roundScores[missingPlayerIndex] = -currentFilledScores.reduce((sum, score) => sum + score, 0);
      }
    }
    
    this.updateDisplay();
    this.saveToLocalStorage();
  }

  calculatePlayerTotal(playerIndex) {
    return this.rounds.reduce((total, round) => {
      return total + (round[playerIndex] || 0);
    }, 0);
  }

  addNewRound() {
    if (this.players.length < 4) {
      alert('請先新增 4 位玩家！');
      return;
    }
    this.rounds.push({});
    this.updateDisplay();
    this.saveToLocalStorage();
  }

  resetGame() {
    if (!confirm('確定要重置所有資料嗎？')) return;
    this.players = [];
    this.rounds = [];
    this.updateDisplay();
    this.saveToLocalStorage();
  }
}

// Initialize the application
new BigTwoScorekeeper();