var axios = require('axios');
var path = require('path');
var fs = require('fs');
const { spawn } = require('child_process');

const api_domain = 'http://localhost:5005/';
const refresh_rate = 1000;
const album_art = path.resolve(__dirname, 'album_art', 'album_art.jpg');
// const exec_display = spawn('fbi', ['-T 1', '-a', album_art]);
var exec_display = spawn('open', [album_art]);

const sonos = axios.create({
  baseURL: api_domain,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function download_image (url) {
  const writer = fs.createWriteStream(album_art);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
async function display_album_art() {
  await exec_display.kill();
  exec_display = spawn('open', [ album_art]);

}
async function main() {
  let previous_song = '';
  while(true){
    await sleep(refresh_rate);
    let response = await sonos.get('/state');
    let current_track = response.data.currentTrack;
    let current_song =  current_track.title + current_track.artist;
    if (previous_song !== current_song) {
      console.log(current_song);
      await download_image(current_track.absoluteAlbumArtUri);
      display_album_art();
      previous_song = current_song;
      console.log(previous_song);
    }
  }
}

main();
