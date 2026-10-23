/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { later } from "../../base/async";
import { no_self_recursion } from "../../base/functions";
import { BBox, Vec2 } from "../../base/math";
import { is_string } from "../../base/types";
import { Color, Polygon, Polyline, Renderer } from "../../graphics";
import { WebGL2Renderer } from "../../graphics/webgl";
import type { BoardTheme } from "../../kicad";
import * as kicad_common from "../../kicad/common";
import * as board_items from "../../kicad/board";
import { DocumentViewer } from "../base/document-viewer";
import { KiCanvasSelectEvent } from "../base/events";
import {
    LayoutAnimationController,
    LayoutTimeline,
    base_layer_name,
} from "./animation";
import {
    copper_layers_between,
    LayerNames,
    LayerSet,
    ViewLayer,
} from "./layers";
import {
    BoardPainter,
    type BoardObjectType,
    type BoardSketchModes,
    type BoardVisibleModes,
    type BoardVisibleType,
} from "./painter";

export type ContextMenuCallback = (
    screenX: number,
    screenY: number,
    items: Map<string, unknown>,
    onSelect: (item: unknown) => void,
) => void;

export class BoardViewer extends DocumentViewer<
    board_items.KicadPCB,
    BoardPainter,
    LayerSet,
    BoardTheme
