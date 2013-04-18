//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

/*! Social Likes v2.0.7 by Artem Sapegin - http://sapegin.github.com/social-likes - Licensed MIT */
(function(e){typeof define=="function"&&define.amd?define(["jquery"],e):e(jQuery)})(function(e){"use strict";function s(e){this.container=e,this.init()}function o(t,n){this.widget=t,this.options=e.extend({},n),this.detectService(),this.service&&this.init()}function u(e,t){return a(e,t,encodeURIComponent)}function a(e,t,n){return e.replace(/\{([^\}]+)\}/g,function(e,r){return r in t?n?n(t[r]):t[r]:e})}function f(e,n){var r=t+e;return r+" "+r+"_"+n}function l(t){function r(o){if(o.type==="keydown"&&o.which!==27||e(o.target).closest(t).length)return;t.fadeOut(n),i.off(s,r)}var i=e(document),s="click touchstart keydown";i.on(s,r)}function c(e,t){if(document.documentElement.getBoundingClientRect){var r=parseInt(e.css("left"),10),i=parseInt(e.css("top"),10);e.css("visibility","hidden").show();var s=e[0].getBoundingClientRect();s.left<t?e.css("left",t-s.left+r):s.right>window.innerWidth-t&&e.css("left",window.innerWidth-s.right-t+r),s.top<t?e.css("top",t-s.top+i):s.bottom>window.innerHeight-t&&e.css("top",window.innerHeight-s.bottom-t+i),e.hide().css("visibility","visible")}e.fadeIn(n)}var t="social-likes__",n="fast",r={facebook:{counterUrl:"http://graph.facebook.com/fql?q=SELECT+total_count+FROM+link_stat+WHERE+url%3D%22{url}%22&callback=?",convertNumber:function(e){return e.data[0].total_count},popupUrl:"http://www.facebook.com/sharer/sharer.php?u={url}",popupWidth:600,popupHeight:500},twitter:{counterUrl:"http://urls.api.twitter.com/1/urls/count.json?url={url}&callback=?",convertNumber:function(e){return e.count},popupUrl:"http://twitter.com/intent/tweet?url={url}&text={title}",popupWidth:600,popupHeight:450,click:function(){return/[\.:\-–—]\s*$/.test(this.options.pageTitle)||(this.options.pageTitle+=":"),!0}},mailru:{counterUrl:"http://connect.mail.ru/share_count?url_list={url}&callback=1&func=?",convertNumber:function(e){for(var t in e)if(e.hasOwnProperty(t))return e[t].shares},popupUrl:"http://connect.mail.ru/share?share_url={url}&title={title}",popupWidth:550,popupHeight:360},vkontakte:{counterUrl:"http://vkontakte.ru/share.php?act=count&url={url}&index={index}",counter:function(t,n){var i=r.vkontakte;i._||(i._=[],window.VK||(window.VK={}),window.VK.Share={count:function(e,t){i._[e].resolve(t)}});var s=i._.length;i._.push(n),e.ajax({url:u(t,{index:s}),dataType:"jsonp"})},popupUrl:"http://vk.com/share.php?url={url}&title={title}",popupWidth:550,popupHeight:330},odnoklassniki:{counterUrl:"http://www.odnoklassniki.ru/dk?st.cmd=extLike&ref={url}&uid={index}",counter:function(t,n){var i=r.odnoklassniki;i._||(i._=[],window.ODKL||(window.ODKL={}),window.ODKL.updateCount=function(e,t){i._[e].resolve(t)});var s=i._.length;i._.push(n),e.ajax({url:u(t,{index:s}),dataType:"jsonp"})},popupUrl:"http://www.odnoklassniki.ru/dk?st.cmd=addShare&st._surl={url}",popupWidth:550,popupHeight:360},plusone:{popupUrl:"https://plus.google.com/share?url={url}",popupWidth:700,popupHeight:500},livejournal:{click:function(t){var n=this._livejournalForm;if(!n){var r=this.options.pageHtml.replace(/&/g,"&amp;").replace(/"/g,"&quot;");n=e(a('<form action="http://www.livejournal.com/update.bml" method="post" target="_blank" accept-charset="UTF-8"><input type="hidden" name="mode" value="full"><input type="hidden" name="subject" value="{title}"><input type="hidden" name="event" value="{html}"></form>',{title:this.options.pageTitle,html:r})),this.widget.append(n),this._livejournalForm=n}n.submit()}},pinterest:{counterUrl:"http://api.pinterest.com/v1/urls/count.json?url={url}&callback=?",convertNumber:function(e){return e.count},popupUrl:"http://pinterest.com/pin/create/button/?url={url}&description={title}",popupWidth:630,popupHeight:270}},i={promises:{},fetch:function(t,n,s){i.promises[t]||(i.promises[t]={});var o=i.promises[t];if(o[n])return o[n];var a=e.extend({},r[t],s),f=e.Deferred(),l=a.counterUrl&&u(a.counterUrl,{url:n});return e.isFunction(a.counter)?a.counter(l,f):a.counterUrl&&e.getJSON(l).done(function(t){try{var n=t;e.isFunction(a.convertNumber)&&(n=a.convertNumber(t)),f.resolve(n)}catch(r){f.reject(r)}}),o[n]=f.promise(),o[n]}};e.fn.socialLikes=function(){return this.each(function(){new s(e(this))})},s.prototype={optionsMap:{pageUrl:{attr:"url",defaultValue:function(){return window.location.href.replace(window.location.hash,"")}},pageTitle:{attr:"title",defaultValue:function(){return document.title}},pageHtml:{attr:"html",defaultValue:function(){return'<a href="'+this.options.pageUrl+'">'+this.options.pageTitle+"</a>"}},pageCounters:{attr:"counters",defaultValue:"yes",convert:function(e){return e==="yes"}}},init:function(){this.readOptions(),this.single=this.container.hasClass("social-likes_single"),this.initUserButtons(),this.single&&(this.makeSingleButton(),this.container.on("counter.social-likes",e.proxy(this.updateCounter,this)));var t=this.options;this.container.find("li").each(function(){new o(e(this),t)})},readOptions:function(){this.options={};for(var t in this.optionsMap){var n=this.optionsMap[t];this.options[t]=this.container.data(n.attr)||(e.isFunction(n.defaultValue)?e.proxy(n.defaultValue,this)():n.defaultValue),e.isFunction(n.convert)&&(this.options[t]=n.convert(this.options[t]))}},initUserButtons:function(){!this.userButtonInited&&window.socialLikesButtons&&e.extend(r,socialLikesButtons),this.userButtonInited=!0},makeSingleButton:function(){var r=this.container;r.addClass("social-likes_vertical"),r.wrap(e("<div>",{"class":"social-likes_single-w"}));var i=r.parent(),s=parseInt(r.css("left"),10),o=parseInt(r.css("top"),10);r.hide();var u=e("<div>",{"class":f("button","single"),text:r.data("single-title")||"Share"});u.prepend(e("<span>",{"class":f("icon","single")})),i.append(u);var a=e("<li>",{"class":t+"close",html:"&times;"});r.append(a),this.number=0,u.click(function(){return r.css({left:s,top:o}),c(r,20),l(r),!1}),a.click(function(){r.fadeOut(n)}),this.wrapper=i},updateCounter:function(e,t){if(!t)return;this.number+=t,this.getCounterElem().text(this.number)},getCounterElem:function(){var n=this.wrapper.find("."+t+"counter_single");return n.length||(n=e("<span>",{"class":f("counter","single")}),this.wrapper.append(n)),n}},o.prototype={init:function(){this.detectParams(),this.initHtml();if(this.options.pageCounters)if(this.options.counterNumber)this.updateCounter(this.options.counterNumber);else{var t=this.options.counterUrl?{counterUrl:this.options.counterUrl}:{};i.fetch(this.service,this.options.pageUrl,t).done(e.proxy(this.updateCounter,this))}},detectService:function(){var t=this.widget[0].classList||this.widget[0].className.split(" ");for(var n=0;n<t.length;n++){var i=t[n];if(r[i]){this.service=i,e.extend(this.options,r[i]);return}}},detectParams:function(){var e=this.widget.data("counter");if(e){var t=parseInt(e,10);isNaN(t)?this.options.counterUrl=e:this.options.counterNumber=t}var n=this.widget.data("title");n&&(this.options.pageTitle=n);var r=this.widget.data("url");r&&(this.options.pageUrl=r)},initHtml:function(){var t=this.options,n=this.widget,r=!!t.clickUrl;n.removeClass(this.service),n.addClass(this.getElementClassNames("widget"));var i=n.find("a");i.length&&this.cloneDataAttrs(i,n);var s=e(r?"<a>":"<span>",{"class":this.getElementClassNames("button"),text:n.text()});if(r){var o=u(t.clickUrl,{url:t.pageUrl,title:t.pageTitle});s.attr("href",o)}else s.click(e.proxy(this.click,this));s.prepend(e("<span>",{"class":this.getElementClassNames("icon")})),n.empty().append(s),this.button=s},cloneDataAttrs:function(e,t){var n=e.data();for(var r in n)n.hasOwnProperty(r)&&t.data(r,n[r])},getElementClassNames:function(e){return f(e,this.service)},updateCounter:function(t){t=parseInt(t,10);if(!t)return;var n=e("<span>",{"class":this.getElementClassNames("counter"),text:t});this.widget.append(n),this.widget.trigger("counter.social-likes",t)},click:function(t){var n=this.options,r=!0;e.isFunction(n.click)&&(r=n.click.call(this,t));if(r){var i=u(n.popupUrl,{url:n.pageUrl,title:n.pageTitle});i=this.addAdditionalParamsToUrl(i),this.openPopup(i,{width:n.popupWidth,height:n.popupHeight})}return!1},addAdditionalParamsToUrl:function(t){var n=e.param(this.widget.data());if(!n)return t;var r=t.indexOf("?")===-1?"?":"&";return t+r+n},openPopup:function(e,t){var n=Math.round(screen.width/2-t.width/2),r=0;screen.height>t.height&&(r=Math.round(screen.height/3-t.height/2));var i=window.open(e,"sl_"+this.service,"left="+n+",top="+r+","+"width="+t.width+",height="+t.height+",personalbar=0,toolbar=0,scrollbars=1,resizable=1");i?i.focus():location.href=e}},e(function(){e(".social-likes").socialLikes()})});
/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.1
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ($.event.fixHooks) {
        for ( var i=toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i=toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i=toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, deltaX = 0, deltaY = 0, absDelta = 0, absDeltaXY = 0, fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta;  }
        if ( orgEvent.detail     ) { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max( Math.abs(deltaY), Math.abs(deltaX) );
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta/lowestDelta);
        deltaX = Math[fn](deltaX/lowestDeltaXY);
        deltaY = Math[fn](deltaY/lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));

//Copyright (C) 2011 by Living Social, Inc.

//Permission is hereby granted, free of charge, to any person obtaining a copy of
//this software and associated documentation files (the "Software"), to deal in
//the Software without restriction, including without limitation the rights to
//use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
//of the Software, and to permit persons to whom the Software is furnished to do
//so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all
//copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//SOFTWARE.

/**
  Ember Data
  @module data
*/

/**
  @module data

  @main data
*/

window.DS = Ember.Namespace.create({
  // this one goes past 11
  CURRENT_API_REVISION: 12
});

/**
 * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
 * © 2011 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */

Ember.Date = Ember.Date || {};

var origParse = Date.parse, numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];
Ember.Date.parse = function (date) {
    var timestamp, struct, minutesOffset = 0;

    // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
    // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
    // implementations could be faster
    //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
    if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
        // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
        for (var i = 0, k; (k = numericKeys[i]); ++i) {
            struct[k] = +struct[k] || 0;
        }

        // allow undefined days and months
        struct[2] = (+struct[2] || 1) - 1;
        struct[3] = +struct[3] || 1;

        if (struct[8] !== 'Z' && struct[9] !== undefined) {
            minutesOffset = struct[10] * 60 + struct[11];

            if (struct[9] === '+') {
                minutesOffset = 0 - minutesOffset;
            }
        }

        timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
    }
    else {
        timestamp = origParse ? origParse(date) : NaN;
    }

    return timestamp;
};

if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Date) {
  Date.parse = Ember.Date.parse;
}


/*globals Ember*/
/*jshint eqnull:true*/

/**
  @module data
  @submodule data-record-array
*/

var DeferredMixin = Ember.DeferredMixin,  // ember-runtime/mixins/deferred
    Evented = Ember.Evented,              // ember-runtime/mixins/evented
    run = Ember.run,                      // ember-metal/run-loop
    get = Ember.get;                      // ember-metal/accessors

var LoadPromise = Ember.Mixin.create(Evented, DeferredMixin, {
  init: function() {
    this._super.apply(this, arguments);
    this.one('didLoad', function() {
      run(this, 'resolve', this);
    });

    if (get(this, 'isLoaded')) {
      this.trigger('didLoad');
    }
  }
});

DS.LoadPromise = LoadPromise;


/**
*/

var get = Ember.get, set = Ember.set;

var LoadPromise = DS.LoadPromise; // system/mixins/load_promise

/**
  A record array is an array that contains records of a certain type. The record
  array materializes records as needed when they are retrieved for the first
  time. You should not create record arrays yourself. Instead, an instance of
  DS.RecordArray or its subclasses will be returned by your application's store
  in response to queries.

  @module data
  @submodule data-record-array
  @main data-record-array

  @class RecordArray
  @namespace DS
  @extends Ember.ArrayProxy
  @uses Ember.Evented
  @uses DS.LoadPromise
*/

DS.RecordArray = Ember.ArrayProxy.extend(Ember.Evented, LoadPromise, {
  /**
    The model type contained by this record array.

    @type DS.Model
  */
  type: null,

  // The array of client ids backing the record array. When a
  // record is requested from the record array, the record
  // for the client id at the same index is materialized, if
  // necessary, by the store.
  content: null,

  isLoaded: false,
  isUpdating: false,

  // The store that created this record array.
  store: null,

  objectAtContent: function(index) {
    var content = get(this, 'content'),
        reference = content.objectAt(index),
        store = get(this, 'store');

    if (reference) {
      return store.recordForReference(reference);
    }
  },

  materializedObjectAt: function(index) {
    var reference = get(this, 'content').objectAt(index);
    if (!reference) { return; }

    if (get(this, 'store').recordIsMaterialized(reference)) {
      return this.objectAt(index);
    }
  },

  update: function() {
    if (get(this, 'isUpdating')) { return; }

    var store = get(this, 'store'),
        type = get(this, 'type');

    store.fetchAll(type, this);
  },

  addReference: function(reference) {
    get(this, 'content').addObject(reference);
  },

  removeReference: function(reference) {
    get(this, 'content').removeObject(reference);
  }
});



/**
  @module data
  @submodule data-record-array
*/

var get = Ember.get;

/**
  @class FilteredRecordArray
  @namespace DS
  @extends DS.RecordArray
  @constructor
*/
DS.FilteredRecordArray = DS.RecordArray.extend({
  filterFunction: null,
  isLoaded: true,

  replace: function() {
    var type = get(this, 'type').toString();
    throw new Error("The result of a client-side filter (on " + type + ") is immutable.");
  },

  updateFilter: Ember.observer(function() {
    var store = get(this, 'store');
    store.updateRecordArrayFilter(this, get(this, 'type'), get(this, 'filterFunction'));
  }, 'filterFunction')
});



/**
  @module data
  @submodule data-record-array
*/

var get = Ember.get, set = Ember.set;

/**
  @class AdapterPopulatedRecordArray
  @namespace DS
  @extends DS.RecordArray
  @constructor
*/
DS.AdapterPopulatedRecordArray = DS.RecordArray.extend({
  query: null,

  replace: function() {
    var type = get(this, 'type').toString();
    throw new Error("The result of a server query (on " + type + ") is immutable.");
  },

  load: function(references) {
    this.beginPropertyChanges();
    set(this, 'content', Ember.A(references));
    set(this, 'isLoaded', true);
    this.endPropertyChanges();

    var self = this;
    // TODO: does triggering didLoad event should be the last action of the runLoop?
    Ember.run.once(function() {
      self.trigger('didLoad');
    });
  }
});



/**
  @module data
  @submodule data-record-array
*/

var get = Ember.get, set = Ember.set;

/**
  A ManyArray is a RecordArray that represents the contents of a has-many
  relationship.

  The ManyArray is instantiated lazily the first time the relationship is
  requested.

  ### Inverses

  Often, the relationships in Ember Data applications will have
  an inverse. For example, imagine the following models are
  defined:

      App.Post = DS.Model.extend({
        comments: DS.hasMany('App.Comment')
      });

      App.Comment = DS.Model.extend({
        post: DS.belongsTo('App.Post')
      });

  If you created a new instance of `App.Post` and added
  a `App.Comment` record to its `comments` has-many
  relationship, you would expect the comment's `post`
  property to be set to the post that contained
  the has-many.

  We call the record to which a relationship belongs the
  relationship's _owner_.

  @class ManyArray
  @namespace DS
  @extends DS.RecordArray
  @constructor
*/
DS.ManyArray = DS.RecordArray.extend({
  init: function() {
    this._super.apply(this, arguments);
    this._changesToSync = Ember.OrderedSet.create();
  },

  /**
    @private

    The record to which this relationship belongs.

    @property {DS.Model}
  */
  owner: null,

  /**
    @private

    `true` if the relationship is polymorphic, `false` otherwise.

    @property {Boolean}
  */
  isPolymorphic: false,

  // LOADING STATE

  isLoaded: false,

  loadingRecordsCount: function(count) {
    this.loadingRecordsCount = count;
  },

  loadedRecord: function() {
    this.loadingRecordsCount--;
    if (this.loadingRecordsCount === 0) {
      set(this, 'isLoaded', true);
      this.trigger('didLoad');
    }
  },

  fetch: function() {
    var references = get(this, 'content'),
        store = get(this, 'store'),
        owner = get(this, 'owner');

    store.fetchUnloadedReferences(references, owner);
  },

  // Overrides Ember.Array's replace method to implement
  replaceContent: function(index, removed, added) {
    // Map the array of record objects into an array of  client ids.
    added = added.map(function(record) {
      Ember.assert("You can only add records of " + (get(this, 'type') && get(this, 'type').toString()) + " to this relationship.", !get(this, 'type') || (get(this, 'type').detectInstance(record)) );
      return get(record, '_reference');
    }, this);

    this._super(index, removed, added);
  },

  arrangedContentDidChange: function() {
    this.fetch();
  },

  arrayContentWillChange: function(index, removed, added) {
    var owner = get(this, 'owner'),
        name = get(this, 'name');

    if (!owner._suspendedRelationships) {
      // This code is the first half of code that continues inside
      // of arrayContentDidChange. It gets or creates a change from
      // the child object, adds the current owner as the old
      // parent if this is the first time the object was removed
      // from a ManyArray, and sets `newParent` to null.
      //
      // Later, if the object is added to another ManyArray,
      // the `arrayContentDidChange` will set `newParent` on
      // the change.
      for (var i=index; i<index+removed; i++) {
        var reference = get(this, 'content').objectAt(i);

        var change = DS.RelationshipChange.createChange(owner.get('_reference'), reference, get(this, 'store'), {
          parentType: owner.constructor,
          changeType: "remove",
          kind: "hasMany",
          key: name
        });

        this._changesToSync.add(change);
      }
    }

    return this._super.apply(this, arguments);
  },

  arrayContentDidChange: function(index, removed, added) {
    this._super.apply(this, arguments);

    var owner = get(this, 'owner'),
        name = get(this, 'name'),
        store = get(this, 'store');

    if (!owner._suspendedRelationships) {
      // This code is the second half of code that started in
      // `arrayContentWillChange`. It gets or creates a change
      // from the child object, and adds the current owner as
      // the new parent.
      for (var i=index; i<index+added; i++) {
        var reference = get(this, 'content').objectAt(i);

        var change = DS.RelationshipChange.createChange(owner.get('_reference'), reference, store, {
          parentType: owner.constructor,
          changeType: "add",
          kind:"hasMany",
          key: name
        });
        change.hasManyName = name;

        this._changesToSync.add(change);
      }

      // We wait until the array has finished being
      // mutated before syncing the OneToManyChanges created
      // in arrayContentWillChange, so that the array
      // membership test in the sync() logic operates
      // on the final results.
      this._changesToSync.forEach(function(change) {
        change.sync();
      });
      DS.OneToManyChange.ensureSameTransaction(this._changesToSync, store);
      this._changesToSync.clear();
    }
  },

  // Create a child record within the owner
  createRecord: function(hash, transaction) {
    var owner = get(this, 'owner'),
        store = get(owner, 'store'),
        type = get(this, 'type'),
        record;

    Ember.assert("You can not create records of " + (get(this, 'type') && get(this, 'type').toString()) + " on this polymorphic relationship.", !get(this, 'isPolymorphic'));

    transaction = transaction || get(owner, 'transaction');

    record = store.createRecord.call(store, type, hash, transaction);
    this.pushObject(record);

    return record;
  }

});


var get = Ember.get, set = Ember.set, forEach = Ember.EnumerableUtils.forEach;

/**
  @module data
  @submodule data-transaction
*/

/**
  A transaction allows you to collect multiple records into a unit of work
  that can be committed or rolled back as a group.

  For example, if a record has local modifications that have not yet
  been saved, calling `commit()` on its transaction will cause those
  modifications to be sent to the adapter to be saved. Calling
  `rollback()` on its transaction would cause all of the modifications to
  be discarded and the record to return to the last known state before
  changes were made.

  If a newly created record's transaction is rolled back, it will
  immediately transition to the deleted state.

  If you do not explicitly create a transaction, a record is assigned to
  an implicit transaction called the default transaction. In these cases,
  you can treat your application's instance of `DS.Store` as a transaction
  and call the `commit()` and `rollback()` methods on the store itself.

  Once a record has been successfully committed or rolled back, it will
  be moved back to the implicit transaction. Because it will now be in
  a clean state, it can be moved to a new transaction if you wish.

  ### Creating a Transaction

  To create a new transaction, call the `transaction()` method of your
  application's `DS.Store` instance:

      var transaction = App.store.transaction();

  This will return a new instance of `DS.Transaction` with no records
  yet assigned to it.

  ### Adding Existing Records

  Add records to a transaction using the `add()` method:

      record = App.store.find(App.Person, 1);
      transaction.add(record);

  Note that only records whose `isDirty` flag is `false` may be added
  to a transaction. Once modifications to a record have been made
  (its `isDirty` flag is `true`), it is not longer able to be added to
  a transaction.

  ### Creating New Records

  Because newly created records are dirty from the time they are created,
  and because dirty records can not be added to a transaction, you must
  use the `createRecord()` method to assign new records to a transaction.

  For example, instead of this:

    var transaction = store.transaction();
    var person = App.Person.createRecord({ name: "Steve" });

    // won't work because person is dirty
    transaction.add(person);

  Call `createRecord()` on the transaction directly:

    var transaction = store.transaction();
    transaction.createRecord(App.Person, { name: "Steve" });

  ### Asynchronous Commits

  Typically, all of the records in a transaction will be committed
  together. However, new records that have a dependency on other new
  records need to wait for their parent record to be saved and assigned an
  ID. In that case, the child record will continue to live in the
  transaction until its parent is saved, at which time the transaction will
  attempt to commit again.

  For this reason, you should not re-use transactions once you have committed
  them. Always make a new transaction and move the desired records to it before
  calling commit.
*/

DS.Transaction = Ember.Object.extend({
  /**
    @private

    Creates the bucket data structure used to segregate records by
    type.
  */
  init: function() {
    set(this, 'buckets', {
      clean:    Ember.OrderedSet.create(),
      created:  Ember.OrderedSet.create(),
      updated:  Ember.OrderedSet.create(),
      deleted:  Ember.OrderedSet.create(),
      inflight: Ember.OrderedSet.create()
    });

    set(this, 'relationships', Ember.OrderedSet.create());
  },

  /**
    Creates a new record of the given type and assigns it to the transaction
    on which the method was called.

    This is useful as only clean records can be added to a transaction and
    new records created using other methods immediately become dirty.

    @param {DS.Model} type the model type to create
    @param {Object} hash the data hash to assign the new record
  */
  createRecord: function(type, hash) {
    var store = get(this, 'store');

    return store.createRecord(type, hash, this);
  },

  isEqualOrDefault: function(other) {
    if (this === other || other === get(this, 'store.defaultTransaction')) {
      return true;
    }
  },

  isDefault: Ember.computed(function() {
    return this === get(this, 'store.defaultTransaction');
  }),

  /**
    Adds an existing record to this transaction. Only records without
    modficiations (i.e., records whose `isDirty` property is `false`)
    can be added to a transaction.

    @param {DS.Model} record the record to add to the transaction
  */
  add: function(record) {
    Ember.assert("You must pass a record into transaction.add()", record instanceof DS.Model);

    var recordTransaction = get(record, 'transaction'),
        defaultTransaction = get(this, 'store.defaultTransaction');

    // Make `add` idempotent
    if (recordTransaction === this) { return; }

    // XXX it should be possible to move a dirty transaction from the default transaction

    // we could probably make this work if someone has a valid use case. Do you?
    Ember.assert("Once a record has changed, you cannot move it into a different transaction", !get(record, 'isDirty'));

    Ember.assert("Models cannot belong to more than one transaction at a time.", recordTransaction === defaultTransaction);

    this.adoptRecord(record);
  },

  relationshipBecameDirty: function(relationship) {
    get(this, 'relationships').add(relationship);
  },

  relationshipBecameClean: function(relationship) {
    get(this, 'relationships').remove(relationship);
  },

  /**
    Commits the transaction, which causes all of the modified records that
    belong to the transaction to be sent to the adapter to be saved.

    Once you call `commit()` on a transaction, you should not re-use it.

    When a record is saved, it will be removed from this transaction and
    moved back to the store's default transaction.
  */
  commit: function() {
    var store = get(this, 'store');
    var adapter = get(store, '_adapter');
    var defaultTransaction = get(store, 'defaultTransaction');

    var iterate = function(records) {
      var set = records.copy();
      set.forEach(function (record) {
        record.send('willCommit');
      });
      return set;
    };

    var relationships = get(this, 'relationships');

    var commitDetails = {
      created: iterate(this.bucketForType('created')),
      updated: iterate(this.bucketForType('updated')),
      deleted: iterate(this.bucketForType('deleted')),
      relationships: relationships
    };

    if (this === defaultTransaction) {
      set(store, 'defaultTransaction', store.transaction());
    }

    this.removeCleanRecords();

    if (!commitDetails.created.isEmpty() || !commitDetails.updated.isEmpty() || !commitDetails.deleted.isEmpty() || !relationships.isEmpty()) {

      Ember.assert("You tried to commit records but you have no adapter", adapter);
      Ember.assert("You tried to commit records but your adapter does not implement `commit`", adapter.commit);

      adapter.commit(store, commitDetails);
    }

    // Once we've committed the transaction, there is no need to
    // keep the OneToManyChanges around. Destroy them so they
    // can be garbage collected.
    relationships.forEach(function(relationship) {
      relationship.destroy();
    });
  },

  /**
    Rolling back a transaction resets the records that belong to
    that transaction.

    Updated records have their properties reset to the last known
    value from the persistence layer. Deleted records are reverted
    to a clean, non-deleted state. Newly created records immediately
    become deleted, and are not sent to the adapter to be persisted.

    After the transaction is rolled back, any records that belong
    to it will return to the store's default transaction, and the
    current transaction should not be used again.
  */
  rollback: function() {
    // Loop through all of the records in each of the dirty states
    // and initiate a rollback on them. As a side effect of telling
    // the record to roll back, it should also move itself out of
    // the dirty bucket and into the clean bucket.
    ['created', 'updated', 'deleted', 'inflight'].forEach(function(bucketType) {
      var records = this.bucketForType(bucketType);
      forEach(records, function(record) {
        record.send('rollback');
      });
      records.clear();
    }, this);

    // Now that all records in the transaction are guaranteed to be
    // clean, migrate them all to the store's default transaction.
    this.removeCleanRecords();
  },

  /**
    @private

    Removes a record from this transaction and back to the store's
    default transaction.

    Note: This method is private for now, but should probably be exposed
    in the future once we have stricter error checking (for example, in the
    case of the record being dirty).

    @param {DS.Model} record
  */
  remove: function(record) {
    var defaultTransaction = get(this, 'store.defaultTransaction');
    defaultTransaction.adoptRecord(record);
  },

  /**
    @private

    Removes all of the records in the transaction's clean bucket.
  */
  removeCleanRecords: function() {
    var clean = this.bucketForType('clean');
    clean.forEach(function(record) {
      this.remove(record);
    }, this);
    clean.clear();
  },

  /**
    @private

    Returns the bucket for the given bucket type. For example, you might call
    `this.bucketForType('updated')` to get the `Ember.Map` that contains all
    of the records that have changes pending.

    @param {String} bucketType the type of bucket
    @returns Ember.Map
  */
  bucketForType: function(bucketType) {
    var buckets = get(this, 'buckets');

    return get(buckets, bucketType);
  },

  /**
    @private

    This method moves a record into a different transaction without the normal
    checks that ensure that the user is not doing something weird, like moving
    a dirty record into a new transaction.

    It is designed for internal use, such as when we are moving a clean record
    into a new transaction when the transaction is committed.

    This method must not be called unless the record is clean.

    @param {DS.Model} record
  */
  adoptRecord: function(record) {
    var oldTransaction = get(record, 'transaction');

    if (oldTransaction) {
      oldTransaction.removeFromBucket('clean', record);
    }

    this.addToBucket('clean', record);
    set(record, 'transaction', this);
  },

  /**
    @private

    Adds a record to the named bucket.

    @param {String} bucketType one of `clean`, `created`, `updated`, or `deleted`
  */
  addToBucket: function(bucketType, record) {
    this.bucketForType(bucketType).add(record);
  },

  /**
    @private

    Removes a record from the named bucket.

    @param {String} bucketType one of `clean`, `created`, `updated`, or `deleted`
  */
  removeFromBucket: function(bucketType, record) {
    this.bucketForType(bucketType).remove(record);
  },

  /**
    @private

    Called by a record's state manager to indicate that the record has entered
    a dirty state. The record will be moved from the `clean` bucket and into
    the appropriate dirty bucket.

    @param {String} bucketType one of `created`, `updated`, or `deleted`
  */
  recordBecameDirty: function(bucketType, record) {
    this.removeFromBucket('clean', record);
    this.addToBucket(bucketType, record);
  },

  /**
    @private

    Called by a record's state manager to indicate that the record has entered
    inflight state. The record will be moved from its current dirty bucket and into
    the `inflight` bucket.

    @param {String} bucketType one of `created`, `updated`, or `deleted`
  */
  recordBecameInFlight: function(kind, record) {
    this.removeFromBucket(kind, record);
    this.addToBucket('inflight', record);
  },

  recordIsMoving: function(kind, record) {
    this.removeFromBucket(kind, record);
    this.addToBucket('clean', record);
  },

  /**
    @private

    Called by a record's state manager to indicate that the record has entered
    a clean state. The record will be moved from its current dirty or inflight bucket and into
    the `clean` bucket.

    @param {String} bucketType one of `created`, `updated`, or `deleted`
  */
  recordBecameClean: function(kind, record) {
    this.removeFromBucket(kind, record);
    this.remove(record);
  }
});

var get = Ember.get;

/**
  The Mappable mixin is designed for classes that would like to
  behave as a map for configuration purposes.

  For example, the DS.Adapter class can behave like a map, with
  more semantic API, via the `map` API:

    DS.Adapter.map('App.Person', { firstName: { key: 'FIRST' } });

  Class configuration via a map-like API has a few common requirements
  that differentiate it from the standard Ember.Map implementation.

  First, values often are provided as strings that should be normalized
  into classes the first time the configuration options are used.

  Second, the values configured on parent classes should also be taken
  into account.

  Finally, setting the value of a key sometimes should merge with the
  previous value, rather than replacing it.

  This mixin provides a instance method, `createInstanceMapFor`, that
  will reify all of the configuration options set on an instance's
  constructor and provide it for the instance to use.

  Classes can implement certain hooks that allow them to customize
  the requirements listed above:

  * `resolveMapConflict` - called when a value is set for an existing
    value
  * `transformMapKey` - allows a key name (for example, a global path
    to a class) to be normalized
  * `transformMapValue` - allows a value (for example, a class that
    should be instantiated) to be normalized

  Classes that implement this mixin should also implement a class
  method built using the `generateMapFunctionFor` method:

    DS.Adapter.reopenClass({
      map: DS.Mappable.generateMapFunctionFor('attributes', function(key, newValue, map) {
        var existingValue = map.get(key);

        for (var prop in newValue) {
          if (!newValue.hasOwnProperty(prop)) { continue; }
          existingValue[prop] = newValue[prop];
        }
      })
    });

  The function passed to `generateMapFunctionFor` is invoked every time a
  new value is added to the map.

  @class _Mappable
  @private
  @namespace DS
  @extends Ember.Mixin
**/

var resolveMapConflict = function(oldValue, newValue) {
  return oldValue;
};

var transformMapKey = function(key, value) {
  return key;
};

var transformMapValue = function(key, value) {
  return value;
};

DS._Mappable = Ember.Mixin.create({
  createInstanceMapFor: function(mapName) {
    var instanceMeta = Ember.metaPath(this, ['DS.Mappable'], true);

    instanceMeta.values = instanceMeta.values || {};

    if (instanceMeta.values[mapName]) { return instanceMeta.values[mapName]; }

    var instanceMap = instanceMeta.values[mapName] = new Ember.Map();

    var klass = this.constructor;

    while (klass && klass !== DS.Store) {
      this._copyMap(mapName, klass, instanceMap);
      klass = klass.superclass;
    }

    instanceMeta.values[mapName] = instanceMap;
    return instanceMap;
  },

  _copyMap: function(mapName, klass, instanceMap) {
    var classMeta = Ember.metaPath(klass, ['DS.Mappable'], true);

    var classMap = classMeta[mapName];
    if (classMap) {
      classMap.forEach(eachMap, this);
    }

    function eachMap(key, value) {
      var transformedKey = (klass.transformMapKey || transformMapKey)(key, value);
      var transformedValue = (klass.transformMapValue || transformMapValue)(key, value);

      var oldValue = instanceMap.get(transformedKey);
      var newValue = transformedValue;

      if (oldValue) {
        newValue = (this.constructor.resolveMapConflict || resolveMapConflict)(oldValue, newValue);
      }

      instanceMap.set(transformedKey, newValue);
    }
  }


});

DS._Mappable.generateMapFunctionFor = function(mapName, transform) {
  return function(key, value) {
    var meta = Ember.metaPath(this, ['DS.Mappable'], true);
    var map = meta[mapName] || Ember.MapWithDefault.create({
      defaultValue: function() { return {}; }
    });

    transform.call(this, key, value, map);

    meta[mapName] = map;
  };
};


/**
  @module data
  @submodule data-store
*/

var get = Ember.get, set = Ember.set, once = Ember.run.once;
var forEach = Ember.EnumerableUtils.forEach;

// These values are used in the data cache when clientIds are
// needed but the underlying data has not yet been loaded by
// the server.
var UNLOADED = 'unloaded';
var LOADING = 'loading';
var MATERIALIZED = { materialized: true };
var CREATED = { created: true };

// Implementors Note:
//
//   The variables in this file are consistently named according to the following
//   scheme:
//
//   * +id+ means an identifier managed by an external source, provided inside
//     the data provided by that source.
//   * +clientId+ means a transient numerical identifier generated at runtime by
//     the data store. It is important primarily because newly created objects may
//     not yet have an externally generated id.
//   * +type+ means a subclass of DS.Model.

// Used by the store to normalize IDs entering the store.  Despite the fact
// that developers may provide IDs as numbers (e.g., `store.find(Person, 1)`),
// it is important that internally we use strings, since IDs may be serialized
// and lose type information.  For example, Ember's router may put a record's
// ID into the URL, and if we later try to deserialize that URL and find the
// corresponding record, we will not know if it is a string or a number.
var coerceId = function(id) {
  return id == null ? null : id+'';
};

var map = Ember.EnumerableUtils.map;

/**
  The store contains all of the data for records loaded from the server.
  It is also responsible for creating instances of DS.Model that wraps
  the individual data for a record, so that they can be bound to in your
  Handlebars templates.

  Create a new store like this:

       MyApp.store = DS.Store.create();

  You can retrieve DS.Model instances from the store in several ways. To retrieve
  a record for a specific id, use the `find()` method:

       var record = MyApp.store.find(MyApp.Contact, 123);

   By default, the store will talk to your backend using a standard REST mechanism.
   You can customize how the store talks to your backend by specifying a custom adapter:

       MyApp.store = DS.Store.create({
         adapter: 'MyApp.CustomAdapter'
       });

  You can learn more about writing a custom adapter by reading the `DS.Adapter`
  documentation.

  @class Store
  @namespace DS
  @extends Ember.Object
  @uses DS._Mappable
  @constructor
*/
DS.Store = Ember.Object.extend(DS._Mappable, {

  /**
    Many methods can be invoked without specifying which store should be used.
    In those cases, the first store created will be used as the default. If
    an application has multiple stores, it should specify which store to use
    when performing actions, such as finding records by id.

    The init method registers this store as the default if none is specified.
  */
  init: function() {
    // Enforce API revisioning. See BREAKING_CHANGES.md for more.
    var revision = get(this, 'revision');

    if (revision !== DS.CURRENT_API_REVISION && !Ember.ENV.TESTING) {
      throw new Error("Error: The Ember Data library has had breaking API changes since the last time you updated the library. Please review the list of breaking changes at https://github.com/emberjs/data/blob/master/BREAKING_CHANGES.md, then update your store's `revision` property to " + DS.CURRENT_API_REVISION);
    }

    if (!get(DS, 'defaultStore') || get(this, 'isDefaultStore')) {
      set(DS, 'defaultStore', this);
    }

    // internal bookkeeping; not observable
    this.typeMaps = {};
    this.recordCache = [];
    this.clientIdToId = {};
    this.clientIdToType = {};
    this.clientIdToData = {};
    this.clientIdToPrematerializedData = {};
    this.recordArraysByClientId = {};
    this.relationshipChanges = {};
    this.recordReferences = {};

    // Internally, we maintain a map of all unloaded IDs requested by
    // a ManyArray. As the adapter loads data into the store, the
    // store notifies any interested ManyArrays. When the ManyArray's
    // total number of loading records drops to zero, it becomes
    // `isLoaded` and fires a `didLoad` event.
    this.loadingRecordArrays = {};

    this._recordsToSave = Ember.OrderedSet.create();

    set(this, 'defaultTransaction', this.transaction());
  },

  /**
    Returns a new transaction scoped to this store. This delegates
    responsibility for invoking the adapter's commit mechanism to
    a transaction.

    Transaction are responsible for tracking changes to records
    added to them, and supporting `commit` and `rollback`
    functionality. Committing a transaction invokes the store's
    adapter, while rolling back a transaction reverses all
    changes made to records added to the transaction.

    A store has an implicit (default) transaction, which tracks changes
    made to records not explicitly added to a transaction.

    @see {DS.Transaction}
    @returns DS.Transaction
  */
  transaction: function() {
    return DS.Transaction.create({ store: this });
  },

  ensureSameTransaction: function(records){
    var transactions = Ember.A();
    forEach( records, function(record){
      if (record){ transactions.pushObject(get(record, 'transaction')); }
    });

    var transaction = transactions.reduce(function(prev, t) {
      if (!get(t, 'isDefault')) {
        if (prev === null) { return t; }
        Ember.assert("All records in a changed relationship must be in the same transaction. You tried to change the relationship between records when one is in " + t + " and the other is in " + prev, t === prev);
      }

      return prev;
    }, null);

    if (transaction) {
      forEach( records, function(record){
        if (record){ transaction.add(record); }
      });
    } else {
      transaction = transactions.objectAt(0);
    }
    return transaction;

   },
  /**
    @private

    Instructs the store to materialize the data for a given record.

    To materialize a record, the store first retrieves the opaque data that was
    passed to either `load()` or `loadMany()`. Then, the data and the record
    are passed to the adapter's `materialize()` method, which allows the adapter
    to translate arbitrary data structures from the adapter into the normalized
    form the record expects.

    The adapter's `materialize()` method will invoke `materializeAttribute()`,
    `materializeHasMany()` and `materializeBelongsTo()` on the record to
    populate it with normalized values.

    @param {DS.Model} record
  */
  materializeData: function(record) {
    var clientId = get(record, 'clientId'),
        cidToData = this.clientIdToData,
        adapter = this.adapterForType(record.constructor),
        data = cidToData[clientId];

    cidToData[clientId] = MATERIALIZED;

    var prematerialized = this.clientIdToPrematerializedData[clientId];

    // Ensures the record's data structures are setup
    // before being populated by the adapter.
    record.setupData();

    if (data !== CREATED) {
      // Instructs the adapter to extract information from the
      // opaque data and materialize the record's attributes and
      // relationships.
      adapter.materialize(record, data, prematerialized);
    }
  },

  /**
    @private

    Returns true if there is already a record for this clientId.

    This is used to determine whether cleanup is required, so that
    "changes" to unmaterialized records do not trigger mass
    materialization.

    For example, if a parent record in a relationship with a large
    number of children is deleted, we want to avoid materializing
    those children.

    @param {Object} reference
    @return {Boolean}
  */
  recordIsMaterialized: function(reference) {
    return !!this.recordCache[reference.clientId];
  },

  /**
    The adapter to use to communicate to a backend server or other persistence layer.

    This can be specified as an instance, a class, or a property path that specifies
    where the adapter can be located.

    @property {DS.Adapter|String}
  */
  adapter: 'DS.RESTAdapter',

  /**
    @private

    Returns a JSON representation of the record using the adapter's
    serialization strategy. This method exists primarily to enable
    a record, which has access to its store (but not the store's
    adapter) to provide a `serialize()` convenience.

    The available options are:

    * `includeId`: `true` if the record's ID should be included in
      the JSON representation

    @param {DS.Model} record the record to serialize
    @param {Object} options an options hash
  */
  serialize: function(record, options) {
    return this.adapterForType(record.constructor).serialize(record, options);
  },

  /**
    @private

    This property returns the adapter, after resolving a possible
    property path.

    If the supplied `adapter` was a class, or a String property
    path resolved to a class, this property will instantiate the
    class.

    This property is cacheable, so the same instance of a specified
    adapter class should be used for the lifetime of the store.

    @returns DS.Adapter
  */
  _adapter: Ember.computed(function() {
    var adapter = get(this, 'adapter');
    if (typeof adapter === 'string') {
      adapter = get(this, adapter, false) || get(Ember.lookup, adapter);
    }

    if (DS.Adapter.detect(adapter)) {
      adapter = adapter.create();
    }

    return adapter;
  }).property('adapter'),

  /**
    @private

    A monotonically increasing number to be used to uniquely identify
    data and records.

    It starts at 1 so other parts of the code can test for truthiness
    when provided a `clientId` instead of having to explicitly test
    for undefined.
  */
  clientIdCounter: 1,

  // .....................
  // . CREATE NEW RECORD .
  // .....................

  /**
    Create a new record in the current store. The properties passed
    to this method are set on the newly created record.

    Note: The third `transaction` property is for internal use only.
    If you want to create a record inside of a given transaction,
    use `transaction.createRecord()` instead of `store.createRecord()`.

    @method createRecord
    @param {subclass of DS.Model} type
    @param {Object} properties a hash of properties to set on the
      newly created record.
    @returns DS.Model
  */
  createRecord: function(type, properties, transaction) {
    properties = properties || {};

    // Create a new instance of the model `type` and put it
    // into the specified `transaction`. If no transaction is
    // specified, the default transaction will be used.
    var record = type._create({
      store: this
    });

    transaction = transaction || get(this, 'defaultTransaction');

    // adoptRecord is an internal API that allows records to move
    // into a transaction without assertions designed for app
    // code. It is used here to ensure that regardless of new
    // restrictions on the use of the public `transaction.add()`
    // API, we will always be able to insert new records into
    // their transaction.
    transaction.adoptRecord(record);

    // `id` is a special property that may not be a `DS.attr`
    var id = properties.id;

    // If the passed properties do not include a primary key,
    // give the adapter an opportunity to generate one. Typically,
    // client-side ID generators will use something like uuid.js
    // to avoid conflicts.
    var adapter;
    if (Ember.isNone(id)) {
      adapter = this.adapterForType(type);
      if (adapter && adapter.generateIdForRecord) {
        id = coerceId(adapter.generateIdForRecord(this, record));
        properties.id = id;
      }
    }

    id = coerceId(id);

    // Create a new `clientId` and associate it with the
    // specified (or generated) `id`. Since we don't have
    // any data for the server yet (by definition), store
    // the sentinel value CREATED as the data for this
    // clientId. If we see this value later, we will skip
    // materialization.
    var clientId = this.pushData(CREATED, id, type);

    // Now that we have a clientId, attach it to the record we
    // just created.
    set(record, 'clientId', clientId);

    // Move the record out of its initial `empty` state into
    // the `loaded` state.
    record.loadedData();

    // Make sure the data is set up so the record doesn't
    // try to materialize its nonexistent data.
    record.setupData();

    // Store the record we just created in the record cache for
    // this clientId.
    this.recordCache[clientId] = record;

    // Set the properties specified on the record.
    record.setProperties(properties);

    // Resolve record promise
    Ember.run(record, 'resolve', record);

    return record;
  },

  // .................
  // . DELETE RECORD .
  // .................

  /**
    For symmetry, a record can be deleted via the store.

    @param {DS.Model} record
  */
  deleteRecord: function(record) {
    record.deleteRecord();
  },

  /**
    For symmetry, a record can be unloaded via the store.

    @param {DS.Model} record
  */
  unloadRecord: function(record) {
    record.unloadRecord();
  },

  // ................
  // . FIND RECORDS .
  // ................

  /**
    This is the main entry point into finding records. The first parameter to
    this method is always a subclass of `DS.Model`.

    You can use the `find` method on a subclass of `DS.Model` directly if your
    application only has one store. For example, instead of
    `store.find(App.Person, 1)`, you could say `App.Person.find(1)`.

    ---

    To find a record by ID, pass the `id` as the second parameter:

        store.find(App.Person, 1);
        App.Person.find(1);

    If the record with that `id` had not previously been loaded, the store will
    return an empty record immediately and ask the adapter to find the data by
    calling the adapter's `find` method.

    The `find` method will always return the same object for a given type and
    `id`. To check whether the adapter has populated a record, you can check
    its `isLoaded` property.

    ---

    To find all records for a type, call `find` with no additional parameters:

        store.find(App.Person);
        App.Person.find();

    This will return a `RecordArray` representing all known records for the
    given type and kick off a request to the adapter's `findAll` method to load
    any additional records for the type.

    The `RecordArray` returned by `find()` is live. If any more records for the
    type are added at a later time through any mechanism, it will automatically
    update to reflect the change.

    ---

    To find a record by a query, call `find` with a hash as the second
    parameter:

        store.find(App.Person, { page: 1 });
        App.Person.find({ page: 1 });

    This will return a `RecordArray` immediately, but it will always be an
    empty `RecordArray` at first. It will call the adapter's `findQuery`
    method, which will populate the `RecordArray` once the server has returned
    results.

    You can check whether a query results `RecordArray` has loaded by checking
    its `isLoaded` property.

    @method find
    @param {DS.Model} type
    @param {Object|String|Integer|null} id
  */
  find: function(type, id) {
    if (id === undefined) {
      return this.findAll(type);
    }

    // We are passed a query instead of an id.
    if (Ember.typeOf(id) === 'object') {
      return this.findQuery(type, id);
    }

    return this.findById(type, coerceId(id));
  },

  /**
    @private

    This method returns a record for a given type and id combination.

    If the store has never seen this combination of type and id before, it
    creates a new `clientId` with the LOADING sentinel and asks the adapter to
    load the data.

    If the store has seen the combination, this method delegates to
    `getByReference`.
  */
  findById: function(type, id) {
    var clientId = this.typeMapFor(type).idToCid[id];

    // A record can have a reference without being loaded
    // (through a hasMany relationship). In that case, we need to
    // materialize the record.
    if (clientId && this.clientIdToData[clientId] !== UNLOADED) {
      return this.findByClientId(type, clientId);
    }

    clientId = this.pushData(LOADING, id, type);

    // create a new instance of the model type in the
    // 'isLoading' state
    var record = this.materializeRecord(type, clientId, id);

    // let the adapter set the data, possibly async
    var adapter = this.adapterForType(type);

    Ember.assert("You tried to find a record but you have no adapter (for " + type + ")", adapter);
    Ember.assert("You tried to find a record but your adapter does not implement `find`", adapter.find);

    adapter.find(this, type, id);

    return record;
  },

  reloadRecord: function(record) {
    var type = record.constructor,
        adapter = this.adapterForType(type),
        id = get(record, 'id');

    Ember.assert("You cannot update a record without an ID", id);
    Ember.assert("You tried to update a record but you have no adapter (for " + type + ")", adapter);
    Ember.assert("You tried to update a record but your adapter does not implement `find`", adapter.find);

    adapter.find(this, type, id);
  },

  /**
    @private

    This method returns a record for a given clientId.

    If there is no record object yet for the clientId, this method materializes
    a new record object. This allows adapters to eagerly load large amounts of
    data into the store, and avoid incurring the cost to create the objects
    until they are requested.

    Several parts of Ember Data call this method:

    * findById, if a clientId already exists for a given type and
      id combination
    * OneToManyChange, which is backed by clientIds, when getChild,
      getOldParent or getNewParent are called
    * RecordArray, which is backed by clientIds, when an object at
      a particular index is looked up

    In short, it's a convenient way to get a record for a known
    clientId, materializing it if necessary.

    @param {Class} type
    @param {Number|String} clientId
  */
  findByClientId: function(type, clientId) {
    var cidToData, record, id;

    record = this.recordCache[clientId];

    if (!record) {
      // create a new instance of the model type in the
      // 'isLoading' state
      id = this.clientIdToId[clientId];
      record = this.materializeRecord(type, clientId, id);

      cidToData = this.clientIdToData;

      if (typeof cidToData[clientId] === 'object') {
        record.loadedData();
      }
    }

    return record;
  },

  /**
    @private

    Given an array of `reference`s, determines which of those
    `clientId`s has not yet been loaded.

    In preparation for loading, this method also marks any unloaded
    `clientId`s as loading.
  */
  neededReferences: function(references) {
    var neededReferences = [],
        cidToData = this.clientIdToData,
        reference;

    for (var i=0, l=references.length; i<l; i++) {
      reference = references[i];

      if (cidToData[reference.clientId] === UNLOADED) {
        neededReferences.push(reference);
        cidToData[reference.clientId] = LOADING;
      }
    }

    return neededReferences;
  },

  /**
    @private

    This method is the entry point that relationships use to update
    themselves when their underlying data changes.

    First, it determines which of its `reference`s are still unloaded,
    then invokes `findMany` on the adapter.
  */
  fetchUnloadedReferences: function(references, owner) {
    var neededReferences = this.neededReferences(references);
    this.fetchMany(neededReferences, owner);
  },

  /**
    @private

    This method takes a list of `reference`s, group the `reference`s by type,
    converts the `reference`s into IDs, and then invokes the adapter's `findMany`
    method.
    The `reference`s are grouped by type to invoke `findMany` on adapters
    for each unique type in `reference`s.

    It is used both by a brand new relationship (via the `findMany`
    method) or when the data underlying an existing relationship
    changes (via the `fetchUnloadedReferences` method).
  */
  fetchMany: function(references, owner) {
    if (!references.length) { return; }

    // Group By Type
    var referencesByTypeMap = Ember.MapWithDefault.create({
      defaultValue: function() { return Ember.A(); }
    });
    forEach(references, function(reference) {
      referencesByTypeMap.get(reference.type).push(reference);
    });

    forEach(referencesByTypeMap, function(type) {
      var references = referencesByTypeMap.get(type),
          ids = map(references, function(reference) { return reference.id; });

      var adapter = this.adapterForType(type);

      Ember.assert("You tried to load many records but you have no adapter (for " + type + ")", adapter);
      Ember.assert("You tried to load many records but your adapter does not implement `findMany`", adapter.findMany);

      adapter.findMany(this, type, ids, owner);
    }, this);
  },

  referenceForId: function(type, id) {
    var clientId = this.clientIdForId(type, id);
    return this.referenceForClientId(clientId);
  },

  referenceForClientId: function(clientId) {
    var references = this.recordReferences;

    if (references[clientId]) {
      return references[clientId];
    }

    var type = this.clientIdToType[clientId];

    return references[clientId] = {
      id: this.idForClientId(clientId),
      clientId: clientId,
      type: type
    };
  },

  isReferenceMaterialized: function(reference) {
    return !!this.recordCache[reference.clientId];
  },

  recordForReference: function(reference) {
    return this.findByClientId(reference.type, reference.clientId);
  },

  /**
    @private

    `findMany` is the entry point that relationships use to generate a
    new `ManyArray` for the list of IDs specified by the server for
    the relationship.

    Its responsibilities are:

    * convert the IDs into clientIds
    * determine which of the clientIds still need to be loaded
    * create a new ManyArray whose content is *all* of the clientIds
    * notify the ManyArray of the number of its elements that are
      already loaded
    * insert the unloaded clientIds into the `loadingRecordArrays`
      bookkeeping structure, which will allow the `ManyArray` to know
      when all of its loading elements are loaded from the server.
    * ask the adapter to load the unloaded elements, by invoking
      findMany with the still-unloaded IDs.
  */
  findMany: function(type, idsOrReferencesOrOpaque, record, relationship) {
    // 1. Determine which of the client ids need to be loaded
    // 2. Create a new ManyArray whose content is ALL of the clientIds
    // 3. Decrement the ManyArray's counter by the number of loaded clientIds
    // 4. Put the ManyArray into our bookkeeping data structure, keyed on
    //    the needed clientIds
    // 5. Ask the adapter to load the records for the unloaded clientIds (but
    //    convert them back to ids)

    if (!Ember.isArray(idsOrReferencesOrOpaque)) {
      var adapter = this.adapterForType(type);

      if (adapter && adapter.findHasMany) {
        adapter.findHasMany(this, record, relationship, idsOrReferencesOrOpaque);
      } else if (idsOrReferencesOrOpaque !== undefined) {
        Ember.assert("You tried to load many records but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to load many records but your adapter does not implement `findHasMany`", adapter.findHasMany);
      }

      return this.createManyArray(type, Ember.A());
    }

    // Coerce server IDs into Record Reference
    var references = map(idsOrReferencesOrOpaque, function(reference) {
      if (typeof reference !== 'object' && reference !== null) {
        return this.referenceForId(type, reference);
      }

      return reference;
    }, this);

    var neededReferences = this.neededReferences(references),
        manyArray = this.createManyArray(type, Ember.A(references)),
        loadingRecordArrays = this.loadingRecordArrays,
        reference, clientId, i, l;

    // Start the decrementing counter on the ManyArray at the number of
    // records we need to load from the adapter
    manyArray.loadingRecordsCount(neededReferences.length);

    if (neededReferences.length) {
      for (i=0, l=neededReferences.length; i<l; i++) {
        reference = neededReferences[i];
        clientId = reference.clientId;

        // keep track of the record arrays that a given loading record
        // is part of. This way, if the same record is in multiple
        // ManyArrays, all of their loading records counters will be
        // decremented when the adapter provides the data.
        if (loadingRecordArrays[clientId]) {
          loadingRecordArrays[clientId].push(manyArray);
        } else {
          this.loadingRecordArrays[clientId] = [ manyArray ];
        }
      }

      this.fetchMany(neededReferences, record);
    } else {
      // all requested records are available
      manyArray.set('isLoaded', true);

      Ember.run.once(function() {
        manyArray.trigger('didLoad');
      });
    }

    return manyArray;
  },

  /**
    This method delegates a query to the adapter. This is the one place where
    adapter-level semantics are exposed to the application.

    Exposing queries this way seems preferable to creating an abstract query
    language for all server-side queries, and then require all adapters to
    implement them.

    @private
    @method findQuery
    @param {Class} type
    @param {Object} query an opaque query to be used by the adapter
    @return {DS.AdapterPopulatedRecordArray}
  */
  findQuery: function(type, query) {
    var array = DS.AdapterPopulatedRecordArray.create({ type: type, query: query, content: Ember.A([]), store: this });
    var adapter = this.adapterForType(type);

    Ember.assert("You tried to load a query but you have no adapter (for " + type + ")", adapter);
    Ember.assert("You tried to load a query but your adapter does not implement `findQuery`", adapter.findQuery);

    adapter.findQuery(this, type, query, array);

    return array;
  },

  /**
    @private

    This method returns an array of all records adapter can find.
    It triggers the adapter's `findAll` method to give it an opportunity to populate
    the array with records of that type.

    @param {Class} type
    @return {DS.AdapterPopulatedRecordArray}
  */
  findAll: function(type) {
    return this.fetchAll(type, this.all(type));
  },

  /**
    @private
  */
  fetchAll: function(type, array) {
    var adapter = this.adapterForType(type),
        sinceToken = this.typeMapFor(type).metadata.since;

    set(array, 'isUpdating', true);

    Ember.assert("You tried to load all records but you have no adapter (for " + type + ")", adapter);
    Ember.assert("You tried to load all records but your adapter does not implement `findAll`", adapter.findAll);

    adapter.findAll(this, type, sinceToken);

    return array;
  },

  /**
  */
  metaForType: function(type, property, data) {
    var target = this.typeMapFor(type).metadata;
    set(target, property, data);
  },

  /**
  */
  didUpdateAll: function(type) {
    var findAllCache = this.typeMapFor(type).findAllCache;
    set(findAllCache, 'isUpdating', false);
  },

  /**
    This method returns a filtered array that contains all of the known records
    for a given type.

    Note that because it's just a filter, it will have any locally
    created records of the type.

    Also note that multiple calls to `all` for a given type will always
    return the same RecordArray.

    @method all
    @param {Class} type
    @return {DS.RecordArray}
  */
  all: function(type) {
    var typeMap = this.typeMapFor(type),
        findAllCache = typeMap.findAllCache;

    if (findAllCache) { return findAllCache; }

    var array = DS.RecordArray.create({ type: type, content: Ember.A([]), store: this, isLoaded: true });
    this.registerRecordArray(array, type);

    typeMap.findAllCache = array;
    return array;
  },

  /**
    Takes a type and filter function, and returns a live RecordArray that
    remains up to date as new records are loaded into the store or created
    locally.

    The callback function takes a materialized record, and returns true
    if the record should be included in the filter and false if it should
    not.

    The filter function is called once on all records for the type when
    it is created, and then once on each newly loaded or created record.

    If any of a record's properties change, or if it changes state, the
    filter function will be invoked again to determine whether it should
    still be in the array.

    Note that the existence of a filter on a type will trigger immediate
    materialization of all loaded data for a given type, so you might
    not want to use filters for a type if you are loading many records
    into the store, many of which are not active at any given time.

    In this scenario, you might want to consider filtering the raw
    data before loading it into the store.

    @method filter
    @param {Class} type
    @param {Function} filter
    @return {DS.FilteredRecordArray}
  */
  filter: function(type, query, filter) {
    // allow an optional server query
    if (arguments.length === 3) {
      this.findQuery(type, query);
    } else if (arguments.length === 2) {
      filter = query;
    }

    var array = DS.FilteredRecordArray.create({ type: type, content: Ember.A([]), store: this, filterFunction: filter });

    this.registerRecordArray(array, type, filter);

    return array;
  },

  /**
    This method returns if a certain record is already loaded
    in the store. Use this function to know beforehand if a find()
    will result in a request or that it will be a cache hit.

    @param {Class} type
    @param {string} id
    @return {boolean}
  */
  recordIsLoaded: function(type, id) {
    return !Ember.isNone(this.typeMapFor(type).idToCid[id]);
  },

  // ............
  // . UPDATING .
  // ............

  /**
    @private

    If the adapter updates attributes or acknowledges creation
    or deletion, the record will notify the store to update its
    membership in any filters.

    To avoid thrashing, this method is invoked only once per
    run loop per record.

    @param {Class} type
    @param {Number|String} clientId
    @param {DS.Model} record
  */
  dataWasUpdated: function(type, reference, record) {
    // Because data updates are invoked at the end of the run loop,
    // it is possible that a record might be deleted after its data
    // has been modified and this method was scheduled to be called.
    //
    // If that's the case, the record would have already been removed
    // from all record arrays; calling updateRecordArrays would just
    // add it back. If the record is deleted, just bail. It shouldn't
    // give us any more trouble after this.

    if (get(record, 'isDeleted')) { return; }

    var cidToData = this.clientIdToData,
        clientId = reference.clientId,
        data = cidToData[clientId];

    if (typeof data === "object") {
      this.updateRecordArrays(type, clientId);
    }
  },

  // .................
  // . BASIC ADAPTER .
  // .................

  scheduleSave: function(record) {
    this._recordsToSave.add(record);
    Ember.run.once(this, 'flushSavedRecords');
  },

  flushSavedRecords: function() {
    var created = Ember.OrderedSet.create();
    var updated = Ember.OrderedSet.create();
    var deleted = Ember.OrderedSet.create();

    this._recordsToSave.forEach(function(record) {
      if (get(record, 'isNew')) {
        created.add(record);
      } else if (get(record, 'isDeleted')) {
        deleted.add(record);
      } else {
        updated.add(record);
      }
    });

    this._recordsToSave.clear();

    get(this, '_adapter').commit(this, {
      created: created,
      updated: updated,
      deleted: deleted
    });
  },

  // ..............
  // . PERSISTING .
  // ..............

  /**
    This method delegates committing to the store's implicit
    transaction.

    Calling this method is essentially a request to persist
    any changes to records that were not explicitly added to
    a transaction.
  */
  commit: function() {
    get(this, 'defaultTransaction').commit();
  },

  /**
    Adapters should call this method if they would like to acknowledge
    that all changes related to a record (other than relationship
    changes) have persisted.

    Because relationship changes affect multiple records, the adapter
    is responsible for acknowledging the change to the relationship
    directly (using `store.didUpdateRelationship`) when all aspects
    of the relationship change have persisted.

    It can be called for created, deleted or updated records.

    If the adapter supplies new data, that data will become the new
    canonical data for the record. That will result in blowing away
    all local changes and rematerializing the record with the new
    data (the "sledgehammer" approach).

    Alternatively, if the adapter does not supply new data, the record
    will collapse all local changes into its saved data. Subsequent
    rollbacks of the record will roll back to this point.

    If an adapter is acknowledging receipt of a newly created record
    that did not generate an id in the client, it *must* either
    provide data or explicitly invoke `store.didReceiveId` with
    the server-provided id.

    Note that an adapter may not supply new data when acknowledging
    a deleted record.

    @see DS.Store#didUpdateRelationship

    @param {DS.Model} record the in-flight record
    @param {Object} data optional data (see above)
  */
  didSaveRecord: function(record, data) {
    record.adapterDidCommit();

    if (data) {
      this.updateId(record, data);
      this.updateRecordData(record, data);
    } else {
      this.didUpdateAttributes(record);
    }
  },

  /**
    For convenience, if an adapter is performing a bulk commit, it can also
    acknowledge all of the records at once.

    If the adapter supplies an array of data, they must be in the same order as
    the array of records passed in as the first parameter.

    @param {#forEach} list a list of records whose changes the
      adapter is acknowledging. You can pass any object that
      has an ES5-like `forEach` method, including the
      `OrderedSet` objects passed into the adapter at commit
      time.
    @param {Array[Object]} dataList an Array of data. This
      parameter must be an integer-indexed Array-like.
  */
  didSaveRecords: function(list, dataList) {
    var i = 0;
    list.forEach(function(record) {
      this.didSaveRecord(record, dataList && dataList[i++]);
    }, this);
  },

  /**
    This method allows the adapter to specify that a record
    could not be saved because it had backend-supplied validation
    errors.

    The errors object must have keys that correspond to the
    attribute names. Once each of the specified attributes have
    changed, the record will automatically move out of the
    invalid state and be ready to commit again.

    TODO: We should probably automate the process of converting
    server names to attribute names using the existing serializer
    infrastructure.

    @param {DS.Model} record
    @param {Object} errors
  */
  recordWasInvalid: function(record, errors) {
    record.adapterDidInvalidate(errors);
  },

  /**
     This method allows the adapter to specify that a record
     could not be saved because the server returned an unhandled
     error.

     @param {DS.Model} record
  */
  recordWasError: function(record) {
    record.adapterDidError();
  },

  /**
    This is a lower-level API than `didSaveRecord` that allows an
    adapter to acknowledge the persistence of a single attribute.

    This is useful if an adapter needs to make multiple asynchronous
    calls to fully persist a record. The record will keep track of
    which attributes and relationships are still outstanding and
    automatically move into the `saved` state once the adapter has
    acknowledged everything.

    If a value is provided, it clobbers the locally specified value.
    Otherwise, the local value becomes the record's last known
    saved value (which is used when rolling back a record).

    Note that the specified attributeName is the normalized name
    specified in the definition of the `DS.Model`, not a key in
    the server-provided data.

    Also note that the adapter is responsible for performing any
    transformations on the value using the serializer API.

    @param {DS.Model} record
    @param {String} attributeName
    @param {Object} value
  */
  didUpdateAttribute: function(record, attributeName, value) {
    record.adapterDidUpdateAttribute(attributeName, value);
  },

  /**
    This method allows an adapter to acknowledge persistence
    of all attributes of a record but not relationships or
    other factors.

    It loops through the record's defined attributes and
    notifies the record that they are all acknowledged.

    This method does not take optional values, because
    the adapter is unlikely to have a hash of normalized
    keys and transformed values, and instead of building
    one up, it should just call `didUpdateAttribute` as
    needed.

    This method is intended as a middle-ground between
    `didSaveRecord`, which acknowledges all changes to
    a record, and `didUpdateAttribute`, which allows an
    adapter fine-grained control over updates.

    @param {DS.Model} record
  */
  didUpdateAttributes: function(record) {
    record.eachAttribute(function(attributeName) {
      this.didUpdateAttribute(record, attributeName);
    }, this);
  },

  /**
    This allows an adapter to acknowledge that it has saved all
    necessary aspects of a relationship change.

    This is separated from acknowledging the record itself
    (via `didSaveRecord`) because a relationship change can
    involve as many as three separate records. Records should
    only move out of the in-flight state once the server has
    acknowledged all of their relationships, and this differs
    based upon the adapter's semantics.

    There are three basic scenarios by which an adapter can
    save a relationship.

    ### Foreign Key

    An adapter can save all relationship changes by updating
    a foreign key on the child record. If it does this, it
    should acknowledge the changes when the child record is
    saved.

        record.eachRelationship(function(name, meta) {
          if (meta.kind === 'belongsTo') {
            store.didUpdateRelationship(record, name);
          }
        });

        store.didSaveRecord(record, data);

    ### Embedded in Parent

    An adapter can save one-to-many relationships by embedding
    IDs (or records) in the parent object. In this case, the
    relationship is not considered acknowledged until both the
    old parent and new parent have acknowledged the change.

    In this case, the adapter should keep track of the old
    parent and new parent, and acknowledge the relationship
    change once both have acknowledged. If one of the two
    sides does not exist (e.g. the new parent does not exist
    because of nulling out the belongs-to relationship),
    the adapter should acknowledge the relationship once
    the other side has acknowledged.

    ### Separate Entity

    An adapter can save relationships as separate entities
    on the server. In this case, they should acknowledge
    the relationship as saved once the server has
    acknowledged the entity.

    @see DS.Store#didSaveRecord

    @param {DS.Model} record
    @param {DS.Model} relationshipName
  */
  didUpdateRelationship: function(record, relationshipName) {
    var relationship = this.relationshipChangeFor(get(record, 'clientId'), relationshipName);
    //TODO(Igor)
    if (relationship) { relationship.adapterDidUpdate(); }
  },

  /**
    This allows an adapter to acknowledge all relationship changes
    for a given record.

    Like `didUpdateAttributes`, this is intended as a middle ground
    between `didSaveRecord` and fine-grained control via the
    `didUpdateRelationship` API.
  */
  didUpdateRelationships: function(record) {
    var changes = this.relationshipChangesFor(get(record, '_reference'));

    for (var name in changes) {
      if (!changes.hasOwnProperty(name)) { continue; }
      changes[name].adapterDidUpdate();
    }
  },

  /**
    When acknowledging the creation of a locally created record,
    adapters must supply an id (if they did not implement
    `generateIdForRecord` to generate an id locally).

    If an adapter does not use `didSaveRecord` and supply a hash
    (for example, if it needs to make multiple HTTP requests to
    create and then update the record), it will need to invoke
    `didReceiveId` with the backend-supplied id.

    When not using `didSaveRecord`, an adapter will need to
    invoke:

    * didReceiveId (unless the id was generated locally)
    * didCreateRecord
    * didUpdateAttribute(s)
    * didUpdateRelationship(s)

    @param {DS.Model} record
    @param {Number|String} id
  */
  didReceiveId: function(record, id) {
    var typeMap = this.typeMapFor(record.constructor),
        clientId = get(record, 'clientId'),
        oldId = get(record, 'id');

    Ember.assert("An adapter cannot assign a new id to a record that already has an id. " + record + " had id: " + oldId + " and you tried to update it with " + id + ". This likely happened because your server returned data in response to a find or update that had a different id than the one you sent.", oldId === undefined || id === oldId);

    typeMap.idToCid[id] = clientId;
    this.clientIdToId[clientId] = id;
  },

  /**
    @private

    This method re-indexes the data by its clientId in the store
    and then notifies the record that it should rematerialize
    itself.

    @param {DS.Model} record
    @param {Object} data
  */
  updateRecordData: function(record, data) {
    var clientId = get(record, 'clientId'),
        cidToData = this.clientIdToData;

    cidToData[clientId] = data;

    record.didChangeData();
  },

  /**
    @private

    If an adapter invokes `didSaveRecord` with data, this method
    extracts the id from the supplied data (using the adapter's
    `extractId()` method) and indexes the clientId with that id.

    @param {DS.Model} record
    @param {Object} data
  */
  updateId: function(record, data) {
    var typeMap = this.typeMapFor(record.constructor),
        clientId = get(record, 'clientId'),
        oldId = get(record, 'id'),
        type = record.constructor,
        id = this.preprocessData(type, data);

    Ember.assert("An adapter cannot assign a new id to a record that already has an id. " + record + " had id: " + oldId + " and you tried to update it with " + id + ". This likely happened because your server returned data in response to a find or update that had a different id than the one you sent.", oldId === null || id === oldId);

    typeMap.idToCid[id] = clientId;
    this.clientIdToId[clientId] = id;
    this.referenceForClientId(clientId).id = id;
  },

  /**
    @private

    This method receives opaque data provided by the adapter and
    preprocesses it, returning an ID.

    The actual preprocessing takes place in the adapter. If you would
    like to change the default behavior, you should override the
    appropriate hooks in `DS.Serializer`.

    @see {DS.Serializer}
    @return {String} id the id represented by the data
  */
  preprocessData: function(type, data) {
    return this.adapterForType(type).extractId(type, data);
  },

  // .................
  // . RECORD ARRAYS .
  // .................

  /**
    @private

    Register a RecordArray for a given type to be backed by
    a filter function. This will cause the array to update
    automatically when records of that type change attribute
    values or states.

    @param {DS.RecordArray} array
    @param {Class} type
    @param {Function} filter
  */
  registerRecordArray: function(array, type, filter) {
    var recordArrays = this.typeMapFor(type).recordArrays;

    recordArrays.push(array);

    this.updateRecordArrayFilter(array, type, filter);
  },

  /**
    @private

    Create a `DS.ManyArray` for a type and list of clientIds
    and index the `ManyArray` under each clientId. This allows
    us to efficiently remove records from `ManyArray`s when
    they are deleted.

    @param {Class} type
    @param {Array} clientIds

    @return {DS.ManyArray}
  */
  createManyArray: function(type, clientIds) {
    var array = DS.ManyArray.create({ type: type, content: clientIds, store: this });

    clientIds.forEach(function(clientId) {
      var recordArrays = this.recordArraysForClientId(clientId);
      recordArrays.add(array);
    }, this);

    return array;
  },

  /**
    @private

    This method is invoked if the `filterFunction` property is
    changed on a `DS.FilteredRecordArray`.

    It essentially re-runs the filter from scratch. This same
    method is invoked when the filter is created in th first place.
  */
  updateRecordArrayFilter: function(array, type, filter) {
    var typeMap = this.typeMapFor(type),
        cidToData = this.clientIdToData,
        clientIds = typeMap.clientIds,
        clientId, data, shouldFilter, record;

    for (var i=0, l=clientIds.length; i<l; i++) {
      clientId = clientIds[i];
      shouldFilter = false;

      data = cidToData[clientId];

      if (typeof data === 'object') {
        if (record = this.recordCache[clientId]) {
          if (!get(record, 'isDeleted')) { shouldFilter = true; }
        } else {
          shouldFilter = true;
        }

        if (shouldFilter) {
          this.updateRecordArray(array, filter, type, clientId);
        }
      }
    }
  },

  updateRecordArraysLater: function(type, clientId) {
    Ember.run.once(this, function() {
      this.updateRecordArrays(type, clientId);
    });
  },

  /**
    @private

    This method is invoked whenever data is loaded into the store
    by the adapter or updated by the adapter, or when an attribute
    changes on a record.

    It updates all filters that a record belongs to.

    To avoid thrashing, it only runs once per run loop per record.

    @param {Class} type
    @param {Number|String} clientId
  */
  updateRecordArrays: function(type, clientId) {
    var recordArrays = this.typeMapFor(type).recordArrays,
        filter;

    recordArrays.forEach(function(array) {
      filter = get(array, 'filterFunction');
      this.updateRecordArray(array, filter, type, clientId);
    }, this);

    // loop through all manyArrays containing an unloaded copy of this
    // clientId and notify them that the record was loaded.
    var manyArrays = this.loadingRecordArrays[clientId];

    if (manyArrays) {
      for (var i=0, l=manyArrays.length; i<l; i++) {
        manyArrays[i].loadedRecord();
      }

      this.loadingRecordArrays[clientId] = null;
    }
  },

  /**
    @private

    Update an individual filter.

    @param {DS.FilteredRecordArray} array
    @param {Function} filter
    @param {Class} type
    @param {Number|String} clientId
  */
  updateRecordArray: function(array, filter, type, clientId) {
    var shouldBeInArray, record;

    if (!filter) {
      shouldBeInArray = true;
    } else {
      record = this.findByClientId(type, clientId);
      shouldBeInArray = filter(record);
    }

    var recordArrays = this.recordArraysForClientId(clientId);
    var reference = this.referenceForClientId(clientId);

    if (shouldBeInArray) {
      recordArrays.add(array);
      array.addReference(reference);
    } else if (!shouldBeInArray) {
      recordArrays.remove(array);
      array.removeReference(reference);
    }
  },

  /**
    @private

    When a record is deleted, it is removed from all its
    record arrays.

    @param {DS.Model} record
  */
  removeFromRecordArrays: function(record) {
    var reference = get(record, '_reference');
    var recordArrays = this.recordArraysForClientId(reference.clientId);

    recordArrays.forEach(function(array) {
      array.removeReference(reference);
    });
  },

  // ............
  // . INDEXING .
  // ............

  /**
    @private

    Return a list of all `DS.RecordArray`s a clientId is
    part of.

    @return {Object(clientId: Ember.OrderedSet)}
  */
  recordArraysForClientId: function(clientId) {
    var recordArrays = get(this, 'recordArraysByClientId');
    var ret = recordArrays[clientId];

    if (!ret) {
      ret = recordArrays[clientId] = Ember.OrderedSet.create();
    }

    return ret;
  },

  typeMapFor: function(type) {
    var typeMaps = get(this, 'typeMaps');
    var guidForType = Ember.guidFor(type);

    var typeMap = typeMaps[guidForType];

    if (typeMap) {
      return typeMap;
    } else {
      return (typeMaps[guidForType] =
        {
          idToCid: {},
          clientIds: [],
          recordArrays: [],
          metadata: {}
      });
    }
  },

  /** @private

    For a given type and id combination, returns the client id used by the store.
    If no client id has been assigned yet, one will be created and returned.

    @param {DS.Model} type
    @param {String|Number} id
  */
  clientIdForId: function(type, id) {
    id = coerceId(id);

    var clientId = this.typeMapFor(type).idToCid[id];
    if (clientId !== undefined) { return clientId; }

    return this.pushData(UNLOADED, id, type);
  },

  /**
    @private

    This method works exactly like `clientIdForId`, but does not
    require looking up the `typeMap` for every `clientId` and
    invoking a method per `clientId`.
  */
  clientIdsForIds: function(type, ids) {
    var typeMap = this.typeMapFor(type),
        idToClientIdMap = typeMap.idToCid;

    return map(ids, function(id) {
      id = coerceId(id);

      var clientId = idToClientIdMap[id];
      if (clientId) { return clientId; }
      return this.pushData(UNLOADED, id, type);
    }, this);
  },

  typeForClientId: function(clientId) {
    return this.clientIdToType[clientId];
  },

  idForClientId: function(clientId) {
    return this.clientIdToId[clientId];
  },

  // ................
  // . LOADING DATA .
  // ................

  /**
    Load new data into the store for a given id and type combination.
    If data for that record had been loaded previously, the new information
    overwrites the old.

    If the record you are loading data for has outstanding changes that have not
    yet been saved, an exception will be thrown.

    @param {DS.Model} type
    @param {String|Number} id
    @param {Object} data the data to load
  */
  load: function(type, data, prematerialized) {
    var id;

    if (typeof data === 'number' || typeof data === 'string') {
      id = data;
      data = prematerialized;
      prematerialized = null;
    }

    if (prematerialized && prematerialized.id) {
      id = prematerialized.id;
    } else if (id === undefined) {
      id = this.preprocessData(type, data);
    }

    id = coerceId(id);

    var typeMap = this.typeMapFor(type),
        clientId = typeMap.idToCid[id],
        cidToPrematerialized = this.clientIdToPrematerializedData;

    if (clientId !== undefined) {
      this.loadData(data, clientId, type);
      cidToPrematerialized[clientId] = prematerialized;

      var record = this.recordCache[clientId];
      if (record) {
        once(record, 'loadedData');
      }
    } else {
      clientId = this.pushData(data, id, type);
      cidToPrematerialized[clientId] = prematerialized;
    }

    this.updateRecordArraysLater(type, clientId);

    return this.referenceForClientId(clientId);
  },

  prematerialize: function(reference, prematerialized) {
    this.clientIdToPrematerializedData[reference.clientId] = prematerialized;
  },

  loadMany: function(type, ids, dataList) {
    if (dataList === undefined) {
      dataList = ids;
      ids = map(dataList, function(data) {
        return this.preprocessData(type, data);
      }, this);
    }

    return map(ids, function(id, i) {
      return this.load(type, id, dataList[i]);
    }, this);
  },

  loadHasMany: function(record, key, ids) {
    //It looks sad to have to do the conversion in the store
    var type = record.get(key + '.type'),
        tuples = map(ids, function(id) {
          return {id: id, type: type};
        });
    record.materializeHasMany(key, tuples);

    // Update any existing many arrays that use the previous IDs,
    // if necessary.
    record.hasManyDidChange(key);

    var relationship = record.cacheFor(key);

    // TODO (tomdale) this assumes that loadHasMany *always* means
    // that the records for the provided IDs are loaded.
    if (relationship) {
      set(relationship, 'isLoaded', true);
      relationship.trigger('didLoad');
    }
  },

  loadData: function(data, clientId, type){
    var cidToData = this.clientIdToData;

    cidToData[clientId] = data;
  },

  /** @private

    Stores data for the specified type and id combination and returns
    the client id.

    @param {Object} data
    @param {String|Number} id
    @param {DS.Model} type
    @returns {Number}
  */
  pushData: function(data, id, type) {
    var typeMap = this.typeMapFor(type);

    var idToClientIdMap = typeMap.idToCid,
        clientIdToIdMap = this.clientIdToId,
        clientIdToTypeMap = this.clientIdToType,
        clientIds = typeMap.clientIds,
        cidToData = this.clientIdToData,
        clientId;

    // If we load an item referenced in a relationship,
    // it already has a clientId, but still needs to be materialized.
    if(clientId=idToClientIdMap[id]) {
      Ember.assert('The id ' + id + ' has already been used with another record of type ' + type.toString() + '.', !(data === CREATED && !!cidToData[clientId]));
    } else {
      clientId = ++this.clientIdCounter;
      clientIds.push(clientId);
    }

    this.loadData(data, clientId, type);
    clientIdToTypeMap[clientId] = type;

    // if we're creating an item, this process will be done
    // later, once the object has been persisted.
    if (id) {
      idToClientIdMap[id] = clientId;
      clientIdToIdMap[clientId] = id;
    }

    return clientId;
  },

  // ..........................
  // . RECORD MATERIALIZATION .
  // ..........................

  materializeRecord: function(type, clientId, id) {
    var record;

    this.recordCache[clientId] = record = type._create({
      store: this,
      clientId: clientId
    });

    set(record, 'id', id);

    get(this, 'defaultTransaction').adoptRecord(record);

    record.loadingData();
    return record;
  },

  dematerializeRecord: function(record) {
    var id = get(record, 'id'),
        clientId = get(record, 'clientId'),
        type = this.typeForClientId(clientId),
        typeMap = this.typeMapFor(type);

    record.updateRecordArrays();

    delete this.recordCache[clientId];
    delete this.clientIdToId[clientId];
    delete this.clientIdToType[clientId];
    delete this.clientIdToData[clientId];
    delete this.recordArraysByClientId[clientId];

    if (id) { delete typeMap.idToCid[id]; }
  },

  willDestroy: function() {
    if (get(DS, 'defaultStore') === this) {
      set(DS, 'defaultStore', null);
    }
  },

  // ........................
  // . RELATIONSHIP CHANGES .
  // ........................

  addRelationshipChangeFor: function(clientReference, childKey, parentReference, parentKey, change) {
    var clientId = clientReference.clientId,
        parentClientId = parentReference ? parentReference.clientId : parentReference;
    var key = childKey + parentKey;
    var changes = this.relationshipChanges;
    if (!(clientId in changes)) {
      changes[clientId] = {};
    }
    if (!(parentClientId in changes[clientId])) {
      changes[clientId][parentClientId] = {};
    }
    if (!(key in changes[clientId][parentClientId])) {
      changes[clientId][parentClientId][key] = {};
    }
    changes[clientId][parentClientId][key][change.changeType] = change;
  },

  removeRelationshipChangeFor: function(clientReference, childKey, parentReference, parentKey, type) {
    var clientId = clientReference.clientId,
        parentClientId = parentReference ? parentReference.clientId : parentReference;
    var changes = this.relationshipChanges;
    var key = childKey + parentKey;
    if (!(clientId in changes) || !(parentClientId in changes[clientId]) || !(key in changes[clientId][parentClientId])){
      return;
    }
    delete changes[clientId][parentClientId][key][type];
  },

  relationshipChangeFor: function(clientId, childKey, parentClientId, parentKey, type) {
    var changes = this.relationshipChanges;
    var key = childKey + parentKey;
    if (!(clientId in changes) || !(parentClientId in changes[clientId])){
      return;
    }
    if(type){
      return changes[clientId][parentClientId][key][type];
    }
    else{
      //TODO(Igor) what if both present
      return changes[clientId][parentClientId][key]["add"] || changes[clientId][parentClientId][key]["remove"];
    }
  },

  relationshipChangePairsFor: function(reference){
    var toReturn = [];

    if( !reference ) { return toReturn; }

    //TODO(Igor) What about the other side
    var changesObject = this.relationshipChanges[reference.clientId];
    for (var objKey in changesObject){
      if(changesObject.hasOwnProperty(objKey)){
        for (var changeKey in changesObject[objKey]){
          if(changesObject[objKey].hasOwnProperty(changeKey)){
            toReturn.push(changesObject[objKey][changeKey]);
          }
        }
      }
    }
    return toReturn;
  },

  relationshipChangesFor: function(reference) {
    var toReturn = [];

    if( !reference ) { return toReturn; }

    var relationshipPairs = this.relationshipChangePairsFor(reference);
    forEach(relationshipPairs, function(pair){
      var addedChange = pair["add"];
      var removedChange = pair["remove"];
      if(addedChange){
        toReturn.push(addedChange);
      }
      if(removedChange){
        toReturn.push(removedChange);
      }
    });
    return toReturn;
  },
  // ......................
  // . PER-TYPE ADAPTERS
  // ......................

  adapterForType: function(type) {
    this._adaptersMap = this.createInstanceMapFor('adapters');

    var adapter = this._adaptersMap.get(type);
    if (adapter) { return adapter; }

    return this.get('_adapter');
  },

  // ..............................
  // . RECORD CHANGE NOTIFICATION .
  // ..............................

  recordAttributeDidChange: function(reference, attributeName, newValue, oldValue) {
    var record = this.recordForReference(reference),
        dirtySet = new Ember.OrderedSet(),
        adapter = this.adapterForType(record.constructor);

    if (adapter.dirtyRecordsForAttributeChange) {
      adapter.dirtyRecordsForAttributeChange(dirtySet, record, attributeName, newValue, oldValue);
    }

    dirtySet.forEach(function(record) {
      record.adapterDidDirty();
    });
  },

  recordBelongsToDidChange: function(dirtySet, child, relationship) {
    var adapter = this.adapterForType(child.constructor);

    if (adapter.dirtyRecordsForBelongsToChange) {
      adapter.dirtyRecordsForBelongsToChange(dirtySet, child, relationship);
    }

    // adapterDidDirty is called by the RelationshipChange that created
    // the dirtySet.
  },

  recordHasManyDidChange: function(dirtySet, parent, relationship) {
    var adapter = this.adapterForType(parent.constructor);

    if (adapter.dirtyRecordsForHasManyChange) {
      adapter.dirtyRecordsForHasManyChange(dirtySet, parent, relationship);
    }

    // adapterDidDirty is called by the RelationshipChange that created
    // the dirtySet.
  }
});

DS.Store.reopenClass({
  registerAdapter: DS._Mappable.generateMapFunctionFor('adapters', function(type, adapter, map) {
    map.set(type, adapter);
  }),

  transformMapKey: function(key) {
    if (typeof key === 'string') {
      var transformedKey;
      transformedKey = get(Ember.lookup, key);
      Ember.assert("Could not find model at path " + key, transformedKey);
      return transformedKey;
    } else {
      return key;
    }
  },

  transformMapValue: function(key, value) {
    if (Ember.Object.detect(value)) {
      return value.create();
    }

    return value;
  }
});


/**
  @module data
  @submodule data-model
*/

/**
  @module data
  @submodule data-model
*/

var get = Ember.get, set = Ember.set,
    once = Ember.run.once, arrayMap = Ember.ArrayPolyfills.map;

/**
  This file encapsulates the various states that a record can transition
  through during its lifecycle.

  ### State Manager

  A record's state manager explicitly tracks what state a record is in
  at any given time. For instance, if a record is newly created and has
  not yet been sent to the adapter to be saved, it would be in the
  `created.uncommitted` state.  If a record has had local modifications
  made to it that are in the process of being saved, the record would be
  in the `updated.inFlight` state. (These state paths will be explained
  in more detail below.)

  Events are sent by the record or its store to the record's state manager.
  How the state manager reacts to these events is dependent on which state
  it is in. In some states, certain events will be invalid and will cause
  an exception to be raised.

  States are hierarchical. For example, a record can be in the
  `deleted.start` state, then transition into the `deleted.inFlight` state.
  If a child state does not implement an event handler, the state manager
  will attempt to invoke the event on all parent states until the root state is
  reached. The state hierarchy of a record is described in terms of a path
  string. You can determine a record's current state by getting its manager's
  current state path:

      record.get('stateManager.currentPath');
      //=> "created.uncommitted"

  The `DS.Model` states are themselves stateless. What we mean is that,
  though each instance of a record also has a unique instance of a
  `DS.StateManager`, the hierarchical states that each of *those* points
  to is a shared data structure. For performance reasons, instead of each
  record getting its own copy of the hierarchy of states, each state
  manager points to this global, immutable shared instance. How does a
  state know which record it should be acting on?  We pass a reference to
  the current state manager as the first parameter to every method invoked
  on a state.

  The state manager passed as the first parameter is where you should stash
  state about the record if needed; you should never store data on the state
  object itself. If you need access to the record being acted on, you can
  retrieve the state manager's `record` property. For example, if you had
  an event handler `myEvent`:

      myEvent: function(manager) {
        var record = manager.get('record');
        record.doSomething();
      }

  For more information about state managers in general, see the Ember.js
  documentation on `Ember.StateManager`.

  ### Events, Flags, and Transitions

  A state may implement zero or more events, flags, or transitions.

  #### Events

  Events are named functions that are invoked when sent to a record. The
  state manager will first look for a method with the given name on the
  current state. If no method is found, it will search the current state's
  parent, and then its grandparent, and so on until reaching the top of
  the hierarchy. If the root is reached without an event handler being found,
  an exception will be raised. This can be very helpful when debugging new
  features.

  Here's an example implementation of a state with a `myEvent` event handler:

      aState: DS.State.create({
        myEvent: function(manager, param) {
          console.log("Received myEvent with "+param);
        }
      })

  To trigger this event:

      record.send('myEvent', 'foo');
      //=> "Received myEvent with foo"

  Note that an optional parameter can be sent to a record's `send()` method,
  which will be passed as the second parameter to the event handler.

  Events should transition to a different state if appropriate. This can be
  done by calling the state manager's `transitionTo()` method with a path to the
  desired state. The state manager will attempt to resolve the state path
  relative to the current state. If no state is found at that path, it will
  attempt to resolve it relative to the current state's parent, and then its
  parent, and so on until the root is reached. For example, imagine a hierarchy
  like this:

      * created
        * start <-- currentState
        * inFlight
      * updated
        * inFlight

  If we are currently in the `start` state, calling
  `transitionTo('inFlight')` would transition to the `created.inFlight` state,
  while calling `transitionTo('updated.inFlight')` would transition to
  the `updated.inFlight` state.

  Remember that *only events* should ever cause a state transition. You should
  never call `transitionTo()` from outside a state's event handler. If you are
  tempted to do so, create a new event and send that to the state manager.

  #### Flags

  Flags are Boolean values that can be used to introspect a record's current
  state in a more user-friendly way than examining its state path. For example,
  instead of doing this:

      var statePath = record.get('stateManager.currentPath');
      if (statePath === 'created.inFlight') {
        doSomething();
      }

  You can say:

      if (record.get('isNew') && record.get('isSaving')) {
        doSomething();
      }

  If your state does not set a value for a given flag, the value will
  be inherited from its parent (or the first place in the state hierarchy
  where it is defined).

  The current set of flags are defined below. If you want to add a new flag,
  in addition to the area below, you will also need to declare it in the
  `DS.Model` class.

  #### Transitions

  Transitions are like event handlers but are called automatically upon
  entering or exiting a state. To implement a transition, just call a method
  either `enter` or `exit`:

      myState: DS.State.create({
        // Gets called automatically when entering
        // this state.
        enter: function(manager) {
          console.log("Entered myState");
        }
      })

  Note that enter and exit events are called once per transition. If the
  current state changes, but changes to another child state of the parent,
  the transition event on the parent will not be triggered.

  @class States
  @namespace DS
  @extends Ember.State
*/

var stateProperty = Ember.computed(function(key) {
  var parent = get(this, 'parentState');
  if (parent) {
    return get(parent, key);
  }
}).property();

var hasDefinedProperties = function(object) {
  for (var name in object) {
    if (object.hasOwnProperty(name) && object[name]) { return true; }
  }

  return false;
};

var didChangeData = function(manager) {
  var record = get(manager, 'record');
  record.materializeData();
};

var willSetProperty = function(manager, context) {
  context.oldValue = get(get(manager, 'record'), context.name);

  var change = DS.AttributeChange.createChange(context);
  get(manager, 'record')._changesToSync[context.name] = change;
};

var didSetProperty = function(manager, context) {
  var change = get(manager, 'record')._changesToSync[context.name];
  change.value = get(get(manager, 'record'), context.name);
  change.sync();
};

DS.State = Ember.State.extend({
  isLoading: stateProperty,
  isLoaded: stateProperty,
  isReloading: stateProperty,
  isDirty: stateProperty,
  isSaving: stateProperty,
  isDeleted: stateProperty,
  isError: stateProperty,
  isNew: stateProperty,
  isValid: stateProperty,

  // For states that are substates of a
  // DirtyState (updated or created), it is
  // useful to be able to determine which
  // type of dirty state it is.
  dirtyType: stateProperty
});

// Implementation notes:
//
// Each state has a boolean value for all of the following flags:
//
// * isLoaded: The record has a populated `data` property. When a
//   record is loaded via `store.find`, `isLoaded` is false
//   until the adapter sets it. When a record is created locally,
//   its `isLoaded` property is always true.
// * isDirty: The record has local changes that have not yet been
//   saved by the adapter. This includes records that have been
//   created (but not yet saved) or deleted.
// * isSaving: The record's transaction has been committed, but
//   the adapter has not yet acknowledged that the changes have
//   been persisted to the backend.
// * isDeleted: The record was marked for deletion. When `isDeleted`
//   is true and `isDirty` is true, the record is deleted locally
//   but the deletion was not yet persisted. When `isSaving` is
//   true, the change is in-flight. When both `isDirty` and
//   `isSaving` are false, the change has persisted.
// * isError: The adapter reported that it was unable to save
//   local changes to the backend. This may also result in the
//   record having its `isValid` property become false if the
//   adapter reported that server-side validations failed.
// * isNew: The record was created on the client and the adapter
//   did not yet report that it was successfully saved.
// * isValid: No client-side validations have failed and the
//   adapter did not report any server-side validation failures.

// The dirty state is a abstract state whose functionality is
// shared between the `created` and `updated` states.
//
// The deleted state shares the `isDirty` flag with the
// subclasses of `DirtyState`, but with a very different
// implementation.
//
// Dirty states have three child states:
//
// `uncommitted`: the store has not yet handed off the record
//   to be saved.
// `inFlight`: the store has handed off the record to be saved,
//   but the adapter has not yet acknowledged success.
// `invalid`: the record has invalid information and cannot be
//   send to the adapter yet.
var DirtyState = DS.State.extend({
  initialState: 'uncommitted',

  // FLAGS
  isDirty: true,

  // SUBSTATES

  // When a record first becomes dirty, it is `uncommitted`.
  // This means that there are local pending changes, but they
  // have not yet begun to be saved, and are not invalid.
  uncommitted: DS.State.extend({
    // TRANSITIONS
    enter: function(manager) {
      var dirtyType = get(this, 'dirtyType'),
          record = get(manager, 'record');

      record.withTransaction(function (t) {
        t.recordBecameDirty(dirtyType, record);
      });
    },

    // EVENTS
    willSetProperty: willSetProperty,
    didSetProperty: didSetProperty,

    becomeDirty: Ember.K,

    willCommit: function(manager) {
      manager.transitionTo('inFlight');
    },

    becameClean: function(manager) {
      var record = get(manager, 'record'),
          dirtyType = get(this, 'dirtyType');

      record.withTransaction(function(t) {
        t.recordBecameClean(dirtyType, record);
      });

      manager.transitionTo('loaded.materializing');
    },

    becameInvalid: function(manager) {
      var dirtyType = get(this, 'dirtyType'),
          record = get(manager, 'record');

      record.withTransaction(function (t) {
        t.recordBecameInFlight(dirtyType, record);
      });

      manager.transitionTo('invalid');
    },

    rollback: function(manager) {
      get(manager, 'record').rollback();
    }
  }),

  // Once a record has been handed off to the adapter to be
  // saved, it is in the 'in flight' state. Changes to the
  // record cannot be made during this window.
  inFlight: DS.State.extend({
    // FLAGS
    isSaving: true,

    // TRANSITIONS
    enter: function(manager) {
      var dirtyType = get(this, 'dirtyType'),
          record = get(manager, 'record');

      record.becameInFlight();

      record.withTransaction(function (t) {
        t.recordBecameInFlight(dirtyType, record);
      });
    },

    // EVENTS
    didCommit: function(manager) {
      var dirtyType = get(this, 'dirtyType'),
          record = get(manager, 'record');

      record.withTransaction(function(t) {
        t.recordBecameClean('inflight', record);
      });

      manager.transitionTo('saved');
      manager.send('invokeLifecycleCallbacks', dirtyType);
    },

    becameInvalid: function(manager, errors) {
      var record = get(manager, 'record');

      set(record, 'errors', errors);

      manager.transitionTo('invalid');
      manager.send('invokeLifecycleCallbacks');
    },

    becameError: function(manager) {
      manager.transitionTo('error');
      manager.send('invokeLifecycleCallbacks');
    }
  }),

  // A record is in the `invalid` state when its client-side
  // invalidations have failed, or if the adapter has indicated
  // the the record failed server-side invalidations.
  invalid: DS.State.extend({
    // FLAGS
    isValid: false,

    exit: function(manager) {
      var record = get(manager, 'record');

      record.withTransaction(function (t) {
        t.recordBecameClean('inflight', record);
      });
    },

    // EVENTS
    deleteRecord: function(manager) {
      manager.transitionTo('deleted');
      get(manager, 'record').clearRelationships();
    },

    willSetProperty: willSetProperty,

    didSetProperty: function(manager, context) {
      var record = get(manager, 'record'),
          errors = get(record, 'errors'),
          key = context.name;

      set(errors, key, null);

      if (!hasDefinedProperties(errors)) {
        manager.send('becameValid');
      }

      didSetProperty(manager, context);
    },

    becomeDirty: Ember.K,

    rollback: function(manager) {
      manager.send('becameValid');
      manager.send('rollback');
    },

    becameValid: function(manager) {
      manager.transitionTo('uncommitted');
    },

    invokeLifecycleCallbacks: function(manager) {
      var record = get(manager, 'record');
      record.trigger('becameInvalid', record);
    }
  })
});

// The created and updated states are created outside the state
// chart so we can reopen their substates and add mixins as
// necessary.

var createdState = DirtyState.create({
  dirtyType: 'created',

  // FLAGS
  isNew: true
});

var updatedState = DirtyState.create({
  dirtyType: 'updated'
});

createdState.states.uncommitted.reopen({
  deleteRecord: function(manager) {
    var record = get(manager, 'record');

    record.withTransaction(function(t) {
      t.recordIsMoving('created', record);
    });

    record.clearRelationships();
    manager.transitionTo('deleted.saved');
  }
});

createdState.states.uncommitted.reopen({
  rollback: function(manager) {
    this._super(manager);
    manager.transitionTo('deleted.saved');
  }
});

updatedState.states.uncommitted.reopen({
  deleteRecord: function(manager) {
    var record = get(manager, 'record');

    record.withTransaction(function(t) {
      t.recordIsMoving('updated', record);
    });

    manager.transitionTo('deleted');
    get(manager, 'record').clearRelationships();
  }
});

var states = {
  rootState: Ember.State.create({
    // FLAGS
    isLoading: false,
    isLoaded: false,
    isReloading: false,
    isDirty: false,
    isSaving: false,
    isDeleted: false,
    isError: false,
    isNew: false,
    isValid: true,

    // SUBSTATES

    // A record begins its lifecycle in the `empty` state.
    // If its data will come from the adapter, it will
    // transition into the `loading` state. Otherwise, if
    // the record is being created on the client, it will
    // transition into the `created` state.
    empty: DS.State.create({
      // EVENTS
      loadingData: function(manager) {
        manager.transitionTo('loading');
      },

      loadedData: function(manager) {
        manager.transitionTo('loaded.created');
      }
    }),

    // A record enters this state when the store askes
    // the adapter for its data. It remains in this state
    // until the adapter provides the requested data.
    //
    // Usually, this process is asynchronous, using an
    // XHR to retrieve the data.
    loading: DS.State.create({
      // FLAGS
      isLoading: true,

      // EVENTS
      loadedData: didChangeData,

      materializingData: function(manager) {
        manager.transitionTo('loaded.materializing.firstTime');
      }
    }),

    // A record enters this state when its data is populated.
    // Most of a record's lifecycle is spent inside substates
    // of the `loaded` state.
    loaded: DS.State.create({
      initialState: 'saved',

      // FLAGS
      isLoaded: true,

      // SUBSTATES

      materializing: DS.State.create({
        // EVENTS
        willSetProperty: Ember.K,
        didSetProperty: Ember.K,

        didChangeData: didChangeData,

        finishedMaterializing: function(manager) {
          manager.transitionTo('loaded.saved');
        },

        // SUBSTATES
        firstTime: DS.State.create({
          // FLAGS
          isLoaded: false,

          exit: function(manager) {
            var record = get(manager, 'record');

            once(function() {
              record.trigger('didLoad');
            });
          }
        })
      }),

      reloading: DS.State.create({
        // FLAGS
        isReloading: true,

        // TRANSITIONS
        enter: function(manager) {
          var record = get(manager, 'record'),
              store = get(record, 'store');

          store.reloadRecord(record);
        },

        exit: function(manager) {
          var record = get(manager, 'record');

          once(record, 'trigger', 'didReload');
        },

        // EVENTS
        loadedData: didChangeData,

        materializingData: function(manager) {
          manager.transitionTo('loaded.materializing');
        }
      }),

      // If there are no local changes to a record, it remains
      // in the `saved` state.
      saved: DS.State.create({
        // EVENTS
        willSetProperty: willSetProperty,
        didSetProperty: didSetProperty,

        didChangeData: didChangeData,
        loadedData: didChangeData,

        reloadRecord: function(manager) {
          manager.transitionTo('loaded.reloading');
        },

        materializingData: function(manager) {
          manager.transitionTo('loaded.materializing');
        },

        becomeDirty: function(manager) {
          manager.transitionTo('updated');
        },

        deleteRecord: function(manager) {
          manager.transitionTo('deleted');
          get(manager, 'record').clearRelationships();
        },

        unloadRecord: function(manager) {
          var record = get(manager, 'record');

          // clear relationships before moving to deleted state
          // otherwise it fails
          record.clearRelationships();
          record.withTransaction(function(t) {
            t.recordIsMoving('updated', record);
          });
          manager.transitionTo('deleted.saved');
        },

        invokeLifecycleCallbacks: function(manager, dirtyType) {
          var record = get(manager, 'record');
          if (dirtyType === 'created') {
            record.trigger('didCreate', record);
          } else {
            record.trigger('didUpdate', record);
          }
        }
      }),

      // A record is in this state after it has been locally
      // created but before the adapter has indicated that
      // it has been saved.
      created: createdState,

      // A record is in this state if it has already been
      // saved to the server, but there are new local changes
      // that have not yet been saved.
      updated: updatedState
    }),

    // A record is in this state if it was deleted from the store.
    deleted: DS.State.create({
      initialState: 'uncommitted',
      dirtyType: 'deleted',

      // FLAGS
      isDeleted: true,
      isLoaded: true,
      isDirty: true,

      // TRANSITIONS
      setup: function(manager) {
        var record = get(manager, 'record'),
            store = get(record, 'store');

        store.removeFromRecordArrays(record);
      },

      // SUBSTATES

      // When a record is deleted, it enters the `start`
      // state. It will exit this state when the record's
      // transaction starts to commit.
      uncommitted: DS.State.create({
        // TRANSITIONS
        enter: function(manager) {
          var record = get(manager, 'record');

          record.withTransaction(function(t) {
            t.recordBecameDirty('deleted', record);
          });
        },

        // EVENTS
        willCommit: function(manager) {
          manager.transitionTo('inFlight');
        },

        rollback: function(manager) {
          get(manager, 'record').rollback();
        },

        becomeDirty: Ember.K,

        becameClean: function(manager) {
          var record = get(manager, 'record');

          record.withTransaction(function(t) {
            t.recordBecameClean('deleted', record);
          });

          manager.transitionTo('loaded.materializing');
        }
      }),

      // After a record's transaction is committing, but
      // before the adapter indicates that the deletion
      // has saved to the server, a record is in the
      // `inFlight` substate of `deleted`.
      inFlight: DS.State.create({
        // FLAGS
        isSaving: true,

        // TRANSITIONS
        enter: function(manager) {
          var record = get(manager, 'record');

          record.becameInFlight();

          record.withTransaction(function (t) {
            t.recordBecameInFlight('deleted', record);
          });
        },

        // EVENTS
        didCommit: function(manager) {
          var record = get(manager, 'record');

          record.withTransaction(function(t) {
            t.recordBecameClean('inflight', record);
          });

          manager.transitionTo('saved');

          manager.send('invokeLifecycleCallbacks');
        }
      }),

      // Once the adapter indicates that the deletion has
      // been saved, the record enters the `saved` substate
      // of `deleted`.
      saved: DS.State.create({
        // FLAGS
        isDirty: false,

        setup: function(manager) {
          var record = get(manager, 'record'),
              store = get(record, 'store');

          store.dematerializeRecord(record);
        },

        invokeLifecycleCallbacks: function(manager) {
          var record = get(manager, 'record');
          record.trigger('didDelete', record);
        }
      })
    }),

    // If the adapter indicates that there was an unknown
    // error saving a record, the record enters the `error`
    // state.
    error: DS.State.create({
      isError: true,

      // EVENTS

      invokeLifecycleCallbacks: function(manager) {
        var record = get(manager, 'record');
        record.trigger('becameError', record);
      }
    })
  })
};

DS.StateManager = Ember.StateManager.extend({
  record: null,
  initialState: 'rootState',
  states: states,
  unhandledEvent: function(manager, originalEvent) {
    var record = manager.get('record'),
        contexts = [].slice.call(arguments, 2),
        errorMessage;
    errorMessage  = "Attempted to handle event `" + originalEvent + "` ";
    errorMessage += "on " + record.toString() + " while in state ";
    errorMessage += get(manager, 'currentState.path') + ". Called with ";
    errorMessage += arrayMap.call(contexts, function(context){
                      return Ember.inspect(context);
                    }).join(', ');
    throw new Ember.Error(errorMessage);
  }
});



var LoadPromise = DS.LoadPromise; // system/mixins/load_promise

var get = Ember.get, set = Ember.set, map = Ember.EnumerableUtils.map;

var retrieveFromCurrentState = Ember.computed(function(key, value) {
  return get(get(this, 'stateManager.currentState'), key);
}).property('stateManager.currentState').readOnly();

/**
  
  The model class that all Ember Data records descend from.

  @module data
  @submodule data-model
  @main data-model

  @class Model
  @namespace DS
  @extends Ember.Object
  @constructor
*/
DS.Model = Ember.Object.extend(Ember.Evented, LoadPromise, {
  isLoading: retrieveFromCurrentState,
  isLoaded: retrieveFromCurrentState,
  isReloading: retrieveFromCurrentState,
  isDirty: retrieveFromCurrentState,
  isSaving: retrieveFromCurrentState,
  isDeleted: retrieveFromCurrentState,
  isError: retrieveFromCurrentState,
  isNew: retrieveFromCurrentState,
  isValid: retrieveFromCurrentState,

  clientId: null,
  id: null,
  transaction: null,
  stateManager: null,
  errors: null,

  /**
    Create a JSON representation of the record, using the serialization
    strategy of the store's adapter.

    @method serialize
    @param {Object} options Available options:

    * `includeId`: `true` if the record's ID should be included in the
      JSON representation.

    @returns {Object} an object whose values are primitive JSON values only
  */
  serialize: function(options) {
    var store = get(this, 'store');
    return store.serialize(this, options);
  },

  /**
    Use {{#crossLink "DS.JSONSerializer"}}DS.JSONSerializer{{/crossLink}} to
    get the JSON representation of a record.

    @method toJSON
    @param {Object} options Available options:

    * `includeId`: `true` if the record's ID should be included in the
      JSON representation.

    @returns {Object} A JSON representation of the object.
  */
  toJSON: function(options) {
    var serializer = DS.JSONSerializer.create();
    return serializer.serialize(this, options);
  },

  /**
    Fired when the record is loaded from the server.

    @event didLoad
  */
  didLoad: Ember.K,

  /**
    Fired when the record is reloaded from the server.

    @event didReload
  */
  didReload: Ember.K,

  /**
    Fired when the record is updated.

    @event didUpdate
  */
  didUpdate: Ember.K,

  /**
    Fired when the record is created.

    @event didCreate
  */
  didCreate: Ember.K,

  /**
    Fired when the record is deleted.
    
    @event didDelete
  */
  didDelete: Ember.K,

  /**
    Fired when the record becomes invalid.
    
    @event becameInvalid
  */
  becameInvalid: Ember.K,

  /**
    Fired when the record enters the error state.

    @event becameError
  */
  becameError: Ember.K,

  data: Ember.computed(function() {
    if (!this._data) {
      this.materializeData();
    }

    return this._data;
  }).property(),

  materializeData: function() {
    this.send('materializingData');

    get(this, 'store').materializeData(this);

    this.suspendRelationshipObservers(function() {
      this.notifyPropertyChange('data');
    });
  },

  _data: null,

  init: function() {
    this._super();

    var stateManager = DS.StateManager.create({ record: this });
    set(this, 'stateManager', stateManager);

    this._setup();

    stateManager.goToState('empty');
  },

  _setup: function() {
    this._relationshipChanges = {};
    this._changesToSync = {};
  },

  send: function(name, context) {
    return get(this, 'stateManager').send(name, context);
  },

  withTransaction: function(fn) {
    var transaction = get(this, 'transaction');
    if (transaction) { fn(transaction); }
  },

  loadingData: function() {
    this.send('loadingData');
  },

  loadedData: function() {
    this.send('loadedData');
  },

  didChangeData: function() {
    this.send('didChangeData');
  },

  /**
    Reload the record from the adapter.

    This will only work if the record has already finished loading
    and has not yet been modified (`isLoaded` but not `isDirty`,
    or `isSaving`).

    @method reload
  */
  reload: function() {
    this.send('reloadRecord');
  },

  deleteRecord: function() {
    this.send('deleteRecord');
  },

  unloadRecord: function() {
    Ember.assert("You can only unload a loaded, non-dirty record.", !get(this, 'isDirty'));

    this.send('unloadRecord');
  },

  clearRelationships: function() {
    this.eachRelationship(function(name, relationship) {
      if (relationship.kind === 'belongsTo') {
        set(this, name, null);
      } else if (relationship.kind === 'hasMany') {
        this.clearHasMany(relationship);
      }
    }, this);
  },

  updateRecordArrays: function() {
    var store = get(this, 'store');
    if (store) {
      store.dataWasUpdated(this.constructor, get(this, '_reference'), this);
    }
  },

  /**
    If the adapter did not return a hash in response to a commit,
    merge the changed attributes and relationships into the existing
    saved data.
  */
  adapterDidCommit: function() {
    var attributes = get(this, 'data').attributes;

    get(this.constructor, 'attributes').forEach(function(name, meta) {
      attributes[name] = get(this, name);
    }, this);

    this.send('didCommit');
    this.updateRecordArraysLater();
  },

  adapterDidDirty: function() {
    this.send('becomeDirty');
    this.updateRecordArraysLater();
  },

  dataDidChange: Ember.observer(function() {
    var relationships = get(this.constructor, 'relationshipsByName');

    this.updateRecordArraysLater();

    relationships.forEach(function(name, relationship) {
      if (relationship.kind === 'hasMany') {
        this.hasManyDidChange(relationship.key);
      }
    }, this);

    this.send('finishedMaterializing');
  }, 'data'),

  hasManyDidChange: function(key) {
    var cachedValue = this.cacheFor(key);

    if (cachedValue) {
      var type = get(this.constructor, 'relationshipsByName').get(key).type;
      var store = get(this, 'store');
      var ids = this._data.hasMany[key] || [];

      var references = map(ids, function(id) {
        if (typeof id === 'object') {
          if( id.clientId ) {
            // if it was already a reference, return the reference
            return id;
          } else {
            // <id, type> tuple for a polymorphic association.
            return store.referenceForId(id.type, id.id);
          }
        }
        return store.referenceForId(type, id);
      });

      set(cachedValue, 'content', Ember.A(references));
    }
  },

  updateRecordArraysLater: function() {
    Ember.run.once(this, this.updateRecordArrays);
  },

  setupData: function(prematerialized) {
    this._data = {
      attributes: {},
      belongsTo: {},
      hasMany: {},
      id: null
    };
  },

  materializeId: function(id) {
    set(this, 'id', id);
  },

  materializeAttributes: function(attributes) {
    Ember.assert("Must pass a hash of attributes to materializeAttributes", !!attributes);
    this._data.attributes = attributes;
  },

  materializeAttribute: function(name, value) {
    this._data.attributes[name] = value;
  },

  materializeHasMany: function(name, tuplesOrReferencesOrOpaque) {
    var tuplesOrReferencesOrOpaqueType = typeof tuplesOrReferencesOrOpaque;
    if (tuplesOrReferencesOrOpaque && tuplesOrReferencesOrOpaqueType !== 'string' && tuplesOrReferencesOrOpaque.length > 1) { Ember.assert('materializeHasMany expects tuples, references or opaque token, not ' + tuplesOrReferencesOrOpaque[0], tuplesOrReferencesOrOpaque[0].hasOwnProperty('id') && tuplesOrReferencesOrOpaque[0].type); }
    if( tuplesOrReferencesOrOpaqueType === "string" ) {
      this._data.hasMany[name] = tuplesOrReferencesOrOpaque;
    } else {
      var references = tuplesOrReferencesOrOpaque;

      if (tuplesOrReferencesOrOpaque && Ember.isArray(tuplesOrReferencesOrOpaque)) {
        references = this._convertTuplesToReferences(tuplesOrReferencesOrOpaque);
      }

      this._data.hasMany[name] = references;
    }
  },

  materializeBelongsTo: function(name, tupleOrReference) {
    if (tupleOrReference) { Ember.assert('materializeBelongsTo expects a tuple or a reference, not a ' + tupleOrReference, !tupleOrReference || (tupleOrReference.hasOwnProperty('id') && tupleOrReference.hasOwnProperty('type'))); }

    this._data.belongsTo[name] = tupleOrReference;
  },

  _convertTuplesToReferences: function(tuplesOrReferences) {
    return map(tuplesOrReferences, function(tupleOrReference) {
      return this._convertTupleToReference(tupleOrReference);
    }, this);
  },

  _convertTupleToReference: function(tupleOrReference) {
    var store = get(this, 'store');
    if(tupleOrReference.clientId) {
      return tupleOrReference;
    } else {
      return store.referenceForId(tupleOrReference.type, tupleOrReference.id);
    }
  },

  rollback: function() {
    this._setup();
    this.send('becameClean');

    this.suspendRelationshipObservers(function() {
      this.notifyPropertyChange('data');
    });
  },

  toStringExtension: function() {
    return get(this, 'id');
  },

  /**
    @private

    The goal of this method is to temporarily disable specific observers
    that take action in response to application changes.

    This allows the system to make changes (such as materialization and
    rollback) that should not trigger secondary behavior (such as setting an
    inverse relationship or marking records as dirty).

    The specific implementation will likely change as Ember proper provides
    better infrastructure for suspending groups of observers, and if Array
    observation becomes more unified with regular observers.
  */
  suspendRelationshipObservers: function(callback, binding) {
    var observers = get(this.constructor, 'relationshipNames').belongsTo;
    var self = this;

    try {
      this._suspendedRelationships = true;
      Ember._suspendObservers(self, observers, null, 'belongsToDidChange', function() {
        Ember._suspendBeforeObservers(self, observers, null, 'belongsToWillChange', function() {
          callback.call(binding || self);
        });
      });
    } finally {
      this._suspendedRelationships = false;
    }
  },

  becameInFlight: function() {
  },

  // FOR USE BY THE BASIC ADAPTER

  save: function() {
    this.get('store').scheduleSave(this);
  },

  // FOR USE DURING COMMIT PROCESS

  adapterDidUpdateAttribute: function(attributeName, value) {

    // If a value is passed in, update the internal attributes and clear
    // the attribute cache so it picks up the new value. Otherwise,
    // collapse the current value into the internal attributes because
    // the adapter has acknowledged it.
    if (value !== undefined) {
      get(this, 'data.attributes')[attributeName] = value;
      this.notifyPropertyChange(attributeName);
    } else {
      value = get(this, attributeName);
      get(this, 'data.attributes')[attributeName] = value;
    }

    this.updateRecordArraysLater();
  },

  _reference: Ember.computed(function() {
    return get(this, 'store').referenceForClientId(get(this, 'clientId'));
  }),

  adapterDidInvalidate: function(errors) {
    this.send('becameInvalid', errors);
  },

  adapterDidError: function() {
    this.send('becameError');
  },

  /**
    @private

    Override the default event firing from Ember.Evented to
    also call methods with the given name.
  */
  trigger: function(name) {
    Ember.tryInvoke(this, name, [].slice.call(arguments, 1));
    this._super.apply(this, arguments);
  }
});

// Helper function to generate store aliases.
// This returns a function that invokes the named alias
// on the default store, but injects the class as the
// first parameter.
var storeAlias = function(methodName) {
  return function() {
    var store = get(DS, 'defaultStore'),
        args = [].slice.call(arguments);

    args.unshift(this);
    Ember.assert("Your application does not have a 'Store' property defined. Attempts to call '" + methodName + "' on model classes will fail. Please provide one as with 'YourAppName.Store = DS.Store.extend()'", !!store);
    return store[methodName].apply(store, args);
  };
};

DS.Model.reopenClass({
  isLoaded: storeAlias('recordIsLoaded'),

  /**
    See {{#crossLink "DS.Store/find:method"}}`DS.Store.find()`{{/crossLink}}.

    @method find
    @param {Object|String|Array|null} query A query to find records by.

  */
  find: storeAlias('find'),

  /**
    See {{#crossLink "DS.Store/all:method"}}`DS.Store.all()`{{/crossLink}}.

    @method all
    @return {DS.RecordArray}
  */
  all: storeAlias('all'),

  /**
    See {{#crossLink "DS.Store/findQuery:method"}}`DS.Store.findQuery()`{{/crossLink}}.

    @method query
    @param {Object} query an opaque query to be used by the adapter
    @return {DS.AdapterPopulatedRecordArray}
  */
  query: storeAlias('findQuery'),

  /**
    See {{#crossLink "DS.Store/filter:method"}}`DS.Store.filter()`{{/crossLink}}.

    @method filter
    @param {Function} filter
    @return {DS.FilteredRecordArray}
  */
  filter: storeAlias('filter'),

  _create: DS.Model.create,

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `createRecord` with the attributes you would like to set.");
  },

  /**
    See {{#crossLink "DS.Store/createRecord:method"}}`DS.Store.createRecord()`{{/crossLink}}.

    @method createRecord
    @param {Object} properties a hash of properties to set on the
      newly created record.
    @returns DS.Model
  */
  createRecord: storeAlias('createRecord')
});




/**
  @module data
  @submodule data-model
*/

var get = Ember.get;

DS.Model.reopenClass({
  attributes: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute) {
        Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: DS.attr('<type>')` from " + this.toString(), name !== 'id');

        meta.name = name;
        map.set(name, meta);
      }
    });

    return map;
  })
});

var AttributeChange = DS.AttributeChange = function(options) {
  this.reference = options.reference;
  this.store = options.store;
  this.name = options.name;
  this.oldValue = options.oldValue;
};

AttributeChange.createChange = function(options) {
  return new AttributeChange(options);
};

AttributeChange.prototype = {
  sync: function() {
    this.store.recordAttributeDidChange(this.reference, this.name, this.value, this.oldValue);

    // TODO: Use this object in the commit process
    this.destroy();
  },

  destroy: function() {
    delete this.store.recordForReference(this.reference)._changesToSync[this.name];
  }
};

DS.Model.reopen({
  eachAttribute: function(callback, binding) {
    get(this.constructor, 'attributes').forEach(function(name, meta) {
      callback.call(binding, name, meta);
    }, binding);
  },

  attributeWillChange: Ember.beforeObserver(function(record, key) {
    var reference = get(record, '_reference'),
        store = get(record, 'store');

    record.send('willSetProperty', { reference: reference, store: store, name: key });
  }),

  attributeDidChange: Ember.observer(function(record, key) {
    record.send('didSetProperty', { name: key });
  })
});

function getAttr(record, options, key) {
  var attributes = get(record, 'data').attributes;
  var value = attributes[key];

  if (value === undefined) {
    if (typeof options.defaultValue === "function") {
      value = options.defaultValue();
    } else {
      value = options.defaultValue;
    }
  }

  return value;
}

DS.attr = function(type, options) {
  options = options || {};

  var meta = {
    type: type,
    isAttribute: true,
    options: options
  };

  return Ember.computed(function(key, value, oldValue) {
    if (arguments.length > 1) {
      Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: DS.attr('<type>')` from " + this.constructor.toString(), key !== 'id');
    } else {
      value = getAttr(this, options, key);
    }

    return value;
  // `data` is never set directly. However, it may be
  // invalidated from the state manager's setData
  // event.
  }).property('data').meta(meta);
};



