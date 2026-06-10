# One-off codegen helper: converts absolute eye SVG path coordinates into
# template literals relative to (cx, cy) for src/components/avatar/Eyes.tsx.
# Run with `python3 scripts/generate-eye-paths.py` and paste the output.
import re

paths = {
  "default": {
    "slit": "M 176 172 C 170 156, 145 154, 132 170 C 142 185, 165 185, 176 172 Z",
    "lash": "M 176 172 C 170 156, 145 154, 132 170 C 126 172, 122 168, 126 163 C 134 150, 148 148, 164 150 C 172 150, 176 160, 176 172 Z",
    "lower": "M 168 180 C 160 185, 146 185, 138 178",
    "crease": "M 172 152 C 164 148, 148 148, 136 156"
  },
  "almond": {
    "slit": "M 180 170 C 170 158, 140 158, 128 168 C 140 180, 165 180, 180 170 Z",
    "lash": "M 180 170 C 170 158, 140 158, 128 168 C 120 170, 116 166, 122 162 C 130 152, 150 152, 170 152 C 178 152, 182 160, 180 170 Z",
    "lower": "M 170 177 C 160 181, 140 181, 134 175",
    "crease": "M 174 154 C 160 150, 140 150, 130 158"
  },
  "cat": {
    "slit": "M 176 174 C 166 158, 146 154, 130 162 C 142 178, 166 182, 176 174 Z",
    "lash": "M 176 174 C 166 158, 146 154, 130 162 C 122 160, 116 152, 122 148 C 134 144, 150 148, 164 152 C 172 154, 176 164, 176 174 Z",
    "lower": "M 166 179 C 156 182, 144 178, 136 170",
    "crease": "M 170 156 C 158 150, 140 146, 130 150"
  },
  "droopy": {
    "slit": "M 178 168 C 168 156, 144 162, 130 176 C 140 188, 166 182, 178 168 Z",
    "lash": "M 178 168 C 168 156, 144 162, 130 176 C 126 182, 122 180, 124 174 C 130 160, 150 152, 166 152 C 174 152, 178 158, 178 168 Z",
    "lower": "M 168 178 C 158 184, 144 186, 136 182",
    "crease": "M 172 154 C 160 148, 140 154, 132 166"
  },
  "sharp": {
    "slit": "M 176 170 C 160 162, 140 160, 130 166 L 154 182 Z",
    "lash": "M 176 170 C 160 162, 140 160, 130 166 L 124 162 L 132 156 L 156 156 L 176 162 Z",
    "lower": "M 166 176 L 154 184 L 140 176",
    "crease": "M 170 158 L 156 152 L 134 154"
  }
}

cx = 156
cy = 175

def convert_coord(match):
    x = int(match.group(1))
    y = int(match.group(2))
    dx = x - cx
    dy = y - cy
    sx = f"${{cx {dx:+}}}" if dx != 0 else f"${{cx}}"
    sy = f"${{cy {dy:+}}}" if dy != 0 else f"${{cy}}"
    # Fix the signs and spaces
    sx = sx.replace(' +', ' + ').replace(' -', ' - ')
    sy = sy.replace(' +', ' + ').replace(' -', ' - ')
    return f"{sx} {sy}"

for name, data in paths.items():
    print(f"        case '{name}':")
    print("          return {")
    for key, path in data.items():
        converted = re.sub(r'(\d+) (\d+)', convert_coord, path)
        print(f"            {key}Path: `{converted}`,")
    print("            scleraRx: 24,")
    print("            scleraRy: 14,")
    print("            scleraCy: cy - 2,")
    print("          };")
