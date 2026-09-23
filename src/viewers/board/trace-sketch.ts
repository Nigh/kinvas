/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { Arc, Vec2 } from "../../base/math";
import { ArcSegment, LineSegment } from "../../kicad/board";

type TrackItem = LineSegment | ArcSegment;

export interface TrackSketchPath {
    points: Vec2[];
    width: number;
}

interface TrackEdge extends TrackSketchPath {
    start: string;
    end: string;
    visited: boolean;
}

const point_key = (point: Vec2) => `${point.x},${point.y}`;

function points_for(item: TrackItem): Vec2[] {
    if (item instanceof ArcSegment) {
        const points = Arc.from_three_points(
            item.start,
            item.mid,
            item.end,
            item.width,
        ).to_polyline();
        points[0] = item.start;
        points[points.length - 1] = item.end;
        return points;
    }
    return [item.start, item.end];
}

/** Join connected, equal-width traces into paths before outlining them. */
export function connected_track_paths(items: readonly TrackItem[]) {
    const groups = new Map<string, TrackEdge[]>();
    for (const item of items) {
        const points = points_for(item);
        const edge: TrackEdge = {
            points,
            width: item.width,
            start: point_key(points[0]!),
            end: point_key(points.at(-1)!),
            visited: false,
        };
        const key = `${item.layer}\0${item.net}\0${item.width}`;
        const group = groups.get(key) ?? [];
        group.push(edge);
        groups.set(key, group);
    }

    const paths: TrackSketchPath[] = [];
    for (const edges of groups.values()) {
        const adjacency = new Map<string, TrackEdge[]>();
        for (const edge of edges) {
            for (const endpoint of [edge.start, edge.end]) {
                const connected = adjacency.get(endpoint) ?? [];
                connected.push(edge);
                adjacency.set(endpoint, connected);
            }
        }

        const walk = (first: TrackEdge, start: string) => {
            const points: Vec2[] = [];
            let edge: TrackEdge | undefined = first;
            let endpoint = start;
            while (edge && !edge.visited) {
                edge.visited = true;
                const forward = edge.start === endpoint;
                const segment = forward
                    ? edge.points
                    : [...edge.points].reverse();
                points.push(...(points.length ? segment.slice(1) : segment));
                endpoint = forward ? edge.end : edge.start;
                const connected = adjacency.get(endpoint) ?? [];
                edge =
                    connected.length === 2
                        ? connected.find((next) => !next.visited)
                        : undefined;
            }
            if (points.length > 1) {
                paths.push({ points, width: first.width });
            }
        };

        for (const [endpoint, connected] of adjacency) {
            if (connected.length === 2) continue;
            for (const edge of connected) {
                if (!edge.visited) walk(edge, endpoint);
            }
        }
        for (const edge of edges) {
            if (!edge.visited) walk(edge, edge.start);
        }
    }
    return paths;
}