/**
  @module data
  @submodule data-relationships
*/

var get = Ember.get, set = Ember.set,
    isNone = Ember.isNone;

DS.belongsTo = function(type, options) {
  Ember.assert("The first argument DS.belongsTo must be a model type or string, like DS.belongsTo(App.Person)", !!type && (typeof type === 'string' || DS.Model.detect(type)));

  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'belongsTo' };

  return Ember.computed(function(key, value) {
    if (typeof type === 'string') {
      type = get(this, type, false) || get(Ember.lookup, type);
    }

    if (arguments.length === 2) {
      Ember.assert("You can only add a record of " + type.toString() + " to this relationship", !value || type.detectInstance(value));
      return value === undefined ? null : value;
    }

    var data = get(this, 'data').belongsTo,
        store = get(this, 'store'), id;

    id = data[key];

    if(isNone(id)) {
      return null;
    } else if (id.clientId) {
      return store.recordForReference(id);
    } else {
      return store.findById(id.type, id.id);
    }
  }).property('data').meta(meta);
};

/**
  These observers observe all `belongsTo` relationships on the record. See
  `relationships/ext` to see how these observers get their dependencies.

*/

DS.Model.reopen({
  /** @private */
  belongsToWillChange: Ember.beforeObserver(function(record, key) {
    if (get(record, 'isLoaded')) {
      var oldParent = get(record, key);

      var childReference = get(record, '_reference'),
          store = get(record, 'store');
      if (oldParent){
        var change = DS.RelationshipChange.createChange(childReference, get(oldParent, '_reference'), store, { key: key, kind:"belongsTo", changeType: "remove" });
        change.sync();
        this._changesToSync[key] = change;
      }
    }
  }),

  /** @private */
  belongsToDidChange: Ember.immediateObserver(function(record, key) {
    if (get(record, 'isLoaded')) {
      var newParent = get(record, key);
      if(newParent){
        var childReference = get(record, '_reference'),
            store = get(record, 'store');
        var change = DS.RelationshipChange.createChange(childReference, get(newParent, '_reference'), store, { key: key, kind:"belongsTo", changeType: "add" });
        change.sync();
        if(this._changesToSync[key]){
          DS.OneToManyChange.ensureSameTransaction([change, this._changesToSync[key]], store);
        }
      }
    }
    delete this._changesToSync[key];
  })
});

