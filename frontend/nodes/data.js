function TitanicNode() {
  this.addOutput('data', 'array');
  this.addProperty('limit', 5);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'limit', this.properties.limit, v => (this.properties.limit = v), { min: 1, max: 50, step: 1, precision: 0 });
}
TitanicNode.title = 'Titanic Sample';
TitanicNode.icon = '🚢';
TitanicNode.prototype.onExecute = async function() {
  if (this._pending) return;
  this._pending = true;
  try {
    const limit = Math.round(this.properties.limit);
    const res = await fetch(`http://localhost:8000/passengers?limit=${limit}`);
    const data = await res.json();
    this.setOutputData(0, data);
  } catch (err) {
    console.error(err);
  } finally {
    this._pending = false;
  }
};
registerNode('data/titanic', TitanicNode);

function RandomDataNode() {
  this.addOutput('data', 'array');
  this.addProperty('count', 10);
  this.addProperty('min', 0);
  this.addProperty('max', 1);
  this.color = '#222';
  this.bgcolor = '#444';
  this.addWidget('slider', 'count', this.properties.count, v => (this.properties.count = v), { min: 1, max: 100, step: 1, precision: 0 });
  this.addWidget('slider', 'min', this.properties.min, v => (this.properties.min = v), { min: -100, max: 100, step: 1 });
  this.addWidget('slider', 'max', this.properties.max, v => (this.properties.max = v), { min: -100, max: 100, step: 1 });
}
RandomDataNode.title = 'Random Data';
RandomDataNode.icon = '🎲';
RandomDataNode.prototype.onExecute = function() {
  const { count, min, max } = this.properties;
  const data = Array.from({ length: Math.round(count) }, () => Math.random() * (max - min) + min);
  this.setOutputData(0, data);
};
registerNode('data/random', RandomDataNode);

