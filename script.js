/////////////////////////////////////////////////////////////////////////////////////
// JavaScript pour gérer le changement de fond (changement de chaîne)

let channels = [
    "#",
    "/assets/videos/channel-01.mp4",
    "/assets/videos/channel-02.mp4",
    "/assets/videos/channel-03.mp4",
    "/assets/videos/channel-04.mp4",
    "/assets/videos/channel-05.mp4",
    "/assets/videos/channel-06.mp4",
    "/assets/videos/channel-07.mp4",
    "/assets/videos/channel-08.mp4"
];

let currentChannel = JSON.parse(localStorage.getItem("currentChannel"));
// Déclaration et initialisation de la variable currentChannel
if (currentChannel === null || currentChannel === undefined) {
    currentChannel = 0;
}

const video = document.getElementById('videoBackground');
const videoContainer = document.getElementById('videoContainer');
video.volume = 0.05;

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
    localStorage.setItem("currentChannel", JSON.stringify(currentChannel));
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
    localStorage.setItem("currentChannel", JSON.stringify(currentChannel));
};

/////////////////////////////////////////////////////////////////////////////////////
// JavaScript pour gérer la langue (English ou Francais)

function toggleLangage(savedLanguageIsEnglish) {
    const textController = document.querySelector('.lang-controller'); // Sélectionne l'élément contenant la classe '.lang-controller'
    const textButton = textController.querySelector('.current-lang span'); // Sélectionne le <span> à l'intérieur de '.current-lang'
    const englishTexts = document.querySelectorAll('[class*="en-"]');
    const frenchTexts = document.querySelectorAll('[class*="fr-"]');
    if (savedLanguageIsEnglish === null || savedLanguageIsEnglish === undefined) {
        savedLanguageIsEnglish = true;
    }
    else if (savedLanguageIsEnglish) {
        // Passer en anglais
        englishTexts.forEach(text => text.style.display = "block");
        frenchTexts.forEach(text => text.style.display = "none");
        textButton.textContent = "French Version";
    } else {
        // Passer en français
        englishTexts.forEach(text => text.style.display = "none");
        frenchTexts.forEach(text => text.style.display = "block");
        textButton.textContent = "English Version";
    }
}

function switchLangage(){
    // Pour récupérer la valeur depuis localStorage
    let savedLanguageIsEnglish = JSON.parse(localStorage.getItem("savedLanguageIsEnglish"));

    // Si savedLanguageIsEnglish est null ou undefined, initialisez-le avec une valeur par défaut
    if (savedLanguageIsEnglish === null || savedLanguageIsEnglish === undefined) {
        savedLanguageIsEnglish = true;
    }
    savedLanguageIsEnglish = !savedLanguageIsEnglish;
   // Pour sauvegarder une valeur dans localStorage
    localStorage.setItem("savedLanguageIsEnglish", JSON.stringify(savedLanguageIsEnglish));
    toggleLangage(savedLanguageIsEnglish);

}

// display : none; cache l'élément alors que
// display : block; l'affiche

function initLangage(){
    const buttonLang = document.querySelector('.change-lang-button');
    buttonLang.click();
    buttonLang.click();
    // continuité de la vidéo
    changeVideoSource(currentVideo(currentChannel));
    // du bouton channel : 
    document.querySelector('.channel span').textContent = ("0" + (currentChannel)).slice(-2);
}