var get = Ember.get, set = Ember.set, forEach = Ember.ArrayPolyfills.forEach;



var hasRelationship = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany' };

  return Ember.computed(function(key, value) {
    var data = get(this, 'data').hasMany,
        store = get(this, 'store'),
        ids, relationship;

    if (typeof type === 'string') {
      type = get(this, type, false) || get(Ember.lookup, type);
    }

    //ids can be references or opaque token
    //(e.g. `{url: '/relationship'}`) that will be passed to the adapter
    ids = data[key];

    relationship = store.findMany(type, ids, this, meta);
    set(relationship, 'owner', this);
    set(relationship, 'name', key);
    set(relationship, 'isPolymorphic', options.polymorphic);

    return relationship;
  }).property().meta(meta);
};

DS.hasMany = function(type, options) {
  Ember.assert("The type passed to DS.hasMany must be defined", !!type);
  return hasRelationship(type, options);
};

function clearUnmaterializedHasMany(record, relationship) {
  var store = get(record, 'store'),
      data = get(record, 'data').hasMany;

  var references = data[relationship.key];

  if (!references) { return; }

  var inverseName = record.constructor.inverseFor(relationship.key).name;


  forEach.call(references, function(reference) {
    var childRecord;

    if (store.isReferenceMaterialized(reference)) {
      childRecord = store.recordForReference(reference);

      record.suspendRelationshipObservers(function() {
        set(childRecord, inverseName, null);
      });
    }
  });
}

