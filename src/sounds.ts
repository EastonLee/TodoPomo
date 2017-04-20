let player = require('play-sound')();

export class Sound {
    public static play(soundFile: string): void {
        player.play(soundFile, function (err) {
            if (err) throw err
        });
    }
}