(function(){document.body.onload=main;})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = 256;
  canvas.height = 256;
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

  let timestamp = Date.now();
  let ipixel = 0;
  for (let y=0; y<canvas.height; y++) {
    for (let x=0; x<canvas.width; x++) {
      let nextX = x - projW + 0.5;
      let nextY = projH - y - 0.5;
      let nextZ = projD;

      let target = [
        origin[0] + axisX[0]*nextX + axisX[1]*nextY + axisX[2]*nextZ,
        origin[1] + axisY[0]*nextX + axisY[1]*nextY + axisY[2]*nextZ,
        origin[2] + axisZ[0]*nextX + axisZ[1]*nextY + axisZ[2]*nextZ
      ];

      let ray = [
        target[0] - origin[0],
        target[1] - origin[1],
        target[2] - origin[2]
      ];

      let len = Math.sqrt(ray[0]*ray[0] + ray[1]*ray[1] + ray[2]*ray[2]);
      if (len != 0) {ray[0]/=len; ray[1]/=len; ray[2]/=len;}
    
      let color = intersectWorld(origin,ray);
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

function intersectWorld (org,dir) {
  let r = Math.abs(dir[0]);
  let g = Math.abs(dir[1]);
  let b = 0;
  let a = 1;
  return [r,g,b,a];
}