DS.Model.reopen({
  clearHasMany: function(relationship) {
    var hasMany = this.cacheFor(relationship.name);

    if (hasMany) {
      hasMany.clear();
    } else {
      clearUnmaterializedHasMany(this, relationship);
    }
  }
});

var get = Ember.get, set = Ember.set;

/**
  @private

  This file defines several extensions to the base `DS.Model` class that
  add support for one-to-many relationships.
*/

DS.Model.reopen({
  // This Ember.js hook allows an object to be notified when a property
  // is defined.
  //
  // In this case, we use it to be notified when an Ember Data user defines a
  // belongs-to relationship. In that case, we need to set up observers for
  // each one, allowing us to track relationship changes and automatically
  // reflect changes in the inverse has-many array.
  //
  // This hook passes the class being set up, as well as the key and value
  // being defined. So, for example, when the user does this:
  //
  //   DS.Model.extend({
  //     parent: DS.belongsTo(App.User)
  //   });
  //
  // This hook would be called with "parent" as the key and the computed
  // property returned by `DS.belongsTo` as the value.
  didDefineProperty: function(proto, key, value) {
    // Check if the value being set is a computed property.
    if (value instanceof Ember.Descriptor) {

      // If it is, get the metadata for the relationship. This is
      // populated by the `DS.belongsTo` helper when it is creating
      // the computed property.
      var meta = value.meta();

      if (meta.isRelationship && meta.kind === 'belongsTo') {
        Ember.addObserver(proto, key, null, 'belongsToDidChange');
        Ember.addBeforeObserver(proto, key, null, 'belongsToWillChange');
      }

      if (meta.isAttribute) {
        Ember.addObserver(proto, key, null, 'attributeDidChange');
        Ember.addBeforeObserver(proto, key, null, 'attributeWillChange');
      }

      meta.parentType = proto.constructor;
    }
  }
});

