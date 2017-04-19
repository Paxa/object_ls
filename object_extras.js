var ObjectKit = {};

var isPrototype = function isPrototype (obj) {
  var standartClasses = [
    Object,
    Function,
    Boolean,
    Error,
    EvalError,
    //InternalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    Number,
    Math,
    Date,
    String,
    RegExp,
    Array,
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    ArrayBuffer,
    DataView,
    JSON
  ];

  if (typeof obj == 'function' && obj.prototype) {
    if (standartClasses.indexOf(obj) != -1) return true;
  }

  return typeof obj == 'function' && obj.prototype && Object.keys(obj.prototype).length > 0;
};

ObjectKit.forEach = function Object_forEach (object, callback) {
  Object.keys(object).forEach((key) => {
    callback(key, object[key]);
  });
};


ObjectKit.values = Object.values || function Object_values (object) {
  var values = [];
  ObjectKit.forEach(object, function(key, value) { values.push(value); });
  return values;
};


// standart types + array, null, class, date, regexp
// standarts are: undefined, object, boolean, number, string, function
ObjectKit.realType = function Object_realType (object) {
  if (ObjectKit.isPrototype(object)) return 'class';

  if (typeof object == 'object') {
    if (object instanceof Date)        return 'date';
    if (object instanceof RegExp)      return 'regexp';
    if (Array.isArray(object))         return 'array';
    if (object === null)               return 'null';
  }

  return typeof object;
};

ObjectKit.methods = function Object_methods (object) {
  var methods = ObjectKit.ownMethods(object);

  ObjectKit.ancestors(object).forEach(function (klass) {
    ObjectKit.ownMethods(klass.prototype).forEach(function(methodName) {
      if (methods.indexOf(methodName) == -1) methods.push(methodName);
    });
  });

  return methods;
};


ObjectKit.ownMethods = function Object_ownMethods (object) {
  var methods = [];

  if (typeof object == 'object' || typeof object == 'function') {
    Object.getOwnPropertyNames(object).forEach(function (key) {
      if (key == 'constructor') return;
      var prop = Object.getOwnPropertyDescriptor(object, key);
      if (!('value' in prop) || !prop.enumerable) {
        if (typeof prop.value == 'function' && !isPrototype(prop.value)) {
          methods.push(key);
        }
      }
    });
  }

  for (var prop in object) {
    try {
      if (object.hasOwnProperty(prop) && typeof object[prop] == 'function' && !isPrototype(object[prop])) {
        methods.push(prop);
      }
    } catch (error) {
      console.error(error);
    }
  }
  return methods;
};


ObjectKit.ownProperties = function Object_ownProperties (object) {
  var properties;
  if (typeof object == 'object' && object != null || typeof object == 'function') {
    properties = Object.getOwnPropertyNames(object);
  } else {
    return [];
  }

  var filtered = [];

  properties.forEach(function(key) {
    if (key == 'constructor') {
      filtered.push(key);
      return;
    }
    var prop = Object.getOwnPropertyDescriptor(object, key);
    if (!('value' in prop) || !prop.enumerable) {
      if (typeof prop.value != 'function' || isPrototype(prop.value)) {
        filtered.push(key);
      }
    }
  });

  return filtered;
};


ObjectKit.properties = function Object_properties (object) {
  var properties = ObjectKit.ownProperties(object);

  ObjectKit.ancestors(object).forEach(function (klass) {
    ObjectKit.ownProperties(klass.prototype).forEach(function(methodName) {
      if (properties.indexOf(methodName) == -1) properties.push(methodName);
    });
  });

  return properties;
};

ObjectKit.dynamicProperties = function(object) {
  var properties;
  if (typeof object == 'object' && object != null || typeof object == 'function') {
    properties = Object.getOwnPropertyNames(object);
  } else {
    return [];
  }

  var filtered = [];
  properties.forEach(function(key) {
    var prop = Object.getOwnPropertyDescriptor(object, key);
    if (!('value' in prop) && ('get' in prop)) {
      filtered.push(key);
    }
  });

  return filtered;
};

ObjectKit.allProperties = function(object) {
  var props = [];

  do {
    Object.getOwnPropertyNames(object).forEach(function (prop) {
      if (props.indexOf(prop) === -1) props.push(prop);
    });
  } while (object = Object.getPrototypeOf(object));

  return props;
};

ObjectKit.instanceVariables = function Object_instanceVariables (object) {
  var ivars = {};
  for (var i in object) {
    if (typeof object[i] != 'function' || isPrototype(object[i])) ivars[i] = object[i];
  }
  return ivars;
};

ObjectKit.instanceVariableNames = function Object_instanceVariableNames (object) {
  var keys = [];
  for (var i in object) {
    if (typeof object[i] != 'function' || isPrototype(object[i])) keys.push(i);
  }
  return keys;
};

ObjectKit.ancestors = function Object_ancestors (object) {
  prototypes = [];

  if (typeof object == 'number') {
    object = Number.prototype;
    prototypes.push(Number);
  }

  if (typeof object == 'string') {
    object = String.prototype;
    prototypes.push(String);
  }

  if (typeof object == 'boolean') {
    object = Boolean.prototype;
    prototypes.push(Boolean);
  }

  if (typeof object == 'undefined' || (typeof object == 'object' && object == null)) {
    return [];
  }

  var last = object;
  while (last = Object.getPrototypeOf(last)) {
    prototypes.push(last.constructor);
  }

  return prototypes;
};

ObjectKit.isPrototype = isPrototype;
ObjectKit.isConstructor = ObjectKit.isPrototype;

// Same as ruby's Object#present
ObjectKit.present = function Object_present (object) {
  if (typeof object == 'string'  && object.trim() != "") return true;
  if (typeof object == 'boolean' && object) return true;
  if (typeof object == 'number') return true;
  if (typeof object == 'function') return true;
  if (typeof object == 'object') {
    if (object === null) return false;
    if (Array.isArray(object) && object.length == 0) return false;
    if (Object.keys(object).length === 0) return false;
    return true;
  }
  return false;
};

ObjectKit.funArgs = function (fn) {
  var fnSource = fn.toString();
  if (fnSource == 'function () { [native code] }' || fnSource.match(/^function\s.+() { \[native code\] }$/)) {
    return ' -> native code';
  } else {
    var m = fnSource.match(/^function\s*([^\(]+)?\((.*?)\)[\s\n]*{/);
    if (!m) {
      console.log(fnSource);
    }
    return m && `(${m[2]})`;
  }
}

/*
ObjectKit.extendGlobal = function () {
  ObjectKit.forEach(ObjectKit, function (key, value) {
    if (key != 'extendGlobal') Object[key] = value;
  });
};
*/

module.exports = ObjectKit;
