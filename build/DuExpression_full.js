undefined/**
 * Adds some noise to a value.<br />
 * You may use seedRandom() before using this function as it will influence the generated noise.
 * A timeless noise can be achieved with <code>seedRandom(index,true)</code> for example.
 * @function
 * @param {number|number[]} val The value to add noise to.
 * @param {float} quantity The quantity of noise. A percentage. 100 means the value can range from (val * 0) to (val * 2).
 * @example
 * seedRandom(index, true) // a timeless noise
 * addNoise(value, 50 ); // the property value will have noise between (value * 0.5) and (value * 1.5) which won't vary through time.
 * @example
 * seedRandom(index, false);
 * addNoise(value, 33 ); // the noise will change at each frame, varying between (value * .66) and (value * 1.33)
 */
function addNoise( val, quantity ) {
  // a true random value to make sure all properties have a differente noise
  // even with the same start value
  var randomValue = random(0.9,1.1);
  // generate a noise from the start value
  // (which means properties with a similar value won't be to far away from each other)
  var noiseValue = noise(valueAtTime(0) * randomValue);
  noiseValue = noiseValue * (quantity / 100);
  return val * ( noiseValue + 1 );
}

/**
 * Interpolates a value with a bezier curve.<br />
 * This method can replace <code>linear()</code> and <code>ease()</code> with a custom b�zier interpolation.
 * @function
 * @param {number} value The value to interpolate
 * @param {number} [fromMin=0] The minimum for the interpolated value
 * @param {number} [fromMax=1] The maximum for the interpolated value
 * @param {number} [toMin=0] The minimum the value can take
 * @param {number} [toMax=1] The maximum the value can take
 * @param {number[]} [bezierPoints] an Array of 4 coordinates wihtin the 0.0 ... 1.0 range which describes the B�zier interpolation.<br />
 * [ outTangentX, outTangentY, inTangentX, inTangentY ]
 * @return {number} the value.
 */
