'use strict';

const test = require('tape');

const few = require('../index');

function testArrayInArray(resolving, rejecting) {
  return function (t) {
    const expected = [Symbol(), [Symbol()]];
    t.plan(2);
    few(resolving(expected), (err, actual) => t.same(actual, expected));
    few(rejecting(expected), (actual) => t.same(actual, expected[0]));
  };
}

test('yielding an array of promises', testArrayInArray(
    function* resolving(c) { return yield [Promise.resolve(c[0]), [Promise.resolve(c[1][0])]]; },
    function* rejecting(c) { yield [[Promise.reject(c[0])], Promise.resolve(c[1])]; }));

const resolvingFunction = v => cb => process.nextTick(() => cb(null, v));
const rejectingFunction = v => cb => process.nextTick(() => cb(v));
test('yielding an array of functions', testArrayInArray(
  function* resolving(c) { return yield [resolvingFunction(c[0]), [resolvingFunction(c[1][0])]]; },
  function* rejecting(c) { yield [[rejectingFunction(c[0])], resolvingFunction(c[1])]; }));

test('yielding an array of values', testArrayInArray(
  function* resolving(c) { return yield c; },
  function* rejecting(c) { throw yield c[0]; }));

test('returning an array of values', testArrayInArray(
  function* resolving(c) { yield; return c; },
  function* rejecting(c) { yield; throw c[0]; }));

function* resolvingGenertor(v) {
  return yield resolvingFunction(v);
}
function* rejectingGenertor(v) {
  return yield rejectingFunction(v);
}
test('yielding an array of generators', testArrayInArray(
    function* resolving(c) { return yield [resolvingGenertor(c[0]), [resolvingGenertor(c[1][0])]]; },
    function* rejecting(c) { return yield [[rejectingGenertor(c[0])], [resolvingFunction(c[1][0])]]; }));

test('yielding an array of generator functions', testArrayInArray(
    function* resolving(c) { return yield [function* () {return yield resolvingGenertor(c[0])}, [function* () {return yield resolvingGenertor(c[1][0])}]]; },
    function* rejecting(c) { return yield [[function* () {return yield rejectingGenertor(c[0])}], function* () {return yield resolvingFunction(c[1][0])}]; }));
