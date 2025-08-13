function lchToLab(l, c, h) {
  const hr = (h * Math.PI) / 180;
  return [l, Math.cos(hr) * c, Math.sin(hr) * c];
}

function labToRgb(l, a, b) {
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;
  const pivot = t => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };
  x = pivot(x) * 95.047;
  y = pivot(y) * 100.0;
  z = pivot(z) * 108.883;
  x /= 100;
  y /= 100;
  z /= 100;
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b2 = x * 0.0557 + y * -0.2040 + z * 1.0570;
  const comp = c => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c);
  r = comp(r);
  g = comp(g);
  b2 = comp(b2);
  return [
    Math.max(0, Math.min(255, Math.round(r * 255))),
    Math.max(0, Math.min(255, Math.round(g * 255))),
    Math.max(0, Math.min(255, Math.round(b2 * 255)))
  ];
}

function rgbToHex(rgb) {
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function suggestColorMap(n = 5) {
  const colors = [];
  const light = 70;
  const chroma = 40;
  for (let i = 0; i < n; i++) {
    const h = (360 * i) / n;
    const [l, a, b] = lchToLab(light, chroma, h);
    colors.push(rgbToHex(labToRgb(l, a, b)));
  }
  return colors;
}

const CB_MATRICES = {
  protanopia: [
    [0.56667, 0.43333, 0],
    [0.55833, 0.44167, 0],
    [0, 0.24167, 0.75833]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.43333, 0.56667],
    [0, 0.475, 0.525]
  ]
};

function simulateColorBlindness(palette, type = 'none') {
  const m = CB_MATRICES[type];
  if (!m) return palette.slice();
  return palette.map(hex => {
    const [r, g, b] = hexToRgb(hex);
    const nr = r * m[0][0] + g * m[0][1] + b * m[0][2];
    const ng = r * m[1][0] + g * m[1][1] + b * m[1][2];
    const nb = r * m[2][0] + g * m[2][1] + b * m[2][2];
    return rgbToHex([
      Math.round(nr),
      Math.round(ng),
      Math.round(nb)
    ]);
  });
}

function PaletteNode() {
  this.addInput('count', 'number');
  this.addOutput('palette', 'array');
  this.addOutput('simulated', 'array');
  this.addProperty('count', 5);
  this.addProperty('blindness', 'none');
  this.addWidget('number', 'count', this.properties.count, v => (this.properties.count = Math.max(1, Math.round(v))));
  this.addWidget('combo', 'blind', this.properties.blindness, v => (this.properties.blindness = v), {
    values: ['none', 'protanopia', 'deuteranopia', 'tritanopia']
  });
  this.color = '#222';
  this.bgcolor = '#444';
}
PaletteNode.title = 'Palette';
PaletteNode.icon = '🎨';
PaletteNode.prototype.onExecute = function() {
  const n = this.getInputData(0) || this.properties.count;
  const palette = suggestColorMap(Math.max(1, Math.round(n)));
  this._palette = palette;
  this.setOutputData(0, palette);
  const type = this.properties.blindness;
  this.setOutputData(1, simulateColorBlindness(palette, type));
};
PaletteNode.prototype.onDrawForeground = function(ctx) {
  if (!this._palette) return;
  const top = LiteGraph.NODE_TITLE_HEIGHT + widgetAreaHeight(this);
  const w = this.size[0];
  const h = this.size[1] - top;
  const n = this._palette.length;
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = this._palette[i];
    ctx.fillRect(i * sw, top, sw, h);
  }
};
registerNode('perceptual/palette', PaletteNode);