/**
  These DS.Model extensions add class methods that provide relationship
  introspection abilities about relationships.

  A note about the computed properties contained here:

  **These properties are effectively sealed once called for the first time.**
  To avoid repeatedly doing expensive iteration over a model's fields, these
  values are computed once and then cached for the remainder of the runtime of
  your application.

  If your application needs to modify a class after its initial definition
  (for example, using `reopen()` to add additional attributes), make sure you
  do it before using your model with the store, which uses these properties
  extensively.
*/

DS.Model.reopenClass({
  /**
    For a given relationship name, returns the model type of the relationship.

    For example, if you define a model like this:

        App.Post = DS.Model.extend({
          comments: DS.hasMany(App.Comment)
        });

    Calling `App.Post.typeForRelationship('comments')` will return `App.Comment`.

    @param {String} name the name of the relationship
    @return {subclass of DS.Model} the type of the relationship, or undefined
  */
  typeForRelationship: function(name) {
    var relationship = get(this, 'relationshipsByName').get(name);
    return relationship && relationship.type;
  },

  inverseFor: function(name) {
    var inverseType = this.typeForRelationship(name);

    if (!inverseType) { return null; }

    var options = this.metaForProperty(name).options;
    var inverseName, inverseKind;

    if (options.inverse) {
      inverseName = options.inverse;
      inverseKind = Ember.get(inverseType, 'relationshipsByName').get(inverseName).kind;
    } else {
      var possibleRelationships = findPossibleInverses(this, inverseType);

      if (possibleRelationships.length === 0) { return null; }

      Ember.assert("You defined the '" + name + "' relationship on " + this + ", but multiple possible inverse relationships of type " + this + " were found on " + inverseType + ".", possibleRelationships.length === 1);

      inverseName = possibleRelationships[0].name;
      inverseKind = possibleRelationships[0].kind;
    }

    function findPossibleInverses(type, inverseType, possibleRelationships) {
      possibleRelationships = possibleRelationships || [];

      var relationshipMap = get(inverseType, 'relationships');
      if (!relationshipMap) { return; }

      var relationships = relationshipMap.get(type);
      if (relationships) {
        possibleRelationships.push.apply(possibleRelationships, relationshipMap.get(type));
      }

      if (type.superclass) {
        findPossibleInverses(type.superclass, inverseType, possibleRelationships);
      }

      return possibleRelationships;
    }

    return {
      type: inverseType,
      name: inverseName,
      kind: inverseKind
    };
  },

  /**
    The model's relationships as a map, keyed on the type of the
    relationship. The value of each entry is an array containing a descriptor
    for each relationship with that type, describing the name of the relationship
    as well as the type.

    For example, given the following model definition:

        App.Blog = DS.Model.extend({
          users: DS.hasMany(App.User),
          owner: DS.belongsTo(App.User),
          posts: DS.hasMany(App.Post)
        });

    This computed property would return a map describing these
    relationships, like this:

        var relationships = Ember.get(App.Blog, 'relationships');
        relationships.get(App.User);
        //=> [ { name: 'users', kind: 'hasMany' },
        //     { name: 'owner', kind: 'belongsTo' } ]
        relationships.get(App.Post);
        //=> [ { name: 'posts', kind: 'hasMany' } ]

    @type Ember.Map
    @readOnly
  */
  relationships: Ember.computed(function() {
    var map = new Ember.MapWithDefault({
      defaultValue: function() { return []; }
    });

    // Loop through each computed property on the class
    this.eachComputedProperty(function(name, meta) {

      // If the computed property is a relationship, add
      // it to the map.
      if (meta.isRelationship) {
        if (typeof meta.type === 'string') {
          meta.type = Ember.get(Ember.lookup, meta.type);
        }

        var relationshipsForType = map.get(meta.type);

        relationshipsForType.push({ name: name, kind: meta.kind });
      }
    });

    return map;
  }),

  /**
    A hash containing lists of the model's relationships, grouped
    by the relationship kind. For example, given a model with this
    definition:

        App.Blog = DS.Model.extend({
          users: DS.hasMany(App.User),
          owner: DS.belongsTo(App.User),

          posts: DS.hasMany(App.Post)
        });

    This property would contain the following:

       var relationshipNames = Ember.get(App.Blog, 'relationshipNames');
       relationshipNames.hasMany;
       //=> ['users', 'posts']
       relationshipNames.belongsTo;
       //=> ['owner']

    @type Object
    @readOnly
  */
  relationshipNames: Ember.computed(function() {
    var names = { hasMany: [], belongsTo: [] };

    this.eachComputedProperty(function(name, meta) {
      if (meta.isRelationship) {
        names[meta.kind].push(name);
      }
    });

    return names;
  }),

  /**
    An array of types directly related to a model. Each type will be
    included once, regardless of the number of relationships it has with
    the model.

    For example, given a model with this definition:

        App.Blog = DS.Model.extend({
          users: DS.hasMany(App.User),
          owner: DS.belongsTo(App.User),
          posts: DS.hasMany(App.Post)
        });

    This property would contain the following:

       var relatedTypes = Ember.get(App.Blog, 'relatedTypes');
       //=> [ App.User, App.Post ]

    @type Ember.Array
    @readOnly
  */
  relatedTypes: Ember.computed(function() {
    var type,
        types = Ember.A([]);

    // Loop through each computed property on the class,
    // and create an array of the unique types involved
    // in relationships
    this.eachComputedProperty(function(name, meta) {
      if (meta.isRelationship) {
        type = meta.type;

        if (typeof type === 'string') {
          type = get(this, type, false) || get(Ember.lookup, type);
        }

        Ember.assert("You specified a hasMany (" + meta.type + ") on " + meta.parentType + " but " + meta.type + " was not found.",  type);

        if (!types.contains(type)) {
          Ember.assert("Trying to sideload " + name + " on " + this.toString() + " but the type doesn't exist.", !!type);
          types.push(type);
        }
      }
    });

    return types;
  }),

  /**
    A map whose keys are the relationships of a model and whose values are
    relationship descriptors.

    For example, given a model with this
    definition:

        App.Blog = DS.Model.extend({
          users: DS.hasMany(App.User),
          owner: DS.belongsTo(App.User),

          posts: DS.hasMany(App.Post)
        });

    This property would contain the following:

       var relationshipsByName = Ember.get(App.Blog, 'relationshipsByName');
       relationshipsByName.get('users');
       //=> { key: 'users', kind: 'hasMany', type: App.User }
       relationshipsByName.get('owner');
       //=> { key: 'owner', kind: 'belongsTo', type: App.User }

    @type Ember.Map
    @readOnly
  */
  relationshipsByName: Ember.computed(function() {
    var map = Ember.Map.create(), type;

    this.eachComputedProperty(function(name, meta) {
      if (meta.isRelationship) {
        meta.key = name;
        type = meta.type;

        if (typeof type === 'string') {
          type = get(this, type, false) || get(Ember.lookup, type);
          meta.type = type;
        }

        map.set(name, meta);
      }
    });

    return map;
  }),

  /**
    A map whose keys are the fields of the model and whose values are strings
    describing the kind of the field. A model's fields are the union of all of its
    attributes and relationships.

    For example:

        App.Blog = DS.Model.extend({
          users: DS.hasMany(App.User),
          owner: DS.belongsTo(App.User),

          posts: DS.hasMany(App.Post),

          title: DS.attr('string')
        });

        var fields = Ember.get(App.Blog, 'fields');
        fields.forEach(function(field, kind) {
          console.log(field, kind);
        });

        // prints:
        // users, hasMany
        // owner, belongsTo
        // posts, hasMany
        // title, attribute

    @type Ember.Map
    @readOnly
  */
  fields: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachComputedProperty(function(name, meta) {
      if (meta.isRelationship) {
        map.set(name, meta.kind);
      } else if (meta.isAttribute) {
        map.set(name, 'attribute');
      }
    });

    return map;
  }),

  /**
    Given a callback, iterates over each of the relationships in the model,
    invoking the callback with the name of each relationship and its relationship
    descriptor.

    @param {Function} callback the callback to invoke
    @param {any} binding the value to which the callback's `this` should be bound
  */
  eachRelationship: function(callback, binding) {
    get(this, 'relationshipsByName').forEach(function(name, relationship) {
      callback.call(binding, name, relationship);
    });
  },

  /**
    Given a callback, iterates over each of the types related to a model,
    invoking the callback with the related type's class. Each type will be
    returned just once, regardless of how many different relationships it has
    with a model.

    @param {Function} callback the callback to invoke
    @param {any} binding the value to which the callback's `this` should be bound
  */
  eachRelatedType: function(callback, binding) {
    get(this, 'relatedTypes').forEach(function(type) {
      callback.call(binding, type);
    });
  }
});

DS.Model.reopen({
  /**
    Given a callback, iterates over each of the relationships in the model,
    invoking the callback with the name of each relationship and its relationship
    descriptor.

    @param {Function} callback the callback to invoke
    @param {any} binding the value to which the callback's `this` should be bound
  */
  eachRelationship: function(callback, binding) {
    this.constructor.eachRelationship(callback, binding);
  }
});

var get = Ember.get, set = Ember.set;
var forEach = Ember.EnumerableUtils.forEach;

DS.RelationshipChange = function(options) {
  this.parentReference = options.parentReference;
  this.childReference = options.childReference;
  this.firstRecordReference = options.firstRecordReference;
  this.firstRecordKind = options.firstRecordKind;
  this.firstRecordName = options.firstRecordName;
  this.secondRecordReference = options.secondRecordReference;
  this.secondRecordKind = options.secondRecordKind;
  this.secondRecordName = options.secondRecordName;
  this.store = options.store;
  this.committed = {};
  this.changeType = options.changeType;
};

DS.RelationshipChangeAdd = function(options){
  DS.RelationshipChange.call(this, options);
};

DS.RelationshipChangeRemove = function(options){
  DS.RelationshipChange.call(this, options);
};

/** @private */
DS.RelationshipChange.create = function(options) {
  return new DS.RelationshipChange(options);
};

/** @private */
DS.RelationshipChangeAdd.create = function(options) {
  return new DS.RelationshipChangeAdd(options);
};

/** @private */
DS.RelationshipChangeRemove.create = function(options) {
  return new DS.RelationshipChangeRemove(options);
};

DS.OneToManyChange = {};
DS.OneToNoneChange = {};
DS.ManyToNoneChange = {};
DS.OneToOneChange = {};
DS.ManyToManyChange = {};

DS.RelationshipChange._createChange = function(options){
  if(options.changeType === "add"){
    return DS.RelationshipChangeAdd.create(options);
  }
  if(options.changeType === "remove"){
    return DS.RelationshipChangeRemove.create(options);
  }
};


DS.RelationshipChange.determineRelationshipType = function(recordType, knownSide){
  var knownKey = knownSide.key, key, otherKind;
  var knownKind = knownSide.kind;

  var inverse = recordType.inverseFor(knownKey);

  if (inverse){
    key = inverse.name;
    otherKind = inverse.kind;
  }

  if (!inverse){
    return knownKind === "belongsTo" ? "oneToNone" : "manyToNone";
  }
  else{
    if(otherKind === "belongsTo"){
      return knownKind === "belongsTo" ? "oneToOne" : "manyToOne";
    }
    else{
      return knownKind === "belongsTo" ? "oneToMany" : "manyToMany";
    }
  } 
 
};

DS.RelationshipChange.createChange = function(firstRecordReference, secondRecordReference, store, options){
  // Get the type of the child based on the child's client ID
  var firstRecordType = firstRecordReference.type, changeType;
  changeType = DS.RelationshipChange.determineRelationshipType(firstRecordType, options);
  if (changeType === "oneToMany"){
    return DS.OneToManyChange.createChange(firstRecordReference, secondRecordReference, store, options);
  }
  else if (changeType === "manyToOne"){
    return DS.OneToManyChange.createChange(secondRecordReference, firstRecordReference, store, options);
  }
  else if (changeType === "oneToNone"){
    return DS.OneToNoneChange.createChange(firstRecordReference, secondRecordReference, store, options);
  }
  else if (changeType === "manyToNone"){
    return DS.ManyToNoneChange.createChange(firstRecordReference, secondRecordReference, store, options);
  }
  else if (changeType === "oneToOne"){
    return DS.OneToOneChange.createChange(firstRecordReference, secondRecordReference, store, options);
  }
  else if (changeType === "manyToMany"){
    return DS.ManyToManyChange.createChange(firstRecordReference, secondRecordReference, store, options);
  }
};

/** @private */
DS.OneToNoneChange.createChange = function(childReference, parentReference, store, options) {
  var key = options.key;
  var change = DS.RelationshipChange._createChange({
      parentReference: parentReference,
      childReference: childReference,
      firstRecordReference: childReference,
      store: store,
      changeType: options.changeType,
      firstRecordName: key,
      firstRecordKind: "belongsTo"
  });

  store.addRelationshipChangeFor(childReference, key, parentReference, null, change);

  return change;
};

/** @private */
DS.ManyToNoneChange.createChange = function(childReference, parentReference, store, options) {
  var key = options.key;
  var change = DS.RelationshipChange._createChange({
      parentReference: childReference,
      childReference: parentReference,
      secondRecordReference: childReference,
      store: store,
      changeType: options.changeType,
      secondRecordName: options.key,
      secondRecordKind: "hasMany"
  });

  store.addRelationshipChangeFor(childReference, key, parentReference, null, change);
  return change;
};


/** @private */
DS.ManyToManyChange.createChange = function(childReference, parentReference, store, options) {
  // If the name of the belongsTo side of the relationship is specified,
  // use that
  // If the type of the parent is specified, look it up on the child's type
  // definition.
  var key = options.key;

  var change = DS.RelationshipChange._createChange({
      parentReference: parentReference,
      childReference: childReference,
      firstRecordReference: childReference,
      secondRecordReference: parentReference,
      firstRecordKind: "hasMany",
      secondRecordKind: "hasMany",
      store: store,
      changeType: options.changeType,
      firstRecordName:  key
  });

  store.addRelationshipChangeFor(childReference, key, parentReference, null, change);


  return change;
};

/** @private */
DS.OneToOneChange.createChange = function(childReference, parentReference, store, options) {
  var key;

  // If the name of the belongsTo side of the relationship is specified,
  // use that
  // If the type of the parent is specified, look it up on the child's type
  // definition.
  if (options.parentType) {
    key = options.parentType.inverseFor(options.key).name;
  } else if (options.key) {
    key = options.key;
  } else {
    Ember.assert("You must pass either a parentType or belongsToName option to OneToManyChange.forChildAndParent", false);
  }

  var change = DS.RelationshipChange._createChange({
      parentReference: parentReference,
      childReference: childReference,
      firstRecordReference: childReference,
      secondRecordReference: parentReference,
      firstRecordKind: "belongsTo",
      secondRecordKind: "belongsTo",
      store: store,
      changeType: options.changeType,
      firstRecordName:  key
  });

  store.addRelationshipChangeFor(childReference, key, parentReference, null, change);


  return change;
};

DS.OneToOneChange.maintainInvariant = function(options, store, childReference, key){
  if (options.changeType === "add" && store.recordIsMaterialized(childReference)) {
    var child = store.recordForReference(childReference);
    var oldParent = get(child, key);
    if (oldParent){
      var correspondingChange = DS.OneToOneChange.createChange(childReference, oldParent.get('_reference'), store, {
          parentType: options.parentType,
          hasManyName: options.hasManyName,
          changeType: "remove",
          key: options.key
        });
      store.addRelationshipChangeFor(childReference, key, options.parentReference , null, correspondingChange);
     correspondingChange.sync();
    }
  }
};

/** @private */
DS.OneToManyChange.createChange = function(childReference, parentReference, store, options) {
  var key;

  // If the name of the belongsTo side of the relationship is specified,
  // use that
  // If the type of the parent is specified, look it up on the child's type
  // definition.
  if (options.parentType) {
    key = options.parentType.inverseFor(options.key).name;
    DS.OneToManyChange.maintainInvariant( options, store, childReference, key );
  } else if (options.key) {
    key = options.key;
  } else {
    Ember.assert("You must pass either a parentType or belongsToName option to OneToManyChange.forChildAndParent", false);
  }

  var change = DS.RelationshipChange._createChange({
      parentReference: parentReference,
      childReference: childReference,
      firstRecordReference: childReference,
      secondRecordReference: parentReference,
      firstRecordKind: "belongsTo",
      secondRecordKind: "hasMany",
      store: store,
      changeType: options.changeType,
      firstRecordName:  key
  });

  store.addRelationshipChangeFor(childReference, key, parentReference, null, change);


  return change;
};


DS.OneToManyChange.maintainInvariant = function(options, store, childReference, key){
  if (options.changeType === "add" && store.recordIsMaterialized(childReference)) {
    var child = store.recordForReference(childReference);
    var oldParent = get(child, key);
    if (oldParent){
      var correspondingChange = DS.OneToManyChange.createChange(childReference, oldParent.get('_reference'), store, {
          parentType: options.parentType,
          hasManyName: options.hasManyName,
          changeType: "remove",
          key: options.key
        });
      store.addRelationshipChangeFor(childReference, key, options.parentReference , null, correspondingChange);
      correspondingChange.sync();
    }
  }
};

DS.OneToManyChange.ensureSameTransaction = function(changes, store){
  var records = Ember.A();
  forEach(changes, function(change){
    records.addObject(change.getSecondRecord());
    records.addObject(change.getFirstRecord());
  });
  var transaction = store.ensureSameTransaction(records);
  forEach(changes, function(change){
    change.transaction = transaction;
 });
};

DS.RelationshipChange.prototype = {

  getSecondRecordName: function() {
    var name = this.secondRecordName, parent;

    if (!name) {
      parent = this.secondRecordReference;
      if (!parent) { return; }

      var childType = this.firstRecordReference.type;
      var inverse = childType.inverseFor(this.firstRecordName);
      this.secondRecordName = inverse.name;
    }

    return this.secondRecordName;
  },

  /**
    Get the name of the relationship on the belongsTo side.

    @returns {String}
  */
  getFirstRecordName: function() {
    var name = this.firstRecordName;
    return name;
  },

  /** @private */
  destroy: function() {
    var childReference = this.childReference,
        belongsToName = this.getFirstRecordName(),
        hasManyName = this.getSecondRecordName(),
        store = this.store,
        transaction;

    store.removeRelationshipChangeFor(childReference, belongsToName, this.parentReference, hasManyName, this.changeType);

    if (transaction = this.transaction) {
      transaction.relationshipBecameClean(this);
    }
  },

  /** @private */
  getByReference: function(reference) {
    var store = this.store;

    // return null or undefined if the original reference was null or undefined
    if (!reference) { return reference; }

    if (store.recordIsMaterialized(reference)) {
      return store.recordForReference(reference);
    }
  },

  getSecondRecord: function(){
    return this.getByReference(this.secondRecordReference);
  },

  /** @private */
  getFirstRecord: function() {
    return this.getByReference(this.firstRecordReference);
  },

  /**
    @private

    Make sure that all three parts of the relationship change are part of
    the same transaction. If any of the three records is clean and in the
    default transaction, and the rest are in a different transaction, move
    them all into that transaction.
  */
  ensureSameTransaction: function() {
    var child = this.getFirstRecord(),
      parentRecord = this.getSecondRecord();

    var transaction = this.store.ensureSameTransaction([child, parentRecord]);

    this.transaction = transaction;
    return transaction;
  },

  callChangeEvents: function(){
    var child = this.getFirstRecord(),
        parentRecord = this.getSecondRecord();

    var dirtySet = new Ember.OrderedSet();

    // TODO: This implementation causes a race condition in key-value
    // stores. The fix involves buffering changes that happen while
    // a record is loading. A similar fix is required for other parts
    // of ember-data, and should be done as new infrastructure, not
    // a one-off hack. [tomhuda]
    if (parentRecord && get(parentRecord, 'isLoaded')) {
      this.store.recordHasManyDidChange(dirtySet, parentRecord, this);
    }

    if (child) {
      this.store.recordBelongsToDidChange(dirtySet, child, this);
    }

    dirtySet.forEach(function(record) {
      record.adapterDidDirty();
    });
  },

  coalesce: function(){
    var relationshipPairs = this.store.relationshipChangePairsFor(this.firstRecordReference);
    forEach(relationshipPairs, function(pair){
      var addedChange = pair["add"];
      var removedChange = pair["remove"];
      if(addedChange && removedChange) {
        addedChange.destroy();
        removedChange.destroy();
      }
    });
  }
};

DS.RelationshipChangeAdd.prototype = Ember.create(DS.RelationshipChange.create({}));
DS.RelationshipChangeRemove.prototype = Ember.create(DS.RelationshipChange.create({}));

DS.RelationshipChangeAdd.prototype.changeType = "add";
DS.RelationshipChangeAdd.prototype.sync = function() {
  var secondRecordName = this.getSecondRecordName(),
      firstRecordName = this.getFirstRecordName(),
      firstRecord = this.getFirstRecord(),
      secondRecord = this.getSecondRecord();

  //Ember.assert("You specified a hasMany (" + hasManyName + ") on " + (!belongsToName && (newParent || oldParent || this.lastParent).constructor) + " but did not specify an inverse belongsTo on " + child.constructor, belongsToName);
  //Ember.assert("You specified a belongsTo (" + belongsToName + ") on " + child.constructor + " but did not specify an inverse hasMany on " + (!hasManyName && (newParent || oldParent || this.lastParentRecord).constructor), hasManyName);

  var transaction = this.ensureSameTransaction();
  transaction.relationshipBecameDirty(this);

  this.callChangeEvents();

  if (secondRecord && firstRecord) {
    if(this.secondRecordKind === "belongsTo"){
      secondRecord.suspendRelationshipObservers(function(){
        set(secondRecord, secondRecordName, firstRecord);
      });

     }
     else if(this.secondRecordKind === "hasMany"){
      secondRecord.suspendRelationshipObservers(function(){
        get(secondRecord, secondRecordName).addObject(firstRecord);
      });
    }
  }

  if (firstRecord && secondRecord && get(firstRecord, firstRecordName) !== secondRecord) {
    if(this.firstRecordKind === "belongsTo"){
      firstRecord.suspendRelationshipObservers(function(){
        set(firstRecord, firstRecordName, secondRecord);
      });
    }
    else if(this.firstdRecordKind === "hasMany"){
      firstRecord.suspendRelationshipObservers(function(){
        get(firstRecord, firstRecordName).addObject(secondRecord);
      });
    }
  }

  this.coalesce();
};

DS.RelationshipChangeRemove.prototype.changeType = "remove";
DS.RelationshipChangeRemove.prototype.sync = function() {
  var secondRecordName = this.getSecondRecordName(),
      firstRecordName = this.getFirstRecordName(),
      firstRecord = this.getFirstRecord(),
      secondRecord = this.getSecondRecord();

  //Ember.assert("You specified a hasMany (" + hasManyName + ") on " + (!belongsToName && (newParent || oldParent || this.lastParent).constructor) + " but did not specify an inverse belongsTo on " + child.constructor, belongsToName);
  //Ember.assert("You specified a belongsTo (" + belongsToName + ") on " + child.constructor + " but did not specify an inverse hasMany on " + (!hasManyName && (newParent || oldParent || this.lastParentRecord).constructor), hasManyName);

  var transaction = this.ensureSameTransaction(firstRecord, secondRecord, secondRecordName, firstRecordName);
  transaction.relationshipBecameDirty(this);

  this.callChangeEvents();

  if (secondRecord && firstRecord) {
    if(this.secondRecordKind === "belongsTo"){
      secondRecord.suspendRelationshipObservers(function(){
        set(secondRecord, secondRecordName, null);
      });
     }
     else if(this.secondRecordKind === "hasMany"){
       secondRecord.suspendRelationshipObservers(function(){
        get(secondRecord, secondRecordName).removeObject(firstRecord);
      });
    }
  }

  if (firstRecord && get(firstRecord, firstRecordName)) {
    if(this.firstRecordKind === "belongsTo"){
      firstRecord.suspendRelationshipObservers(function(){
        set(firstRecord, firstRecordName, null);
      });
     }
     else if(this.firstdRecordKind === "hasMany"){
       firstRecord.suspendRelationshipObservers(function(){
        get(firstRecord, firstRecordName).removeObject(secondRecord);
      });
    }
  }

  this.coalesce();
};


var set = Ember.set;

/**
  This code registers an injection for Ember.Application.

  If an Ember.js developer defines a subclass of DS.Store on their application,
  this code will automatically instantiate it and make it available on the
  router.

  Additionally, after an application's controllers have been injected, they will
  each have the store made available to them.

  For example, imagine an Ember.js application with the following classes:

  App.Store = DS.Store.extend({
    adapter: 'App.MyCustomAdapter'
  });

  App.PostsController = Ember.ArrayController.extend({
    // ...
  });

  When the application is initialized, `App.Store` will automatically be
  instantiated, and the instance of `App.PostsController` will have its `store`
  property set to that instance.

  Note that this code will only be run if the `ember-application` package is
  loaded. If Ember Data is being used in an environment other than a
  typical application (e.g., node.js where only `ember-runtime` is available),
  this code will be ignored.
*/

Ember.onLoad('Ember.Application', function(Application) {
  if (Application.registerInjection) {
    Application.registerInjection({
      name: "store",
      before: "controllers",

      // If a store subclass is defined, like App.Store,
      // instantiate it and inject it into the router.
      injection: function(app, stateManager, property) {
        if (!stateManager) { return; }
        if (property === 'Store') {
          set(stateManager, 'store', app[property].create());
        }
      }
    });

    Application.registerInjection({
      name: "giveStoreToControllers",
      after: ['store','controllers'],

      // For each controller, set its `store` property
      // to the DS.Store instance we created above.
      injection: function(app, stateManager, property) {
        if (!stateManager) { return; }
        if (/^[A-Z].*Controller$/.test(property)) {
          var controllerName = property.charAt(0).toLowerCase() + property.substr(1);
          var store = stateManager.get('store');
          var controller = stateManager.get(controllerName);
          if(!controller) { return; }

          controller.set('store', store);
        }
      }
    });
  } else if (Application.initializer) {
    Application.initializer({
      name: "store",

      initialize: function(container, application) {
        application.register('store:main', application.Store);

        // Eagerly generate the store so defaultStore is populated.
        // TODO: Do this in a finisher hook
        container.lookup('store:main');
      }
    });

    Application.initializer({
      name: "injectStore",

      initialize: function(container, application) {
        application.inject('controller', 'store', 'store:main');
        application.inject('route', 'store', 'store:main');
      }
    });
  }
});

var get = Ember.get, set = Ember.set, map = Ember.ArrayPolyfills.map, isNone = Ember.isNone;

function mustImplement(name) {
  return function() {
    throw new Ember.Error("Your serializer " + this.toString() + " does not implement the required method " + name);
  };
}

