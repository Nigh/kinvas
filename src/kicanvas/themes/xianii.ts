/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { Color } from "../../base/color";
import type { Theme } from "../../kicad/theme";

// sRGB equivalents of the dark tokens from:
// https://github.com/Nigh/xianii-theme/blob/main/packages/design-system/tokens.css
const background = Color.from_css("#242424");
const surface = Color.from_css("#161616");
const grid = Color.from_css("#404040");
const text = Color.from_css("#f2f2f2");
const primary = Color.from_css("#ffa1ad");
const secondary = Color.from_css("#d8b0ff");
const accent = Color.from_css("#7fcfc4");
const info = Color.from_css("#7cb3eb");
const success = Color.from_css("#7fc08c");
const warning = Color.from_css("#eebc4a");
const error = Color.from_css("#fa6863");

const theme: Theme = {
    name: "xianii",
    friendly_name: "xianii",
    board: {
        anchor: success,
        aux_items: warning,
        b_adhes: info,
        b_crtyd: secondary,
        b_fab: info,
        b_mask: accent.with_alpha(0.8),
        b_paste: info.with_alpha(0.502),
        b_silks: accent,
        background,
        cmts_user: success,
        copper: {
            b: info,
            f: primary,
            in1: success,
            in10: warning,
            in11: info,
            in12: primary,
            in13: secondary,
            in14: accent,
            in15: error,
            in16: warning,
            in17: success,
            in18: info,
            in19: primary,
            in2: warning,
            in20: secondary,
            in21: accent,
            in22: error,
            in23: warning,
            in24: success,
            in25: info,
            in26: primary,
            in27: secondary,
            in28: accent,
            in29: error,
            in3: accent,
            in30: warning,
            in4: primary,
            in5: secondary,
            in6: info,
            in7: error,
            in8: warning,
            in9: success,
        },
        cursor: text,
        drc_error: error.with_alpha(0.8),
        drc_exclusion: text.with_alpha(0.8),
        drc_warning: warning.with_alpha(0.8),
        dwgs_user: text,
        eco1_user: info,
        eco2_user: primary,
        edge_cuts: success,
        f_adhes: primary,
        f_crtyd: secondary,
        f_fab: secondary,
        f_mask: primary.with_alpha(0.8),
        f_paste: text.with_alpha(0.502),
        f_silks: text,
        footprint_text_invisible: grid,
        grid,
        grid_axes: primary,
        margin: accent,
        no_connect: warning,
        pad_plated_hole: warning,
        pad_through_hole: warning,
        non_plated_hole: success,
        ratsnest: secondary,
        user_1: warning,
        user_2: info,
        user_3: accent,
        user_4: success,
        user_5: text,
        user_6: secondary,
        user_7: primary,
        user_8: warning,
        user_9: error,
        via_blind_buried: accent,
        via_hole: surface,
        via_micro: primary,
        via_through: warning,
        worksheet: accent,
    },
    schematic: {
        anchor: secondary,
        aux_items: warning,
        background,
        brightened: text,
        bus: info,
        bus_junction: info,
        component_body: surface,
        component_outline: secondary,
        cursor: text,
        erc_error: error.with_alpha(0.8),
        erc_warning: warning.with_alpha(0.8),
        fields: secondary,
        grid,
        grid_axes: primary,
        hidden: grid,
        junction: accent,
        label_global: warning,
        label_hier: success,
        label_local: text,
        netclass_flag: text,
        no_connect: primary,
        note: text,
        pin: success,
        pin_name: success,
        pin_number: accent,
        reference: info,
        rule_area: secondary,
        shadow: text,
        sheet: secondary,
        sheet_background: background,
        sheet_fields: success,
        sheet_filename: accent,
        sheet_label: success,
        sheet_name: info,
        value: info,
        wire: accent,
        worksheet: accent,
    },
};

export default theme;
