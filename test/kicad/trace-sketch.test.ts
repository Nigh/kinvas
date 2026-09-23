/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { assert } from "chai";
import { Vec2 } from "../../src/base/math";
import { LineSegment } from "../../src/kicad/board";
import { connected_track_paths } from "../../src/viewers/board/trace-sketch";
import { KicadPCB } from "../../src/kicad/board";
import traces_pcb_src from "./files/traces.kicad_pcb";

function segment(
    start: [number, number],
    end: [number, number],
    net = 1,
    width = 0.25,
    layer = "F.Cu",
) {
    return {
        start: new Vec2(start),
        end: new Vec2(end),
        net,
        width,
        layer,
    } as unknown as LineSegment;
}

suite("board trace sketch paths", function () {
    test("joins contiguous segments regardless of input direction", function () {
        const paths = connected_track_paths([
            segment([1, 0], [1, 1]),
            segment([0, 0], [1, 0]),
        ]);

        assert.lengthOf(paths, 1);
        const points = paths[0]!.points.map((point) => [point.x, point.y]);
        assert.isTrue(
            JSON.stringify(points) ===
                JSON.stringify([
                    [0, 0],
                    [1, 0],
                    [1, 1],
                ]) ||
                JSON.stringify(points) ===
                    JSON.stringify([
                        [1, 1],
                        [1, 0],
                        [0, 0],
                    ]),
        );
    });

    test("keeps nets, widths, and layers in separate routes", function () {
        const paths = connected_track_paths([
            segment([0, 0], [1, 0]),
            segment([1, 0], [2, 0], 2),
            segment([1, 0], [2, 0], 1, 0.5),
            segment([1, 0], [2, 0], 1, 0.25, "B.Cu"),
        ]);

        assert.lengthOf(paths, 4);
    });

    test("handles parsed line and arc tracks with finite points", function () {
        const board = new KicadPCB("traces.kicad_pcb", traces_pcb_src);
        const paths = connected_track_paths(board.segments);

        assert.isNotEmpty(paths);
        assert.isTrue(
            paths
                .flatMap((path) => path.points)
                .every(
                    (point) =>
                        Number.isFinite(point.x) && Number.isFinite(point.y),
                ),
        );
    });
});
