// Sistema de Votação

let selectedSong = null;
let votingOptions = [
    { id: 1, name: "A Year Without Rain", votes: 0 },
    { id: 2, name: "Bluest Flame", votes: 0 },
    { id: 3, name: "Only You", votes: 0 },
    { id: 4, name: "Anxiety", votes: 0 }
];

document.addEventListener('DOMContentLoaded', function() {
    initVotingSystem();
    loadVotingData();
    startVotingTimer();
    updateUserVotingInfo();
    
    // Adicionar missão ao carregar a página de votação
    const user = UserSystem.getCurrentUser();
    if (user) {
        // Missão será adicionada quando votar
    }
});

// Inicializar sistema de votação
function initVotingSystem() {
    // Carregar opções de votação do admin
    const adminOptions = JSON.parse(localStorage.getItem('votingOptions') || 'null');
    if (adminOptions) {
        votingOptions = adminOptions;
    }
    
    // Carregar resultados atuais
    const currentResults = JSON.parse(localStorage.getItem('votingResults') || 'null');
    if (currentResults) {
        votingOptions = votingOptions.map(option => {
            const result = currentResults.find(r => r.id === option.id);
            return { ...option, votes: result ? result.votes : 0 };
        });
    }
    
    renderVotingOptions();
    updateResults();
}

// Renderizar opções de votação
function renderVotingOptions() {
    const votingOptionsContainer = document.getElementById('votingOptions');
    if (!votingOptionsContainer) return;
    
    votingOptionsContainer.innerHTML = votingOptions.map(option => {
        const percentage = calculatePercentage(option.votes);
        
        return `
            <div class="voting-option ${selectedSong === option.id ? 'selected' : ''}" 
                 onclick="selectSong(${option.id})">
                <div class="option-checkbox">
                    <i class="fas ${selectedSong === option.id ? 'fa-check-circle' : 'fa-circle'}"></i>
                </div>
                <div class="option-content">
                    <h4>${option.name}</h4>
                    <div class="option-stats">
                        <div class="option-votes">
                            <i class="fas fa-vote-yea"></i>
                            <span>${option.votes} votos</span>
                        </div>
                        <div class="option-percentage">
                            <i class="fas fa-chart-bar"></i>
                            <span>${percentage}%</span>
                        </div>
                    </div>
                    <div class="option-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="option-action">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    }).join('');
}

// Selecionar música
function selectSong(songId) {
    const user = UserSystem.getCurrentUser();
    if (!user) {
        alert('Por favor, faça login para votar!');
        return;
    }
    
    // Verificar se já votou hoje
    const votesToday = getUserVotesToday();
    if (votesToday >= 2) {
        alert('Você já usou seus 2 votos de hoje! Volte amanhã para votar novamente.');
        return;
    }
    
    selectedSong = songId;
    renderVotingOptions();
    updateSubmitButton();
}

// Calcular porcentagem
function calculatePercentage(votes) {
    const totalVotes = votingOptions.reduce((sum, option) => sum + option.votes, 0);
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
}

// Atualizar botão de envio
function updateSubmitButton() {
    const submitBtn = document.getElementById('submitVoteBtn');
    if (submitBtn) {
        submitBtn.disabled = !selectedSong;
        submitBtn.innerHTML = selectedSong 
            ? `<i class="fas fa-paper-plane"></i> Votar em "${votingOptions.find(o => o.id === selectedSong)?.name}"`
            : `<i class="fas fa-paper-plane"></i> Confirmar Voto`;
    }
}

// Submeter voto
function submitVote() {
    if (!selectedSong) {
        alert('Por favor, selecione uma música para votar!');
        return;
    }
    
    const user = UserSystem.getCurrentUser();
    if (!user) {
        alert('Por favor, faça login para votar!');
        return;
    }
    
    // Verificar se já votou hoje
    const votesToday = getUserVotesToday();
    if (votesToday >= 2) {
        alert('Você já usou seus 2 votos de hoje! Volte amanhã para votar novamente.');
        return;
    }
    
    // Registrar voto
    const today = new Date().toDateString();
    let userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    
    if (!userVotes[user.email]) {
        userVotes[user.email] = {};
    }
    
    if (!userVotes[user.email][today]) {
        userVotes[user.email][today] = [];
    }
    
    // Verificar se já votou nesta música hoje
    if (userVotes[user.email][today].includes(selectedSong)) {
        alert('Você já votou nesta música hoje! Escolha outra música.');
        return;
    }
    
    // Adicionar voto
    userVotes[user.email][today].push(selectedSong);
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
    
    // Atualizar contagem de votos
    const optionIndex = votingOptions.findIndex(o => o.id === selectedSong);
    if (optionIndex !== -1) {
        votingOptions[optionIndex].votes++;
        
        // Salvar resultados
        localStorage.setItem('votingResults', JSON.stringify(votingOptions));
        
        // Atualizar visualização
        renderVotingOptions();
        updateResults();
        updateUserVotingInfo();
        
        // Adicionar pontos
        MissionSystem.completeMission('vote');
        
        // Mostrar confirmação
        showVoteConfirmation(votingOptions[optionIndex].name);
        
        // Resetar seleção
        selectedSong = null;
        updateSubmitButton();
    }
}

// Mostrar confirmação de voto
function showVoteConfirmation(songName) {
    const confirmation = document.createElement('div');
    confirmation.className = 'vote-confirmation fade-in';
    confirmation.innerHTML = `
        <div class="confirmation-content">
            <i class="fas fa-check-circle"></i>
            <div>
                <h4>Voto registrado com sucesso!</h4>
                <p>Você votou em: <strong>${songName}</strong></p>
                <small>+2 pontos adicionados à sua conta</small>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmation);
    
    // Estilo da confirmação
    confirmation.style.position = 'fixed';
    confirmation.style.top = '20px';
    confirmation.style.right = '20px';
    confirmation.style.background = 'var(--success-color)';
    confirmation.style.color = 'white';
    confirmation.style.padding = '1rem';
    confirmation.style.borderRadius = 'var(--border-radius)';
    confirmation.style.zIndex = '3000';
    confirmation.style.boxShadow = 'var(--box-shadow)';
    confirmation.style.maxWidth = '300px';
    
    // Remover após 5 segundos
    setTimeout(() => {
        confirmation.style.opacity = '0';
        confirmation.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 300);
    }, 5000);
}

