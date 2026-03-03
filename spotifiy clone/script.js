console.log("Welcome to Spotify ");
//Initialize the variables
let songIndex = 0;
let audioElement = new Audio('songs/1.mp3');
let masterPlay = document.getElementById('masterPlay');
let myProgressBar = document.getElementById('myProgressBar');
let currentTime = document.getElementById('currentTime');

let masterSongName = document.getElementById('masterSongName');
let gif = document.getElementById('gif');
let songItems = Array.from(document.getElementsByClassName('songItem'));
let volumeBar = document.getElementById("volumeBar");

let songs = [
    {songName: "sitar",filePath: "songs/1.mp3",coverPath: "cover/1.jpg"},
    {songName: "flute",filePath: "songs/2.mp3",coverPath: "cover/2.jpg"},
    {songName: "burning ghat",filePath: "songs/3.mp3",coverPath: "cover/3.jpg"},
    {songName: "veer skanda",filePath: "songs/4.mp3",coverPath: "cover/4.jpg"},
    {songName: "ahista ahista",filePath: "songs/5.mp3",coverPath: "cover/5.jpg"},
    {songName: "ram shista bhi hai",filePath: "songs/6.mp3",coverPath: "cover/6.jpg"},
    {songName: "o mera raghuar",filePath: "songs/7.mp3",coverPath: "cover/7.jpg"},
    {songName: "pathvar pa ho raghuar",filePath: "songs/8.mp3",coverPath: "cover/8.jpg"},
    {songName: "kasam kha ka kho",filePath: "songs/9.mp3",coverPath: "cover/9.jpg"},
    {songName: "kumar vishwas song",filePath: "songs/10.mp3",coverPath: "cover/10.jpg"},
    
   
]
songItems.forEach((element,i)=>{
    
    element.getElementsByTagName("img")[0].src = songs[i].coverPath;
    element.getElementsByClassName("songName")[0].innerText = songs[i].songName;
    
})

// audioElement.play();

//Handle play/pause click
masterPlay.addEventListener('click',()=>{
    masterSongName.innerText = songs[songIndex].songName;
    if(audioElement.paused || audioElement.currentTime<=0){
        audioElement.play();
        masterPlay.classList.remove('fa-play-circle');
        masterPlay.classList.add('fa-pause-circle');
        gif.style.opacity = 1;
    }
    else{
        audioElement.pause();
        masterPlay.classList.remove('fa-pause-circle');
        masterPlay.classList.add('fa-play-circle');
        gif.style.opacity = 0;
    }
})

//listen to event 
audioElement.addEventListener('timeupdate',()=>{
    
    //Update seekbar
    if(audioElement.duration){
   let progress = parseInt(audioElement.currentTime / audioElement.duration * 100);
   
    myProgressBar.value = progress;
    // time display
    let currentminutes = Math.floor(audioElement.currentTime/60);
    let currentseconds = Math.floor(audioElement.currentTime%60);

    if(currentseconds < 10){
        currentseconds = "0" + currentseconds;
    }
   
  
//total duration
let durationMinutes = Math.floor(audioElement.duration/60);
    let durationSeconds = Math.floor(audioElement.duration%60);

    if(durationSeconds < 10){
        durationSeconds = "0" + durationSeconds;
    }

    currentTime.innerText = currentminutes + ":" + currentseconds + "/" + durationMinutes + ":" + durationSeconds;
    }


})

myProgressBar.addEventListener('change',()=>{
    audioElement.currentTime = myProgressBar.value * audioElement.duration/100;
})

const makeAllPlays = ()=>{
    Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
        element.classList.remove('fa-pause-circle');
        element.classList.add('fa-play-circle');
    })
}
const removeActive = ()=>{
    songItems.forEach((element)=>{
        element.classList.remove("activeSong");
    })
}
Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
    element.addEventListener('click',(e)=>{
        console.log(e.target);
        makeAllPlays();
        songIndex = parseInt(e.target.id) - 1;
        removeActive();
        songItems[songIndex].classList.add("activeSong");
        e.target.classList.remove('fa-play-circle');
        e.target.classList.add('fa-pause-circle');
        audioElement.src = `songs/${songIndex+1}.mp3`;
        masterSongName.innerText = songs[songIndex].songName;
        audioElement.currentTime = 0;
        audioElement.play();
        gif.style.opacity = 1;
        masterPlay.classList.remove('fa-play-circle');
        masterPlay.classList.add('fa-pause-circle');
    })
})
document.getElementById('next').addEventListener('click',()=>{
    if(songIndex>=9){
        songIndex = 0;
    }
    else{
        songIndex += 1;
    }
    removeActive();
    songItems[songIndex].classList.add("activeSong");
    audioElement.src = `songs/${songIndex+1}.mp3`;
    masterSongName.innerText = songs[songIndex].songName;
        audioElement.currentTime = 0;
        audioElement.play();
        gif.style.opacity = 1;
        masterPlay.classList.remove('fa-play-circle');
        masterPlay.classList.add('fa-pause-circle');
})
document.getElementById('previous').addEventListener('click',()=>{
    if(songIndex<=0){
        songIndex = 9;
    }
    else{
        songIndex -= 1;
    }
    audioElement.src = `songs/${songIndex+1}.mp3`;
        masterSongName.innerText = songs[songIndex].songName;
        audioElement.currentTime = 0;
        audioElement.play();
        gif.style.opacity = 1;
        masterPlay.classList.remove('fa-play-circle');
        masterPlay.classList.add('fa-pause-circle');
})
document.getElementById("shuffle").addEventListener("click", ()=>{
    songIndex = Math.floor(Math.random()*songs.length);

    removeActive();
    songItems[songIndex].classList.add("activeSong");

    audioElement.src = songs[songIndex].filePath;
    masterSongName.innerText = songs[songIndex].songName;
    audioElement.currentTime = 0;
    audioElement.play();
    masterPlay.classList.remove('fa-play-circle');
    masterPlay.classList.add('fa-pause-circle');
    gif.style.opacity = 1;
})

audioElement.addEventListener('ended', ()=>{
    if(songIndex >= 9){
        songIndex = 0;
    }else{
        songIndex += 1;
    }

    audioElement.src = `songs/${songIndex+1}.mp3`;
    masterSongName.innerText = songs[songIndex].songName;
    audioElement.currentTime = 0;
    audioElement.play();
})

volumeBar.addEventListener("input", ()=>{
audioElement.volume = volumeBar.value;
});


