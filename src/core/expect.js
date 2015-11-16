'use strict';

//
// Throws an exception if the passed-in value is not a string.
//
function expectString(val) {
    if (!val || typeof val !== 'string') {
        throw new Error("Expected " + typeof(val) + " to be a string.");
    }
}

//
// Throws an exception if the passed-in value is not a function.
//
function expectFunction(val) {
    if (!val || typeof val !== 'function') {
        throw new Error("Expected " + typeof(val) + " to be a function.");
    }
}

//
// Throws an exception if the passed-in value is not an object.
//
function expectObject(val) {
    if (!val || typeof val !== 'object') {
        throw new Error("Expected " + typeof(val) + " to be an object.");
    }
}

//
// Throws an exception if the passed-in value is not an array.
//
function expectArray(val) {        
    if (!val || Object.prototype.toString.call(val) !== '[object Array]') {
        throw new Error("Expected " + typeof(val) + " to be an array.");
    }
}

module.exports = {
    string: expectString,
    func: expectFunction,
    object: expectObject,
    array: expectArray
};