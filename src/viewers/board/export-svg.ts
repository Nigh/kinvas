/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

/**
 * SVG export for animated and static board views.
 */

import { BBox } from "../../base/math";
import { NullRenderer, NullRenderLayer } from "../../graphics/null-renderer";
import type { Arc, Circle, Polygon, Polyline } from "../../graphics/shapes";
import type { KicadPCB } from "../../kicad/board";
import {
    LayoutTimeline,
    base_layer_name,
    bucket_of,
    bucket_layer_name,
} from "./animation";
import { LayerSet } from "./layers";
import {
    BoardPainter,
    type BoardSketchModes,
    type BoardVisibleModes,
} from "./painter";

export interface SVGExportOptions {
    /** Include layers that are hidden in the viewer. Defaults to false. */
    include_hidden?: boolean;
    /** Export bounds in board coordinates. Defaults to board extents. */
    bbox?: BBox;
    /** Object types rendered as outlines. */
    sketch_modes?: Readonly<Partial<BoardSketchModes>>;
    /** Object types omitted from the viewer. */
    visible_modes?: Readonly<Partial<BoardVisibleModes>>;
    /** Omit the background rectangle to preserve alpha. */
    transparent_background?: boolean;
}

interface ExportLayer {
    layer: NullRenderLayer;
    name: string;
    bucket: number | null;
    opacity: number;
}

/**
 * Renders the board with the layout animation applied.
 */
export function export_layout_animation_svg(
    board: KicadPCB,
    layer_set: LayerSet,
    theme: ConstructorParameters<typeof LayerSet>[1],
    options: SVGExportOptions = {},
): string {
    const timeline = new LayoutTimeline(board);
    const export_layers = paint_layers(
        board,
        theme,
        timeline,
        options.sketch_modes,
        options.visible_modes,
    );
    const layers: ExportLayer[] = [];

    for (const view_layer of export_layers.in_display_order()) {
        const render_layer = view_layer.graphics as NullRenderLayer | undefined;
        if (!render_layer?.shapes.length) {
            continue;
        }
        const source = layer_set.by_name(base_layer_name(view_layer.name));
        if (!options.include_hidden && !source?.visible) {
            continue;
        }
        layers.push({
            layer: render_layer,
            name: view_layer.name,
            bucket: bucket_of(view_layer.name),
            opacity: source?.opacity ?? 1,
        });
    }

    return build_svg(board, export_layers, theme, layers, options, timeline);
}

/**
 * Renders a static board matching current layer visibility and opacity.
 * Passing the active timeline freezes the layout animation at its current time.
 */
export function export_board_svg(
    board: KicadPCB,
    layer_set: LayerSet,
    theme: ConstructorParameters<typeof LayerSet>[1],
    options: SVGExportOptions = {},
    timeline: LayoutTimeline | null = null,
): string {
    const export_layers = paint_layers(
        board,
        theme,
        timeline,
        options.sketch_modes,
        options.visible_modes,
    );
    const layers: ExportLayer[] = [];

    for (const view_layer of export_layers.in_display_order()) {
        const render_layer = view_layer.graphics as NullRenderLayer | undefined;
        if (!render_layer?.shapes.length) {
            continue;
        }
        const source =
            layer_set.by_name(view_layer.name) ??
            layer_set.by_name(base_layer_name(view_layer.name));
        if (!options.include_hidden && !source?.visible) {
            continue;
        }
        const opacity =
            (source?.opacity ?? 1) * (source?.animation_opacity ?? 1);
        if (!options.include_hidden && opacity <= 0) {
            continue;
        }
        layers.push({
            layer: render_layer,
            name: view_layer.name,
            bucket: null,
            opacity,
        });
    }

    return build_svg(board, export_layers, theme, layers, options);
}

function paint_layers(
    board: KicadPCB,
    theme: ConstructorParameters<typeof LayerSet>[1],
    timeline: LayoutTimeline | null,
    sketch_modes?: Readonly<Partial<BoardSketchModes>>,
    visible_modes?: Readonly<Partial<BoardVisibleModes>>,
) {
    const layers = new LayerSet(board, theme);
    const painter = new BoardPainter(new NullRenderer(), layers, theme);
    painter.timeline = timeline;
    painter.sketch_modes = { ...painter.sketch_modes, ...sketch_modes };
    painter.visible_modes = { ...painter.visible_modes, ...visible_modes };
    painter.paint(board);
    return layers;
}

