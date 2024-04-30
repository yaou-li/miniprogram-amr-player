/**
 * @fileOverview AMRPlayer描述文件
 * @author crazyaou(https://github.com/yaou-li)
 * @date 2024-04-24
 *
 */

type AMRPlayerOptions = {
   sampleRate: Number;
}

export default class AMRPlayer {
    constructor();

    private _samples: ArrayBuffer;
    private _sampleRate: Number;
    private _currUrl: String;
    private _worker: Object;
    private _source: BufferSource;
    private _useWorker: Boolean;
    private _playEmpty: (() => void);
    private _playWithAudioContext: (() => void);
    private _onPlay: (() => void);
    private _onEnded: (() => void);

    /**
     * 是否已经初始化
     */
    public set(options: AMRPlayerOptions): AMRPlayer;

    /**
     * 直接加载音频数据
     * @param array
     */
    public loadWithBuffer(array: ArrayBuffer): Promise<void>;

    /**
     * 使用url加载amr格式的音频数据
     * @param blob
     */
    public loadWithUrl(url: String): Promise<void>;

    /**
     * 播放
     */
    public play(): AMRPlayer;

    /**
     * 停止
     */
    public stop(): AMRPlayer;

    /**
     * 注销，清理内部存储
     */
    public destroy(): AMRPlayer;

    /**
     * 监听播放事件
     * @param fn
     */
    public onPlay(fn: Function): AMRPlayer;

    /**
     * 监听播放完成事件
     * @param fn
     */
    public onEnded(fn: Function): AMRPlayer;

    /**
     * 使用wx.Worker多线程解码
     * @param fn
     */
    public useWorker(): AMRPlayer;
}