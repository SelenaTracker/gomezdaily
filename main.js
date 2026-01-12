// Sistema Principal - Funções Globais

// Inicialização do site
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadUserData();
    updateAllStats();
    checkLoginStatus();
});

// Sistema de Navegação
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Fechar menu ao clicar em link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
}

// Sistema de LocalStorage para Músicas
class MusicStorage {
    static getSongs() {
        const songs = localStorage.getItem('selenaSongs');
        return songs ? JSON.parse(songs) : this.getDefaultSongs();
    }
    
    static saveSongs(songs) {
        localStorage.setItem('selenaSongs', JSON.stringify(songs));
        this.updateAlbumStats(songs);
        this.updateArtistStats(songs);
    }
    
    static getDefaultSongs() {
        // Dados iniciais serão substituídos pelos dados reais que você enviar
        return [
            {
                id: 1,
                name: "Lose You To Love Me",
                album: "Rare Deluxe",
                artist: "Selena Gomez",
                totalStreams: 198951352,
                dailyStreams: 125000,
                goal: 200000000,
                dailyGoal: 150000
            },
            // Mais músicas serão adicionadas aqui
        ];
    }
    
    static updateAlbumStats(songs) {
        const albums = {};
        songs.forEach(song => {
            if (!albums[song.album]) {
                albums[song.album] = {
                    totalStreams: 0,
                    dailyStreams: 0,
                    songs: []
                };
            }
            albums[song.album].totalStreams += song.totalStreams;
            albums[song.album].dailyStreams += song.dailyStreams;
            albums[song.album].songs.push(song.name);
        });
        localStorage.setItem('selenaAlbums', JSON.stringify(albums));
    }
    
    static updateArtistStats(songs) {
        const artists = {
            "Selena Gomez": { totalStreams: 0, dailyStreams: 0 },
            "Selena Gomez & The Scene": { totalStreams: 0, dailyStreams: 0 }
        };
        
        songs.forEach(song => {
            if (artists[song.artist]) {
                artists[song.artist].totalStreams += song.totalStreams;
                artists[song.artist].dailyStreams += song.dailyStreams;
            }
        });
        
        localStorage.setItem('selenaArtists', JSON.stringify(artists));
    }
}

// Sistema de Metas Inteligentes
class GoalSystem {
    static levels = [
        { minDaily: 400000, increment: 5000000, name: "Nível Máximo", color: "#FF4081" },
        { minDaily: 200000, increment: 4000000, name: "Nível Alto", color: "#8A2BE2" },
        { minDaily: 100000, increment: 2000000, name: "Nível Médio", color: "#4A00E0" },
        { minDaily: 30000, increment: 1000000, name: "Nível Básico", color: "#00B4D8" },
        { minDaily: 11000, increment: 200000, name: "Nível Iniciante", color: "#90BE6D" },
        { minDaily: 0, increment: 100000, name: "Nível Manutenção", color: "#F9C74F" }
    ];
    
    static getCurrentLevel(dailyStreams) {
        return this.levels.find(level => dailyStreams >= level.minDaily) || this.levels[this.levels.length - 1];
    }
    
    static calculateNextGoal(currentGoal, dailyStreams) {
        const level = this.getCurrentLevel(dailyStreams);
        return currentGoal + level.increment;
    }
    
    static getProgress(current, goal) {
        return Math.min(Math.round((current / goal) * 100), 100);
    }
}

// Atualizar todas as estatísticas
function updateAllStats() {
    const songs = MusicStorage.getSongs();
    const artists = JSON.parse(localStorage.getItem('selenaArtists') || '{}');
    
    // Atualizar totais
    const dailyTotal = songs.reduce((sum, song) => sum + song.dailyStreams, 0);
    const totalStreams = songs.reduce((sum, song) => sum + song.totalStreams, 0);
    
    document.getElementById('dailyTotal')?.textContent = formatNumber(dailyTotal);
    document.getElementById('totalStreams')?.textContent = formatNumber(totalStreams);
    
    // Atualizar divisão por artista
    if (artists["Selena Gomez"]) {
        document.getElementById('selenaDaily')?.textContent = this.formatNumber(artists["Selena Gomez"].dailyStreams);
        document.getElementById('selenaTotal')?.textContent = this.formatNumber(artists["Selena Gomez"].totalStreams);
    }
    
    if (artists["Selena Gomez & The Scene"]) {
        document.getElementById('sceneDaily')?.textContent = this.formatNumber(artists["Selena Gomez & The Scene"].dailyStreams);
        document.getElementById('sceneTotal')?.textContent = this.formatNumber(artists["Selena Gomez & The Scene"].totalStreams);
    }
    
    // Atualizar sistema de metas
    this.updateGoalSystem(dailyTotal, totalStreams);
    
    // Atualizar top álbuns
    this.updateTopAlbums();
    
    // Atualizar foco do dia
    this.updateFocusOfTheDay();
}

