/*
Simplify.js, a high-performance JS polyline simplification library
mourner.github.io/simplify-js

Copyright (c) 2017, Vladimir Agafonkin
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changes:
 Updated to fit PosData
*/

var xName = 'x';
var yName = 'y';

exports.SetXName = function(name)
{
    xName = name;
}

exports.SetYName = function(name)
{
    yName = name;
}

// to suit your point format, run search/replace for '[xName]' and '[yName]';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)

// square distance between 2 points
function getSqDist(p1, p2) {

    var dx = p1[xName] - p2[xName],
        dy = p1[yName] - p2[yName];

    return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p, p1, p2) {

    var x = p1[xName],
        y = p1[yName],
        dx = p2[xName] - x,
        dy = p2[yName] - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p[xName] - x) * dx + (p[yName] - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2[xName];
            y = p2[yName];

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p[xName] - x;
    dy = p[yName] - y;

    return dx * dx + dy * dy;
}
// rest of the code doesn't care about point format

// basic distance-based simplification
function simplifyRadialDist(points, sqTolerance) {

    var prevPoint = points[0],
        newPoints = [prevPoint],
        point;

    for (var i = 1, len = points.length; i < len; i++) {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance) {
            newPoints.push(point);
            prevPoint = point;
        }
    }

    if (prevPoint !== point) newPoints.push(point);

    return newPoints;
}

// simplification using optimized Douglas-Peucker algorithm with recursion elimination
function simplifyDouglasPeucker(points, sqTolerance) {

    var len = points.length,
        MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
        markers = new MarkerArray(len),
        first = 0,
        last = len - 1,
        stack = [],
        newPoints = [],
        i, maxSqDist, sqDist, index;

    markers[first] = markers[last] = 1;

    while (last) {

        maxSqDist = 0;

        for (i = first + 1; i < last; i++) {
            sqDist = getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            markers[index] = 1;
            stack.push(first, index, index, last);
        }

        last = stack.pop();
        first = stack.pop();
    }

    for (i = 0; i < len; i++) {
        if (markers[i]) newPoints.push(points[i]);
    }

    return newPoints;
}

// both algorithms combined for awesome performance
exports.simplify = function(points, tolerance, highestQuality) 
{

    var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);

    return points;
}