/**
  A serializer is responsible for serializing and deserializing a group of
  records.

  `DS.Serializer` is an abstract base class designed to help you build a
  serializer that can read to and write from any serialized form.  While most
  applications will use `DS.JSONSerializer`, which reads and writes JSON, the
  serializer architecture allows your adapter to transmit things like XML,
  strings, or custom binary data.

  Typically, your application's `DS.Adapter` is responsible for both creating a
  serializer as well as calling the appropriate methods when it needs to
  materialize data or serialize a record.

  The serializer API is designed as a series of layered hooks that you can
  override to customize any of the individual steps of serialization and
  deserialization.

  The hooks are organized by the three responsibilities of the serializer:

  1. Determining naming conventions
  2. Serializing records into a serialized form
  3. Deserializing records from a serialized form

  Because Ember Data lazily materializes records, the deserialization
  step, and therefore the hooks you implement, are split into two phases:

  1. Extraction, where the serialized forms for multiple records are
     extracted from a single payload. The IDs of each record are also
     extracted for indexing.
  2. Materialization, where a newly-created record has its attributes
     and relationships initialized based on the serialized form loaded
     by the adapter.

  Additionally, a serializer can convert values from their JavaScript
  versions into their serialized versions via a declarative API.

  ## Naming Conventions

  One of the most common uses of the serializer is to map attribute names
  from the serialized form to your `DS.Model`. For example, in your model,
  you may have an attribute called `firstName`:

  ```javascript
  App.Person = DS.Model.extend({
    firstName: DS.attr('string')
  });
  ```

  However, because the web API your adapter is communicating with is
  legacy, it calls this attribute `FIRST_NAME`.

  You can determine the attribute name used in the serialized form
  by implementing `keyForAttributeName`:

  ```javascript
  keyForAttributeName: function(type, name) {
    return name.underscore.toUpperCase();
  }
  ```

  If your attribute names are not predictable, you can re-map them
  one-by-one using the adapter's `map` API:

  ```javascript
  App.Adapter.map('App.Person', {
    firstName: { key: '*API_USER_FIRST_NAME*' }
  });
  ```

  This API will also work for relationships and primary keys. For
  example:

  ```javascript
  App.Adapter.map('App.Person', {
    primaryKey: '_id'
  });
  ```

  ## Serialization

  During the serialization process, a record or records are converted
  from Ember.js objects into their serialized form.

  These methods are designed in layers, like a delicious 7-layer
  cake (but with fewer layers).

  The main entry point for serialization is the `serialize`
  method, which takes the record and options.

  The `serialize` method is responsible for:

  * turning the record's attributes (`DS.attr`) into
    attributes on the JSON object.
  * optionally adding the record's ID onto the hash
  * adding relationships (`DS.hasMany` and `DS.belongsTo`)
    to the JSON object.

  Depending on the backend, the serializer can choose
  whether to include the `hasMany` or `belongsTo`
  relationships on the JSON hash.

  For very custom serialization, you can implement your
  own `serialize` method. In general, however, you will want
  to override the hooks described below.

  ### Adding the ID

  The default `serialize` will optionally call your serializer's
  `addId` method with the JSON hash it is creating, the
  record's type, and the record's ID. The `serialize` method
  will not call `addId` if the record's ID is undefined.

  Your adapter must specifically request ID inclusion by
  passing `{ includeId: true }` as an option to `serialize`.

  NOTE: You may not want to include the ID when updating an
  existing record, because your server will likely disallow
  changing an ID after it is created, and the PUT request
  itself will include the record's identification.

  By default, `addId` will:

  1. Get the primary key name for the record by calling
     the serializer's `primaryKey` with the record's type.
     Unless you override the `primaryKey` method, this
     will be `'id'`.
  2. Assign the record's ID to the primary key in the
     JSON hash being built.

  If your backend expects a JSON object with the primary
  key at the root, you can just override the `primaryKey`
  method on your serializer subclass.

  Otherwise, you can override the `addId` method for
  more specialized handling.

  ### Adding Attributes

  By default, the serializer's `serialize` method will call
  `addAttributes` with the JSON object it is creating
  and the record to serialize.

  The `addAttributes` method will then call `addAttribute`
  in turn, with the JSON object, the record to serialize,
  the attribute's name and its type.

  Finally, the `addAttribute` method will serialize the
  attribute:

  1. It will call `keyForAttributeName` to determine
     the key to use in the JSON hash.
  2. It will get the value from the record.
  3. It will call `serializeValue` with the attribute's
     value and attribute type to convert it into a
     JSON-compatible value. For example, it will convert a
     Date into a String.

  If your backend expects a JSON object with attributes as
  keys at the root, you can just override the `serializeValue`
  and `keyForAttributeName` methods in your serializer
  subclass and let the base class do the heavy lifting.

  If you need something more specialized, you can probably
  override `addAttribute` and let the default `addAttributes`
  handle the nitty gritty.

  ### Adding Relationships

  By default, `serialize` will call your serializer's
  `addRelationships` method with the JSON object that is
  being built and the record being serialized. The default
  implementation of this method is to loop over all of the
  relationships defined on your record type and:

  * If the relationship is a `DS.hasMany` relationship,
    call `addHasMany` with the JSON object, the record
    and a description of the relationship.
  * If the relationship is a `DS.belongsTo` relationship,
    call `addBelongsTo` with the JSON object, the record
    and a description of the relationship.

  The relationship description has the following keys:

  * `type`: the class of the associated information (the
    first parameter to `DS.hasMany` or `DS.belongsTo`)
  * `kind`: either `hasMany` or `belongsTo`

  The relationship description may get additional
  information in the future if more capabilities or
  relationship types are added. However, it will
  remain backwards-compatible, so the mere existence
  of new features should not break existing adapters.

  @module data
  @submodule data-serializer
  @main data-serializer

  @class Serializer
  @namespace DS
  @extends Ember.Object
  @constructor
*/

DS.Serializer = Ember.Object.extend({
  init: function() {
    this.mappings = Ember.Map.create();
    this.aliases = Ember.Map.create();
    this.configurations = Ember.Map.create();
    this.globalConfigurations = {};
  },

  extract: mustImplement('extract'),
  extractMany: mustImplement('extractMany'),
  extractId: mustImplement('extractId'),
  extractAttribute: mustImplement('extractAttribute'),
  extractHasMany: mustImplement('extractHasMany'),
  extractBelongsTo: mustImplement('extractBelongsTo'),

  extractRecordRepresentation: function(loader, type, json, shouldSideload) {
    var prematerialized = {}, reference;

    if (shouldSideload) {
      reference = loader.sideload(type, json);
    } else {
      reference = loader.load(type, json);
    }

    this.eachEmbeddedHasMany(type, function(name, relationship) {
      var embeddedData = json[this.keyFor(relationship)];
      if (!isNone(embeddedData)) {
        this.extractEmbeddedHasMany(loader, relationship, embeddedData, reference, prematerialized);
      }
    }, this);

    this.eachEmbeddedBelongsTo(type, function(name, relationship) {
      var embeddedData = json[this.keyFor(relationship)];
      if (!isNone(embeddedData)) {
        this.extractEmbeddedBelongsTo(loader, relationship, embeddedData, reference, prematerialized);
      }
    }, this);

    loader.prematerialize(reference, prematerialized);

    return reference;
  },

  extractEmbeddedHasMany: function(loader, relationship, array, parent, prematerialized) {
    var references = map.call(array, function(item) {
      if (!item) { return; }

      var foundType = this.extractEmbeddedType(relationship, item),
          reference = this.extractRecordRepresentation(loader, foundType, item, true);

      // If the embedded record should also be saved back when serializing the parent,
      // make sure we set its parent since it will not have an ID.
      var embeddedType = this.embeddedType(parent.type, relationship.key);
      if (embeddedType === 'always') {
        reference.parent = parent;
      }

      return reference;
    }, this);

    prematerialized[relationship.key] = references;
  },

  extractEmbeddedBelongsTo: function(loader, relationship, data, parent, prematerialized) {
    var foundType = this.extractEmbeddedType(relationship, data),
        reference = this.extractRecordRepresentation(loader, foundType, data, true);
    prematerialized[relationship.key] = reference;

    // If the embedded record should also be saved back when serializing the parent,
    // make sure we set its parent since it will not have an ID.
    var embeddedType = this.embeddedType(parent.type, relationship.key);
    if (embeddedType === 'always') {
      reference.parent = parent;
    }
  },

  /**
    A hook you can use to customize how the record's type is extracted from
    the serialized data.

    The `extractEmbeddedType` hook is called with:

    * the serialized representation being built
    * the serialized id (after calling the `serializeId` hook)

    By default, it returns the type of the relationship.

    @method extractEmbeddedType
    @param {Object} relationship an object representing the relationship
    @param {any} data the serialized representation that is being built
  */
  extractEmbeddedType: function(relationship, data) {
    return relationship.type;
  },

  //.......................
  //. SERIALIZATION HOOKS
  //.......................

  /**
    The main entry point for serializing a record. While you can consider this
    a hook that can be overridden in your serializer, you will have to manually
    handle serialization. For most cases, there are more granular hooks that you
    can override.

    If overriding this method, these are the responsibilities that you will need
    to implement yourself:

    * If the option hash contains `includeId`, add the record's ID to the serialized form.
      By default, `serialize` calls `addId` if appropriate.
    * If the option hash contains `includeType`, add the record's type to the serialized form.
    * Add the record's attributes to the serialized form. By default, `serialize` calls
      `addAttributes`.
    * Add the record's relationships to the serialized form. By default, `serialize` calls
      `addRelationships`.

    @method serialize
    @param {DS.Model} record the record to serialize
    @param {Object} [options] a hash of options
    @returns {any} the serialized form of the record
  */
  serialize: function(record, options) {
    options = options || {};

    var serialized = this.createSerializedForm(), id;

    if (options.includeId) {
      if (id = get(record, 'id')) {
        this._addId(serialized, record.constructor, id);
      }
    }

    if (options.includeType) {
      this.addType(serialized, record.constructor);
    }

    this.addAttributes(serialized, record);
    this.addRelationships(serialized, record);

    return serialized;
  },

  /**
    @private

    Given an attribute type and value, convert the value into the
    serialized form using the transform registered for that type.

    @method serializeValue
    @param {any} value the value to convert to the serialized form
    @param {String} attributeType the registered type (e.g. `string`
      or `boolean`)
    @returns {any} the serialized form of the value
  */
  serializeValue: function(value, attributeType) {
    var transform = this.transforms ? this.transforms[attributeType] : null;

    Ember.assert("You tried to use an attribute type (" + attributeType + ") that has not been registered", transform);
    return transform.serialize(value);
  },

  /**
    A hook you can use to normalize IDs before adding them to the
    serialized representation.

    Because the store coerces all IDs to strings for consistency,
    this is the opportunity for the serializer to, for example,
    convert numerical IDs back into number form.

    @param {String} id the id from the record
    @returns {any} the serialized representation of the id
  */
  serializeId: function(id) {
    if (isNaN(id)) { return id; }
    return +id;
  },

  /**
    A hook you can use to change how attributes are added to the serialized
    representation of a record.

    By default, `addAttributes` simply loops over all of the attributes of the
    passed record, maps the attribute name to the key for the serialized form,
    and invokes any registered transforms on the value. It then invokes the
    more granular `addAttribute` with the key and transformed value.

    Since you can override `keyForAttributeName`, `addAttribute`, and register
    custom transforms, you should rarely need to override this hook.

    @method addAttributes
    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
  */
  addAttributes: function(data, record) {
    record.eachAttribute(function(name, attribute) {
      this._addAttribute(data, record, name, attribute.type);
    }, this);
  },

  /**
    A hook you can use to customize how the key/value pair is added to
    the serialized data.

    @method addAttribute
    @param {any} serialized the serialized form being built
    @param {String} key the key to add to the serialized data
    @param {any} value the value to add to the serialized data
  */
  addAttribute: mustImplement('addAttribute'),

  /**
    A hook you can use to customize how the record's id is added to
    the serialized data.

    The `addId` hook is called with:

    * the serialized representation being built
    * the resolved primary key (taking configurations and the
      `primaryKey` hook into consideration)
    * the serialized id (after calling the `serializeId` hook)

    @method addId
    @param {any} data the serialized representation that is being built
    @param {String} key the resolved primary key
    @param {id} id the serialized id
  */
  addId: mustImplement('addId'),

  /**
    A hook you can use to customize how the record's type is added to
    the serialized data.

    The `addType` hook is called with:

    * the serialized representation being built
    * the serialized id (after calling the `serializeId` hook)

    @method addType
    @param {any} data the serialized representation that is being built
    @param {DS.Model subclass} type the type of the record
  */
  addType: Ember.K,

  /**
    Creates an empty hash that will be filled in by the hooks called from the
    `serialize()` method.

    @method createSerializedForm
    @return {Object}
  */
  createSerializedForm: function() {
    return {};
  },

  /**
    A hook you can use to change how relationships are added to the serialized
    representation of a record.

    By default, `addRelationships` loops over all of the relationships of the
    passed record, maps the relationship names to the key for the serialized form,
    and then invokes the public `addBelongsTo` and `addHasMany` hooks.

    Since you can override `keyForBelongsTo`, `keyForHasMany`, `addBelongsTo`,
    `addHasMany`, and register mappings, you should rarely need to override this
    hook.

    @method addRelationships
    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
  */
  addRelationships: function(data, record) {
    record.eachRelationship(function(name, relationship) {
      if (relationship.kind === 'belongsTo') {
        this._addBelongsTo(data, record, name, relationship);
      } else if (relationship.kind === 'hasMany') {
        this._addHasMany(data, record, name, relationship);
      }
    }, this);
  },

  /**
    A hook you can use to add a `belongsTo` relationship to the
    serialized representation.

    The specifics of this hook are very adapter-specific, so there
    is no default implementation. You can see `DS.JSONSerializer`
    for an example of an implementation of the `addBelongsTo` hook.

    The `belongsTo` relationship object has the following properties:

    * **type** a subclass of DS.Model that is the type of the
      relationship. This is the first parameter to DS.belongsTo
    * **options** the options passed to the call to DS.belongsTo
    * **kind** always `belongsTo`

    Additional properties may be added in the future.

    @method addBelongsTo
    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
    @param {String} key the key for the serialized object
    @param {Object} relationship an object representing the relationship
  */
  addBelongsTo: mustImplement('addBelongsTo'),

  /**
    A hook you can use to add a `hasMany` relationship to the
    serialized representation.

    The specifics of this hook are very adapter-specific, so there
    is no default implementation. You may not need to implement this,
    for example, if your backend only expects relationships on the
    child of a one to many relationship.

    The `hasMany` relationship object has the following properties:

    * **type** a subclass of DS.Model that is the type of the
      relationship. This is the first parameter to DS.hasMany
    * **options** the options passed to the call to DS.hasMany
    * **kind** always `hasMany`

    Additional properties may be added in the future.

    @method addHasMany
    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
    @param {String} key the key for the serialized object
    @param {Object} relationship an object representing the relationship
  */
  addHasMany: mustImplement('addHasMany'),

  /**
    NAMING CONVENTIONS

    The most commonly overridden APIs of the serializer are
    the naming convention methods:

    * `keyForAttributeName`: converts a camelized attribute name
      into a key in the adapter-provided data hash. For example,
      if the model's attribute name was `firstName`, and the
      server used underscored names, you would return `first_name`.
    * `primaryKey`: returns the key that should be used to
      extract the id from the adapter-provided data hash. It is
      also used when serializing a record.
  */

  /**
    A hook you can use in your serializer subclass to customize
    how an unmapped attribute name is converted into a key.

    By default, this method returns the `name` parameter.

    For example, if the attribute names in your JSON are underscored,
    you will want to convert them into JavaScript conventional
    camelcase:

    ```javascript
    App.MySerializer = DS.Serializer.extend({
      // ...

      keyForAttributeName: function(type, name) {
        return name.camelize();
      }
    });
    ```

    @method keyForAttributeName
    @param {DS.Model subclass} type the type of the record with
      the attribute name `name`
    @param {String} name the attribute name to convert into a key

    @returns {String} the key
  */
  keyForAttributeName: function(type, name) {
    return name;
  },

  /**
    A hook you can use in your serializer to specify a conventional
    primary key.

    By default, this method will return the string `id`.

    In general, you should not override this hook to specify a special
    primary key for an individual type; use `configure` instead.

    For example, if your primary key is always `__id__`:

    ```javascript
    App.MySerializer = DS.Serializer.extend({
      // ...
      primaryKey: function(type) {
        return '__id__';
      }
    });
    ```

    In another example, if the primary key always includes the
    underscored version of the type before the string `id`:

    ```javascript
    App.MySerializer = DS.Serializer.extend({
      // ...
      primaryKey: function(type) {
        // If the type is `BlogPost`, this will return
        // `blog_post_id`.
        var typeString = type.toString().split(".")[1].underscore();
        return typeString + "_id";
      }
    });
    ```

    @method primaryKey
    @param {DS.Model subclass} type
    @returns {String} the primary key for the type
  */
  primaryKey: function(type) {
    return "id";
  },

  /**
    A hook you can use in your serializer subclass to customize
    how an unmapped `belongsTo` relationship is converted into
    a key.

    By default, this method calls `keyForAttributeName`, so if
    your naming convention is uniform across attributes and
    relationships, you can use the default here and override
    just `keyForAttributeName` as needed.

    For example, if the `belongsTo` names in your JSON always
    begin with `BT_` (e.g. `BT_posts`), you can strip out the
    `BT_` prefix:"

    ```javascript
    App.MySerializer = DS.Serializer.extend({
      // ...
      keyForBelongsTo: function(type, name) {
        return name.match(/^BT_(.*)$/)[1].camelize();
      }
    });
    ```

    @method keyForBelongsTo
    @param {DS.Model subclass} type the type of the record with
      the `belongsTo` relationship.
    @param {String} name the relationship name to convert into a key

    @returns {String} the key
  */
  keyForBelongsTo: function(type, name) {
    return this.keyForAttributeName(type, name);
  },

  /**
    A hook you can use in your serializer subclass to customize
    how an unmapped `hasMany` relationship is converted into
    a key.

    By default, this method calls `keyForAttributeName`, so if
    your naming convention is uniform across attributes and
    relationships, you can use the default here and override
    just `keyForAttributeName` as needed.

    For example, if the `hasMany` names in your JSON always
    begin with the "table name" for the current type (e.g.
    `post_comments`), you can strip out the prefix:"

    ```javascript
    App.MySerializer = DS.Serializer.extend({
      // ...
      keyForHasMany: function(type, name) {
        // if your App.BlogPost has many App.BlogComment, the key from
        // the server would look like: `blog_post_blog_comments`
        //
        // 1. Convert the type into a string and underscore the
        //    second part (App.BlogPost -> blog_post)
        // 2. Extract the part after `blog_post_` (`blog_comments`)
        // 3. Underscore it, to become `blogComments`
        var typeString = type.toString().split(".")[1].underscore();
        return name.match(new RegExp("^" + typeString + "_(.*)$"))[1].camelize();
      }
    });
    ```

    @method keyForHasMany
    @param {DS.Model subclass} type the type of the record with
      the `belongsTo` relationship.
    @param {String} name the relationship name to convert into a key

    @returns {String} the key
  */
  keyForHasMany: function(type, name) {
    return this.keyForAttributeName(type, name);
  },

  //.........................
  //. MATERIALIZATION HOOKS
  //.........................

  materialize: function(record, serialized, prematerialized) {
    var id;
    if (Ember.isNone(get(record, 'id'))) {
      if (prematerialized && prematerialized.hasOwnProperty('id')) {
        id = prematerialized.id;
      } else {
        id = this.extractId(record.constructor, serialized);
      }
      record.materializeId(id);
    }

    this.materializeAttributes(record, serialized, prematerialized);
    this.materializeRelationships(record, serialized, prematerialized);
  },

  deserializeValue: function(value, attributeType) {
    var transform = this.transforms ? this.transforms[attributeType] : null;

    Ember.assert("You tried to use a attribute type (" + attributeType + ") that has not been registered", transform);
    return transform.deserialize(value);
  },

  materializeAttributes: function(record, serialized, prematerialized) {
    record.eachAttribute(function(name, attribute) {
      if (prematerialized && prematerialized.hasOwnProperty(name)) {
        record.materializeAttribute(name, prematerialized[name]);
      } else {
        this.materializeAttribute(record, serialized, name, attribute.type);
      }
    }, this);
  },

  materializeAttribute: function(record, serialized, attributeName, attributeType) {
    var value = this.extractAttribute(record.constructor, serialized, attributeName);
    value = this.deserializeValue(value, attributeType);

    record.materializeAttribute(attributeName, value);
  },

  materializeRelationships: function(record, hash, prematerialized) {
    record.eachRelationship(function(name, relationship) {
      if (relationship.kind === 'hasMany') {
        if (prematerialized && prematerialized.hasOwnProperty(name)) {
          var tuplesOrReferencesOrOpaque = this._convertPrematerializedHasMany(relationship.type, prematerialized[name]);
          record.materializeHasMany(name, tuplesOrReferencesOrOpaque);
        } else {
          this.materializeHasMany(name, record, hash, relationship, prematerialized);
        }
      } else if (relationship.kind === 'belongsTo') {
        if (prematerialized && prematerialized.hasOwnProperty(name)) {
          var tupleOrReference = this._convertTuple(relationship.type, prematerialized[name]);
          record.materializeBelongsTo(name, tupleOrReference);
        } else {
          this.materializeBelongsTo(name, record, hash, relationship, prematerialized);
        }
      }
    }, this);
  },

  materializeHasMany: function(name, record, hash, relationship) {
    var type = record.constructor,
        key = this._keyForHasMany(type, relationship.key),
        idsOrTuples = this.extractHasMany(type, hash, key),
        tuples = idsOrTuples;

    if(idsOrTuples && Ember.isArray(idsOrTuples)) {
      tuples = this._convertTuples(relationship.type, idsOrTuples);
    }

    record.materializeHasMany(name, tuples);
  },

  materializeBelongsTo: function(name, record, hash, relationship) {
    var type = record.constructor,
        key = this._keyForBelongsTo(type, relationship.key),
        idOrTuple,
        tuple = null;

    if(relationship.options && relationship.options.polymorphic) {
      idOrTuple = this.extractBelongsToPolymorphic(type, hash, key);
    } else {
      idOrTuple = this.extractBelongsTo(type, hash, key);
    }

    if(!isNone(idOrTuple)) {
      tuple = this._convertTuple(relationship.type, idOrTuple);
    }

    record.materializeBelongsTo(name, tuple);
  },

  _extractEmbeddedRelationship: function(type, hash, name, relationshipType) {
    var key = this['_keyFor' + relationshipType](type, name);

    if (this.embeddedType(type, name)) {
      return this['extractEmbedded' + relationshipType](type, hash, key);
    }
  },

  _extractEmbeddedBelongsTo: function(type, hash, name) {
    return this._extractEmbeddedRelationship(type, hash, name, 'BelongsTo');
  },

  _extractEmbeddedHasMany: function(type, hash, name) {
    return this._extractEmbeddedRelationship(type, hash, name, 'HasMany');
  },

  _convertPrematerializedHasMany: function(type, prematerializedHasMany) {
    var tuplesOrReferencesOrOpaque;
    if( typeof prematerializedHasMany === 'string' ) {
      tuplesOrReferencesOrOpaque = prematerializedHasMany;
    } else {
      tuplesOrReferencesOrOpaque = this._convertTuples(type, prematerializedHasMany);
    }
    return tuplesOrReferencesOrOpaque;
  },

  _convertTuples: function(type, idsOrTuples) {
    return map.call(idsOrTuples, function(idOrTuple) {
      return this._convertTuple(type, idOrTuple);
    }, this);
  },

  _convertTuple: function(type, idOrTuple) {
    var foundType;

    if (typeof idOrTuple === 'object') {
      if (DS.Model.detect(idOrTuple.type)) {
        return idOrTuple;
      } else {
        foundType = this.typeFromAlias(idOrTuple.type);
        Ember.assert("Unable to resolve type " + idOrTuple.type + ".  You may need to configure your serializer aliases.", !!foundType);

        return {id: idOrTuple.id, type: foundType};
      }
    }
    return {id: idOrTuple, type: type};
  },

  /**
    @private

    This method is called to get the primary key for a given
    type.

    If a primary key configuration exists for this type, this
    method will return the configured value. Otherwise, it will
    call the public `primaryKey` hook.

    @method _primaryKey
    @param {DS.Model subclass} type
    @returns {String} the primary key for the type
  */
  _primaryKey: function(type) {
    var config = this.configurationForType(type),
        primaryKey = config && config.primaryKey;

    if (primaryKey) {
      return primaryKey;
    } else {
      return this.primaryKey(type);
    }
  },

  /**
    @private

    This method looks up the key for the attribute name and transforms the
    attribute's value using registered transforms.

    Specifically:

    1. Look up the key for the attribute name. If available, this will use
       any registered mappings. Otherwise, it will invoke the public
       `keyForAttributeName` hook.
    2. Get the value from the record using the `attributeName`.
    3. Transform the value using registered transforms for the `attributeType`.
    4. Invoke the public `addAttribute` hook with the hash, key, and
       transformed value.

    @method _addAttribute
    @param {any} data the serialized representation being built
    @param {DS.Model} record the record to serialize
    @param {String} attributeName the name of the attribute on the record
    @param {String} attributeType the type of the attribute (e.g. `string`
      or `boolean`)
  */
  _addAttribute: function(data, record, attributeName, attributeType) {
    var key = this._keyForAttributeName(record.constructor, attributeName);
    var value = get(record, attributeName);

    this.addAttribute(data, key, this.serializeValue(value, attributeType));
  },

  /**
    @private

    This method looks up the primary key for the `type` and invokes
    `serializeId` on the `id`.

    It then invokes the public `addId` hook with the primary key and
    the serialized id.

    @method _addId
    @param {any} data the serialized representation that is being built
    @param {Ember.Model subclass} type
    @param {any} id the materialized id from the record
  */
  _addId: function(hash, type, id) {
    var primaryKey = this._primaryKey(type);

    this.addId(hash, primaryKey, this.serializeId(id));
  },

  /**
    @private

    This method is called to get a key used in the data from
    an attribute name. It first checks for any mappings before
    calling the public hook `keyForAttributeName`.

    @method _keyForAttributeName
    @param {DS.Model subclass} type the type of the record with
      the attribute name `name`
    @param {String} name the attribute name to convert into a key

    @returns {String} the key
  */
  _keyForAttributeName: function(type, name) {
    return this._keyFromMappingOrHook('keyForAttributeName', type, name);
  },

  /**
    @private

    This method is called to get a key used in the data from
    a belongsTo relationship. It first checks for any mappings before
    calling the public hook `keyForBelongsTo`.

    @method _keyForBelongsTo
    @param {DS.Model subclass} type the type of the record with
      the `belongsTo` relationship.
    @param {String} name the relationship name to convert into a key

    @returns {String} the key
  */
  _keyForBelongsTo: function(type, name) {
    return this._keyFromMappingOrHook('keyForBelongsTo', type, name);
  },

  keyFor: function(description) {
    var type = description.parentType,
        name = description.key;

    switch (description.kind) {
      case 'belongsTo':
        return this._keyForBelongsTo(type, name);
      case 'hasMany':
        return this._keyForHasMany(type, name);
    }
  },

  /**
    @private

    This method is called to get a key used in the data from
    a hasMany relationship. It first checks for any mappings before
    calling the public hook `keyForHasMany`.

    @method _keyForHasMany
    @param {DS.Model subclass} type the type of the record with
      the `hasMany` relationship.
    @param {String} name the relationship name to convert into a key

    @returns {String} the key
  */
  _keyForHasMany: function(type, name) {
    return this._keyFromMappingOrHook('keyForHasMany', type, name);
  },
  /**
    @private

    This method converts the relationship name to a key for serialization,
    and then invokes the public `addBelongsTo` hook.

    @method _addBelongsTo
    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
    @param {String} name the relationship name
    @param {Object} relationship an object representing the relationship
  */
  _addBelongsTo: function(data, record, name, relationship) {
    var key = this._keyForBelongsTo(record.constructor, name);
    this.addBelongsTo(data, record, key, relationship);
  },

  /**
    @private

    This method converts the relationship name to a key for serialization,
    and then invokes the public `addHasMany` hook.

    @method _addHasMany
    @param {any} data the serialized representation that is being built
    @param {DS.Model} record the record to serialize
    @param {String} name the relationship name
    @param {Object} relationship an object representing the relationship
  */
  _addHasMany: function(data, record, name, relationship) {
    var key = this._keyForHasMany(record.constructor, name);
    this.addHasMany(data, record, key, relationship);
  },

  /**
    @private

    An internal method that handles checking whether a mapping
    exists for a particular attribute or relationship name before
    calling the public hooks.

    If a mapping is found, and the mapping has a key defined,
    use that instead of invoking the hook.

    @method _keyFromMappingOrHook
    @param {String} publicMethod the public hook to invoke if
      a mapping is not found (e.g. `keyForAttributeName`)
    @param {DS.Model subclass} type the type of the record with
      the attribute or relationship name.
    @param {String} name the attribute or relationship name to
      convert into a key
  */
  _keyFromMappingOrHook: function(publicMethod, type, name) {
    var key = this.mappingOption(type, name, 'key');

    if (key) {
      return key;
    } else {
      return this[publicMethod](type, name);
    }
  },

  /**
    TRANSFORMS
  */

  registerTransform: function(type, transform) {
    this.transforms[type] = transform;
  },

  registerEnumTransform: function(type, objects) {
    var transform = {
      deserialize: function(serialized) {
        return Ember.A(objects).objectAt(serialized);
      },
      serialize: function(deserialized) {
        return Ember.EnumerableUtils.indexOf(objects, deserialized);
      },
      values: objects
    };
    this.registerTransform(type, transform);
  },

  /**
    MAPPING CONVENIENCE
  */

  map: function(type, mappings) {
    this.mappings.set(type, mappings);
  },

  configure: function(type, configuration) {
    if (type && !configuration) {
      Ember.merge(this.globalConfigurations, type);
      return;
    }

    var config, alias;

    if (configuration.alias) {
      alias = configuration.alias;
      this.aliases.set(alias, type);
      delete configuration.alias;
    }

    config = Ember.create(this.globalConfigurations);
    Ember.merge(config, configuration);

    this.configurations.set(type, config);
  },

  typeFromAlias: function(alias) {
    this._completeAliases();
    return this.aliases.get(alias);
  },

  mappingForType: function(type) {
    this._reifyMappings();
    return this.mappings.get(type) || {};
  },

  configurationForType: function(type) {
    this._reifyConfigurations();
    return this.configurations.get(type) || this.globalConfigurations;
  },

  _completeAliases: function() {
    this._pluralizeAliases();
    this._reifyAliases();
  },

  _pluralizeAliases: function() {
    if (this._didPluralizeAliases) { return; }

    var aliases = this.aliases,
        sideloadMapping = this.aliases.sideloadMapping,
        plural,
        self = this;

    aliases.forEach(function(key, type) {
      plural = self.pluralize(key);
      Ember.assert("The '" + key + "' alias has already been defined", !aliases.get(plural));
      aliases.set(plural, type);
    });

    // This map is only for backward compatibility with the `sideloadAs` option.
    if (sideloadMapping) {
      sideloadMapping.forEach(function(key, type) {
        Ember.assert("The '" + key + "' alias has already been defined", !aliases.get(key) || (aliases.get(key)===type) );
        aliases.set(key, type);
      });
      delete this.aliases.sideloadMapping;
    }

    this._didPluralizeAliases = true;
  },

  _reifyAliases: function() {
    if (this._didReifyAliases) { return; }

    var aliases = this.aliases,
        reifiedAliases = Ember.Map.create(),
        foundType;

    aliases.forEach(function(key, type) {
      if (typeof type === 'string') {
        foundType = Ember.get(Ember.lookup, type);
        Ember.assert("Could not find model at path " + key, type);

        reifiedAliases.set(key, foundType);
      } else {
        reifiedAliases.set(key, type);
      }
    });

    this.aliases = reifiedAliases;
    this._didReifyAliases = true;
  },

  _reifyMappings: function() {
    if (this._didReifyMappings) { return; }

    var mappings = this.mappings,
        reifiedMappings = Ember.Map.create();

    mappings.forEach(function(key, mapping) {
      if (typeof key === 'string') {
        var type = Ember.get(Ember.lookup, key);
        Ember.assert("Could not find model at path " + key, type);

        reifiedMappings.set(type, mapping);
      } else {
        reifiedMappings.set(key, mapping);
      }
    });

    this.mappings = reifiedMappings;

    this._didReifyMappings = true;
  },

  _reifyConfigurations: function() {
    if (this._didReifyConfigurations) { return; }

    var configurations = this.configurations,
        reifiedConfigurations = Ember.Map.create();

    configurations.forEach(function(key, mapping) {
      if (typeof key === 'string' && key !== 'plurals') {
        var type = Ember.get(Ember.lookup, key);
        Ember.assert("Could not find model at path " + key, type);

        reifiedConfigurations.set(type, mapping);
      } else {
        reifiedConfigurations.set(key, mapping);
      }
    });

    this.configurations = reifiedConfigurations;

    this._didReifyConfigurations = true;
  },

  mappingOption: function(type, name, option) {
    var mapping = this.mappingForType(type)[name];

    return mapping && mapping[option];
  },

  configOption: function(type, option) {
    var config = this.configurationForType(type);

    return config[option];
  },

  // EMBEDDED HELPERS

  embeddedType: function(type, name) {
    return this.mappingOption(type, name, 'embedded');
  },

  eachEmbeddedRecord: function(record, callback, binding) {
    this.eachEmbeddedBelongsToRecord(record, callback, binding);
    this.eachEmbeddedHasManyRecord(record, callback, binding);
  },

  eachEmbeddedBelongsToRecord: function(record, callback, binding) {
    this.eachEmbeddedBelongsTo(record.constructor, function(name, relationship, embeddedType) {
      var embeddedRecord = get(record, name);
      if (embeddedRecord) { callback.call(binding, embeddedRecord, embeddedType); }
    });
  },

  eachEmbeddedHasManyRecord: function(record, callback, binding) {
    this.eachEmbeddedHasMany(record.constructor, function(name, relationship, embeddedType) {
      var array = get(record, name);
      for (var i=0, l=get(array, 'length'); i<l; i++) {
        callback.call(binding, array.objectAt(i), embeddedType);
      }
    });
  },

  eachEmbeddedHasMany: function(type, callback, binding) {
    this.eachEmbeddedRelationship(type, 'hasMany', callback, binding);
  },

  eachEmbeddedBelongsTo: function(type, callback, binding) {
    this.eachEmbeddedRelationship(type, 'belongsTo', callback, binding);
  },

  eachEmbeddedRelationship: function(type, kind, callback, binding) {
    type.eachRelationship(function(name, relationship) {
      var embeddedType = this.embeddedType(type, name);

      if (embeddedType) {
        if (relationship.kind === kind) {
          callback.call(binding, name, relationship, embeddedType);
        }
      }
    }, this);
  },

  // HELPERS

  // define a plurals hash in your subclass to define
  // special-case pluralization
  pluralize: function(name) {
    var plurals = this.configurations.get('plurals');
    return (plurals && plurals[name]) || name + "s";
  },

  // use the same plurals hash to determine
  // special-case singularization
  singularize: function(name) {
    var plurals = this.configurations.get('plurals');
    if (plurals) {
      for (var i in plurals) {
        if (plurals[i] === name) {
          return i;
        }
      }
    }
    if (name.lastIndexOf('s') === name.length - 1) {
      return name.substring(0, name.length - 1);
    } else {
      return name;
    }
  },
});



