// JavaScript pour gérer le changement de fond (changement de chaîne)

let channels = [
    "videoVide",
    "/assets/videos/channel-01.mp4",
    "/assets/videos/channel-02.mp4",
    "/assets/videos/channel-03.mp4",
    "/assets/videos/channel-04.mp4",
    "/assets/videos/channel-05.mp4",
    "/assets/videos/channel-06.mp4",
    "/assets/videos/channel-07.mp4",
    "/assets/videos/channel-08.mp4"
];

// Déclaration et initialisation de la variable currentChannel
let currentChannel = 0;
const video = document.getElementById('videoBackground');
video.volume = 0.01;

// Exemple de fonction currentVideo() (à adapter selon votre logique)
function currentVideo(index) {
    return channels[index];
};

// Fonction pour changer la source de la vidéo
function changeVideoSource(newSource) {
    video.src = newSource;
    video.load(); // Recharge la vidéo avec la nouvelle source
};

// Fonction pour changer de canal
function changeChannelUp() {
    // channel text modification
    console.log('Next button clicked');
    currentChannel = (currentChannel + 1) % (channels.length);
    document.querySelector('.channel span').textContent = ("0" + (currentChannel)).slice(-2);
    // update fond d'écran
    changeVideoSource(currentVideo(currentChannel));
};

// Fonction pour changer de canal
function changeChannelDown() {
    // channel text modification
    console.log('Previous button clicked');
    currentChannel = (currentChannel - 1) % (channels.length);
    if (currentChannel <= -1){
        currentChannel = 8;
    }
    document.querySelector('.channel span').textContent = ("0" + (currentChannel)).slice(-2);
    // update fond d'écran
    changeVideoSource(currentVideo(currentChannel));
};