function bezier(t, tMin, tMax, value1, value2, bezierPoints) {
    if (arguments.length !== 6) return value;
    var a = value2 - value1;
    var b = tMax - tMin;
    if (b == 0) return t;
    var c = clamp((t - tMin) / b, 0, 1);
    if (!(bezierPoints instanceof Array) || bezierPoints.length !== 4) bezierPoints = [0, 0, 1, 1];
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


/**
 * Checks the type of a pseudo-effect used by Duik.<br />
 * This is a workaround for the missing matchName in expressions.<br />
 * Pseudo-Effects used by Duik start with a hidden property which name is the same as the matchName of the effect itself (without the 'Pseudo/' part).
 * @function
 * @example
 * if ( checkEffect(thisLayer.effect(1), "DUIK parentConstraint2") ) { "This is the second version of the parent constraint by Duik" }
 * else { "Who knows what this is?" }
 * @param {Property} fx The effect to check
 * @param {string} duikMatchName The matchName of a pseudo-effect used by Duik (without the 'Pseudo/' part)
 * @return {boolean} True when the property at propIndex is named propName
 */
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

/**
 * Checks the type of an effect.<br />
 * This is a workaround for the missing matchName in expressions.<br />
 * It checks if the given effect has a specific property at a specific index.
 * @function
 * @example
 * if ( checkEffect(thisLayer.effect(1), 1, "Blur") ) { "The first effect is a blur!" }
 * else { "Who knows what this is?" }
 * @param {Property} fx The effect to check
 * @param {int} propIndex The index of the property
 * @param {string} propName The expected name of the property. Be careful with the internationalization of After Effects...
 * @return {boolean} True when the property at propIndex is named propName
 */
function checkEffect(fx, propIndex, propName) {
    if (fx.numProperties  < propIndex) return false;
    //Check when this is a javascript engine (without try/catch for better performance)
    if (!!$.engineName) {
        if ( fx(propIndex).name != propName ) return false;
    }
    //Check with the extendscript engine
    else {
        try { if (fx(propIndex).name != propName) return false; }
        catch (e) { return false; }
    }
    return true;
}

/**
 * Removes the ancestors rotation from the rotation of a layer.
 * This is very useful to make a layer keep its orientation without being influenced by its parents.
 * @function
 * @example
 * //in a rotation property, just include the function and use:
 * dishineritRotation();
 * //the layer will now keep its own orientation.
 * @example
 * //you can also combine the result with something else
 * var result = dishineritRotation();
 * result + wiggle(5,20);
 * @function
 * @param {Layer} [l=thisLayer] The layer
 * @return {float} The new rotation value, in degrees.
 */
function dishineritRotation( l ) {
    if (typeof l === "undefined") l = thisLayer;
    var r = l.rotation.value;
    while ( l.hasParent ) {
        l = l.parent;
        r -= l.rotation.value;
    }
    return r;
}

/**
 * Converts the point coordinates from the current group in the shape layer to the Layer.<br />
 * Use toWorld and toComp with the result if you need te coordinates in the world or the comp.
 * @function
 * @param {number[]} point The 2D coordinates of the point in the current group.
 * @return {number[]} The 2D coordinates of the point in the Layer.
 * @requires isLayer
 * @requires Matrix
 * @requires getGroupTransformMatrix
 */
function fromGroupToLayer( point ) {
    var matrix = getGroupTransformMatrix();
    return matrix.applyToPoint( point );
}

/**
 * Converts the point coordinates from Layer to the current group in the shape layer.<br />
 * Use fromWorld or fromComp first if you need to convert from the world or composition coordinates, and pass the result to this function.
 * @function
 * @param {number[]} point The 2D coordinates of the point in the Layer.
 * @return {number[]} The 2D coordinates of the point in the current group.
 * @requires isLayer
 * @requires Matrix
 * @requires getGroupTransformMatrix
 */
function fromLayerToGroup( point ) {
    var matrix = getGroupTransformMatrix().inverse();
    return matrix.applyToPoint( point );
}

/**
 * Gets the "real" scale of a layer, resulting to its scale property, the scale of its parents, and it's location in Z-space if it's 3D.
 * @function
 * @param {Layer} [l=thisLayer] The layer 
 * @param {number} [t=time] The time when to get the scale
 * @return {number} The scale ratio. This is not a percent, 1.0 is 100%.
 */
function getCompScale( l, t ) {
	if (typeof l === "undefined") l = thisLayer;
	if (typeof t === "undefined") t = time;
	
	//get ratio 
	var originalWidth = length( l.anchorPoint, [ l.width, 0 ] );
	var anchorInComp = l.toComp( l.anchorPoint, t );
	var widthInComp = l.toComp( [ l.width, 0 ], t );
	var newWidth = length(anchorInComp, widthInComp);
	return newWidth / originalWidth;
}

/**
 * Gets a layer from a layer property in an effect, without generating an error if "None" is selected with the Legacy expression engine.
 * @function
 * @param {Property} fx The effect
 * @param {int|string} ind The index or the name of the property
 * @return {Layer|null} The layer, or null if set to "None"
 */
function getEffectLayer( fx, ind ) {
	try { var l = fx( ind ); return l; }
	catch ( e ) { return null; }	
}

/**
 * Gets the transformation Matrix for the current group in a shape layer, including the transformation from the ancestor groups
 * @function
 * @param {Property} [prop=thisProperty] The property from which to get the matrix
 * @return {Matrix} The 2D Transform Matrix.
 * @requires isLayer
 * @requires Matrix
 */
function getGroupTransformMatrix( prop ) {
	if (typeof group === "undefined") prop = thisProperty;
    // A Matrix to apply group transforms
    var matrix = new Matrix();

	// Get all groups from this propperty
	var shapeGroups = [];
	var parentProp = prop.propertyGroup(1);
	while( parentProp && !isLayer(parentProp) )
	{
		//try catch is needed for the legacy expression engine
		try { if ( parentProp.transform ) shapeGroups.push( parentProp.transform ); }
		catch (e) {}
		parentProp = parentProp.propertyGroup(1);
	}
	
	for (var i = shapeGroups.length - 1; i >= 0; i--)
	{
		var group = shapeGroups[i];

		// position
		matrix.translate( group.position.value );
		// rotation
		matrix.rotate( group.rotation.value );
		// anchor point inverse transform, taking sale into account
		var aPX = -( group.anchorPoint.value[ 0 ] * group.scale.value[ 0 ] / 100 );
		var aPY = -( group.anchorPoint.value[ 1 ] * group.scale.value[ 1 ] / 100 );
		matrix.translate( [ aPX, aPY ] );
		// scale
		matrix.scale( group.scale.value / 100 );
	}

    return matrix;
}

/**
 * Gets the comp position (2D Projection in the comp) of a layer.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The comp position
 */
function getLayerCompPos( t, l ) {
    if (typeof l === "undefined") l = thisLayer;
    if (typeof t === "undefined") t = time;
    return l.toComp( l.anchorPoint, t );
}

/**
 * Gets the world position of a layer.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The world position
 */
function getLayerWorldPos(t, l) {
	if (typeof l === "undefined") l = thisLayer;
	if (typeof t === "undefined") t = time;
	return l.toWorld(l.anchorPoint, t);
}


/**
 * Gets the world instant speed of a layer.
 * @function
 * @param {number} [t=time] The time when to get the velocity
 * @param {Layer} [l=thisLayer] The layer
 * @return {number} A positive number. The speed.
 * @requires getLayerWorldVelocity
 * @requires getLayerWorldPos
 */
function getLayerWorldSpeed(t, l) {
	return length(getWorldVelocity(t, l));
}

/**
 * Gets the world instant velocity of a layer.
 * @function
 * @param {number} [t=time] The time when to get the velocity
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The velocity.
 * @requires getLayerWorldPos
 */
function getLayerWorldVelocity(t, l) {
	if (typeof t === "undefined") t = time;
	return (getWorldPos(t, l) - getWorldPos(t - 0.01, l)) * 100;
}

/**
 * Gets the key immediately after the given time
 * @function
 * @param {number} [t=time] Time at which to get the key
 * @return {Key|null} The key, or null if there's no key before.
 */
function getNextKey(t) {
    if (typeof t === "undefined") t = time;
    if (numKeys == 0) return null;
    var nKey = nearestKey(t);
    if (nKey.time >= t) return nKey;
    if (nKey.index < numKeys) return key(nKey.index + 1);
    return null;
  }
  

/**
 * Gets the world orientation of a (2D) layer.
 * @function
 * @param {Layer} l The layer to get the orientation from
 * @return {float} The orientation, in degrees.
 */
function getOrientation( l ) {
    var r = 0;
    r += l.rotation.value;
    while ( l.hasParent ) {
        l = l.parent;
        r += l.rotation.value;
    }
    return r;
}

/**
 * Gets the world orientation of a (2D) layer at a specific time.
 * @function
 * @param {Layer} l The layer to get the orientation from
 * @param {float} [t=time] The time at which to get the orientation
 * @return {float} The orientation, in degrees.
 */
function getOrientationAtTime( l, t ) {
    if (typeof t === "undefined" ) t = time;
    var r = 0;
    r += l.rotation.valueAtTime( t );
    while ( l.hasParent ) {
        l = l.parent;
        r += l.rotation.valueAtTime( t );
    }
    return r;
}

/**
 * Gets the key immediately before the given time
 * @function
 * @param {number} [t=time] Time at which to get the key
 * @return {Key|null} The key, or null if there's no key before.
 */
function getPrevKey(t) {
    if (typeof t === "undefined") t = time;
    if (numKeys == 0) return null;
    var nKey = nearestKey(t);
    if (nKey.time <= t) return nKey;
    if (nKey.index > 1) return key(nKey.index - 1);
    return null;
  }

/**
 * Gets the world speed of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world speed
 * @requires getPropWorldVelocity
 * @requires getPropWorldValue
 * @requires getLayerWorldPos
 */
function getPropWorldSpeed(t, prop) {
	return length(getPropWorldVelocity(t, prop));
}

/**
 * Gets the world coordinates of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world coordinates
 * @requires getLayerWorldPos
 */
function getPropWorldValue(t, prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (typeof t === "undefined") t = time;
	if (isPosition(prop)) return getLayerWorldPos(t);
	return thisLayer.toWorld(prop.valueAtTime(t), t);
}

/**
 * Gets the world velocity of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world velocity
 * @requires getPropWorldValue
 * @requires getLayerWorldPos
 */
function getPropWorldVelocity(t, prop) {
	if (typeof t === "undefined") t = time;
	return (getPropWorldValue(t + 0.005, prop) - getPropWorldValue(t - 0.005, prop)) * 100;
}

/**
 * Interpolates a value with a bezier curve.<br />
 * This method can replace <code>linear()</code> and <code>ease()</code> with a custom b�zier interpolation.
 * @function
 * @param {number} t The value to interpolate
 * @param {number} [min=0] The minimum value of the initial range
 * @param {number} [max=1] The maximum value of the initial range
 * @param {number} [toMin=0] The minimum value of the interpolated result
 * @param {number} [toMax=1] The maximum value of the interpolated result
 * @param {number[]} [bezierPoints=[0.33,0.0,0.66,1.0]] an Array of 4 coordinates wihtin the [0.0, 1.0] range which describes the B�zier interpolation. The default mimics the native ease() function<br />
 * [ outTangentX, outTangentY, inTangentX, inTangentY ]
 * @return {number} the value.
 */
function interpolationBezier(t, min, max, toMin, toMax, bezierPoints) {
    if (arguments.length !== 6) return value;
    var a = toMax - toMin;
    var b = max - min;
    if (b == 0) return t;
    var c = clamp((t - min) / b, 0, 1);
    if (!(bezierPoints instanceof Array) || bezierPoints.length !== 4) bezierPoints = [0.33,0.0,0.66,1.0];
    return a * h(c, bezierPoints) + toMin;

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


/**
 * Checks if current time is after the time of the last key in the property
 * @function
 * @return {boolean} true if time is > lastkey.time
 */
function isAfterLastKey() {
	if (numKeys == 0) return false;
	var nKey = nearestKey(time);
	return nKey.time <= time && nKey.index == numKeys;
}


/**
 * Checks if a property is a layer. Useful when traversing up the property tree to stop when getting the layer.
 * @function
 * @param {Property} prop - The property to test
 * @return {boolean} true if the prop is a layer
 */
function isLayer( prop ) {
	//try catch is needed for the legacy expression engine
	try { if ( prop.index ) return true; }
	catch (e) { return false; }
}

/**
 * Checks if a property is a transform.position property.
 * @function
 * @param {Property} [prop=thisProperty] The property
 * @return {boolean} true if the property is the transform.position property.
 */
function isPosition(prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (!(prop.value instanceof Array)) return false;
	if (prop.value.length > 3) return false;
	//compare the name, index and value with the real position
	if ( prop === transform.position ) return true;
	if ( prop === position ) return true;
	return false;
}

/**
 * Checks if a property is spatial
 * @param {Property} prop The property to check
 * @return {boolean} true if the property is spatial.
 */
function isSpatial(prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (!(prop.value instanceof Array)) return false;
	if (prop.value.length != 2 && prop.value.length != 3) return false;
	try {
		sp = prop.speed;
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Checks if the current property is animated at a given time.
 * @function
 * @param {number} [t=time] The time
 * @param {number} [threshold=0.1] The speed under which the property is considered still.
 * @return {boolean} true if the property does not vary.
 */
function isStill(t, threshold) {
	if (typeof t === "undefined") t = time;
	if (typeof threshold === "undefined") threshold = 0.1;
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

/*!
  2D Transformation Matrix v2.7.5 LT
  (c) Epistemex.com 2014-2018
  License: MIT
*/

/**
  * 2D transformation matrix object initialized with identity matrix. See the source code for more documentation.
  * @class
  * @prop {number} a - scale x
  * @prop {number} b - shear y
  * @prop {number} c - shear x
  * @prop {number} d - scale y
  * @prop {number} e - translate x
  * @prop {number} f - translate y
  * @constructor
  * @overview 2D Transformation Matrix. Simplified for use in After Effects Expressions by Nicolas "Duduf" Dufresne
  * @author Epistemex
  * @version 2.7.5
  * @license MIT license (header required)
  * @copyright Epistemex.com 2014-2018
*/
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

	/**
	* Rotates current matrix by angle (accumulative).
	* @param {number} angle - angle in degrees
	* @returns {Matrix}
	*/
	rotate: function(angle) {
	 angle = degreesToRadians(angle);
	 var
		cos = Math.cos(angle),
		sin = Math.sin(angle);

	 return this._t(cos, sin, -sin, cos, 0, 0)
	},

	/**
	* Converts a vector given as `x` and `y` to angle, and
	* rotates (accumulative). x can instead contain an object with
	* properties x and y and if so, y parameter will be ignored.
	* @param {number|*} x
	* @param {number} [y]
	* @returns {Matrix}
	*/
	rotateFromVector: function(x, y) {
	 return this.rotate(typeof x === "number" ? Math.atan2(y, x) : Math.atan2(x.y, x.x))
	},

	/**
	* Scales current matrix accumulative.
	* @param {number[]} s - scale factor [x, y]. 1 does nothing, any third value (Z) is ignored.
	* @returns {Matrix}
	*/
	scale: function(s) {
	 return this._t(s[0], 0, 0, s[1], 0, 0);
	},

	/**
	* Apply shear to the current matrix accumulative.
	* @param {number} sx - amount of shear for x
	* @param {number} sy - amount of shear for y
	* @returns {Matrix}
	*/
	shear: function(sx, sy) {
	 return this._t(1, sy, sx, 1, 0, 0)
	},

	/**
	* Apply skew to the current matrix accumulative. Angles in radians.
	* Also see [`skewDeg()`]{@link Matrix#skewDeg}.
	* @param {number} ax - angle of skew for x
	* @param {number} ay - angle of skew for y
	* @returns {Matrix}
	*/
	skew: function(ax, ay) {
	 return this.shear(Math.tan(ax), Math.tan(ay))
	},

	/**
	* Set current matrix to new absolute matrix.
	* @param {number} a - scale x
	* @param {number} b - shear y
	* @param {number} c - shear x
	* @param {number} d - scale y
	* @param {number} e - translate x
	* @param {number} f - translate y
	* @returns {Matrix}
	*/
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

	/**
	* Translate current matrix accumulative.
	* @param {number[]} t - translation [x, y]. Any third value (Z) is ignored.
	* @returns {Matrix}
	*/
	translate: function(t) {
	 return this._t(1, 0, 0, 1, t[0], t[1]);
	},

	/**
	* Multiplies current matrix with new matrix values. Also see [`multiply()`]{@link Matrix#multiply}.
	*
	* @param {number} a2 - scale x
	* @param {number} b2 - skew y
	* @param {number} c2 - skew x
	* @param {number} d2 - scale y
	* @param {number} e2 - translate x
	* @param {number} f2 - translate y
	* @returns {Matrix}
	*/
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

	/**
	* Multiplies current matrix with source matrix.
	* @param {Matrix|Matrix|DOMMatrix|SVGMatrix} m - source matrix to multiply with.
	* @returns {Matrix}
	*/
	multiply: function(m) {
	 return this._t(m.a, m.b, m.c, m.d, m.e, m.f)
	},

	/**
	* Get an inverse matrix of current matrix. The method returns a new
	* matrix with values you need to use to get to an identity matrix.
	* Context from parent matrix is not applied to the returned matrix.
	*
	* @param {boolean} [cloneContext=false] - clone current context to resulting matrix
	* @throws Exception is input matrix is not invertible
	* @returns {Matrix} - new Matrix instance
	*/
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

	/**
	* Decompose the current matrix into simple transforms using QR.
	*
	* @returns {*} - an object containing current decomposed values (translate, rotation, scale, skew)
	* @see {@link https://en.wikipedia.org/wiki/QR_decomposition|More on QR decomposition}
	*/
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

		determ	= a * d - b * c,	// determinant(), skip DRY here...
		r, s;

	 // Apply the QR-like decomposition.
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
	 else { // a = b = c = d = 0
		scale = {x: 0, y: 0};
	 }

	 return {
		translate: translate,
		rotation : rotation,
		scale	: scale,
		skew	 : skew
	 }
	},

	/**
	* Returns the determinant of the current matrix.
	* @returns {number}
	*/
	determinant: function() {
	 return this.a * this.d - this.b * this.c
	},

	/**
	* Apply current matrix to `x` and `y` of a point.
	* Returns a point object.
	*
	* @param {number[]} pt - the point to transform ([x, y]).<br />
	* If an optionnal Z value is provided, it will be kept without transformation.
	* @returns {number[]} A new transformed point [x, y]. If pt had a third value, it is returned too, as it was without transformation.
	*/
	applyToPoint: function(pt) {
	 var me = this;
	 var x = pt[0] * me.a + pt[1] * me.c + me.e;
	 var y = pt[0] * me.b + pt[1] * me.d + me.f;
	 var result = [x,y];
	 if (pt.length == 3) result.push(pt[2]);
	 return result;
	},

	/**
	* Returns true if matrix is an identity matrix (no transforms applied).
	* @returns {boolean}
	*/
	isIdentity: function() {
	 var me = this;
	 return me.a === 1 && !me.b && !me.c && me.d === 1 && !me.e && !me.f
	},

	/**
	* Returns true if matrix is invertible
	* @returns {boolean}
	*/
	isInvertible: function() {
	 return !this._q(this.determinant(), 0)
	},

	/**
	* The method is intended for situations where scale is accumulated
	* via multiplications, to detect situations where scale becomes
	* "trapped" with a value of zero. And in which case scale must be
	* set explicitly to a non-zero value.
	*
	* @returns {boolean}
	*/
	isValid: function() {
	 return !(this.a * this.d)
	},

	/**
	* Compares current matrix with another matrix. Returns true if equal
	* (within epsilon tolerance).
	* @param {Matrix|Matrix|DOMMatrix|SVGMatrix} m - matrix to compare this matrix with
	* @returns {boolean}
	*/
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

	/**
	* Clones current instance and returning a new matrix.
	* @param {boolean} [noContext=false] don't clone context reference if true
	* @returns {Matrix} - a new Matrix instance with identical transformations as this instance
	*/
	clone: function(noContext) {
	 return new Matrix(noContext ? null : this.context).multiply(this)
	},

	/**
	* Compares floating point values with some tolerance (epsilon)
	* @param {number} f1 - float 1
	* @param {number} f2 - float 2
	* @returns {boolean}
	* @private
	*/
	_q: function(f1, f2) {
	 return Math.abs(f1 - f2) < 1e-14
	},

	/**
	* Apply current absolute matrix to context if defined, to sync it.
	* Apply current absolute matrix to element if defined, to sync it.
	* @returns {Matrix}
	* @private
	*/
	_x: function() {

	 var me = this;

	 //try catch is needed for the legacy expression engine
	 try { if (me.context)
		me.context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
	 } catch(e) {}

	 return me
	}
};


/**
 * Translates a point with a layer, as if it was parented to it.
 * @function
 * @param {Layer} l The layer to get the translation from.
 * @param {float[]} [point=[0,0]] The [X,Y] point to translate (using world coordinates).
 * @param {float} [startT=0] The start time of the translation
 * @param {float} [endT=time] The end time of the translation
 * @return {float[]} The coordinates of the translated point.
 */
function translatePointWithLayer( l, point, startT, endT ) {
    if (typeof startT === "undefined") startT = 0;
    if (typeof endT === "undefined") endT = time;
    try {
        var pos = l.fromWorld( point, startT );
    } catch ( e ) {
        var pos = [ 0, 0 ];
    }
    var prevPos = l.toWorld( pos, startT );
    var newPos = l.toWorld( pos, endT );
    return newPos - prevPos;
}


/**
 * Adds some noise to a value.<br />
 * You may use seedRandom() before using this function as it will influence the generated noise.
 * A timeless noise can be achieved with <code>seedRandom(index,true)</code> for example.
 * @function
 * @param {number|number[]} val The value to add noise to.
 * @param {float} quantity The quantity of noise. A percentage. 100 means the value can range from (val * 0) to (val * 2).
 * @example
 * seedRandom(index, true) // a timeless noise
 * addNoise(value, 50 ); // the property value will have noise between (value * 0.5) and (value * 1.5) which won't vary through time.
 * @example
 * seedRandom(index, false);
 * addNoise(value, 33 ); // the noise will change at each frame, varying between (value * .66) and (value * 1.33)
 */
function addNoise( val, quantity ) {
  // a true random value to make sure all properties have a differente noise
  // even with the same start value
  var randomValue = random(0.9,1.1);
  // generate a noise from the start value
  // (which means properties with a similar value won't be to far away from each other)
  var noiseValue = noise(valueAtTime(0) * randomValue);
  noiseValue = noiseValue * (quantity / 100);
  return val * ( noiseValue + 1 );
}

/**
 * Interpolates a value with a bezier curve.<br />
 * This method can replace <code>linear()</code> and <code>ease()</code> with a custom b�zier interpolation.
 * @function
 * @param {number} value The value to interpolate
 * @param {number} [fromMin=0] The minimum for the interpolated value
 * @param {number} [fromMax=1] The maximum for the interpolated value
 * @param {number} [toMin=0] The minimum the value can take
 * @param {number} [toMax=1] The maximum the value can take
 * @param {number[]} [bezierPoints] an Array of 4 coordinates wihtin the 0.0 ... 1.0 range which describes the B�zier interpolation.<br />
 * [ outTangentX, outTangentY, inTangentX, inTangentY ]
 * @return {number} the value.
 */
function bezier(t, tMin, tMax, value1, value2, bezierPoints) {
    if (arguments.length !== 6) return value;
    var a = value2 - value1;
    var b = tMax - tMin;
    if (b == 0) return t;
    var c = clamp((t - tMin) / b, 0, 1);
    if (!(bezierPoints instanceof Array) || bezierPoints.length !== 4) bezierPoints = [0, 0, 1, 1];
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


/**
 * Checks the type of a pseudo-effect used by Duik.<br />
 * This is a workaround for the missing matchName in expressions.<br />
 * Pseudo-Effects used by Duik start with a hidden property which name is the same as the matchName of the effect itself (without the 'Pseudo/' part).
 * @function
 * @example
 * if ( checkEffect(thisLayer.effect(1), "DUIK parentConstraint2") ) { "This is the second version of the parent constraint by Duik" }
 * else { "Who knows what this is?" }
 * @param {Property} fx The effect to check
 * @param {string} duikMatchName The matchName of a pseudo-effect used by Duik (without the 'Pseudo/' part)
 * @return {boolean} True when the property at propIndex is named propName
 */
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

/**
 * Checks the type of an effect.<br />
 * This is a workaround for the missing matchName in expressions.<br />
 * It checks if the given effect has a specific property at a specific index.
 * @function
 * @example
 * if ( checkEffect(thisLayer.effect(1), 1, "Blur") ) { "The first effect is a blur!" }
 * else { "Who knows what this is?" }
 * @param {Property} fx The effect to check
 * @param {int} propIndex The index of the property
 * @param {string} propName The expected name of the property. Be careful with the internationalization of After Effects...
 * @return {boolean} True when the property at propIndex is named propName
 */
function checkEffect(fx, propIndex, propName) {
    if (fx.numProperties  < propIndex) return false;
    //Check when this is a javascript engine (without try/catch for better performance)
    if (!!$.engineName) {
        if ( fx(propIndex).name != propName ) return false;
    }
    //Check with the extendscript engine
    else {
        try { if (fx(propIndex).name != propName) return false; }
        catch (e) { return false; }
    }
    return true;
}

/**
 * Removes the ancestors rotation from the rotation of a layer.
 * This is very useful to make a layer keep its orientation without being influenced by its parents.
 * @function
 * @example
 * //in a rotation property, just include the function and use:
 * dishineritRotation();
 * //the layer will now keep its own orientation.
 * @example
 * //you can also combine the result with something else
 * var result = dishineritRotation();
 * result + wiggle(5,20);
 * @function
 * @param {Layer} [l=thisLayer] The layer
 * @return {float} The new rotation value, in degrees.
 */
function dishineritRotation( l ) {
    if (typeof l === "undefined") l = thisLayer;
    var r = l.rotation.value;
    while ( l.hasParent ) {
        l = l.parent;
        r -= l.rotation.value;
    }
    return r;
}

/**
 * Converts the point coordinates from the current group in the shape layer to the Layer.<br />
 * Use toWorld and toComp with the result if you need te coordinates in the world or the comp.
 * @function
 * @param {number[]} point The 2D coordinates of the point in the current group.
 * @return {number[]} The 2D coordinates of the point in the Layer.
 * @requires isLayer
 * @requires Matrix
 * @requires getGroupTransformMatrix
 */
function fromGroupToLayer( point ) {
    var matrix = getGroupTransformMatrix();
    return matrix.applyToPoint( point );
}

/**
 * Converts the point coordinates from Layer to the current group in the shape layer.<br />
 * Use fromWorld or fromComp first if you need to convert from the world or composition coordinates, and pass the result to this function.
 * @function
 * @param {number[]} point The 2D coordinates of the point in the Layer.
 * @return {number[]} The 2D coordinates of the point in the current group.
 * @requires isLayer
 * @requires Matrix
 * @requires getGroupTransformMatrix
 */
function fromLayerToGroup( point ) {
    var matrix = getGroupTransformMatrix().inverse();
    return matrix.applyToPoint( point );
}

/**
 * Gets the "real" scale of a layer, resulting to its scale property, the scale of its parents, and it's location in Z-space if it's 3D.
 * @function
 * @param {Layer} [l=thisLayer] The layer 
 * @param {number} [t=time] The time when to get the scale
 * @return {number} The scale ratio. This is not a percent, 1.0 is 100%.
 */
function getCompScale( l, t ) {
	if (typeof l === "undefined") l = thisLayer;
	if (typeof t === "undefined") t = time;
	
	//get ratio 
	var originalWidth = length( l.anchorPoint, [ l.width, 0 ] );
	var anchorInComp = l.toComp( l.anchorPoint, t );
	var widthInComp = l.toComp( [ l.width, 0 ], t );
	var newWidth = length(anchorInComp, widthInComp);
	return newWidth / originalWidth;
}

/**
 * Gets a layer from a layer property in an effect, without generating an error if "None" is selected with the Legacy expression engine.
 * @function
 * @param {Property} fx The effect
 * @param {int|string} ind The index or the name of the property
 * @return {Layer|null} The layer, or null if set to "None"
 */
function getEffectLayer( fx, ind ) {
	try { var l = fx( ind ); return l; }
	catch ( e ) { return null; }	
}

/**
 * Gets the transformation Matrix for the current group in a shape layer, including the transformation from the ancestor groups
 * @function
 * @param {Property} [prop=thisProperty] The property from which to get the matrix
 * @return {Matrix} The 2D Transform Matrix.
 * @requires isLayer
 * @requires Matrix
 */
function getGroupTransformMatrix( prop ) {
	if (typeof group === "undefined") prop = thisProperty;
    // A Matrix to apply group transforms
    var matrix = new Matrix();

	// Get all groups from this propperty
	var shapeGroups = [];
	var parentProp = prop.propertyGroup(1);
	while( parentProp && !isLayer(parentProp) )
	{
		//try catch is needed for the legacy expression engine
		try { if ( parentProp.transform ) shapeGroups.push( parentProp.transform ); }
		catch (e) {}
		parentProp = parentProp.propertyGroup(1);
	}
	
	for (var i = shapeGroups.length - 1; i >= 0; i--)
	{
		var group = shapeGroups[i];

		// position
		matrix.translate( group.position.value );
		// rotation
		matrix.rotate( group.rotation.value );
		// anchor point inverse transform, taking sale into account
		var aPX = -( group.anchorPoint.value[ 0 ] * group.scale.value[ 0 ] / 100 );
		var aPY = -( group.anchorPoint.value[ 1 ] * group.scale.value[ 1 ] / 100 );
		matrix.translate( [ aPX, aPY ] );
		// scale
		matrix.scale( group.scale.value / 100 );
	}

    return matrix;
}

/**
 * Gets the comp position (2D Projection in the comp) of a layer.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The comp position
 */
function getLayerCompPos( t, l ) {
    if (typeof l === "undefined") l = thisLayer;
    if (typeof t === "undefined") t = time;
    return l.toComp( l.anchorPoint, t );
}

/**
 * Gets the world position of a layer.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The world position
 */
function getLayerWorldPos(t, l) {
	if (typeof l === "undefined") l = thisLayer;
	if (typeof t === "undefined") t = time;
	return l.toWorld(l.anchorPoint, t);
}


/**
 * Gets the world instant speed of a layer.
 * @function
 * @param {number} [t=time] The time when to get the velocity
 * @param {Layer} [l=thisLayer] The layer
 * @return {number} A positive number. The speed.
 * @requires getLayerWorldVelocity
 * @requires getLayerWorldPos
 */
function getLayerWorldSpeed(t, l) {
	return length(getWorldVelocity(t, l));
}

/**
 * Gets the world instant velocity of a layer.
 * @function
 * @param {number} [t=time] The time when to get the velocity
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The velocity.
 * @requires getLayerWorldPos
 */
function getLayerWorldVelocity(t, l) {
	if (typeof t === "undefined") t = time;
	return (getWorldPos(t, l) - getWorldPos(t - 0.01, l)) * 100;
}

/**
 * Gets the key immediately after the given time
 * @function
 * @param {number} [t=time] Time at which to get the key
 * @return {Key|null} The key, or null if there's no key before.
 */
function getNextKey(t) {
    if (typeof t === "undefined") t = time;
    if (numKeys == 0) return null;
    var nKey = nearestKey(t);
    if (nKey.time >= t) return nKey;
    if (nKey.index < numKeys) return key(nKey.index + 1);
    return null;
  }
  

/**
 * Gets the world orientation of a (2D) layer.
 * @function
 * @param {Layer} l The layer to get the orientation from
 * @return {float} The orientation, in degrees.
 */
function getOrientation( l ) {
    var r = 0;
    r += l.rotation.value;
    while ( l.hasParent ) {
        l = l.parent;
        r += l.rotation.value;
    }
    return r;
}

/**
 * Gets the world orientation of a (2D) layer at a specific time.
 * @function
 * @param {Layer} l The layer to get the orientation from
 * @param {float} [t=time] The time at which to get the orientation
 * @return {float} The orientation, in degrees.
 */
function getOrientationAtTime( l, t ) {
    if (typeof t === "undefined" ) t = time;
    var r = 0;
    r += l.rotation.valueAtTime( t );
    while ( l.hasParent ) {
        l = l.parent;
        r += l.rotation.valueAtTime( t );
    }
    return r;
}

/**
 * Gets the key immediately before the given time
 * @function
 * @param {number} [t=time] Time at which to get the key
 * @return {Key|null} The key, or null if there's no key before.
 */
function getPrevKey(t) {
    if (typeof t === "undefined") t = time;
    if (numKeys == 0) return null;
    var nKey = nearestKey(t);
    if (nKey.time <= t) return nKey;
    if (nKey.index > 1) return key(nKey.index - 1);
    return null;
  }

/**
 * Gets the world speed of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world speed
 * @requires getPropWorldVelocity
 * @requires getPropWorldValue
 * @requires getLayerWorldPos
 */
function getPropWorldSpeed(t, prop) {
	return length(getPropWorldVelocity(t, prop));
}

/**
 * Gets the world coordinates of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world coordinates
 * @requires getLayerWorldPos
 */
function getPropWorldValue(t, prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (typeof t === "undefined") t = time;
	if (isPosition(prop)) return getLayerWorldPos(t);
	return thisLayer.toWorld(prop.valueAtTime(t), t);
}

/**
 * Gets the world velocity of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world velocity
 * @requires getPropWorldValue
 * @requires getLayerWorldPos
 */
function getPropWorldVelocity(t, prop) {
	if (typeof t === "undefined") t = time;
	return (getPropWorldValue(t + 0.005, prop) - getPropWorldValue(t - 0.005, prop)) * 100;
}

/**
 * Interpolates a value with a bezier curve.<br />
 * This method can replace <code>linear()</code> and <code>ease()</code> with a custom b�zier interpolation.
 * @function
 * @param {number} t The value to interpolate
 * @param {number} [min=0] The minimum value of the initial range
 * @param {number} [max=1] The maximum value of the initial range
 * @param {number} [toMin=0] The minimum value of the interpolated result
 * @param {number} [toMax=1] The maximum value of the interpolated result
 * @param {number[]} [bezierPoints=[0.33,0.0,0.66,1.0]] an Array of 4 coordinates wihtin the [0.0, 1.0] range which describes the B�zier interpolation. The default mimics the native ease() function<br />
 * [ outTangentX, outTangentY, inTangentX, inTangentY ]
 * @return {number} the value.
 */
function interpolationBezier(t, min, max, toMin, toMax, bezierPoints) {
    if (arguments.length !== 6) return value;
    var a = toMax - toMin;
    var b = max - min;
    if (b == 0) return t;
    var c = clamp((t - min) / b, 0, 1);
    if (!(bezierPoints instanceof Array) || bezierPoints.length !== 4) bezierPoints = [0.33,0.0,0.66,1.0];
    return a * h(c, bezierPoints) + toMin;

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


/**
 * Checks if current time is after the time of the last key in the property
 * @function
 * @return {boolean} true if time is > lastkey.time
 */
function isAfterLastKey() {
	if (numKeys == 0) return false;
	var nKey = nearestKey(time);
	return nKey.time <= time && nKey.index == numKeys;
}


/**
 * Checks if a property is a layer. Useful when traversing up the property tree to stop when getting the layer.
 * @function
 * @param {Property} prop - The property to test
 * @return {boolean} true if the prop is a layer
 */
function isLayer( prop ) {
	//try catch is needed for the legacy expression engine
	try { if ( prop.index ) return true; }
	catch (e) { return false; }
}

/**
 * Checks if a property is a transform.position property.
 * @function
 * @param {Property} [prop=thisProperty] The property
 * @return {boolean} true if the property is the transform.position property.
 */
function isPosition(prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (!(prop.value instanceof Array)) return false;
	if (prop.value.length > 3) return false;
	//compare the name, index and value with the real position
	if ( prop === transform.position ) return true;
	if ( prop === position ) return true;
	return false;
}

/**
 * Checks if a property is spatial
 * @param {Property} prop The property to check
 * @return {boolean} true if the property is spatial.
 */
function isSpatial(prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (!(prop.value instanceof Array)) return false;
	if (prop.value.length != 2 && prop.value.length != 3) return false;
	try {
		sp = prop.speed;
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Checks if the current property is animated at a given time.
 * @function
 * @param {number} [t=time] The time
 * @param {number} [threshold=0.1] The speed under which the property is considered still.
 * @return {boolean} true if the property does not vary.
 */
function isStill(t, threshold) {
	if (typeof t === "undefined") t = time;
	if (typeof threshold === "undefined") threshold = 0.1;
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

/*!
  2D Transformation Matrix v2.7.5 LT
  (c) Epistemex.com 2014-2018
  License: MIT
*/

/**
  * 2D transformation matrix object initialized with identity matrix. See the source code for more documentation.
  * @class
  * @prop {number} a - scale x
  * @prop {number} b - shear y
  * @prop {number} c - shear x
  * @prop {number} d - scale y
  * @prop {number} e - translate x
  * @prop {number} f - translate y
  * @constructor
  * @overview 2D Transformation Matrix. Simplified for use in After Effects Expressions by Nicolas "Duduf" Dufresne
  * @author Epistemex
  * @version 2.7.5
  * @license MIT license (header required)
  * @copyright Epistemex.com 2014-2018
*/
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

	/**
	* Rotates current matrix by angle (accumulative).
	* @param {number} angle - angle in degrees
	* @returns {Matrix}
	*/
	rotate: function(angle) {
	 angle = degreesToRadians(angle);
	 var
		cos = Math.cos(angle),
		sin = Math.sin(angle);

	 return this._t(cos, sin, -sin, cos, 0, 0)
	},

	/**
	* Converts a vector given as `x` and `y` to angle, and
	* rotates (accumulative). x can instead contain an object with
	* properties x and y and if so, y parameter will be ignored.
	* @param {number|*} x
	* @param {number} [y]
	* @returns {Matrix}
	*/
	rotateFromVector: function(x, y) {
	 return this.rotate(typeof x === "number" ? Math.atan2(y, x) : Math.atan2(x.y, x.x))
	},

	/**
	* Scales current matrix accumulative.
	* @param {number[]} s - scale factor [x, y]. 1 does nothing, any third value (Z) is ignored.
	* @returns {Matrix}
	*/
	scale: function(s) {
	 return this._t(s[0], 0, 0, s[1], 0, 0);
	},

	/**
	* Apply shear to the current matrix accumulative.
	* @param {number} sx - amount of shear for x
	* @param {number} sy - amount of shear for y
	* @returns {Matrix}
	*/
	shear: function(sx, sy) {
	 return this._t(1, sy, sx, 1, 0, 0)
	},

	/**
	* Apply skew to the current matrix accumulative. Angles in radians.
	* Also see [`skewDeg()`]{@link Matrix#skewDeg}.
	* @param {number} ax - angle of skew for x
	* @param {number} ay - angle of skew for y
	* @returns {Matrix}
	*/
	skew: function(ax, ay) {
	 return this.shear(Math.tan(ax), Math.tan(ay))
	},

	/**
	* Set current matrix to new absolute matrix.
	* @param {number} a - scale x
	* @param {number} b - shear y
	* @param {number} c - shear x
	* @param {number} d - scale y
	* @param {number} e - translate x
	* @param {number} f - translate y
	* @returns {Matrix}
	*/
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

	/**
	* Translate current matrix accumulative.
	* @param {number[]} t - translation [x, y]. Any third value (Z) is ignored.
	* @returns {Matrix}
	*/
	translate: function(t) {
	 return this._t(1, 0, 0, 1, t[0], t[1]);
	},

	/**
	* Multiplies current matrix with new matrix values. Also see [`multiply()`]{@link Matrix#multiply}.
	*
	* @param {number} a2 - scale x
	* @param {number} b2 - skew y
	* @param {number} c2 - skew x
	* @param {number} d2 - scale y
	* @param {number} e2 - translate x
	* @param {number} f2 - translate y
	* @returns {Matrix}
	*/
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

	/**
	* Multiplies current matrix with source matrix.
	* @param {Matrix|Matrix|DOMMatrix|SVGMatrix} m - source matrix to multiply with.
	* @returns {Matrix}
	*/
	multiply: function(m) {
	 return this._t(m.a, m.b, m.c, m.d, m.e, m.f)
	},

	/**
	* Get an inverse matrix of current matrix. The method returns a new
	* matrix with values you need to use to get to an identity matrix.
	* Context from parent matrix is not applied to the returned matrix.
	*
	* @param {boolean} [cloneContext=false] - clone current context to resulting matrix
	* @throws Exception is input matrix is not invertible
	* @returns {Matrix} - new Matrix instance
	*/
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

	/**
	* Decompose the current matrix into simple transforms using QR.
	*
	* @returns {*} - an object containing current decomposed values (translate, rotation, scale, skew)
	* @see {@link https://en.wikipedia.org/wiki/QR_decomposition|More on QR decomposition}
	*/
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

		determ	= a * d - b * c,	// determinant(), skip DRY here...
		r, s;

	 // Apply the QR-like decomposition.
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
	 else { // a = b = c = d = 0
		scale = {x: 0, y: 0};
	 }

	 return {
		translate: translate,
		rotation : rotation,
		scale	: scale,
		skew	 : skew
	 }
	},

	/**
	* Returns the determinant of the current matrix.
	* @returns {number}
	*/
	determinant: function() {
	 return this.a * this.d - this.b * this.c
	},

	/**
	* Apply current matrix to `x` and `y` of a point.
	* Returns a point object.
	*
	* @param {number[]} pt - the point to transform ([x, y]).<br />
	* If an optionnal Z value is provided, it will be kept without transformation.
	* @returns {number[]} A new transformed point [x, y]. If pt had a third value, it is returned too, as it was without transformation.
	*/
	applyToPoint: function(pt) {
	 var me = this;
	 var x = pt[0] * me.a + pt[1] * me.c + me.e;
	 var y = pt[0] * me.b + pt[1] * me.d + me.f;
	 var result = [x,y];
	 if (pt.length == 3) result.push(pt[2]);
	 return result;
	},

	/**
	* Returns true if matrix is an identity matrix (no transforms applied).
	* @returns {boolean}
	*/
	isIdentity: function() {
	 var me = this;
	 return me.a === 1 && !me.b && !me.c && me.d === 1 && !me.e && !me.f
	},

	/**
	* Returns true if matrix is invertible
	* @returns {boolean}
	*/
	isInvertible: function() {
	 return !this._q(this.determinant(), 0)
	},

	/**
	* The method is intended for situations where scale is accumulated
	* via multiplications, to detect situations where scale becomes
	* "trapped" with a value of zero. And in which case scale must be
	* set explicitly to a non-zero value.
	*
	* @returns {boolean}
	*/
	isValid: function() {
	 return !(this.a * this.d)
	},

	/**
	* Compares current matrix with another matrix. Returns true if equal
	* (within epsilon tolerance).
	* @param {Matrix|Matrix|DOMMatrix|SVGMatrix} m - matrix to compare this matrix with
	* @returns {boolean}
	*/
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

	/**
	* Clones current instance and returning a new matrix.
	* @param {boolean} [noContext=false] don't clone context reference if true
	* @returns {Matrix} - a new Matrix instance with identical transformations as this instance
	*/
	clone: function(noContext) {
	 return new Matrix(noContext ? null : this.context).multiply(this)
	},

	/**
	* Compares floating point values with some tolerance (epsilon)
	* @param {number} f1 - float 1
	* @param {number} f2 - float 2
	* @returns {boolean}
	* @private
	*/
	_q: function(f1, f2) {
	 return Math.abs(f1 - f2) < 1e-14
	},

	/**
	* Apply current absolute matrix to context if defined, to sync it.
	* Apply current absolute matrix to element if defined, to sync it.
	* @returns {Matrix}
	* @private
	*/
	_x: function() {

	 var me = this;

	 //try catch is needed for the legacy expression engine
	 try { if (me.context)
		me.context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
	 } catch(e) {}

	 return me
	}
};


/**
 * Translates a point with a layer, as if it was parented to it.
 * @function
 * @param {Layer} l The layer to get the translation from.
 * @param {float[]} [point=[0,0]] The [X,Y] point to translate (using world coordinates).
 * @param {float} [startT=0] The start time of the translation
 * @param {float} [endT=time] The end time of the translation
 * @return {float[]} The coordinates of the translated point.
 */
function translatePointWithLayer( l, point, startT, endT ) {
    if (typeof startT === "undefined") startT = 0;
    if (typeof endT === "undefined") endT = time;
    try {
        var pos = l.fromWorld( point, startT );
    } catch ( e ) {
        var pos = [ 0, 0 ];
    }
    var prevPos = l.toWorld( pos, startT );
    var newPos = l.toWorld( pos, endT );
    return newPos - prevPos;
}


/**
 * Adds some noise to a value.<br />
 * You may use seedRandom() before using this function as it will influence the generated noise.
 * A timeless noise can be achieved with <code>seedRandom(index,true)</code> for example.
 * @function
 * @param {number|number[]} val The value to add noise to.
 * @param {float} quantity The quantity of noise. A percentage. 100 means the value can range from (val * 0) to (val * 2).
 * @example
 * seedRandom(index, true) // a timeless noise
 * addNoise(value, 50 ); // the property value will have noise between (value * 0.5) and (value * 1.5) which won't vary through time.
 * @example
 * seedRandom(index, false);
 * addNoise(value, 33 ); // the noise will change at each frame, varying between (value * .66) and (value * 1.33)
 */
function addNoise( val, quantity ) {
  // a true random value to make sure all properties have a differente noise
  // even with the same start value
  var randomValue = random(0.9,1.1);
  // generate a noise from the start value
  // (which means properties with a similar value won't be to far away from each other)
  var noiseValue = noise(valueAtTime(0) * randomValue);
  noiseValue = noiseValue * (quantity / 100);
  return val * ( noiseValue + 1 );
}

/**
 * Checks the type of a pseudo-effect used by Duik.<br />
 * This is a workaround for the missing matchName in expressions.<br />
 * Pseudo-Effects used by Duik start with a hidden property which name is the same as the matchName of the effect itself (without the 'Pseudo/' part).
 * @function
 * @example
 * if ( checkEffect(thisLayer.effect(1), "DUIK parentConstraint2") ) { "This is the second version of the parent constraint by Duik" }
 * else { "Who knows what this is?" }
 * @param {Property} fx The effect to check
 * @param {string} duikMatchName The matchName of a pseudo-effect used by Duik (without the 'Pseudo/' part)
 * @return {boolean} True when the property at propIndex is named propName
 */
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

/**
 * Checks the type of an effect.<br />
 * This is a workaround for the missing matchName in expressions.<br />
 * It checks if the given effect has a specific property at a specific index.
 * @function
 * @example
 * if ( checkEffect(thisLayer.effect(1), 1, "Blur") ) { "The first effect is a blur!" }
 * else { "Who knows what this is?" }
 * @param {Property} fx The effect to check
 * @param {int} propIndex The index of the property
 * @param {string} propName The expected name of the property. Be careful with the internationalization of After Effects...
 * @return {boolean} True when the property at propIndex is named propName
 */
function checkEffect(fx, propIndex, propName) {
    if (fx.numProperties  < propIndex) return false;
    //Check when this is a javascript engine (without try/catch for better performance)
    if (!!$.engineName) {
        if ( fx(propIndex).name != propName ) return false;
    }
    //Check with the extendscript engine
    else {
        try { if (fx(propIndex).name != propName) return false; }
        catch (e) { return false; }
    }
    return true;
}

/**
 * Removes the ancestors rotation from the rotation of a layer.
 * This is very useful to make a layer keep its orientation without being influenced by its parents.
 * @function
 * @example
 * //in a rotation property, just include the function and use:
 * dishineritRotation();
 * //the layer will now keep its own orientation.
 * @example
 * //you can also combine the result with something else
 * var result = dishineritRotation();
 * result + wiggle(5,20);
 * @function
 * @param {Layer} [l=thisLayer] The layer
 * @return {float} The new rotation value, in degrees.
 */
function dishineritRotation( l ) {
    if (typeof l === "undefined") l = thisLayer;
    var r = l.rotation.value;
    while ( l.hasParent ) {
        l = l.parent;
        r -= l.rotation.value;
    }
    return r;
}

/**
 * Converts the point coordinates from the current group in the shape layer to the Layer.<br />
 * Use toWorld and toComp with the result if you need te coordinates in the world or the comp.
 * @function
 * @param {number[]} point The 2D coordinates of the point in the current group.
 * @return {number[]} The 2D coordinates of the point in the Layer.
 * @requires isLayer
 * @requires Matrix
 * @requires getGroupTransformMatrix
 */
function fromGroupToLayer( point ) {
    var matrix = getGroupTransformMatrix();
    return matrix.applyToPoint( point );
}

/**
 * Converts the point coordinates from Layer to the current group in the shape layer.<br />
 * Use fromWorld or fromComp first if you need to convert from the world or composition coordinates, and pass the result to this function.
 * @function
 * @param {number[]} point The 2D coordinates of the point in the Layer.
 * @return {number[]} The 2D coordinates of the point in the current group.
 * @requires isLayer
 * @requires Matrix
 * @requires getGroupTransformMatrix
 */
function fromLayerToGroup( point ) {
    var matrix = getGroupTransformMatrix().inverse();
    return matrix.applyToPoint( point );
}

/**
 * Gets the "real" scale of a layer, resulting to its scale property, the scale of its parents, and it's location in Z-space if it's 3D.
 * @function
 * @param {Layer} [l=thisLayer] The layer 
 * @param {number} [t=time] The time when to get the scale
 * @return {number} The scale ratio. This is not a percent, 1.0 is 100%.
 */
function getCompScale( l, t ) {
	if (typeof l === "undefined") l = thisLayer;
	if (typeof t === "undefined") t = time;
	
	//get ratio 
	var originalWidth = length( l.anchorPoint, [ l.width, 0 ] );
	var anchorInComp = l.toComp( l.anchorPoint, t );
	var widthInComp = l.toComp( [ l.width, 0 ], t );
	var newWidth = length(anchorInComp, widthInComp);
	return newWidth / originalWidth;
}

/**
 * Gets a layer from a layer property in an effect, without generating an error if "None" is selected with the Legacy expression engine.
 * @function
 * @param {Property} fx The effect
 * @param {int|string} ind The index or the name of the property
 * @return {Layer|null} The layer, or null if set to "None"
 */
function getEffectLayer( fx, ind ) {
	try { var l = fx( ind ); return l; }
	catch ( e ) { return null; }	
}

/**
 * Gets the transformation Matrix for the current group in a shape layer, including the transformation from the ancestor groups
 * @function
 * @param {Property} [prop=thisProperty] The property from which to get the matrix
 * @return {Matrix} The 2D Transform Matrix.
 * @requires isLayer
 * @requires Matrix
 */
function getGroupTransformMatrix( prop ) {
	if (typeof group === "undefined") prop = thisProperty;
    // A Matrix to apply group transforms
    var matrix = new Matrix();

	// Get all groups from this propperty
	var shapeGroups = [];
	var parentProp = prop.propertyGroup(1);
	while( parentProp && !isLayer(parentProp) )
	{
		//try catch is needed for the legacy expression engine
		try { if ( parentProp.transform ) shapeGroups.push( parentProp.transform ); }
		catch (e) {}
		parentProp = parentProp.propertyGroup(1);
	}
	
	for (var i = shapeGroups.length - 1; i >= 0; i--)
	{
		var group = shapeGroups[i];

		// position
		matrix.translate( group.position.value );
		// rotation
		matrix.rotate( group.rotation.value );
		// anchor point inverse transform, taking sale into account
		var aPX = -( group.anchorPoint.value[ 0 ] * group.scale.value[ 0 ] / 100 );
		var aPY = -( group.anchorPoint.value[ 1 ] * group.scale.value[ 1 ] / 100 );
		matrix.translate( [ aPX, aPY ] );
		// scale
		matrix.scale( group.scale.value / 100 );
	}

    return matrix;
}

/**
 * Gets the comp position (2D Projection in the comp) of a layer.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The comp position
 */
function getLayerCompPos( t, l ) {
    if (typeof l === "undefined") l = thisLayer;
    if (typeof t === "undefined") t = time;
    return l.toComp( l.anchorPoint, t );
}

/**
 * Gets the world position of a layer.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The world position
 */
function getLayerWorldPos(t, l) {
	if (typeof l === "undefined") l = thisLayer;
	if (typeof t === "undefined") t = time;
	return l.toWorld(l.anchorPoint, t);
}


/**
 * Gets the world instant speed of a layer.
 * @function
 * @param {number} [t=time] The time when to get the velocity
 * @param {Layer} [l=thisLayer] The layer
 * @return {number} A positive number. The speed.
 * @requires getLayerWorldVelocity
 * @requires getLayerWorldPos
 */
function getLayerWorldSpeed(t, l) {
	return length(getWorldVelocity(t, l));
}

/**
 * Gets the world instant velocity of a layer.
 * @function
 * @param {number} [t=time] The time when to get the velocity
 * @param {Layer} [l=thisLayer] The layer
 * @return {number[]} The velocity.
 * @requires getLayerWorldPos
 */
function getLayerWorldVelocity(t, l) {
	if (typeof t === "undefined") t = time;
	return (getWorldPos(t, l) - getWorldPos(t - 0.01, l)) * 100;
}

/**
 * Gets the key immediately after the given time
 * @function
 * @param {number} [t=time] Time at which to get the key
 * @return {Key|null} The key, or null if there's no key before.
 */
function getNextKey(t) {
    if (typeof t === "undefined") t = time;
    if (numKeys == 0) return null;
    var nKey = nearestKey(t);
    if (nKey.time >= t) return nKey;
    if (nKey.index < numKeys) return key(nKey.index + 1);
    return null;
  }
  

/**
 * Gets the world orientation of a (2D) layer.
 * @function
 * @param {Layer} l The layer to get the orientation from
 * @return {float} The orientation, in degrees.
 */
function getOrientation( l ) {
    var r = 0;
    r += l.rotation.value;
    while ( l.hasParent ) {
        l = l.parent;
        r += l.rotation.value;
    }
    return r;
}

/**
 * Gets the world orientation of a (2D) layer at a specific time.
 * @function
 * @param {Layer} l The layer to get the orientation from
 * @param {float} [t=time] The time at which to get the orientation
 * @return {float} The orientation, in degrees.
 */
function getOrientationAtTime( l, t ) {
    if (typeof t === "undefined" ) t = time;
    var r = 0;
    r += l.rotation.valueAtTime( t );
    while ( l.hasParent ) {
        l = l.parent;
        r += l.rotation.valueAtTime( t );
    }
    return r;
}

/**
 * Gets the key immediately before the given time
 * @function
 * @param {number} [t=time] Time at which to get the key
 * @return {Key|null} The key, or null if there's no key before.
 */
function getPrevKey(t) {
    if (typeof t === "undefined") t = time;
    if (numKeys == 0) return null;
    var nKey = nearestKey(t);
    if (nKey.time <= t) return nKey;
    if (nKey.index > 1) return key(nKey.index - 1);
    return null;
  }

/**
 * Gets the world speed of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world speed
 * @requires getPropWorldVelocity
 * @requires getPropWorldValue
 * @requires getLayerWorldPos
 */
function getPropWorldSpeed(t, prop) {
	return length(getPropWorldVelocity(t, prop));
}

/**
 * Gets the world coordinates of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world coordinates
 * @requires getLayerWorldPos
 */
function getPropWorldValue(t, prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (typeof t === "undefined") t = time;
	if (isPosition(prop)) return getLayerWorldPos(t);
	return thisLayer.toWorld(prop.valueAtTime(t), t);
}

/**
 * Gets the world velocity of a property.
 * @function
 * @param {number} [t=time] Time from when to get the position
 * @param {Layer} [prop=thisProperty] The property
 * @return {number[]} The world velocity
 * @requires getPropWorldValue
 * @requires getLayerWorldPos
 */
function getPropWorldVelocity(t, prop) {
	if (typeof t === "undefined") t = time;
	return (getPropWorldValue(t + 0.005, prop) - getPropWorldValue(t - 0.005, prop)) * 100;
}

/**
 * Interpolates a value with a bezier curve.<br />
 * This method can replace <code>linear()</code> and <code>ease()</code> with a custom b�zier interpolation.
 * @function
 * @param {number} t The value to interpolate
 * @param {number} [tMin=0] The minimum value of the initial range
 * @param {number} [tMax=1] The maximum value of the initial range
 * @param {number} [value1=0] The minimum value of the interpolated result
 * @param {number} [value2=1] The maximum value of the interpolated result
 * @param {number[]} [bezierPoints=[0.33,0.0,0.66,1.0]] an Array of 4 coordinates wihtin the [0.0, 1.0] range which describes the B�zier interpolation. The default mimics the native ease() function<br />
 * [ outTangentX, outTangentY, inTangentX, inTangentY ]
 * @return {number} the value.
 */
function interpolationBezier(t, tMin, tMax, value1, value2, bezierPoints) {
    if (arguments.length !== 5) return value;
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


/**
 * Checks if current time is after the time of the last key in the property
 * @function
 * @return {boolean} true if time is > lastkey.time
 */
function isAfterLastKey() {
	if (numKeys == 0) return false;
	var nKey = nearestKey(time);
	return nKey.time <= time && nKey.index == numKeys;
}


/**
 * Checks if a property is a layer. Useful when traversing up the property tree to stop when getting the layer.
 * @function
 * @param {Property} prop - The property to test
 * @return {boolean} true if the prop is a layer
 */
function isLayer( prop ) {
	//try catch is needed for the legacy expression engine
	try { if ( prop.index ) return true; }
	catch (e) { return false; }
}

/**
 * Checks if a property is a transform.position property.
 * @function
 * @param {Property} [prop=thisProperty] The property
 * @return {boolean} true if the property is the transform.position property.
 */
function isPosition(prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (!(prop.value instanceof Array)) return false;
	if (prop.value.length > 3) return false;
	//compare the name, index and value with the real position
	if ( prop === transform.position ) return true;
	if ( prop === position ) return true;
	return false;
}

/**
 * Checks if a property is spatial
 * @param {Property} prop The property to check
 * @return {boolean} true if the property is spatial.
 */
function isSpatial(prop) {
	if (typeof prop === "undefined") prop = thisProperty;
	if (!(prop.value instanceof Array)) return false;
	if (prop.value.length != 2 && prop.value.length != 3) return false;
	try {
		sp = prop.speed;
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Checks if the current property is animated at a given time.
 * @function
 * @param {number} [t=time] The time
 * @param {number} [threshold=0.1] The speed under which the property is considered still.
 * @return {boolean} true if the property does not vary.
 */
function isStill(t, threshold) {
	if (typeof t === "undefined") t = time;
	if (typeof threshold === "undefined") threshold = 0.1;
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

/*!
  2D Transformation Matrix v2.7.5 LT
  (c) Epistemex.com 2014-2018
  License: MIT
*/

/**
  * 2D transformation matrix object initialized with identity matrix. See the source code for more documentation.
  * @class
  * @prop {number} a - scale x
  * @prop {number} b - shear y
  * @prop {number} c - shear x
  * @prop {number} d - scale y
  * @prop {number} e - translate x
  * @prop {number} f - translate y
  * @constructor
  * @overview 2D Transformation Matrix. Simplified for use in After Effects Expressions by Nicolas "Duduf" Dufresne
  * @author Epistemex
  * @version 2.7.5
  * @license MIT license (header required)
  * @copyright Epistemex.com 2014-2018
*/
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

	/**
	* Rotates current matrix by angle (accumulative).
	* @param {number} angle - angle in degrees
	* @returns {Matrix}
	*/
	rotate: function(angle) {
	 angle = degreesToRadians(angle);
	 var
		cos = Math.cos(angle),
		sin = Math.sin(angle);

	 return this._t(cos, sin, -sin, cos, 0, 0)
	},

	/**
	* Converts a vector given as `x` and `y` to angle, and
	* rotates (accumulative). x can instead contain an object with
	* properties x and y and if so, y parameter will be ignored.
	* @param {number|*} x
	* @param {number} [y]
	* @returns {Matrix}
	*/
	rotateFromVector: function(x, y) {
	 return this.rotate(typeof x === "number" ? Math.atan2(y, x) : Math.atan2(x.y, x.x))
	},

	/**
	* Scales current matrix accumulative.
	* @param {number[]} s - scale factor [x, y]. 1 does nothing, any third value (Z) is ignored.
	* @returns {Matrix}
	*/
	scale: function(s) {
	 return this._t(s[0], 0, 0, s[1], 0, 0);
	},

	/**
	* Apply shear to the current matrix accumulative.
	* @param {number} sx - amount of shear for x
	* @param {number} sy - amount of shear for y
	* @returns {Matrix}
	*/
	shear: function(sx, sy) {
	 return this._t(1, sy, sx, 1, 0, 0)
	},

	/**
	* Apply skew to the current matrix accumulative. Angles in radians.
	* Also see [`skewDeg()`]{@link Matrix#skewDeg}.
	* @param {number} ax - angle of skew for x
	* @param {number} ay - angle of skew for y
	* @returns {Matrix}
	*/
	skew: function(ax, ay) {
	 return this.shear(Math.tan(ax), Math.tan(ay))
	},

	/**
	* Set current matrix to new absolute matrix.
	* @param {number} a - scale x
	* @param {number} b - shear y
	* @param {number} c - shear x
	* @param {number} d - scale y
	* @param {number} e - translate x
	* @param {number} f - translate y
	* @returns {Matrix}
	*/
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

	/**
	* Translate current matrix accumulative.
	* @param {number[]} t - translation [x, y]. Any third value (Z) is ignored.
	* @returns {Matrix}
	*/
	translate: function(t) {
	 return this._t(1, 0, 0, 1, t[0], t[1]);
	},

	/**
	* Multiplies current matrix with new matrix values. Also see [`multiply()`]{@link Matrix#multiply}.
	*
	* @param {number} a2 - scale x
	* @param {number} b2 - skew y
	* @param {number} c2 - skew x
	* @param {number} d2 - scale y
	* @param {number} e2 - translate x
	* @param {number} f2 - translate y
	* @returns {Matrix}
	*/
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

	/**
	* Multiplies current matrix with source matrix.
	* @param {Matrix|Matrix|DOMMatrix|SVGMatrix} m - source matrix to multiply with.
	* @returns {Matrix}
	*/
	multiply: function(m) {
	 return this._t(m.a, m.b, m.c, m.d, m.e, m.f)
	},

	/**
	* Get an inverse matrix of current matrix. The method returns a new
	* matrix with values you need to use to get to an identity matrix.
	* Context from parent matrix is not applied to the returned matrix.
	*
	* @param {boolean} [cloneContext=false] - clone current context to resulting matrix
	* @throws Exception is input matrix is not invertible
	* @returns {Matrix} - new Matrix instance
	*/
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

	/**
	* Decompose the current matrix into simple transforms using QR.
	*
	* @returns {*} - an object containing current decomposed values (translate, rotation, scale, skew)
	* @see {@link https://en.wikipedia.org/wiki/QR_decomposition|More on QR decomposition}
	*/
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

		determ	= a * d - b * c,	// determinant(), skip DRY here...
		r, s;

	 // Apply the QR-like decomposition.
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
	 else { // a = b = c = d = 0
		scale = {x: 0, y: 0};
	 }

	 return {
		translate: translate,
		rotation : rotation,
		scale	: scale,
		skew	 : skew
	 }
	},

	/**
	* Returns the determinant of the current matrix.
	* @returns {number}
	*/
	determinant: function() {
	 return this.a * this.d - this.b * this.c
	},

	/**
	* Apply current matrix to `x` and `y` of a point.
	* Returns a point object.
	*
	* @param {number[]} pt - the point to transform ([x, y]).<br />
	* If an optionnal Z value is provided, it will be kept without transformation.
	* @returns {number[]} A new transformed point [x, y]. If pt had a third value, it is returned too, as it was without transformation.
	*/
	applyToPoint: function(pt) {
	 var me = this;
	 var x = pt[0] * me.a + pt[1] * me.c + me.e;
	 var y = pt[0] * me.b + pt[1] * me.d + me.f;
	 var result = [x,y];
	 if (pt.length == 3) result.push(pt[2]);
	 return result;
	},

	/**
	* Returns true if matrix is an identity matrix (no transforms applied).
	* @returns {boolean}
	*/
	isIdentity: function() {
	 var me = this;
	 return me.a === 1 && !me.b && !me.c && me.d === 1 && !me.e && !me.f
	},

	/**
	* Returns true if matrix is invertible
	* @returns {boolean}
	*/
	isInvertible: function() {
	 return !this._q(this.determinant(), 0)
	},

	/**
	* The method is intended for situations where scale is accumulated
	* via multiplications, to detect situations where scale becomes
	* "trapped" with a value of zero. And in which case scale must be
	* set explicitly to a non-zero value.
	*
	* @returns {boolean}
	*/
	isValid: function() {
	 return !(this.a * this.d)
	},

	/**
	* Compares current matrix with another matrix. Returns true if equal
	* (within epsilon tolerance).
	* @param {Matrix|Matrix|DOMMatrix|SVGMatrix} m - matrix to compare this matrix with
	* @returns {boolean}
	*/
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

	/**
	* Clones current instance and returning a new matrix.
	* @param {boolean} [noContext=false] don't clone context reference if true
	* @returns {Matrix} - a new Matrix instance with identical transformations as this instance
	*/
	clone: function(noContext) {
	 return new Matrix(noContext ? null : this.context).multiply(this)
	},

	/**
	* Compares floating point values with some tolerance (epsilon)
	* @param {number} f1 - float 1
	* @param {number} f2 - float 2
	* @returns {boolean}
	* @private
	*/
	_q: function(f1, f2) {
	 return Math.abs(f1 - f2) < 1e-14
	},

	/**
	* Apply current absolute matrix to context if defined, to sync it.
	* Apply current absolute matrix to element if defined, to sync it.
	* @returns {Matrix}
	* @private
	*/
	_x: function() {

	 var me = this;

	 //try catch is needed for the legacy expression engine
	 try { if (me.context)
		me.context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
	 } catch(e) {}

	 return me
	}
};


/**
 * Translates a point with a layer, as if it was parented to it.
 * @function
 * @param {Layer} l The layer to get the translation from.
 * @param {float[]} [point=[0,0]] The [X,Y] point to translate (using world coordinates).
 * @param {float} [startT=0] The start time of the translation
 * @param {float} [endT=time] The end time of the translation
 * @return {float[]} The coordinates of the translated point.
 */
function translatePointWithLayer( l, point, startT, endT ) {
    if (typeof startT === "undefined") startT = 0;
    if (typeof endT === "undefined") endT = time;
    try {
        var pos = l.fromWorld( point, startT );
    } catch ( e ) {
        var pos = [ 0, 0 ];
    }
    var prevPos = l.toWorld( pos, startT );
    var newPos = l.toWorld( pos, endT );
    return newPos - prevPos;
}


