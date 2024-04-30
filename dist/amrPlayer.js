const AMRSourceState = {
    INIT: 1,
    LOADED: 2,
    PLAYING: 3,
    ENDED: 4,
    STOPPED: 5,
    DESTORIED: 6
}
class AMRSource {
    constructor(options = {}) {
        this._url = null;
        this._samples = options.samples || null;
        this._sampleRate = options.sampleRate || 8000;
        this._onPlay = null;
        this._onStop = null;
        this._onEnded = null;
        this._useWorker = false;
        this._state = AMRSourceState.INIT;
    }

    set(options) {
        this._sampleRate = options.sampleRate || 8000;
        return this;
    }

    onPlay(fn) {
        if (fn instanceof Function) {
            this._onPlay = fn;
        }
        return this;
    }

    onEnded(fn) {
        if (fn instanceof Function) {
            this._onEnded = fn;
        }
        return this;
    }

    onStop(fn) {
        if (fn instanceof Function) {
            this._onStop = fn;
        }
        return this;
    }

    _load(arrayBuffer, useWorker) {
        return new Promise((resolve, reject) => {
            if (useWorker) {
                if (this._worker) {
                    this._worker.terminate();
                }
                this._worker = wx.createWorker('workers/amr.min.js');
                this._worker.postMessage({
                    arrayBuffer
                });
                this._worker.onMessage((data) => {
                    const { samples, err } = data;
                    //小程序Worker最大并发数量限制为1个，用Worker.terminate()结束当前Worker
                    this._worker.terminate();
                    if (!err) {
                        this._samples = samples;
                        this._state = AMRSourceState.LOADED;
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            } else {
                const { AMR } = require('./amr.min.js');
                this._samples = AMR.decode(new Uint8Array(arrayBuffer));
                resolve();
            }
        });
    }

    stop() {
        if (this._onStop instanceof Function && this._state !== AMRSourceState.STOPPED) {
            this._onStop();
        }
        this._state = AMRSourceState.STOPPED;
        return this;
    }

    end() {
        if (this._onEnded instanceof Function && this._state !== AMRSourceState.ENDED) {
            this._onEnded();
        }
        this._state = AMRSourceState.ENDED;
        return this;
    }

    play() {
        if (this._onPlay instanceof Function && this._state !== AMRSourceState.PLAYING) {
            this._onPlay();
        }
        this._state = AMRSourceState.PLAYING;
        return this;
    }

    getUrl() {
        return this._url;
    }

    getSamples() {
        return this._samples;
    }

    getSampeRate() {
        return this._sampleRate;
    }

    destroy() {
        if (this._state !== AMRSourceState.DESTORIED) {
            this._samples = null;
            this._onEnded = null;
            this._onPlay = null;
            this._onStop = null;
        }
        this._state = AMRSourceState.DESTORIED;
    }
}

class AMRPlayer {
    constructor(options = {}) {
        this._ctx = wx.createWebAudioContext();
        this._emptySrc = new AMRSource({ samples: new Float32Array(10), sampleRate: 24000});
        this._srcMap = new Map();
        this._sampleRate = options.sampleRate || 8000;
    }

    useWorker() {
        this._useWorker = true;
        return this;
    }

    loadWithUrl(url) {
        this.stop();
        return new Promise((resolve, reject) => {
            this._playEmpty();
            if (this._srcMap.has(url) && this._srcMap.get(url)._state !== AMRSourceState.DESTORIED) {
                // 同资源无需重新下载
                const src = this._srcMap.get(url);
                if (!src.getSamples() || src.getSamples().length <= 0) {
                    reject({
                        err: 'no data'
                    });
                }
                resolve(src);
            } else {
                const src = new AMRSource({ sampleRate: this._sampleRate });
                this._srcMap.set(url, src);
                wx.request({
                    url,
                    responseType: 'arraybuffer',
                    success: (res) => {
                        //不支持并发调用
                        if (res && res.data) {
                            src._load(res.data, this._useWorker).then(() => {
                                resolve(src);
                            }, (err) => {
                                reject(err);
                            });
                        }
                    },
                    fail: (err) => {
                        reject(err);
                    },
                });
            }
        });
    }

    loadWithArrayBuffer(arrayBuffer) {
        this.stop();
        this._playEmpty();
        return new Promise((resolve, reject) => {
            const src = new AMRSource({ sampleRate: this._sampleRate });
            this._srcMap.set(url, src)
            src._load(arrayBuffer, this._useWorker).then(() => {
                resolve(src);
            }, (err) => {
                reject(err);
            })
        });
    }

    play(src) {
        if (!src || !(src instanceof AMRSource)) {
            console.err('invalid amr src');
        }
        console.log('play web audio context');
        return this._playWithAudioContext(src);
    }

    _playEmpty() {
        console.log('play empty');
        return this._playWithAudioContext(this._emptySrc);
    }

    _playWithAudioContext(amrSrc) {
        this._currSrc = amrSrc;
        const samples = new Float32Array(amrSrc.getSamples());
        console.log('play with audio context', samples.length);
        const buffer = this._ctx.createBuffer(1, samples.length, amrSrc.getSampeRate());
        buffer.copyToChannel(samples, 0, 0)
        this._source = this._ctx.createBufferSource();
        this._source.buffer = buffer;
        this._source.connect(this._ctx.destination)
        this._source.onended = () => {
            amrSrc.stop();
        }
        this._source.start();
        amrSrc.play();
        return this;
    }

    stop() {
        if (this._source) {
            this._source.stop();
            this._source.disconnect();
            this._source = null;
        }
        this._currSrc && this._currSrc.stop();
        this._worker && this._worker.terminate();
        return this;
    }

    destroy() {
        this.stop();
        this._srcMap.forEach((src) => {
            src.destroy();
        });
        this._emptySrc.destroy();
        this._emptySrc = null;
        this._currSrc = null;
        this._worker && this._worker.terminate();
        this._worker = null;
        return this;
    }
}

module.exports = {
    AMRPlayer: new AMRPlayer()
}