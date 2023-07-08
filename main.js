(function(){document.body.onload=main;})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = 256;
  canvas.height = 256;
//canvas.style.backgroundColor = '#555555';
  let context = canvas.getContext('2d');
  let colorbuf = context.createImageData(canvas.width,canvas.height);
  let timestamp = Date.now();
  let ipixel = 0;
  for (let y=0; y<canvas.height; y++) {
    for (let x=0; x<canvas.width; x++) {
      let f = ((x & 1) ^ (y & 1));
      let color = [f,f,f,1];
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
