// Sistema do Painel Administrativo

let songsData = [];
let editingSongId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        initAdminPanel();
        loadSongsForAdmin();
        updateAdminStats();
        loadVotingConfig();
        loadUsersData();
    }
});

// Inicializar painel admin
function initAdminPanel() {
    updateAdminStats();
    
    // Formatar inputs numéricos
    document.querySelectorAll('input[oninput*="formatNumberInputAdmin"]').forEach(input => {
        input.addEventListener('input', function() {
            formatNumberInputAdmin(this);
        });
    });
}

// Alternar abas
function switchTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar aba selecionada
    document.querySelector(`.tab-btn[onclick*="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Formatar número no admin
function formatNumberInputAdmin(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length > 3) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    input.value = value;
}

// Carregar músicas para admin
function loadSongsForAdmin() {
    songsData = MusicStorage.getSongs();
    renderAdminSongsTable();
}

// Renderizar tabela de músicas no admin
function renderAdminSongsTable() {
    const tbody = document.getElementById('adminSongsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = songsData.map(song => {
        return `
            <tr data-id="${song.id}">
                <td>
                    <div class="song-info-admin">
                        <strong>${song.name}</strong>
                        <small>ID: ${song.id}</small>
                    </div>
                </td>
                <td>${song.album}</td>
                <td>
                    <span class="artist-badge ${song.artist === 'Selena Gomez' ? 'selena' : 'scene'}">
                        ${song.artist}
                    </span>
                </td>
                <td>
                    <input type="text" 
                           class="streams-input" 
                           value="${formatNumberInputValue(song.totalStreams)}"
                           data-original="${song.totalStreams}"
                           oninput="formatNumberInputAdmin(this)"
                           onchange="updateSongStreams(${song.id}, this, 'totalStreams')">
                </td>
                <td>
                    <div class="daily-streams-display">
                        <span>${formatNumber(song.dailyStreams)}</span>
                        <small>hoje</small>
                    </div>
                </td>
                <td>
                    <input type="text" 
                           class="goal-input" 
                           value="${formatNumberInputValue(song.goal)}"
                           oninput="formatNumberInputAdmin(this)"
                           onchange="updateSongGoal(${song.id}, this)">
                </td>
                <td>
                    <div class="admin-actions">
                        <button class="action-btn update-btn" onclick="updateSong(${song.id})">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editSong(${song.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteSong(${song.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Adicionar nova música
function addNewSong(event) {
    event.preventDefault();
    
    const name = document.getElementById('newSongName').value.trim();
    const album = document.getElementById('newSongAlbum').value.trim();
    const artist = document.getElementById('newSongArtist').value;
    const totalStreams = parseInt(document.getElementById('newSongTotalStreams').value.replace(/\./g, '')) || 0;
    const goal = parseInt(document.getElementById('newSongGoal').value.replace(/\./g, '')) || 0;
    const dailyGoal = parseInt(document.getElementById('newSongDailyGoal').value.replace(/\./g, '')) || Math.round(goal * 0.000625);
    
    if (!name || !album || totalStreams <= 0 || goal <= 0) {
        alert('Por favor, preencha todos os campos obrigatórios com valores válidos.');
        return false;
    }
    
    // Gerar novo ID
    const songs = MusicStorage.getSongs();
    const newId = songs.length > 0 ? Math.max(...songs.map(s => s.id)) + 1 : 1;
    
    const newSong = {
        id: newId,
        name: name,
        album: album,
        artist: artist,
        totalStreams: totalStreams,
        dailyStreams: 0, // Começa com 0 streams hoje
        goal: goal,
        dailyGoal: dailyGoal
    };
    
    // Adicionar à lista
    songs.push(newSong);
    MusicStorage.saveSongs(songs);
    
    // Recarregar tabela
    loadSongsForAdmin();
    updateAdminStats();
    
    // Limpar formulário
    clearAddForm();
    
    // Mostrar confirmação
    alert(`Música "${name}" adicionada com sucesso!`);
    
    return false;
}

// Limpar formulário de adição
function clearAddForm() {
    document.getElementById('addSongForm').reset();
}

// Atualizar streams de uma música
function updateSongStreams(songId, input, field) {
    const newValue = parseInt(input.value.replace(/\./g, '')) || 0;
    const originalValue = parseInt(input.dataset.original) || 0;
    
    if (newValue !== originalValue) {
        // Calcular diferença para streams diários
        const songs = MusicStorage.getSongs();
        const songIndex = songs.findIndex(s => s.id === songId);
        
        if (songIndex !== -1) {
            const oldValue = songs[songIndex].totalStreams;
            const difference = newValue - oldValue;
            
            // Atualizar streams diários (se for aumento)
            if (difference > 0) {
                songs[songIndex].dailyStreams += difference;
            }
            
            songs[songIndex].totalStreams = newValue;
            
            // Atualizar data original no input
            input.dataset.original = newValue;
            
            // Salvar alterações
            MusicStorage.saveSongs(songs);
            
            // Atualizar estatísticas
            updateAdminStats();
            
            // Mostrar confirmação
            const songName = songs[songIndex].name;
            showAdminNotification(`Streams de "${songName}" atualizados: +${formatNumber(difference)} hoje`);
        }
    }
}

// Atualizar meta de uma música
function updateSongGoal(songId, input) {
    const newValue = parseInt(input.value.replace(/\./g, '')) || 0;
    
    const songs = MusicStorage.getSongs();
    const songIndex = songs.findIndex(s => s.id === songId);
    
    if (songIndex !== -1 && newValue > 0) {
        songs[songIndex].goal = newValue;
        MusicStorage.saveSongs(songs);
        
        const songName = songs[songIndex].name;
        showAdminNotification(`Meta de "${songName}" atualizada para ${formatNumber(newValue)}`);
    }
}

// Atualizar música completa
function updateSong(songId) {
    const songs = MusicStorage.getSongs();
    const songIndex = songs.findIndex(s => s.id === songId);
    
    if (songIndex !== -1) {
        const song = songs[songIndex];
        
        // Atualizar álbum e estatísticas
        MusicStorage.updateAlbumStats(songs);
        MusicStorage.updateArtistStats(songs);
        
        showAdminNotification(`Música "${song.name}" atualizada com sucesso!`);
    }
}

// Editar música
function editSong(songId) {
    const songs = MusicStorage.getSongs();
    const song = songs.find(s => s.id === songId);
    
    if (song) {
        // Preencher formulário de edição
        document.getElementById('newSongName').value = song.name;
        document.getElementById('newSongAlbum').value = song.album;
        document.getElementById('newSongArtist').value = song.artist;
        document.getElementById('newSongTotalStreams').value = formatNumberInputValue(song.totalStreams);
        document.getElementById('newSongGoal').value = formatNumberInputValue(song.goal);
        document.getElementById('newSongDailyGoal').value = formatNumberInputValue(song.dailyGoal || 0);
        
        // Mudar para modo edição
        editingSongId = songId;
        
        // Alterar botão do formulário
        const form = document.getElementById('addSongForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.onclick = function(e) {
            e.preventDefault();
            saveEditedSong();
        };
        
        // Scroll para formulário
        document.getElementById('newSongName').scrollIntoView({ behavior: 'smooth' });
    }
}

// Salvar edição de música
function saveEditedSong() {
    if (!editingSongId) return;
    
    const songs = MusicStorage.getSongs();
    const songIndex = songs.findIndex(s => s.id === editingSongId);
    
    if (songIndex !== -1) {
        songs[songIndex] = {
            id: editingSongId,
            name: document.getElementById('newSongName').value.trim(),
            album: document.getElementById('newSongAlbum').value.trim(),
            artist: document.getElementById('newSongArtist').value,
            totalStreams: parseInt(document.getElementById('newSongTotalStreams').value.replace(/\./g, '')) || 0,
            dailyStreams: songs[songIndex].dailyStreams, // Manter streams diários
            goal: parseInt(document.getElementById('newSongGoal').value.replace(/\./g, '')) || 0,
            dailyGoal: parseInt(document.getElementById('newSongDailyGoal').value.replace(/\./g, '')) || 0
        };
        
        MusicStorage.saveSongs(songs);
        loadSongsForAdmin();
        clearAddForm();
        editingSongId = null;
        
        // Restaurar botão original
        const submitBtn = document.querySelector('#addSongForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Adicionar Música';
        submitBtn.onclick = null;
        
        alert('Música editada com sucesso!');
    }
}

// Excluir música
function deleteSong(songId) {
    if (!confirm('Tem certeza que deseja excluir esta música? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const songs = MusicStorage.getSongs();
    const songIndex = songs.findIndex(s => s.id === songId);
    
    if (songIndex !== -1) {
        const songName = songs[songIndex].name;
        songs.splice(songIndex, 1);
        MusicStorage.saveSongs(songs);
        loadSongsForAdmin();
        updateAdminStats();
        
        showAdminNotification(`Música "${songName}" excluída com sucesso!`);
    }
}

// Preparar atualização em massa
function prepareBulkUpdate() {
    const songs = MusicStorage.getSongs();
    const updateDate = document.getElementById('updateDate').value;
    
    // Criar template CSV
    let csvContent = "Nome da Música;Streams Totais Atuais\n";
    
    songs.forEach(song => {
        csvContent += `${song.name};${song.totalStreams}\n`;
    });
    
    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atualizacao_streams_${updateDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showAdminNotification('Template CSV gerado! Preencha os streams totais atuais e faça o upload.');
}

// Atualizar estatísticas do admin
function updateAdminStats() {
    const songs = MusicStorage.getSongs();
    
    // Totais
    const totalSongs = songs.length;
    const totalStreams = songs.reduce((sum, song) => sum + song.totalStreams, 0);
    const dailyStreams = songs.reduce((sum, song) => sum + song.dailyStreams, 0);
    
    // Usuários
    const users = JSON.parse(localStorage.getItem('selenaUsers') || '[]');
    const totalUsers = users.length;
    
    // Atualizar display
    document.getElementById('adminTotalSongs').textContent = totalSongs;
    document.getElementById('adminTotalStreams').textContent = formatNumber(totalStreams);
    document.getElementById('adminDailyStreams').textContent = formatNumber(dailyStreams);
    document.getElementById('adminTotalUsers').textContent = totalUsers;
}

// Carregar configuração da votação
function loadVotingConfig() {
    const votingOptions = JSON.parse(localStorage.getItem('votingOptions') || 'null');
    const songs = MusicStorage.getSongs();
    
    const container = document.getElementById('votingConfigOptions');
    if (!container) return;
    
    // Criar seletores para 4 músicas
    let html = '';
    for (let i = 1; i <= 4; i++) {
        const currentOption = votingOptions ? votingOptions.find(o => o.id === i) : null;
        const currentSongName = currentOption ? currentOption.name : '';
        
        html += `
            <div class="form-group">
                <label for="votingOption${i}">Opção ${i}</label>
                <select id="votingOption${i}" class="voting-song-select">
                    <option value="">Selecione uma música...</option>
                    ${songs.map(song => `
                        <option value="${song.name}" ${song.name === currentSongName ? 'selected' : ''}>
                            ${song.name} (${song.album})
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Salvar configuração da votação
function saveVotingConfig() {
    const options = [];
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`votingOption${i}`);
        const songName = select.value;
        
        if (songName) {
            options.push({
                id: i,
                name: songName,
                votes: 0
            });
        }
    }
    
    if (options.length !== 4) {
        alert('Por favor, selecione exatamente 4 músicas para a votação.');
        return;
    }
    
    localStorage.setItem('votingOptions', JSON.stringify(options));
    showAdminNotification('Configuração da votação salva com sucesso!');
}

// Resetar resultados da votação
function resetVotingResults() {
    if (confirm('Tem certeza que deseja resetar a votação atual? Todos os votos serão perdidos.')) {
        localStorage.removeItem('votingResults');
        localStorage.removeItem('userVotes');
        showAdminNotification('Votação resetada com sucesso!');
    }
}

// Salvar link da playlist
function savePlaylistLink() {
    const playlistLink = document.getElementById('playlistLink').value;
    
    if (playlistLink && playlistLink.includes('spotify.com')) {
        localStorage.setItem('spotifyPlaylist', playlistLink);
        showAdminNotification('Link da playlist atualizado com sucesso!');
    } else {
        alert('Por favor, insira um link válido do Spotify.');
    }
}

// Carregar dados dos usuários
function loadUsersData() {
    const users = JSON.parse(localStorage.getItem('selenaUsers') || '[]');
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">Nenhum usuário registrado</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const missionsCompleted = Object.keys(user.dailyMissions || {}).length;
        
        return `
            <tr>
                <td>${user.email}</td>
                <td>${user.points || 0}</td>
                <td>${new Date(user.joinDate).toLocaleDateString('pt-BR')}</td>
                <td>${missionsCompleted}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteUser('${user.email}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Excluir usuário
function deleteUser(email) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
        let users = JSON.parse(localStorage.getItem('selenaUsers') || '[]');
        users = users.filter(u => u.email !== email);
        localStorage.setItem('selenaUsers', JSON.stringify(users));
        
        // Remover do ranking também
        let ranking = JSON.parse(localStorage.getItem('userRanking') || '[]');
        ranking = ranking.filter(u => u.email !== email);
        localStorage.setItem('userRanking', JSON.stringify(ranking));
        
        loadUsersData();
        showAdminNotification(`Usuário ${email} excluído com sucesso!`);
    }
}

// Salvar dados da meta
function saveGoalData() {
    const current = parseInt(document.getElementById('goalDataCurrent').value.replace(/\./g, '')) || 0;
    const target = parseInt(document.getElementById('goalDataTarget').value.replace(/\./g, '')) || 0;
    
    if (current > 0 && target > 0 && target > current) {
        const goalData = {
            currentGoal: target,
            currentProgress: current
        };
        
        localStorage.setItem('goalData', JSON.stringify(goalData));
        showAdminNotification('Dados da meta atualizados com sucesso!');
    } else {
        alert('Por favor, insira valores válidos (a meta deve ser maior que o progresso atual).');
    }
}

// Exportar dados
function exportData() {
    const data = {
        songs: MusicStorage.getSongs(),
        votingOptions: JSON.parse(localStorage.getItem('votingOptions') || 'null'),
        votingResults: JSON.parse(localStorage.getItem('votingResults') || 'null'),
        goalData: JSON.parse(localStorage.getItem('goalData') || 'null'),
        users: JSON.parse(localStorage.getItem('selenaUsers') || '[]'),
        playlistLink: localStorage.getItem('spotifyPlaylist')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selena_stream_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showAdminNotification('Backup exportado com sucesso!');
}

// Importar dados
function importData() {
    document.getElementById('importFile').click();
}

// Configurar importação
document.getElementById('importFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            if (confirm('Esta ação substituirá todos os dados atuais. Tem certeza?')) {
                // Importar dados
                if (data.songs) {
                    localStorage.setItem('selenaSongs', JSON.stringify(data.songs));
                }
                
                if (data.votingOptions) {
                    localStorage.setItem('votingOptions', JSON.stringify(data.votingOptions));
                }
                
                if (data.votingResults) {
                    localStorage.setItem('votingResults', JSON.stringify(data.votingResults));
                }
                
                if (data.goalData) {
                    localStorage.setItem('goalData', JSON.stringify(data.goalData));
                }
                
                if (data.users) {
                    localStorage.setItem('selenaUsers', JSON.stringify(data.users));
                }
                
                if (data.playlistLink) {
                    localStorage.setItem('spotifyPlaylist', data.playlistLink);
                }
                
                showAdminNotification('Dados importados com sucesso!');
                location.reload();
            }
        } catch (error) {
            alert('Erro ao importar arquivo. Verifique se é um JSON válido.');
        }
    };
    reader.readAsText(file);
});

// Limpar todos os dados
function clearAllData() {
    if (confirm('ATENÇÃO: Esta ação irá limpar TODOS os dados do site. Tem certeza absoluta?')) {
        localStorage.clear();
        showAdminNotification('Todos os dados foram limpos. O site será recarregado.');
        setTimeout(() => location.reload(), 2000);
    }
}

// Resetar contadores diários
function resetDailyCounters() {
    if (confirm('Resetar contadores diários de streams?')) {
        const songs = MusicStorage.getSongs();
        songs.forEach(song => {
            song.dailyStreams = 0;
        });
        MusicStorage.saveSongs(songs);
        loadSongsForAdmin();
        showAdminNotification('Contadores diários resetados!');
    }
}

// Excluir todas as músicas
function deleteAllSongs() {
    if (confirm('Excluir TODAS as músicas? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('selenaSongs');
        localStorage.removeItem('selenaAlbums');
        localStorage.removeItem('selenaArtists');
        loadSongsForAdmin();
        showAdminNotification('Todas as músicas foram excluídas!');
    }
}

// Excluir todos os usuários
function deleteAllUsers() {
    if (confirm('Excluir TODOS os usuários? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('selenaUsers');
        localStorage.removeItem('userRanking');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userVotes');
        loadUsersData();
        showAdminNotification('Todos os usuários foram excluídos!');
    }
}

// Resetar tudo
function resetEverything() {
    if (confirm('RESETAR O SITE COMPLETO? TODOS OS DADOS SERÃO PERDIDOS PERMANENTEMENTE.')) {
        localStorage.clear();
        showAdminNotification('Site resetado completamente. Recarregando...');
        setTimeout(() => location.reload(), 2000);
    }
}

// Mostrar notificação no admin
function showAdminNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'admin-notification fade-in';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Estilo
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = 'var(--success-color)';
    notification.style.color = 'white';
    notification.style.padding = '1rem';
    notification.style.borderRadius = 'var(--border-radius)';
    notification.style.zIndex = '3000';
    notification.style.boxShadow = 'var(--box-shadow)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Formatar número para input
function formatNumberInputValue(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Formatar número para display
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