// Limpar voto
function clearVote() {
    selectedSong = null;
    renderVotingOptions();
    updateSubmitButton();
}

// Obter votos do usuário hoje
function getUserVotesToday() {
    const user = UserSystem.getCurrentUser();
    if (!user) return 0;
    
    const today = new Date().toDateString();
    const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    
    if (userVotes[user.email] && userVotes[user.email][today]) {
        return userVotes[user.email][today].length;
    }
    
    return 0;
}

// Atualizar informações do usuário
function updateUserVotingInfo() {
    const votesToday = getUserVotesToday();
    const votesRemaining = Math.max(0, 2 - votesToday);
    
    const user = UserSystem.getCurrentUser();
    const totalPoints = user ? (user.points || 0) : 0;
    
    document.getElementById('userVotesToday').textContent = votesToday;
    document.getElementById('userVotesRemaining').textContent = votesRemaining;
    document.getElementById('userTotalPoints').textContent = totalPoints;
}

// Atualizar resultados
function updateResults() {
    const totalVotes = votingOptions.reduce((sum, option) => sum + option.votes, 0);
    
    // Atualizar total de votos
    document.getElementById('totalVotes').textContent = totalVotes;
    document.getElementById('votesToday').textContent = getTodayVotes();
    
    // Encontrar vencedor atual
    let winner = votingOptions[0];
    let maxVotes = 0;
    
    votingOptions.forEach(option => {
        if (option.votes > maxVotes) {
            maxVotes = option.votes;
            winner = option;
        }
    });
    
    document.getElementById('currentWinner').textContent = winner.name;
    
    // Atualizar grid de resultados
    const resultsGrid = document.getElementById('resultsGrid');
    if (resultsGrid) {
        resultsGrid.innerHTML = votingOptions.map(option => {
            const percentage = calculatePercentage(option.votes);
            const isWinner = option.id === winner.id;
            
            return `
                <div class="result-card ${isWinner ? 'winner' : ''}">
                    <div class="result-header">
                        <h4>${option.name}</h4>
                        ${isWinner ? '<span class="winner-badge"><i class="fas fa-crown"></i> Líder</span>' : ''}
                    </div>
                    <div class="result-stats">
                        <div class="result-votes">
                            <i class="fas fa-vote-yea"></i>
                            <span>${option.votes} votos</span>
                        </div>
                        <div class="result-percentage">
                            <span>${percentage}%</span>
                        </div>
                    </div>
                    <div class="result-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Salvar vencedor se for o final da votação
    checkVotingEnd();
}

// Obter votos de hoje
function getTodayVotes() {
    const today = new Date().toDateString();
    let todayVotes = 0;
    const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    
    Object.values(userVotes).forEach(user => {
        if (user[today]) {
            todayVotes += user[today].length;
        }
    });
    
    return todayVotes;
}

// Sistema de Timer da Votação
function startVotingTimer() {
    updateVotingTimer();
    setInterval(updateVotingTimer, 1000);
}

function updateVotingTimer() {
    const now = new Date();
    const endTime = getVotingEndTime();
    
    let timeRemaining = endTime - now;
    
    if (timeRemaining < 0) {
        // Votação terminou, iniciar nova
        timeRemaining = 48 * 60 * 60 * 1000; // 48 horas
        resetVoting();
    }
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    // Atualizar display
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    // Atualizar progresso
    const totalTime = 48 * 60 * 60 * 1000;
    const progress = ((totalTime - timeRemaining) / totalTime) * 100;
    document.getElementById('votingProgress').style.width = `${progress}%`;
    
    // Atualizar informações
    const status = document.getElementById('timerStatus');
    const info = document.getElementById('timerInfo');
    
    if (timeRemaining < 3600000) { // Menos de 1 hora
        status.textContent = 'Terminando em breve';
        status.style.color = 'var(--warning-color)';
        info.textContent = `Votação termina em ${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
        status.textContent = 'Em andamento';
        status.style.color = 'var(--success-color)';
        
        const endDate = new Date(endTime);
        info.textContent = `Próxima votação termina em ${endDate.toLocaleDateString('pt-BR')} às 21:00`;
    }
}

function getVotingEndTime() {
    // Votação sempre termina às 21:00 (Horário de Brasília)
    const now = new Date();
    const endTime = new Date(now);
    
    // Ajustar para o próximo término às 21:00
    endTime.setHours(21, 0, 0, 0);
    
    // Se já passou das 21:00 hoje, ir para amanhã
    if (now > endTime) {
        endTime.setDate(endTime.getDate() + 1);
    }
    
    // Verificar se é segunda-feira (início das votações)
    if (endTime.getDay() !== 1) {
        // Encontrar próxima segunda-feira
        const daysUntilMonday = (8 - endTime.getDay()) % 7 || 7;
        endTime.setDate(endTime.getDate() + daysUntilMonday);
    }
    
    // Adicionar 48 horas (duração da votação)
    endTime.setHours(endTime.getHours() + 48);
    
    return endTime;
}

// Verificar fim da votação
function checkVotingEnd() {
    const now = new Date();
    const endTime = getVotingEndTime();
    
    if (now >= endTime) {
        finalizeVoting();
    }
}

// Finalizar votação
function finalizeVoting() {
    // Encontrar vencedor
    let winner = votingOptions[0];
    let maxVotes = 0;
    
    votingOptions.forEach(option => {
        if (option.votes > maxVotes) {
            maxVotes = option.votes;
            winner = option;
        }
    });
    
    // Salvar vencedor
    localStorage.setItem('votingResult', JSON.stringify({
        winner: winner.name,
        votes: winner.votes,
        date: new Date().toISOString()
    }));
    
    // Adicionar ao histórico
    addToVotingHistory(winner);
    
    // Resetar votação
    resetVoting();
    
    // Notificar usuários
    showVotingEndNotification(winner.name);
}

// Resetar votação
function resetVoting() {
    // Zerar votos
    votingOptions = votingOptions.map(option => ({
        ...option,
        votes: 0
    }));
    
    localStorage.setItem('votingResults', JSON.stringify(votingOptions));
    updateResults();
}

// Adicionar ao histórico
function addToVotingHistory(winner) {
    let history = JSON.parse(localStorage.getItem('votingHistory') || '[]');
    
    history.unshift({
        winner: winner.name,
        votes: winner.votes,
        date: new Date().toLocaleDateString('pt-BR'),
        totalVotes: votingOptions.reduce((sum, option) => sum + option.votes, 0)
    });
    
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    localStorage.setItem('votingHistory', JSON.stringify(history));
    updateVotingHistory();
}

// Atualizar histórico de votações
function updateVotingHistory() {
    const historyContainer = document.getElementById('votingHistory');
    if (!historyContainer) return;
    
    const history = JSON.parse(localStorage.getItem('votingHistory') || '[]');
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <p>Nenhuma votação finalizada ainda</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-date">${item.date}</div>
            <div class="history-winner">
                <i class="fas fa-crown"></i>
                <span>${item.winner}</span>
            </div>
            <div class="history-stats">
                <span>${item.votes} votos</span>
                <small>Total: ${item.totalVotes}</small>
            </div>
        </div>
    `).join('');
}

// Mostrar notificação do fim da votação
function showVotingEndNotification(winnerName) {
    if (Notification.permission === 'granted') {
        new Notification('🎵 Votação Encerrada!', {
            body: `"${winnerName}" é a nova música foco do dia!`,
            icon: 'https://img.icons8.com/color/96/pop-music.png'
        });
    }
}

// Carregar dados da votação
function loadVotingData() {
    updateVotingHistory();
}

// Mostrar ranking
function showRanking() {
    window.location.href = 'index.html#ranking';
}