var none = Ember.isNone, empty = Ember.isEmpty;

/**
  @module data
  @submodule data-transforms
*/

/**
  DS.Transforms is a hash of transforms used by DS.Serializer.

  @class JSONTransforms
  @static
  @namespace DS
*/
DS.JSONTransforms = {
  string: {
    deserialize: function(serialized) {
      return none(serialized) ? null : String(serialized);
    },

    serialize: function(deserialized) {
      return none(deserialized) ? null : String(deserialized);
    }
  },

  number: {
    deserialize: function(serialized) {
      return empty(serialized) ? null : Number(serialized);
    },

    serialize: function(deserialized) {
      return empty(deserialized) ? null : Number(deserialized);
    }
  },

  // Handles the following boolean inputs:
  // "TrUe", "t", "f", "FALSE", 0, (non-zero), or boolean true/false
  'boolean': {
    deserialize: function(serialized) {
      var type = typeof serialized;

      if (type === "boolean") {
        return serialized;
      } else if (type === "string") {
        return serialized.match(/^true$|^t$|^1$/i) !== null;
      } else if (type === "number") {
        return serialized === 1;
      } else {
        return false;
      }
    },

    serialize: function(deserialized) {
      return Boolean(deserialized);
    }
  },

  date: {
    deserialize: function(serialized) {
      var type = typeof serialized;

      if (type === "string") {
        return new Date(Ember.Date.parse(serialized));
      } else if (type === "number") {
        return new Date(serialized);
      } else if (serialized === null || serialized === undefined) {
        // if the value is not present in the data,
        // return undefined, not null.
        return serialized;
      } else {
        return null;
      }
    },

    serialize: function(date) {
      if (date instanceof Date) {
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var pad = function(num) {
          return num < 10 ? "0"+num : ""+num;
        };

        var utcYear = date.getUTCFullYear(),
            utcMonth = date.getUTCMonth(),
            utcDayOfMonth = date.getUTCDate(),
            utcDay = date.getUTCDay(),
            utcHours = date.getUTCHours(),
            utcMinutes = date.getUTCMinutes(),
            utcSeconds = date.getUTCSeconds();


        var dayOfWeek = days[utcDay];
        var dayOfMonth = pad(utcDayOfMonth);
        var month = months[utcMonth];

        return dayOfWeek + ", " + dayOfMonth + " " + month + " " + utcYear + " " +
               pad(utcHours) + ":" + pad(utcMinutes) + ":" + pad(utcSeconds) + " GMT";
      } else {
        return null;
      }
    }
  }
};


/**
  @module data
  @submodule data-serializers
*/

/**
  @class JSONSerializer
  @constructor
  @namespace DS
  @extends DS.Serializer
*/

var get = Ember.get, set = Ember.set;

DS.JSONSerializer = DS.Serializer.extend({
  init: function() {
    this._super();

    if (!get(this, 'transforms')) {
      this.set('transforms', DS.JSONTransforms);
    }

    this.sideloadMapping = Ember.Map.create();
    this.metadataMapping = Ember.Map.create();

    this.configure({
      meta: 'meta',
      since: 'since'
    });
  },

  configure: function(type, configuration) {
    var key;

    if (type && !configuration) {
      for(key in type){
        this.metadataMapping.set(get(type, key), key);
      }

      return this._super(type);
    }

    var sideloadAs = configuration.sideloadAs,
        sideloadMapping;

    if (sideloadAs) {
      sideloadMapping = this.aliases.sideloadMapping || Ember.Map.create();
      sideloadMapping.set(sideloadAs, type);
      this.aliases.sideloadMapping = sideloadMapping;
      delete configuration.sideloadAs;
    }

    this._super.apply(this, arguments);
  },

  addId: function(data, key, id) {
    data[key] = id;
  },

  /**
    A hook you can use to customize how the key/value pair is added to
    the serialized data.

    @param {any} hash the JSON hash being built
    @param {String} key the key to add to the serialized data
    @param {any} value the value to add to the serialized data
  */
  addAttribute: function(hash, key, value) {
    hash[key] = value;
  },

  extractAttribute: function(type, hash, attributeName) {
    var key = this._keyForAttributeName(type, attributeName);
    return hash[key];
  },

  extractId: function(type, hash) {
    var primaryKey = this._primaryKey(type);

    if (hash.hasOwnProperty(primaryKey)) {
      // Ensure that we coerce IDs to strings so that record
      // IDs remain consistent between application runs; especially
      // if the ID is serialized and later deserialized from the URL,
      // when type information will have been lost.
      return hash[primaryKey]+'';
    } else {
      return null;
    }
  },

  extractHasMany: function(type, hash, key) {
    return hash[key];
  },

  extractBelongsTo: function(type, hash, key) {
    return hash[key];
  },

  extractBelongsToPolymorphic: function(type, hash, key) {
    var keyForId = this.keyForPolymorphicId(key),
        keyForType,
        id = hash[keyForId];

    if (id) {
      keyForType = this.keyForPolymorphicType(key);
      return {id: id, type: hash[keyForType]};
    }

    return null;
  },

  addBelongsTo: function(hash, record, key, relationship) {
    var type = record.constructor,
        name = relationship.key,
        value = null,
        includeType = (relationship.options && relationship.options.polymorphic),
        embeddedChild,
        child,
        id;

    if (this.embeddedType(type, name)) {
      if (embeddedChild = get(record, name)) {
        value = this.serialize(embeddedChild, { includeId: true, includeType: includeType });
      }

      hash[key] = value;
    } else {
      child = get(record, relationship.key);
      id = get(child, 'id');

      if (relationship.options && relationship.options.polymorphic && !Ember.isNone(id)) {
        this.addBelongsToPolymorphic(hash, key, id, child.constructor);
      } else {
        hash[key] = id === undefined ? null : this.serializeId(id);
      }
    }
  },

  addBelongsToPolymorphic: function(hash, key, id, type) {
    var keyForId = this.keyForPolymorphicId(key),
        keyForType = this.keyForPolymorphicType(key);
    hash[keyForId] = id;
    hash[keyForType] = this.rootForType(type);
  },

  /**
    Adds a has-many relationship to the JSON hash being built.

    The default REST semantics are to only add a has-many relationship if it
    is embedded. If the relationship was initially loaded by ID, we assume that
    that was done as a performance optimization, and that changes to the
    has-many should be saved as foreign key changes on the child's belongs-to
    relationship.

    @param {Object} hash the JSON being built
    @param {DS.Model} record the record being serialized
    @param {String} key the JSON key into which the serialized relationship
      should be saved
    @param {Object} relationship metadata about the relationship being serialized
  */

  addHasMany: function(hash, record, key, relationship) {
    var type = record.constructor,
        name = relationship.key,
        serializedHasMany = [],
        includeType = (relationship.options && relationship.options.polymorphic),
        manyArray, embeddedType;

    // If the has-many is not embedded, there is nothing to do.
    embeddedType = this.embeddedType(type, name);
    if (embeddedType !== 'always') { return; }

    // Get the DS.ManyArray for the relationship off the record
    manyArray = get(record, name);

    // Build up the array of serialized records
    manyArray.forEach(function (record) {
      serializedHasMany.push(this.serialize(record, { includeId: true, includeType: includeType }));
    }, this);

    // Set the appropriate property of the serialized JSON to the
    // array of serialized embedded records
    hash[key] = serializedHasMany;
  },

  addType: function(hash, type) {
    var keyForType = this.keyForEmbeddedType();
    hash[keyForType] = this.rootForType(type);
  },

  // EXTRACTION

  extract: function(loader, json, type, record) {
    var root = this.rootForType(type);

    this.sideload(loader, type, json, root);
    this.extractMeta(loader, type, json);

    if (json[root]) {
      if (record) { loader.updateId(record, json[root]); }
      this.extractRecordRepresentation(loader, type, json[root]);
    }
  },

  extractMany: function(loader, json, type, records) {
    var root = this.rootForType(type);
    root = this.pluralize(root);

    this.sideload(loader, type, json, root);
    this.extractMeta(loader, type, json);

    if (json[root]) {
      var objects = json[root], references = [];
      if (records) { records = records.toArray(); }

      for (var i = 0; i < objects.length; i++) {
        if (records) { loader.updateId(records[i], objects[i]); }
        var reference = this.extractRecordRepresentation(loader, type, objects[i]);
        references.push(reference);
      }

      loader.populateArray(references);
    }
  },

  extractMeta: function(loader, type, json) {
    var meta = this.configOption(type, 'meta'),
        data = json, value;

    if(meta && json[meta]){
      data = json[meta];
    }

    this.metadataMapping.forEach(function(property, key){
      if(value = data[property]){
        loader.metaForType(type, key, value);
      }
    });
  },

  extractEmbeddedType: function(relationship, data) {
    var foundType = relationship.type;
    if(relationship.options && relationship.options.polymorphic) {
      var key = this.keyFor(relationship),
          keyForEmbeddedType = this.keyForEmbeddedType(key);

      foundType = this.typeFromAlias(data[keyForEmbeddedType]);
      delete data[keyForEmbeddedType];
    }

    return foundType;
  },

  /**
    @private

    Iterates over the `json` payload and attempts to load any data
    included alongside `root`.

    The keys expected for sideloaded data are based upon the types related
    to the root model. Recursion is used to ensure that types related to
    related types can be loaded as well. Any custom keys specified by
    `sideloadAs` mappings will also be respected.

    @param {DS.Store subclass} loader
    @param {DS.Model subclass} type
    @param {Object} json
    @param {String} root
  */
  sideload: function(loader, type, json, root) {
    var sideloadedType;

    this.configureSideloadMappingForType(type);

    for (var prop in json) {
      if (!json.hasOwnProperty(prop) ||
          prop === root ||
          !!this.metadataMapping.get(prop)) {
        continue;
      }

      sideloadedType = this.typeFromAlias(prop);
      Ember.assert("Your server returned a hash with the key " + prop + " but you have no mapping for it", !!sideloadedType);

      this.loadValue(loader, sideloadedType, json[prop]);
    }
  },

  /**
    @private

    Configures possible sideload mappings for the types related to a
    particular model. This recursive method ensures that sideloading
    works for related models as well.

    @param {DS.Model subclass} type
    @param {Ember.A} configured an array of types that have already been configured
  */
  configureSideloadMappingForType: function(type, configured) {
    if (!configured) {configured = Ember.A([]);}
    configured.pushObject(type);

    type.eachRelatedType(function(relatedType) {
      if (!configured.contains(relatedType)) {
        var root = this.defaultSideloadRootForType(relatedType);
        this.aliases.set(root, relatedType);

        this.configureSideloadMappingForType(relatedType, configured);
      }
    }, this);
  },

  loadValue: function(loader, type, value) {
    if (value instanceof Array) {
      for (var i=0; i < value.length; i++) {
        loader.sideload(type, value[i]);
      }
    } else {
      loader.sideload(type, value);
    }
  },

  /**
    A hook you can use in your serializer subclass to customize
    how a polymorphic association's name is converted into a key for the id.

    @param {String} name the association name to convert into a key

    @returns {String} the key
  */
  keyForPolymorphicId: Ember.K,

  /**
    A hook you can use in your serializer subclass to customize
    how a polymorphic association's name is converted into a key for the type.

    @param {String} name the association name to convert into a key

    @returns {String} the key
  */
  keyForPolymorphicType: Ember.K,

  /**
    A hook you can use in your serializer subclass to customize
    the key used to store the type of a record of an embedded polymorphic association.

    By default, this method returns 'type'.

    @returns {String} the key
  */
  keyForEmbeddedType: function() {
    return 'type';
  },

  // HELPERS

  /**
    @private

    Determines the singular root name for a particular type.

    This is an underscored, lowercase version of the model name.
    For example, the type `App.UserGroup` will have the root
    `user_group`.

    @param {DS.Model subclass} type
    @returns {String} name of the root element
  */
  rootForType: function(type) {
    var typeString = type.toString();

    Ember.assert("Your model must not be anonymous. It was " + type, typeString.charAt(0) !== '(');

    // use the last part of the name as the URL
    var parts = typeString.split(".");
    var name = parts[parts.length - 1];
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
  },

  /**
    @private

    The default root name for a particular sideloaded type.

    @param {DS.Model subclass} type
    @returns {String} name of the root element
  */
  defaultSideloadRootForType: function(type) {
    return this.pluralize(this.rootForType(type));
  }
});


/**
  @module data
  @submodule data-adapter
*/

var get = Ember.get, set = Ember.set, merge = Ember.merge;

function loaderFor(store) {
  return {
    load: function(type, data, prematerialized) {
      return store.load(type, data, prematerialized);
    },

    loadMany: function(type, array) {
      return store.loadMany(type, array);
    },

    updateId: function(record, data) {
      return store.updateId(record, data);
    },

    populateArray: Ember.K,

    sideload: function(type, data) {
      return store.load(type, data);
    },

    sideloadMany: function(type, array) {
      return store.loadMany(type, array);
    },

    prematerialize: function(reference, prematerialized) {
      store.prematerialize(reference, prematerialized);
    },

    metaForType: function(type, property, data) {
      store.metaForType(type, property, data);
    }
  };
}

DS.loaderFor = loaderFor;

/**
  An adapter is an object that receives requests from a store and
  translates them into the appropriate action to take against your
  persistence layer. The persistence layer is usually an HTTP API, but may
  be anything, such as the browser's local storage.

  ### Creating an Adapter

  First, create a new subclass of `DS.Adapter`:

      App.MyAdapter = DS.Adapter.extend({
        // ...your code here
      });

  To tell your store which adapter to use, set its `adapter` property:

      App.store = DS.Store.create({
        revision: 3,
        adapter: App.MyAdapter.create()
      });

  `DS.Adapter` is an abstract base class that you should override in your
  application to customize it for your backend. The minimum set of methods
  that you should implement is:

    * `find()`
    * `createRecord()`
    * `updateRecord()`
    * `deleteRecord()`

  To improve the network performance of your application, you can optimize
  your adapter by overriding these lower-level methods:

    * `findMany()`
    * `createRecords()`
    * `updateRecords()`
    * `deleteRecords()`
    * `commit()`

  For an example implementation, see {{#crossLink "DS.RestAdapter"}} the
  included REST adapter.{{/crossLink}}.
  
  @class Adapter
  @namespace DS
  @extends Ember.Object
*/

DS.Adapter = Ember.Object.extend(DS._Mappable, {

  init: function() {
    var serializer = get(this, 'serializer');

    if (Ember.Object.detect(serializer)) {
      serializer = serializer.create();
      set(this, 'serializer', serializer);
    }

    this._attributesMap = this.createInstanceMapFor('attributes');
    this._configurationsMap = this.createInstanceMapFor('configurations');

    this._outstandingOperations = new Ember.MapWithDefault({
      defaultValue: function() { return 0; }
    });

    this._dependencies = new Ember.MapWithDefault({
      defaultValue: function() { return new Ember.OrderedSet(); }
    });

    this.registerSerializerTransforms(this.constructor, serializer, {});
    this.registerSerializerMappings(serializer);
  },

  /**
    Loads a payload for a record into the store.

    This method asks the serializer to break the payload into
    constituent parts, and then loads them into the store. For example,
    if you have a payload that contains embedded records, they will be
    extracted by the serializer and loaded into the store.

    For example:

        adapter.load(store, App.Person, {
          id: 123,
          firstName: "Yehuda",
          lastName: "Katz",
          occupations: [{
            id: 345,
            title: "Tricycle Mechanic"
          }]
        });

    This will load the payload for the `App.Person` with ID `123` and
    the embedded `App.Occupation` with ID `345`.

    @method load
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {any} payload
  */
  load: function(store, type, payload) {
    var loader = loaderFor(store);
    get(this, 'serializer').extractRecordRepresentation(loader, type, payload);
  },

  /**
    Acknowledges that the adapter has finished creating a record.

    Your adapter should call this method from `createRecord` when
    it has saved a new record to its persistent storage and received
    an acknowledgement.

    If the persistent storage returns a new payload in response to the
    creation, and you want to update the existing record with the
    new information, pass the payload as the fourth parameter.

    For example, the `RESTAdapter` saves newly created records by
    making an Ajax request. When the server returns, the adapter
    calls didCreateRecord. If the server returns a response body,
    it is passed as the payload.

    @method didCreateRecord
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload
  */
  didCreateRecord: function(store, type, record, payload) {
    store.didSaveRecord(record);

    if (payload) {
      var loader = DS.loaderFor(store);

      loader.load = function(type, data, prematerialized) {
        store.updateId(record, data);
        return store.load(type, data, prematerialized);
      };

      get(this, 'serializer').extract(loader, payload, type);
    }
  },

  /**
    Acknowledges that the adapter has finished creating several records.

    Your adapter should call this method from `createRecords` when it
    has saved multiple created records to its persistent storage
    received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    creation, and you want to update the existing record with the
    new information, pass the payload as the fourth parameter.

    @method didCreateRecords
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload
  */
  didCreateRecords: function(store, type, records, payload) {
    records.forEach(function(record) {
      store.didSaveRecord(record);
    }, this);

    if (payload) {
      var loader = DS.loaderFor(store);
      get(this, 'serializer').extractMany(loader, payload, type, records);
    }
  },

  /**
    @private

    Acknowledges that the adapter has finished updating or deleting a record.

    Your adapter should call this method from `updateRecord` or `deleteRecord`
    when it has updated or deleted a record to its persistent storage and
    received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    update or delete, and you want to update the existing record with the
    new information, pass the payload as the fourth parameter.

    @method didSaveRecord
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload
  */
  didSaveRecord: function(store, type, record, payload) {
    store.didSaveRecord(record);

    var serializer = get(this, 'serializer');

    serializer.eachEmbeddedRecord(record, function(embeddedRecord, embeddedType) {
      if (embeddedType === 'load') { return; }

      this.didSaveRecord(store, embeddedRecord.constructor, embeddedRecord);
    }, this);

    if (payload) {
      var loader = DS.loaderFor(store);
      serializer.extract(loader, payload, type);
    }
  },

  /**
    Acknowledges that the adapter has finished updating a record.

    Your adapter should call this method from `updateRecord` when it
    has updated a record to its persistent storage and received an
    acknowledgement.

    If the persistent storage returns a new payload in response to the
    update, pass the payload as the fourth parameter.

    @method didUpdateRecord
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload
  */
  didUpdateRecord: function() {
    this.didSaveRecord.apply(this, arguments);
  },

  /**
    Acknowledges that the adapter has finished deleting a record.

    Your adapter should call this method from `deleteRecord` when it
    has deleted a record from its persistent storage and received an
    acknowledgement.

    If the persistent storage returns a new payload in response to the
    deletion, pass the payload as the fourth parameter.

    @method didDeleteRecord
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {any} payload
  */
  didDeleteRecord: function() {
    this.didSaveRecord.apply(this, arguments);
  },

  /**
    Acknowledges that the adapter has finished updating or deleting
    multiple records.

    Your adapter should call this method from its `updateRecords` or
    `deleteRecords` when it has updated or deleted multiple records
    to its persistent storage and received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    creation, pass the payload as the fourth parameter.

    @method didSaveRecords
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} records
    @param {any} payload
  */
  didSaveRecords: function(store, type, records, payload) {
    records.forEach(function(record) {
      store.didSaveRecord(record);
    }, this);

    if (payload) {
      var loader = DS.loaderFor(store);
      get(this, 'serializer').extractMany(loader, payload, type);
    }
  },

  /**
    Acknowledges that the adapter has finished updating multiple records.

    Your adapter should call this method from its `updateRecords` when
    it has updated multiple records to its persistent storage and
    received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    update, pass the payload as the fourth parameter.

    @method didUpdateRecords
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} records
    @param {any} payload
  */
  didUpdateRecords: function() {
    this.didSaveRecords.apply(this, arguments);
  },

  /**
    Acknowledges that the adapter has finished updating multiple records.

    Your adapter should call this method from its `deleteRecords` when
    it has deleted multiple records to its persistent storage and
    received an acknowledgement.

    If the persistent storage returns a new payload in response to the
    deletion, pass the payload as the fourth parameter.

    @method didDeleteRecords
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} records
    @param {any} payload
  */
  didDeleteRecords: function() {
    this.didSaveRecords.apply(this, arguments);
  },

  /**
    Loads the response to a request for a record by ID.

    Your adapter should call this method from its `find` method
    with the response from the backend.

    You should pass the same ID to this method that was given
    to your find method so that the store knows which record
    to associate the new data with.

    @method didFindRecord
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {any} payload
    @param {String} id
  */
  didFindRecord: function(store, type, payload, id) {
    var loader = DS.loaderFor(store);

    loader.load = function(type, data, prematerialized) {
      prematerialized = prematerialized || {};
      prematerialized.id = id;

      return store.load(type, data, prematerialized);
    };

    get(this, 'serializer').extract(loader, payload, type);
  },

  /**
    Loads the response to a request for all records by type.

    You adapter should call this method from its `findAll`
    method with the response from the backend.

    @method didFindAll
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {any} payload
  */
  didFindAll: function(store, type, payload) {
    var loader = DS.loaderFor(store),
        serializer = get(this, 'serializer');

    store.didUpdateAll(type);

    serializer.extractMany(loader, payload, type);
  },

  /**
    Loads the response to a request for records by query.

    Your adapter should call this method from its `findQuery`
    method with the response from the backend.

    @method didFindQuery
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {any} payload
    @param {DS.AdapterPopulatedRecordArray} recordArray
  */
  didFindQuery: function(store, type, payload, recordArray) {
    var loader = DS.loaderFor(store);

    loader.populateArray = function(data) {
      recordArray.load(data);
    };

    get(this, 'serializer').extractMany(loader, payload, type);
  },

  /**
    Loads the response to a request for many records by ID.

    You adapter should call this method from its `findMany`
    method with the response from the backend.

    @method didFindMany
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {any} payload
  */
  didFindMany: function(store, type, payload) {
    var loader = DS.loaderFor(store);

    get(this, 'serializer').extractMany(loader, payload, type);
  },

  /**
    Notifies the store that a request to the backend returned
    an error.

    Your adapter should call this method to indicate that the
    backend returned an error for a request.

    @method didError
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Model} record
  */
  didError: function(store, type, record) {
    store.recordWasError(record);
  },

  dirtyRecordsForAttributeChange: function(dirtySet, record, attributeName, newValue, oldValue) {
    if (newValue !== oldValue) {
      // If this record is embedded, add its parent
      // to the dirty set.
      this.dirtyRecordsForRecordChange(dirtySet, record);
    }
  },

  dirtyRecordsForRecordChange: function(dirtySet, record) {
    dirtySet.add(record);
  },

  dirtyRecordsForBelongsToChange: function(dirtySet, child) {
    this.dirtyRecordsForRecordChange(dirtySet, child);
  },

  dirtyRecordsForHasManyChange: function(dirtySet, parent) {
    this.dirtyRecordsForRecordChange(dirtySet, parent);
  },

  /**
    @private

    This method recursively climbs the superclass hierarchy and
    registers any class-registered transforms on the adapter's
    serializer.

    Once it registers a transform for a given type, it ignores
    subsequent transforms for the same attribute type.

    @method registerSerializerTransforms
    @param {Class} klass the DS.Adapter subclass to extract the
      transforms from
    @param {DS.Serializer} serializer the serializer to register
      the transforms onto
    @param {Object} seen a hash of attributes already seen
  */
  registerSerializerTransforms: function(klass, serializer, seen) {
    var transforms = klass._registeredTransforms, superclass, prop;

    for (prop in transforms) {
      if (!transforms.hasOwnProperty(prop) || prop in seen) { continue; }
      seen[prop] = true;

      serializer.registerTransform(prop, transforms[prop]);
    }

    if (superclass = klass.superclass) {
      this.registerSerializerTransforms(superclass, serializer, seen);
    }
  },

  /**
    @private

    This method recursively climbs the superclass hierarchy and
    registers any class-registered mappings on the adapter's
    serializer.

    @method registerSerializerMappings
    @param {Class} klass the DS.Adapter subclass to extract the
      transforms from
    @param {DS.Serializer} serializer the serializer to register the
      mappings onto
  */
  registerSerializerMappings: function(serializer) {
    var mappings = this._attributesMap,
        configurations = this._configurationsMap;

    mappings.forEach(serializer.map, serializer);
    configurations.forEach(serializer.configure, serializer);
  },

  /**
    The `find()` method is invoked when the store is asked for a record that
    has not previously been loaded. In response to `find()` being called, you
    should query your persistence layer for a record with the given ID. Once
    found, you can asynchronously call the store's `load()` method to load
    the record.

    Here is an example `find` implementation:

        find: function(store, type, id) {
          var url = type.url;
          url = url.fmt(id);

          jQuery.getJSON(url, function(data) {
              // data is a hash of key/value pairs. If your server returns a
              // root, simply do something like:
              // store.load(type, id, data.person)
              store.load(type, id, data);
          });
        }

    @method find
  */
  find: null,

  serializer: DS.JSONSerializer,

  registerTransform: function(attributeType, transform) {
    get(this, 'serializer').registerTransform(attributeType, transform);
  },

  /**
    A public method that allows you to register an enumerated
    type on your adapter.  This is useful if you want to utilize
    a text representation of an integer value.

    Eg: Say you want to utilize "low","medium","high" text strings
    in your app, but you want to persist those as 0,1,2 in your backend.
    You would first register the transform on your adapter instance:

        adapter.registerEnumTransform('priority', ['low', 'medium', 'high']);

    You would then refer to the 'priority' DS.attr in your model:

        App.Task = DS.Model.extend({
          priority: DS.attr('priority')
        });

    And lastly, you would set/get the text representation on your model instance,
    but the transformed result will be the index number of the type.

        App:   myTask.get('priority') => 'low'
        Server Response / Load:  { myTask: {priority: 0} }

    @method registerEnumTransform
    @param {String} type of the transform
    @param {Array} array of String objects to use for the enumerated values.
      This is an ordered list and the index values will be used for the transform.
  */
  registerEnumTransform: function(attributeType, objects) {
    get(this, 'serializer').registerEnumTransform(attributeType, objects);
  },

  /**
    If the globally unique IDs for your records should be generated on the client,
    implement the `generateIdForRecord()` method. This method will be invoked
    each time you create a new record, and the value returned from it will be
    assigned to the record's `primaryKey`.

    Most traditional REST-like HTTP APIs will not use this method. Instead, the ID
    of the record will be set by the server, and your adapter will update the store
    with the new ID when it calls `didCreateRecord()`. Only implement this method if
    you intend to generate record IDs on the client-side.

    The `generateIdForRecord()` method will be invoked with the requesting store as
    the first parameter and the newly created record as the second parameter:

        generateIdForRecord: function(store, record) {
          var uuid = App.generateUUIDWithStatisticallyLowOddsOfCollision();
          return uuid;
        }

    @method generateIdForRecord
    @param {DS.Store} store
    @param {DS.Model} record
  */
  generateIdForRecord: null,

  materialize: function(record, data, prematerialized) {
    get(this, 'serializer').materialize(record, data, prematerialized);
  },

  serialize: function(record, options) {
    return get(this, 'serializer').serialize(record, options);
  },

  extractId: function(type, data) {
    return get(this, 'serializer').extractId(type, data);
  },

  groupByType: function(enumerable) {
    var map = Ember.MapWithDefault.create({
      defaultValue: function() { return Ember.OrderedSet.create(); }
    });

    enumerable.forEach(function(item) {
      map.get(item.constructor).add(item);
    });

    return map;
  },

  commit: function(store, commitDetails) {
    this.save(store, commitDetails);
  },

  save: function(store, commitDetails) {
    var adapter = this;

    function filter(records) {
      var filteredSet = Ember.OrderedSet.create();

      records.forEach(function(record) {
        if (adapter.shouldSave(record)) {
          filteredSet.add(record);
        }
      });

      return filteredSet;
    }

    this.groupByType(commitDetails.created).forEach(function(type, set) {
      this.createRecords(store, type, filter(set));
    }, this);

    this.groupByType(commitDetails.updated).forEach(function(type, set) {
      this.updateRecords(store, type, filter(set));
    }, this);

    this.groupByType(commitDetails.deleted).forEach(function(type, set) {
      this.deleteRecords(store, type, filter(set));
    }, this);
  },

  shouldSave: Ember.K,

  createRecords: function(store, type, records) {
    records.forEach(function(record) {
      this.createRecord(store, type, record);
    }, this);
  },

  updateRecords: function(store, type, records) {
    records.forEach(function(record) {
      this.updateRecord(store, type, record);
    }, this);
  },

  deleteRecords: function(store, type, records) {
    records.forEach(function(record) {
      this.deleteRecord(store, type, record);
    }, this);
  },

  findMany: function(store, type, ids) {
    ids.forEach(function(id) {
      this.find(store, type, id);
    }, this);
  }
});

