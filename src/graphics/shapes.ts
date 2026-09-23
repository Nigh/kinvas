/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

/**
 * Basic abstract geometric primitives that can be drawn using the Renderer
 * classes. These are dumb data structures- the actual code used to draw
 * them is implemented as part of the specific Renderer.
 */

import { Angle, BBox, Vec2 } from "../base/math";
import { Color } from "../base/color";

type OptionalDefaultColor = Color | false | null;

/** A filled circle */
export class Circle {
    /**
     * Create a filled circle
     * @param center - center of circle
     * @param radius - circle radius
     * @param color - fill color
     */
    constructor(
        public center: Vec2,
        public radius: number,
        public color: OptionalDefaultColor,
    ) {}
}

/** A stroked circular arc */
export class Arc {
    /**
     * Create a stroked arc
     * @param center - center of arc circle
     * @param radius - arc circle radius
     * @param start_angle - arc start angle
     * @param end_angle - arc end angle
     * @param color - stroke color
     */
    constructor(
        public center: Vec2,
        public radius: number,
        public start_angle: Angle,
        public end_angle: Angle,
        public width: number,
        public color: OptionalDefaultColor,
    ) {}
}

/** Stroked polyline */
export class Polyline {
    /**
     * Create a stroked polyline
     * @param points - line segment points
     * @param width - thickness of the rendered lines
     * @param color - stroke color
     */
    constructor(
        public points: Vec2[],
        public width: number,
        public color: OptionalDefaultColor,
    ) {}

    /**
     * Create a rectangular outline from a bounding box.
     * @param bb
     * @param width - thickness of the rendered lines
     * @param color - fill color
     */
    static from_BBox(bb: BBox, width: number, color: Color) {
        return new Polyline(
            [
                bb.top_left,
                bb.top_right,
                bb.bottom_right,
                bb.bottom_left,
                bb.top_left,
            ],
            width,
            color,
        );
    }
}

/** Filled polygon */
export class Polygon {
    vertices: Float32Array;

    /**
     * Create a filled polygon
     * @param points - point cloud representing the polygon
     * @param color - fill color
     */
    constructor(
        public points: Vec2[],
        public color: OptionalDefaultColor,
    ) {}

    /**
     * Create a filled polygon from a bounding box.
     * @param bb
     * @param color - fill color
     */
    static from_BBox(bb: BBox, color: Color) {
        return new Polygon(
            [bb.top_left, bb.top_right, bb.bottom_right, bb.bottom_left],
            color,
        );
    }
}

export type Shape = Circle | Arc | Polygon | Polyline;

const outline_width = 0.15;

export function circle_outline(circle: Circle): Polyline {
    const points = Array.from({ length: 33 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        return new Vec2(
            circle.center.x + Math.cos(angle) * circle.radius,
            circle.center.y + Math.sin(angle) * circle.radius,
        );
    });
    return new Polyline(
        points,
        Math.min(outline_width, circle.radius / 2),
        circle.color,
    );
}

export function polygon_outline(polygon: Polygon): Polyline {
    return new Polyline(
        polygon.points.length ? [...polygon.points, polygon.points[0]!] : [],
        outline_width,
        polygon.color,
    );
}

export function polyline_outline(line: Polyline): Polyline[] {
    if (line.points.length < 2 || line.width <= 0) {
        return [line];
    }

    const points = line.points.filter(
        (point, index) => index === 0 || !point.equals(line.points[index - 1]),
    );
    const closed = points[0]!.equals(points.at(-1));
    if (closed) points.pop();
    if (points.length < 2) return [line];

    const half_width = line.width / 2;
    const edge_width = Math.min(outline_width, line.width / 4);
    const offsets = points.map((point, index) => {
        const previous_index = index === 0 ? points.length - 1 : index - 1;
        const next_index = index === points.length - 1 ? 0 : index + 1;
        const previous =
            !closed && index === 0
                ? null
                : point.sub(points[previous_index]!).normal.normalize();
        const next =
            !closed && index === points.length - 1
                ? null
                : points[next_index]!.sub(point).normal.normalize();

        if (!previous) return next!.multiply(half_width);
        if (!next) return previous.multiply(half_width);

        const sum = previous.add(next);
        if (sum.squared_magnitude < 1e-12) {
            return next.multiply(half_width);
        }
        const miter = sum.normalize();
        const alignment = Math.abs(miter.x * next.x + miter.y * next.y);
        return miter.multiply(
            Math.min(half_width / Math.max(alignment, 0.25), half_width * 4),
        );
    });
    const left = points.map((point, index) => point.add(offsets[index]!));
    const right = points.map((point, index) => point.sub(offsets[index]!));

    return [
        new Polyline(
            closed ? [...left, left[0]!] : left,
            edge_width,
            line.color,
        ),
        new Polyline(
            closed ? [...right, right[0]!] : right,
            edge_width,
            line.color,
        ),
        ...(closed
            ? []
            : [
                  new Polyline([left[0]!, right[0]!], edge_width, line.color),
                  new Polyline(
                      [left.at(-1)!, right.at(-1)!],
                      edge_width,
                      line.color,
                  ),
              ]),
    ];
}