function build_svg(
    board: KicadPCB,
    export_layers: LayerSet,
    theme: ConstructorParameters<typeof LayerSet>[1],
    layers: ExportLayer[],
    options: SVGExportOptions,
    timeline?: LayoutTimeline,
) {
    let bbox = options.bbox?.copy() ?? board.edge_cuts_bbox;
    if (!bbox.valid) {
        bbox = export_layers.bbox;
    }
    if (!options.bbox) {
        bbox = bbox.grow(Math.max(bbox.w, bbox.h) * 0.05);
    }

    const background = theme.background?.to_css() ?? "#000";
    const parts = [
        `<svg xmlns="http://www.w3.org/2000/svg" ` +
            `viewBox="${fmt(bbox.x)} ${fmt(bbox.y)} ${fmt(bbox.w)} ${fmt(
                bbox.h,
            )}" width="800">`,
    ];
    if (!options.transparent_background) {
        parts.push(
            `<rect x="${fmt(bbox.x)}" y="${fmt(bbox.y)}" ` +
                `width="${fmt(bbox.w)}" height="${fmt(bbox.h)}" ` +
                `fill="${background}"/>`,
        );
    }

    for (const { layer, name, bucket, opacity } of layers) {
        const begin =
            timeline && bucket != null
                ? timeline.time_for_bucket(bucket)
                : null;
        const visibility =
            begin == null ? `visibility="visible"` : `visibility="hidden"`;
        parts.push(
            `<g data-layer="${escape_attribute(name)}" ${visibility} ` +
                `opacity="${fmt(opacity)}">`,
        );
        if (begin != null) {
            parts.push(
                `<set attributeName="visibility" to="visible" ` +
                    `begin="${begin.toFixed(3)}s" dur="indefinite" ` +
                    `repeatCount="indefinite"/>`,
            );
        }
        for (const shape of layer.shapes) {
            parts.push(shape_to_svg(shape));
        }
        parts.push(`</g>`);
    }

    if (timeline?.total_buckets) {
        parts.push(
            `<animate attributeName="opacity" values="1" ` +
                `dur="${timeline.duration.toFixed(3)}s" ` +
                `repeatCount="indefinite"/>`,
        );
    }

    parts.push(`</svg>`);
    return parts.join("\n");
}

function css_color(color: { to_css(): string } | false | null): string {
    return color ? color.to_css() : "none";
}

function shape_to_svg(shape: Circle | Arc | Polygon | Polyline): string {
    if ("radius" in shape && "center" in shape && !("points" in shape)) {
        if ("start_angle" in shape) {
            return arc_to_svg(shape as Arc);
        }
        const circle = shape as Circle;
        return (
            `<circle cx="${fmt(circle.center.x)}" ` +
            `cy="${fmt(circle.center.y)}" r="${fmt(circle.radius)}" ` +
            `fill="${css_color(circle.color)}"/>`
        );
    }
    if ("points" in shape) {
        const points = (shape as Polyline | Polygon).points
            .map((point) => `${fmt(point.x)},${fmt(point.y)}`)
            .join(" ");
        if ("width" in shape) {
            const line = shape as Polyline;
            return (
                `<polyline points="${points}" fill="none" ` +
                `stroke="${css_color(line.color)}" ` +
                `stroke-width="${fmt(line.width)}" stroke-linecap="round"/>`
            );
        }
        const polygon = shape as Polygon;
        return (
            `<polygon points="${points}" ` +
            `fill="${css_color(polygon.color)}"/>`
        );
    }
    return "";
}

function arc_to_svg(arc: Arc): string {
    const points: string[] = [];
    const start = arc.start_angle.radians;
    const end = arc.end_angle.radians;
    const span = end - start;
    const steps = Math.max(4, Math.ceil(Math.abs(span) / (Math.PI / 16)));
    for (let i = 0; i <= steps; i++) {
        const angle = start + (span * i) / steps;
        points.push(
            `${fmt(arc.center.x + Math.cos(angle) * arc.radius)},` +
                `${fmt(arc.center.y + Math.sin(angle) * arc.radius)}`,
        );
    }
    return (
        `<polyline points="${points.join(" ")}" fill="none" ` +
        `stroke="${css_color(arc.color)}" ` +
        `stroke-width="${fmt(arc.width)}" stroke-linecap="round"/>`
    );
}

function escape_attribute(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;");
}

function fmt(n: number): string {
    return Number(n.toFixed(4)).toString();
}

export { bucket_layer_name };
