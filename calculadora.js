// Sistema da Calculadora

document.addEventListener('DOMContentLoaded', function() {
    loadSongOptions();
    loadCalculationHistory();
    updateQuickStats();
    
    // Adicionar missão ao carregar a página da calculadora
    const user = UserSystem.getCurrentUser();
    if (user && window.location.pathname.includes('calculadora.html')) {
        MissionSystem.completeMission('use_calculator');
    }
});

// Formatar entrada de números
function formatNumberInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length > 3) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    input.value = value;
}

// Carregar opções de músicas
function loadSongOptions() {
    const songSelect = document.getElementById('songSelect');
    if (!songSelect) return;
    
    const songs = MusicStorage.getSongs();
    
    songs.forEach(song => {
        const option = document.createElement('option');
        option.value = song.id;
        option.textContent = `${song.name} (${formatNumber(song.totalStreams)} streams)`;
        songSelect.appendChild(option);
    });
}

// Carregar dados da música selecionada
function loadSongData() {
    const songSelect = document.getElementById('songSelect');
    const songId = parseInt(songSelect.value);
    
    if (!songId) return;
    
    const songs = MusicStorage.getSongs();
    const song = songs.find(s => s.id === songId);
    
    if (song) {
        document.getElementById('currentStreams').value = formatNumberInputValue(song.totalStreams);
        document.getElementById('goalStreams').value = formatNumberInputValue(song.goal);
        document.getElementById('dailyAverage').value = formatNumberInputValue(song.dailyStreams);
    }
}

// Formatar número para input
function formatNumberInputValue(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Calcular dias restantes
function calculateDays() {
    // Obter e limpar valores
    const current = parseFloat(document.getElementById('currentStreams').value.replace(/\./g, '')) || 0;
    const goal = parseFloat(document.getElementById('goalStreams').value.replace(/\./g, '')) || 0;
    const daily = parseFloat(document.getElementById('dailyAverage').value.replace(/\./g, '')) || 0;
    
    // Validações
    if (current <= 0) {
        showError('Por favor, insira um valor válido para streams atuais.');
        return;
    }
    
    if (goal <= current) {
        showError('A meta deve ser maior que os streams atuais.');
        return;
    }
    
    if (daily <= 0) {
        showError('Por favor, insira uma média diária válida (maior que 0).');
        return;
    }
    
    // Cálculos
    const remaining = goal - current;
    const days = Math.ceil(remaining / daily);
    
    // Data estimada
    const today = new Date();
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + days);
    
    // Cálculos adicionais
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const progress = Math.min(Math.round((current / goal) * 100), 100);
    const streamsPerHour = Math.round(daily / 24);
    
    // Mostrar resultados
    displayResults({
        current: current,
        goal: goal,
        daily: daily,
        remaining: remaining,
        days: days,
        estimatedDate: estimatedDate,
        weeks: weeks,
        months: months,
        progress: progress,
        streamsPerHour: streamsPerHour
    });
    
    // Salvar no histórico
    saveToHistory({
        current: current,
        goal: goal,
        daily: daily,
        days: days,
        date: new Date().toLocaleString('pt-BR')
    });
}

// Mostrar resultados
function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    const formattedDate = data.estimatedDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const resultsHTML = `
        <div class="results-content fade-in">
            <div class="results-header">
                <h3><i class="fas fa-chart-line"></i> Resultados do Cálculo</h3>
                <span class="results-badge">${data.progress}% concluído</span>
            </div>
            
            <div class="results-grid">
                <div class="result-card highlight">
                    <i class="fas fa-calendar-alt"></i>
                    <h4>${data.days} dias</h4>
                    <p>Restantes para a meta</p>
                </div>
                
                <div class="result-card">
                    <i class="fas fa-bullseye"></i>
                    <h4>${formatNumber(data.remaining)}</h4>
                    <p>Streams faltando</p>
                </div>
                
                <div class="result-card">
                    <i class="fas fa-rocket"></i>
                    <h4>${formatNumber(data.daily)}/dia</h4>
                    <p>Necessários</p>
                </div>
                
                <div class="result-card">
                    <i class="fas fa-clock"></i>
                    <h4>${formatNumber(data.streamsPerHour)}/hora</h4>
                    <p>Média horária</p>
                </div>
            </div>
            
            <div class="results-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-check"></i>
                    <div>
                        <h5>Data Estimada</h5>
                        <p>${formattedDate}</p>
                        <small>${data.weeks > 0 ? `(~${data.weeks} semanas)` : ''} 
                               ${data.months > 0 ? `(~${data.months} meses)` : ''}</small>
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-chart-bar"></i>
                    <div>
                        <h5>Progresso Atual</h5>
                        <div class="progress-container-large">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${data.progress}%"></div>
                            </div>
                            <span class="progress-text-large">${formatNumber(data.current)} / ${formatNumber(data.goal)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-lightbulb"></i>
                    <div>
                        <h5>Recomendações</h5>
                        <ul class="recommendations">
                            <li>Compartilhe nas redes sociais</li>
                            <li>Adicione a música às suas playlists</li>
                            <li>Ouça no modo repeat quando possível</li>
                            <li>Participe das votações no site</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="results-actions">
                <button class="btn btn-primary" onclick="shareResults()">
                    <i class="fas fa-share-alt"></i> Compartilhar Resultados
                </button>
                <button class="btn btn-secondary" onclick="saveAsFavorite()">
                    <i class="fas fa-heart"></i> Salvar como Favorito
                </button>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
}

// Mostrar erro
function showError(message) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div class="results-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Erro no Cálculo</h4>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="useExampleData()">
                Usar Dados de Exemplo
            </button>
        </div>
    `;
}

