function FuzzySet( name, valueNot, valueIS, shape, shapeAbove, plateauMin, plateauMax)
{
var min;
var max;
if (valueNot > valueIS){
max = valueNot;
min = valueNot - (valueNot - valueIS) * 2;
}
else
{
min = valueNot;
max = valueNot + (valueIS - valueNot) * 2;
}
if (typeof shape === "undefined") shape = "linear";
if (typeof shapeAbove === "undefined") shapeAbove = shape;
if (typeof plateauMin === "undefined") plateauMin = mean([min, max]);
if (typeof plateauMax === "undefined") plateauMax = mean([min, max]);
this.min = min;
this.max = max;
this.shapeIn = shape;
this.shapeOut = shapeAbove;
this.plateauMin = plateauMin;
this.plateauMax = plateauMax;
this.name = name;
}
FuzzySet.prototype = {
contains: function ( v, quantifier )
{
var val;
if (v instanceof FuzzyValue) val = v.crispify(false);
else val = v;
quantifier = getQuantifier(quantifier);
if (val >= this.plateauMin && val <= this.plateauMax)
{
return quantifier(1);
}
else if (val < this.plateauMin)
{
if (this.shapeIn === "constant")
{
return quantifier(1);
}
else if (this.shapeIn === "square")
{
var min = mean(this.plateauMin, this.min);
if (val >= min) return quantifier(1);
else return quantifier(0);
}
else if (this.shapeIn === "linear")
{
if (val < this.min) return quantifier(0);
else return quantifier( (val-this.min) / (this.plateauMin - this.min) );
}
else if (this.shapeIn === "sigmoid")
{
var mid = (this.plateauMin + this.min) / 2;
var rate = 6 / (this.plateauMin - this.min);
return quantifier(logistic(val, mid, 0, 1, rate));
}
else if (this.shapeIn === "gaussian")
{
var width = this.plateauMin - this.min;
return quantifier( gaussian( val, 0, 1, this.plateauMin, width));
}
else return quantifier(0);
}
else
{
if (this.shapeOut === "constant")
{
return quantifier(1);
}
else if (this.shapeOut === "square")
{
var max = mean(this.plateauMax, this.max);
if (val <= max) return quantifier(1);
else return quantifier(0);
}
else if (this.shapeOut === "linear")
{
if (val > this.max) return quantifier(0);
else return quantifier (1 - ((val - this.plateauMax ) / (this.max - this.plateauMax) ));
}
else if (this.shapeOut === "sigmoid")
{
var mid = (this.plateauMax + this.max) / 2;
var rate = 6 / (this.max - this.plateauMax);
return quantifier( 1 - logistic(val, mid, 0, 1, rate));
}
else if (this.shapeOut === "gaussian")
{
var width = this.max - this.plateauMax;
return quantifier( gaussian( val, 0, 1, this.plateauMax, width) );
}
else return quantifier(0);
}
},
getValues: function ( veracity )
{
if (typeof veracity === "undefined") veracity = 0.5;
if (veracity instanceof FuzzyVeracity) veracity = veracity.veracity;
var defaultValue = mean( [this.plateauMin, this.plateauMax] );
if ( this.shapeIn === "constant" && this.shapeOut === "constant" ) return [ this.min, this.plateauMin, defaultValue, this.plateauMax, this.max];
var crisp = [];
if (veracity >= 1) crisp = [this.plateauMin, defaultValue, this.plateauMax];
if (this.shapeIn === "constant" && veracity == 1)
{
crisp.push(this.min);
}
else if (this.shapeIn === "square")
{
if (veracity >= 0.5) crisp.push( this.plateauMin );
else crisp.push( this.min );
}
else if (this.shapeIn === "linear")
{
range = this.plateauMin - this.min;
crisp.push( this.min + range * veracity );
}
else if (this.shapeIn === "sigmoid")
{
mid = (this.plateauMin + this.min) / 2;
crisp.push( inverseLogistic(veracity, mid) );
}
else if (this.shapeIn === "gaussian")
{
var width = this.plateauMin - this.min;
var g = inverseGaussian( veracity, 0, 1, this.plateauMin, width);
crisp.push( g[0] );
}
if (this.shapeOut === "constant" && veracity == 1)
{
crisp.push(this.max);
}
if (this.shapeOut === "square")
{
if (veracity >= 0.5) crisp.push( this.plateauMax );
else crisp.push( this.max );
}
else if (this.shapeOut === "linear")
{
range = this.max - this.plateauMax;
crisp.push( this.max + 1 - (range * veracity) );
}
else if (this.shapeOut === "sigmoid")
{
mid = (this.plateauMax + this.max) / 2;
crisp.push( inverseLogistic( 1-veracity, mid, 0, 1 ) );
}
else if (this.shapeOut === "gaussian")
{
width = this.max - this.plateauMax;
var g = inverseGaussian( 1-veracity, 0, 1, this.plateauMax, width);
crisp.push( g[1] );
}
for(var i = 0, num = crisp.length; i < num; i++)
{
if ( crisp[i] > this.max ) crisp[i] = this.max;
if ( crisp[i] < this.min ) crisp[i] = this.min;
}
return crisp.sort();
},
crispify: function ( quantifier, veracity )
{
quantifier = getQuantifier(quantifier);
var v;
if (typeof veracity === "undefined") v = quantifier();
else if (veracity instanceof FuzzyVeracity) v = veracity.veracity;
else v = veracity;
v = quantifier(v, true).veracity;
return this.getValues( v );
}
};
function FuzzyValue( val )
{
if (typeof unit === "undefined") unit = "";
if (typeof val === "undefined") val = 0;
this.val = val;
this.sets = [];
this.report = [];
this.reportEnabled = false;
this.numRules = 0;
}
FuzzyValue.prototype = {
IS: function(fuzzyset, quantifier)
{
var v = fuzzyset.contains( this, quantifier );
return v;
},
IS_NOT: function (fuzzyset, quantifier)
{
var x = fuzzyset.contains( this.val, quantifier );
return x.NEGATE();
},
SET: function ( fuzzyset,  quantifier, v )
{
if (typeof v === "undefined") v = new FuzzyVeracity(1);
quantifier = getQuantifier(quantifier);
this.numRules++;
v.ruleNum = this.numRules;
for (var i = 0, num = this.sets.length; i < num; i++)
{
if (fuzzyset.name == this.sets[i].name)
{
this.sets[i].quantifiers.push(quantifier);
this.sets[i].veracities.push(v);
return;
}
}
fuzzyset.quantifiers = [quantifier];
fuzzyset.veracities = [v];
this.sets.push( fuzzyset );
},
crispify: function ( clearSets )
{
if (typeof clearSets === "undefined") clearSets = true;
if (this.sets.length == 0) return this.val;
var crisp = 0;
this.report = [];
function ruleSorter(a, b)
{
return a.number - b.number;
}
var sumWeights = 0;
for (var i = 0, num = this.sets.length; i < num; i++)
{
var fuzzyset = this.sets[i];
for( var j = 0, numV = fuzzyset.veracities.length; j < numV; j++)
{
var v = fuzzyset.veracities[j];
var q = fuzzyset.quantifiers[j];
var vals = fuzzyset.crispify( q, v );
var val;
var ver;
val = mean(vals);
crisp += val * v.veracity;
ver = v.veracity;
sumWeights += ver;
if (this.reportEnabled)
{
for (var iVals = 0, numVals = vals.length; iVals < numVals; iVals++)
{
vals[iVals] = Math.round(vals[iVals]*1000)/1000;
}
var reportRule = [];
reportRule.push( "Rule #" + v.ruleNum +": Set " + fuzzyset.toString() + " (" + q.toString() + ")" );
reportRule.push( "Gives val: " + Math.round(val*1000)/1000 + " from these values: [ " + vals.join(", ") + " ]");
reportRule.push( "With a veracity of: " + Math.round(ver*1000)/1000 );
reportRule.number = v.ruleNum;
this.report.push( reportRule );
}
}
}
if (sumWeights != 0) crisp = crisp / sumWeights;
if (this.reportEnabled) this.report.sort(ruleSorter);
if (clearSets)
{
this.val = crisp;
this.sets = [];
}
return crisp;
},
toNumber: this.crispify,
toFloat: this.crispify,
defuzzify: this.crispify
};
function FuzzyVeracity( veracity )
{
if (typeof above === "undefined") above = false;
this.veracity = veracity;
}
FuzzyVeracity.prototype = {
NEGATE: function()
{
return new FuzzyVeracity( 1 - this.veracity );
},
AND: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = Math.min(x, y);
return new FuzzyVeracity( v );
},
OR: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = Math.max(x, y);
return new FuzzyVeracity( v );
},
XOR: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = x+y - 2*Math.min(x,y);
return new FuzzyVeracity( v );
},
IS_NOT: this.XOR,
DIFFERENT: this.XOR,
NXR: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = 1-x-y + 2*Math.min(x,y);
return new FuzzyVeracity( v );
},
IS: this.NXR,
EQUALS: this.NXR,
IMPLIES: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = 1-Math.min(x, 1-y);
return new FuzzyVeracity( v );
},
WITH: this.IMPLIES,
HAS: this.IMPLIES,
DOES_NOT_IMPLY: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = Math.min(x, 1-y);
return new FuzzyVeracity( v );
},
WITHOUT: this.DOES_NOT_IMPLY,
DOES_NOT_HAVE: this.DOES_NOT_IMPLY,
NAND: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = 1 - Math.min(x, y);
return new FuzzyVeracity( v );
},
NOT_BOTH: this.NAND,
NOR: function( other )
{
var x = this.veracity;
var y = other.veracity;
var v = 0;
v = 1 - Math.max(x, y);
return new FuzzyVeracity( v );
},
NONE: this.NOR,
WEIGHTED: function( other, weight )
{
var x = this.veracity;
var y = other.veracity;
var v = (1-w)*x +  w*y;
return new FuzzyVeracity( v );
}
};
function FuzzyLogic( )
{
this.veracity = new FuzzyVeracity(0);
}
FuzzyLogic.prototype = {
newValue: function (val, unit)
{
return new FuzzyValue( val, unit );
},
newVeracity: function (veracity)
{
return new FuzzyVeracity(veracity);
},
newSet: function ( name, extremeValue, referenceValue, shape, shapeAbove, plateauMin, plateauMax)
{
return new FuzzySet(name, extremeValue, referenceValue, shape, shapeAbove, plateauMin, plateauMax);
},
IF: function ( veracity )
{
this.veracity = veracity;
return veracity;
},
THEN: function ( val, fuzzyset, quantifier )
{
val.SET(fuzzyset, quantifier, this.veracity);
}
};
function getQuantifier( name )
{
if (typeof name === "undefined") name = "moderately";
if (name == "not" || name == "less") {
function qObj (v, inverse) {
if (typeof v === "undefined") return 0;
var p = inverse ? 0 : 1;
return new FuzzyVeracity( p );
}
return qObj;
}
if (name == "slightly") return createQuantifier( 1/3 );
if (name == "somewhat") return createQuantifier( 0.5 );
if (name == "moderately") return createQuantifier( 1 );
if (name == "very") return createQuantifier( 2 );
if (name == "extremely") return createQuantifier( 3 );
function qObj (v, inverse) {
if (typeof v === "undefined") return 1;
var p = inverse ? 1 : 0;
return new FuzzyVeracity( p );
}
return qObj;
}
function createQuantifier( q )
{
function qObj (v, inverse) {
if (typeof v === "undefined") return Math.pow( 0.5, 1/q);
var p = inverse ? 1/q : q;
return new FuzzyVeracity( Math.pow(v, p) );
}
return qObj;
}
function bezierInterpolation(t, tMin, tMax, value1, value2, bezierPoints) {
if (arguments.length !== 5 && arguments.length !== 6) return t;
var a = value2 - value1;
var b = tMax - tMin;
if (b == 0) return t;
var c = clamp((t - tMin) / b, 0, 1);
if (!(bezierPoints instanceof Array) || bezierPoints.length !== 4) bezierPoints = [0.33,0.0,0.66,1];
return a * h(c, bezierPoints) + value1;
function h(f, g) {
var x = 3 * g[0];
var j = 3 * (g[2] - g[0]) - x;
var k = 1 - x - j;
var l = 3 * g[1];
var m = 3 * (g[3] - g[1]) - l;
var n = 1 - l - m;
var d = f;
for (var i = 0; i < 5; i++) {
var z = d * (x + d * (j + d * k)) - f;
if (Math.abs(z) < 1e-3) break;
d -= z / (x + d * (2 * j + 3 * k * d));
}
return d * (l + d * (m + d * n));
}
}
function gaussianInterpolation( t, tMin, tMax, value1, value2, rate )
{
if (t != tMin)
{
var newValue1 = gaussianInterpolation( tMin, tMin, tMax, value1, value2, rate );
var offset = newValue1 - value1;
value1 = value1 - offset;
}
if (rate < 0) rate = rate*10;
rate = linear(t, tMin, tMax, 0.25, rate);
var r = ( 1 - rate );
var fwhm = (tMax-tMin) * r;
var center = tMax;
if (t >= tMax) return value2;
if (fwhm === 0 && t == center) return value2;
else if (fwhm === 0) return value1;
var exp = -4 * Math.LN2;
exp *= Math.pow((t - center),2);
exp *= 1/ Math.pow(fwhm, 2);
var result = Math.pow(Math.E, exp);
result = result * (value2-value1) + value1;
return result;
}
function getNextKey(t) {
if (numKeys == 0) return null;
var nKey = nearestKey(t);
if (nKey.time >= t) return nKey;
if (nKey.index < numKeys) return key(nKey.index + 1);
return null;
}
function getPrevKey(t) {
if (numKeys == 0) return null;
var nKey = nearestKey(t);
if (nKey.time <= t) return nKey;
if (nKey.index > 1) return key(nKey.index - 1);
return null;
}
function isAfterLastKey() {
if (numKeys == 0) return false;
var nKey = nearestKey(time);
return nKey.time <= time && nKey.index == numKeys;
}
function gaussian( value, min, max, center, fwhm)
{
if (fwhm === 0 && value == center) return max;
else if (fwhm === 0) return 0;
var exp = -4 * Math.LN2;
exp *= Math.pow((value - center),2);
exp *= 1/ Math.pow(fwhm, 2);
var result = Math.pow(Math.E, exp);
return result * (max-min) + min;
}
function inverseGaussian ( v, min, max, center, fwhm)
{
if (v == 1) return [center, center];
if (v === 0) return [center + fwhm/2, center - fwhm/2];
if (fwhm === 0) return [center, center];
var result = (v-min)/(max-min);
result = Math.log( result ) * Math.pow(fwhm,2);
result = result / ( -4 * Math.LN2 );
result = Math.sqrt( result );
return [ result + center, -result + center ];
}
function inverseLogistic ( v, midValue, min, max, rate)
{
if (v == min) return 0;
return midValue - Math.log( (max-min)/(v-min) - 1) / rate;
}
function logistic( value, midValue, min, max, rate)
{
var exp = -rate*(value - midValue);
var result = 1 / (1 + Math.pow(Math.E, exp));
return result * (max-min) + min;
}
function mean( values )
{
var num = values.length;
var result = 0;
for (var i = 0; i < num; i++)
{
result += values[i];
}
return result / num;
}
if (typeof Math.sign === 'undefined') Math.sign = function(x) { return ((x > 0) - (x < 0)) || +x; };
function checkDuikEffect(fx, duikMatchName) {
if (fx.numProperties  < 3) return false;
if (!!$.engineName) {
if ( fx(2).name != duikMatchName ) return false;
}
else {
try { if (fx(2).name != duikMatchName) return false; }
catch (e) { return false; }
}
return true;
}
function checkEffect(fx, propIndex, propName) {
if (fx.numProperties  < propIndex) return false;
if (!!$.engineName) {
if ( fx(propIndex).name != propName ) return false;
}
else {
try { if (fx(propIndex).name != propName) return false; }
catch (e) { return false; }
}
return true;
}
function getEffectLayer( fx, ind ) {
try { var l = fx( ind ); return l; }
catch ( e ) { return null; }
}
function isLayer( prop ) {
try { if ( prop.index ) return true; }
catch (e) { return false; }
}
function isPosition(prop) {
return  prop === position;
}
function isSpatial(prop) {
if (!(prop.value instanceof Array)) return false;
if (prop.value.length != 2 && prop.value.length != 3) return false;
try { if (typeof prop.speed !== "undefined") return true; }
catch (e) { return false; }
}
function isStill(t, threshold) {
var d = valueAtTime(t) - valueAtTime(t + framesToTime(1));
if (d instanceof Array) {
for (var i = 0; i < d.length; i++) {
d[i] = Math.abs(d[i]);
if (d[i] >= threshold) {
return false;
}
}
return true;
} else {
d = Math.abs(d);
return d < threshold;
}
}
function addNoise( val, quantity ) {
var randomValue = random(0.9,1.1);
var noiseValue = noise(valueAtTime(0) * randomValue);
noiseValue = noiseValue * (quantity / 100);
return val * ( noiseValue + 1 );
}
function dishineritRotation( l ) {
var r = l.rotation.value;
while ( l.hasParent ) {
l = l.parent;
var s = l.scale.value;
r -= l.rotation.value * Math.sign(s[0]*s[1]);
}
return r;
}
function dishineritScale( l ) {
var s = l.scale.value;
var threeD = s.length == 3;
while ( l.hasParent ) {
l = l.parent;
var ps = l.scale.value / 100;
if (threeD && ps.length == 3) {
s = [ s[0]/ps[0], s[1]/ps[1], s[2]/ps[2] ];
}
else if (threeD) {
s = [ s[0]/ps[0], s[1]/ps[1], s[2] ];
}
else {
s = [ s[0]/ps[0], s[1]/ps[1] ];
}
}
return s;
}
function fromGroupToLayer( point ) {
var matrix = getGroupTransformMatrix();
return matrix.applyToPoint( point );
}
function fromLayerToGroup( point ) {
var matrix = getGroupTransformMatrix().inverse();
return matrix.applyToPoint( point );
}
function getCompScale( l, t ) {
var originalWidth = length( l.anchorPoint, [ l.width, 0 ] );
var anchorInComp = l.toComp( l.anchorPoint, t );
var widthInComp = l.toComp( [ l.width, 0 ], t );
var newWidth = length(anchorInComp, widthInComp);
return newWidth / originalWidth;
}
function getGroupTransformMatrix( prop ) {
var matrix = new Matrix();
var shapeGroups = [];
var parentProp = prop.propertyGroup(1);
while( parentProp && !isLayer(parentProp) )
{
try { if ( parentProp.transform ) shapeGroups.push( parentProp.transform ); }
catch (e) {}
parentProp = parentProp.propertyGroup(1);
}
for (var i = shapeGroups.length - 1; i >= 0; i--)
{
var group = shapeGroups[i];
matrix.translate( group.position.value );
matrix.rotate( group.rotation.value );
var aPX = -( group.anchorPoint.value[ 0 ] * group.scale.value[ 0 ] / 100 );
var aPY = -( group.anchorPoint.value[ 1 ] * group.scale.value[ 1 ] / 100 );
matrix.translate( [ aPX, aPY ] );
matrix.scale( group.scale.value / 100 );
}
return matrix;
}
function getLayerCompPos( t, l ) {
return l.toComp( l.anchorPoint, t );
}
function getLayerWorldPos(t, l) {
return l.toWorld(l.anchorPoint, t);
}
function getLayerWorldSpeed(t, l) {
return length(getWorldVelocity(t, l));
}
function getLayerWorldVelocity(t, l) {
return (getLayerWorldPos(t, l) - getLayerWorldPos(t - 0.01, l)) * 100;
}
function getOrientation( l ) {
var sign = getScaleMirror( l );
var uTurn = getScaleUTurn( l )
var r = l.rotation.value * sign + uTurn;
while ( l.hasParent ) {
l = l.parent;
var lr = l.rotation.value;
if (l.hasParent) {
var s = l.parent.scale.value;
lr *= Math.sign(s[0]*s[1]);
}
r += lr;
}
return r;
}
function getScaleMirror( l ) {
var sign = 1;
while (l.hasParent) {
l = l.parent;
var s = l.scale.value;
sign *= Math.sign(s[0]*s[1]);
}
return sign;
}
function getScaleUTurn( l ) {
var u = 1;
while (l.hasParent) {
l = l.parent;
var s = l.scale.value;
u = u*s[1];
}
if (u < 0) return 180;
else return 0;
}
function getOrientationAtTime( l, t ) {
var r = 0;
r += l.rotation.valueAtTime( t );
while ( l.hasParent ) {
l = l.parent;
r += l.rotation.valueAtTime( t );
}
return r;
}
function getPropWorldSpeed(t, prop) {
return length(getPropWorldVelocity(t, prop));
}
function getPropWorldValue(t, prop) {
if (isPosition(prop)) return getLayerWorldPos(t, thisLayer);
return thisLayer.toWorld(prop.valueAtTime(t), t);
}
function getPropWorldVelocity(t, prop) {
return (getPropWorldValue(t + 0.005, prop) - getPropWorldValue(t - 0.005, prop)) * 100;
}
function getScale( l ) {
var s = l.scale.value;
var threeD = s.length == 3;
while ( l.hasParent ) {
l = l.parent;
var ps = l.scale.value / 100;
if (threeD && ps.length == 3) {
s = [ s[0]*ps[0], s[1]*ps[1], s[2]*ps[2] ];
}
else if (threeD) {
s = [ s[0]*ps[0], s[1]*ps[1], s[2] ];
}
else {
s = [ s[0]*ps[0], s[1]*ps[1] ];
}
}
return s;
}
function Matrix() {
/*!
2D Transformation Matrix v2.7.5 LT
(c) Epistemex.com 2014-2018
License: MIT
*/
var me = this, _el;
me._t = me.transform;
me.a = me.d = 1;
me.b = me.c = me.e = me.f = 0;
}
Matrix.prototype = {
rotate: function(angle) {
angle = degreesToRadians(angle);
var
cos = Math.cos(angle),
sin = Math.sin(angle);
return this._t(cos, sin, -sin, cos, 0, 0)
},
rotateFromVector: function(x, y) {
return this.rotate(typeof x === "number" ? Math.atan2(y, x) : Math.atan2(x.y, x.x))
},
scale: function(s) {
return this._t(s[0], 0, 0, s[1], 0, 0);
},
shear: function(sx, sy) {
return this._t(1, sy, sx, 1, 0, 0)
},
skew: function(ax, ay) {
return this.shear(Math.tan(ax), Math.tan(ay))
},
setTransform: function(a, b, c, d, e, f) {
var me = this;
me.a = a;
me.b = b;
me.c = c;
me.d = d;
me.e = e;
me.f = f;
return me._x()
},
translate: function(t) {
return this._t(1, 0, 0, 1, t[0], t[1]);
},
transform: function(a2, b2, c2, d2, e2, f2) {
var
me = this,
a1 = me.a,
b1 = me.b,
c1 = me.c,
d1 = me.d,
e1 = me.e,
f1 = me.f;
/* matrix column order is:
*	a c e
*	b d f
*	0 0 1
*/
me.a = a1 * a2 + c1 * b2;
me.b = b1 * a2 + d1 * b2;
me.c = a1 * c2 + c1 * d2;
me.d = b1 * c2 + d1 * d2;
me.e = a1 * e2 + c1 * f2 + e1;
me.f = b1 * e2 + d1 * f2 + f1;
return me._x()
},
multiply: function(m) {
return this._t(m.a, m.b, m.c, m.d, m.e, m.f)
},
inverse: function(cloneContext) {
var
me = this,
m  = new Matrix(cloneContext ? me.context : null),
dt = me.determinant();
if (dt === 0) throw "Matrix not invertible.";
m.a = me.d / dt;
m.b = -me.b / dt;
m.c = -me.c / dt;
m.d = me.a / dt;
m.e = (me.c * me.f - me.d * me.e) / dt;
m.f = -(me.a * me.f - me.b * me.e) / dt;
return m
},
decompose: function() {
var
me		= this,
a		 = me.a,
b		 = me.b,
c		 = me.c,
d		 = me.d,
acos	  = Math.acos,
atan	  = Math.atan,
sqrt	  = Math.sqrt,
pi		= Math.PI,
translate = {x: me.e, y: me.f},
rotation  = 0,
scale	 = {x: 1, y: 1},
skew	  = {x: 0, y: 0},
determ	= a * d - b * c,
r, s;
if (a || b) {
r = sqrt(a * a + b * b);
rotation = b > 0 ? acos(a / r) : -acos(a / r);
scale = {x: r, y: determ / r};
skew.x = atan((a * c + b * d) / (r * r));
}
else if (c || d) {
s = sqrt(c * c + d * d);
rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s));
scale = {x: determ / s, y: s};
skew.y = atan((a * c + b * d) / (s * s));
}
else {
scale = {x: 0, y: 0};
}
return {
translate: translate,
rotation : rotation,
scale	: scale,
skew	 : skew
}
},
determinant: function() {
return this.a * this.d - this.b * this.c
},
applyToPoint: function(pt) {
var me = this;
var x = pt[0] * me.a + pt[1] * me.c + me.e;
var y = pt[0] * me.b + pt[1] * me.d + me.f;
var result = [x,y];
if (pt.length == 3) result.push(pt[2]);
return result;
},
isIdentity: function() {
var me = this;
return me.a === 1 && !me.b && !me.c && me.d === 1 && !me.e && !me.f
},
isInvertible: function() {
return !this._q(this.determinant(), 0)
},
isValid: function() {
return !(this.a * this.d)
},
isEqual: function(m) {
var
me = this,
q = me._q;
return  q(me.a, m.a) &&
q(me.b, m.b) &&
q(me.c, m.c) &&
q(me.d, m.d) &&
q(me.e, m.e) &&
q(me.f, m.f)
},
clone: function(noContext) {
return new Matrix(noContext ? null : this.context).multiply(this)
},
_q: function(f1, f2) {
return Math.abs(f1 - f2) < 1e-14
},
_x: function() {
var me = this;
try { if (me.context)
me.context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
} catch(e) {}
return me
}
};
function translatePointWithLayer( l, point, startT, endT ) {
try {
var pos = l.fromWorld( point, startT );
} catch ( e ) {
var pos = [ 0, 0 ];
}
var prevPos = l.toWorld( pos, startT );
var newPos = l.toWorld( pos, endT );
return newPos - prevPos;
}