// Formatar números
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Atualizar sistema de metas
function updateGoalSystem(dailyTotal, totalStreams) {
    const goalData = JSON.parse(localStorage.getItem('goalData') || '{"currentGoal": 200000000, "currentProgress": 198951352}');
    
    const currentLevel = GoalSystem.getCurrentLevel(dailyTotal);
    const nextGoal = GoalSystem.calculateNextGoal(goalData.currentGoal, dailyTotal);
    const progress = GoalSystem.getProgress(goalData.currentProgress, goalData.currentGoal);
    
    // Atualizar elementos na página inicial
    const currentGoalElem = document.getElementById('currentGoal');
    const currentLevelElem = document.getElementById('currentLevel');
    const nextGoalElem = document.getElementById('nextGoal');
    const currentTargetElem = document.getElementById('currentTarget');
    const goalTargetElem = document.getElementById('goalTarget');
    const goalProgressElem = document.getElementById('goalProgress');
    
    if (currentGoalElem) currentGoalElem.textContent = this.formatNumber(goalData.currentGoal);
    if (currentLevelElem) currentLevelElem.textContent = currentLevel.name;
    if (nextGoalElem) nextGoalElem.textContent = this.formatNumber(nextGoal);
    if (currentTargetElem) currentTargetElem.textContent = this.formatNumber(goalData.currentProgress);
    if (goalTargetElem) goalTargetElem.textContent = this.formatNumber(goalData.currentGoal);
    if (goalProgressElem) {
        goalProgressElem.style.width = `${progress}%`;
        goalProgressElem.style.background = `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color}DD)`;
    }
    
    // Gerar cards de níveis
    this.generateLevelCards(currentLevel);
    
    // Verificar se meta foi batida
    if (goalData.currentProgress >= goalData.currentGoal) {
        this.addRecentGoal(goalData.currentGoal);
        goalData.currentGoal = nextGoal;
        localStorage.setItem('goalData', JSON.stringify(goalData));
    }
}

// Gerar cards de níveis
function generateLevelCards(currentLevel) {
    const levelsGrid = document.querySelector('.levels-grid');
    if (!levelsGrid) return;
    
    levelsGrid.innerHTML = '';
    
    GoalSystem.levels.forEach((level, index) => {
        const isActive = level.name === currentLevel.name;
        const isCompleted = index > GoalSystem.levels.findIndex(l => l.name === currentLevel.name);
        
        const levelCard = document.createElement('div');
        levelCard.className = `level-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        levelCard.style.borderColor = isActive ? level.color : 'transparent';
        
        levelCard.innerHTML = `
            <h4 style="color: ${level.color}">${level.name}</h4>
            <p>Mínimo: ${this.formatNumber(level.minDaily)}/dia</p>
            <p>Incremento: +${this.formatNumber(level.increment)}</p>
            ${isActive ? '<span class="pulse"><i class="fas fa-check-circle"></i> Ativo</span>' : ''}
        `;
        
        levelsGrid.appendChild(levelCard);
    });
}

// Adicionar meta recentemente batida
function addRecentGoal(goalAmount) {
    const recentGoals = JSON.parse(localStorage.getItem('recentGoals') || '[]');
    const goalDate = new Date().toLocaleDateString('pt-BR');
    
    recentGoals.unshift({
        amount: goalAmount,
        date: goalDate,
        formatted: this.formatNumber(goalAmount)
    });
    
    if (recentGoals.length > 5) {
        recentGoals.pop();
    }
    
    localStorage.setItem('recentGoals', JSON.stringify(recentGoals));
    this.updateRecentGoals();
}

// Atualizar metas recentes
function updateRecentGoals() {
    const recentGoalsContainer = document.getElementById('recentGoals');
    if (!recentGoalsContainer) return;
    
    const recentGoals = JSON.parse(localStorage.getItem('recentGoals') || '[]');
    
    if (recentGoals.length === 0) {
        recentGoalsContainer.innerHTML = `
            <div class="empty-goals">
                <i class="fas fa-flag-checkered"></i>
                <p>Nenhuma meta batida recentemente. Continue streaming!</p>
            </div>
        `;
        return;
    }
    
    recentGoalsContainer.innerHTML = recentGoals.map(goal => `
        <div class="goal-item fade-in">
            <div class="goal-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="goal-info">
                <h4>Meta de ${goal.formatted} streams</h4>
                <p>Batida em ${goal.date}</p>
            </div>
        </div>
    `).join('');
}

// Sistema de Usuários e Pontos
class UserSystem {
    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }
    
    static setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    static logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
    
    static addPoints(points, mission) {
        const user = this.getCurrentUser();
        if (!user) return;
        
        const today = new Date().toDateString();
        
        // Verificar se já completou a missão hoje
        if (!user.dailyMissions) user.dailyMissions = {};
        if (user.dailyMissions[mission] === today) {
            return; // Já ganhou pontos por esta missão hoje
        }
        
        user.points = (user.points || 0) + points;
        user.dailyMissions[mission] = today;
        
        // Atualizar ranking
        this.updateRanking(user.email, user.points);
        
        this.setCurrentUser(user);
        this.saveUser(user);
        
        return user.points;
    }
    
    static updateRanking(email, points) {
        let ranking = JSON.parse(localStorage.getItem('userRanking') || '[]');
        
        const userIndex = ranking.findIndex(u => u.email === email);
        
        if (userIndex > -1) {
            ranking[userIndex].points = points;
            ranking[userIndex].lastUpdate = new Date().toISOString();
        } else {
            ranking.push({
                email: email,
                points: points,
                lastUpdate: new Date().toISOString(),
                missionsCompleted: Object.keys(this.getCurrentUser()?.dailyMissions || {}).length
            });
        }
        
        // Ordenar por pontos
        ranking.sort((a, b) => b.points - a.points);
        
        // Manter apenas top 10
        if (ranking.length > 10) {
            ranking = ranking.slice(0, 10);
        }
        
        localStorage.setItem('userRanking', JSON.stringify(ranking));
    }
    
    static saveUser(user) {
        let users = JSON.parse(localStorage.getItem('selenaUsers') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);
        
        if (userIndex > -1) {
            users[userIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem('selenaUsers', JSON.stringify(users));
    }
    
    static getUserByEmail(email) {
        const users = JSON.parse(localStorage.getItem('selenaUsers') || '[]');
        return users.find(u => u.email === email);
    }
}

// Carregar dados do usuário
function loadUserData() {
    const user = UserSystem.getCurrentUser();
    if (user) {
        // Atualizar UI para usuário logado
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.email.split('@')[0]} (${user.points || 0} pts)`;
            loginBtn.onclick = () => UserSystem.logout();
        }
    }
}