// Usar dados de exemplo
function useExampleData() {
    document.getElementById('currentStreams').value = '198.951.352';
    document.getElementById('goalStreams').value = '200.000.000';
    document.getElementById('dailyAverage').value = '125.000';
    calculateDays();
}

// Limpar calculadora
function clearCalculator() {
    document.getElementById('currentStreams').value = '';
    document.getElementById('goalStreams').value = '';
    document.getElementById('dailyAverage').value = '';
    document.getElementById('songSelect').value = '';
    
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div class="results-placeholder">
            <i class="fas fa-chart-bar"></i>
            <p>Preencha os campos acima para ver os resultados</p>
        </div>
    `;
}

// Salvar no histórico
function saveToHistory(calculation) {
    let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    
    history.unshift({
        ...calculation,
        id: Date.now()
    });
    
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    localStorage.setItem('calculationHistory', JSON.stringify(history));
    loadCalculationHistory();
}

// Carregar histórico
function loadCalculationHistory() {
    const historyContainer = document.getElementById('calculationHistory');
    if (!historyContainer) return;
    
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <p>Nenhum cálculo realizado ainda</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-date">${item.date}</div>
            <div class="history-details">
                <span>${formatNumber(item.current)} → ${formatNumber(item.goal)}</span>
                <small>${item.days} dias • ${formatNumber(item.daily)}/dia</small>
            </div>
            <button class="history-action" onclick="loadFromHistory(${item.id})">
                <i class="fas fa-redo"></i>
            </button>
        </div>
    `).join('');
}

// Carregar do histórico
function loadFromHistory(id) {
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    const item = history.find(h => h.id === id);
    
    if (item) {
        document.getElementById('currentStreams').value = formatNumberInputValue(item.current);
        document.getElementById('goalStreams').value = formatNumberInputValue(item.goal);
        document.getElementById('dailyAverage').value = formatNumberInputValue(item.daily);
        calculateDays();
    }
}

// Atualizar estatísticas rápidas
function updateQuickStats() {
    const songs = MusicStorage.getSongs();
    
    // Média diária do site
    const totalDaily = songs.reduce((sum, song) => sum + song.dailyStreams, 0);
    const avgDaily = Math.round(totalDaily / songs.length);
    document.getElementById('avgDailySite').textContent = formatNumber(avgDaily);
    
    // Total de metas batidas
    const recentGoals = JSON.parse(localStorage.getItem('recentGoals') || '[]');
    document.getElementById('totalGoalsSite').textContent = recentGoals.length;
    
    // Metas ativas
    const activeGoals = songs.filter(song => song.totalStreams < song.goal).length;
    document.getElementById('activeGoalsSite').textContent = activeGoals;
}

// Compartilhar resultados
function shareResults() {
    const resultsContainer = document.querySelector('.results-content');
    if (!resultsContainer) return;
    
    const days = document.querySelector('.result-card h4')?.textContent || '0';
    const remaining = document.querySelectorAll('.result-card h4')[1]?.textContent || '0';
    
    const shareText = `🎵 Calculadora de Metas - Selena Gomez Stream Tracker\n\n` +
                     `Faltam ${days} dias para alcançar a meta!\n` +
                     `Streams restantes: ${remaining}\n\n` +
                     `Calcule suas metas também em: ${window.location.hostname}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Resultados da Calculadora',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Resultados copiados para a área de transferência!');
        });
    }
}

// Salvar como favorito
function saveAsFavorite() {
    const current = document.getElementById('currentStreams').value;
    const goal = document.getElementById('goalStreams').value;
    const daily = document.getElementById('dailyAverage').value;
    
    if (!current || !goal || !daily) {
        alert('Preencha todos os campos para salvar como favorito.');
        return;
    }
    
    let favorites = JSON.parse(localStorage.getItem('calculatorFavorites') || '[]');
    
    favorites.push({
        current: current,
        goal: goal,
        daily: daily,
        date: new Date().toLocaleString('pt-BR')
    });
    
    localStorage.setItem('calculatorFavorites', JSON.stringify(favorites));
    
    alert('Cálculo salvo como favorito!');
}

// Formatar número
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Mostrar ranking
function showRanking() {
    window.location.href = 'index.html#ranking';
}
