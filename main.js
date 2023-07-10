'use strict';

let build = '300';

(function() {
  var output = document.createElement('pre');
  document.body.appendChild(output);
  var oldLog = console.log;
  console.log = function (...items) {
    oldLog.apply(this,items);
    items.forEach(function (item,i) {
      items[i] = (typeof item === 'object') ? JSON.stringify(item,null,4) : item;
    });
    output.innerHTML += items.join(' ') + '<br />';
  };
  window.onerror = console.log;
  document.body.onload = main;
})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  canvas.style.border = '1px solid #ffffff';
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
  let projD = canvas.width / (2*Math.tan(projA/2));

  let objects = [
    createSphere([1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],0.1,0.5,50.0,0.8)),
    createSphere([0.0,2.5,-2.0],0.5,createMaterial([1.0,1.0,1.0],0.1,0.9,500.0,0.8)),
    createSphere([-1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],0.8,0.5,50.0,0.2)),
    createSphere([-1.5,1.0,0.0],1.0,createMaterial([1.0,0.0,0.0],0.8,0.3,50.0,0.1)),
    createSphere([1.5,1.0,0.0],1.0,createMaterial([0.0,1.0,0.0],0.8,0.3,50.0,0.1)),
    createSphere([0.0,1.0,-2.0],1.0,createMaterial([0.0,0.0,1.0],0.8,0.3,50.0,0.1)),
    createSphere([ 0.0,0.5,2.0],0.5,createMaterial([1.0,1.0,1.0],0.5,0.2,5.0,0.0)),
    createSphere([0.0,-5000.0,0.0],5000,createMaterial([1.0,1.0,1.0],1.0,0.5,50.0,0.4)),
  //createSphere([0.0,0.0,0.0],5000,createMaterial([0.4,0.6,0.8],0.0,0.0,0.0,0.0))
  ];
  // override material sampler with sphere checker mapper
  objects[objects.length-1].mtl.sampler = function (hit) {
    let u = Math.atan2(hit.n[0],hit.n[1]) / (Math.PI*2) + 1.0;
    let v = Math.acos(hit.n[2]) / Math.PI + 0.5;
    let c = [[1,1,0],[1,0,1]];
    return c[((u*5000*4)&1) ^ ((v*2500*4)&1)];
  };

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
        let ray = [target[0]-origin[0], target[1]-origin[1], target[2]-origin[2]];
        let len = Math.sqrt(ray[0]*ray[0] + ray[1]*ray[1] + ray[2]*ray[2]);
        if (len != 0) {ray[0]/=len; ray[1]/=len; ray[2]/=len;}
        let rgb = intersectWorld(8,objects,origin,ray);
        colorbuf.data[ipixel++] = 255 * rgb[0];
        colorbuf.data[ipixel++] = 255 * rgb[1];
        colorbuf.data[ipixel++] = 255 * rgb[2];
        colorbuf.data[ipixel++] = 255;
      }
    }
    context.putImageData(colorbuf,0,0,0,0,canvas.width,canvas.height);
    let elapsed = Date.now() - timestamp;
    let message = 'build #' + build + ' (' + elapsed + 'ms)';
    context.font = '16px monospace';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#ffffff';
    context.fillText(message,0,0);
  }
}

function createIntersect () {
  return {
    t: Infinity,
    p: [0,0,0],
    n: [0,0,0],
    m: createMaterial([0,0,0],0,0,0,0)
  };
}

