class BigTwoScorekeeper {
  constructor() {
    this.players = [];
    this.rounds = [];
    this.selectedInput = null;
    this.currentValue = '';
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
    this.numButtons = document.querySelectorAll('.num-btn');
  }

  setupEventListeners() {
    this.addPlayerBtn.addEventListener('click', () => this.addPlayer());
    this.resetBtn.addEventListener('click', () => this.resetGame());
    this.addRoundBtn.addEventListener('click', () => this.addNewRound());
    this.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addPlayer();
    });

    // Add number pad event listeners
    this.numButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handleNumpadInput(btn.textContent));
    });

    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
      if (!this.selectedInput) return;
      
      if (e.key >= '0' && e.key <= '9') {
        this.handleNumpadInput(e.key);
      } else if (e.key === 'Backspace') {
        this.handleNumpadInput('⌫');
      } else if (e.key === 'Enter') {
        this.handleNumpadInput('↵');
      }
    });
  }

  handleNumpadInput(value) {
    if (!this.selectedInput) return;

    if (value === '⌫') {
      this.currentValue = this.currentValue.slice(0, -1);
    } else if (value === '↵') {
      if (this.currentValue) {
        const roundIndex = parseInt(this.selectedInput.dataset.round);
        const playerIndex = parseInt(this.selectedInput.dataset.player);
        this.updateScore(roundIndex, playerIndex, parseInt(this.currentValue));
        this.currentValue = '';
        this.selectedInput.classList.remove('selected');
        this.selectedInput = null;
      }
    } else {
      this.currentValue += value;
    }

    if (this.selectedInput) {
      this.selectedInput.value = this.currentValue;
    }
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
    // Scroll to show latest round and totals if needed
    if (this.rounds.length > 0) {
      setTimeout(() => {
        const tableContainer = document.querySelector('.table-scroll');
        const tableWidth = this.scoreTable.offsetWidth;
        const containerWidth = tableContainer.offsetWidth;
        const scrollAmount = Math.max(0, tableWidth - containerWidth);
        
        // Smooth scroll to position that shows the latest round and totals
        tableContainer.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }, 100);
    }
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
        input.dataset.round = roundIndex;
        input.dataset.player = playerIndex;
        
        // Add current-round class if this is the latest round and not all scores are filled
        const isCurrentRound = roundIndex === this.rounds.length - 1;
        const roundComplete = Object.keys(round).length === 4;
        if (isCurrentRound && !roundComplete) {
          input.classList.add('current-round');
        }
        
        input.value = round[playerIndex] || '';
        
        input.addEventListener('focus', () => {
          if (this.selectedInput) {
            this.selectedInput.classList.remove('selected');
          }
          this.selectedInput = input;
          this.currentValue = input.value;
          input.classList.add('selected');
        });
        
        input.addEventListener('blur', (event) => {
          // Don't remove selected class if clicking numpad
          setTimeout(() => {
            if (!event.relatedTarget?.classList.contains('num-btn')) {
              input.classList.remove('selected');
              this.selectedInput = null;
            }
          }, 100);
        });
        
        cell.appendChild(input);
        
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

    // Check if round is complete (all 4 scores are filled)
    const isRoundComplete = Object.keys(this.rounds[roundIndex]).length === 4;
    if (isRoundComplete) {
      // Automatically add a new round
      this.rounds.push({});
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