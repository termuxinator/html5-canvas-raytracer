(function(){document.body.onload=main;})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = 256;
  canvas.height = 256;
  canvas.style.borderStyle = 'solid';
  canvas.style.borderWidth = '1px';
  canvas.style.borderColor = '#ff0000 #00ff00 #0000ff #ffffff';
//canvas.style.color = '#ffffff';
//canvas.style.backgroundColor = '#555555';
  let context = canvas.getContext('2d');
  let colorbuf = context.createImageData(canvas.width,canvas.height);

  let origin = [0,5,-10];
  let axisX = [1,0,0];
  let axisY = [0,1,0];
  let axisZ = [0,0,1];

  let projA = 60 * Math.PI / 180;
  let projW = canvas.width / 2;
  let projH = canvas.height / 2;
  let projD = canvas.width / (2*Math.tan(projA/2)); // horizontal FOV
//let projD = canvas.height / (2*Math.tan(projA/2)); // vertical FOV

  let sphere0 = {origin:[0.0,0.5,0.0],radius:0.5,color:[1.0,1.0,1.0,1.0],intersect:intersectSphere};
  let objects = [sphere0];

  let timestamp = Date.now();
  let ipixel = 0;
  for (let y=0; y<canvas.height; y++) {
    for (let x=0; x<canvas.width; x++) {
      let distX = x - projW + 0.5;
      let distY = projH - y - 0.5;
      let distZ = projD;
    
      let target = [
        origin[0] + axisX[0]*distX + axisY[0]*distX + axisZ[0]*distX,
        origin[1] + axisX[1]*distY + axisY[1]*distY + axisZ[1]*distY,
        origin[2] + axisX[2]*distZ + axisY[2]*distZ + axisZ[2]*distZ
      ];

      let ray = [target[0] - origin[0], target[1] - origin[1], target[2] - origin[2]];
      let len = Math.sqrt(ray[0]*ray[0] + ray[1]*ray[1] + ray[2]*ray[2]);
      if (len != 0) {ray[0]/=len; ray[1]/=len; ray[2]/=len;}
    
      let color = intersectWorld(objects,origin,ray);
      colorbuf.data[ipixel+0] = color[0] * 255;
      colorbuf.data[ipixel+1] = color[1] * 255;
      colorbuf.data[ipixel+2] = color[2] * 255;
      colorbuf.data[ipixel+3] = color[3] * 255;
      ipixel += 4;
    }
  }
  context.putImageData(colorbuf,0,0,0,0,canvas.width,canvas.height);

  let fps = 1000 / (Date.now() - timestamp);
  let str = 'fps ' + (fps | 0);
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillStyle = '#ffffff';
  context.fillText(str,0,0);
}

function intersectWorld (objs,org,dir) {
  let hit = intersectObjects(objs,org,dir);
  if (hit.o != undefined) return hit.c;
  // temp background
  let r = Math.abs(dir[0]);
  let g = Math.abs(dir[1]);
  let b = 0.0;
  let a = 1.0;
  return [r,g,b,a];
}

function intersectObjects (objs,org,dir) {
  let hit = {o:undefined, t:Infinity, c:[0.2,0.3,0.4,1.0]};
  for (let i=0; i<objs.length; i++) {
    let o = objs[i];
    let t = o.intersect(o,org,dir);
    if (t < hit.t) {hit.o = o; hit.t = t;}
  }
  return hit;
}

function intersectSphere (obj,org,dir) {
  let t = Infinity;
  let L = [obj.origin[0] - org[0], obj.origin[1] - org[1], obj.origin[2] - org[2]];
  let tca = L[0]*dir[0] + L[1]*dir[1] + L[2]*dir[2];
  if (tca <= 0) return t;
  let d2 = L[0]*L[0] + L[1]*L[1] + L[2]*L[2] - tca*tca;
  let r2 = obj.radius * obj.radius;
  if (d2 > r2) return t;
  let thc = Math.sqrt(r2 - d2);
  let t0 = tca - thc;
  let t1 = tca + thc;
  if (t0 > t1) {
    if (t1 < 0) t = t0;
    else t = t1;
  } else {
    if (t0 < 0) t = t1;
    else t = t0;
  }
  return t < 0.001 ? Infinity : t;
}
