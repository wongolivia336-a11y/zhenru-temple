// No network connection is opened until a visitor explicitly joins.
// The endpoint is blank by default. This module never generates fake peers.
export function createPresenceClient({ url, onState, onPeer, onLeave, onTrace }) {
  let socket=null,joined=false,selfId=null,lastPose=0;
  const safeEndpoint = typeof url === "string" && (
    /^wss:\/\//i.test(url) ||
    (/^ws:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(url) && location.hostname==="localhost")
  ) ? url : "";
  function state(status,detail="") {onState?.({status,detail,joined,selfId});}
  function disconnect() {
    joined=false;selfId=null;
    if(socket){const old=socket;socket=null;old.close(1000,"private");}
    state("private");
  }
  function connect() {
    if (!safeEndpoint) {state("unavailable","未配置实时共在服务");return false;}
    if(socket) return true;
    state("connecting");
    try {
      const ws=new WebSocket(safeEndpoint);socket=ws;
      ws.addEventListener("open",()=>{if(socket===ws)ws.send(JSON.stringify({type:"join"}));});
      ws.addEventListener("message",(event)=>{
        if(socket!==ws)return;
        let data;try{data=JSON.parse(event.data)}catch{return;}
        if(data.type==="welcome" && typeof data.id==="string") {
          joined=true;selfId=data.id;state("shared");
          if(Array.isArray(data.peers))data.peers.forEach(p=>onPeer?.(p));
        } else if(data.type==="peer" && data.peer && data.peer.id!==selfId) onPeer?.(data.peer);
        else if(data.type==="leave")onLeave?.(data.id);
        else if(data.type==="trace" && data.id!==selfId && typeof data.part==="string")onTrace?.(data);
        else if(data.type==="full") {state("full","共享空间人数已满");ws.close();}
      });
      ws.addEventListener("close",()=>{
        if(socket!==ws)return;
        socket=null;joined=false;selfId=null;state("private","连接已结束");
      });
      ws.addEventListener("error",()=>{if(socket===ws)state("error","网络无法连接");});
      return true;
    } catch {state("error","连接失败");return false;}
  }
  function sendPose(pose,now=performance.now()) {
    if(!joined||!socket||socket.readyState!==WebSocket.OPEN||now-lastPose<125)return;
    lastPose=now;
    socket.send(JSON.stringify({type:"pose",x:pose.x,z:pose.z,yaw:pose.yaw}));
  }
  function leaveTrace(part) {
    if(joined&&socket?.readyState===WebSocket.OPEN)
      socket.send(JSON.stringify({type:"trace",part}));
  }
  return {connect,disconnect,sendPose,leaveTrace,get joined(){return joined},get available(){return !!safeEndpoint}};
}
