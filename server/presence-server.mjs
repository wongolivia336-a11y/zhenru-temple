import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";

// Opt-in ephemeral rendezvous. Run on a persistent WebSocket host, never a
// static/Vercel function. No visitor name, IP history, chat or database.
const port=Number(process.env.PORT||8080);
const origin=process.env.ALLOWED_ORIGIN||"";
const wss=new WebSocketServer({
  port, maxPayload:768, perMessageDeflate:false,
  verifyClient({origin:clientOrigin},done) {
    done(!origin || clientOrigin===origin,403,"Origin not permitted");
  }
});
const MAX=14;
function send(ws,payload) {
  if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(payload));
}
function broadcast(ws,payload) {
  for(const c of wss.clients)if(c!==ws&&c.readyState===WebSocket.OPEN&&c.joined)send(c,payload);
}
function validPose(data) {
  const {x,z,yaw}=data;
  return [x,z,yaw].every(Number.isFinite) && x>=-7&&x<=7&&z>=7&&z<=31&&Math.abs(yaw)<100;
}
wss.on("connection",ws=>{
  ws.joined=false;ws.id=randomUUID();ws.pose=null;ws.lastPose=0;ws.lastTrace=0;
  ws.on("message",buffer=>{
    let data;try{data=JSON.parse(buffer.toString())}catch{return;}
    if(!data||typeof data.type!=="string")return;
    if(data.type==="join" && !ws.joined) {
      const peers=[...wss.clients].filter(c=>c.joined&&c!==ws);
      if(peers.length>=MAX){send(ws,{type:"full"});ws.close(1008);return;}
      ws.joined=true;
      send(ws,{type:"welcome",id:ws.id,peers:peers.filter(c=>c.pose).map(c=>({id:c.id,...c.pose}))});
      // Clients do not know this visitor's position until a pose is shared.
    } else if(data.type==="pose" && ws.joined && validPose(data)) {
      const now=Date.now();
      if(now-ws.lastPose<120)return;
      ws.lastPose=now;
      ws.pose={x:data.x,z:data.z,yaw:data.yaw};
      broadcast(ws,{type:"peer",peer:{id:ws.id,...ws.pose}});
    } else if(data.type==="trace" && ws.joined && ["dougong","roof","ginkgo"].includes(data.part)) {
      const now=Date.now();if(now-ws.lastTrace<10000)return;
      ws.lastTrace=now;
      broadcast(ws,{type:"trace",id:ws.id,part:data.part});
    }
  });
  ws.on("close",()=>{if(ws.joined)broadcast(ws,{type:"leave",id:ws.id});});
});
const shutdown=()=>{wss.clients.forEach(ws=>ws.close(1001,"server closing"));wss.close();};
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
