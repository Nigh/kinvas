import { assert } from "chai";
import { KicadPCB } from "../../src/kicad/board";
import { Net } from "../../src/kicad/common";
import theme from "../../src/kicanvas/themes/kicad-default";
import { KiCanvasSelectEvent } from "../../src/viewers/base/events";
import { LayerSet } from "../../src/viewers/board/layers";
import { BoardViewer } from "../../src/viewers/board/viewer";
import source from "./files/footprint-pads.kicad_pcb";

// State transitions do not require a GPU or viewport.
class SelectionViewer extends BoardViewer {
    protected override paint_selected() {}
}

suite("board selection", function () {
    test("footprints and nets stay exclusive and preserve layer focus", function () {
        const board = new KicadPCB("selection.kicad_pcb", source);
        const viewer = new SelectionViewer(
            document.createElement("canvas"),
            false,
            theme.board,
        );
        viewer.document = board;
        viewer.layers = new LayerSet(board, theme.board);
        const events: KiCanvasSelectEvent[] = [];
        viewer.addEventListener(KiCanvasSelectEvent.type, (event) =>
            events.push(event),
        );
        const footprint = board.footprints.find((item) => item.pads.length)!;
        const net = new Net('(net 1 "GND")');
        board.nets.push(net);
        footprint.pads[0]!.net = net;
        footprint.pads[0]!.layers = ["*.Cu"];
        const layer = viewer.layers.by_name(footprint.layer)!;
        layer.visible = false;

        try {
            viewer.select(footprint);
            assert.strictEqual(viewer.selected?.context, footprint);
            assert.isNull(viewer.selected_net);
            assert.isTrue(layer.visible);
            assert.isTrue(layer.highlighted);

            viewer.highlight_net(net.number);
            assert.isNull(viewer.selected);
            assert.equal(viewer.selected_net, net.number);
            assert.isTrue(layer.highlighted);
            assert.strictEqual(events.at(-1)!.detail.item, net);
            assert.strictEqual(events.at(-1)!.detail.previous, footprint);
            assert.lengthOf(events, 2);

            viewer.select(footprint.unique_id!);
            assert.isNull(viewer.selected_net);
            assert.strictEqual(events.at(-1)!.detail.previous, net);
            viewer.highlight_net(net.number);
            viewer.select(null);
            assert.isNull(viewer.selected);
            assert.isNull(viewer.selected_net);
            assert.isFalse(layer.highlighted);
            assert.isUndefined(events.at(-1)!.detail.item);
            assert.strictEqual(events.at(-1)!.detail.previous, net);
            assert.lengthOf(events, 5);
        } finally {
            viewer.layers.dispose();
            viewer.dispose();
        }
    });
});
