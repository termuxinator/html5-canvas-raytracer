'use strict';

let build = '394';

(function() {
/*
  let output = document.createElement('pre');
  document.body.appendChild(output);
  let oldLog = console.log;
  console.log = function (...items) {
    oldLog.apply(this,items);
    items.forEach(function (item,i) {
      items[i] = (typeof item === 'object') ? JSON.stringify(item,null,4) : item;
    });
    output.innerHTML += items.join(' ') + '<br />';
  };
  window.onerror = console.log;
*/
  document.body.onload = main;
})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  let context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  let colorbuf = context.createImageData(canvas.width,canvas.height);

  let objects = [
createSphere([0.0,0.75,4.0],0.25,createMaterial([0.5,0.5,0.5],[0.5,0.8,0.1,0.8],10,1.5)), // glass
createSphere([ 1.5,2.5,0.0],0.5,createMaterial([0.5,0.5,0.5],[0.5,0.3,0.8,0.0],50,1.0)),  // bubble
createSphere([0.0,2.5,-2.0],0.5,createMaterial([1.0,1.0,1.0],[0.1,0.8,0.6,0.0],500,1.0)), // mirror
createSphere([-1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],[0.8,0.2,0.1,0.0],50,1.0)),  // metal
createSphere([-1.5,1.0,0.0],1.0,createMaterial([1.0,0.0,0.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornament
createSphere([ 1.5,1.0,0.0],1.0,createMaterial([0.0,1.0,0.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornament
createSphere([0.0,1.0,-2.0],1.0,createMaterial([0.0,0.0,1.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornamemt
createSphere([ 0.0,0.25,4.0],0.25,createMaterial([1.0,1.0,1.0],[1.0,0.1,0.0,0.0],10,1.0)),  // matte
createSphere([0.0,-5000.0,0.0],5000,createMaterial([1.0,1.0,1.0],[1.0,0.5,0.0,0.0],50,1.0)), // world
//createSphere([0.0,0.0,0.0],5000,createMaterial([0.0,0.0,0.0],[0.0,0.0,0.0,0.0],0,1.0)) // skybox
  ];
  // override material sampler with sphere checker mapper
  objects[objects.length-1].mtl.sampler = function (hit) {
    let u = Math.atan2(hit.n[0],hit.n[1]) / (Math.PI*2) + 1.0;
    let v = Math.acos(hit.n[2]) / Math.PI + 0.5;
    let s = (u * 5000 * 4) & 1;
    let t = (v * 2500 * 4) & 1;
    let c = [[1,1,0],[1,0,1]];
    return c[s^t];
  };
  // sort objects where most surface area come first
  objects.sort(function(a,b) {return(a.surface_area-b.surface_area);});

  let origin = [0,1.5,10];
  let axisX = [-1,0,0];
  let axisY = [0,1,0];
  let axisZ = [0,0,-1];

  let projA = 60 * Math.PI / 180;
  let projW = canvas.width / 2;
  let projH = canvas.height / 2;
  let projD = projW / Math.tan(projA/2);

  let dist = [-projW+0.5, projH-0.5, projD];

  let target = [
    origin[0] + axisX[0]*dist[0] + axisY[0]*dist[0] + axisZ[0]*dist[0],
    origin[1] + axisX[1]*dist[1] + axisY[1]*dist[1] + axisZ[1]*dist[1],
    origin[2] + axisX[2]*dist[2] + axisY[2]*dist[2] + axisZ[2]*dist[2]
  ];

  let stepX = axisX[0];
  let stepY = axisX[1];
  let stepZ = axisX[2];

  let nextX = -(axisX[0] * canvas.width + axisY[0]);
  let nextY = -(axisX[1] * canvas.width + axisY[1]);
  let nextZ = -(axisX[2] * canvas.width + axisY[2]);

  redraw();

  function redraw () {
    let timestamp = Date.now();
    let ipixel = 0;
    for (let y=0; y<canvas.height; y++) {
      for (let x=0; x<canvas.width; x++) {
        let ray = [target[0]-origin[0], target[1]-origin[1], target[2]-origin[2]];
        let len = Math.sqrt(ray[0]*ray[0] + ray[1]*ray[1] + ray[2]*ray[2]);
        if (len != 0) {ray[0]/=len; ray[1]/=len; ray[2]/=len;}
        let rgb = intersectWorld(8,objects,origin,ray);
        colorbuf.data[ipixel++] = 255 * rgb[0];
        colorbuf.data[ipixel++] = 255 * rgb[1];
        colorbuf.data[ipixel++] = 255 * rgb[2];
        colorbuf.data[ipixel++] = 255;
        target[0] += stepX;
        target[1] += stepY;
        target[2] += stepZ;
      }
      target[0] += nextX;
      target[1] += nextY;
      target[2] += nextZ;
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
  return {t:Infinity, p:[], n:[], m:{}};
}

function intersectWorld (segs,objs,org,dir) {
  if (segs == 0) return [0,0,0];

  let hit = createIntersect();
  for (let i=0; i<objs.length; i++) {
    let o = objs[i];
    let check = o.intersectEx(o,org,dir);
    if (check.t < hit.t) hit = check;
  }
  if (hit.t == Infinity) {
    let c = Math.random();
    if (c >= 0.001) return [0,0,0];
    c *= 1000; return [c,c,c];
  }

  let reflect_dir = [0,0,0];
  let reflect_len = 0;
  if (hit.m.albedo[2] > 0.0) { // has reflective properties
    let t = -(2 * (dir[0]*hit.n[0] + dir[1]*hit.n[1] + dir[2]*hit.n[2]));
    let v = [dir[0]+hit.n[0]*t, dir[1]+hit.n[1]*t, dir[2]+hit.n[2]*t];
    reflect_len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    if (reflect_len != 0) {v[0]/=reflect_len; v[1]/=reflect_len; v[2]/=reflect_len;}
    reflect_dir = v;
  }

  let refract_dir = [0,0,0];
  let refract_len = 0;
  if (hit.m.albedo[3] > 0) { // has refractive properties
    let norm, eta;
    let dot = dir[0]*hit.n[0] + dir[1]*hit.n[1] + dir[2]*hit.n[2];
    let cosi = -Math.max(-1, Math.min(1, dot));
    if (cosi < 0) { // from inside toward outside
      cosi = -cosi;
      norm = [-hit.n[0],-hit.n[1],-hit.n[2]];
      eta = hit.m.refract_index;
    } else {
      norm = [hit.n[0],hit.n[1],hit.n[2]];
      eta = 1 / hit.m.refract_index;
    }
    let k = 1 - eta*eta * (1 - cosi*cosi);
    if (k > 0) {
      let q = eta*cosi - Math.sqrt(k);
      let v = [
        dir[0] * eta + norm[0] * q,
        dir[1] * eta + norm[1] * q,
        dir[2] * eta + norm[2] * q
      ];
      refract_len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
      if (refract_len != 0) {v[0]/=refract_len; v[1]/=refract_len; v[2]/=refract_len;}
      refract_dir = v;
    }
  }

  let reflect_color = [0,0,0];
  if (reflect_len != 0) {
    reflect_color = intersectWorld(segs-1,objs,hit.p,reflect_dir);
    reflect_color[0] *= hit.m.albedo[2];
    reflect_color[1] *= hit.m.albedo[2];
    reflect_color[2] *= hit.m.albedo[2];
  }

  let refract_color = [0,0,0];
  if (refract_len != 0) {
    refract_color = intersectWorld(segs-1,objs,hit.p,refract_dir);
    refract_color[0] *= hit.m.albedo[3];
    refract_color[1] *= hit.m.albedo[3];
    refract_color[2] *= hit.m.albedo[3];
  }

  let lights = [[5.0,5.0,5.0],[0.0,7.5,0.0],[-5.0,10.0,0.0]];
  let diffuse_intensity = 0;
  let specular_intensity = 0;
  for (let k=0; k<lights.length; k++) {
    let light = lights[k];
    let lv = [light[0]-hit.p[0], light[1]-hit.p[1], light[2]-hit.p[2]];
    let ll = Math.sqrt(lv[0]*lv[0] + lv[1]*lv[1] + lv[2]*lv[2]);
    if (ll != 0) {lv[0]/=ll; lv[1]/=ll; lv[2]/=ll;}
    let ld = lv[0]*hit.n[0] + lv[1]*hit.n[1] + lv[2]*hit.n[2];
    if (ld <= 0) continue; // not facing light source
    let j = 0;
    for ( ; j<objs.length; j++) {
      let o = objs[j];
      let t = o.intersect(o,hit.p,lv);
      if (t < ll) break; // in shadow
    }
    if (j < objs.length) continue; // in shadow
    //diffuse_intensity += ld / (ll * ll);
    diffuse_intensity += ld / 2; // glorification hack
    let slv = [-lv[0],-lv[1],-lv[2]];
    let srt = -(2 * (slv[0]*hit.n[0] + slv[1]*hit.n[1] + slv[2]*hit.n[2]));
    let srv = [slv[0]+hit.n[0]*srt, slv[1]+hit.n[1]*srt, slv[2]+hit.n[2]*srt];
    let srl = Math.sqrt(srv[0]*srv[0] + srv[1]*srv[1] + srv[2]*srv[2]);
    if (srl != 0) {srv[0]/=srl; srv[1]/=srl; srv[2]/=srl;}
    srv[0] *= -1; srv[1] *= -1; srv[2] *= -1;
    let specular_dot = srv[0]*dir[0] + srv[1]*dir[1] + srv[2]*dir[2];
    if (specular_dot > 0) specular_intensity += Math.pow(specular_dot,hit.m.specular_exponent);
  }
  diffuse_intensity = Math.min(1,diffuse_intensity) * hit.m.albedo[0];
  specular_intensity = Math.min(1,specular_intensity) * hit.m.albedo[1];

  let rgb = hit.m.sampler(hit);

  let diffuse_color = [rgb[0]*diffuse_intensity, rgb[1]*diffuse_intensity, rgb[2]*diffuse_intensity];
  let specular_color = [rgb[0]*specular_intensity, rgb[1]*specular_intensity, rgb[2]*specular_intensity];

  return [
    Math.min(1, diffuse_color[0] + specular_color[0] + reflect_color[0] + refract_color[0]),
    Math.min(1, diffuse_color[1] + specular_color[1] + reflect_color[1] + refract_color[1]),
    Math.min(1, diffuse_color[2] + specular_color[2] + reflect_color[2] + refract_color[2])
  ];
}

function createMaterial (color,albedo,se,ri) {
  return {
    diffuse_color: color,
    albedo: albedo,
    specular_exponent: se,
    refract_index: ri,
    sampler: defaultSampler
  };
  function defaultSampler (hit) {
    return hit.m.diffuse_color;
  }
}

function createSphere (o,r,m) {
  let r2 = r * r;
  let surface_area = 4 * Math.PI * r2;
  return {
    origin: o,
  //radius: r,
    r2: r2,
    mtl: m,
    surface_area: surface_area,
    intersect: intersectSphere,
    intersectEx: intersectSphereEx
  };
}

function intersectSphere (obj,org,dir) {
  let L = [obj.origin[0]-org[0], obj.origin[1]-org[1], obj.origin[2]-org[2]];
  let tca = L[0]*dir[0] + L[1]*dir[1] + L[2]*dir[2];
  let d2 = L[0]*L[0] + L[1]*L[1] + L[2]*L[2] - tca*tca;
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
  let l = Math.sqrt(hit.n[0]*hit.n[0] + hit.n[1]*hit.n[1] + hit.n[2]*hit.n[2]);
  if (l != 0) {let r=1/l; hit.n[0]*=r; hit.n[1]*=r; hit.n[2]*=r;}
  hit.m = obj.mtl;
  return hit;
}
