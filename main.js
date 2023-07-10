(function(){document.body.onload=main;})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = 512;
  canvas.height = 512;
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

  let mtl0 = createMaterial([0.0,0.0,0.0],1.0,0.0,0.0,1.0);
  let mtl1 = createMaterial([1.0,0.0,0.0],1.0,0.0,0.0,0.2);
  let mtl2 = createMaterial([0.0,1.0,0.0],1.0,0.0,0.0,0.2);
  let mtl3 = createMaterial([0.0,0.0,1.0],1.0,0.0,0.0,0.2);
  let mtl4 = createMaterial([1.0,1.0,1.0],1.0,0.0,0.0,0.0);

  let objects = [
    createSphere([0.0,2.5,-2.0],0.5,mtl0),
    createSphere([-1.5,1.0,0.0],1.0,mtl1),
    createSphere([ 1.5,1.0,0.0],1.0,mtl2),
    createSphere([0.0,1.0,-2.0],1.0,mtl3),
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

        let ray = [
          target[0] - origin[0],
          target[1] - origin[1],
          target[2] - origin[2]
        ];
        let len = Math.sqrt(ray[0]*ray[0] + ray[1]*ray[1] + ray[2]*ray[2]);
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

  let intensity = lightPoint(objs,hit.p,hit.n);
  intensity *= hit.o.mtl.di;
  rgb[0] = hit.o.mtl.rgb[0] * intensity;
  rgb[1] = hit.o.mtl.rgb[1] * intensity;
  rgb[2] = hit.o.mtl.rgb[2] * intensity;

//if (hit.o.mtl.rf == 0) return rgb;

  // reflect

  let rt = -(2 * (dir[0]*hit.n[0] + dir[1]*hit.n[1] + dir[2]*hit.n[2]));
  let rv = [
    dir[0] + hit.n[0] * rt,
    dir[1] + hit.n[1] * rt,
    dir[2] + hit.n[2] * rt,
  ];
  let rl = Math.sqrt(rv[0]*rv[0] + rv[1]*rv[1] + rv[2]*rv[2]);
  if (rl != 0) {rv[0]/=rl; rv[1]/=rl; rv[2]/=rl;}

  let ref = intersectObject(objs,hit.p,rv);
  if (ref.o == undefined) return rgb;

  let rgb2 = [];
  let intensity2 = lightPoint(objs,ref.p,ref.n);
  intensity2 *= ref.o.mtl.di;
  rgb2[0] = ref.o.mtl.rgb[0] * intensity2;
  rgb2[1] = ref.o.mtl.rgb[1] * intensity2;
  rgb2[2] = ref.o.mtl.rgb[2] * intensity2;

  return [
    rgb[0] + (rgb2[0] - rgb[0]) * hit.o.mtl.rf,
    rgb[1] + (rgb2[1] - rgb[1]) * hit.o.mtl.rf,
    rgb[2] + (rgb2[2] - rgb[2]) * hit.o.mtl.rf
  ];
}

function mid (a,b) {return Math.abs(a-b)/2;}

function intersectObject (objs,org,dir) {
  let out = {o:undefined, t:Infinity, p:[0,0,0], n:[0,0,0]};
  for (let i=0; i<objs.length; i++) {
    let o = objs[i];
    let hit = o.intersectEx(o,org,dir);
    if (hit.t < out.t) {
      out.o = hit.o;
      out.t = hit.t;
      out.p = hit.p;
      out.n = hit.n;
    }
  }
  return out;
}

function lightPoint (objs,p,n) {
  let light = [10.0,10.0,10.0];

  let lv = [
    light[0] - p[0],
    light[1] - p[1],
    light[2] - p[2]
  ];
  let ll = Math.sqrt(lv[0]*lv[0] + lv[1]*lv[1] + lv[2]*lv[2]);
  if (ll != 0) {lv[0]/=ll; lv[1]/=ll; lv[2]/=ll;}

  let intensity = lv[0]*n[0] + lv[1]*n[1] + lv[2]*n[2];
  if (intensity <= 0) return 0;
  let i = 0;
  for ( ; i<objs.length; i++) {
    let o = objs[i];
    let t = o.intersect(o,p,lv);
    if (t < ll) {intensity*=0.5; break;}
  }
  if (i == objs.length) {
    // TODO specular
  }
  return intensity;
}

function createMaterial (rgb,di,si,sf,rf) {
  return {
    rgb: rgb,
    di: di,
    si: si,
    sf: sf,
    rf: rf
  };
}

function createSphere (o,r,m) {
  return {
    origin: o,
    radius: r,
    r2: (r * r),
    mtl: m,
    intersect: intersectSphere, // returns distance
    intersectEx: intersectSphereEx // returns packet
  };
}

function intersectSphere (obj,org,dir) {
  let t = Infinity;

  let L = [
    obj.origin[0] - org[0],
    obj.origin[1] - org[1],
    obj.origin[2] - org[2]
  ];

  let tca = L[0]*dir[0] + L[1]*dir[1] + L[2]*dir[2];
  if (tca <= 0) return t;

  let d2 = (L[0]*L[0] + L[1]*L[1] + L[2]*L[2]) - tca*tca;
  if (d2 > obj.r2) return t;

  let thc = Math.sqrt(obj.r2 - d2);
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

function intersectSphereEx (obj,org,dir) {
  let hit = {o:undefined, t:Infinity, p:[0,0,0], n:[0,0,0]};

  let t = intersectSphere(obj,org,dir);
  if (t == Infinity) return hit;

  hit.o = obj;
  hit.t = t;

  hit.p[0] = org[0] + dir[0] * t;
  hit.p[1] = org[1] + dir[1] * t;
  hit.p[2] = org[2] + dir[2] * t;

  hit.n[0] = hit.p[0] - obj.origin[0];
  hit.n[1] = hit.p[1] - obj.origin[1];
  hit.n[2] = hit.p[2] - obj.origin[2];

  let nl = Math.sqrt(hit.n[0]*hit.n[0] + hit.n[1]*hit.n[1] + hit.n[2]*hit.n[2]);
  if (nl != 0) {hit.n[0]/=nl; hit.n[1]/=nl; hit.n[2]/=nl;}

  return hit;
}
