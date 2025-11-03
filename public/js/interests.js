import { typeText, TYPING_SPEED_MS } from './utils.js';
const interestsList = [
    { text: "mechanical keyboards", imageUrl: null, linkUrl: null },
    { text: "soulcycle", imageUrl: null, linkUrl: null },
    { text: "raves", imageUrl: null, linkUrl: null },
    { text: "interior design", imageUrl: null, linkUrl: null },
    { text: "vrchat", imageUrl: null, linkUrl: null },
    { text: "kazuo ishiguro", imageUrl: null, linkUrl: null },
    { text: "my therapist", imageUrl: null, linkUrl: null },
    { text: "my job", imageUrl: null, linkUrl: null },
    { text: "tattoos", imageUrl: null, linkUrl: null },
    { text: "vanilla scents", imageUrl: null, linkUrl: null },
    { text: "big plush bag charms", imageUrl: null, linkUrl: null },
    { text: "stickers!!", imageUrl: null, linkUrl: null },
    { text: "ascii art ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧", imageUrl: null, linkUrl: null },
    { text: "baconeggandcheese", imageUrl: null, linkUrl: null },
    { text: null, imageUrl: "img/konata.jpg", linkUrl: null },
    { text: null, imageUrl: "img/hutao.jpg", linkUrl: null },
    { text: null, imageUrl: "img/greenyuri.png", linkUrl: null },
    { text: null, imageUrl: "img/yotsuba.png", linkUrl: null },
    { text: null, imageUrl: "img/sunset.jpg", linkUrl: null },
    { text: null, imageUrl: "img/da.jpg", linkUrl: null },
    { text: null, imageUrl: "img/zizek.jpg", linkUrl: null },
    { text: null, imageUrl: "img/cat.jpeg", linkUrl: null },
    { text: null, imageUrl: "img/zzz.png", linkUrl: null },
    { text: null, imageUrl: "img/balatro.png", linkUrl: null },
    { text: null, imageUrl: "img/nyanners.jpg", linkUrl: null },
    { text: null, imageUrl: "img/iono.png", linkUrl: null },
    { text: null, imageUrl: "img/lttt.jpg", linkUrl: null },
    { text: null, imageUrl: "img/fresca.jpg", linkUrl: null },
    { text: null, imageUrl: "img/agnes.png", linkUrl: null },
    { text: null, imageUrl: "img/tostones.jpg", linkUrl: null },
    { text: null, imageUrl: "img/canes.jpg", linkUrl: null },
    { text: null, imageUrl: "img/hasan.jpg", linkUrl: null },
    { text: null, imageUrl: "img/sesame-chicken.jpg", linkUrl: null },
    { text: null, imageUrl: "img/salomon.jpg", linkUrl: null },
    { text: null, imageUrl: "img/fam.jpg", linkUrl: null },
    { text: null, imageUrl: "img/crocs.jpg", linkUrl: null },
    { text: null, imageUrl: "img/marigolds.jpg", linkUrl: null },
    { text: null, imageUrl: "img/milotic.png", linkUrl: null },
    { text: null, imageUrl: "img/mustard.jpg", linkUrl: null },
    { text: null, imageUrl: "img/aaa.jpg", linkUrl: null },
    { text: null, imageUrl: "img/nightgowns.jpg", linkUrl: null },
    { text: null, imageUrl: "img/nathan.jpg", linkUrl: null },
    { text: null, imageUrl: "img/nyanners-speen-small.gif", linkUrl: null },
    { text: null, imageUrl: "img/haha.webp", linkUrl: null },
    { text: null, imageUrl: "img/miku-orb.jpg", linkUrl: null },
    { text: null, imageUrl: "img/puppy.png", linkUrl: null },
    { text: null, imageUrl: "img/frog.png", linkUrl: null },
    { text: null, imageUrl: "img/azurite.jpg", linkUrl: null },
    { text: null, imageUrl: "img/piper.jpg", linkUrl: "https://www.instagram.com/p/DBbA7xGRjoe/" },
    { text: null, imageUrl: "img/nails.jpg", linkUrl: "https://www.instagram.com/p/DCXLRG4zxmh" },
    { text: "anime", imageUrl: null, linkUrl: "https://anilist.co/user/spooji/" },
    { text: "house", imageUrl: null, linkUrl: "https://youtu.be/Kwjp5PUdVIo" },
    { text: "drum and bass", imageUrl: null, linkUrl: "https://youtu.be/rs5yx4Fh5Ko" },
    { text: "french house", imageUrl: null, linkUrl: "https://youtu.be/mMfxI3r_LyA" },
    { text: "hip hop", imageUrl: null, linkUrl: "https://youtu.be/fXJc2NYwHjw" },
    { text: "megabonk", imageUrl: null, linkUrl: "https://steamcommunity.com/app/3405340" },
];

const EASTER_EGG_INTEREST = { 
    text: "you :)", 
    imageUrl: null, 
    linkUrl: null
};

let seenInterestIndices = [];
let lastInterestIndex = -1;

function getRandomInterest() {
    const listLength = interestsList.length;
    if (seenInterestIndices.length === listLength) {
        return EASTER_EGG_INTEREST;
    }

    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * listLength);
    } while (newIndex === lastInterestIndex || seenInterestIndices.includes(newIndex)); 

    seenInterestIndices.push(newIndex);
    lastInterestIndex = newIndex;

    return interestsList[newIndex];
}

function displayRandomInterest() {
    const interestElement = document.getElementById('interest-display');
    const newInterest = getRandomInterest();
    
    if (interestElement) {
        interestElement.innerHTML = ''; 
        let textContainer;
        const textToAnimate = newInterest.text || ''; 

        if (newInterest.linkUrl) {
            const link = document.createElement('a');
            link.href = newInterest.linkUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.classList.add('interest-link');
            textContainer = link; 
        } else {
            textContainer = document.createElement('span');
        }
        
        textContainer.textContent = ''; 
        
        if (newInterest.imageUrl) {
            const img = document.createElement('img');
            img.src = newInterest.imageUrl;
            img.alt = newInterest.text || "Interest icon";
            img.classList.add('interest-icon');
            
            interestElement.appendChild(img);
            interestElement.appendChild(document.createTextNode(' '));
        }
        
        interestElement.appendChild(textContainer);

        if (textToAnimate.length > 0) {
            typeText(textContainer, textToAnimate);
        }

        const getAnotherLink = document.querySelector('.get-another-link');
        if (getAnotherLink) {
            if (newInterest === EASTER_EGG_INTEREST) {
                getAnotherLink.style.display = 'none';
            } else {
                getAnotherLink.style.display = 'block';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayRandomInterest();
    
    const getAnotherLink = document.querySelector('.get-another-link');
    if (getAnotherLink) {
        getAnotherLink.addEventListener('click', (e) => {
            e.preventDefault();
            displayRandomInterest();
        });
    }
});