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
  context.imageSmoothingEnabled = false;

  let colorbuf = context.createImageData(canvas.width,canvas.height);

  let origin = [0,1.5,10];
  let axisX = [-1,0,0];
  let axisY = [0,1,0];
  let axisZ = [0,0,-1];

  let projA = 60 * Math.PI / 180;
  let projW = canvas.width / 2;
  let projH = canvas.height / 2;
  let projD = canvas.width / (2*Math.tan(projA/2)); // horizontal FOV
//let projD = canvas.height / (2*Math.tan(projA/2)); // vertical FOV

  let mtl0 = createMaterial([1.0,1.0,1.0],0.1,1.0);
  let mtl1 = createMaterial([1.0,0.0,0.0],0.1,1.0);
  let mtl2 = createMaterial([0.0,1.0,0.0],0.1,1.0);
  let mtl3 = createMaterial([0.0,0.0,1.0],0.1,1.0);
  let mtl4 = createMaterial([1.0,1.0,1.0],1.0,1.0);

  let objects = [
    createSphere([ 0.0,2.0,2.0],0.5,mtl0),
    createSphere([-1.5,1.0,0.0],1.0,mtl1),
    createSphere([ 1.5,1.0,0.0],1.0,mtl2),
    createSphere([0.0,1.0,-1.5],1.0,mtl3),
    createSphere([ 0.0,0.5,2.0],0.5,mtl4)
  ];

  redraw();

  function redraw () {
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
        let len = Math.sqrt(dot3(ray,ray));
        if (len != 0) {ray[0]/=len; ray[1]/=len; ray[2]/=len;}
    
        let rgb = intersectWorld(objects,origin,ray);
        colorbuf.data[ipixel++] = 255 * rgb[0];
        colorbuf.data[ipixel++] = 255 * rgb[1];
        colorbuf.data[ipixel++] = 255 * rgb[2];
        colorbuf.data[ipixel++] = 255;
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
}

function intersectWorld (objs,org,dir) {
  let rgb = [0.4,0.5,0.6];
  let hit = intersectObject(objs,org,dir);
  if (hit.o == undefined) return rgb;

  let hit_p = [
    org[0] + dir[0] * hit.t,
    org[1] + dir[1] * hit.t,
    org[2] + dir[2] * hit.t
  ];

  let hit_n = [
    hit_p[0] - hit.o.origin[0],
    hit_p[1] - hit.o.origin[1];
    hit_p[2] - hit.o.origin[2];
  ];

  let nl = Math.sqrt(dot3(hit_n,hit_n));
  if (nl != 0) {hit_n[0]/=nl; hit_n[1]/=nl; hit_n[2]/=nl;}

  let light = [10.0,10.0,10.0];
  let lv = [light[0]-hit_p[0], light[1]-hit_p[1], light[2]-hit_p[2]];
  let ll = Math.sqrt(dot3(lv,lv));
  if (ll != 0) {lv[0]/=ll; lv[1]/=ll; lv[2]/=ll;}

  let ld = dot3(hit_n,lv);
  if (ld <= 0) return hit.o.mtl.a;

  let intensity = ld;
  let j = 0;
  for ( ; j<objs.length; j++) {
    let o = objs[j];
    let t = o.intersect(o,hit_p,lv);
    if (t < ll) {intensity*=0.5; break;}
  }
  if (j == objs.length) {
    // TODO specular
  }

  rgb[0] = Math.max(hit.o.mtl.a[0], hit.o.mtl.d[0] * intensity);
  rgb[1] = Math.max(hit.o.mtl.a[1], hit.o.mtl.d[1] * intensity);
  rgb[2] = Math.max(hit.o.mtl.a[2], hit.o.mtl.d[2] * intensity);

  // reflection

  let rt = -(2 * dot3(dir,hit_n));
  let rv = [
    dir[0] + hit_n[0] * rt,
    dir[1] + hit_n[1] * rt,
    dir[2] + hit_n[2] * rt
  ];
  let rl = Math.sqrt(dot3(rv,rv));
  if (rl != 0) {rv[0]/=rl; rv[1]/=rl; rv[2]/=rl;}

  let ref = intersectObjects(objs,hit_p,rv);
  if (ref.o == undefined) return rgb;

  // WIP shade and mix
  rgb = ref.o.mtl.a;

  return rgb;
}

function intersectObject (objs,org,dir) {
  let hit = {o:undefined, t:Infinity};
  for (let i=0; i<objs.length; i++) {
    let o = objs[i];
    let t = o.intersect(o,org,dir);
    if (t < hit.t) {hit.o=o; hit.t=t;}
  }
  return hit;
}

function createMaterial (c,ai,di) {
  return {
    a: [c[0]*ai,c[1]*ai,c[2]*ai],
    d: [c[0]*di,c[1]*di,c[2]*di]
  };
}

function createSphere (o,r,m) {
  return {origin:o, radius:r, mtl:m, intersect:intersectSphere};
}

function intersectSphere (obj,org,dir) {
  let t = Infinity;
  let L = [obj.origin[0] - org[0], obj.origin[1] - org[1], obj.origin[2] - org[2]];
  let tca = dot3(L,dir);
  if (tca <= 0) return t;
  let d2 = dot3(L,L) - tca*tca;
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
  return t <= 0 ? Infinity : t;
}

function dot3 (a,b) {return(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]);}