// Verificar status do login
function checkLoginStatus() {
    const user = UserSystem.getCurrentUser();
    if (!user) return;
    
    // Verificar missão de login diário
    const lastLogin = localStorage.getItem('lastDailyLogin');
    const today = new Date().toDateString();
    
    if (lastLogin !== today) {
        UserSystem.addPoints(1, 'daily_login');
        localStorage.setItem('lastDailyLogin', today);
    }
}
// Adicionar esta função ao main.js

function loadInitialData() {
    const initialSongs = [
        // Dados reais que você vai fornecer
        // Formato:
        // {
        //     id: 1,
        //     name: "Nome da Música",
        //     album: "Nome do Álbum",
        //     artist: "Selena Gomez" ou "Selena Gomez & The Scene",
        //     totalStreams: 123456789,
        //     dailyStreams: 12345,
        //     goal: 200000000,
        //     dailyGoal: 150000
        // },
        // ... mais músicas
    ];
    
    // Verificar se já existem dados
    const existingSongs = MusicStorage.getSongs();
    if (existingSongs.length === 0 || existingSongs.length === 1) {
        // Carregar dados iniciais
        localStorage.setItem('selenaSongs', JSON.stringify(initialSongs));
        MusicStorage.updateAlbumStats(initialSongs);
        MusicStorage.updateArtistStats(initialSongs);
        
        // Inicializar dados da meta
        if (!localStorage.getItem('goalData')) {
            const totalStreams = initialSongs.reduce((sum, song) => sum + song.totalStreams, 0);
            localStorage.setItem('goalData', JSON.stringify({
                currentGoal: 1000000000, // 1 bilhão como meta inicial
                currentProgress: totalStreams
            }));
        }
        
        // Inicializar votação
        if (!localStorage.getItem('votingOptions')) {
            const votingOptions = [
                { id: 1, name: "A Year Without Rain", votes: 0 },
                { id: 2, name: "Bluest Flame", votes: 0 },
                { id: 3, name: "Only You", votes: 0 },
                { id: 4, name: "Anxiety", votes: 0 }
            ];
            localStorage.setItem('votingOptions', JSON.stringify(votingOptions));
        }
        
        // Inicializar playlist
        if (!localStorage.getItem('spotifyPlaylist')) {
            localStorage.setItem('spotifyPlaylist', 'https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8');
        }
        
        console.log('Dados iniciais carregados com sucesso!');
    }
}

// Chamar esta função quando você tiver os dados reais
// loadInitialData();
