// --- 1. PWA Service Worker ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

// --- 2. Web Audio API (Métronome multi-temps) ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let bpm = 120;
let timerID;
let currentBeat = 0;
let beatsPerMeasure = 4;

const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-display');
const playBtn = document.getElementById('play-btn');
const measureSelect = document.getElementById('measure-select');

bpmSlider.addEventListener('input', (e) => {
    bpm = e.target.value;
    bpmDisplay.textContent = `${bpm} BPM`;
});

measureSelect.addEventListener('change', (e) => {
    beatsPerMeasure = parseInt(e.target.value);
    currentBeat = 0; // Réinitialise sur le temps 1 quand on change de mesure
});

function playClick() {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    
    // Si c'est le premier temps (0), on fait un son plus aigu (accent)
    const isAccent = (currentBeat === 0);
    osc.frequency.value = isAccent ? 1500 : 1000;
    
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    osc.connect(envelope);
    envelope.connect(audioContext.destination);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);

    // On passe au temps suivant
    currentBeat = (currentBeat + 1) % beatsPerMeasure;
}

function toggleMetronome() {
    if (!isPlaying) {
        if (audioContext.state === 'suspended') audioContext.resume();
        currentBeat = 0; // Repart toujours sur le temps 1
        const interval = 60000 / bpm;
        timerID = setInterval(playClick, interval);
        playBtn.textContent = "Stop";
    } else {
        clearInterval(timerID);
        playBtn.textContent = "Play";
    }
    isPlaying = !isPlaying;
}

playBtn.addEventListener('click', toggleMetronome);

// --- 3. Media Session API (Contrôle sur l'écran de verrouillage) ---
if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Métronome en cours',
        artist: 'SimpleMusic',
        album: 'Outils Pratiques'
    });

    navigator.mediaSession.setActionHandler('play', toggleMetronome);
    navigator.mediaSession.setActionHandler('pause', toggleMetronome);
}

// --- 4. Web MIDI API (Lecture des notes) ---
const midiStatus = document.getElementById('midi-status');
const midiLog = document.getElementById('midi-log');

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
    midiStatus.textContent = "Web MIDI non supporté sur ce navigateur.";
}

function onMIDISuccess(midiAccess) {
    midiStatus.textContent = "API MIDI prête. Jouez une note !";
    const inputs = midiAccess.inputs.values();
    for (let input of inputs) {
        input.onmidimessage = getMIDIMessage;
    }
    
    // Détecter si on branche/débranche un appareil
    midiAccess.onstatechange = (e) => {
        midiStatus.textContent = `Appareil ${e.port.state} : ${e.port.name}`;
    };
}

function onMIDIFailure() {
    midiStatus.textContent = "Impossible d'accéder aux appareils MIDI.";
}

function getMIDIMessage(message) {
    const command = message.data[0];
    const note = message.data[1];
    const velocity = message.data[2];

    // Commande 144 = Note On (Touche enfoncée)
    if (command === 144 && velocity > 0) {
        // Table simplifiée pour afficher quelques notes (Do central = 60)
        midiLog.textContent = `Note MIDI : ${note} (Vel: ${velocity})`;
    }
}

// --- 5. Web Share API (Partage natif) ---
const shareBtn = document.getElementById('share-btn');
shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'SimpleMusic',
                text: 'Découvre cette web app géniale pour les musiciens !',
                url: window.location.href
            });
        } catch (err) {
            console.log("Partage annulé ou échoué.", err);
        }
    } else {
        alert("Le partage natif n'est pas supporté sur cet appareil.");
    }
});
