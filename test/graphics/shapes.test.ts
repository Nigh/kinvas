/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { assert } from "chai";
import { Vec2 } from "../../src/base/math";
import { Polyline, polyline_outline } from "../../src/graphics/shapes";

suite("graphics polyline outlines", function () {
    test("joins open corners without non-finite geometry", function () {
        const outline = polyline_outline(
            new Polyline(
                [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 3)],
                0.4,
                null,
            ),
        );

        assert.lengthOf(outline, 4);
        assert.lengthOf(outline[0]!.points, 3);
        assert.isTrue(
            outline
                .flatMap((line) => line.points)
                .every(
                    (point) =>
                        Number.isFinite(point.x) && Number.isFinite(point.y),
                ),
        );
    });

    test("closes loops without drawing end caps across the interior", function () {
        const outline = polyline_outline(
            new Polyline(
                [
                    new Vec2(0, 0),
                    new Vec2(4, 0),
                    new Vec2(4, 3),
                    new Vec2(0, 3),
                    new Vec2(0, 0),
                ],
                0.4,
                null,
            ),
        );

        assert.lengthOf(outline, 2);
        for (const edge of outline) {
            assert.isTrue(edge.points[0]!.equals(edge.points.at(-1)));
            for (const point of edge.points) {
                assert.isTrue(Number.isFinite(point.x));
                assert.isTrue(Number.isFinite(point.y));
            }
        }
    });

    test("ignores duplicate points and bounds near-reversal miters", function () {
        const outline = polyline_outline(
            new Polyline(
                [
                    new Vec2(0, 0),
                    new Vec2(1, 0),
                    new Vec2(1, 0),
                    new Vec2(0.001, 0.01),
                ],
                0.4,
                null,
            ),
        );

        assert.isTrue(
            outline
                .flatMap((line) => line.points)
                .every(
                    (point) =>
                        Number.isFinite(point.x) && Number.isFinite(point.y),
                ),
        );
        assert.isBelow(outline[0]!.points[1]!.magnitude, 2);
    });
});