function intersectWorld (rec,objs,org,dir) {
  let rgb = [0.4,0.6,0.8];
  if (rec == 0) return rgb;

  let hit = createIntersect();
  for (let i=0; i<objs.length; i++) {
    let o = objs[i];
    let check = o.intersectEx(o,org,dir);
    if (check.t < hit.t) hit = check;
  }
  if (hit.t == Infinity) return rgb;

  rgb = hit.m.sampler(hit);

  let diffuse_intensity = 0;
  let specular_intensity = 0;
  let lights = [[5.0,5.0,5.0],[0.0,5.0,0.0]];
  for (let k=0; k<lights.length; k++) {
    let light = lights[k];
    let lv = [light[0]-hit.p[0], light[1]-hit.p[1], light[2]-hit.p[2]];
    let ll = Math.sqrt(lv[0]*lv[0] + lv[1]*lv[1] + lv[2]*lv[2]);
    if (ll != 0) {lv[0]/=ll; lv[1]/=ll; lv[2]/=ll;}
    let ld = Math.max(0, lv[0]*hit.n[0] + lv[1]*hit.n[1] + lv[2]*hit.n[2]);
    if (ld > 0) {
      let j = 0;
      for ( ; j<objs.length; j++) {
        let o = objs[j];
        let t = o.intersect(o,hit.p,lv);
        if (t < ll) break; // in shadow
      }
      if (j == objs.length) {
        let slv = [-lv[0],-lv[1],-lv[2]];
        let srt = -(2 * (slv[0]*hit.n[0] + slv[1]*hit.n[1] + slv[2]*hit.n[2]));
        let srv = [slv[0]+hit.n[0]*srt, slv[1]+hit.n[1]*srt, slv[2]+hit.n[2]*srt];
        let srl = Math.sqrt(srv[0]*srv[0] + srv[1]*srv[1] + srv[2]*srv[2]);
        if (srl != 0) {srv[0]/=srl; srv[1]/=srl; srv[2]/=srl;}
        srv[0] *= -1; srv[1] *= -1; srv[2] *= -1;
        let specular_dot = Math.max(0, srv[0]*dir[0] + srv[1]*dir[1] + srv[2]*dir[2]);
        specular_intensity += Math.pow(specular_dot,hit.m.sf);
        diffuse_intensity += ld;
      }
    }
  }

  diffuse_intensity = Math.min(1,diffuse_intensity) * hit.m.di;
  let diffuse_color = [rgb[0]*diffuse_intensity, rgb[1]*diffuse_intensity, rgb[2]*diffuse_intensity];

  specular_intensity = Math.min(1,specular_intensity) * hit.m.si;
  let specular_color = [rgb[0]*specular_intensity, rgb[1]*specular_intensity, rgb[2]*specular_intensity];

  if (hit.m.rf == 0.0) { // non reflective
    return [
      Math.min(1, diffuse_color[0] + specular_color[0]),
      Math.min(1, diffuse_color[1] + specular_color[1]),
      Math.min(1, diffuse_color[2] + specular_color[2])
    ];
  }

  // reflect

  let rt = -(2 * (dir[0]*hit.n[0] + dir[1]*hit.n[1] + dir[2]*hit.n[2]));
  let rv = [dir[0]+hit.n[0]*rt, dir[1]+hit.n[1]*rt, dir[2]+hit.n[2]*rt];
  let rl = Math.sqrt(rv[0]*rv[0] + rv[1]*rv[1] + rv[2]*rv[2]);
  if (rl != 0) {rv[0]/=rl; rv[1]/=rl; rv[2]/=rl;}

  let reflect_color = intersectWorld(rec-1,objs,hit.p,rv);
  reflect_color[0] *= hit.m.rf;
  reflect_color[1] *= hit.m.rf;
  reflect_color[2] *= hit.m.rf;

  return [
    Math.min(1, diffuse_color[0] + specular_color[0] + reflect_color[0]),
    Math.min(1, diffuse_color[1] + specular_color[1] + reflect_color[1]),
    Math.min(1, diffuse_color[2] + specular_color[2] + reflect_color[2])
  ];
}

function createMaterial (rgb,di,si,sf,rf) {
  return {
    rgb: rgb,
    di: di,
    si: si,
    sf: sf,
    rf: rf,
    sampler: function (hit) {return hit.m.rgb.slice();}
  };
}

function createSphere (o,r,m) {
  return {
    origin: o,
  //radius: r,
    r2: r * r,
    mtl: m,
    intersect: intersectSphere,
    intersectEx: intersectSphereEx
  };
}

function intersectSphere (obj,org,dir) {
  let L = [obj.origin[0]-org[0], obj.origin[1]-org[1], obj.origin[2]-org[2]];
  let tca = L[0]*dir[0] + L[1]*dir[1] + L[2]*dir[2];
  let d2 = (L[0]*L[0] + L[1]*L[1] + L[2]*L[2]) - tca*tca;
  if (d2 > obj.r2) return Infinity;
  let thc = Math.sqrt(obj.r2 - d2);
  let t0 = tca - thc;
  let t1 = tca + thc;
  if (t0 > 0.001) return t0;
  if (t1 > 0.001) return t1;
  return Infinity;
}

function intersectSphereEx (obj,org,dir) {
  let hit = createIntersect();
  hit.t = intersectSphere(obj,org,dir);
  if (hit.t == Infinity) return hit;
  hit.p[0] = org[0] + dir[0] * hit.t;
  hit.p[1] = org[1] + dir[1] * hit.t;
  hit.p[2] = org[2] + dir[2] * hit.t;
  hit.n[0] = hit.p[0] - obj.origin[0];
  hit.n[1] = hit.p[1] - obj.origin[1];
  hit.n[2] = hit.p[2] - obj.origin[2];
  let nl = Math.sqrt(hit.n[0]*hit.n[0] + hit.n[1]*hit.n[1] + hit.n[2]*hit.n[2]);
  if (nl != 0) {hit.n[0]/=nl; hit.n[1]/=nl; hit.n[2]/=nl;}
  hit.m = obj.mtl;
  return hit;
}