DS.Adapter.reopenClass({
  registerTransform: function(attributeType, transform) {
    var registeredTransforms = this._registeredTransforms || {};

    registeredTransforms[attributeType] = transform;

    this._registeredTransforms = registeredTransforms;
  },

  map: DS._Mappable.generateMapFunctionFor('attributes', function(key, newValue, map) {
    var existingValue = map.get(key);

    merge(existingValue, newValue);
  }),

  configure: DS._Mappable.generateMapFunctionFor('configurations', function(key, newValue, map) {
    var existingValue = map.get(key);

    // If a mapping configuration is provided, peel it off and apply it
    // using the DS.Adapter.map API.
    var mappings = newValue && newValue.mappings;
    if (mappings) {
      this.map(key, mappings);
      delete newValue.mappings;
    }

    merge(existingValue, newValue);
  }),

  resolveMapConflict: function(oldValue, newValue) {
    merge(newValue, oldValue);

    return newValue;
  }
});

/**
  Adapters included with Ember-Data.

  @module data
  @submodule data-adapters

  @main data-adapters
*/





/**
  @module data
  @submodule data-serializers
*/

/**
  @class FixtureSerializer
  @constructor
  @namespace DS
  @extends DS.Serializer
*/

var get = Ember.get, set = Ember.set;

DS.FixtureSerializer = DS.Serializer.extend({
  deserializeValue: function(value, attributeType) {
    return value;
  },

  serializeValue: function(value, attributeType) {
    return value;
  },

  addId: function(data, key, id) {
    data[key] = id;
  },

  addAttribute: function(hash, key, value) {
    hash[key] = value;
  },

  addBelongsTo: function(hash, record, key, relationship) {
    var id = get(record, relationship.key+'.id');
    if (!Ember.isNone(id)) { hash[key] = id; }
  },

  addHasMany: function(hash, record, key, relationship) {
    var ids = get(record, relationship.key).map(function(item) {
      return item.get('id');
    });

    hash[relationship.key] = ids;
  },

  extract: function(loader, fixture, type, record) {
    if (record) { loader.updateId(record, fixture); }
    this.extractRecordRepresentation(loader, type, fixture);
  },

  extractMany: function(loader, fixtures, type, records) {
    var objects = fixtures, references = [];
    if (records) { records = records.toArray(); }

    for (var i = 0; i < objects.length; i++) {
      if (records) { loader.updateId(records[i], objects[i]); }
      var reference = this.extractRecordRepresentation(loader, type, objects[i]);
      references.push(reference);
    }

    loader.populateArray(references);
  },

  extractId: function(type, hash) {
    var primaryKey = this._primaryKey(type);

    if (hash.hasOwnProperty(primaryKey)) {
      // Ensure that we coerce IDs to strings so that record
      // IDs remain consistent between application runs; especially
      // if the ID is serialized and later deserialized from the URL,
      // when type information will have been lost.
      return hash[primaryKey]+'';
    } else {
      return null;
    }
  },

  extractAttribute: function(type, hash, attributeName) {
    var key = this._keyForAttributeName(type, attributeName);
    return hash[key];
  },

  extractHasMany: function(type, hash, key) {
    return hash[key];
  },

  extractBelongsTo: function(type, hash, key) {
    return hash[key];
  },

  extractBelongsToPolymorphic: function(type, hash, key) {
    var keyForId = this.keyForPolymorphicId(key),
        keyForType,
        id = hash[keyForId];

    if (id) {
      keyForType = this.keyForPolymorphicType(key);
      return {id: id, type: hash[keyForType]};
    }

    return null;
  },

  keyForPolymorphicId: function(key) {
    return key;
  },

  keyForPolymorphicType: function(key) {
    return key + '_type';
  }
});


/**
  @module data
  @submodule data-adapters
*/

var get = Ember.get, fmt = Ember.String.fmt,
    dump = Ember.get(window, 'JSON.stringify') || function(object) { return object.toString(); };

/**
  `DS.FixtureAdapter` is an adapter that loads records from memory.
  Its primarily used for development and testing. You can also use
  `DS.FixtureAdapter` while working on the API but are not ready to
  integrate yet. It is a fully functioning adapter. All CRUD methods
  are implemented. You can also implement query logic that a remote
  system would do. Its possible to do develop your entire application
  with `DS.FixtureAdapter`.

  @class FixtureAdapter
  @constructor
  @namespace DS
  @extends DS.Adapter
*/
DS.FixtureAdapter = DS.Adapter.extend({

  simulateRemoteResponse: true,

  latency: 50,

  serializer: DS.FixtureSerializer,

  /*
    Implement this method in order to provide data associated with a type
  */
  fixturesForType: function(type) {
    if (type.FIXTURES) {
      var fixtures = Ember.A(type.FIXTURES);
      return fixtures.map(function(fixture){
        if(!fixture.id){
          throw new Error(fmt('the id property must be defined for fixture %@', [dump(fixture)]));
        }
        fixture.id = fixture.id + '';
        return fixture;
      });
    }
    return null;
  },

  /*
    Implement this method in order to query fixtures data
  */
  queryFixtures: function(fixtures, query, type) {
    Ember.assert('Not implemented: You must override the DS.FixtureAdapter::queryFixtures method to support querying the fixture store.');
  },

  updateFixtures: function(type, fixture) {
    if(!type.FIXTURES) {
      type.FIXTURES = [];
    }

    var fixtures = type.FIXTURES;

    this.deleteLoadedFixture(type, fixture);

    fixtures.push(fixture);
  },

  /*
    Implement this method in order to provide provide json for CRUD methods
  */
  mockJSON: function(type, record) {
    return this.serialize(record, { includeId: true });
  },

  /*
    Adapter methods
  */
  generateIdForRecord: function(store, record) {
    return Ember.guidFor(record);
  },

  find: function(store, type, id) {
    var fixtures = this.fixturesForType(type),
        fixture;

    Ember.warn("Unable to find fixtures for model type " + type.toString(), fixtures);

    if (fixtures) {
      fixture = Ember.A(fixtures).findProperty('id', id);
    }

    if (fixture) {
      this.simulateRemoteCall(function() {
        this.didFindRecord(store, type, fixture, id);
      }, this);
    }
  },

  findMany: function(store, type, ids) {
    var fixtures = this.fixturesForType(type);

    Ember.assert("Unable to find fixtures for model type "+type.toString(), !!fixtures);

    if (fixtures) {
      fixtures = fixtures.filter(function(item) {
        return ids.indexOf(item.id) !== -1;
      });
    }

    if (fixtures) {
      this.simulateRemoteCall(function() {
        this.didFindMany(store, type, fixtures);
      }, this);
    }
  },

  findAll: function(store, type) {
    var fixtures = this.fixturesForType(type);

    Ember.assert("Unable to find fixtures for model type "+type.toString(), !!fixtures);

    this.simulateRemoteCall(function() {
      this.didFindAll(store, type, fixtures);
    }, this);
  },

  findQuery: function(store, type, query, array) {
    var fixtures = this.fixturesForType(type);

    Ember.assert("Unable to find fixtures for model type "+type.toString(), !!fixtures);

    fixtures = this.queryFixtures(fixtures, query, type);

    if (fixtures) {
      this.simulateRemoteCall(function() {
        this.didFindQuery(store, type, fixtures, array);
      }, this);
    }
  },

  createRecord: function(store, type, record) {
    var fixture = this.mockJSON(type, record);

    this.updateFixtures(type, fixture);

    this.simulateRemoteCall(function() {
      this.didCreateRecord(store, type, record, fixture);
    }, this);
  },

  updateRecord: function(store, type, record) {
    var fixture = this.mockJSON(type, record);

    this.updateFixtures(type, fixture);

    this.simulateRemoteCall(function() {
      this.didUpdateRecord(store, type, record, fixture);
    }, this);
  },

  deleteRecord: function(store, type, record) {
    var fixture = this.mockJSON(type, record);

    this.deleteLoadedFixture(type, fixture);

    this.simulateRemoteCall(function() {
      this.didDeleteRecord(store, type, record);
    }, this);
  },

  /*
    @private
  */
 deleteLoadedFixture: function(type, record) {
    var existingFixture = this.findExistingFixture(type, record);

    if(existingFixture) {
      var index = type.FIXTURES.indexOf(existingFixture);
      type.FIXTURES.splice(index, 1);
      return true;
    }
  },

  findExistingFixture: function(type, record) {
    var fixtures = this.fixturesForType(type);
    var id = this.extractId(type, record);

    return this.findFixtureById(fixtures, id);
  },

  findFixtureById: function(fixtures, id) {
    return Ember.A(fixtures).find(function(r) {
      if(''+get(r, 'id') === ''+id) {
        return true;
      } else {
        return false;
      }
    });
  },

  simulateRemoteCall: function(callback, context) {
    if (get(this, 'simulateRemoteResponse')) {
      // Schedule with setTimeout
      Ember.run.later(context, callback, get(this, 'latency'));
    } else {
      // Asynchronous, but at the of the runloop with zero latency
      Ember.run.once(context, callback);
    }
  }
});





/**
  @module data
  @submodule data-serializers
*/

/**
  @class RESTSerializer
  @constructor
  @namespace DS
  @extends DS.Serializer
*/

var get = Ember.get;

DS.RESTSerializer = DS.JSONSerializer.extend({
  keyForAttributeName: function(type, name) {
    return Ember.String.decamelize(name);
  },

  keyForBelongsTo: function(type, name) {
    var key = this.keyForAttributeName(type, name);

    if (this.embeddedType(type, name)) {
      return key;
    }

    return key + "_id";
  },

  keyForHasMany: function(type, name) {
    var key = this.keyForAttributeName(type, name);

    if (this.embeddedType(type, name)) {
      return key;
    }

    return this.singularize(key) + "_ids";
  },

  keyForPolymorphicId: function(key) {
    return key;
  },

  keyForPolymorphicType: function(key) {
    return key.replace(/_id$/, '_type');
  },

  extractValidationErrors: function(type, json) {
    var errors = {};

    get(type, 'attributes').forEach(function(name) {
      var key = this._keyForAttributeName(type, name);
      if (json['errors'].hasOwnProperty(key)) {
        errors[name] = json['errors'][key];
      }
    }, this);

    return errors;
  }
});

/*global jQuery*/

/**
  @module data
  @submodule data-adapters
*/

var get = Ember.get, set = Ember.set;

/**
  The REST adapter allows your store to communicate with an HTTP server by
  transmitting JSON via XHR. Most Ember.js apps that consume a JSON API
  should use the REST adapter.

  This adapter is designed around the idea that the JSON exchanged with
  the server should be conventional.

  ## JSON Structure

  The REST adapter expects the JSON returned from your server to follow
  these conventions.

  ### Object Root

  The JSON payload should be an object that contains the record inside a
  root property. For example, in response to a `GET` request for
  `/posts/1`, the JSON should look like this:

  ```js
  {
    "post": {
      title: "I'm Running to Reform the W3C's Tag",
      author: "Yehuda Katz"
    }
  }
  ```

  ### Conventional Names

  Attribute names in your JSON payload should be the underscored versions of
  the attributes in your Ember.js models.

  For example, if you have a `Person` model:

  ```js
  App.Person = DS.Model.extend({
    firstName: DS.attr('string'),
    lastName: DS.attr('string'),
    occupation: DS.attr('string')
  });
  ```

  The JSON returned should look like this:

  ```js
  {
    "person": {
      "first_name": "Barack",
      "last_name": "Obama",
      "occupation": "President"
    }
  }
  ```

  @class RESTAdapter
  @constructor
  @namespace DS
  @extends DS.Adapter
*/
DS.RESTAdapter = DS.Adapter.extend({
  namespace: null,
  bulkCommit: false,
  since: 'since',

  serializer: DS.RESTSerializer,

  init: function() {
    this._super.apply(this, arguments);
  },

  shouldSave: function(record) {
    var reference = get(record, '_reference');

    return !reference.parent;
  },

  dirtyRecordsForRecordChange: function(dirtySet, record) {
    this._dirtyTree(dirtySet, record);
  },

  dirtyRecordsForHasManyChange: function(dirtySet, record, relationship) {
    var embeddedType = get(this, 'serializer').embeddedType(record.constructor, relationship.secondRecordName);

    if (embeddedType === 'always') {
      relationship.childReference.parent = relationship.parentReference;
      this._dirtyTree(dirtySet, record);
    }
  },

  _dirtyTree: function(dirtySet, record) {
    dirtySet.add(record);

    get(this, 'serializer').eachEmbeddedRecord(record, function(embeddedRecord, embeddedType) {
      if (embeddedType !== 'always') { return; }
      if (dirtySet.has(embeddedRecord)) { return; }
      this._dirtyTree(dirtySet, embeddedRecord);
    }, this);

    var reference = record.get('_reference');

    if (reference.parent) {
      var store = get(record, 'store');
      var parent = store.recordForReference(reference.parent);
      this._dirtyTree(dirtySet, parent);
    }
  },

  createRecord: function(store, type, record) {
    var root = this.rootForType(type);

    var data = {};
    data[root] = this.serialize(record, { includeId: true });

    this.ajax(this.buildURL(root), "POST", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          this.didCreateRecord(store, type, record, json);
        });
      },
      error: function(xhr) {
        this.didError(store, type, record, xhr);
      }
    });
  },

  createRecords: function(store, type, records) {
    if (get(this, 'bulkCommit') === false) {
      return this._super(store, type, records);
    }

    var root = this.rootForType(type),
        plural = this.pluralize(root);

    var data = {};
    data[plural] = [];
    records.forEach(function(record) {
      data[plural].push(this.serialize(record, { includeId: true }));
    }, this);

    this.ajax(this.buildURL(root), "POST", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          this.didCreateRecords(store, type, records, json);
        });
      }
    });
  },

  updateRecord: function(store, type, record) {
    var id = get(record, 'id');
    var root = this.rootForType(type);

    var data = {};
    data[root] = this.serialize(record);

    this.ajax(this.buildURL(root, id), "PUT", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          this.didUpdateRecord(store, type, record, json);
        });
      },
      error: function(xhr) {
        this.didError(store, type, record, xhr);
      }
    });
  },

  updateRecords: function(store, type, records) {
    if (get(this, 'bulkCommit') === false) {
      return this._super(store, type, records);
    }

    var root = this.rootForType(type),
        plural = this.pluralize(root);

    var data = {};
    data[plural] = [];
    records.forEach(function(record) {
      data[plural].push(this.serialize(record, { includeId: true }));
    }, this);

    this.ajax(this.buildURL(root, "bulk"), "PUT", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          this.didUpdateRecords(store, type, records, json);
        });
      }
    });
  },

  deleteRecord: function(store, type, record) {
    var id = get(record, 'id');
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, id), "DELETE", {
      success: function(json) {
        Ember.run(this, function(){
          this.didDeleteRecord(store, type, record, json);
        });
      },
      error: function(xhr) {
        this.didError(store, type, record, xhr);
      }
    });
  },

  deleteRecords: function(store, type, records) {
    if (get(this, 'bulkCommit') === false) {
      return this._super(store, type, records);
    }

    var root = this.rootForType(type),
        plural = this.pluralize(root),
        serializer = get(this, 'serializer');

    var data = {};
    data[plural] = [];
    records.forEach(function(record) {
      data[plural].push(serializer.serializeId( get(record, 'id') ));
    });

    this.ajax(this.buildURL(root, 'bulk'), "DELETE", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          this.didDeleteRecords(store, type, records, json);
        });
      }
    });
  },

  find: function(store, type, id) {
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, id), "GET", {
      success: function(json) {
        Ember.run(this, function(){
          this.didFindRecord(store, type, json, id);
        });
      }
    });
  },

  findAll: function(store, type, since) {
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root), "GET", {
      data: this.sinceQuery(since),
      success: function(json) {
        Ember.run(this, function(){
          this.didFindAll(store, type, json);
        });
      }
    });
  },

  findQuery: function(store, type, query, recordArray) {
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root), "GET", {
      data: query,
      success: function(json) {
        Ember.run(this, function(){
          this.didFindQuery(store, type, json, recordArray);
        });
      }
    });
  },

  findMany: function(store, type, ids, owner) {
    var root = this.rootForType(type);
    ids = this.serializeIds(ids);

    this.ajax(this.buildURL(root), "GET", {
      data: {ids: ids},
      success: function(json) {
        Ember.run(this, function(){
          this.didFindMany(store, type, json);
        });
      }
    });
  },

  /**
    @private

    This method serializes a list of IDs using `serializeId`

    @returns {Array} an array of serialized IDs
  */
  serializeIds: function(ids) {
    var serializer = get(this, 'serializer');

    return Ember.EnumerableUtils.map(ids, function(id) {
      return serializer.serializeId(id);
    });
  },

  didError: function(store, type, record, xhr) {
    if (xhr.status === 422) {
      var json = JSON.parse(xhr.responseText),
          serializer = get(this, 'serializer'),
          errors = serializer.extractValidationErrors(type, json);

      store.recordWasInvalid(record, errors);
    } else {
      this._super.apply(this, arguments);
    }
  },

  ajax: function(url, type, hash) {
    hash.url = url;
    hash.type = type;
    hash.dataType = 'json';
    hash.contentType = 'application/json; charset=utf-8';
    hash.context = this;

    if (hash.data && type !== 'GET') {
      hash.data = JSON.stringify(hash.data);
    }

    jQuery.ajax(hash);
  },

  url: "",

  rootForType: function(type) {
    var serializer = get(this, 'serializer');
    return serializer.rootForType(type);
  },

  pluralize: function(string) {
    var serializer = get(this, 'serializer');
    return serializer.pluralize(string);
  },

  buildURL: function(record, suffix) {
    var url = [this.url];

    Ember.assert("Namespace URL (" + this.namespace + ") must not start with slash", !this.namespace || this.namespace.toString().charAt(0) !== "/");
    Ember.assert("Record URL (" + record + ") must not start with slash", !record || record.toString().charAt(0) !== "/");
    Ember.assert("URL suffix (" + suffix + ") must not start with slash", !suffix || suffix.toString().charAt(0) !== "/");

    if (!Ember.isNone(this.namespace)) {
      url.push(this.namespace);
    }

    url.push(this.pluralize(record));
    if (suffix !== undefined) {
      url.push(suffix);
    }

    return url.join("/");
  },

  sinceQuery: function(since) {
    var query = {};
    query[get(this, 'since')] = since;
    return since ? query : null;
  }
});


/**
  @module data
  @submodule data-adapters
*/

var camelize = Ember.String.camelize,
    capitalize = Ember.String.capitalize,
    get = Ember.get,
    map = Ember.ArrayPolyfills.map,
    registeredTransforms;

var passthruTransform = {
  serialize: function(value) { return value; },
  deserialize: function(value) { return value; }
};

var defaultTransforms = {
  string: passthruTransform,
  boolean: passthruTransform,
  number: passthruTransform
};

function camelizeKeys(json) {
  var value;

  for (var prop in json) {
    value = json[prop];
    delete json[prop];
    json[camelize(prop)] = value;
  }
}

function munge(json, callback) {
  callback(json);
}

function applyTransforms(json, type, transformType) {
  var transforms = registeredTransforms[transformType];

  Ember.assert("You are trying to apply the '" + transformType + "' transforms, but you didn't register any transforms with that name", transforms);

  get(type, 'attributes').forEach(function(name, attribute) {
    var attributeType = attribute.type,
        value = json[name];

    var transform = transforms[attributeType] || defaultTransforms[attributeType];

    Ember.assert("Your model specified the '" + attributeType + "' type for the '" + name + "' attribute, but no transform for that type was registered", transform);

    json[name] = transform.deserialize(value);
  });
}

function ObjectProcessor(json, type, store) {
  this.json = json;
  this.type = type;
  this.store = store;
}

ObjectProcessor.prototype = {
  camelizeKeys: function() {
    camelizeKeys(this.json);
    return this;
  },

  munge: function(callback) {
    munge(this.json, callback);
    return this;
  },

  applyTransforms: function(transformType) {
    applyTransforms(this.json, this.type, transformType);
    return this;
  }
};

function LoadObjectProcessor() {
  ObjectProcessor.apply(this, arguments);
}

LoadObjectProcessor.prototype = Ember.create(ObjectProcessor.prototype);

LoadObjectProcessor.prototype.load = function() {
  this.store.load(this.type, {}, this.json);
};

function loadObjectProcessorFactory(store, type) {
  return function(json) {
    return new LoadObjectProcessor(json, type, store);
  };
}

function ArrayProcessor(json, type, array, store) {
  this.json = json;
  this.type = type;
  this.array = array;
  this.store = store;
}

ArrayProcessor.prototype = {
  load: function() {
    var store = this.store,
        type = this.type;

    var references = this.json.map(function(object) {
      return store.load(type, {}, object);
    });

    this.array.load(references);
  },

  camelizeKeys: function() {
    this.json.forEach(camelizeKeys);
    return this;
  },

  munge: function(callback) {
    this.json.forEach(function(object) {
      munge(object, callback);
    });
    return this;
  },

  applyTransforms: function(transformType) {
    var type = this.type;

    this.json.forEach(function(object) {
      applyTransforms(object, type, transformType);
    });

    return this;
  }
};

function arrayProcessorFactory(store, type, array) {
  return function(json) {
    return new ArrayProcessor(json, type, array, store);
  };
}

var HasManyProcessor = function(json, store, record, relationship) {
  this.json = json;
  this.store = store;
  this.record = record;
  this.type = record.constructor;
  this.relationship = relationship;
};

HasManyProcessor.prototype = Ember.create(ArrayProcessor.prototype);

HasManyProcessor.prototype.load = function() {
  var store = this.store;
  var ids = map.call(this.json, function(obj) { return obj.id; });

  store.loadMany(this.relationship.type, this.json);
  store.loadHasMany(this.record, this.relationship.key, ids);
};

function hasManyProcessorFactory(store, record, relationship) {
  return function(json) {
    return new HasManyProcessor(json, store, record, relationship);
  };
}

function SaveProcessor(record, store, type, includeId) {
  this.record = record;
  ObjectProcessor.call(this, record.toJSON({ includeId: includeId }), type, store);
}

SaveProcessor.prototype = Ember.create(ObjectProcessor.prototype);

SaveProcessor.prototype.save = function(callback) {
  callback(this.json);
};

function saveProcessorFactory(store, type, includeId) {
  return function(record) {
    return new SaveProcessor(record, store, type, includeId);
  };
}

/**
  @class BasicAdapter
  @constructor
  @namespace DS
  @extends DS.Adapter
**/

DS.BasicAdapter = DS.Adapter.extend({
  find: function(store, type, id) {
    var sync = type.sync;

    Ember.assert("You are trying to use the BasicAdapter to find id '" + id + "' of " + type + " but " + type + ".sync was not found", sync);
    Ember.assert("The sync code on " + type + " does not implement find(), but you are trying to find id '" + id + "'.", sync.find);

    sync.find(id, loadObjectProcessorFactory(store, type));
  },

  findQuery: function(store, type, query, recordArray) {
    var sync = type.sync;

    Ember.assert("You are trying to use the BasicAdapter to query " + type + " but " + type + ".sync was not found", sync);
    Ember.assert("The sync code on " + type + " does not implement query(), but you are trying to query " + type + ".", sync.query);

    sync.query(query, arrayProcessorFactory(store, type, recordArray));
  },

  findHasMany: function(store, record, relationship, data) {
    var name = capitalize(relationship.key),
        sync = record.constructor.sync,
        processor = hasManyProcessorFactory(store, record, relationship);

    Ember.assert("You are trying to use the BasicAdapter to query " + record.constructor + " but " + record.constructor + ".sync was not found", sync);

    var options = {
      relationship: relationship.key,
      data: data
    };

    if (sync['find'+name]) {
      sync['find' + name](record, options, processor);
    } else if (sync.findHasMany) {
      sync.findHasMany(record, options, processor);
    } else {
      Ember.assert("You are trying to use the BasicAdapter to find the " + relationship.key + " has-many relationship, but " + record.constructor + ".sync did not implement findHasMany or find" + name + ".", false);
    }
  },

  createRecord: function(store, type, record) {
    var sync = type.sync;
    Ember.assert("You are trying to use the BasicAdapter to query " + type + " but " + type + ".sync was not found", sync);
    Ember.assert("The sync code on " + type + " does not implement createRecord(), but you are trying to create a " + type + " record", sync.createRecord);
    sync.createRecord(record, saveProcessorFactory(store, type));
  },

  updateRecord: function(store, type, record) {
    var sync = type.sync;
    Ember.assert("You are trying to use the BasicAdapter to query " + type + " but " + type + ".sync was not found", sync);
    Ember.assert("The sync code on " + type + " does not implement updateRecord(), but you are trying to update a " + type + " record", sync.updateRecord);
    sync.updateRecord(record, saveProcessorFactory(store, type, true));
  },

  deleteRecord: function(store, type, record) {
    var sync = type.sync;
    Ember.assert("You are trying to use the BasicAdapter to query " + type + " but " + type + ".sync was not found", sync);
    Ember.assert("The sync code on " + type + " does not implement deleteRecord(), but you are trying to delete a " + type + " record", sync.deleteRecord);
    sync.deleteRecord(record, saveProcessorFactory(store, type, true));
  }
});

DS.registerTransforms = function(kind, object) {
  registeredTransforms[kind] = object;
};

DS.clearTransforms = function() {
  registeredTransforms = {};
};

DS.clearTransforms();



//     Backbone.js 0.9.10

//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to array methods.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.9.10';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
    } else if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
    } else {
      return true;
    }
  };

  // Optimized internal dispatch function for triggering events. Tries to
  // keep the usual cases speedy (most Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length;
    switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx);
    return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0]);
    return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
    return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
    return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind one or more space separated events, or an events map,
    // to a `callback` function. Passing `"all"` will bind the callback to
    // all events fired.
    on: function(name, callback, context) {
      if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
      this._events || (this._events = {});
      var list = this._events[name] || (this._events[name] = []);
      list.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind events to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      this.on(name, once, context);
      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var list, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (list = this._events[name]) {
          events = [];
          if (callback || context) {
            for (j = 0, k = list.length; j < k; j++) {
              ev = list[j];
              if ((callback && callback !== ev.callback &&
                               callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                events.push(ev);
              }
            }
          }
          this._events[name] = events;
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // An inversion-of-control version of `on`. Tell *this* object to listen to
    // an event in another object ... keeping track of what it's listening to.
    listenTo: function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      obj.on(name, typeof name === 'object' ? this : callback, this);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return;
      if (obj) {
        obj.off(name, typeof name === 'object' ? this : callback, this);
        if (!name && !callback) delete listeners[obj._listenerId];
      } else {
        if (typeof name === 'object') callback = this;
        for (var id in listeners) {
          listeners[id].off(name, callback, this);
        }
        this._listeners = {};
      }
      return this;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options && options.collection) this.collection = options.collection;
    if (options && options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // ----------------------------------------------------------------------

    // Set a hash of model attributes on the object, firing `"change"` unless
    // you choose to silence it.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"` unless you choose
    // to silence it. `unset` is a noop if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // ---------------------------------------------------------------------

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overriden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, success, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      success = options.success;
      options.success = function(model, resp, options) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
      };

      // Finish configuring and sending the Ajax request.
      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(model, resp, options) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
      };

      if (this.isNew()) {
        options.success(this, null, options);
        return false;
      }

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return !this.validate || !this.validate(this.attributes, options);
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire a general
    // `"error"` event and call the error callback, if specified.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, options || {});
      return false;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this.models = [];
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, model, attrs, existing, doSort, add, at, sort, sortAttr;
      add = [];
      at = options.at;
      sort = this.comparator && (at == null) && options.sort != false;
      sortAttr = _.isString(this.comparator) ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(attrs = models[i], options))) {
          this.trigger('invalid', this, attrs, options);
          continue;
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.merge) {
            existing.set(attrs === model ? model.attributes : attrs, options);
            if (sort && !doSort && existing.hasChanged(sortAttr)) doSort = true;
          }
          continue;
        }

        // This is a new model, push it to the `add` list.
        add.push(model);

        // Listen to added models' events, and index models for lookup by
        // `id` and by `cid`.
        model.on('all', this._onModelEvent, this);
        this._byId[model.cid] = model;
        if (model.id != null) this._byId[model.id] = model;
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (add.length) {
        if (sort) doSort = true;
        this.length += add.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(add));
        } else {
          push.apply(this.models, add);
        }
      }

      // Silently sort the collection if appropriate.
      if (doSort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = add.length; i < l; i++) {
        (model = add[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (doSort) this.trigger('sort', this, options);

      return this;
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      this._idAttr || (this._idAttr = this.model.prototype.idAttribute);
      return this._byId[obj.id || obj.cid || obj[this._idAttr] || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of `filter`.
    where: function(attrs) {
      if (_.isEmpty(attrs)) return [];
      return this.filter(function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Smartly update a collection with a change set of models, adding,
    // removing, and merging as necessary.
    update: function(models, options) {
      options = _.extend({add: true, merge: true, remove: true}, options);
      if (options.parse) models = this.parse(models, options);
      var model, i, l, existing;
      var add = [], remove = [], modelMap = {};

      // Allow a single model (or no argument) to be passed.
      if (!_.isArray(models)) models = models ? [models] : [];

      // Proxy to `add` for this case, no need to iterate...
      if (options.add && !options.remove) return this.add(models, options);

      // Determine which models to add and merge, and which to remove.
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i];
        existing = this.get(model);
        if (options.remove && existing) modelMap[existing.cid] = true;
        if ((options.add && !existing) || (options.merge && existing)) {
          add.push(model);
        }
      }
      if (options.remove) {
        for (i = 0, l = this.models.length; i < l; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) remove.push(model);
        }
      }

      // Remove models (if applicable) before we add and merge the rest.
      if (remove.length) this.remove(remove, options);
      if (add.length) this.add(add, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any `add` or `remove` events. Fires `reset` when finished.
    reset: function(models, options) {
      options || (options = {});
      if (options.parse) models = this.parse(models, options);
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models.slice();
      this._reset();
      if (models) this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `update: true` is passed, the response
    // data will be passed through the `update` method instead of `reset`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(collection, resp, options) {
        var method = options.update ? 'update' : 'reset';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Reset all internal state. Called when the collection is reset.
    _reset: function() {
      this.length = 0;
      this.models.length = 0;
      this._byId  = {};
    },

    // Prepare a model or hash of attributes to be added to this collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) return false;
      return model;
    },

    // Internal method to remove a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    },

    sortedIndex: function (model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (!callback) callback = this[name];
      Backbone.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        callback && callback.apply(this, args);
        this.trigger.apply(this, ['route:' + name].concat(args));
        this.trigger('route', name, args);
        Backbone.history.trigger('route', this, name, args);
      }, this));
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on URL fragments. If the
  // browser does not support `onhashchange`, falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Backbone.View
  // -------------

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    var success = options.success;
    options.success = function(resp) {
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };

    var error = options.error;
    options.error = function(xhr) {
      if (error) error(model, xhr, options);
      model.trigger('error', model, xhr, options);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

}).call(this);
