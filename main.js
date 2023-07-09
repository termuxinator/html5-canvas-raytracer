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

  let mtl0 = createMaterial([1.0,1.0,1.0],0.1,1.0,0.0,0.0,0.2);
  let mtl1 = createMaterial([1.0,0.0,0.0],0.1,1.0,0.0,0.0,0.0);
  let mtl2 = createMaterial([0.0,1.0,0.0],0.1,1.0,0.0,0.0,0.2);
  let mtl3 = createMaterial([0.0,0.0,1.0],0.0,1.0,0.0,0.0,1.0);
  let mtl4 = createMaterial([1.0,1.0,1.0],1.0,1.0,0.0,0.0,0.0);

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

        let ray = vec3_sub3(target,origin);
        let len = vec3_len(ray);
        if (len != 0) ray = vec3_mul1(ray,1/len);
    
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
  rgb[0] = Math.max(hit.o.mtl.a[0], hit.o.mtl.d[0] * intensity);
  rgb[1] = Math.max(hit.o.mtl.a[1], hit.o.mtl.d[1] * intensity);
  rgb[2] = Math.max(hit.o.mtl.a[2], hit.o.mtl.d[2] * intensity);

  // reflection

  let rt = -(2 * vec3_dot(dir,hit.n));
  let rv = vec3_at(dir,hit.n,rt);
  let rl = vec3_len(rv);
  if (rl != 0) rv = vec3_mul1(rv,1/rl);

  let ref = intersectObject(objs,hit.p,rv);
  if (ref.o == undefined) return rgb;

  let rgb2 = [];
  let intensity2 = lightPoint(objs,ref.p,ref.n);
  rgb2[0] = Math.max(ref.o.mtl.a[0], ref.o.mtl.d[0] * intensity2);
  rgb2[1] = Math.max(ref.o.mtl.a[1], ref.o.mtl.d[1] * intensity2);
  rgb2[2] = Math.max(ref.o.mtl.a[2], ref.o.mtl.d[2] * intensity2);

  return [
    Math.max(hit.o.mtl.a[0], Math.min(1, rgb[0] + rgb2[0] * hit.o.mtl.rf)),
    Math.max(hit.o.mtl.a[1], Math.min(1, rgb[1] + rgb2[1] * hit.o.mtl.rf)),
    Math.max(hit.o.mtl.a[2], Math.min(1, rgb[2] + rgb2[2] * hit.o.mtl.rf))
  ];
}

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
  let lv = vec3_sub3(light,p);
  let ll = vec3_len(lv);
  if (ll != 0) lv = vec3_mul1(lv,1/ll);
  let intensity = vec3_dot(n,lv);
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

function createMaterial (c,ai,di,si,sf,rf) {
  return {
    a: [c[0]*ai,c[1]*ai,c[2]*ai],
    d: [c[0]*di,c[1]*di,c[2]*di],
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
  let L = vec3_sub3(obj.origin,org);
  let tca = vec3_dot(L,dir);
  if (tca <= 0) return t;
  let d2 = vec3_mag(L) - tca*tca;
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
  hit.p = vec3_at(org,dir,t);
  hit.n = vec3_sub3(hit.p,obj.origin);
  let nl = vec3_len(hit.n);
  if (nl != 0) hit.n = vec3_mul1(hit.n,1/nl);
  return hit;
}

function vec3_at (o,v,t) {return[o[0]+v[0]*t,o[1]+v[1]*t,o[2]+v[2]*t];}
function vec3_len (v)   {return(Math.sqrt(vec3_mag(v)));}
function vec3_mag (v)   {return(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);}
function vec3_dot (a,b) {return(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]);}

function vec3_add3 (l,r) {return[l[0]+r[0],l[1]+r[1],l[2]+r[2]];}
function vec3_sub3 (l,r) {return[l[0]-r[0],l[1]-r[1],l[2]-r[2]];}

function vec3_mul1 (v,s) {return[v[0]*s,v[1]*s,v[2]*s];}
function vec3_div1 (v,s) {return[v[0]/s,v[1]/s,v[2]/s];}
