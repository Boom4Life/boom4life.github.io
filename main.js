
document.addEventListener('DOMContentLoaded', () => {
  const audioPlayer = document.getElementById('audio');
  const playlist = document.getElementById('playlist');
  const repeatButton = document.getElementById('repeat-button');
  
  let isRepeat = false;
  let songs = [];

  async function scanForAudioFiles() {
    try {

      const response = await fetch('/list-files', {

        cache: 'no-store'
      });
      
      if (response.ok) {
        const files = await response.json();
        songs = files
          .filter(file => file.toLowerCase().endsWith('.mp3'))
          .map(file => ({
            name: file.replace('.mp3', '').replace(/^[0-9]+\./, ''),
            file: file
          }));
      } else {
        console.error('Server returned error:', response.status, await response.text());
        songs = [
          { name: 'Lucky You (Feat. Joyner Lucas)', file: 'Lucky You (Feat. Joyner Lucas) [Official Audio] 4.mp3' }
        ];
      }
      return songs;
    } catch (error) {
      console.error('Error scanning for audio files:', error);
      
      const playlistElement = document.getElementById('playlist');
      if (playlistElement) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.color = 'red';
        errorMessage.textContent = 'Connection error: Unable to reach server. Please check if the server is running.';
        playlistElement.appendChild(errorMessage);
      }
      
      // Fallback to known files
      songs = [
        { name: 'Lucky You (Feat. Joyner Lucas)', file: 'Lucky You (Feat. Joyner Lucas) [Official Audio] 4.mp3' }
      ];
      return songs;
    }
  }

  // Function to render the playlist
  function renderPlaylist() {
    playlist.innerHTML = '';
    songs.forEach(song => {
      const songElement = document.createElement('div');
      songElement.className = 'song-item';
      
      const songName = document.createElement('span');
      songName.className = 'song-name';
      songName.textContent = song.name;
      songName.onclick = () => {
        audioPlayer.src = song.file;
        audioPlayer.play();
      };
      
      songElement.appendChild(songName);
      playlist.appendChild(songElement);
    });


    if (songs.length > 0) {
      audioPlayer.src = songs[0].file;
    }
  }

  repeatButton.addEventListener('click', () => {
    isRepeat = !isRepeat;
    audioPlayer.loop = isRepeat;
    repeatButton.textContent = `Repeat: ${isRepeat ? 'On' : 'Off'}`;
  });

  scanForAudioFiles().then(songList => {
    songs = songList;
    renderPlaylist();
  });
});
