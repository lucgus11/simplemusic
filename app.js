// --- Enregistrement du Service Worker (Pour la PWA) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log("Service Worker enregistré avec succès."));
}

// --- Métronome (Web Audio API) ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let bpm = 120;
let timerID;

const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-display');
const playBtn = document.getElementById('play-btn');

bpmSlider.addEventListener('input', (e) => {
    bpm = e.target.value;
    bpmDisplay.textContent = `${bpm} BPM`;
});

function playClick() {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    
    osc.frequency.value = 1000;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    osc.connect(envelope);
    envelope.connect(audioContext.destination);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
}

playBtn.addEventListener('click', () => {
    if (!isPlaying) {
        if (audioContext.state === 'suspended') audioContext.resume();
        const interval = 60000 / bpm;
        timerID = setInterval(playClick, interval);
        playBtn.textContent = "Stop";
    } else {
        clearInterval(timerID);
        playBtn.textContent = "Play";
    }
    isPlaying = !isPlaying;
});

// --- API Publique (MusicBrainz) ---
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const resultsList = document.getElementById('results-list');

searchBtn.addEventListener('click', async () => {
    const query = searchInput.value;
    if (!query) return;

    resultsList.innerHTML = "<li>Recherche en cours...</li>";
    
    try {
        // API publique MusicBrainz (gratuit, pas de clé requise)
        const response = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`);
        const data = await response.json();
        
        resultsList.innerHTML = "";
        const artists = data.artists.slice(0, 5); // Garde les 5 premiers
        
        artists.forEach(artist => {
            const li = document.createElement('li');
            li.textContent = `${artist.name} (${artist.country || 'Inconnu'}) - ${artist.disambiguation || ''}`;
            resultsList.appendChild(li);
        });
    } catch (error) {
        resultsList.innerHTML = "<li>Erreur lors de la recherche.</li>";
    }
});
