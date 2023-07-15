'use strict';

let build = '543';

(function() {
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
  document.body.onload = main;
})();

function new3D (x,y,z) {
  return [x,y,z];
}

function copy3D (v) {
  return [v[0], v[1], v[2]];
}

function oppose3D (v) {
  return [-v[0], -v[1], -v[2]];
}

function scale3D (v,t) {
  return [v[0]*t, v[1]*t, v[2]*t];
}

function project3D (o,v,t) {
  return [o[0]+v[0]*t, o[1]+v[1]*t, o[2]+v[2]*t];
}

function reflect3D (v,n) {
  const t = -(2 * dot3D(v,n));
  return project3D(v,n,t);
}

function mag3D (v) {
  return dot3D(v,v);
}

function dot3D (a,b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function cross3D (a,b) {
  return [a[1]*b[2]-b[1]*a[2], a[2]*b[0]-b[2]*a[0], a[0]*b[1]-b[0]*a[1]];
}

function length3D (v) {
  const m = mag3D(v);
  return Math.sqrt(m);
}

function normal3D (v) {
  let l = length3D(v);
  if (l == 0) return v;
  return scale3D(v,1/l);
}

function between3D (a,b) {
  return [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
}

function distance3D (a,b) {
  let v = between3D(a,b);
  return length3D(v);
}

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  let context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  let colorbuf = context.createImageData(canvas.width,canvas.height);

  let origin = new3D(0,1.5,10);
  let axisX = new3D(-1,0,0);
  let axisY = new3D(0,1,0);
  let axisZ = new3D(0,0,-1);

  lookAt([0,1.5,10],[0,1.5,0],[0,1,0]);

  function lookAt (org,tgt,up) {
    origin = org;
    axisZ = between3D(org,tgt);
    axisX = cross3D(axisZ,up);
    axisY = cross3D(axisX,axisZ);
    axisX = normal3D(axisX);
    axisY = normal3D(axisY);
    axisZ = normal3D(axisZ);
  }

  let projA = 60 * Math.PI / 180;
  let projW = canvas.width / 2;
  let projH = canvas.height / 2;
  let projD = projW / Math.tan(projA/2);

  let objects = [
createSphere([0.0,-500.0,0.0],500,createMaterial([1.0,1.0,1.0],[0.5,0.8,0.0,0.0],10,1.0)), // home
createSphere([0.0,0.0,0.0],5000,createMaterial([0.0,0.0,0.0],[0.0,0.0,0.0,0.0],0,1.0)), // skybox
createSphere([50.0,20.0,-100.0],4.0,createMaterial([1.0,1.0,1.0],[0.0,0.0,0.0,0.0],0,1.0)),  // earth
createSphere([-50.0,20.0,-100.0],2.0,createMaterial([1.0,1.0,1.0],[0.0,0.0,0.0,0.0],0,1.0)),  // mars
createSphere([0.0,0.75,4.0],0.25,createMaterial([0.5,0.5,0.5],[1.0,0.2,0.0,0.8],10,1.5)), // glass
createSphere([ 1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],[0.2,0.3,0.8,0.0],20,1.0)),  // bubble
createSphere([0.0,2.5,-2.0],0.5,createMaterial([1.0,1.0,1.0],[0.1,0.5,0.6,0.0],500,1.0)), // mirror
createSphere([-1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],[0.8,0.2,0.1,0.0],50,1.0)),  // metal
createSphere([-1.5,1.0,0.0],1.0,createMaterial([1.0,0.0,0.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornament
createSphere([ 1.5,1.0,0.0],1.0,createMaterial([0.0,1.0,0.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornament
createSphere([0.0,1.0,-2.0],1.0,createMaterial([0.0,0.0,1.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornamemt
createSphere([ 0.0,0.25,4.0],0.25,createMaterial([1.0,1.0,1.0],[1.0,0.1,0.0,0.0],10,1.0)),  // matte
  ];
  // override home material sampler with sphere checker mapper
  objects[0].mtl.sampler = function (hit) {
    let u = Math.atan2(-hit.n[1],-hit.n[0]) / Math.PI / 2 + 0.5;
    let v = Math.asin(-hit.n[2]) / (Math.PI/2) / 2 + 0.5;
    let s = (u * 5000) & 1;
    let t = (v * 2500) & 1;
    let c = [[1,1,0],[1,0,1]];
    return c[s^t];
  };
  // override skybox material sampler with night stars
  objects[1].mtl.sampler = function (hit) {
    let c = Math.random();
    if (c >= 0.001) return [0,0,0];
    c *= 1000; return [c,c,c];
  };
  // override earth material sampler to use texture mapper
  let earth_texture = loadTexture('./earth.png');
  objects[2].mtl.sampler = function (hit) {
    return sampleTexture(earth_texture,hit.u,hit.v);
  };
  // override mars material sampler to use texture mapper
  let mars_texture = loadTexture('./mars.png');
  objects[3].mtl.sampler = function (hit) {
    return sampleTexture(mars_texture,hit.u,hit.v);
  };
  // sort objects based on surface area and distance from camera
  objects.sort(function (a,b) {
    let aa = a.surface_area / distance3D(origin,a.origin);
    let bb = b.surface_area / distance3D(origin,b.origin);
    return(aa - bb);
  });

  let resource_list = [earth_texture, mars_texture]; // register resources
  setTimeout(loading,0);
  function loading () {
    let callback = redraw;
    let timeout = 0;
    for (let i=0; i<resource_list.length; i++) {
      if (!resource_list[i].loaded) {
        callback = loading;
        timeout = 500;
        break;
      }
    }
    setTimeout(callback,timeout);
  }

  function redraw () {
    let timestamp = Date.now();
    let ipixel = 0;
    for (let y=0; y<canvas.height; y++) {
      for (let x=0; x<canvas.width; x++) {
        let dist = [x-projW+0.5, projH-y-0.5, projD];
        let target = [
          origin[0] + axisX[0]*dist[0] + axisY[0]*dist[0] + axisZ[0]*dist[0],
          origin[1] + axisX[1]*dist[1] + axisY[1]*dist[1] + axisZ[1]*dist[1],
          origin[2] + axisX[2]*dist[2] + axisY[2]*dist[2] + axisZ[2]*dist[2]
        ];
        let ray = normal3D(between3D(origin,target));
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
  return {t:Infinity, p:[], n:[], u:0, v:0, m:{}};
}

function intersectWorld (segs,objs,org,dir) {
  if (segs == 0) return [0,0,0];

  let hit = createIntersect();
  for (let i=0; i<objs.length; i++) {
    let o = objs[i];
    let check = o.intersectM(o,org,dir);
    if (check.t < hit.t) hit = check;
  }
  if (hit.t == Infinity) return [1,0,0]; // wtf no skybox bro?

  let reflect_dir = [0,0,0];
  let reflect_len = 0;
  if (hit.m.albedo[2] > 0) { // has reflective properties
    reflect_dir = reflect3D(dir,hit.n);
    reflect_len = length3D(reflect_dir);
    if (reflect_len != 0) reflect_dir = scale3D(reflect_dir,1/reflect_len);
  }

  let refract_dir = [0,0,0];
  let refract_len = 0;
  if (hit.m.albedo[3] > 0) { // has refractive properties
    let norm, eta;
    let dot = dot3D(dir,hit.n);
    let cosi = -Math.max(-1, Math.min(1, dot));
    if (cosi < 0) { // from inside toward outside
      cosi = -cosi;
      norm = oppose3D(hit.n);
      eta = hit.m.refract_index;
    } else {
      norm = copy3D(hit.n);
      eta = 1 / hit.m.refract_index;
    }
    let k = 1 - eta*eta * (1 - cosi*cosi);
    if (k > 0) {
      let q = eta*cosi - Math.sqrt(k);
      refract_dir[0] = dir[0] * eta + norm[0] * q;
      refract_dir[1] = dir[1] * eta + norm[1] * q;
      refract_dir[2] = dir[2] * eta + norm[2] * q;
      refract_len = length3D(refract_dir);
      if (refract_len != 0) refract_dir = scale3D(refract_dir,1/refract_len);
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

  let diffuse_intensity = 0;
  let specular_intensity = 0;

  // zero intensity will bypass shader (full bright hack)
  if ((hit.m.albedo[0] == 0) && (hit.m.albedo[1] == 0)) {
    diffuse_intensity = 1;
    specular_intensity = 0;
  } else {
    let lights = [[5.0,10.0,5.0]/*,[0.0,7.5,0.0],[-5.0,10.0,0.0]*/];
    let light_intensity = 150; // common (for now)
    for (let k=0; k<lights.length; k++) {
      let light = lights[k];
      let lv = between3D(hit.p,light); // shadow vec
      let lm = mag3D(lv);
      let ll = Math.sqrt(lm);
      if (ll != 0) lv = scale3D(lv,1/ll);
      let ld = dot3D(lv,hit.n);
      if (ld <= 0) continue; // surface not facing light source
      for (let j=0; j<objs.length; j++) {
        let o = objs[j];
        let t = o.intersectT(o,hit.p,lv);
        if (t < ll) {ld=0; break;} // occluded
      }
      if (ld == 0) continue;
    //diffuse_intensity += ld;
      diffuse_intensity += light_intensity * ld / lm;
      let spec_ref = reflect3D(oppose3D(lv),hit.n);
      let spec_dir = oppose3D(normal3D(spec_ref));
      let spec_dot = dot3D(dir,spec_dir);
      if (spec_dot > 0) specular_intensity += Math.pow(spec_dot,hit.m.specular_exponent);
    }
    diffuse_intensity = Math.min(1,diffuse_intensity) * hit.m.albedo[0];
    specular_intensity = Math.min(1,specular_intensity) * hit.m.albedo[1];
  }

  let rgb = hit.m.sampler(hit);

  let diffuse_color = [rgb[0]*diffuse_intensity, rgb[1]*diffuse_intensity, rgb[2]*diffuse_intensity];
  let specular_color = [rgb[0]*specular_intensity, rgb[1]*specular_intensity, rgb[2]*specular_intensity];

  return [
    Math.min(1, diffuse_color[0] + specular_color[0] + reflect_color[0] + refract_color[0]),
    Math.min(1, diffuse_color[1] + specular_color[1] + reflect_color[1] + refract_color[1]),
    Math.min(1, diffuse_color[2] + specular_color[2] + reflect_color[2] + refract_color[2])
  ];
}

function sampleTexture (texture,u,v) {
  let x = Math.max(0, Math.ceil(u * texture.width) - 1);
  let y = Math.max(0, Math.ceil(v * texture.height) - 1);
  let i = (y * texture.width + x) * 4;
  let r = texture.texels[i+0] / 255;
  let g = texture.texels[i+1] / 255;
  let b = texture.texels[i+2] / 255;
  return [r,g,b];
}

function createTexture () {
  return {
    width: 0,
    height: 0,
    texels: [],
    loaded: false // all loadable resources must have this property
  };
}

function loadTexture (src) {
  let texture = createTexture();
  var image = new Image();
  image.onload = function (e) {
    let canvas = document.createElement('canvas');
    canvas.width = e.target.width;
    canvas.height = e.target.height;
    let context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(e.target,0,0,canvas.width,canvas.height);
    let data = context.getImageData(0,0,canvas.width,canvas.height);
    texture.width = canvas.width;
    texture.height = canvas.height;
    texture.texels = data.data;
    texture.loaded = true;
  };
  image.src = src;
  return texture;
}

function createMaterial (color,albedo,se,ri) {
  return {
    diffuse_color: color,
    albedo: albedo,
    specular_exponent: se,
    refract_index: ri,
    // default sampler, can be overidden later
    sampler: function (hit) {return hit.m.diffuse_color;}
  };
}

function createSphere (o,r,m) {
  let r2 = r * r;
  return {
    origin: o,
  //radius: r,
    r2: r2,
    mtl: m,
    surface_area: 4 * Math.PI * r2,
    intersectT: intersectSphereT,
    intersectM: intersectSphereM
  };
}

function intersectSphereT (obj,org,dir) {
  let L = between3D(org,obj.origin);
  let tca = dot3D(dir,L);
  let d2 = mag3D(L) - tca*tca;
  if (d2 > obj.r2) return Infinity;
  let thc = Math.sqrt(obj.r2 - d2);
  let t0 = tca - thc;
  let t1 = tca + thc;
  if (t0 > 0.001) return t0;
  if (t1 > 0.001) return t1;
  return Infinity;
}

function intersectSphereM (obj,org,dir) {
  let hit = createIntersect();
  hit.t = intersectSphereT(obj,org,dir);
  if (hit.t == Infinity) return hit;
  hit.p = project3D(org,dir,hit.t);
  hit.n = normal3D(between3D(obj.origin,hit.p));
  hit.u = Math.atan2(-hit.n[2],-hit.n[0]) / Math.PI / 2 + 0.5;
  hit.v = Math.asin(-hit.n[1]) / (Math.PI/2) / 2 + 0.5;
  hit.m = obj.mtl;
  return hit;
}
