'use strict';

const build = '657';

(function() {
  const output = document.createElement('pre');
  document.body.appendChild(output);
  const oldLog = console.log;
  console.log = function (...items) {
    oldLog.apply(this,items);
    items.forEach(function (item,i) {
      items[i] = (typeof item === 'object') ? JSON.stringify(item,null,4) : item;
    });
    output.innerHTML += items.join(' ') + '<br>';
  };
  window.onerror = console.log;
  document.body.onload = main;
})();

function init3D (x,y,z) {
  return [x, y, z];
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
  const l = length3D(v);
  if (l == 0) return v;
  return scale3D(v,1/l);
}

function between3D (a,b) {
  return [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
}

function distance3D (a,b) {
  const v = between3D(a,b);
  return length3D(v);
}

function main () {
  const canvas = document.getElementById('canvasID');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  const colorbuf = context.createImageData(canvas.width,canvas.height);

  let origin = init3D(0,1.5,10);
  let axisX  = init3D(-1,0,0);
  let axisY  = init3D(0,1,0);
  let axisZ  = init3D(0,0,-1);

  lookAt([0,1.5,10],[0,1.5,0],[0,1,0]);

  function lookAt (org,tgt,up) {
    origin = org;
    axisZ = between3D(org,tgt);
    axisX = cross3D(up,axisZ);
    axisY = cross3D(axisZ,axisX);
    axisX = normal3D(axisX);
    axisY = normal3D(axisY);
    axisZ = normal3D(axisZ);
  }

  const projA = 60 * Math.PI / 180;
  const projW = canvas.width / 2;
  const projH = canvas.height / 2;
  const projD = projW / Math.tan(projA/2);

  const objects = [
createSphere([0.0,-500.0,0.0],500,createMaterial([1.0,1.0,1.0],[0.5,0.8,0.0,0.0],10,1.0)), // home
createSphere([0.0,0.0,0.0],5000,createMaterial([0.0,0.0,0.0],[0.0,0.0,0.0,0.0],0,1.0)), // skybox
createSphere([50.0,20.0,-100.0],4.0,createMaterial([1.0,1.0,1.0],[0.0,0.0,0.0,0.0],0,1.0)),  // earth
createSphere([-50.0,20.0,-100.0],2.0,createMaterial([1.0,1.0,1.0],[0.0,0.0,0.0,0.0],0,1.0)),  // mars
createSphere([ 0.0,0.25,3.0],0.25,createMaterial([1.0,1.0,1.0],[1.0,0.1,0.0,0.0],10,1.0)),  // matte
createSphere([0.0,0.75,3.0],0.25,createMaterial([1.0,1.0,1.0],[0.5,0.2,0.0,0.9],10,1.5)), // glass

//createSphere([ 1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],[0.2,0.3,0.8,0.0],20,1.0)),  // bubble
  createSphere([ 2.5,0.5,3.0],0.5,createMaterial([0.5,0.5,0.5],[0.4,0.5,0.2,0.8],20,1.0)),  // bubble

createSphere([0.0,2.5,-2.0],0.5,createMaterial([1.0,1.0,1.0],[0.1,0.5,0.6,0.0],500,1.0)), // mirror
createSphere([-1.5,2.5,0.0],0.5,createMaterial([1.0,1.0,1.0],[0.8,0.2,0.1,0.0],50,1.0)),  // metal
createSphere([-1.5,1.0,0.0],1.0,createMaterial([1.0,0.0,0.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornament
createSphere([ 1.5,1.0,0.0],1.0,createMaterial([0.0,1.0,0.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornament
createSphere([0.0,1.0,-2.0],1.0,createMaterial([0.0,0.0,1.0],[0.8,0.3,0.5,0.0],50,1.0)),  // ornamemt
  ];
  // override home material sampler with sphere checker mapper
  objects[0].mtl.sampler = function (hit) {
    const u = Math.atan2(-hit.n[1],-hit.n[0]) / Math.PI / 2 + 0.5;
    const v = Math.asin(-hit.n[2]) / (Math.PI/2) / 2 + 0.5;
    const s = (u * 5000) & 1;
    const t = (v * 2500) & 1;
    const c = [[1,1,0],[1,0,1]];
    return c[s^t];
  };
  // override skybox material sampler with night stars
  objects[1].mtl.sampler = function (hit) {
    let c = Math.random();
    if (c >= 0.001) return [0,0,0];
    c *= 1000; return [c,c,c];
  };
  // override earth material sampler to use texture mapper
  const texture_unit0 = createTexture();
  loadTexture(texture_unit0,'./earth.png');
  objects[2].mtl.sampler = function (hit) {
    return sampleTexture(texture_unit0,hit.u,hit.v);
  };
  // override mars material sampler to use texture mapper
  const texture_unit1 = createTexture();
  loadTexture(texture_unit1,'./mars.png');
  objects[3].mtl.sampler = function (hit) {
    return sampleTexture(texture_unit1,hit.u,hit.v);
  };
  // override matte sphere material sampler to use checker texture map
  const texture_unit2 = createTexture();
  checkerTexture(texture_unit2,16,8,[0,0,0],[1,1,1]);
  objects[4].mtl.sampler = function (hit) {
    return sampleTexture(texture_unit2,hit.u,hit.v);
  };
  // sort objects based on surface area and distance from camera
  objects.sort(function (a,b) {
    const aa = a.surface_area / distance3D(origin,a.origin);
    const bb = b.surface_area / distance3D(origin,b.origin);
    return aa - bb;
  });

  const resource_list = [texture_unit0, texture_unit1, texture_unit2];
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
    const timestamp = Date.now();
    setTimeout(spanish,0,0);
    function spanish (y) {
      for (let x=0; x<canvas.width; x++) {
        const dist = [x-projW+0.5, projH-y-0.5, projD];
        const target = [
          origin[0] + axisX[0]*dist[0] + axisY[0]*dist[0] + axisZ[0]*dist[0],
          origin[1] + axisX[1]*dist[1] + axisY[1]*dist[1] + axisZ[1]*dist[1],
          origin[2] + axisX[2]*dist[2] + axisY[2]*dist[2] + axisZ[2]*dist[2]
        ];
        let ray = between3D(origin,target);
            ray = normal3D(ray);
        const rgb = intersectWorld(8,objects,origin,ray);
        const idx = (y * canvas.width + x) * 4;
        colorbuf.data[idx+0] = 255 * rgb[0];
        colorbuf.data[idx+1] = 255 * rgb[1];
        colorbuf.data[idx+2] = 255 * rgb[2];
        colorbuf.data[idx+3] = 255;
      }
      context.putImageData(colorbuf,0,0,0,y,canvas.width,1);
      if (y < canvas.height-1) setTimeout(spanish,0,y+1);
      else {
      //context.putImageData(colorbuf,0,0,0,0,canvas.width,canvas.height);
        const elapsed = Date.now() - timestamp;
        const message = 'build #' + build + ' (' + elapsed + 'ms)';
        context.font = '16px monospace';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#ffffff';
        context.fillText(message,0,0);
      }
    }
  }
}

function createIntersect () {
  return {t:Infinity, p:[], n:[], u:0, v:0, m:{}};
}

function intersectWorld (segs,objs,org,dir) {
  if (segs == 0) return [0,0,0];

  let hit_i = -1;
  let hit = createIntersect();
  for (let i=0; i<objs.length; i++) {
    const o = objs[i];
    const check = createIntersect();
    const t = o.intersect(o,org,dir,check);
    if (t < hit.t) {hit = check; hit_i=i;}
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
    const dot = dot3D(dir,hit.n);
    let cosi = -Math.max(-1, Math.min(1, dot));
    if (cosi < 0) { // from inside toward outside
      cosi = -cosi;
      norm = oppose3D(hit.n);
      eta = hit.m.refract_index;
    } else {
      norm = copy3D(hit.n);
      eta = 1 / hit.m.refract_index;
    }
    const k = 1 - eta*eta * (1 - cosi*cosi);
    if (k > 0) {
      const q = eta*cosi - Math.sqrt(k);
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
    reflect_color = scale3D(reflect_color,hit.m.albedo[2]);
  }

  let refract_color = [0,0,0];
  if (refract_len != 0) {
    refract_color = intersectWorld(segs-1,objs,hit.p,refract_dir);
    refract_color = scale3D(refract_color,hit.m.albedo[3]);
  }

  // no diffuse properties will bypass shader (full bright hack)
  let diffuse_intensity = 1;
  let specular_intensity = 0;
  if (hit.m.albedo[0] > 0) { // has diffuse properties
    diffuse_intensity = 0;
    const lights = [[5.0,10.0,5.0],[5.0,10.0,0.0]/*,[0.0,7.5,0.0],[-5.0,10.0,0.0]*/];
    let light_intensity = 50; // common (for now)
    for (let k=0; k<lights.length; k++) {
      const light = lights[k];
      let shadow_vec = between3D(hit.p,light);
      const light_mag = mag3D(shadow_vec);
      const light_len = Math.sqrt(light_mag);
      if (light_len != 0) shadow_vec = scale3D(shadow_vec,1/light_len);
      let shadow_dot = dot3D(shadow_vec,hit.n);
      if (shadow_dot <= 0) continue; // surface not facing light source
      for (let j=0; j<objs.length; j++) {
        if (j == hit_i) continue; // allow self intersect
        const o = objs[j];
        const t = o.intersect(o,hit.p,shadow_vec,null);
        if (t < light_len) {shadow_dot=0; break;} // occluded
      }
      if (shadow_dot == 0) continue;
      diffuse_intensity += light_intensity * shadow_dot / light_mag;
      if (hit.m.albedo[1] > 0) { // has specular properties
        const light_dir = oppose3D(shadow_vec);
        let light_ref = reflect3D(light_dir,hit.n);
            light_ref = normal3D(light_ref);
        const spec_dir = oppose3D(light_ref);
        const spec_dot = dot3D(dir,spec_dir);
        if (spec_dot > 0) specular_intensity += Math.pow(spec_dot,hit.m.specular_exponent);
      }
    }
    diffuse_intensity = Math.min(1,diffuse_intensity) * hit.m.albedo[0];
    specular_intensity = Math.min(1,specular_intensity) * hit.m.albedo[1];
  }

  const rgb = hit.m.sampler(hit);

  const diffuse_color = scale3D(rgb,diffuse_intensity);
  const specular_color = scale3D(rgb,specular_intensity);

  return [
    Math.min(1, diffuse_color[0] + specular_color[0] + reflect_color[0] + refract_color[0]),
    Math.min(1, diffuse_color[1] + specular_color[1] + reflect_color[1] + refract_color[1]),
    Math.min(1, diffuse_color[2] + specular_color[2] + reflect_color[2] + refract_color[2])
  ];
}

function createTexture () {
  return {width:0, height:0, texels:[], loaded:false};
}

function sampleTexture (texture,u,v) {
  const x = Math.max(0, Math.ceil(u * texture.width) - 1);
  const y = Math.max(0, Math.ceil(v * texture.height) - 1);
  const i = (y * texture.width + x) * 4;
  const r = texture.texels[i+0] / 255;
  const g = texture.texels[i+1] / 255;
  const b = texture.texels[i+2] / 255;
  return [r,g,b];
}

function checkerTexture (texture,width,height,color1,color2) {
  for (let y=0; y<height; y++) {
    for (let x=0; x<width; x++) {
      const i = (y * width + x) * 4;
      if ((x&1) ^ (y&1)) {
        texture.texels[i+0] = 255 * color2[0];
        texture.texels[i+1] = 255 * color2[1];
        texture.texels[i+2] = 255 * color2[2];
        texture.texels[i+3] = 255;
      } else {
        texture.texels[i+0] = 255 * color1[0];
        texture.texels[i+1] = 255 * color1[1];
        texture.texels[i+2] = 255 * color1[2];
        texture.texels[i+3] = 255;
      }
    }
  }
  texture.width = width;
  texture.height = height;
  texture.loaded = true;
}

function loadTexture (texture,src) {
  const image = new Image();
  image.onload = function (e) {
    const self = e.target;
    const width = e.target.width;
    const height = e.target.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
  //context.globalAlpha = 1.0;
    context.drawImage(self,0,0,width,height);
    const data = context.getImageData(0,0,width,height);
    texture.width = width;
    texture.height = height;
    texture.texels = data.data;
    texture.loaded = true;
  };
  image.src = src;
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
  const r2 = r * r;
  return {
    origin: o,
  //radius: r,
    r2: r2,
    mtl: m,
    surface_area: 4 * Math.PI * r2,
    intersect: intersectSphere
  };
}

function intersectSphere (obj,org,dir,ext) {
  let t = Infinity;
  const L = between3D(org,obj.origin);
  const tca = dot3D(dir,L);
  const d2 = mag3D(L) - tca*tca;
  if (d2 > obj.r2) return t;
  const thc = Math.sqrt(obj.r2 - d2);
  const t0 = tca - thc;
  const t1 = tca + thc;
  if (t0 > 0.001) t = t0;
  else if (t1 > 0.001) t = t1;
  if (ext != null) {
    ext.t = t;
    if (ext.t < Infinity) {
      ext.p = project3D(org,dir,ext.t);
      ext.n = between3D(obj.origin,ext.p);
      ext.n = normal3D(ext.n);
      // allow specular refract on bubble but not on glass (hollow vs solid refractors)
      if ((obj.mtl.refract_index == 1) && (t0<0.001 || t1<0.001)) ext.n = oppose3D(ext.n);
      ext.u = Math.atan2(-ext.n[2],-ext.n[0]) / Math.PI / 2 + 0.5;
      ext.v = Math.asin(-ext.n[1]) / (Math.PI/2) / 2 + 0.5;
      ext.m = obj.mtl;
    }
  }
  return t;
}