> {
    #contextMenuCallback: ContextMenuCallback | null = null;
    #export_bbox: BBox | null = null;
    #selected_bbox: BBox | null = null;
    #selected_net: number | null = null;

    get selected_net(): number | null {
        return this.#selected_net;
    }

    override get selected(): BBox | null {
        return this.#selected_bbox;
    }

    override set selected(bbox: BBox | null) {
        const footprint = bbox?.context;
        if (footprint instanceof board_items.Footprint) {
            this.activate_selection_layer(footprint.layer);
        }
        if (!bbox) {
            this.layers.highlight(null);
        }
        this.set_selection(bbox, null);
    }

    @no_self_recursion
    private set_selection(bbox: BBox | null, net: number | null) {
        const previous =
            this.#selected_net === null
                ? this.#selected_bbox?.context
                : this.board.nets.find(
                      (item) => item.number === this.#selected_net,
                  );
        this.#selected_bbox = bbox?.copy() ?? null;
        this.#selected_net = net;
        this.dispatchEvent(
            new KiCanvasSelectEvent({
                item:
                    net === null
                        ? this.#selected_bbox?.context
                        : this.board.nets.find((item) => item.number === net),
                previous,
            }),
        );
        later(() => this.paint_selected());
    }

    private activate_selection_layer(name: string) {
        const layer = this.layers.by_name(name);
        if (layer) {
            layer.visible = true;
            this.layers.highlight(layer);
        }
    }
    #track_opacity = 1;
    #via_opacity = 1;
    #zone_opacity = 1;
    #pad_opacity = 1;
    #pad_hole_opacity = 1;
    #grid_opacity = 1;
    #page_opacity = 1;
    #sketch_modes: BoardSketchModes = {
        tracks: false,
        vias: false,
        pads: false,
        holes: false,
        zones: false,
    };
    #visible_modes: BoardVisibleModes = {
        tracks: true,
        vias: true,
        pads: true,
        holes: true,
        zones: true,
        grid: true,
        page: true,
    };

    get board(): board_items.KicadPCB {
        return this.document;
    }

    set_export_bbox(bbox: BBox | null) {
        this.#export_bbox = bbox?.copy() ?? null;
        this.paint_selected();
    }

    protected override paint_selected() {
        if (this.#selected_net !== null) {
            this.painter.paint_net(this.board, this.#selected_net);
            this.draw();
            return;
        }
        const layer = this.layers.overlay;
        layer.clear();
        if (this.selected || this.#export_bbox) {
            this.renderer.start_layer(layer.name);
            if (this.selected) {
                const bbox = this.selected.copy().grow(this.selected.w * 0.1);
                this.renderer.line(
                    Polyline.from_BBox(bbox, 0.254, Color.white),
                );
                this.renderer.polygon(Polygon.from_BBox(bbox, Color.white));
            }
            if (this.#export_bbox) {
                this.renderer.line(
                    Polyline.from_BBox(this.#export_bbox, 0.254, Color.white),
                );
            }
            layer.graphics = this.renderer.end_layer();
            layer.graphics.composite_operation = "overlay";
        }
        this.draw();
    }

    set contextMenuCallback(callback: ContextMenuCallback | null) {
        this.#contextMenuCallback = callback;
    }

    protected override create_renderer(canvas: HTMLCanvasElement): Renderer {
        const renderer = new WebGL2Renderer(canvas);
        return renderer;
    }

    protected override create_painter() {
        return new BoardPainter(this.renderer, this.layers, this.theme);
    }

    protected override on_painter_created(painter: BoardPainter) {
        painter.sketch_modes = this.#sketch_modes;
        painter.visible_modes = this.#visible_modes;
        this.layers.by_name(LayerNames.grid)!.visible =
            this.#visible_modes.grid;
        this.layers.by_name(LayerNames.drawing_sheet)!.visible =
            this.#visible_modes.page;
        if (this.#animation_timeline) {
            painter.timeline = this.#animation_timeline;
        }
    }

    protected override on_document_loaded() {
        if (this.#animation_controller) {
            // The document changed, rebuild the animation from scratch.
            this.#animation_controller.dispose();
            this.#animation_controller = null;
            this.#animation_timeline = null;
            this.paint();
            this.draw();
        }
    }

    #animation_timeline: LayoutTimeline | null = null;
    #animation_controller: LayoutAnimationController | null = null;

    /**
     * The active layout animation controller, or null if the layout
     * animation hasn't been started yet.
     */
    get layout_animation(): LayoutAnimationController | null {
        return this.#animation_controller;
    }

    /**
     * Turns the layout animation on: repaints the board with animatable
     * items sorted into time-bucketed layers. Returns the animation
     * controller, or null if there's nothing to animate.
     */
    enable_layout_animation(): LayoutAnimationController | null {
        const timeline = new LayoutTimeline(this.board);

        if (!timeline.total_buckets) {
            return null;
        }

        this.#animation_timeline = timeline;
        timeline.current_time = 0;

        this.repaint_preserving_layer_state();

        this.#animation_controller = new LayoutAnimationController(
            this,
            timeline,
        );
        this.#animation_controller.seek(0);
        return this.#animation_controller;
    }

    /**
     * Turns the layout animation off, returning to a statically painted
     * board.
     */
    disable_layout_animation() {
        if (!this.#animation_timeline) {
            return;
        }
        this.#animation_controller?.dispose();
        this.#animation_controller = null;
        this.#animation_timeline = null;
        this.paint();
        this.draw();
    }

    protected override create_layer_set() {
        return new LayerSet(this.board, this.theme);
    }
    public override paint() {
        const order = this.layers
            ? Array.from(
                  (this.layers as LayerSet).in_ui_order(),
                  (layer) => layer.name,
              )
            : null;
        super.paint();
        if (!this.layers) return;
        const available = Array.from(
            (this.layers as LayerSet).in_ui_order(),
            (layer) => layer.name,
        );
        if (
            order &&
            order.length === available.length &&
            order.every((name) => available.includes(name))
        ) {
            (this.layers as LayerSet).set_ui_order(order);
        }
        this.apply_object_opacities();
    }

    protected override get grid_origin() {
        return this.board.setup?.grid_origin ?? new Vec2(0, 0);
    }

    protected override on_pick(
        mouse: Vec2,
        items: Generator<{ layer: ViewLayer; bbox: BBox }, void, unknown>,
    ): void {
        const selectableItems = new Map<string, unknown>();
        for (const { bbox } of items) {
            const item = bbox.context;
            if (item instanceof board_items.Footprint) {
                selectableItems.set(`Footprint: ${item.reference}`, item);
            } else if (kicad_common.isNetInfo(item)) {
                selectableItems.set(`Net: ${item.netname}`, item);
            } else {
                console.log(item);
            }
        }

        if (selectableItems.size === 0) {
            this.select(null);
        } else if (selectableItems.size === 1 || !this.#contextMenuCallback) {
            this.handleItemClick(selectableItems.values().next().value);
        } else {
            const { x, y } = this.viewport.camera.world_to_screen(mouse);
            this.#contextMenuCallback(x, y, selectableItems, (selected) => {
                this.handleItemClick(selected);
            });
        }
    }

    handleItemClick(item: unknown) {
        if (item instanceof board_items.Footprint) {
            this.select(item);
        } else if (kicad_common.isNetInfo(item)) {
            this.highlight_net(kicad_common.getNetNumber(item));
        }
    }

    override select(item: board_items.Footprint | string | BBox | null) {
        // If item is a string, find the footprint by uuid or reference.
        if (is_string(item)) {
            item = this.board.find_footprint(item);
        }

        // If it's a footprint, use the footprint's nominal bounding box.
        if (item instanceof board_items.Footprint) {
            item = item.bbox;
        }

        super.select(item);
    }

    highlight_net(net: number) {
        if (!this.board.nets.some((item) => item.number === net)) {
            return;
        }
        const contains_net = (name: string) => {
            const matches = (layers: string[]) =>
                layers.includes(name) ||
                layers.includes("*.Cu") ||
                (layers.includes("F&B.Cu") &&
                    (name === LayerNames.f_cu || name === LayerNames.b_cu));
            return (
                this.board.segments.some(
                    (item) => item.net === net && item.layer === name,
                ) ||
                this.board.vias.some((item) => {
                    if (item.net !== net) return false;
                    if (!item.layers?.length) return true;
                    for (const layer of copper_layers_between(
                        item.layers[0]!,
                        item.layers[1]!,
                    )) {
                        if (layer === name) return true;
                    }
                    return false;
                }) ||
                this.board.zones.some(
                    (item) =>
                        item.net === net &&
                        matches(item.layers ?? [item.layer]),
                ) ||
                this.board.footprints.some(
                    (footprint) =>
                        footprint.pads.some(
                            (pad) =>
                                pad.net?.number === net && matches(pad.layers),
                        ) ||
                        footprint.zones.some(
                            (item) =>
                                item.net === net &&
                                matches(item.layers ?? [item.layer]),
                        ),
                )
            );
        };
        let first: ViewLayer | undefined;
        let current: ViewLayer | undefined;
        for (const layer of this.layers.copper_layers()) {
            if (!contains_net(layer.name)) continue;
            first ??= layer;
            if (layer.highlighted) {
                current = layer;
                break;
            }
        }
        const layer = current ?? first;
        if (layer) this.activate_selection_layer(layer.name);
        this.set_selection(null, net);
    }

    private set_layers_opacity(
        layers: Iterable<ViewLayer>,
        opacity: number,
        draw = true,
    ) {
        const names = new Set(Array.from(layers, (layer) => layer.name));
        for (const layer of this.layers.in_order()) {
            if (names.has(base_layer_name(layer.name))) {
                layer.opacity = opacity;
            }
        }
        if (draw) {
            this.draw();
        }
    }

    private apply_object_opacities() {
        const layers = this.layers as LayerSet;
        this.set_layers_opacity(
            layers.copper_layers(),
            this.#track_opacity,
            false,
        );
        this.set_layers_opacity(layers.via_layers(), this.#via_opacity, false);
        this.set_layers_opacity(
            layers.zone_layers(),
            this.#zone_opacity,
            false,
        );
        this.set_layers_opacity(layers.pad_layers(), this.#pad_opacity, false);
        this.set_layers_opacity(
            layers.pad_hole_layers(),
            this.#pad_hole_opacity,
            false,
        );
        this.set_layers_opacity(
            layers.grid_layers(),
            this.#grid_opacity,
            false,
        );
        const page = layers.by_name(LayerNames.drawing_sheet);
        if (page) {
            page.opacity = this.#page_opacity;
        }
    }

    set track_opacity(value: number) {
        this.#track_opacity = value;
        this.set_layers_opacity(
            (this.layers as LayerSet).copper_layers(),
            value,
        );
    }

    set via_opacity(value: number) {
        this.#via_opacity = value;
        this.set_layers_opacity((this.layers as LayerSet).via_layers(), value);
    }

    set zone_opacity(value: number) {
        this.#zone_opacity = value;
        this.set_layers_opacity((this.layers as LayerSet).zone_layers(), value);
    }

    set pad_opacity(value: number) {
        this.#pad_opacity = value;
        this.set_layers_opacity((this.layers as LayerSet).pad_layers(), value);
    }

    set pad_hole_opacity(value: number) {
        this.#pad_hole_opacity = value;
        this.set_layers_opacity(
            (this.layers as LayerSet).pad_hole_layers(),
            value,
        );
    }

    set grid_opacity(value: number) {
        this.#grid_opacity = value;
        this.set_layers_opacity((this.layers as LayerSet).grid_layers(), value);
    }

    set page_opacity(value: number) {
        this.#page_opacity = value;
        this.layers.by_name(LayerNames.drawing_sheet)!.opacity = value;
        this.draw();
    }

    get sketch_modes(): Readonly<BoardSketchModes> {
        return this.#sketch_modes;
    }

    get visible_modes(): Readonly<BoardVisibleModes> {
        return this.#visible_modes;
    }

    visible_for(object: BoardVisibleType): boolean {
        return this.#visible_modes[object];
    }

    set_visible(object: BoardVisibleType, value: boolean) {
        if (value === this.#visible_modes[object]) return;
        this.#visible_modes[object] = value;

        if (object === "grid" || object === "page") {
            const layer_name =
                object === "grid" ? LayerNames.grid : LayerNames.drawing_sheet;
            this.layers.by_name(layer_name)!.visible = value;
            this.draw();
            return;
        }

        this.repaint_preserving_layer_state();
    }

    sketch_mode_for(object: BoardObjectType): boolean {
        return this.#sketch_modes[object];
    }

    set_sketch_mode(object: BoardObjectType, value: boolean) {
        if (value === this.#sketch_modes[object]) {
            return;
        }

        this.#sketch_modes[object] = value;
        this.repaint_preserving_layer_state();
    }

    private repaint_preserving_layer_state() {
        const opacities = new Map(
            Array.from(this.layers.in_order(), (layer) => [
                layer.name,
                layer.opacity,
            ]),
        );
        const ui_layers = Array.from((this.layers as LayerSet).in_ui_order());
        const visibility = new Map(
            ui_layers.map((layer) => [layer.name, layer.visible]),
        );
        const highlighted = ui_layers.find((layer) => layer.highlighted)?.name;

        this.paint();

        for (const layer of this.layers.in_order()) {
            layer.opacity = opacities.get(layer.name) ?? layer.opacity;
        }
        for (const layer of (this.layers as LayerSet).in_ui_order()) {
            layer.visible = visibility.get(layer.name) ?? layer.visible;
        }
        if (highlighted) {
            this.layers.highlight(highlighted);
        }
        if (this.#animation_controller) {
            this.#animation_controller.seek(this.#animation_controller.time);
        } else {
            this.draw();
        }
    }

    zoom_to_board() {
        const edge_cuts = this.layers.by_name(LayerNames.edge_cuts)!;
        const board_bbox = edge_cuts.bbox;
        this.viewport.camera.bbox = board_bbox.grow(board_bbox.w * 0.1);
    }
}
