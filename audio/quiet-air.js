// Opt-in, synthetic wind-like ambience; not a field recording of Zhenru.
// Nothing is played before a visitor clicks the sound control.
export function createQuietAir() {
  let context=null,source=null,gain=null;
  async function start() {
    if (context) return true;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return false;
    try {
      context=new Audio();
      const seconds=3,rate=context.sampleRate,length=rate*seconds;
      const buffer=context.createBuffer(1,length,rate);
      const data=buffer.getChannelData(0);
      let seed=918273;
      for(let i=0;i<length;i++) {
        seed=(seed*1664525+1013904223)>>>0;
        data[i]=((seed/4294967296)*2-1)*0.48;
      }
      source=context.createBufferSource();source.buffer=buffer;source.loop=true;
      const lowpass=context.createBiquadFilter();lowpass.type="lowpass";lowpass.frequency.value=680;
      const highpass=context.createBiquadFilter();highpass.type="highpass";highpass.frequency.value=110;
      gain=context.createGain();gain.gain.value=0.0001;
      source.connect(lowpass).connect(highpass).connect(gain).connect(context.destination);
      source.start();
      await context.resume();
      gain.gain.setTargetAtTime(.032,context.currentTime,.34);
      return true;
    } catch {stop();return false;}
  }
  function stop() {
    if(!context)return;
    try{source?.stop()}catch{}
    source?.disconnect();source=null;
    context.close().catch(()=>{});context=null;gain=null;
  }
  return {start,stop,get playing(){return !!context}};
}
