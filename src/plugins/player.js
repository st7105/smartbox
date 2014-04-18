/**
 * Player plugin for smartbox
 */

(function (window) {

    var updateInterval, curAudio = 0, curSubtitle=0;


    /**
     * emulates events after `play` method called
     * @private
     * @param self Player
     */
    var stub_play = function (self) {
        self.state = "play";

        updateInterval && clearInterval(updateInterval);
        updateInterval = setInterval(function () {
            self.trigger("update");
            self.videoInfo.currentTime += 0.5;
            if (self.videoInfo.currentTime >= self.videoInfo.duration) {
                self.stop();
                self.trigger("complete");
            }
        }, 500);
    };
    var inited = false;

    var errorTimeout;

    var Player = window.Player = {
        mode3d: {
            OFF: 'off',
            SIDE_BY_SIDE: 'side_by_side',
            ABOVE_BELOW: 'above_below'
        },
        isSeeking: false,
        // default seek time in seconds
        jumpLength: 5,
        config: {
            //time for 'error' event(if nothing happens)
            errorTimeout: 15000,
            // use debounce for seek functions
            useSeekDebounce: true,
            autosize: true,
            size: {
              left: 0,
              top: 0,
              width: 1280,
              height: 720
            }
        },
        /**
         * Inserts player object to DOM and do some init work
         * @examples
         * Player._init(); // run it after SB.ready
         */
        _init: function () {

            //no need to do anything because just stub
        },

        extend: function (obj) {
          return SB.extend(this, obj);
        },
        /**
         * current player state ["play", "stop", "pause"]
         */
        state: 'stop',
        /**
         * Runs some video
         * @param {Object} options {url: "path", type: "hls", from: 0
         * }
         * @examples
         *
         * Player.play({
         * url: "movie.mp4"
         * }); // => runs video
         *
         * Player.play({
         * url: "movie.mp4"
         * from: 20
         * }); // => runs video from 20 second
         *
         * Player.play({
         * url: "stream.m3u8",
         * type: "hls"
         * }); // => runs stream
         */
        play: function (options) {
            var self=this;
            if (!inited) {
                self._init();
                inited = true;
            }

            if (typeof options == "string") {
                options = {
                    url: options
                }
            }
            if (options !== undefined) {
                self.stop();
                self.state = 'play';
                self._play(options);


                /*
                var onready=function(){
                    self.off('ready', onready);
                    self.off('error', onready);
                    clearTimeout(errorTimeout);
                };

                self.on('ready', onready);
                self.on('error', onready);

                errorTimeout=setTimeout(function(){
                    self.trigger('error');
                }, self.config.errorTimeout);*/


            } else if (options === undefined && this.state === 'pause') {
                this.resume();
            }
        },
        _play: function () {
            var self = this;

            setTimeout(function () {
                self.trigger("ready");
                setTimeout(function () {
                    self.trigger("bufferingBegin");
                    setTimeout(function () {
                        self.videoInfo.currentTime = 0;
                        self.trigger("bufferingEnd");
                        stub_play(self);
                    }, 1000);
                }, 1000);
            }, 1000);

        },
        /**
         * Stop video playback
         * @param {Boolean} silent   if flag is set, player will no trigger "stop" event
         * @examples
         *
         * Player.stop(); // stop video
         *
         * App.onDestroy(function(){
         *      Player.stop(true);
         * });  // stop player and avoid possible side effects
         */
        stop: function (silent) {
          var info = this.videoInfo;
            if (this.state != 'stop') {
                this._stop();
                if (!silent) {
                    this.trigger('stop');
                }
                if (info.seekTime) {
                  info.seekTime = null;
                  this.trigger('seekStop')
                }
            }
            this.state = 'stop';
        },
        /**
         * Pause playback
         * @examples
         * Player.pause(); //paused
         */
        pause: function () {
          if (this.state === 'play') {
            this._pause();
            this.state = "pause";
            this.trigger('pause');
          }
        },
        _pause: $.noop,
        /**
         * Resume playback
         * @examples
         * Player.pause(); //resumed
         */
        resume: function () {
          if (this.state === 'pause') {
            this._resume();
            this.state = "play";
            this.trigger('resume');
          }
        },
        _resume: function () {
          stub_play(this);
        },
        /**
         * Toggles pause/resume
         * @examples
         *
         * Player.togglePause(); // paused or resumed
         */
        togglePause: function () {
            if (this.state == "play") {
                this.pause();
            } else {
                this.resume();
            }
        },
        _stop: function () {
            clearInterval(updateInterval);
        },
        /**
         * Converts time in seconds to readable string in format H:MM:SS
         * @param {Number} seconds time to convert
         * @returns {String} result string
         * @examples
         * Player.formatTime(PLayer.videoInfo.duration); // => "1:30:27"
         */
        formatTime: function (time) {
            var hours = Math.floor(time / (60 * 60));
            var divisor_for_minutes = time % (60 * 60);
            var minutes = Math.floor(divisor_for_minutes / 60);
            var divisor_for_seconds = divisor_for_minutes % 60;
            var seconds = Math.ceil(divisor_for_seconds);
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            return (hours ? hours + ':' : '') + minutes + ":" + seconds;
        },

        setSize: function ( opt ) {
          opt = opt || {};
          var size = this.config.size;

          _.extend(size, opt);

          if (inited) {
            this._setSize(size);
          }
        },

        _setSize: $.noop,

        /**
         * Hash contains info about current video
         */
        videoInfo: {
            /**
             * Total video duration in seconds
             */
            duration: 0,
            /**
             * Video stream width in pixels
             */
            width: 0,
            /**
             * Video stream height in pixels
             */
            height: 0,
            /**
             * Current playback time in seconds
             */
            currentTime: 0,
            /**
             * Current seeking time
             */
            seekTime: null
        },

        /**
         *
         * @param {Number} seconds time to seek
         * @examples
         * Player.seek(20); // seek to 20 seconds
         */
        _seek: function (seconds) {
            var self = this;
            self.videoInfo.currentTime = seconds;
            self.pause();
            self.trigger("bufferingBegin");
            setTimeout(function () {
                self.trigger("bufferingEnd");
                self.resume();
            }, 500);
        },

        seek: function ( time, useDebounce ) {
          var info = this.videoInfo,
            jump;
          if ( time <= 0 ) {
            time = 0;
          }
          if ( time >= info.duration ) {
            time = info.duration;
            var state = this.state;
            this.state = 'STOP';
            if ( state != 'STOP' ) {
              this.stop();
              this.trigger('complete');
            }
          } else {
            if ( this.config.useSeekDebounce && useDebounce) {
              this.seekDebounce(time);
            } else {
              this.seekStop(time);
            }
            if (info.seekTime) {
              this.trigger('seekProgress')
            }
          }
        },

        seekStop: function ( time ) {
          var info = this.videoInfo;
          if (this.state !== 'stop') {
            this._seek(time);
            info.currentTime = time;
            if (info.seekTime) {
              info.seekTime = null;
              this.trigger('seekStop');
            }
            this.trigger('update');
          }
        },

        seekDebounce: _.debounce(function (time) {
          this.seekStop(time)
        }, 500),

        forward: function ( time ) {
          time = time || this.jumpLength;
          if (this.state !== 'stop') {
            var seekTime = this.setSeekTime(time);
            this.seek(seekTime, true);
          }
        },
        backward: function (time) {
          time = time || this.jumpLength;
          if (this.state !== 'stop') {
            var seekTime = this.setSeekTime(-time);
            this.seek(seekTime, true);
          }

        },
        setSeekTime: function (time) {
          var info = this.videoInfo;

          // check for null value
          if ( _.isNull(info.seekTime) ) {
            info.seekTime = info.currentTime;
            this.trigger('seekStart');
          }

          info.seekTime += time;

          return info.seekTime;
        },

        /**
         * For multi audio tracks videos
         */
        audio: {
            /**
             * Set audio track index
             * @param index
             */
            set: function (index) {
                curAudio = index;
            },
            /**
             * Returns list of supported language codes
             * @returns {Array}
             */
            get: function () {
                var len = 2;
                var result = [];
                for (var i = 0; i < len; i++) {
                    result.push(0);
                }
                return result;
            },
            /**
             * @returns {Number} index of current playing audio track
             */
            cur: function () {
                return curAudio;
            },
            toggle: function () {
                var l = this.get().length;
                var cur = this.cur();
                if (l > 1) {
                    cur++;
                    if (cur >= l) {
                        cur = 0;
                    }
                    this.set(cur);
                }
            }
        },
        subtitle: {
            _urls: [],
            running: false,
            $subtitles_text: null,

            hasUpdateListener: false,

            _prevTime: -1,
            _prevSubtitle: -1,

            onUpdate: function () {
                if (this.running) {
                    var cTime = Player.videoInfo.currentTime, index, subtitleObject;
                    //если идет последовательное воспроизведение
                    //это самый частый случай
                    if (cTime > this._prevTime) {
                        console.log('normal');
                        index = this.getTextIndex(this._prevSubtitle + 1);
                    } else {//если были перемотки ищем с начала и до конца
                        console.log('rewind');
                        index = this.getTextIndex(0);
                    }

                    subtitleObject = this.data[index];

                    if (subtitleObject) {
                        this.showText(subtitleObject.text);
                        this._prevTime = cTime;
                        this._prevSubtitle = index;
                    }
                }

            },

            showText: function(text){
                var $subtitiles;
                if(!this.$subtitles_text){
                    $('body').append('<div id="subtitles_view" style="position: absolute; z-index: 1;"><div id="subtitles_text"></div></div>');
                    $subtitiles = $('#subtitles_view');
                    $subtitiles.css({
                        width: '1280px',
                        height: '720px',
                        left: '0px',
                        top: '0px'
                    });
                    this.$subtitles_text=$('#subtitles_text').css({
                        'position': 'absolute',
                        'text-align': 'center',
                        'width': '100%',
                        'left': '0',
                        'bottom': '50px',
                        'font-size': '24px',
                        'color': '#fff',
                        'text-shadow': '0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000',
                        'line-height': '26px'
                    });
                }
                this.$subtitles_text.html(text);
            },

            add: function(url, name){
                this._urls.push({
                    url: url,
                    name: name
                });
            },
            /**
             * Set subtitle index
             * @param index
             */
            set: function (index) {
                curSubtitle = index;
                if(index!=-1){
                    this.url(this._urls[index].url);
                }else{
                    this.running=false;
                }
            },
            /**
             * Returns list of available subtitles
             * @returns {Array}
             */
            get: function () {
                return _.pluck(this._urls, 'name');
            },
            /**
             * @returns {Number} index of current subtitles
             */
            cur: function () {
                return curSubtitle;
            },
            toggle: function () {
                var l = Player.subtitle.get().length;
                var cur = Player.subtitle.cur();
                if (l > 1) {
                    cur++;
                    if (cur >= l) {
                        cur = 0;
                    }
                    Player.subtitle.set(cur);
                }
            },
            getTextIndex: function (fromIndex) {
                var cTime = Player.videoInfo.currentTime*1000;
                for (var i = fromIndex, l = this.data.length; i < l; i++) {
                    var obj = this.data[i];
                    if (cTime >= obj.time) {
                        var next=this.data[i+1];
                        if(next&&cTime>=next.time){
                            continue;
                        }
                        return i;
                    }
                }
                return -1;
            },
            data: [
                {
                    time: 0,
                    text: ''
                }
            ],
            /**
             * Load subtitles from remote file
             * @param url
             */
            url: function (url) {
                var extension = /\.([^\.]+)$/.exec(url)[1];
                var self=this;
                $.ajax({
                    url: url,
                    dataType: 'text',
                    success: function (data) {
                        self.running=true;
                        Player.subtitle.parse[extension].call(Player, data);

                        if(!self.hasUpdateListener){
                            self.hasUpdateListener=true;
                            Player.on('update', function(){
                                self.onUpdate();
                            });
                        }

                    }
                });
            },
            parse: {
                smi: function (data) {
                    data = data.split(/\s*<sync/i);
                    data.shift();
                    Player.subtitle.data = _.map(data, function (value) {
                        var match = /[\s\S]*start=(\d+)[\s\S]*<p[^>]*>([\s\S]*)<spanid/i.exec(value);
                        if (match) {
                            return {
                                time: parseInt(match[1], 10),
                                text: match[2]
                            };
                        }
                    });
                },
                srt: function (data) {
                    data = data.split('\r\n\r\n');
                    var self = Player.subtitle;

                    self.data = [];
                    var parseTime = function (time) {
                        var matches = time.match(/(\d{2}):(\d{2}):(\d{2}),(\d+)/);
                        return parseInt(matches[1], 10) * 3600000 +
                            parseInt(matches[2], 10) * 60000 +
                            parseInt(matches[3], 10) * 1000 +
                            parseInt(matches[4], 10);
                    };

                    _.each(data, function (value) {
                        if (!value) {
                            return;
                        }
                        var rows = value.split('\n');

                        var timeRow = rows[1].split(' --> '),
                            timeStart, timeEnd, text;
                        rows.splice(0, 2);
                        timeStart = parseTime(timeRow[0]);
                        timeEnd = parseTime(timeRow[1]);

                        self.data.push({
                            time: timeStart,
                            text: rows.join('<br/>')
                        });
                        self.data.push({
                            time: timeEnd,
                            text: ''
                        });
                    });
                    self.data.unshift({
                        time: 0,
                        text: ''
                    });
                }
            }
        }
    };

    //SBEvents.call(Player);
    SB.extend(Player, SBEvents.prototype);

}(this));
