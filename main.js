(function(){document.body.onload=main;})();

function main () {
  let canvas = document.getElementById('canvasID');
  canvas.width = 256;
  canvas.height = 256;
  canvas.style.backgroundColor = '#000000';
  let context = canvas.getContext('2d');
  context.font = '16px monospace';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillStyle = '#ffffff';
  context.fillText('Hello World!',16,16);
}
